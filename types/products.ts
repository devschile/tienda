export interface ProductAttachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
  is_cover: boolean;
  width?: number;
  height?: number;
  thumbnails?: {
    small?: { url: string; width: number; height: number };
    large?: { url: string; width: number; height: number };
    full?: { url: string; width: number; height: number };
  };
}

export interface ProductFields {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  coverImage: ProductAttachment | null; // imagen visible en el card (is_cover=true)
  images: ProductAttachment[]; // todas las imágenes, cover primero (para el modal)
  thumbnailImages: ProductAttachment[]; // legacy — mantener para compatibilidad
  largeImages: ProductAttachment[]; // legacy — mantener para compatibilidad
  visible: boolean;
  available: boolean;
  stock: number;
  on_sale: boolean;
  /** true = producto a la venta antes de su lanzamiento. Excluyente con on_sale. */
  presale: boolean;
  long_description: string | null;
  sale_price: number | null;
  /** Incremento packs/addons — opcionales para no tocar productos existentes. */
  product_type?: 'standard' | 'bundle' | 'addon';
  selectable_in_bundles?: boolean;
  bundle_unit_price?: number | null;
  bundle_sizes?: number[] | null;
  bundle_allow_surprise?: boolean;
  /** false = el producto nunca ofrece envío a domicilio (ej. membresías digitales).
   * Opcional — ausente/undefined se trata como true (comportamiento actual). */
  shipping_enabled?: boolean;
  /** Tamaño del paquete que cobra el courier — determina el costo de envío
   * cuando este ítem es el más grande del carrito. Opcional, default 'xs'. */
  shipping_tier?: 'xs' | 's' | 'm' | 'l';
}

export interface ProductRecord {
  id: string;
  fields: ProductFields;
  createdTime: string;
}

export interface ProductResponse {
  records: ProductRecord[];
}
