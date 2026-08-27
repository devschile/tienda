import { useCallback, useEffect, useRef, useState } from 'react';
import {
  SoyApiError,
  clearSoySession,
  exchangeSoyCode,
  loadSoySession,
  matchSoyNonce,
  refreshSoySession,
  rememberSoyNonce,
  soyAuthorizeUrl,
  saveSoySession,
  type SoySession,
} from '@/actions/soyAuth';
import posthog from '@/lib/posthog';
import { toast } from '@/hooks/use-toast';

export const SOY_RETURN_TO_KEY = 'soy.returnTo';

export function useSoyAuth() {
  const [session, setSession] = useState<SoySession | null>(loadSoySession);
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const exchangeStartedRef = useRef(false);
  const refreshInFlightRef = useRef(false);

  const [refreshOutcome, setRefreshOutcome] = useState<'ok' | 'expired' | 'unavailable' | null>(
    null,
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    if (!code || !state || exchangeStartedRef.current) return;
    exchangeStartedRef.current = true;
    const scrub = () => {
      params.delete('code');
      params.delete('state');
      const qs = params.toString();
      window.history.replaceState(
        {},
        '',
        `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`,
      );
    };

    if (!matchSoyNonce(state)) {
      sessionStorage.removeItem(SOY_RETURN_TO_KEY);
      scrub();
      return;
    }
    scrub();
    setBusy(true);
    exchangeSoyCode(code)
      .then((result) => {
        saveSoySession(result);
        setSession(result);
        setRefreshOutcome('ok');
        posthog.capture('soy_auth_connected', { is_gold: result.isGold });
      })
      .catch((error) => {
        console.error('soy-auth: canje del code falló', error);
        sessionStorage.removeItem(SOY_RETURN_TO_KEY);
        toast({
          title: 'No pudimos verificar tu membresía',
          description: 'Intenta conectarte con devsChile nuevamente.',
          variant: 'destructive',
        });
      })
      .finally(() => setBusy(false));
  }, []);

  const verify = useCallback(() => {
    if (busy || session) return;
    const state = rememberSoyNonce();
    sessionStorage.setItem(SOY_RETURN_TO_KEY, 'checkout');
    setBusy(true);
    window.location.assign(soyAuthorizeUrl(state));
  }, [busy, session]);

  const refresh = useCallback(async () => {
    if (!session || refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    setRefreshing(true);
    try {
      const fresh = await refreshSoySession(session.accessToken);
      const refreshedSession = { ...fresh, accessToken: session.accessToken };
      saveSoySession(refreshedSession);
      setSession(refreshedSession);
      setRefreshOutcome('ok');
    } catch (error) {
      if (error instanceof SoyApiError && error.status === 401) {
        clearSoySession();
        setSession(null);
        setRefreshOutcome('expired');
        posthog.capture('soy_auth_expired');
      } else {
        setRefreshOutcome('unavailable');
      }
    } finally {
      refreshInFlightRef.current = false;
      setRefreshing(false);
    }
  }, [session]);

  return { session, busy, refreshing, refreshOutcome, verify, refresh };
}
