const img = (id: string, url: string, filename: string, size: number, isCover: boolean) => ({
  id,
  url,
  filename,
  size,
  type: 'image/jpeg',
  is_cover: isCover,
});

export const productsMock = [
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
        'https://placehold.co/300x300?text=Stickers devsChile',
        'osito.jpg',
        12345,
        true,
      ),
      images: [
        img(
          'img1',
          'https://placehold.co/300x300?text=Stickers devsChile',
          'osito.jpg',
          12345,
          true,
        ),
        img(
          'img1',
          'https://placehold.co/600x600?text=Osito+Grande',
          'osito_grande.jpg',
          54321,
          false,
        ),
      ],
      thumbnailImages: [
        img(
          'img1',
          'https://placehold.co/300x300?text=Stickers devsChile',
          'osito.jpg',
          12345,
          true,
        ),
      ],
      largeImages: [
        img(
          'img1',
          'https://placehold.co/600x600?text=Osito+Grande',
          'osito_grande.jpg',
          54321,
          false,
        ),
      ],
      visible: true,
      available: true,
      stock: 10,
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
        'https://placehold.co/300x300?text=Destapabotellas',
        'unicornio.jpg',
        12345,
        true,
      ),
      images: [
        img(
          'img2',
          'https://placehold.co/300x300?text=Destapabotellas',
          'unicornio.jpg',
          12345,
          true,
        ),
        img(
          'img2',
          'https://placehold.co/600x600?text=Otro producto',
          'unicornio_grande.jpg',
          54321,
          false,
        ),
      ],
      thumbnailImages: [
        img(
          'img2',
          'https://placehold.co/300x300?text=Destapabotellas',
          'unicornio.jpg',
          12345,
          true,
        ),
      ],
      largeImages: [
        img(
          'img2',
          'https://placehold.co/600x600?text=Otro producto',
          'unicornio_grande.jpg',
          54321,
          false,
        ),
      ],
      visible: true,
      available: true,
      stock: 3,
    },
    createdTime: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'rec3',
    fields: {
      id: 'rec3',
      name: 'Tazón de huemul',
      price: 12000,
      description: 'Tazón para cafecito',
      category: 'Hogar',
      coverImage: img(
        'img2',
        'https://placehold.co/300x300?text=Tazón',
        'unicornio.jpg',
        12345,
        true,
      ),
      images: [
        img('img2', 'https://placehold.co/300x300?text=Tazón', 'unicornio.jpg', 12345, true),
        img(
          'img2',
          'https://placehold.co/600x600?text=Otro producto',
          'unicornio_grande.jpg',
          54321,
          false,
        ),
      ],
      thumbnailImages: [
        img('img2', 'https://placehold.co/300x300?text=Tazón', 'unicornio.jpg', 12345, true),
      ],
      largeImages: [
        img(
          'img2',
          'https://placehold.co/600x600?text=Otro producto',
          'unicornio_grande.jpg',
          54321,
          false,
        ),
      ],
      visible: true,
      available: true,
      stock: 10,
    },
    createdTime: '2025-01-01T00:00:00.000Z',
  },
];
