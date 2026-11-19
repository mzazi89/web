import fs from 'fs';
process.env.DATABASE_URL = fs.readFileSync('/tmp/dburl.txt','utf8').trim();
const c = await import('./.cars-test.mjs');
await c.ensureCars();
for (const old of await c.listCars({})) { /* keep */ }
const car = await c.saveCar({
  title: 'FOTON Aumark 3.5T Light Truck', model: 'Aumark', body: 'Light Truck', year: 2024,
  price_kes: 5450000, fuel: 'Diesel', transmission: 'Manual', drive: '4x2',
  engine: '2.8L Turbo Diesel', seats: 3, payload_kg: 3500, color: 'White',
  condition: 'Brand new', description: 'Brand new Aumark with a 3.5 tonne payload, ideal for distribution and construction supply.',
  features: ['Power steering', 'ABS', 'Reverse camera', 'Tool box'], status: 'published', featured: true,
}, {});
// a 1x1 png is too small to look like anything, but it proves the pipeline
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
await c.addImage(car.id, { mime: 'image/png', bytes: png, size: 70 });
console.log(JSON.stringify({ id: car.id, slug: car.slug }));
