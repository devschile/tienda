// Carga la configuración pública de la tienda desde NeonDB
// Fallback a valores por defecto si la función no responde

export interface StoreSettings {
  store_name: string;
  store_tagline: string;
  contact_email: string;
  store_open: string;         // 'true' | 'false'
  maintenance_message: string;
  shipping_enabled: string;   // 'true' | 'false'
  shipping_cost: string;      // CLP, ej. '3000'
  free_shipping_threshold: string; // CLP, ej. '30000' — 0 = siempre cobrar
}

export const SETTINGS_DEFAULTS: StoreSettings = {
  store_name: 'Tienda devsChile',
  store_tagline: 'Productos exclusivos de la comunidad',
  contact_email: 'huemul@devschile.cl',
  store_open: 'true',
  maintenance_message: 'Estamos preparando algo increíble. ¡Vuelve pronto!',
  shipping_enabled: 'true',
  shipping_cost: '3000',
  free_shipping_threshold: '30000',
};

export default async function loadSettings(): Promise<StoreSettings> {
  try {
    const res = await fetch('/.netlify/functions/get-settings');
    if (!res.ok) return SETTINGS_DEFAULTS;
    const { data } = await res.json();
    return { ...SETTINGS_DEFAULTS, ...data };
  } catch {
    return SETTINGS_DEFAULTS;
  }
}
