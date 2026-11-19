import fs from 'fs';
process.env.DATABASE_URL = fs.readFileSync('/tmp/dburl.txt','utf8').trim();
const c = await import('./.cars-test.mjs');

const photo = (p) => fs.readFileSync(p).toString('base64');

const cars = [
  {
    title: 'FOTON EST 400HP Prime Mover',
    model: 'BJ4259 / EST',
    body: 'Prime Mover',
    price_kes: 6747000,
    currency: 'USD',
    fuel: 'Diesel',
    transmission: 'Manual',
    drive: '6x4',
    engine: 'Yuchai YC6MK400-33 · 10.3 L',
    seats: 2,
    condition: 'Brand new',
    description: '400 HP 6×4 prime mover with a Yuchai YC6MK400-33 engine and a 700 L aluminium fuel tank. Air-braked with ABS and an exhaust brake, on a 3,300 + 1,350 mm wheelbase. Specifications are subject to final configuration confirmation.',
    features: ['ABS', 'Air brakes', 'Exhaust brake', 'Air conditioning', '700 L aluminium fuel tank', 'Flat-roof EST cab'],
    specs: [
      ['Displacement / power', '10.3 L / 400 HP @ 1,900 rpm'],
      ['Maximum torque', '1,800 Nm @ 1,100–1,500 rpm'],
      ['Wheelbase', '3,300 + 1,350 mm'],
      ['Dimensions (L×W×H)', '6,950 × 2,490 × 3,130 mm'],
      ['Chassis kerb / GCW', '8,500 kg / 52,000 kg'],
      ['Maximum speed / grade', '101 km/h / 35%'],
      ['Front / rear axle', '6.5T / 13T, ABS'],
      ['Tyres', '315/80R22.5 18PR; 10+1'],
      ['Cab', 'EST-2490 flat roof, A/C, 2 seats'],
      ['Emission', 'Euro III'],
    ],
    photo: '/tmp/fotimg/p2_5.jpg',
  },
  {
    title: 'FOTON MA5 12 m³ Tipper Truck',
    model: 'BJ3259 / MA5',
    body: 'Tipper Truck',
    price_kes: 7657000,
    currency: 'USD',
    fuel: 'Diesel',
    transmission: 'Manual',
    drive: '6x4',
    engine: 'Yuchai YC6A260-33 · 7.25 L',
    condition: 'Brand new',
    description: '6×4 tipper with a 12 m³ body on a 3,350 + 1,350 mm wheelbase. Q345 steel body, 6 mm floor and 4 mm sides, front lift. Specifications are subject to final configuration confirmation.',
    features: ['Front lift', 'Q345 steel body', '6 mm floor / 4 mm sides', '350 L aluminium fuel tank'],
    specs: [
      ['Displacement / power', '7.25 L / 260 HP'],
      ['Maximum torque', '1,000 Nm @ 1,400–1,600 rpm'],
      ['Wheelbase', '3,350 + 1,350 mm'],
      ['Dimensions (L×W×H)', '7,480 × 2,500 × 3,150 mm'],
      ['Chassis kerb / GCW', '11,100 kg / 30,000 kg'],
      ['Maximum speed / grade', '80 km/h / 34%'],
      ['Front / rear axle', '6.5T / 13T, 5.26 ratio'],
      ['Tyres', '11R22.5 18PR; 10+1'],
      ['Tipper body', '4.8 × 2.3 × 1.1 m; 12 m³'],
      ['Emission', 'Euro III'],
    ],
    photo: '/tmp/fotimg/p3_5.jpg',
  },
  {
    title: 'FOTON EST 20 m³ Tipper Truck',
    model: 'BJ3259 / EST',
    body: 'Tipper Truck',
    price_kes: 9087000,
    currency: 'USD',
    fuel: 'Diesel',
    transmission: 'Manual',
    drive: '6x4',
    engine: 'Yuchai YC6MK400-33 · 10.3 L',
    condition: 'Brand new',
    description: '400 HP 6×4 tipper with a 20 m³ body on a 4,100 + 1,400 mm wheelbase. Q345 steel body, 8 mm floor and 6 mm sides, front lift. Specifications are subject to final configuration confirmation.',
    features: ['Front lift', 'Q345 steel body', '8 mm floor / 6 mm sides', '350 L aluminium fuel tank', 'Air brakes'],
    specs: [
      ['Displacement / power', '10.3 L / 400 HP @ 1,900 rpm'],
      ['Maximum torque', '1,800 Nm @ 1,100–1,500 rpm'],
      ['Wheelbase', '4,100 + 1,400 mm'],
      ['Dimensions (L×W×H)', '9,900 × 2,495 × 3,360 mm'],
      ['Chassis kerb / GCW', '15,460 kg / 55,000 kg'],
      ['Maximum speed / grade', '82 km/h / 33%'],
      ['Front / rear axle', '9T / 16T, 5.26 ratio'],
      ['Tyres', '315/80R22.5; 10+1'],
      ['Tipper body', '5.6 × 2.3 × 1.5 m; 20 m³'],
      ['Emission', 'Euro III'],
    ],
    photo: '/tmp/fotimg/p4_5.jpg',
  },
  {
    title: 'FOTON Tunland G9 Double Cab Pickup',
    model: 'Tunland G9',
    body: 'Pickup',
    price_kes: 5707000,
    currency: 'USD',
    fuel: 'Diesel',
    transmission: 'Automatic',
    drive: '4x4',
    engine: '2.0 L turbo diesel · 161 HP',
    condition: 'Brand new',
    description: 'Double-cab 4×4 pickup with a 2.0 L turbo diesel, 8-speed automatic and 210 mm of ground clearance. Premium configuration — verify options with the showroom. Specifications are subject to final configuration confirmation.',
    features: ['8-speed automatic', '4×4', 'Independent double wishbone front suspension', '210 mm ground clearance', '265/60R18 tyres'],
    specs: [
      ['Power / torque', '161 HP / 415 Nm'],
      ['Wheelbase', '3,110 mm'],
      ['Dimensions (L×W×H)', '5,340 × 1,960 × 1,920 mm'],
      ['Cargo bed', '1,520 × 1,580 × 440 mm'],
      ['Ground clearance', '210 mm'],
      ['Tyres', '265/60R18'],
      ['Cab', 'Double cab'],
      ['Emission', 'Euro III'],
    ],
    photo: '/tmp/fotimg/p5_5.jpg',
  },
];

for (const spec of cars) {
  const existing = await c.listCars({ q: spec.model.split(' ')[0], limit: 120 });
  if (existing.some((x) => x.title === spec.title)) { console.log('exists, skipping', spec.title); continue; }
  const car = await c.saveCar({
    ...spec,
    specs: spec.specs.map(([label, value]) => ({ label, value })),
    status: 'published',
    featured: spec.body === 'Prime Mover' || spec.body === 'Pickup',
  });
  await c.addImage(car.id, { mime: 'image/jpeg', bytes: photo(spec.photo), size: fs.statSync(spec.photo).size });
  console.log('added', car.slug, '·', car.currency, car.price_kes);
}

// dealer contact from the price list
for (const [key, value] of [
  ['cars_phone', '+254 720 338 888'],
  ['cars_whatsapp', '254720338888'],
  ['cars_address', 'Mudher Industrial Park, Mombasa Road'],
]) {
  await c.sql`
    INSERT INTO settings (key, value) VALUES (${key}, ${value})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;
}
console.log('settings set');
