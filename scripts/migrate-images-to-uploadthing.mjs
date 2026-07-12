/**
 * migrate-images-to-uploadthing.mjs
 * Sube las imágenes de ./public/products a UploadThing y actualiza product_images en NeonDB.
 *
 * Uso:
 *   node --env-file=.env scripts/migrate-images-to-uploadthing.mjs
 *
 * Requiere: UPLOADTHING_TOKEN y NEON_DATABASE_URL en .env
 */

import { UTApi } from 'uploadthing/server';
import { neon } from '@neondatabase/serverless';
import { readdir, readFile, stat } from 'fs/promises';
import { join, extname, basename } from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'node:crypto';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PRODUCTS_DIR = join(__dirname, '../public/products');

// ── Validar env vars ──────────────────────────────────────────────────────────
if (!process.env.UPLOADTHING_TOKEN) {
  console.error('❌  Falta UPLOADTHING_TOKEN en .env');
  process.exit(1);
}
if (!process.env.NEON_DATABASE_URL) {
  console.error('❌  Falta NEON_DATABASE_URL en .env');
  process.exit(1);
}

const utapi = new UTApi();
const sql = neon(process.env.NEON_DATABASE_URL);

const CONTENT_TYPE = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

// ── 1. Cargar productos de la BD ──────────────────────────────────────────────
const products = await sql`SELECT id, name FROM products ORDER BY name`;
console.log(`\n📦 ${products.length} productos en BD:`);
products.forEach((p) => console.log(`   · [${p.id}] ${p.name}`));

// ── 2. Leer carpetas de imágenes ───────────────────────────────────────────────
const entries = await readdir(PRODUCTS_DIR, { withFileTypes: true });
const folders = entries.filter((e) => e.isDirectory()).map((e) => e.name);
console.log(`\n📂 ${folders.length} carpetas encontradas: ${folders.join(', ')}`);

// ── 3. Procesar cada carpeta ──────────────────────────────────────────────────
for (const folderName of folders) {
  // Extraer keyword del nombre de carpeta (ej: "destapabotella-opaco" → "opaco")
  const keyword = folderName.replace(/^destapabotella-/, '').replace(/-/g, ' ');

  const product = products.find((p) => p.name.toLowerCase().includes(keyword));

  if (!product) {
    console.warn(`\n⚠️   Sin match para carpeta "${folderName}" (keyword: "${keyword}")`);
    continue;
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📦  ${product.name}`);
  console.log(`    id: ${product.id}`);

  // Listar imágenes del folder
  const folderPath = join(PRODUCTS_DIR, folderName);
  const files = (await readdir(folderPath))
    .filter((f) => Object.keys(CONTENT_TYPE).includes(extname(f).toLowerCase()))
    .sort(); // orden alfabético reproducible

  console.log(`    ${files.length} imágenes: ${files.join(', ')}`);

  // Borrar product_images existentes para este producto
  const { count } = await sql`
    SELECT COUNT(*)::int AS count FROM product_images WHERE product_id = ${product.id}
  `.then(([r]) => r);
  if (count > 0) {
    await sql`DELETE FROM product_images WHERE product_id = ${product.id}`;
    console.log(`    🗑   ${count} imagen(es) anterior(es) eliminada(s) de la BD`);
  }

  // Subir cada imagen
  for (let i = 0; i < files.length; i++) {
    const filename = files[i];
    const ext = extname(filename).toLowerCase();
    const contentType = CONTENT_TYPE[ext] ?? 'image/jpeg';
    const filePath = join(folderPath, filename);

    // La cover es la imagen cuyo basename == folderName
    const isCover = basename(filename, ext) === folderName;

    const fileStats = await stat(filePath);
    const buffer = await readFile(filePath);
    const file = new File([buffer], filename, { type: contentType });

    process.stdout.write(`    ⬆   [${i + 1}/${files.length}] ${filename}${isCover ? ' ⭐' : ''}  `);

    const { data, error } = await utapi.uploadFiles(file);

    if (error || !data) {
      console.log(`❌  ${error?.message ?? 'upload failed'}`);
      continue;
    }

    const imageId = `img_${randomBytes(5).toString('hex')}`;
    await sql`
      INSERT INTO product_images (id, product_id, url, filename, size, type, variant, position, is_cover)
      VALUES (
        ${imageId},
        ${product.id},
        ${data.ufsUrl ?? data.url},
        ${filename},
        ${fileStats.size},
        ${contentType},
        'large',
        ${i},
        ${isCover}
      )
    `;

    console.log(`→ ${data.ufsUrl ?? data.url}`);
  }

  // Fallback: si ninguna imagen quedó como cover, marcar la primera
  const [coverCheck] = await sql`
    SELECT COUNT(*)::int AS c FROM product_images
    WHERE product_id = ${product.id} AND is_cover = true
  `;
  if (coverCheck.c === 0) {
    const [first] = await sql`
      SELECT id FROM product_images
      WHERE product_id = ${product.id}
      ORDER BY position ASC LIMIT 1
    `;
    if (first) {
      await sql`UPDATE product_images SET is_cover = true WHERE id = ${first.id}`;
      console.log(`    ⭐  Cover asignada por fallback a la primera imagen`);
    }
  }
}

console.log('\n✨  Migración completa!\n');
