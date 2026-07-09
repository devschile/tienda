-- 02_seed_products_from_mock.sql
-- Carga los productos de ejemplo definidos en app/productsMock.ts
-- para tener datos reales en NeonDB desde el día uno.

insert into products (id, name, description, category, price, active, created_time)
values
  ('rec1', 'Set de stickers', 'Stickers oficiales de devsChile', 'Stickers', 5000, true, '2025-01-01T00:00:00.000Z'),
  ('rec2', 'Destapabotellas con imán', 'Mágico unicornio multicolor', 'Accesorios', 30000, true, '2025-01-01T00:00:00.000Z'),
  ('rec3', 'Tazón de huemul', 'Tazón para cafecito', 'Hogar', 12000, true, '2025-01-01T00:00:00.000Z')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  price = excluded.price,
  active = excluded.active,
  created_time = excluded.created_time;

insert into product_images (id, product_id, variant, position, url, filename, size, type)
values
  ('img1', 'rec1', 'thumbnail', 0, 'https://placehold.co/300x300?text=Stickers devsChile', 'osito.jpg', 12345, 'image/jpeg'),
  ('img1', 'rec1', 'large', 0, 'https://placehold.co/600x600?text=Osito+Grande', 'osito_grande.jpg', 54321, 'image/jpeg'),

  ('img2', 'rec2', 'thumbnail', 0, 'https://placehold.co/300x300?text=Destapabotellas', 'unicornio.jpg', 12345, 'image/jpeg'),
  ('img2', 'rec2', 'large', 0, 'https://placehold.co/600x600?text=Otro producto', 'unicornio_grande.jpg', 54321, 'image/jpeg'),

  ('img2', 'rec3', 'thumbnail', 0, 'https://placehold.co/300x300?text=Tazón', 'unicornio.jpg', 12345, 'image/jpeg'),
  ('img2', 'rec3', 'large', 0, 'https://placehold.co/600x600?text=Otro producto', 'unicornio_grande.jpg', 54321, 'image/jpeg')
on conflict (product_id, variant, position) do update set
  id = excluded.id,
  url = excluded.url,
  filename = excluded.filename,
  size = excluded.size,
  type = excluded.type;
