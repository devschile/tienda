const img = (id: string, url: string, filename: string, isCover: boolean) => ({
  id,
  url,
  filename,
  size: 0,
  type: 'image/jpeg',
  is_cover: isCover,
});

import type { ProductRecord } from '@/types/products';

const LONG_DESC_DESTAPABOTELLAS = `# ¿Por qué elegirlo?

El destapabotellas con imán del Huemul es el accesorio perfecto para cualquier amante de la cerveza artesanal y la comunidad devsChile.

## Características

- **Material:** Acero inoxidable con acabado mate
- **Imán integrado:** Atrapa la tapa automáticamente al destapar
- **Resistente al agua:** Apto para uso en interiores y exteriores
- Diseño exclusivo del Huemul, símbolo de la comunidad

## Sobre el diseño

Cada pieza fue diseñada por miembros de devsChile. El Huemul grabado representa **la identidad chilena en el mundo del software**: robusto, elegante y único.`;

const LONG_DESC_OPACO = `## La elegancia también abre botellas.

Hay productos que llaman la atención. Y hay productos que hacen que quienes saben... los noten.

La Edición Signature Mate fue creada para quienes disfrutan del diseño limpio, los materiales bien terminados y los objetos que envejecen con dignidad. Su acabado opaco elimina reflejos innecesarios y entrega una apariencia sofisticada que combina perfectamente con escritorios minimalistas, oficinas modernas y setups profesionales.

No pretende ser extravagante. Pretende convertirse en ese objeto que todos toman en la mano para decir: "Está increíble... ¿dónde lo conseguiste?"

## Características

- Acabado **mate premium**, elegante y sin reflejos.
- Superficie de tacto suave con apariencia refinada.
- Cuerpo metálico de alta resistencia.
- Destapador de acero integrado.
- Imán posterior de gran adherencia para refrigeradores y superficies metálicas.
- Diseño exclusivo del Huemul oficial de devsChile.
- Estética **minimalista** inspirada en el mundo del desarrollo de software.
- Compacto, resistente y pensado para durar años.

## Especificaciones

- Terminación frontal: impresión protegida con laminado **mate premium**.
- Base: acero inoxidable.
- Sistema: destapador metálico + imán posterior.
- Diámetro: 58 mm · Espesor: ~7 mm · Peso: ~40 g.

## ¿Por qué comprarlo?

Porque el buen diseño nunca pasa de moda. Porque un accesorio bien construido transmite la misma filosofía que un buen código: **limpio, simple y sin adornos innecesarios**.

## Ideal para

- Developers, Arquitectos de software, DevOps y Tech Leads.
- Diseñadores UX/UI y Fundadores de startups.
- Coleccionistas de merchandising tecnológico.
- Regalos corporativos y eventos exclusivos.

## Disclaimer

- Diseñado para abrir botellas, no discusiones sobre tabs vs. spaces.
- No mejora el rendimiento de tu código... aunque sí el de tu estilo.
- **La versión mate está pensada para quienes creen que el verdadero lujo no necesita llamar la atención.**`;

const LONG_DESC_BRILLANTE = `El Destapador Oficial devsChile no promete convertirte en Senior ni arreglar el bug de producción que aparece solo frente al cliente. Pero sí logra algo casi igual de importante: **abrir botellas con estilo**.

Su cubierta brillante refleja las luces de hackatones, LAN Parties, conferencias y asados tecnológicos, haciendo que el Huemul destaque incluso entre RGB y teclados mecánicos.

## Características

- Acabado **brillante premium** con resina epóxica transparente.
- Cuerpo metálico de alta resistencia.
- Destapador de acero integrado.
- Imán trasero para refrigerador, gabinete metálico o superficie ferromagnética.
- Diseño exclusivo del Huemul oficial de devsChile.
- Compacto y liviano — cabe en bolsillo, mochila o bolso de notebook.

## Especificaciones

- Material frontal: impresión protegida con **resina epóxica brillante**.
- Base: acero inoxidable.
- Sistema: destapador metálico + imán posterior.
- Diámetro: 58 mm · Espesor: ~7 mm · Peso: ~40 g.

## ¿Por qué comprarlo?

Porque un llavero cualquiera no genera conversación... un destapador de devsChile sí. Porque cada botella abierta puede transformarse en una buena historia. Porque probablemente termine pegado en tu refrigerador recordándote ese meetup donde conociste a tu próximo socio, trabajo o amigo.

Y porque seamos honestos: **todos sabemos que el código compila mejor después de una bebida bien merecida.** *(No existen estudios científicos que respalden esta afirmación. Tampoco que la contradigan.)*

## Ideal para

- 🍺 Hackatones y LAN Parties.
- 🎤 Conferencias y meetups de tecnología.
- 🍔 Asados entre developers.
- 🎁 Regalo para ese compañero que ya tiene demasiados stickers.

## Disclaimer

- Abre botellas. No abre puertos bloqueados por el firewall.
- No resuelve conflictos de Git. No es considerado arma blanca.
- Compatible con cerveza, bebidas y celebraciones. Incompatible con tapas rosca ni corchos.`;

export const productsMock = [
  // ── Productos placeholder originales ──────────────────────────────────────
  {
    id: 'rec1',
    fields: {
      id: 'rec1',
      name: 'Set de stickers',
      price: 5000,
      description: 'Stickers oficiales de devsChile',
      category: 'Stickers',
      coverImage: img(
        'img1',
        'https://placehold.co/600x600?text=Stickers+devsChile',
        'osito.jpg',
        true,
      ),
      images: [
        img('img1', 'https://placehold.co/600x600?text=Stickers+devsChile', 'osito.jpg', true),
      ],
      thumbnailImages: [
        img('img1', 'https://placehold.co/300x300?text=Stickers', 'osito_thumb.jpg', true),
      ],
      largeImages: [
        img('img1', 'https://placehold.co/600x600?text=Stickers+devsChile', 'osito.jpg', false),
      ],
      visible: true,
      available: true,
      stock: 10,
      on_sale: false,
      presale: false,
      long_description: null,
      sale_price: null,
    },
    createdTime: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'rec2',
    fields: {
      id: 'rec2',
      name: 'Destapabotellas con imán',
      price: 30000,
      description: 'Mágico unicornio multicolor',
      category: 'Accesorios',
      coverImage: img(
        'img2',
        'https://placehold.co/600x600?text=Destapabotellas',
        'dest.jpg',
        true,
      ),
      images: [img('img2', 'https://placehold.co/600x600?text=Destapabotellas', 'dest.jpg', true)],
      thumbnailImages: [
        img('img2', 'https://placehold.co/300x300?text=Destapabotellas', 'dest_thumb.jpg', true),
      ],
      largeImages: [
        img('img2', 'https://placehold.co/600x600?text=Destapabotellas', 'dest.jpg', false),
      ],
      visible: true,
      available: true,
      stock: 3,
      on_sale: true,
      presale: false,
      long_description: LONG_DESC_DESTAPABOTELLAS,
      sale_price: 22000,
    },
    createdTime: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'rec3',
    fields: {
      id: 'rec3',
      name: 'Tazón de Huemul',
      price: 12000,
      description: 'Tazón para cafecito',
      category: 'Hogar',
      coverImage: img('img3', 'https://placehold.co/600x600?text=Tazón', 'tazon.jpg', true),
      images: [img('img3', 'https://placehold.co/600x600?text=Tazón', 'tazon.jpg', true)],
      thumbnailImages: [
        img('img3', 'https://placehold.co/300x300?text=Tazón', 'tazon_thumb.jpg', true),
      ],
      largeImages: [img('img3', 'https://placehold.co/600x600?text=Tazón', 'tazon.jpg', false)],
      visible: true,
      available: true,
      stock: 10,
      on_sale: false,
      presale: true,
      long_description: null,
      sale_price: null,
      shipping_tier: 's',
    },
    createdTime: '2025-01-01T00:00:00.000Z',
  },

  // ── Productos reales con imágenes locales ──────────────────────────────────
  {
    id: 'opaco-001',
    fields: {
      id: 'opaco-001',
      name: 'Destapador Oficial devsChile – Edición Signature Mate (Opaco)',
      price: 4200,
      description:
        'La Edición Signature Mate combina un acabado opaco premium con un diseño minimalista. Pensado para quienes valoran la calidad, el detalle y la discreción.',
      category: 'Accesorios',
      coverImage: img(
        'opaco-front',
        '/products/destapabotella-opaco/destapabotella-opaco-front.jpg',
        'destapabotella-opaco-front.jpg',
        true,
      ),
      images: [
        img(
          'opaco-front',
          '/products/destapabotella-opaco/destapabotella-opaco-front.jpg',
          'destapabotella-opaco-front.jpg',
          true,
        ),
        img(
          'opaco-main',
          '/products/destapabotella-opaco/destapabotella-opaco.jpg',
          'destapabotella-opaco.jpg',
          false,
        ),
        img(
          'opaco-side',
          '/products/destapabotella-opaco/destapabotella-opaco-side.jpg',
          'destapabotella-opaco-side.jpg',
          false,
        ),
        img(
          'opaco-nature',
          '/products/destapabotella-opaco/destapabotella-nature.jpg',
          'destapabotella-nature.jpg',
          false,
        ),
        img(
          'opaco-uso',
          '/products/destapabotella-opaco/destapabotella-uso.jpg',
          'destapabotella-uso.jpg',
          false,
        ),
        img(
          'opaco-back',
          '/products/destapabotella-opaco/destapabotella-back.jpg',
          'destapabotella-back.jpg',
          false,
        ),
      ],
      thumbnailImages: [
        img(
          'opaco-front',
          '/products/destapabotella-opaco/destapabotella-opaco-front.jpg',
          'destapabotella-opaco-front.jpg',
          true,
        ),
      ],
      largeImages: [
        img(
          'opaco-front',
          '/products/destapabotella-opaco/destapabotella-opaco-front.jpg',
          'destapabotella-opaco-front.jpg',
          false,
        ),
      ],
      visible: true,
      available: true,
      stock: 10,
      on_sale: false,
      presale: false,
      long_description: LONG_DESC_OPACO,
      sale_price: null,
    },
    createdTime: '2025-06-01T00:00:00.000Z',
  },
  {
    id: 'brillante-001',
    fields: {
      id: 'brillante-001',
      name: 'Destapador Oficial devsChile – Edición Huemul Legendario (Brillante)',
      price: 4200,
      description:
        'Destapador magnético metálico con acabado brillante, ilustración del icónico Huemul de devsChile y fuerza suficiente para sobrevivir hackatones, meetups y juntas #llanto.',
      category: 'Accesorios',
      coverImage: img(
        'brillante-main',
        '/products/destapabotella-brillante/destapabotella-brillante.jpg',
        'destapabotella-brillante.jpg',
        true,
      ),
      images: [
        img(
          'brillante-main',
          '/products/destapabotella-brillante/destapabotella-brillante.jpg',
          'destapabotella-brillante.jpg',
          true,
        ),
        img(
          'brillante-mano',
          '/products/destapabotella-brillante/destapabotella-mano.jpg',
          'destapabotella-mano.jpg',
          false,
        ),
        img(
          'brillante-evento',
          '/products/destapabotella-brillante/destapabotella-brillante-evento.jpg',
          'destapabotella-brillante-evento.jpg',
          false,
        ),
        img(
          'brillante-juntos',
          '/products/destapabotella-brillante/destapabotella-juntos.jpg',
          'destapabotella-juntos.jpg',
          false,
        ),
      ],
      thumbnailImages: [
        img(
          'brillante-main',
          '/products/destapabotella-brillante/destapabotella-brillante.jpg',
          'destapabotella-brillante.jpg',
          true,
        ),
      ],
      largeImages: [
        img(
          'brillante-main',
          '/products/destapabotella-brillante/destapabotella-brillante.jpg',
          'destapabotella-brillante.jpg',
          false,
        ),
      ],
      visible: true,
      available: true,
      stock: 10,
      on_sale: false,
      presale: false,
      long_description: LONG_DESC_BRILLANTE,
      sale_price: null,
    },
    createdTime: '2025-06-01T00:00:00.000Z',
  },

  // ── Incremento: pack de stickers (bundle) ─────────────────────────────────────
  {
    id: 'bundle-stickers-001',
    fields: {
      id: 'bundle-stickers-001',
      name: 'Pack de stickers devsChile',
      price: 1000,
      description:
        'Arma tu propio pack de stickers oficiales de devsChile. Elige el tamaño y combina los diseños que quieras, todo en un mismo envío.',
      category: 'Stickers',
      coverImage: img(
        'bundle-cover',
        'https://placehold.co/600x600?text=Pack+de+stickers',
        'pack-stickers.jpg',
        true,
      ),
      images: [
        img(
          'bundle-cover',
          'https://placehold.co/600x600?text=Pack+de+stickers',
          'pack-stickers.jpg',
          true,
        ),
      ],
      thumbnailImages: [
        img('bundle-thumb', 'https://placehold.co/300x300?text=Stickers', 'pack-thumb.jpg', true),
      ],
      largeImages: [
        img(
          'bundle-large',
          'https://placehold.co/600x600?text=Pack+de+stickers',
          'pack-stickers.jpg',
          false,
        ),
      ],
      visible: true,
      available: true,
      stock: 0,
      on_sale: false,
      presale: false,
      long_description:
        '## Cómo funciona\n\nCada sticker cuesta **$1.000**. Eliges el tamaño del pack (3, 4 o 6) y seleccionas los diseños que quieras de los disponibles en stock. Si dejas slots vacíos, se completarán con **stickers sorpresa** (avísanos y elige a mano si lo prefieres en [huemul@devschile.cl](mailto:huemul@devschile.cl)).',
      sale_price: null,
      product_type: 'bundle',
      selectable_in_bundles: false,
      bundle_unit_price: 1000,
      bundle_sizes: [3, 4, 6],
      bundle_allow_surprise: true,
    },
    createdTime: '2026-08-01T00:00:00.000Z',
  },

  // ── Incremento: sticker individual (addon, seleccionable en packs) ────────────
  {
    id: 'sticker-huemul-001',
    fields: {
      id: 'sticker-huemul-001',
      name: 'Sticker Huemul',
      price: 1000,
      description:
        'Sticker de vinilo del Huemul devsChile. Solo se vende dentro de un pack o como agregado a un pedido que ya cubra el envío.',
      category: 'Stickers',
      coverImage: img(
        'huemul-cover',
        'https://placehold.co/600x600?text=Sticker+Huemul',
        'sticker-huemul.jpg',
        true,
      ),
      images: [
        img(
          'huemul-cover',
          'https://placehold.co/600x600?text=Sticker+Huemul',
          'sticker-huemul.jpg',
          true,
        ),
      ],
      thumbnailImages: [
        img(
          'huemul-thumb',
          'https://placehold.co/300x300?text=Huemul',
          'sticker-huemul-thumb.jpg',
          true,
        ),
      ],
      largeImages: [
        img(
          'huemul-large',
          'https://placehold.co/600x600?text=Sticker+Huemul',
          'sticker-huemul.jpg',
          false,
        ),
      ],
      visible: true,
      available: true,
      stock: 25,
      on_sale: false,
      presale: false,
      long_description: null,
      sale_price: null,
      product_type: 'addon',
      selectable_in_bundles: true,
      bundle_unit_price: null,
      bundle_sizes: null,
      bundle_allow_surprise: true,
    },
    createdTime: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'sticker-typescript-001',
    fields: {
      id: 'sticker-typescript-001',
      name: 'Sticker TypeScript',
      price: 1000,
      description:
        'Sticker de vinilo de TypeScript. Solo se vende dentro de un pack o como agregado a un pedido que ya cubra el envío.',
      category: 'Stickers',
      coverImage: img(
        'typescript-cover',
        'https://placehold.co/600x600?text=Sticker+TypeScript',
        'sticker-typescript.jpg',
        true,
      ),
      images: [
        img(
          'typescript-cover',
          'https://placehold.co/600x600?text=Sticker+TypeScript',
          'sticker-typescript.jpg',
          true,
        ),
      ],
      thumbnailImages: [
        img(
          'typescript-thumb',
          'https://placehold.co/300x300?text=TypeScript',
          'sticker-typescript-thumb.jpg',
          true,
        ),
      ],
      largeImages: [
        img(
          'typescript-large',
          'https://placehold.co/600x600?text=Sticker+TypeScript',
          'sticker-typescript.jpg',
          false,
        ),
      ],
      visible: true,
      available: true,
      stock: 25,
      on_sale: false,
      presale: false,
      long_description: null,
      sale_price: null,
      product_type: 'addon',
      selectable_in_bundles: true,
      bundle_unit_price: null,
      bundle_sizes: null,
      bundle_allow_surprise: true,
    },
    createdTime: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'sticker-llanto-001',
    fields: {
      id: 'sticker-llanto-001',
      name: 'Sticker Llanto',
      price: 1000,
      description:
        'Sticker de vinilo de Llanto. Solo se vende dentro de un pack o como agregado a un pedido que ya cubra el envío.',
      category: 'Stickers',
      coverImage: img(
        'llanto-cover',
        'https://placehold.co/600x600?text=Sticker+Llanto',
        'sticker-llanto.jpg',
        true,
      ),
      images: [
        img(
          'llanto-cover',
          'https://placehold.co/600x600?text=Sticker+Llanto',
          'sticker-llanto.jpg',
          true,
        ),
      ],
      thumbnailImages: [
        img(
          'llanto-thumb',
          'https://placehold.co/300x300?text=Llanto',
          'sticker-llanto-thumb.jpg',
          true,
        ),
      ],
      largeImages: [
        img(
          'llanto-large',
          'https://placehold.co/600x600?text=Sticker+Llanto',
          'sticker-llanto.jpg',
          false,
        ),
      ],
      visible: true,
      available: true,
      stock: 25,
      on_sale: false,
      presale: false,
      long_description: null,
      sale_price: null,
      product_type: 'addon',
      selectable_in_bundles: true,
      bundle_unit_price: null,
      bundle_sizes: null,
      bundle_allow_surprise: true,
    },
    createdTime: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'sticker-huemulfest-001',
    fields: {
      id: 'sticker-huemulfest-001',
      name: 'Sticker HuemulFest',
      price: 1000,
      description:
        'Sticker de vinilo de HuemulFest. Solo se vende dentro de un pack o como agregado a un pedido que ya cubra el envío.',
      category: 'Stickers',
      coverImage: img(
        'huemulfest-cover',
        'https://placehold.co/600x600?text=Sticker+HuemulFest',
        'sticker-huemulfest.jpg',
        true,
      ),
      images: [
        img(
          'huemulfest-cover',
          'https://placehold.co/600x600?text=Sticker+HuemulFest',
          'sticker-huemulfest.jpg',
          true,
        ),
      ],
      thumbnailImages: [
        img(
          'huemulfest-thumb',
          'https://placehold.co/300x300?text=HuemulFest',
          'sticker-huemulfest-thumb.jpg',
          true,
        ),
      ],
      largeImages: [
        img(
          'huemulfest-large',
          'https://placehold.co/600x600?text=Sticker+HuemulFest',
          'sticker-huemulfest.jpg',
          false,
        ),
      ],
      visible: true,
      available: true,
      stock: 25,
      on_sale: false,
      presale: false,
      long_description: null,
      sale_price: null,
      product_type: 'addon',
      selectable_in_bundles: true,
      bundle_unit_price: null,
      bundle_sizes: null,
      bundle_allow_surprise: true,
    },
    createdTime: '2026-08-01T00:00:00.000Z',
  },
  {
    id: 'sticker-18sept-001',
    fields: {
      id: 'sticker-18sept-001',
      name: 'Sticker 18 de septiembre',
      price: 1000,
      description:
        'Sticker de vinilo del 18 de septiembre. Solo se vende dentro de un pack o como agregado a un pedido que ya cubra el envío.',
      category: 'Stickers',
      coverImage: img(
        '18sept-cover',
        'https://placehold.co/600x600?text=Sticker+18+de+septiembre',
        'sticker-18sept.jpg',
        true,
      ),
      images: [
        img(
          '18sept-cover',
          'https://placehold.co/600x600?text=Sticker+18+de+septiembre',
          'sticker-18sept.jpg',
          true,
        ),
      ],
      thumbnailImages: [
        img(
          '18sept-thumb',
          'https://placehold.co/300x300?text=18+de+septiembre',
          'sticker-18sept-thumb.jpg',
          true,
        ),
      ],
      largeImages: [
        img(
          '18sept-large',
          'https://placehold.co/600x600?text=Sticker+18+de+septiembre',
          'sticker-18sept.jpg',
          false,
        ),
      ],
      visible: true,
      available: true,
      stock: 25,
      on_sale: false,
      presale: false,
      long_description: null,
      sale_price: null,
      product_type: 'addon',
      selectable_in_bundles: true,
      bundle_unit_price: null,
      bundle_sizes: null,
      bundle_allow_surprise: true,
    },
    createdTime: '2026-08-01T00:00:00.000Z',
  },
] satisfies ProductRecord[];
