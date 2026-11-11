// MZAZI TECH — panel catalogue shape.
//
// The `packages` table predates the marketplace taxonomy: it has name, price,
// cpu, ram, disk, description, popular and active, but no category and no
// discount. Rather than fork the table (and the admin screen that edits it),
// the two columns the storefront needs are added in place, once per process,
// with defaults that leave every existing row valid.
//
// Classification is a one-time backfill from the copy the row already carries:
// a package that says "Minecraft" is a game panel, one that says "reseller" is
// a reseller panel. Everything else is a Pterodactyl panel, which is what all
// five rows in production actually are today.

let ready = false;

export async function ensurePanelCatalog(sql) {
  if (ready) return;
  try {
    await sql`ALTER TABLE packages ADD COLUMN IF NOT EXISTS category VARCHAR(32) DEFAULT 'pterodactyl'`;
    await sql`ALTER TABLE packages ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0`;

    // Backfill only rows that still carry the default, so an operator's choice
    // made in the admin panel is never overwritten by a deploy.
    await sql`
      UPDATE packages
      SET category = 'game'
      WHERE category IS NULL
         OR (category = 'pterodactyl' AND lower(name || ' ' || coalesce(description, '')) ~ '(game|minecraft|fivem|rust|cs2|ark|samp|ragemp)')
    `;
    await sql`
      UPDATE packages
      SET category = 'reseller'
      WHERE category = 'pterodactyl' AND lower(name || ' ' || coalesce(description, '')) ~ 'reseller'
    `;
    await sql`
      UPDATE packages
      SET category = 'hosting'
      WHERE category = 'pterodactyl' AND lower(name || ' ' || coalesce(description, '')) ~ '(management|hosting|control panel)'
    `;
    await sql`UPDATE packages SET category = 'pterodactyl' WHERE category IS NULL`;

    ready = true;
  } catch (e) {
    // A read-only role would make this fail; the storefront still works with
    // the columns absent because the API falls back to the default category.
    console.error('[catalog] could not ensure columns:', e.message);
  }
}

export const CATEGORIES = [
  { id: 'all', label: 'All panels' },
  { id: 'pterodactyl', label: 'Pterodactyl' },
  { id: 'game', label: 'Game panels' },
  { id: 'hosting', label: 'Hosting management' },
  { id: 'reseller', label: 'Reseller panels' },
];

// What the customer actually pays. Any surface that shows a price must use this
// so the shelf and the debit can never disagree.
export function effectivePrice(pkg) {
  const base = Number(pkg?.price || 0);
  const pct = Number(pkg?.discount_percent || 0);
  if (!Number.isFinite(pct) || pct <= 0 || pct >= 100) return base;
  return Math.ceil(base * (1 - pct / 100));
}
