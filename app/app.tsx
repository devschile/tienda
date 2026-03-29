// Aplicación principal de ecommerce - Diseño comercial cálido
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/ProductCard';
import { ProductImageModal } from '@/components/ProductImageModal';
import { InfoModal } from '@/components/InfoModal';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import type { ProductRecord, ProductResponse } from '@/types/products';
import { Info, Loader2, ShoppingBag } from 'lucide-react';

import { productsMock as records } from '@/app/productsMock.ts';
import logo from '@/images/devschile2026.png';
import createPayment from '@/actions/createPayment';

const API_CONFIG = {
  apiUrl: import.meta.env.VITE_API_URL || 'https://api.example.com/v1',
};

function App() {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<ProductRecord | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  // Replace UIBakery hooks with standard React state
  const [productsData, setProductsData] = useState<ProductResponse | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProducts, setErrorProducts] = useState<string | null>(null);
  const [loadingPayment, setLoadingPayment] = useState(false);

  // Load products on component mount
  useEffect(() => {
    const loadProductsData = async () => {
      try {
        setLoadingProducts(true);
        setErrorProducts(null);

        // In development, use mock data
        if (import.meta.env.DEV) {
          console.log('Using mock products data for development');
          setProductsData({ records });
          return;
        }

        const response = await fetch(`${API_CONFIG.apiUrl}/products`);

        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }

        const data: ProductResponse = await response.json();
        setProductsData(data);
      } catch (error) {
        console.error('Error loading products:', error);
        setErrorProducts('Error loading products');
        // Fallback to mock data
        setProductsData({ records });
        setErrorProducts(null);
      } finally {
        setLoadingProducts(false);
      }
    };

    loadProductsData();
  }, []);

  const handleImageClick = (product: ProductRecord) => {
    setSelectedProduct(product);
    setImageModalOpen(true);
  };

  const handleBuyClick = async (product: ProductRecord) => {
    try {
      setLoadingPayment(true);

      toast({
        title: 'Preparando pago...',
        description: `Creando preferencia de pago para ${product.fields.nombre}...`,
      });
      // Llamamos a la función referenciada para crear el pago
      const data = await createPayment(product.fields.precio, product.fields.nombre, product.id);

      if (!data.success || !data.checkout_url) {
        throw new Error(data.error || 'No se pudo obtener la URL de pago');
      }

      toast({
        title: '¡Redirigiendo a MercadoPago!',
        description: `Serás redirigido para completar el pago de ${product.fields.nombre}`,
      });

      // Redirect to MercadoPago checkout
      window.location.href = data.checkout_url;
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Error en la compra',
        description: 'No se pudo procesar el pago. Verifica tu conexión e intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setLoadingPayment(false);
    }
  };

  const allProducts = productsData?.records || [];
  const availableProducts = allProducts.filter((product) => product.fields.activo);
  const totalCount = allProducts.length;
  const availableCount = availableProducts.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-secondary/5 via-brand-primary/5 to-brand-secondary/5">
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-secondary/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-brand-secondary/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-brand-primary to-brand-secondary p-2 rounded-xl">
                <img width={50} src={logo} />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
                  Tienda devsChile
                </h1>
                <p className="text-sm text-brand-secondary/80 font-medium">[text]</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="border-brand-secondary/30 text-brand-primary hover:bg-brand-secondary/5 hover:border-brand-secondary/50 transition-all shadow-sm"
              onClick={() => setInfoModalOpen(true)}
            >
              <Info className="h-5 w-5 mr-2" />
              Sobre Mí
            </Button>
          </div>
        </div>
      </header>

      {/* Hero banner */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6"></div>

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        {loadingProducts && (
          <div className="flex flex-col justify-center items-center min-h-[400px]">
            <Loader2 className="h-16 w-16 animate-spin text-brand-secondary/60 mb-4" />
            <p className="text-brand-secondary font-medium">Cargando productos mágicos...</p>
          </div>
        )}

        {errorProducts && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center shadow-lg">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <p className="text-red-800 font-semibold text-lg mb-2">Oops, algo salió mal</p>
            <p className="text-red-600 text-sm">
              No pudimos cargar los productos. Verifica tu conexión e intenta nuevamente.
            </p>
          </div>
        )}

        {!loadingProducts && !errorProducts && allProducts.length === 0 && (
          <div className="bg-white/80 backdrop-blur-sm border-2 border-brand-secondary/20 rounded-2xl p-12 text-center shadow-lg">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-secondary/10 rounded-full mb-6">
              <ShoppingBag className="h-10 w-10 text-brand-secondary" />
            </div>
            <h3 className="text-xl font-bold text-brand-text mb-2">No hay productos disponibles</h3>
            <p className="text-brand-text/70">
              Pronto tendré nuevas creaciones disponibles. ¡Vuelve pronto!
            </p>
          </div>
        )}

        {!loadingProducts && allProducts.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-brand-text">Mis Creaciones</h2>
              <div className="text-right">
                <p className="text-sm text-brand-secondary font-medium">
                  {availableCount} {availableCount === 1 ? 'producto' : 'productos'} disponible
                  {availableCount === 1 ? '' : 's'}
                </p>
                <p className="text-xs text-brand-text/50">
                  {totalCount} {totalCount === 1 ? 'producto hecho' : 'productos hechos'} en total
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
      <footer className="relative bg-white/60 backdrop-blur-sm border-t border-brand-secondary/20 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-brand-text/70 mb-2">
              © {new Date().getFullYear()} Tienda devsChile. Todos los derechos reservados.
            </p>
            <p className="text-xs text-brand-secondary"></p>
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
