/**
 * TD-013: sanitize BFF catch-all path segments before proxying to /api/v1/*.
 * Reject traversal / absolute / empty segments. No business logic.
 */

export type BffPathValidation =
  | { ok: true; targetPath: string }
  | { ok: false; reason: string };

export function sanitizeBffPathSegments(
  pathSegments: string[],
): BffPathValidation {
  if (!pathSegments.length) {
    return { ok: false, reason: 'empty path' };
  }

  for (const segment of pathSegments) {
    if (!segment || segment.trim() === '') {
      return { ok: false, reason: 'empty segment' };
    }
    let decoded = segment;
    try {
      decoded = decodeURIComponent(segment);
    } catch {
      return { ok: false, reason: 'invalid encoding' };
    }
    if (decoded === '.' || decoded === '..') {
      return { ok: false, reason: 'traversal segment' };
    }
    if (decoded.includes('/') || decoded.includes('\\')) {
      return { ok: false, reason: 'separator in segment' };
    }
    if (decoded.includes(':')) {
      return { ok: false, reason: 'scheme-like segment' };
    }
    if (decoded.startsWith('..') || decoded.includes('..')) {
      return { ok: false, reason: 'traversal pattern' };
    }
  }

  return { ok: true, targetPath: pathSegments.join('/') };
}
