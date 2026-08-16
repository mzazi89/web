import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import path from 'path';
import { BrandCard } from './brand-card';

// Node runtime: the font is read from disk (works at build-time prerender
// and on Vercel Node functions, where project files ship with the bundle).
export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  const [regular, medium, bold] = await Promise.all([
    readFile(path.join(process.cwd(), 'app/fonts/SpaceGrotesk-Regular.ttf')),
    readFile(path.join(process.cwd(), 'app/fonts/SpaceGrotesk-Medium.ttf')),
    readFile(path.join(process.cwd(), 'app/fonts/SpaceGrotesk-Bold.ttf')),
  ]);

  return new ImageResponse(<BrandCard />, {
    ...size,
    fonts: [
      { name: 'Space Grotesk', data: regular, weight: 400 },
      { name: 'Space Grotesk', data: medium, weight: 500 },
      { name: 'Space Grotesk', data: bold, weight: 700 },
    ],
  });
}
