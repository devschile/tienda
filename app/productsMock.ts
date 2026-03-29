export const productsMock = [
    {
        id: 'rec1',
        fields: {
            id: 'rec1',
            nombre: 'Producto Osito',
            precio: 25000,
            descripcion: 'Adorable osito tejido a mano',
            imagen_miniatura: [{
                id: 'img1',
                url: 'https://via.placeholder.com/300x300?text=Osito',
                filename: 'osito.jpg',
                size: 12345,
                type: 'image/jpeg'
            }],
            imagenes_grandes: [{
                id: 'img1',
                url: 'https://via.placeholder.com/600x600?text=Osito+Grande',
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
            nombre: 'Producto Unicornio',
            precio: 30000,
            descripcion: 'Mágico unicornio multicolor',
            imagen_miniatura: [{
                id: 'img2',
                url: 'https://via.placeholder.com/300x300?text=Unicornio',
                filename: 'unicornio.jpg',
                size: 12345,
                type: 'image/jpeg'
            }],
            imagenes_grandes: [{
                id: 'img2',
                url: 'https://via.placeholder.com/600x600?text=Unicornio+Grande',
                filename: 'unicornio_grande.jpg',
                size: 54321,
                type: 'image/jpeg'
            }],
            activo: false
        },
        createdTime: '2025-01-01T00:00:00.000Z'
    }
]
