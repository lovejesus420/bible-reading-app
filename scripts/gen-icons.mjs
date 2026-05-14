import sharp from 'sharp';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const svg = readFileSync(join(__dirname, '../public/icon.svg'));

for (const size of [192, 512]) {
  await sharp(svg).resize(size, size).png().toFile(
    join(__dirname, `../public/icon-${size}.png`)
  );
  console.log(`✓ icon-${size}.png`);
}
