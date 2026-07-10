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
}

export interface ProductRecord {
  id: string;
  fields: ProductFields;
  createdTime: string;
}

export interface ProductResponse {
  records: ProductRecord[];
}
