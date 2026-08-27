export interface SoyMember {
  id: string;
  displayName: string | null;
  handle: string | null;
  primaryEmail: string | null;
}

export interface SoySession {
  accessToken: string;
  member: SoyMember;
  isGold: boolean;
  paidThrough: string | null;
}

export type SoySessionRefresh = Omit<SoySession, 'accessToken'>;

export class SoyApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'SoyApiError';
    this.status = status;
  }
}

export const SOY_URL = (import.meta.env.VITE_SOY_URL ?? 'https://soy.devschile.cl').replace(
  /\/+$/,
  '',
);

const SESSION_KEY = 'soy.session';
const NONCE_KEY = 'soy.nonce';

export function soyAuthorizeUrl(state: string): string {
  const redirectUri = `${window.location.origin}/`;
  const params = new URLSearchParams({
    client_id: 'tienda',
    redirect_uri: redirectUri,
    response_type: 'code',
    state,
  });
  return `${SOY_URL}/api/auth/authorize?${params.toString()}`;
}

export function loadSoySession(): SoySession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SoySession;
    return parsed && typeof parsed.accessToken === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

export function saveSoySession(session: SoySession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSoySession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function rememberSoyNonce(): string {
  const state = crypto.randomUUID();
  sessionStorage.setItem(NONCE_KEY, state);
  return state;
}

export function matchSoyNonce(state: string): boolean {
  const stored = sessionStorage.getItem(NONCE_KEY);
  sessionStorage.removeItem(NONCE_KEY);
  return stored === state;
}

async function postToSoyFunction<T>(url: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = (await res.json().catch(() => null)) as Record<string, unknown> | null;
  if (!res.ok) {
    const detail =
      typeof payload?.message === 'string'
        ? payload.message
        : typeof payload?.error === 'string'
          ? payload.error
          : `respondió ${res.status}`;
    throw new SoyApiError(`${url}: ${detail}`, res.status);
  }
  return payload as T;
}

export function exchangeSoyCode(code: string): Promise<SoySession> {
  return postToSoyFunction<SoySession>('/.netlify/functions/soy-exchange', {
    code,
    redirectUri: `${window.location.origin}/`,
  });
}

export function refreshSoySession(accessToken: string): Promise<SoySessionRefresh> {
  return postToSoyFunction<SoySessionRefresh>('/.netlify/functions/soy-refresh', { accessToken });
}
