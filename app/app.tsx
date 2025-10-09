// Aplicación principal de ecommerce - Diseño comercial cálido
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/ProductCard';
import { ProductImageModal } from '@/components/ProductImageModal';
import { InfoModal } from '@/components/InfoModal';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import type { AirtableRecord, AirtableResponse } from '@/types/products';
import { Info, Loader2, Heart, ShoppingBag, Sparkles } from 'lucide-react';

const AIRTABLE_CONFIG = {
  apiKey: import.meta.env.VITE_AIRTABLE_API_KEY,
  baseId: import.meta.env.VITE_AIRTABLE_BASE_ID,
  tableName: import.meta.env.VITE_AIRTABLE_TABLE_NAME,
};

const PAYMENT_GATEWAY_URL = import.meta.env.VITE_PAYMENT_GATEWAY_URL;

function App() {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<AirtableRecord | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  
  // Replace UIBakery hooks with standard React state
  const [productsData, setProductsData] = useState<AirtableResponse | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProducts, setErrorProducts] = useState<string | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);

  // Load products on component mount
  useEffect(() => {
    const loadProductsData = async () => {
      try {
        setLoadingProducts(true);
        setErrorProducts(null);
        
        // Simulate API call - replace with actual Airtable API call
        const response = await fetch(
          `https://api.airtable.com/v0/${AIRTABLE_CONFIG.baseId}/${AIRTABLE_CONFIG.tableName}`,
          {
            headers: {
              'Authorization': `Bearer ${AIRTABLE_CONFIG.apiKey}`,
            },
          }
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        
        const data: AirtableResponse = await response.json();
        setProductsData(data);
      } catch (error) {
        console.error('Error loading products:', error);
        setErrorProducts('Error loading products');
        // For demo purposes, set some mock data
        setProductsData({
          records: [
            {
              id: 'rec1',
              fields: {
                id: 'rec1',
                nombre: 'Amigurumi Osito',
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
                nombre: 'Amigurumi Unicornio',
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
        });
        setErrorProducts(null);
      } finally {
        setLoadingProducts(false);
      }
    };
    
    loadProductsData();
  }, []);

  const handleImageClick = (product: AirtableRecord) => {
    setSelectedProduct(product);
    setImageModalOpen(true);
  };

  const handleBuyClick = async (product: AirtableRecord) => {
    try {
      setLoadingPayment(true);
      
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would redirect to a payment gateway
      const paymentUrl = `${PAYMENT_GATEWAY_URL}?amount=${product.fields.precio}&product=${encodeURIComponent(product.fields.nombre)}`;
      console.log('Payment URL:', paymentUrl);
      
      toast({
        title: '¡Redirigiendo al pago!',
        description: `Procesando compra de ${product.fields.nombre}...`,
      });
      
      // For demo purposes, just show success message
      setTimeout(() => {
        toast({
          title: '¡Compra simulada exitosa!',
          description: `${product.fields.nombre} - $${product.fields.precio.toLocaleString()}`,
        });
      }, 2000);
      
    } catch (error) {
      toast({
        title: 'Error en la compra',
        description: 'No se pudo procesar el pago. Intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPayment(false);
    }
  };

  const allProducts = productsData?.records || [];
  const availableProducts = allProducts.filter(product => product.fields.activo);
  const totalCount = allProducts.length;
  const availableCount = availableProducts.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-md shadow-sm border-b border-orange-100/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-rose-400 to-orange-400 p-2 rounded-xl">
                <Heart className="h-6 w-6 text-white fill-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-orange-600 bg-clip-text text-transparent">
                  Amigurumis de Inés
                </h1>
                <p className="text-sm text-orange-600/80 font-medium">Hechos con amor y dedicación</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300 transition-all shadow-sm"
              onClick={() => setInfoModalOpen(true)}
            >
              <Info className="h-5 w-5 mr-2" />
              Sobre Mí
            </Button>
          </div>
        </div>
      </header>

      {/* Hero banner */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        <div className="bg-gradient-to-r from-rose-500 to-orange-500 rounded-2xl p-8 text-white shadow-xl overflow-hidden relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6bTAgMTBjMC0yLjIxIDEuNzktNCA0LTRzNCAxLjc5IDQgNC0xLjc5IDQtNCA0LTQtMS43OS00LTR6TTI0IDI0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Sparkles className="h-5 w-5" />
                <span className="text-sm font-semibold uppercase tracking-wide">Colección Especial</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Mis Creaciones Únicas para Ti</h2>
              <p className="text-orange-50 max-w-xl">Cada amigurumi lo tejo a mano con amor, cuidado y los mejores materiales</p>
            </div>
            <ShoppingBag className="h-24 w-24 text-white/20 hidden md:block" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        {loadingProducts && (
          <div className="flex flex-col justify-center items-center min-h-[400px]">
            <Loader2 className="h-16 w-16 animate-spin text-orange-400 mb-4" />
            <p className="text-orange-600 font-medium">Cargando amigurumis mágicos...</p>
          </div>
        )}

        {errorProducts && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center shadow-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <p className="text-red-800 font-semibold text-lg mb-2">
              Oops, algo salió mal
            </p>
            <p className="text-red-600 text-sm">
              No pudimos cargar los amigurumis. Verifica tu configuración de Airtable.
            </p>
          </div>
        )}

        {!loadingProducts && !errorProducts && allProducts.length === 0 && (
          <div className="bg-white/80 backdrop-blur-sm border-2 border-orange-100 rounded-2xl p-12 text-center shadow-lg">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-6">
              <ShoppingBag className="h-10 w-10 text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              No hay amigurumis disponibles
            </h3>
            <p className="text-gray-600">
              Pronto tendré nuevas creaciones disponibles. ¡Vuelve pronto!
            </p>
          </div>
        )}

        {!loadingProducts && allProducts.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Mis Creaciones
              </h2>
              <div className="text-right">
                <p className="text-sm text-orange-600 font-medium">
                  {availableCount} {availableCount === 1 ? 'amigurumi' : 'amigurumis'} disponibles
                </p>
                <p className="text-xs text-gray-500">
                  {totalCount} {totalCount === 1 ? 'amigurumi hecho' : 'amigurumis hechos'} en total
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
              {allProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onImageClick={handleImageClick}
                  onBuyClick={handleBuyClick}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="relative bg-white/60 backdrop-blur-sm border-t border-orange-100 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              © 2025 Amigurumis de Inés. Todos los derechos reservados.
            </p>
            <p className="text-xs text-orange-600">
              Hecho con ❤️ y mucho cariño
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ProductImageModal
        product={selectedProduct}
        open={imageModalOpen}
        onOpenChange={(open) => {
          setImageModalOpen(open);
          if (!open) setSelectedProduct(null);
        }}
      />

      <InfoModal open={infoModalOpen} onOpenChange={setInfoModalOpen} />

      <Toaster />
    </div>
  );
}

export default App;
