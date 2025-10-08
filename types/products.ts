// Tipos para los productos
export interface AirtableAttachment {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
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
  nombre: string;
  descripcion: string;
  precio: number;
  imagen_miniatura: AirtableAttachment[];
  imagenes_grandes: AirtableAttachment[];
  activo: boolean;
}

export interface AirtableRecord {
  id: string;
  fields: ProductFields;
  createdTime: string;
}

export interface AirtableResponse {
  records: AirtableRecord[];
}
