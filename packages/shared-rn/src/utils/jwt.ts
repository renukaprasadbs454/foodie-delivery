/**
 * Client-side JWT exp decode for proactive refresh timing only.
 * Blueprint §13.4 — never trusted as an authorization decision.
 */
declare var Buffer: any;

export function getJwtExpiryMs(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2 || !parts[1]) return null;
    const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const json =
      typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf8');
    const parsed = JSON.parse(json) as { exp?: number };
    if (typeof parsed.exp !== 'number') return null;
    return parsed.exp * 1000;
  } catch {
    return null;
  }
}

/** True when token expires within bufferMs (default 60s). */
export function isJwtExpiringSoon(
  token: string,
  bufferMs: number = 60_000,
  nowMs: number = Date.now(),
): boolean {
  const exp = getJwtExpiryMs(token);
  if (exp == null) return false;
  return exp - nowMs <= bufferMs;
}
