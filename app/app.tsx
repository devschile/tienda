import { useState, useEffect } from 'react';
import { Info, Loader2, ShoppingBag, ShoppingCart } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/ProductCard';
import { ProductImageModal } from '@/components/ProductImageModal';
import { InfoModal } from '@/components/InfoModal';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import type { ProductRecord, ProductResponse } from '@/types/products';
import logo from '@/images/devschile2026.png';
import createPayment from '@/actions/createPayment';
import type { CustomerData } from '@/actions/createPayment';
import loadProducts, { productsMockFallback } from '@/actions/loadProducts';
import { useCart } from '@/hooks/useCart';
import { CartDrawer } from '@/components/CartDrawer';
import { CheckoutModal } from '@/components/CheckoutModal';
import { DevTools } from '@/components/DevTools';

function App() {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<ProductRecord | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  // Replace UIBakery hooks with standard React state
  const [productsData, setProductsData] = useState<ProductResponse | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProducts, setErrorProducts] = useState<string | null>(null);
  const cart = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get('category');
  });
  const [sortOrder, setSortOrder] = useState<'default' | 'price-asc' | 'price-desc'>('default');

  useEffect(() => {
    const handlePopState = () => {
      setSelectedCategory(new URLSearchParams(window.location.search).get('category'));

      const hashId = window.location.hash.replace('#', '');
      const match = hashId ? productsData?.records.find((p) => p.id === hashId) : undefined;
      if (match) {
        setSelectedProduct(match);
        setImageModalOpen(true);
      } else {
        setImageModalOpen(false);
        setSelectedProduct(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [productsData]);

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    const url = new URL(window.location.href);
    if (category) {
      url.searchParams.set('category', category);
    } else {
      url.searchParams.delete('category');
    }
    window.history.pushState({}, '', url);
  };

  // Process and validate categories
  useEffect(() => {
    if (!loadingProducts && productsData && productsData.records.length > 0) {
      if (selectedCategory) {
        const matches = productsData.records.filter((p) => p.fields.category === selectedCategory);
        if (matches.length === 0) {
          toast({
            title: 'Categoría no encontrada',
            description: `No hay productos en la categoría "${selectedCategory}".`,
            variant: 'destructive',
          });
          handleCategoryChange(null);
        }
      }
    }
  }, [loadingProducts, productsData, selectedCategory, toast]);

  // Abrir el modal de un producto si la URL trae un hash con su id
  // (deep link para compartir el link de un producto específico)
  useEffect(() => {
    if (!loadingProducts && productsData && productsData.records.length > 0) {
      const hashId = window.location.hash.replace('#', '');
      if (hashId) {
        const match = productsData.records.find((p) => p.id === hashId);
        if (match) {
          setSelectedProduct(match);
          setImageModalOpen(true);
        } else {
          toast({
            title: 'Producto no encontrado',
            description: 'El producto que buscas ya no está disponible o el enlace es inválido.',
            variant: 'destructive',
          });
          const url = new URL(window.location.href);
          url.hash = '';
          window.history.replaceState({}, '', url);
        }
      }
    }
  }, [loadingProducts, productsData, toast]);

  // Load products on component mount (desde NeonDB vía Netlify Function,
  // con fallback automático a productsMock si la función no responde)
  useEffect(() => {
    const loadProductsData = async () => {
      try {
        setLoadingProducts(true);
        setErrorProducts(null);

        const data = await loadProducts();
        setProductsData(data);
      } catch (error) {
        console.error('Error loading products, using fallback mock data:', error);
        setProductsData(productsMockFallback);
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

    const url = new URL(window.location.href);
    url.hash = product.id;
    window.history.pushState({}, '', url);
  };

  const handleBuyClick = (product: ProductRecord, quantity: number) => {
    cart.addItem(product, quantity);
    setCartOpen(true);
    toast({
      title: `${product.fields.name} agregado`,
      description: `${quantity} ${quantity === 1 ? 'unidad' : 'unidades'} en tu carrito`,
    });
  };

  const handleCheckout = async (customer: CustomerData) => {
    if (checkoutLoading) return;
    try {
      setCheckoutLoading(true);
      const data = await createPayment(
        cart.items.map((i) => ({
          productId: i.product.id,
          productName: i.product.fields.name,
          quantity: i.quantity,
          unitPrice: i.product.fields.price,
        })),
        customer,
      );
      if (!data.success || !data.checkout_url) {
        throw new Error(data.error || 'No se pudo obtener la URL de pago');
      }
      cart.clearCart();
      window.location.href = data.checkout_url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast({
        title: 'Error al procesar el pago',
        description: 'Intenta nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setCheckoutLoading(false);
    }
  };

  const allProducts = (productsData?.records || []).filter((p) => p.fields.visible);
  const uniqueCategories = Array.from(
    new Set(allProducts.map((p) => p.fields.category).filter(Boolean)),
  ).sort();

  const filteredByCategory = selectedCategory
    ? allProducts.filter((p) => p.fields.category === selectedCategory)
    : allProducts;

  const filteredProducts = [...filteredByCategory].sort((a, b) => {
    if (sortOrder === 'price-asc') return a.fields.price - b.fields.price;
    if (sortOrder === 'price-desc') return b.fields.price - a.fields.price;
    return 0;
  });

  const availableProducts = filteredProducts.filter((product) => product.fields.available);
  const totalCount = filteredProducts.length;
  const availableCount = availableProducts.length;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-brand-surface/80 backdrop-blur-md shadow-sm border-b border-brand-secondary/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="border-2 border-brand-primary/40 p-2 rounded-xl">
                <img style={{ minWidth: 40 }} width={50} src={logo} />
              </div>
              <div>
                <h1 className="font-mono text-2xl sm:text-3xl font-bold">Tienda devsChile</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="gap-1 border-brand-secondary/30 text-brand-primary hover:bg-brand-secondary/5 hover:border-brand-secondary/50 transition-all shadow-sm"
                onClick={() => setInfoModalOpen(true)}
              >
                <Info className="h-5 w-5 mr-2" />
                <span className="hidden sm:inline">Sobre</span>devsChile
              </Button>
              <Button
                variant="outline"
                className="relative border-brand-secondary/30 text-brand-primary hover:bg-brand-secondary/5"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingCart className="h-5 w-5" />
                {cart.totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-brand-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {cart.totalItems > 9 ? '9+' : cart.totalItems}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero banner
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6"></div>*/}

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
          <div className="bg-brand-surface/80 backdrop-blur-sm border-2 border-brand-secondary/20 rounded-2xl p-12 text-center shadow-lg">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-secondary/10 rounded-full mb-6">
              <ShoppingBag className="h-10 w-10 text-brand-secondary" />
            </div>
            <h3 className="font-mono text-xl font-bold text-devs-text mb-2">
              No hay productos disponibles
            </h3>
            <p className="text-devs-text/70">
              Pronto tendré nuevas creaciones disponibles. ¡Vuelve pronto!
            </p>
          </div>
        )}

        {!loadingProducts && allProducts.length > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-8 mt-4">
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                className={`rounded-full shadow-sm transition-all duration-300 ${selectedCategory === null ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white border-transparent' : 'text-devs-text border-brand-secondary/30 bg-brand-surface hover:bg-brand-accent/20'}`}
                onClick={() => handleCategoryChange(null)}
              >
                Todos
              </Button>
              {uniqueCategories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? 'default' : 'outline'}
                  size="sm"
                  className={`rounded-full shadow-sm transition-all duration-300 ${selectedCategory === category ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white border-transparent' : 'text-devs-text border-brand-secondary/30 bg-brand-surface hover:bg-brand-accent/20'}`}
                  onClick={() => handleCategoryChange(category as string)}
                >
                  {category}
                </Button>
              ))}
              <select
                value={sortOrder}
                onChange={(e) =>
                  setSortOrder(e.target.value as 'default' | 'price-asc' | 'price-desc')
                }
                className="ml-auto rounded-full shadow-sm border border-brand-secondary/30 bg-brand-surface text-devs-text text-sm px-3 py-1.5 outline-none focus:border-brand-secondary/50 focus:ring-2 focus:ring-brand-secondary/20 transition-all cursor-pointer"
              >
                <option value="default">Ordenar por</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
              </select>
            </div>

            <div className="flex items-center justify-between mb-6">
              <h2 className="font-mono text-2xl font-bold text-devs-text">
                {selectedCategory ? `Productos: ${selectedCategory}` : 'Todos los Productos'}
              </h2>
              <div className="text-right">
                <p className="text-sm text-brand-secondary font-medium">
                  {availableCount} producto{availableCount === 1 ? '' : 's'} disponible
                  {availableCount === 1 ? '' : 's'}
                </p>
                <p className="text-xs text-devs-text/50">
                  {totalCount} producto{totalCount === 1 ? '' : 's'} en total
                </p>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-brand-surface/80 backdrop-blur-sm border-2 border-brand-secondary/20 rounded-2xl p-12 text-center shadow-lg">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-secondary/10 rounded-full mb-6">
                  <ShoppingBag className="h-10 w-10 text-brand-secondary" />
                </div>
                <h3 className="font-mono text-xl font-bold text-devs-text mb-2">
                  No hay productos en esta categoría
                </h3>
                <p className="text-devs-text/70 mb-6">
                  Intenta seleccionar otra categoría o ver todos los productos.
                </p>
                <Button
                  onClick={() => handleCategoryChange(null)}
                  className="bg-brand-primary text-white"
                >
                  Ver Todos los Productos
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onImageClick={handleImageClick}
                    onBuyClick={handleBuyClick}
                    onCategoryClick={handleCategoryChange}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="relative bg-brand-surface/60 backdrop-blur-sm border-t border-brand-secondary/20 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center">
            <p className="text-sm text-devs-text/70">
              © {new Date().getFullYear()} Tienda devsChile. Todos los derechos reservados.
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
          if (!open) {
            setSelectedProduct(null);
            if (window.location.hash) {
              const url = new URL(window.location.href);
              url.hash = '';
              window.history.pushState({}, '', url);
            }
          }
        }}
      />

      <InfoModal open={infoModalOpen} onOpenChange={setInfoModalOpen} />

      <CartDrawer
        open={cartOpen}
        onOpenChange={setCartOpen}
        items={cart.items}
        totalAmount={cart.totalAmount}
        onUpdateQuantity={cart.updateQuantity}
        onRemoveItem={cart.removeItem}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      <CheckoutModal
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        totalAmount={cart.totalAmount}
        onSubmit={handleCheckout}
        loading={checkoutLoading}
      />

      <Toaster />

      {import.meta.env.DEV && (
        <DevTools
          onTestCart={() => {
            if (allProducts[0]) cart.addItem(allProducts[0], 1);
            setCartOpen(true);
          }}
          onTestCheckout={() => {
            if (allProducts[0]) cart.addItem(allProducts[0], 1);
            setCartOpen(false);
            setCheckoutOpen(true);
          }}
        />
      )}
    </div>
  );
}

export default App;
