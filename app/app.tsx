import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Info, ShoppingBag, ShoppingCart, Wrench } from 'lucide-react';

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
import type { BundleSelection } from '@/hooks/useCart';
import { CartDrawer } from '@/components/CartDrawer';
import { CheckoutModal } from '@/components/CheckoutModal';
import { checkoutDraftKey } from '@/lib/checkout-draft';
import { GoldMembershipCard } from '@/components/GoldMembershipCard';
import { BundleBuilder } from '@/components/BundleBuilder';
import { DevTools } from '@/components/DevTools';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { useSoyAuth, SOY_RETURN_TO_KEY } from '@/hooks/useSoyAuth';
import { maxShippingTier, shippingCostForTier } from '@/lib/shipping';
import { version } from '../package.json';
import posthog from '@/lib/posthog';

function ProductCardSkeleton() {
  return (
    <div className="bg-brand-surface/90 rounded-2xl overflow-hidden">
      <div className="aspect-square bg-brand-secondary/10 animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="h-3 w-16 bg-brand-secondary/10 rounded-full animate-pulse" />
        <div className="h-5 w-full bg-brand-secondary/10 rounded animate-pulse" />
        <div className="h-5 w-2/3 bg-brand-secondary/10 rounded animate-pulse" />
        <div className="h-4 w-full bg-brand-secondary/10 rounded animate-pulse mt-4" />
        <div className="h-10 w-full bg-brand-secondary/10 rounded-xl animate-pulse mt-2" />
      </div>
    </div>
  );
}

// Resuelve el id de producto desde la URL. Formas soportadas:
// - canónica:  /p/<id>  (path real — compartible, con OG server-side)
// - legacy:    #<id>    (deep-link con hash de versiones anteriores)
const parseProductIdFromUrl = (): string | null => {
  const pathMatch = window.location.pathname.match(/^\/p\/([^/]+)\/?$/);
  if (pathMatch) return pathMatch[1];
  const hash = window.location.hash.replace(/^#/, '');
  return hash || null;
};

function App() {
  const { toast } = useToast();
  const {
    settings,
    loading: settingsLoading,
    isOpen,
    shippingEnabled,
    shippingCost,
    shippingCosts,
    freeShippingThreshold,
  } = useStoreSettings();
  const [selectedProduct, setSelectedProduct] = useState<ProductRecord | null>(null);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [bundleProduct, setBundleProduct] = useState<ProductRecord | null>(null);
  const [bundleOpen, setBundleOpen] = useState(false);

  // Replace UIBakery hooks with standard React state
  const [productsData, setProductsData] = useState<ProductResponse | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [errorProducts, setErrorProducts] = useState<string | null>(null);
  const cart = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const soyAuth = useSoyAuth();

  useEffect(() => {
    if (!soyAuth.session) return;
    if (sessionStorage.getItem(SOY_RETURN_TO_KEY) !== 'checkout') return;
    sessionStorage.removeItem(SOY_RETURN_TO_KEY);
    setCartOpen(false);
    setCheckoutOpen(true);
  }, [soyAuth.session]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(() => {
    return new URLSearchParams(window.location.search).get('category');
  });
  const [sortOrder, setSortOrder] = useState<'default' | 'price-asc' | 'price-desc'>('default');

  useEffect(() => {
    const handlePopState = () => {
      setSelectedCategory(new URLSearchParams(window.location.search).get('category'));

      const id = parseProductIdFromUrl();
      const match = id ? productsData?.records.find((p) => p.id === id) : undefined;
      if (match && match.fields.product_type === 'bundle') {
        setSelectedProduct(null);
        setImageModalOpen(false);
        setBundleProduct(match);
        setBundleOpen(true);
      } else if (match) {
        setBundleProduct(null);
        setBundleOpen(false);
        setSelectedProduct(match);
        setImageModalOpen(true);
      } else {
        setImageModalOpen(false);
        setSelectedProduct(null);
        setBundleOpen(false);
        setBundleProduct(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [productsData]);

  const handleCategoryChange = (category: string | null) => {
    posthog.capture('category_selected', {
      category: category ?? 'all_products',
    });
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

  // Abrir el modal de un producto si la URL trae un id (deep link compartible).
  // Formas soportadas: /p/<id> (path real) y #<id> (legacy con hash).
  useEffect(() => {
    if (!loadingProducts && productsData && productsData.records.length > 0) {
      const id = parseProductIdFromUrl();
      if (id) {
        const match = productsData.records.find((p) => p.id === id);
        if (match && match.fields.product_type === 'bundle') {
          setSelectedProduct(null);
          setImageModalOpen(false);
          setBundleProduct(match);
          setBundleOpen(true);
        } else if (match) {
          setBundleProduct(null);
          setBundleOpen(false);
          setSelectedProduct(match);
          setImageModalOpen(true);
        } else {
          toast({
            title: 'Producto no encontrado',
            description: 'El producto que buscas ya no está disponible o el enlace es inválido.',
            variant: 'destructive',
          });
          const url = new URL(window.location.href);
          url.pathname = '/';
          url.hash = '';
          window.history.replaceState({}, '', url);
        }

        // Normaliza deep-links legacy (#<id>) a la URL canónica /p/<id>,
        // así la barra de direcciones siempre muestra el link compartible.
        if (match && window.location.hash) {
          const url = new URL(window.location.href);
          url.pathname = `/p/${id}`;
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

  // Empuja la URL canónica compartible /p/<id> para un producto abierto.
  const pushProductUrl = (productId: string) => {
    const url = new URL(window.location.href);
    url.pathname = `/p/${productId}`;
    url.hash = '';
    window.history.pushState({}, '', url);
  };

  const handleImageClick = (product: ProductRecord) => {
    posthog.capture('product_viewed', {
      product_id: product.id,
      category: product.fields.category || 'uncategorized',
      on_sale: product.fields.on_sale,
    });

    pushProductUrl(product.id);

    // Los packs abren directo el constructor de bundles, no el modal de detalle.
    if (product.fields.product_type === 'bundle') {
      setSelectedProduct(null);
      setImageModalOpen(false);
      setBundleProduct(product);
      setBundleOpen(true);
      return;
    }

    setBundleProduct(null);
    setBundleOpen(false);
    setSelectedProduct(product);
    setImageModalOpen(true);
  };

  const handleBuyClick = (product: ProductRecord, quantity: number) => {
    posthog.capture('product_added_to_cart', {
      product_id: product.id,
      category: product.fields.category || 'uncategorized',
      quantity,
      unit_price:
        product.fields.on_sale && product.fields.sale_price != null
          ? product.fields.sale_price
          : product.fields.price,
      on_sale: product.fields.on_sale,
    });
    cart.addItem(product, quantity);
    setCartOpen(true);
    toast({
      title: `${product.fields.name} agregado`,
      description: `${quantity} ${quantity === 1 ? 'unidad' : 'unidades'} en tu carrito`,
    });
  };

  const handleBuildBundle = (product: ProductRecord) => {
    setImageModalOpen(false);
    setSelectedProduct(null);
    setBundleProduct(product);
    setBundleOpen(true);
    pushProductUrl(product.id);
  };

  const handleAddBundle = (product: ProductRecord, bundle: BundleSelection) => {
    cart.addItem(product, 1, bundle);
    setCartOpen(true);
    toast({
      title: 'Pack agregado',
      description: `Pack de ${bundle.size} stickers en tu carrito`,
    });
  };

  const handleCheckout = async (customer: CustomerData) => {
    if (checkoutLoading) return;
    try {
      setCheckoutLoading(true);
      const items = cart.items.map((i) => ({
        productId: i.product.id,
        productName: i.product.fields.name,
        quantity: i.quantity,
        unitPrice: cart.unitPriceOf(i),
        originalPrice: i.product.fields.price,
        ...(i.bundle ? { bundle: i.bundle } : {}),
      }));

      // Agregar envio como ítem si aplica
      if (customer.shippingCost && customer.shippingCost > 0) {
        items.push({
          productId: 'shipping',
          productName: 'Envío a domicilio',
          quantity: 1,
          unitPrice: customer.shippingCost,
          originalPrice: customer.shippingCost,
        });
      }

      const data = await createPayment(items, customer);
      if (!data.success || !data.checkout_url) {
        throw new Error(data.error || 'No se pudo obtener la URL de pago');
      }
      posthog.capture('checkout_submitted', {
        item_count: cart.totalItems,
        cart_total: cart.totalAmount,
        delivery_selected: Boolean(customer.wantsDelivery),
        shipping_cost: customer.shippingCost ?? 0,
        newsletter_opt_in: Boolean(customer.wantsNewsletter),
      });
      // La llave se deriva de las lineIds: limpiarla antes de clearCart.
      sessionStorage.removeItem(checkoutDraftKey(cartKey));
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

  // Tier más grande del carrito: cuando se mezclan ítems, el más grande manda y
  // determina el costo de envío. null si ningún ítem permite envío.
  const cartShippingTier = maxShippingTier(
    cart.items.map((i) => ({
      shippingEnabled: i.product.fields.shipping_enabled,
      shippingTier: i.product.fields.shipping_tier,
    })),
  );
  const cartTierCost = cartShippingTier
    ? shippingCostForTier(cartShippingTier, shippingCosts, shippingCost)
    : shippingCost;
  // Si ningún producto del carrito admite envío (ej. solo membresías digitales),
  // el checkout ni siquiera pregunta por envío/dirección.
  const cartAllowsShipping = cart.items.some((i) => i.product.fields.shipping_enabled !== false);
  const cartKey = cart.items
    .map((i) => i.lineId)
    .sort()
    .join('|');
  // Los add-ons solo se habilitan si el subtotal ya cubre el costo de envío del
  // tier que manda en el carrito.
  const addonsUnlocked = !shippingEnabled || cart.totalAmount >= cartTierCost;
  const allProducts = (productsData?.records || []).filter(
    (p) => p.fields.visible && (p.fields.product_type !== 'addon' || addonsUnlocked),
  );
  // Ítems elegibles dentro de un pack (independiente de la gating de add-ons).
  // Cada pack filtra este pool por su propia lista curada (bundle_item_ids).
  const selectablePool = (productsData?.records || []).filter(
    (p) =>
      p.fields.selectable_in_bundles &&
      p.fields.available &&
      (p.fields.stock ?? 0) > 0 &&
      p.fields.product_type !== 'bundle',
  );
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

  // Maintenance page
  if (!settingsLoading && !isOpen) {
    return (
      <div className="min-h-screen bg-brand-background flex flex-col items-center justify-center gap-6 px-4">
        <div className="border-2 border-brand-primary/40 p-3 rounded-2xl">
          <img width={64} src={logo} alt="logo" />
        </div>
        <div className="text-center space-y-2 max-w-md">
          <h1 className="font-mono text-2xl font-bold text-brand-secondary">
            {settings.store_name}
          </h1>
          <p className="text-devs-muted">{settings.maintenance_message}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-devs-muted/60">
          <Wrench className="h-3.5 w-3.5" />
          En mantenimiento
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <motion.header
        className="bg-brand-surface/80 backdrop-blur-md shadow-sm border-b border-brand-secondary/20 sticky top-0 z-50"
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="border-2 border-brand-primary/40 p-2 rounded-xl">
                <img style={{ minWidth: 40 }} width={40} src={logo} />
              </div>
              <div>
                <h1 className="font-mono text-2xl sm:text-3xl font-bold leading-tight">
                  {settings.store_name}
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="bg-white/40 gap-1 border-brand-secondary/30 text-brand-primary hover:bg-brand-secondary/5 hover:border-brand-secondary/50 transition-all shadow-sm"
                onClick={() => setInfoModalOpen(true)}
              >
                <Info className="h-5 w-5 md:mr-2" />
                <span className="hidden sm:inline">Sobre devsChile</span>
              </Button>
              <Button
                variant="outline"
                className="bg-white/40 relative border-brand-secondary/30 text-brand-primary hover:bg-brand-secondary/5"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingCart className="h-5 w-5" />
                <AnimatePresence>
                  {cart.totalItems > 0 && (
                    <motion.span
                      key={cart.totalItems}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: 'spring', bounce: 0.6, duration: 0.3 }}
                      className="absolute -top-1.5 -right-1.5 bg-green-700 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      {cart.totalItems > 9 ? '9+' : cart.totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Hero banner
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6"></div>*/}

      {/* Main Content */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16">
        <GoldMembershipCard />

        {loadingProducts && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
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
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', bounce: 0.3 }}
            className="bg-brand-surface/80 backdrop-blur-sm border-2 border-brand-secondary/20 rounded-2xl p-12 text-center shadow-lg"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-secondary/10 rounded-full mb-6">
              <ShoppingBag className="h-10 w-10 text-brand-secondary" />
            </div>
            <h3 className="font-mono text-xl font-bold text-devs-text mb-2">
              No hay productos disponibles
            </h3>
            <p className="text-devs-text/70">
              Pronto tendré nuevas creaciones disponibles. ¡Vuelve pronto!
            </p>
          </motion.div>
        )}

        {!loadingProducts && allProducts.length > 0 && (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-8 mt-4">
              {/* Pill "Todos" */}
              <button
                onClick={() => handleCategoryChange(null)}
                className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-150 shadow-sm ${
                  selectedCategory === null
                    ? 'text-white'
                    : 'text-devs-text border border-brand-secondary/30 bg-brand-surface hover:bg-brand-accent/20'
                }`}
              >
                {selectedCategory === null && (
                  <motion.span
                    layoutId="category-active-bg"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10">Todos</span>
              </button>

              {uniqueCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category as string)}
                  className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors duration-150 shadow-sm ${
                    selectedCategory === category
                      ? 'text-white'
                      : 'text-devs-text border border-brand-secondary/30 bg-brand-surface hover:bg-brand-accent/20'
                  }`}
                >
                  {selectedCategory === category && (
                    <motion.span
                      layoutId="category-active-bg"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-primary to-brand-secondary"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10">{category}</span>
                </button>
              ))}

              <select
                value={sortOrder}
                onChange={(e) => {
                  const selectedSortOrder = e.target.value as
                    | 'default'
                    | 'price-asc'
                    | 'price-desc';
                  posthog.capture('catalog_sort_selected', {
                    sort_order: selectedSortOrder,
                  });
                  setSortOrder(selectedSortOrder);
                }}
                className="ml-auto rounded-full shadow-sm border border-brand-secondary/30 bg-white text-devs-text text-sm px-3 py-1.5 outline-none focus:border-brand-secondary/50 focus:ring-2 focus:ring-brand-secondary/20 transition-all cursor-pointer"
              >
                <option value="default">Ordenar por</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
              </select>
            </div>

            <div className="flex items-center justify-between mb-6">
              <motion.h2
                key={selectedCategory ?? 'all'}
                className="font-mono text-2xl font-bold text-devs-text"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
              >
                {selectedCategory ? `Productos: ${selectedCategory}` : 'Todos los Productos'}
              </motion.h2>
              <motion.div
                className="text-right"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
              >
                <p className="text-sm text-brand-secondary font-medium">
                  {availableCount} producto{availableCount === 1 ? '' : 's'} disponible
                  {availableCount === 1 ? '' : 's'}
                </p>
                <p className="text-xs text-devs-text/50">
                  {totalCount} producto{totalCount === 1 ? '' : 's'} en total
                </p>
              </motion.div>
            </div>

            {filteredProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', bounce: 0.3 }}
                className="bg-brand-surface/80 backdrop-blur-sm border-2 border-brand-secondary/20 rounded-2xl p-12 text-center shadow-lg"
              >
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
              </motion.div>
            ) : (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
                layout
              >
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.94, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.94, y: -10 }}
                      transition={{ type: 'spring', bounce: 0.25, duration: 0.45 }}
                    >
                      <ProductCard
                        product={product}
                        onImageClick={handleImageClick}
                        onBuyClick={handleBuyClick}
                        onCategoryClick={handleCategoryChange}
                        onBuildBundle={handleBuildBundle}
                        addonLocked={product.fields.product_type === 'addon' && !addonsUnlocked}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <motion.footer
        className="relative bg-brand-surface/60 backdrop-blur-sm border-t border-brand-secondary/20 mt-12"
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center space-y-1">
            <p className="text-sm text-devs-text/70">
              © {new Date().getFullYear()} Tienda devsChile. Todos los derechos reservados.{' '}
              <span className="text-devs-muted/50 font-mono">v{version}</span>
            </p>
          </div>
        </div>
      </motion.footer>

      {/* Modals */}
      <ProductImageModal
        product={selectedProduct}
        open={imageModalOpen}
        onOpenChange={(open) => {
          setImageModalOpen(open);
          if (!open) {
            setSelectedProduct(null);
            const url = new URL(window.location.href);
            const isProductPath = /^\/p\/[^/]+\/?$/.test(url.pathname);
            if (isProductPath || url.hash) {
              if (isProductPath) url.pathname = '/';
              url.hash = '';
              window.history.pushState({}, '', url);
            }
          }
        }}
        onBuyClick={handleBuyClick}
        onBuildBundle={handleBuildBundle}
      />

      <InfoModal open={infoModalOpen} onOpenChange={setInfoModalOpen} />

      {bundleProduct && (
        <BundleBuilder
          product={bundleProduct}
          open={bundleOpen}
          onOpenChange={(open) => {
            setBundleOpen(open);
            if (!open) {
              const url = new URL(window.location.href);
              const isProductPath = /^\/p\/[^/]+\/?$/.test(url.pathname);
              if (isProductPath || url.hash) {
                if (isProductPath) url.pathname = '/';
                url.hash = '';
                window.history.pushState({}, '', url);
              }
            }
          }}
          items={selectablePool.filter(
            (p) => bundleProduct.fields.bundle_item_ids?.includes(p.id) ?? false,
          )}
          onAddToCart={handleAddBundle}
        />
      )}

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
        key={cartKey}
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        totalAmount={cart.totalAmount}
        onSubmit={handleCheckout}
        loading={checkoutLoading}
        shippingEnabled={shippingEnabled}
        shippingCost={shippingCost}
        shippingCosts={shippingCosts}
        cartShippingTier={cartShippingTier}
        freeShippingThreshold={freeShippingThreshold}
        cartAllowsShipping={cartAllowsShipping}
        cartKey={cartKey}
        soy={soyAuth.session}
        soyVerifying={soyAuth.busy || soyAuth.refreshing}
        soyStale={soyAuth.refreshOutcome === 'unavailable'}
        onRefreshSoy={soyAuth.refresh}
        onVerifySoy={soyAuth.verify}
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
