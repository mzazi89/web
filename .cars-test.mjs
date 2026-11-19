// lib/cars.js
import { neon } from "@neondatabase/serverless";
var sql = neon(process.env.DATABASE_URL, { fetchOptions: { cache: "no-store" } });
var MAX_IMAGES = 8;
var MAX_IMAGE_BYTES = 18e5;
var BODY_TYPES = ["Pickup", "Light Truck", "Heavy Truck", "Prime Mover", "Tipper Truck", "Van", "Bus", "SUV", "Tractor"];
var CONDITIONS = ["Brand new", "Foreign used", "Locally used", "Refurbished"];
var FUELS = ["Diesel", "Petrol", "Electric", "Hybrid"];
var TRANSMISSIONS = ["Manual", "Automatic"];
var STATUSES = ["draft", "published", "sold"];
var DEALER = {
  company: "Golden Lion Motor Co. Limited",
  brand: "FOTON",
  tagline: "Commercial vehicles built to work."
};
var ready = null;
function ensureCars() {
  if (!ready) {
    ready = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS cars (
          id           SERIAL PRIMARY KEY,
          slug         VARCHAR(140) UNIQUE NOT NULL,
          title        VARCHAR(160) NOT NULL,
          model        VARCHAR(80),
          body         VARCHAR(40),
          year         INTEGER,
          price_kes    BIGINT,
          negotiable   BOOLEAN DEFAULT true,
          mileage_km   INTEGER,
          fuel         VARCHAR(30),
          transmission VARCHAR(30),
          drive        VARCHAR(20),
          engine       VARCHAR(80),
          seats        INTEGER,
          payload_kg   INTEGER,
          color        VARCHAR(40),
          condition    VARCHAR(40),
          description  TEXT,
          features     TEXT[] DEFAULT '{}',
          status       VARCHAR(12) NOT NULL DEFAULT 'draft',
          featured     BOOLEAN DEFAULT false,
          views        INTEGER DEFAULT 0,
          created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`ALTER TABLE cars ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'KES'`;
      await sql`ALTER TABLE cars ADD COLUMN IF NOT EXISTS specs JSONB DEFAULT '[]'::jsonb`;
      await sql`CREATE INDEX IF NOT EXISTS cars_status_idx ON cars (status, created_at DESC)`;
      await sql`
        CREATE TABLE IF NOT EXISTS car_images (
          id         SERIAL PRIMARY KEY,
          car_id     INTEGER NOT NULL REFERENCES cars(id) ON DELETE CASCADE,
          mime       VARCHAR(40) NOT NULL,
          bytes      TEXT NOT NULL,
          size_bytes INTEGER DEFAULT 0,
          position   INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;
      await sql`CREATE INDEX IF NOT EXISTS car_images_car_idx ON car_images (car_id, position)`;
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}
var clean = (v, max = 200) => String(v ?? "").replace(/\u0000/g, "").trim().slice(0, max);
var int = (v) => {
  const n = Number(String(v ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : null;
};
function slugify(input) {
  return String(input || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}
async function uniqueSlug(base, exceptId = null) {
  const root = slugify(base) || `vehicle-${Date.now().toString(36)}`;
  let candidate = root;
  for (let i = 2; i < 50; i += 1) {
    const clash = exceptId ? await sql`SELECT id FROM cars WHERE slug = ${candidate} AND id <> ${exceptId} LIMIT 1` : await sql`SELECT id FROM cars WHERE slug = ${candidate} LIMIT 1`;
    if (!clash[0]) return candidate;
    candidate = `${root}-${i}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}
var money = (n, currency = "KES") => n == null ? "Price on request" : `${currency} ${Number(n).toLocaleString("en-KE")}`;
var spec = (car) => [
  { label: "Body", value: car.body },
  { label: "Year", value: car.year },
  { label: "Engine", value: car.engine },
  { label: "Fuel", value: car.fuel },
  { label: "Transmission", value: car.transmission },
  { label: "Drive", value: car.drive },
  { label: "Mileage", value: car.mileage_km != null ? `${Number(car.mileage_km).toLocaleString("en-KE")} km` : null },
  { label: "Seats", value: car.seats },
  { label: "Payload", value: car.payload_kg != null ? `${Number(car.payload_kg).toLocaleString("en-KE")} kg` : null },
  { label: "Colour", value: car.color },
  { label: "Condition", value: car.condition },
  ...Array.isArray(car.specs) ? car.specs : []
].filter((s) => s && s.value !== null && s.value !== void 0 && s.value !== "");
async function dealerContact() {
  await ensureCars();
  let map = {};
  try {
    const rows = await sql`
      SELECT key, value FROM settings
      WHERE key IN ('cars_phone', 'cars_whatsapp', 'cars_address', 'cars_hours')
    `;
    map = Object.fromEntries(rows.map((r) => [r.key, String(r.value || "")]));
  } catch {
  }
  const phone = (map.cars_phone || process.env.CARS_PHONE || "").trim();
  const whatsapp = (map.cars_whatsapp || process.env.CARS_WHATSAPP || phone).trim();
  return {
    phone,
    whatsapp,
    address: (map.cars_address || "").trim(),
    hours: (map.cars_hours || "").trim()
  };
}
async function listCars({ body = "", q = "", sort = "newest", limit = 60 } = {}) {
  await ensureCars();
  const bodyFilter = BODY_TYPES.includes(body) ? body : "";
  const term = clean(q, 60);
  return sql`
    SELECT c.id, c.slug, c.title, c.model, c.body, c.year, c.price_kes, c.currency, c.negotiable,
           c.mileage_km, c.fuel, c.transmission, c.drive, c.seats, c.payload_kg,
           c.color, c.condition, c.status, c.featured, c.created_at,
           (SELECT i.id FROM car_images i WHERE i.car_id = c.id ORDER BY i.position, i.id LIMIT 1) AS cover_id,
           (SELECT COUNT(*)::int FROM car_images i WHERE i.car_id = c.id) AS image_count
    FROM cars c
    WHERE c.status IN ('published', 'sold')
      AND (${bodyFilter} = '' OR c.body = ${bodyFilter})
      AND (${term} = '' OR c.title ILIKE '%' || ${term} || '%'
           OR COALESCE(c.model, '') ILIKE '%' || ${term} || '%'
           OR COALESCE(c.body, '') ILIKE '%' || ${term} || '%')
    ORDER BY
      (c.status = 'sold') ASC,
      CASE WHEN ${sort} = 'price_asc' THEN c.price_kes END ASC NULLS LAST,
      CASE WHEN ${sort} = 'price_desc' THEN c.price_kes END DESC NULLS LAST,
      c.featured DESC,
      c.created_at DESC
    LIMIT ${Math.min(Number(limit) || 60, 120)}
  `;
}
async function carBySlug(slug) {
  await ensureCars();
  const rows = await sql`
    SELECT * FROM cars WHERE slug = ${String(slug || "")} AND status IN ('published', 'sold') LIMIT 1
  `;
  const car = rows[0];
  if (!car) return null;
  const images = await sql`
    SELECT id, mime, size_bytes, position FROM car_images WHERE car_id = ${car.id} ORDER BY position, id
  `;
  return { ...car, images };
}
async function carById(id) {
  await ensureCars();
  const rows = await sql`SELECT * FROM cars WHERE id = ${Number(id)} LIMIT 1`;
  return rows[0] || null;
}
async function bumpViews(id) {
  try {
    await sql`UPDATE cars SET views = views + 1 WHERE id = ${Number(id)}`;
  } catch {
  }
}
async function bodiesInStock() {
  await ensureCars();
  const rows = await sql`
    SELECT body, COUNT(*)::int AS c FROM cars
    WHERE status IN ('published', 'sold') AND body IS NOT NULL
    GROUP BY body ORDER BY c DESC
  `;
  return rows.filter((r) => r.body);
}
async function saveCar(input, { id = null } = {}) {
  await ensureCars();
  const title = clean(input.title, 160);
  if (title.length < 3) throw new Error("Give the vehicle a title");
  const body = BODY_TYPES.includes(input.body) ? input.body : null;
  const status = STATUSES.includes(input.status) ? input.status : "draft";
  const features = Array.isArray(input.features) ? input.features.map((f) => clean(f, 60)).filter(Boolean).slice(0, 24) : String(input.features || "").split("\n").map((f) => clean(f, 60)).filter(Boolean).slice(0, 24);
  const price = int(input.price_kes);
  const values = {
    title,
    model: clean(input.model, 80) || null,
    body,
    year: int(input.year) || null,
    price_kes: price != null && price > 0 ? price : null,
    negotiable: input.negotiable === void 0 ? true : Boolean(input.negotiable),
    mileage_km: int(input.mileage_km) ?? null,
    fuel: FUELS.includes(input.fuel) ? input.fuel : null,
    transmission: TRANSMISSIONS.includes(input.transmission) ? input.transmission : null,
    drive: clean(input.drive, 20) || null,
    engine: clean(input.engine, 80) || null,
    seats: int(input.seats) || null,
    payload_kg: int(input.payload_kg) || null,
    color: clean(input.color, 40) || null,
    condition: CONDITIONS.includes(input.condition) ? input.condition : null,
    description: clean(input.description, 6e3) || null,
    features,
    status,
    currency: ["KES", "USD"].includes(String(input.currency || "").toUpperCase()) ? String(input.currency).toUpperCase() : "KES",
    specs: Array.isArray(input.specs) ? input.specs.filter((r) => r && r.label && r.value).map((r) => ({ label: clean(r.label, 60), value: clean(r.value, 120) })).slice(0, 30) : String(input.specs || "").split("\n").map((line) => {
      const idx = line.indexOf(":");
      if (idx === -1) return null;
      const label = clean(line.slice(0, idx), 60);
      const value = clean(line.slice(idx + 1), 120);
      return label && value ? { label, value } : null;
    }).filter(Boolean).slice(0, 30),
    featured: Boolean(input.featured)
  };
  if (id) {
    const slug2 = input.slug ? await uniqueSlug(input.slug, id) : await uniqueSlug(values.title, id);
    const rows2 = await sql`
      UPDATE cars SET
        slug = ${slug2}, title = ${values.title}, model = ${values.model}, body = ${values.body},
        year = ${values.year}, price_kes = ${values.price_kes}, negotiable = ${values.negotiable},
        mileage_km = ${values.mileage_km}, fuel = ${values.fuel}, transmission = ${values.transmission},
        drive = ${values.drive}, engine = ${values.engine}, seats = ${values.seats},
        payload_kg = ${values.payload_kg}, color = ${values.color}, condition = ${values.condition},
        description = ${values.description}, features = ${values.features}::text[], status = ${values.status},
        currency = ${values.currency}, specs = ${JSON.stringify(values.specs)}::jsonb,
        featured = ${values.featured}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
    return rows2[0] || null;
  }
  const slug = await uniqueSlug(input.slug || values.title);
  const rows = await sql`
    INSERT INTO cars
      (slug, title, model, body, year, price_kes, negotiable, mileage_km, fuel, transmission,
       drive, engine, seats, payload_kg, color, condition, description, features, status,
       currency, specs, featured)
    VALUES
      (${slug}, ${values.title}, ${values.model}, ${values.body}, ${values.year}, ${values.price_kes},
       ${values.negotiable}, ${values.mileage_km}, ${values.fuel}, ${values.transmission},
       ${values.drive}, ${values.engine}, ${values.seats}, ${values.payload_kg}, ${values.color},
       ${values.condition}, ${values.description}, ${values.features}::text[], ${values.status},
       ${values.currency}, ${JSON.stringify(values.specs)}::jsonb, ${values.featured})
    RETURNING *
  `;
  return rows[0];
}
async function deleteCar(id) {
  await sql`DELETE FROM car_images WHERE car_id = ${Number(id)}`;
  await sql`DELETE FROM cars WHERE id = ${Number(id)}`;
}
async function addImage(carId, { mime, bytes, size }) {
  const count = await sql`SELECT COUNT(*)::int AS c FROM car_images WHERE car_id = ${Number(carId)}`;
  if (Number(count[0]?.c || 0) >= MAX_IMAGES) {
    throw new Error(`A listing can hold ${MAX_IMAGES} photos`);
  }
  const pos = await sql`SELECT COALESCE(MAX(position), -1) + 1 AS p FROM car_images WHERE car_id = ${Number(carId)}`;
  const rows = await sql`
    INSERT INTO car_images (car_id, mime, bytes, size_bytes, position)
    VALUES (${Number(carId)}, ${mime}, ${bytes}, ${size}, ${Number(pos[0]?.p || 0)})
    RETURNING id, mime, size_bytes, position
  `;
  await sql`UPDATE cars SET updated_at = NOW() WHERE id = ${Number(carId)}`;
  return rows[0];
}
async function removeImage(carId, imageId) {
  await sql`DELETE FROM car_images WHERE id = ${Number(imageId)} AND car_id = ${Number(carId)}`;
}
async function reorderImages(carId, ids) {
  const list = Array.isArray(ids) ? ids.map(Number).filter(Boolean) : [];
  for (const [index, imageId] of list.entries()) {
    await sql`UPDATE car_images SET position = ${index} WHERE id = ${imageId} AND car_id = ${Number(carId)}`;
  }
}
async function adminCars({ status = "all", q = "" } = {}) {
  await ensureCars();
  const term = clean(q, 60);
  const wanted = STATUSES.includes(status) ? status : "all";
  return sql`
    SELECT c.id, c.slug, c.title, c.model, c.body, c.year, c.price_kes, c.status,
           c.mileage_km, c.fuel, c.condition, c.featured, c.views, c.updated_at, c.created_at,
           (SELECT i.id FROM car_images i WHERE i.car_id = c.id ORDER BY i.position, i.id LIMIT 1) AS cover_id,
           (SELECT COUNT(*)::int FROM car_images i WHERE i.car_id = c.id) AS image_count
    FROM cars c
    WHERE (${wanted} = 'all' OR c.status = ${wanted})
      AND (${term} = '' OR c.title ILIKE '%' || ${term} || '%')
    ORDER BY c.updated_at DESC
    LIMIT 200
  `;
}
async function adminCar(id) {
  await ensureCars();
  const rows = await sql`SELECT * FROM cars WHERE id = ${Number(id)} LIMIT 1`;
  const car = rows[0];
  if (!car) return null;
  const images = await sql`
    SELECT id, mime, size_bytes, position FROM car_images WHERE car_id = ${car.id} ORDER BY position, id
  `;
  return { ...car, images };
}
export {
  BODY_TYPES,
  CONDITIONS,
  DEALER,
  FUELS,
  MAX_IMAGES,
  MAX_IMAGE_BYTES,
  STATUSES,
  TRANSMISSIONS,
  addImage,
  adminCar,
  adminCars,
  bodiesInStock,
  bumpViews,
  carById,
  carBySlug,
  dealerContact,
  deleteCar,
  ensureCars,
  listCars,
  money,
  removeImage,
  reorderImages,
  saveCar,
  slugify,
  spec,
  sql,
  uniqueSlug
};
