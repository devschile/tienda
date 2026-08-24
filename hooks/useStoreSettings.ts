import { useState, useEffect } from 'react';
import loadSettings, { SETTINGS_DEFAULTS, type StoreSettings } from '@/actions/loadSettings';
import { SHIPPING_TIERS, type ShippingTierCosts } from '@/lib/shipping';

interface UseStoreSettings {
  settings: StoreSettings;
  loading: boolean;
  // helpers parseados
  isOpen: boolean;
  shippingEnabled: boolean;
  shippingCost: number;
  /** Costos absolutos por tier (claves shipping_cost_*) desde settings. */
  shippingCosts: Partial<ShippingTierCosts>;
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

  const shippingCosts = Object.fromEntries(
    SHIPPING_TIERS.map((t) => [t, parseInt(settings[`shipping_cost_${t}`], 10) || 0]),
  ) as Partial<ShippingTierCosts>;

  return {
    settings,
    loading,
    isOpen: settings.store_open === 'true',
    shippingEnabled: settings.shipping_enabled === 'true',
    shippingCost: parseInt(settings.shipping_cost, 10) || 0,
    shippingCosts,
    freeShippingThreshold: parseInt(settings.free_shipping_threshold, 10) || 0,
  };
}
