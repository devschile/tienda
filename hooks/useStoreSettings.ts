import { useState, useEffect } from 'react';
import loadSettings, { SETTINGS_DEFAULTS, type StoreSettings } from '@/actions/loadSettings';

interface UseStoreSettings {
  settings: StoreSettings;
  loading: boolean;
  // helpers parseados
  isOpen: boolean;
  shippingEnabled: boolean;
  shippingCost: number;
  freeShippingThreshold: number;
}

export function useStoreSettings(): UseStoreSettings {
  const [settings, setSettings] = useState<StoreSettings>(SETTINGS_DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings()
      .then((s) => setSettings(s))
      .finally(() => setLoading(false));
  }, []);

  return {
    settings,
    loading,
    isOpen: settings.store_open === 'true',
    shippingEnabled: settings.shipping_enabled === 'true',
    shippingCost: parseInt(settings.shipping_cost, 10) || 0,
    freeShippingThreshold: parseInt(settings.free_shipping_threshold, 10) || 0,
  };
}
