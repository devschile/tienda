export const productsMock = [
    {
        id: 'rec1',
        fields: {
            id: 'rec1',
            nombre: 'Set de stickers',
            precio: 5000,
            descripcion: 'Stickers oficiales de devsChile',
            imagen_miniatura: [{
                id: 'img1',
                url: 'https://placehold.co/300x300?text=Stickers devsChile',
                filename: 'osito.jpg',
                size: 12345,
                type: 'image/jpeg'
            }],
            imagenes_grandes: [{
                id: 'img1',
                url: 'https://placehold.co/600x600?text=Osito+Grande',
                filename: 'osito_grande.jpg',
                size: 54321,
                type: 'image/jpeg'
            }],
            activo: true
        },
        createdTime: '2025-01-01T00:00:00.000Z'
    },
    {
        id: 'rec2',
        fields: {
            id: 'rec2',
            nombre: 'Destapabotellas con imán',
            precio: 30000,
            descripcion: 'Mágico unicornio multicolor',
            imagen_miniatura: [{
                id: 'img2',
                url: 'https://placehold.co/300x300?text=Destapabotellas',
                filename: 'unicornio.jpg',
                size: 12345,
                type: 'image/jpeg'
            }],
            imagenes_grandes: [{
                id: 'img2',
                url: 'https://placehold.co/600x600?text=Otro producto',
                filename: 'unicornio_grande.jpg',
                size: 54321,
                type: 'image/jpeg'
            }],
            activo: false
        },
        createdTime: '2025-01-01T00:00:00.000Z'
    }
]
