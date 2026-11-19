import fs from 'fs';
process.env.DATABASE_URL = fs.readFileSync('/tmp/dburl.txt','utf8').trim();
const c = await import('./.cars-test.mjs');

await c.ensureCars();
const car = await c.saveCar({
  title: 'FOTON Tunland 4x4 Pickup', model: 'Tunland', body: 'Pickup', year: 2024,
  price_kes: 4250000, mileage_km: 0, fuel: 'Diesel', transmission: 'Manual', drive: '4x4',
  engine: '2.8L Turbo Diesel', seats: 5, payload_kg: 1000, color: 'Silver',
  condition: 'Brand new', description: 'Double cab, ready for work.',
  features: ['ABS brakes', 'Air conditioning', 'Reverse camera'], status: 'published', featured: true,
});
console.log('created:', { id: car.id, slug: car.slug, price: car.price_kes, features: car.features });

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const img = await c.addImage(car.id, { mime: 'image/png', bytes: png, size: 70 });
console.log('image:', img);

const list = await c.listCars({ q: 'tunland' });
console.log('list:', list.map((x) => `${x.slug} cover=${x.cover_id} imgs=${x.image_count}`));

const one = await c.carBySlug(car.slug);
console.log('detail:', one && { title: one.title, images: one.images.length, price: c.money(one.price_kes), specs: c.spec(one).length });

const bodies = await c.bodiesInStock();
console.log('bodies:', bodies);

const upd = await c.saveCar({ title: 'FOTON Tunland 4x4 Pickup', status: 'sold', price_kes: 4000000, features: 'ABS\nAircon' }, { id: car.id });
console.log('updated:', { status: upd.status, price: upd.price_kes, features: upd.features, slug: upd.slug });

console.log('admin list:', (await c.adminCars({ status: 'sold' })).map((x) => x.title));
await c.deleteCar(car.id);
console.log('after delete:', await c.carBySlug(car.slug), '| remaining:', (await c.listCars({})).length);
