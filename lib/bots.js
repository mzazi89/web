// MZAZI API — which bots this site can pair into.
//
// Read from the SAME `settings` rows the bots themselves read — `bot_profiles`
// for the QUARTZ platform and `xmd_bot_profiles` for the XMD bot — rather than
// from a list kept here. Two lists would drift, and the morning they disagree
// the site would either offer a bot that cannot serve the request or hide one
// that can. One source of truth, read from both sides.
//
// The parsing mirrors lib/profiles.js on the bot, lib/bots.js on the link site
// and the quartzxd copies, including the fallback, so every side agrees on what
// the primary bot is called.
import { neon } from '@neondatabase/serverless';

// Lazy client, unlike the older pair routes which build one at import time.
// Nothing here should be able to fail before it is actually used.
let _sql = null;
function db() {
  if (!_sql) {
    if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set');
    _sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });
  }
  return _sql;
}

const SETTINGS_KEY = 'bot_profiles';
const NAME_KEY = 'bot_name';

// The XMD bot keeps its own profile list under a namespaced key so the two bots
// cannot overwrite each other's settings. Reading only `bot_profiles` meant the
// site could not see a bot that is demonstrably running: the operator configured
// MZAZI XMD in the XMD card, the bot heartbeats under id `xmd`, and this page
// still said "Only QUARTZ XD is configured". Both keys are read now.
const XMD_SETTINGS_KEY = 'xmd_bot_profiles';
const XMD_NAME_KEY = 'xmd_bot_name';

// Matches the bot's own staticConfig default for botName.
const FALLBACK_NAME = 'QUARTZ XD';
const FALLBACK_ID = 'main';

// Display names the bots themselves ship with. Used for a bot we know about only
// from its heartbeat — nothing in `settings` names it, but it is running.
const KNOWN_NAMES = { xmd: 'MZAZI XMD', quartz: 'QUARTZ XD' };

// The heartbeat is written every ~30s. A row older than this belongs to a bot
// that is no longer running, and must not be offered as if it were configured.
const LIVE_WINDOW_MS = 5 * 60 * 1000;

function parseProfiles(raw) {
  if (!raw) return [];

  let parsed = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      console.warn('[web][bots] bot_profiles is not valid JSON — treating it as unset');
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];

  const cleaned = parsed
    .filter((p) => p && typeof p === 'object')
    .map((p) => ({
      id: String(p.id ?? '').trim(),
      name: String(p.name ?? '').trim(),
    }))
    .filter((p) => p.id && p.name);

  const seen = new Set();
  return cleaned.filter((p) => (seen.has(p.id) ? false : seen.add(p.id)));
}

/** The name to show for a bot the settings do not name. */
function knownName(id, settings) {
  if (id === 'xmd') return String(settings[XMD_NAME_KEY] || '').trim() || KNOWN_NAMES.xmd;
  if (id === 'quartz' || id === 'main') {
    return String(settings[NAME_KEY] || '').trim() || FALLBACK_NAME;
  }
  return String(KNOWN_NAMES[id] || id).toUpperCase();
}

/**
 * Bots that are heartbeating right now but are not in either profile list.
 *
 * A running bot is by definition configured — refusing to pair into it because a
 * settings row is missing or lives under a key we did not read is the bug this
 * exists to prevent. The freshness window keeps a decommissioned bot from
 * reappearing off the row it left behind.
 */
async function liveOnlyProfiles(settings) {
  const out = [];

  try {
    const rows = await db()`
      SELECT bot_id, MAX(last_seen_at) AS last_seen_at
      FROM bot_status
      GROUP BY bot_id
      -- Compared in SQL: the column is UTC wall-clock and the driver would turn
      -- it into a Date in the Node zone, shifting every age by the host offset.
      HAVING MAX(last_seen_at) > NOW() - INTERVAL '5 minutes'
    `;
    for (const row of rows) {
      const id = String(row.bot_id || '').trim();
      if (!id) continue;
      out.push({ id, name: knownName(id, settings) });
    }
  } catch (err) {
    console.warn('[web][bots] could not read bot_status for live bots:', err.message);
  }

  return out;
}

function mergeProfiles(lists) {
  const seen = new Set();
  const out = [];
  for (const list of lists) {
    for (const p of list) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      out.push(p);
    }
  }
  return out;
}

/** The selectable bots, always at least one. Never throws. */
export async function listBots() {
  const settings = {};

  try {
    const rows = await db()`
      SELECT key, value FROM settings
      WHERE key IN ('bot_profiles', 'bot_name', 'xmd_bot_profiles', 'xmd_bot_name')
    `;
    for (const row of rows) settings[row.key] = row.value || '';
  } catch (err) {
    console.warn('[web][bots] could not read the settings table:', err.message);
  }

  // Both profile lists, `bot_profiles` first so it decides the order the site
  // presents bots in; then any bot that is running but unlisted.
  const configured = mergeProfiles([
    parseProfiles(settings[SETTINGS_KEY]),
    parseProfiles(settings[XMD_SETTINGS_KEY]),
  ]);
  const live = await liveOnlyProfiles(settings);
  const bots = mergeProfiles([configured, live]);
  if (bots.length) return bots;

  return [{ id: FALLBACK_ID, name: settings[NAME_KEY] || FALLBACK_NAME }];
}

/** Resolve a caller's requested bot. See the note on `named` below. */
export async function resolveBot(requested) {
  const bots = await listBots();
  const wanted = String(requested || '').trim();

  if (wanted) {
    const found = bots.find((b) => b.id === wanted);
    if (!found) return { ok: false, error: 'That bot is not available.' };
    return { ok: true, bot: found, named: true };
  }

  if (bots.length > 1) {
    return { ok: false, error: 'Choose which bot to link to.' };
  }

  return { ok: true, bot: bots[0], named: false };
}

/** Newest telemetry row for one bot, or null. */
export async function statusFor(botId) {
  try {
    // `online` alone is not "online": the column is whatever the bot last
    // reported, and a bot that died an hour ago still has `online = true` in its
    // final heartbeat. Pairing gates on this, so a dead bot used to accept a
    // request it could never answer and leave the account blocked. The heartbeat
    // window is added here, in SQL, so no JS date parsing is involved.
    const rows = await db()`
      SELECT bot_id, online, version, uptime_seconds, session_numbers, last_seen_at,
             (last_seen_at > NOW() - INTERVAL '5 minutes') AS live
      FROM bot_status
      WHERE bot_id = ${botId}
      ORDER BY last_seen_at DESC
      LIMIT 1
    `;
    if (!rows.length) return null;
    const row = rows[0];
    return { ...row, online: Boolean(row.online) && Boolean(row.live) };
  } catch (err) {
    console.warn('[web][bots] could not read bot_status:', err.message);
    return null;
  }
}

function numbersOf(row) {
  try {
    const parsed = JSON.parse((row && row.session_numbers) || '[]');
    return Array.isArray(parsed) ? parsed.map((n) => String(n)) : [];
  } catch {
    return [];
  }
}

/**
 * Which bot currently holds each paired number.
 *
 * The bot only publishes its session list through `bot_status`, so that is the
 * only place this mapping exists. Without it an unlink would be issued to
 * whichever bot happened to claim the row, which would find no such session and
 * leave the device linked.
 */
export async function deviceBotMap() {
  const map = {};
  try {
    const rows = await db()`
      SELECT bot_id, session_numbers, last_seen_at
      FROM bot_status
      ORDER BY last_seen_at ASC
    `;
    // Ascending, so the NEWEST row for an id wins — a bot that was renamed
    // leaves its old row behind with a stale session list.
    for (const r of rows) {
      for (const n of numbersOf(r)) map[n] = r.bot_id;
    }
  } catch (err) {
    console.warn('[web][bots] could not read bot_status:', err.message);
  }
  return map;
}

/**
 * Numbers the platform has already been told to remove.
 *
 * `bot_status.session_numbers` is a directory listing of `./database/sessions/`
 * that the bot rewrites every ~30s, so it lags a removal twice over:
 *
 *   - a **delete** drops the folder only when the bot next polls (≤15s), and
 *   - an **unlink** keeps the folder on purpose, so the number can stay in the
 *     listing for good even though the device is logged out and its row is
 *     INACTIVE.
 *
 * Treated as "what the bot holds", that listing re-listed a number the user had
 * just removed — the phantom every removal complaint is about. A number counts
 * as gone when the newest control row for it is an `unpair` and no ACTIVE
 * session row is behind it: both the website pairing flow and the bot's own
 * /pair write either a newer `pair` row or an ACTIVE row, so a number that is
 * genuinely brought back is picked up again on the next read.
 *
 * Display only — routing (`resolveBotForNumber`) must keep seeing raw
 * telemetry, or an unlink could be addressed to the wrong bot.
 */
export async function removedNumbers() {
  const gone = new Set();
  let controls = [];
  let rows = [];

  try {
    // Newest first, so the first row seen for a number is its latest control
    // entry. Bounded like `pairHistory()`: a number whose newest row is older
    // than the window is simply not proven removed, which shows a stale row
    // rather than hiding a live one.
    controls = await db()`
      SELECT payload->>'number' AS number, action
      FROM bot_control
      WHERE action IN ('pair', 'unpair')
        AND COALESCE(payload->>'number', '') <> ''
      ORDER BY id DESC
      LIMIT 2000
    `;
  } catch (err) {
    // No control log to read: nothing can be proven removed, so nothing is.
    console.warn('[web][bots] could not read the control log:', err.message);
    return gone;
  }

  try {
    rows = await db()`SELECT "phoneNumber", status FROM "WhatsAppSession"`;
  } catch (err) {
    // Without the session table every unpair would look authoritative; leaving
    // the set empty shows a stale number rather than hiding a live one.
    console.warn('[web][bots] could not read WhatsAppSession:', err.message);
    return gone;
  }

  const active = new Set(
    rows
      .filter((r) => String((r && r.status) || '').toUpperCase() === 'ACTIVE')
      .map((r) => String(r.phoneNumber || '').replace(/\D/g, ''))
  );

  // Descending, so the first row seen for a number is the most recent one — a
  // re-pair after an unpair therefore clears the removal instead of inheriting it.
  const latest = new Map();
  for (const c of controls) {
    const number = String((c && c.number) || '').replace(/\D/g, '');
    if (number && !latest.has(number)) latest.set(number, c.action);
  }
  for (const [number, action] of latest) {
    if (action === 'unpair' && !active.has(number)) gone.add(number);
  }
  return gone;
}

/**
 * `deviceBotMap()` with the removals applied — the map to *display* from.
 * A number the user just deleted is not in it, even if the bot's heartbeat has
 * not caught up yet.
 */
export async function liveDeviceMap() {
  const [map, gone] = await Promise.all([deviceBotMap(), removedNumbers()]);
  const live = {};
  for (const [number, bot] of Object.entries(map)) {
    if (!gone.has(number)) live[number] = bot;
  }
  return live;
}

/** Every bot with live state, for the selector. */
export async function listBotsWithStatus() {
  const bots = await listBots();

  const byId = {};
  try {
    const rows = await db()`
      SELECT bot_id, online, session_numbers, last_seen_at,
             (last_seen_at > NOW() - INTERVAL '5 minutes') AS live
      FROM bot_status
      ORDER BY last_seen_at DESC
    `;
    for (const r of rows) {
      if (!Object.prototype.hasOwnProperty.call(byId, r.bot_id)) byId[r.bot_id] = r;
    }
  } catch (err) {
    console.warn('[web][bots] could not read bot_status:', err.message);
  }

  const withStatus = bots.map((b) => {
    const row = byId[b.id] || null;
    return {
      id: b.id,
      name: b.name,
      // No row means never seen, which is not the same as reporting offline —
      // both mean "cannot serve a pairing now", and `known` says which.
      known: !!row,
      // Same rule as statusFor: a heartbeat older than the window is a bot that
      // stopped, even though its last row still says `online`.
      online: !!(row && row.online && row.live),
      deviceCount: numbersOf(row).length,
    };
  });

  return { bots: withStatus, multiple: withStatus.length > 1 };
}

/**
 * Resolve the bot an action should be issued to for a specific number.
 *
 * Preference order is deliberate:
 *  1. the bot the caller named — they are looking at it,
 *  2. else the bot telemetry says holds this number — the only correct answer
 *     for an unlink,
 *  3. else the single configured bot, untargeted.
 */
export async function resolveBotForNumber(number, requested) {
  const wanted = String(requested || '').trim();
  if (wanted) return resolveBot(wanted);

  const bots = await listBots();

  // With one bot there is nothing to disambiguate, so the row is left untargeted
  // — exactly what this wrote before bots were selectable. Targeting it with the
  // fallback id "main" would look equivalent today and then silently strand the
  // request if bot_profiles is switched on before a bot claims it: a row naming
  // a profile that no longer exists is claimed by nobody.
  if (bots.length === 1) return { ok: true, bot: bots[0], named: false };

  const n = String(number || '').replace(/\D/g, '');
  if (n) {
    const map = await deviceBotMap();
    const owner = map[n];
    if (owner) {
      const found = bots.find((b) => b.id === owner);
      // owner may name a bot no longer in the list; fall through rather than
      // issuing an action to something the settings no longer describe.
      if (found) return { ok: true, bot: found, named: true };
    }
  }

  // Telemetry does not identify the holder — no bot may have reported since the
  // session appeared, or the mapping may predate it. The removal still goes out,
  // untargeted, exactly as it did before bots were selectable: every bot may
  // claim such a row and the one holding the number is the one that can act.
  //
  // Deliberately NOT an error, unlike a pairing. Pairing must name a bot (the
  // code has to come from a specific one), so guessing there is wrong. A removal
  // is safe untargeted, and blocking it because telemetry was thin would deny a
  // legitimate unlink — a worse failure than a claim that does nothing.
  return { ok: true, bot: bots[0], named: false };
}
