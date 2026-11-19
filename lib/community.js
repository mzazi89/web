// ─────────────────────────────────────────────────────────────────────────────
// lib/community.js — the messaging model behind /community.
//
// The old page was one global room: `community_messages`, no recipients, no
// membership, polled every 3s. It is replaced by four tables that behave like a
// chat app rather than a comment thread:
//
//   com_chats      a conversation — either a DM (exactly two members) or a group
//   com_members    who is in it, their role, and up to which message they read
//   com_messages   the messages (soft-deleted, so a receipt never points at
//                  nothing and "This message was deleted" stays in place)
//   com_typing     who is typing right now (a row per person, 6-second TTL)
//   com_presence   last time each person was seen, for the online dot
//
// Read receipts do not need their own table: `com_members.last_read_id` is the
// high-water mark per person, so "read" is a comparison and not a fan-out write.
//
// The main group ("MZAZI Community") is a normal chat with `dm_key='main'`, so
// the founder can keep posting into it from the admin panel without a second
// code path — see app/api/admin/community/messages in the admin repo.
//
// Nothing here is cached across requests except the one-time schema check, and
// every read is scoped by the caller's membership row: a chat you are not in is
// a chat you cannot read, list, or post to.
// ─────────────────────────────────────────────────────────────────────────────
import { randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { neon } from '@neondatabase/serverless';

export const sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: 'no-store' } });

export const MAIN_KEY = 'main';
export const MAIN_TITLE = 'MZAZI Community';
export const MAX_BODY = 4000;
export const MAX_GROUP = 100;

let schemaReady = null;

/** Idempotent schema bootstrap, once per process. */
export function ensureCommunity() {
  if (!schemaReady) {
    schemaReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS com_chats (
          id              SERIAL PRIMARY KEY,
          kind            VARCHAR(8)  NOT NULL DEFAULT 'group',
          title           VARCHAR(120),
          about           VARCHAR(255) DEFAULT '',
          dm_key          VARCHAR(48) UNIQUE,
          is_main         BOOLEAN DEFAULT false,
          created_by      INTEGER,
          created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`ALTER TABLE com_chats ADD COLUMN IF NOT EXISTS is_main BOOLEAN DEFAULT false`;
      // An invite link is a per-group secret. It is created on first use rather
      // than at group creation, so groups that never get shared never carry one.
      await sql`ALTER TABLE com_chats ADD COLUMN IF NOT EXISTS invite_code VARCHAR(32)`;
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS com_chats_invite_idx ON com_chats (invite_code)`;
      await sql`ALTER TABLE com_chats ADD COLUMN IF NOT EXISTS only_admins_can_post BOOLEAN DEFAULT false`;
      await sql`ALTER TABLE com_chats ADD COLUMN IF NOT EXISTS about VARCHAR(255) DEFAULT ''`;

      await sql`
        CREATE TABLE IF NOT EXISTS com_members (
          chat_id      INTEGER NOT NULL,
          user_id      INTEGER NOT NULL,
          role         VARCHAR(10) NOT NULL DEFAULT 'member',
          joined_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_read_id INTEGER DEFAULT 0,
          cleared_id   INTEGER DEFAULT 0,
          muted        BOOLEAN DEFAULT false,
          PRIMARY KEY (chat_id, user_id)
        )
      `;
      await sql`ALTER TABLE com_members ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT false`;
      await sql`CREATE INDEX IF NOT EXISTS com_members_user_idx ON com_members (user_id)`;

      await sql`
        CREATE TABLE IF NOT EXISTS com_messages (
          id          SERIAL PRIMARY KEY,
          chat_id     INTEGER NOT NULL,
          sender_id   INTEGER,
          sender_label VARCHAR(80),
          kind        VARCHAR(10) DEFAULT 'text',
          body        TEXT NOT NULL DEFAULT '',
          reply_to    INTEGER,
          created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          edited_at   TIMESTAMP,
          deleted_at  TIMESTAMP
        )
      `;
      await sql`ALTER TABLE com_messages ADD COLUMN IF NOT EXISTS sender_label VARCHAR(80)`;
      await sql`CREATE INDEX IF NOT EXISTS com_messages_chat_idx ON com_messages (chat_id, id)`;

      await sql`
        CREATE TABLE IF NOT EXISTS com_typing (
          chat_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (chat_id, user_id)
        )
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS com_presence (
          user_id   INTEGER PRIMARY KEY,
          last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // One attachment per message. The bytes live here as base64 for the same
      // reason profile photos and bot files do: there is no bucket in this
      // deployment, and a chat that depends on one would be a chat that loses
      // its history the day the bucket is misconfigured. Rows stay small because
      // the browser re-encodes before upload — see MAX_IMAGE_BYTES below.
      await sql`
        CREATE TABLE IF NOT EXISTS com_media (
          id          SERIAL PRIMARY KEY,
          message_id  INTEGER NOT NULL,
          chat_id     INTEGER NOT NULL,
          kind        VARCHAR(10) NOT NULL,
          mime        VARCHAR(64) NOT NULL,
          bytes       TEXT NOT NULL,
          size_bytes  INTEGER DEFAULT 0,
          width       INTEGER,
          height      INTEGER,
          duration_ms INTEGER,
          created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS com_media_message_idx ON com_media (message_id)`;

      // One reaction per person per message, which is WhatsApp's rule: tapping a
      // second emoji replaces the first rather than stacking.
      await sql`
        CREATE TABLE IF NOT EXISTS com_reactions (
          message_id INTEGER NOT NULL,
          user_id    INTEGER NOT NULL,
          emoji      VARCHAR(16) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (message_id, user_id)
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS com_reactions_message_idx ON com_reactions (message_id)`;

      // "Delete for me" must not touch the row everybody else reads. One row per
      // (message, person) hides it from that person's history and unread count.
      await sql`
        CREATE TABLE IF NOT EXISTS com_message_hides (
          message_id INTEGER NOT NULL,
          user_id    INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (message_id, user_id)
        )
      `;

      // Reports go to the operator, not into the chat. Keeping them in their own
      // table means a report leaves no trace for the person being reported.
      await sql`
        CREATE TABLE IF NOT EXISTS com_reports (
          id           SERIAL PRIMARY KEY,
          message_id   INTEGER NOT NULL,
          chat_id      INTEGER NOT NULL,
          reporter_id  INTEGER NOT NULL,
          reason       VARCHAR(200) NOT NULL,
          note         VARCHAR(500),
          status       VARCHAR(12) NOT NULL DEFAULT 'open',
          created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          resolved_at  TIMESTAMP,
          resolved_by  INTEGER
        )
      `;
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS com_reports_once ON com_reports (message_id, reporter_id)`;
      await sql`CREATE INDEX IF NOT EXISTS com_reports_status_idx ON com_reports (status, created_at DESC)`;

      // The main room. One row, created on first boot, never duplicated.
      await sql`
        INSERT INTO com_chats (kind, title, dm_key, is_main, about)
        SELECT 'group', ${MAIN_TITLE}, ${MAIN_KEY}, true, 'Everyone on MZAZI TECH'
        WHERE NOT EXISTS (SELECT 1 FROM com_chats WHERE dm_key = ${MAIN_KEY})
      `;
    })().catch((e) => {
      schemaReady = null; // a later request retries
      throw e;
    });
  }
  return schemaReady;
}

// ─── identity ────────────────────────────────────────────────────────────────

export function displayName(u) {
  if (!u) return 'Member';
  const full = String(u.fullname || '').trim();
  if (full) return full;
  const pair = `${u.firstname || ''} ${u.lastname || ''}`.trim();
  if (pair) return pair;
  const mail = String(u.email || '').trim();
  if (mail) return mail.split('@')[0];
  return 'Member';
}

/** The signed-in customer, or null. Admin cookies are deliberately not accepted. */
export async function currentUser() {
  const store = await cookies();
  const token = store.get('token');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    const rows = await sql`
      SELECT id, fullname, firstname, lastname, email, avatar_at,
             (avatar IS NOT NULL AND avatar <> '') AS has_photo
      FROM users WHERE id = ${decoded.userId} LIMIT 1
    `;
    const row = rows[0];
    if (!row) return null;
    return {
      id: row.id,
      name: displayName(row),
      photo: row.has_photo ? photoUrl(row.id, row.avatar_at) : null,
    };
  } catch {
    return null;
  }
}

export const touchPresence = (userId) =>
  sql`INSERT INTO com_presence (user_id, last_seen) VALUES (${userId}, NOW())
      ON CONFLICT (user_id) DO UPDATE SET last_seen = NOW()`;

/** Everyone seen in the last 65 seconds, as a Set of ids. */
export async function onlineIds() {
  try {
    const rows = await sql`SELECT user_id FROM com_presence WHERE last_seen > NOW() - INTERVAL '65 seconds'`;
    return new Set(rows.map((r) => r.user_id));
  } catch {
    return new Set();
  }
}

// ─── avatars ─────────────────────────────────────────────────────────────────
// Initials on a deterministic colour, the way WhatsApp falls back when a contact
// has no photo. Colour is derived from the id so it never changes between
// renders, devices or deploys.

const AVATAR_SLOTS = [
  ['#1D4ED8', '#DBEAFE'],
  ['#0369A1', '#E0F2FE'],
  ['#047857', '#D1FAE5'],
  ['#B45309', '#FEF3C7'],
  ['#7C3AED', '#EDE9FE'],
  ['#BE123C', '#FFE4E6'],
  ['#0F766E', '#CCFBF1'],
  ['#4338CA', '#E0E7FF'],
];

export function avatarFor(seed, label) {
  const n = Math.abs(Number(seed) || 0) % AVATAR_SLOTS.length;
  const [ink, tint] = AVATAR_SLOTS[n];
  return { ink, tint, initials: initialsOf(label) };
}

/** The URL for someone's uploaded photo, or null when they have none. */
export function photoUrl(userId, at) {
  if (!userId) return null;
  const stamp = at ? new Date(at).getTime() : 0;
  return `/api/community/avatar/${userId}?v=${stamp}`;
}

export function initialsOf(name) {
  const parts = String(name || '')
    .replace(/[^\p{L}\p{N}\s.]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── chats ───────────────────────────────────────────────────────────────────

export async function mainChatId() {
  const rows = await sql`SELECT id FROM com_chats WHERE dm_key = ${MAIN_KEY} LIMIT 1`;
  return rows[0]?.id || null;
}

/** Everyone who registers is in the main room; joining twice is a no-op. */
export async function joinMain(userId) {
  const id = await mainChatId();
  if (!id) return null;
  await sql`
    INSERT INTO com_members (chat_id, user_id, role) VALUES (${id}, ${userId}, 'member')
    ON CONFLICT (chat_id, user_id) DO NOTHING
  `;
  return id;
}

export async function membership(chatId, userId) {
  const rows = await sql`
    SELECT chat_id, user_id, role, last_read_id, cleared_id, muted
    FROM com_members WHERE chat_id = ${chatId} AND user_id = ${userId} LIMIT 1
  `;
  return rows[0] || null;
}

export async function membersOf(chatId) {
  const [rows, online] = await Promise.all([
    sql`
      SELECT m.user_id, m.role, m.last_read_id, m.cleared_id, m.joined_at,
             u.fullname, u.firstname, u.lastname, u.email,
             u.avatar_at, (u.avatar IS NOT NULL AND u.avatar <> '') AS has_photo
      FROM com_members m LEFT JOIN users u ON u.id = m.user_id
      WHERE m.chat_id = ${chatId}
      ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 ELSE 2 END, m.joined_at ASC
    `,
    onlineIds(),
  ]);
  return rows.map((r) => ({
    id: r.user_id,
    name: displayName(r),
    role: r.role,
    lastRead: Number(r.last_read_id || 0),
    online: online.has(r.user_id),
    avatar: avatarFor(r.user_id, displayName(r)),
    photo: r.has_photo ? photoUrl(r.user_id, r.avatar_at) : null,
    joinedAt: r.joined_at,
  }));
}

/**
 * The chat list for one person: every chat they are in, newest activity first,
 * with the last message, the unread count and — for DMs — the other party.
 */
export async function chatsFor(userId) {
  const rows = await sql`
    SELECT c.id, c.kind, c.title, c.dm_key, c.is_main, c.about, c.created_at, c.last_message_at,
           m.role AS my_role, m.last_read_id, m.cleared_id, m.muted, m.pinned,
           lm.id AS last_id, lm.body AS last_body, lm.kind AS last_kind,
           lm.sender_id AS last_sender, lm.sender_label AS last_label, lm.deleted_at AS last_deleted,
           lu.fullname AS last_fullname, lu.firstname AS last_first, lu.lastname AS last_last, lu.email AS last_email,
           peer.id AS peer_id, peer.fullname AS peer_fullname, peer.firstname AS peer_first,
           peer.lastname AS peer_last, peer.email AS peer_email,
           peer.avatar_at AS peer_avatar_at, peer.has_photo AS peer_has_photo,
           peer.peer_last_read,
           EXISTS (
             SELECT 1 FROM com_presence pr
             WHERE pr.user_id = peer.id AND pr.last_seen > NOW() - INTERVAL '65 seconds'
           ) AS peer_online,
           (SELECT COUNT(*)::int FROM com_members z WHERE z.chat_id = c.id) AS member_count,
           (SELECT COUNT(*)::int FROM com_messages x
              WHERE x.chat_id = c.id
                AND x.id > GREATEST(m.last_read_id, m.cleared_id)
                AND x.deleted_at IS NULL
                AND COALESCE(x.sender_id, 0) <> ${userId}
                AND NOT EXISTS (SELECT 1 FROM com_message_hides h
                                WHERE h.message_id = x.id AND h.user_id = ${userId})) AS unread
    FROM com_chats c
    JOIN com_members m ON m.chat_id = c.id AND m.user_id = ${userId}
    LEFT JOIN LATERAL (
      SELECT x.id, x.body, x.kind, x.sender_id, x.sender_label, x.deleted_at
      FROM com_messages x
      WHERE x.chat_id = c.id
      ORDER BY x.id DESC LIMIT 1
    ) lm ON true
    LEFT JOIN users lu ON lu.id = lm.sender_id
    LEFT JOIN LATERAL (
      SELECT u.id, u.fullname, u.firstname, u.lastname, u.email,
             u.avatar_at, (u.avatar IS NOT NULL AND u.avatar <> '') AS has_photo,
             pm.last_read_id AS peer_last_read
      FROM com_members pm JOIN users u ON u.id = pm.user_id
      WHERE c.kind = 'dm' AND pm.chat_id = c.id AND pm.user_id <> ${userId}
      LIMIT 1
    ) peer ON true
    ORDER BY m.pinned DESC, COALESCE(lm.id, 0) DESC, c.last_message_at DESC
  `;

  return rows
    .filter((r) => {
      // A DM with nothing said yet must appear (that is what "New chat" produces);
      // a DM the user cleared stays hidden until the other side speaks again.
      // The last message is read without the cleared filter on purpose — with it,
      // a cleared chat looks message-less and would come straight back.
      if (r.kind !== 'dm') return true;
      const last = Number(r.last_id || 0);
      if (!last) return true;
      return last > Number(r.cleared_id || 0);
    })
    .map((r) => {
      const peer = r.kind === 'dm'
        ? { id: r.peer_id, name: displayName({ fullname: r.peer_fullname, firstname: r.peer_first, lastname: r.peer_last, email: r.peer_email }) }
        : null;
      const title = r.kind === 'dm' ? peer?.name || 'Direct message' : r.title || 'Group';
      const senderName = r.last_label || (r.last_sender
        ? displayName({ fullname: r.last_fullname, firstname: r.last_first, lastname: r.last_last, email: r.last_email })
        : null);

      // An attachment has no body of its own, so the preview names it instead of
      // showing an empty line; a caption is appended when there is one.
      const attach = r.last_kind === 'image' ? '📷 Photo'
        : r.last_kind === 'audio' ? '🎙 Voice note'
        : null;
      const text = attach
        ? (r.last_body ? `${attach} · ${r.last_body}` : attach)
        : r.last_body || '';

      let preview = '';
      if (r.last_id) {
        if (r.last_deleted) preview = 'Message deleted';
        else if (r.last_kind === 'system') preview = r.last_body || '';
        else if (r.kind === 'dm') preview = (r.last_sender === userId ? 'You: ' : '') + text;
        else preview = `${r.last_sender === userId ? 'You' : senderName || 'Member'}: ${text}`;
      }

      return {
        id: r.id,
        kind: r.kind,
        isMain: !!r.is_main,
        title,
        about: r.about || '',
        peerId: peer?.id || null,
        photo: r.kind === 'dm' && r.peer_has_photo ? photoUrl(r.peer_id, r.peer_avatar_at) : null,
        online: r.kind === 'dm' ? !!r.peer_online : false,
        myRole: r.my_role,
        memberCount: Number(r.member_count || 0),
        unread: Number(r.unread || 0),
        pinned: !!r.pinned,
        // A DM shows ticks on your own last message only when the other side has
        // read up to it; a group needs every member, which is not worth a query.
        lastRead: r.kind === 'dm'
          ? Number(r.peer_last_read || 0) >= Number(r.last_id || 0) && Number(r.last_id || 0) > 0
          : false,
        lastAt: r.last_id ? r.last_message_at : null,
        preview,
        previewKind: r.last_kind,
        previewMine: r.last_sender === userId,
        avatar: avatarFor(r.kind === 'dm' ? peer?.id : r.id, title),
      };
    });
}

export function shapeMessage(row, { meId, members = [], media = null, reactions = [] } = {}) {
  const others = members.filter((m) => m.id !== meId);
  const readBy = row.sender_id && row.sender_id === meId
    ? others.filter((m) => m.lastRead >= row.id).length
    : 0;

  // Reactions arrive flat (one row per person). Group them so the bubble can show
  // "👍 3" once instead of three identical chips.
  const grouped = [];
  for (const r of reactions) {
    const hit = grouped.find((g) => g.emoji === r.emoji);
    if (hit) {
      hit.count += 1;
      if (r.user_id === meId) hit.mine = true;
    } else {
      grouped.push({ emoji: r.emoji, count: 1, mine: r.user_id === meId });
    }
  }
  grouped.sort((a, b) => b.count - a.count);

  const replyKind = row.reply_kind || null;
  const replyBody = row.reply_deleted ? ''
    : replyKind === 'image' ? '📷 Photo'
    : replyKind === 'audio' ? '🎙 Voice note'
    : String(row.reply_body || '').slice(0, 160);

  return {
    id: row.id,
    chatId: row.chat_id,
    senderId: row.sender_id,
    senderName: row.sender_label
      || displayName({ fullname: row.sender_name, firstname: row.sender_first, lastname: row.sender_last, email: row.sender_email }),
    senderAvatar: avatarFor(row.sender_id || row.chat_id, row.sender_label || row.sender_name || 'M'),
    senderPhoto: row.sender_has_photo ? photoUrl(row.sender_id, row.sender_avatar_at) : null,
    body: row.deleted_at ? '' : row.body,
    kind: row.kind || 'text',
    deleted: !!row.deleted_at,
    edited: !!row.edited_at,
    mine: row.sender_id === meId,
    media: media
      ? {
          kind: media.kind,
          mime: media.mime,
          width: media.width || null,
          height: media.height || null,
          durationMs: media.duration_ms || 0,
          size: media.size_bytes || 0,
          url: `/api/community/media/${row.id}`,
        }
      : null,
    reactions: grouped,
    replyTo: row.reply_to || null,
    reply: row.reply_to
      ? {
          id: row.reply_to,
          name: row.reply_label
            || displayName({ fullname: row.reply_name, firstname: row.reply_first, lastname: row.reply_last, email: row.reply_email }),
          body: replyBody,
          deleted: !!row.reply_deleted,
        }
      : null,
    createdAt: row.created_at,
    readBy,
    status: readBy > 0 ? 'read' : 'sent',
  };
}

/**
 * Shape a page of rows with their attachments and reactions in two batched
 * queries instead of two per message. Without this, an 80-message page would be
 * 160 round trips to Neon.
 */
export async function shapeMany(rows, { meId, members = [] } = {}) {
  if (!rows.length) return [];
  const ids = rows.map((r) => r.id);

  const [media, reactions] = await Promise.all([
    sql`SELECT message_id, kind, mime, width, height, duration_ms, size_bytes
        FROM com_media WHERE message_id = ANY(${ids}::int[])`,
    sql`SELECT message_id, user_id, emoji FROM com_reactions WHERE message_id = ANY(${ids}::int[])`,
  ]);

  const mediaBy = new Map(media.map((m) => [m.message_id, m]));
  const reactionsBy = new Map();
  for (const r of reactions) {
    const list = reactionsBy.get(r.message_id);
    if (list) list.push(r);
    else reactionsBy.set(r.message_id, [r]);
  }

  return rows.map((row) => shapeMessage(row, {
    meId,
    members,
    media: mediaBy.get(row.id) || null,
    reactions: reactionsBy.get(row.id) || [],
  }));
}

// The neon driver bundled here only exposes the tagged template (no .query), so
// each of these three reads carries its own full statement rather than sharing a
// fragment. It is a little repetitive; it is also the only version that runs.
export async function messagesIn(chatId, { after = 0, before = 0, limit = 200, viewerId = 0 } = {}) {
  if (before) {
    const rows = await sql`
      SELECT x.id, x.chat_id, x.sender_id, x.sender_label, x.kind, x.body, x.reply_to,
             x.created_at, x.deleted_at, x.edited_at,
             u.fullname AS sender_name, u.firstname AS sender_first, u.lastname AS sender_last,
             u.email AS sender_email, u.avatar_at AS sender_avatar_at,
             (u.avatar IS NOT NULL AND u.avatar <> '') AS sender_has_photo,
             r.kind AS reply_kind, r.body AS reply_body, r.deleted_at AS reply_deleted,
             r.sender_label AS reply_label,
             ru.fullname AS reply_name, ru.firstname AS reply_first, ru.lastname AS reply_last,
             ru.email AS reply_email
      FROM com_messages x
      LEFT JOIN users u ON u.id = x.sender_id
      LEFT JOIN com_messages r ON r.id = x.reply_to
      LEFT JOIN users ru ON ru.id = r.sender_id
      WHERE x.chat_id = ${chatId} AND x.id < ${before}
        AND (${viewerId} = 0 OR NOT EXISTS (
          SELECT 1 FROM com_message_hides h WHERE h.message_id = x.id AND h.user_id = ${viewerId}
        ))
      ORDER BY x.id DESC
      LIMIT ${limit}
    `;
    return rows.reverse();
  }
  return sql`
    SELECT x.id, x.chat_id, x.sender_id, x.sender_label, x.kind, x.body, x.reply_to,
           x.created_at, x.deleted_at, x.edited_at,
           u.fullname AS sender_name, u.firstname AS sender_first, u.lastname AS sender_last,
           u.email AS sender_email, u.avatar_at AS sender_avatar_at,
           (u.avatar IS NOT NULL AND u.avatar <> '') AS sender_has_photo,
           r.kind AS reply_kind, r.body AS reply_body, r.deleted_at AS reply_deleted,
           r.sender_label AS reply_label,
           ru.fullname AS reply_name, ru.firstname AS reply_first, ru.lastname AS reply_last,
           ru.email AS reply_email
    FROM com_messages x
    LEFT JOIN users u ON u.id = x.sender_id
    LEFT JOIN com_messages r ON r.id = x.reply_to
    LEFT JOIN users ru ON ru.id = r.sender_id
    WHERE x.chat_id = ${chatId} AND x.id > ${after}
      AND (${viewerId} = 0 OR NOT EXISTS (
        SELECT 1 FROM com_message_hides h WHERE h.message_id = x.id AND h.user_id = ${viewerId}
      ))
    ORDER BY x.id ASC
    LIMIT ${limit}
  `;
}

/** One message in the same shape the list uses. */
export async function messageById(id) {
  const rows = await sql`
    SELECT x.id, x.chat_id, x.sender_id, x.sender_label, x.kind, x.body, x.reply_to,
           x.created_at, x.deleted_at, x.edited_at,
           u.fullname AS sender_name, u.firstname AS sender_first, u.lastname AS sender_last,
           u.email AS sender_email, u.avatar_at AS sender_avatar_at,
           (u.avatar IS NOT NULL AND u.avatar <> '') AS sender_has_photo,
           r.kind AS reply_kind, r.body AS reply_body, r.deleted_at AS reply_deleted,
           r.sender_label AS reply_label,
           ru.fullname AS reply_name, ru.firstname AS reply_first, ru.lastname AS reply_last,
           ru.email AS reply_email
    FROM com_messages x
    LEFT JOIN users u ON u.id = x.sender_id
    LEFT JOIN com_messages r ON r.id = x.reply_to
    LEFT JOIN users ru ON ru.id = r.sender_id
    WHERE x.id = ${id}
    LIMIT 1
  `;
  return rows[0] || null;
}

// ─── attachments ─────────────────────────────────────────────────────────────

/** Attach bytes to a message. One attachment per message, by unique index. */
export async function attachMedia({ messageId, chatId, kind, mime, bytes, size, width = null, height = null, durationMs = null }) {
  await sql`
    INSERT INTO com_media (message_id, chat_id, kind, mime, bytes, size_bytes, width, height, duration_ms)
    VALUES (${messageId}, ${chatId}, ${kind}, ${mime}, ${bytes}, ${size}, ${width}, ${height}, ${durationMs})
    ON CONFLICT (message_id) DO NOTHING
  `;
}

export async function mediaRow(messageId) {
  const rows = await sql`
    SELECT message_id, chat_id, kind, mime, bytes, size_bytes, width, height, duration_ms
    FROM com_media WHERE message_id = ${messageId} LIMIT 1
  `;
  return rows[0] || null;
}

// ─── reactions ───────────────────────────────────────────────────────────────

export async function reactionsFor(messageId) {
  return sql`SELECT message_id, user_id, emoji FROM com_reactions WHERE message_id = ${messageId}`;
}

/**
 * Toggle one person's reaction to one message.
 *
 * Same emoji again removes it; a different emoji replaces the old one. That is
 * the WhatsApp rule and it keeps the table at one row per (message, person), so
 * a burst of taps can never stack up into a wall of chips.
 */
export async function toggleReaction(messageId, userId, emoji) {
  const rows = await sql`
    SELECT emoji FROM com_reactions WHERE message_id = ${messageId} AND user_id = ${userId} LIMIT 1
  `;
  const current = rows[0]?.emoji || null;

  if (current === emoji) {
    await sql`DELETE FROM com_reactions WHERE message_id = ${messageId} AND user_id = ${userId}`;
    return { removed: true };
  }

  await sql`
    INSERT INTO com_reactions (message_id, user_id, emoji) VALUES (${messageId}, ${userId}, ${emoji})
    ON CONFLICT (message_id, user_id) DO UPDATE SET emoji = EXCLUDED.emoji, created_at = NOW()
  `;
  return { removed: false };
}

export async function setPinned(chatId, userId, pinned) {
  await sql`UPDATE com_members SET pinned = ${!!pinned} WHERE chat_id = ${chatId} AND user_id = ${userId}`;
}

/** Photos and voice notes already sent in a chat, newest first — the Media tab. */
export async function mediaIn(chatId, limit = 60) {
  const rows = await sql`
    SELECT md.message_id, md.kind, md.mime, md.width, md.height, md.duration_ms, md.size_bytes,
           x.created_at, x.sender_id, x.deleted_at
    FROM com_media md JOIN com_messages x ON x.id = md.message_id
    WHERE md.chat_id = ${chatId} AND x.deleted_at IS NULL
    ORDER BY md.message_id DESC
    LIMIT ${limit}
  `;
  return rows.map((r) => ({
    id: r.message_id,
    kind: r.kind,
    mime: r.mime,
    width: r.width,
    height: r.height,
    durationMs: r.duration_ms,
    size: r.size_bytes,
    createdAt: r.created_at,
    senderId: r.sender_id,
    url: `/api/community/media/${r.message_id}`,
  }));
}

/** Groups the two people are both in — the "X groups in common" line. */
export async function sharedGroups(meId, peerId) {
  const rows = await sql`
    SELECT COUNT(*)::int AS c
    FROM com_members a
    JOIN com_members b ON b.chat_id = a.chat_id AND b.user_id = ${peerId}
    JOIN com_chats c ON c.id = a.chat_id AND c.kind = 'group'
    WHERE a.user_id = ${meId}
  `;
  return Number(rows[0]?.c || 0);
}

/** "Delete for me": the row stays for everyone else. */
export async function hideForUser(messageId, userId) {
  await sql`
    INSERT INTO com_message_hides (message_id, user_id) VALUES (${messageId}, ${userId})
    ON CONFLICT DO NOTHING
  `;
}

/** "Delete for everyone": soft delete, so quotes and receipts still resolve. */
export async function deleteForEveryone(messageId) {
  await sql`UPDATE com_messages SET deleted_at = NOW(), body = '' WHERE id = ${messageId}`;
}

/** Edit your own text. Media messages are refused by the caller. */
export async function editMessage(messageId, body) {
  const rows = await sql`
    UPDATE com_messages SET body = ${body}, edited_at = NOW()
    WHERE id = ${messageId} AND deleted_at IS NULL
    RETURNING id
  `;
  return Boolean(rows[0]);
}

export async function reportMessage({ messageId, chatId, reporterId, reason, note }) {
  const rows = await sql`
    INSERT INTO com_reports (message_id, chat_id, reporter_id, reason, note)
    VALUES (${messageId}, ${chatId}, ${reporterId}, ${reason}, ${note})
    ON CONFLICT (message_id, reporter_id) DO NOTHING
    RETURNING id
  `;
  return rows[0]?.id || null;
}

export async function reportsFor(status = 'open') {
  return sql`
    SELECT r.id, r.message_id, r.chat_id, r.reason, r.note, r.status, r.created_at,
           x.body AS message_body, x.kind, x.deleted_at, x.sender_id,
           u.email AS reporter_email, u.fullname AS reporter_name,
           s.email AS sender_email, s.fullname AS sender_name,
           c.title AS chat_title, c.kind AS chat_kind
    FROM com_reports r
    LEFT JOIN com_messages x ON x.id = r.message_id
    LEFT JOIN users u ON u.id = r.reporter_id
    LEFT JOIN users s ON s.id = x.sender_id
    LEFT JOIN com_chats c ON c.id = r.chat_id
    WHERE (${status} = 'all' OR r.status = ${status})
    ORDER BY r.id DESC
    LIMIT 200
  `;
}

export async function typingIn(chatId, meId) {
  try {
    const rows = await sql`
      SELECT t.user_id, u.fullname, u.firstname, u.lastname, u.email
      FROM com_typing t LEFT JOIN users u ON u.id = t.user_id
      WHERE t.chat_id = ${chatId}
        AND t.user_id <> ${meId}
        AND t.at > NOW() - INTERVAL '6 seconds'
      LIMIT 5
    `;
    return rows.map((r) => displayName(r));
  } catch {
    return [];
  }
}

/** Insert a message and move the chat to the top. Returns the raw row. */
export async function postMessage(chatId, { senderId = null, senderLabel = null, kind = 'text', body, replyTo = null }) {
  const rows = await sql`
    INSERT INTO com_messages (chat_id, sender_id, sender_label, kind, body, reply_to)
    VALUES (${chatId}, ${senderId}, ${senderLabel}, ${kind}, ${body}, ${replyTo})
    RETURNING *
  `;
  await sql`UPDATE com_chats SET last_message_at = NOW() WHERE id = ${chatId}`;
  if (senderId) {
    await sql`DELETE FROM com_typing WHERE chat_id = ${chatId} AND user_id = ${senderId}`;
  }
  return rows[0];
}

export async function systemNote(chatId, body) {
  const row = await postMessage(chatId, { kind: 'system', body });
  return row;
}

/** DM chat id for two people, created on demand. */
export async function dmWith(meId, peerId) {
  const a = Math.min(meId, peerId);
  const b = Math.max(meId, peerId);
  const key = `dm:${a}:${b}`;

  const existing = await sql`SELECT id FROM com_chats WHERE dm_key = ${key} LIMIT 1`;
  if (existing[0]) {
    // Re-appearing after a "delete chat": make sure both sides are members again.
    await sql`INSERT INTO com_members (chat_id, user_id, role) VALUES (${existing[0].id}, ${meId}, 'member') ON CONFLICT DO NOTHING`;
    await sql`INSERT INTO com_members (chat_id, user_id, role) VALUES (${existing[0].id}, ${peerId}, 'member') ON CONFLICT DO NOTHING`;
    return existing[0].id;
  }

  const rows = await sql`
    INSERT INTO com_chats (kind, title, dm_key, created_by)
    VALUES ('dm', NULL, ${key}, ${meId})
    ON CONFLICT (dm_key) DO UPDATE SET dm_key = EXCLUDED.dm_key
    RETURNING id
  `;
  const id = rows[0].id;
  await sql`INSERT INTO com_members (chat_id, user_id, role) VALUES (${id}, ${meId}, 'member') ON CONFLICT DO NOTHING`;
  await sql`INSERT INTO com_members (chat_id, user_id, role) VALUES (${id}, ${peerId}, 'member') ON CONFLICT DO NOTHING`;
  return id;
}

// ─── invite links ────────────────────────────────────────────────────────────

/**
 * A link is a bearer token for a group: anyone holding it can join. That is why
 * it is 12 characters of base64url from the CSPRNG rather than a guessable slug,
 * why it can be reset, and why joining is a deliberate POST — a link preview
 * must never add a member by itself.
 */
export async function ensureInvite(chatId) {
  const rows = await sql`SELECT invite_code FROM com_chats WHERE id = ${chatId} LIMIT 1`;
  if (rows[0]?.invite_code) return rows[0].invite_code;

  const code = randomBytes(9).toString('base64url');
  const updated = await sql`
    UPDATE com_chats SET invite_code = ${code}
    WHERE id = ${chatId} AND invite_code IS NULL
    RETURNING invite_code
  `;
  if (updated[0]) return updated[0].invite_code;

  // Lost the race with another request: use whatever landed first.
  const again = await sql`SELECT invite_code FROM com_chats WHERE id = ${chatId} LIMIT 1`;
  return again[0]?.invite_code || null;
}

/** Replaces the code, which is how a leaked link is switched off. */
export async function resetInvite(chatId) {
  const code = randomBytes(9).toString('base64url');
  await sql`UPDATE com_chats SET invite_code = ${code} WHERE id = ${chatId}`;
  return code;
}

export async function chatByInvite(code) {
  const rows = await sql`
    SELECT id, kind, title, is_main FROM com_chats
    WHERE invite_code = ${code} AND kind = 'group' LIMIT 1
  `;
  return rows[0] || null;
}

export async function joinChat(chatId, userId, note) {
  const inserted = await sql`
    INSERT INTO com_members (chat_id, user_id, role) VALUES (${chatId}, ${userId}, 'member')
    ON CONFLICT (chat_id, user_id) DO NOTHING
    RETURNING user_id
  `;
  if (inserted[0] && note) await systemNote(chatId, note);
  return Boolean(inserted[0]);
}

// ─── roles ───────────────────────────────────────────────────────────────────

/**
 * Promote or demote one member. The owner is never a target: a group must always
 * have somebody who can manage it, and WhatsApp has no "remove the owner" either.
 */
export async function setMemberRole(chatId, userId, role) {
  const allowed = role === 'admin' ? 'admin' : 'member';
  const rows = await sql`
    UPDATE com_members SET role = ${allowed}
    WHERE chat_id = ${chatId} AND user_id = ${userId} AND role <> 'owner'
    RETURNING user_id
  `;
  return Boolean(rows[0]);
}

export function cleanBody(value, max = MAX_BODY) {
  return String(value == null ? '' : value).replace(/\u0000/g, '').trim().slice(0, max);
}

export function asInt(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}
