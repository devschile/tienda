// Script para generar favicons desde images/devschile2026.png
// Genera versiones cuadradas con padding transparente y las guarda en public/
import { Jimp } from 'jimp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const src = join(__dir, '../images/devschile2026.png');
const out = join(__dir, '../public');

async function makeSquareFavicon(img, size) {
  const clone = img.clone();
  clone.contain({ w: size, h: size }); // centra con padding transparente
  return clone;
}

const base = await Jimp.read(src);
console.log(`Fuente: ${base.bitmap.width}×${base.bitmap.height}px`);

const f32 = await makeSquareFavicon(base, 32);
await f32.write(join(out, 'favicon-32x32.png'));
console.log('✅ public/favicon-32x32.png');

const f16 = await makeSquareFavicon(base, 16);
await f16.write(join(out, 'favicon-16x16.png'));
console.log('✅ public/favicon-16x16.png');

const apple = await makeSquareFavicon(base, 180);
await apple.write(join(out, 'apple-touch-icon.png'));
console.log('✅ public/apple-touch-icon.png (180×180)');

const f192 = await makeSquareFavicon(base, 192);
await f192.write(join(out, 'favicon-192x192.png'));
console.log('✅ public/favicon-192x192.png');
