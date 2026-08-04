import { sanitizeBffPathSegments } from '../lib/bffPath';

/** TD-013 */
describe('sanitizeBffPathSegments', () => {
  it('accepts normal API segments', () => {
    const result = sanitizeBffPathSegments(['restaurants', 'abc-123']);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.targetPath).toBe('restaurants/abc-123');
    }
  });

  it('rejects traversal and empty segments', () => {
    expect(sanitizeBffPathSegments(['..', 'secret']).ok).toBe(false);
    expect(sanitizeBffPathSegments(['restaurants', '..']).ok).toBe(false);
    expect(sanitizeBffPathSegments(['']).ok).toBe(false);
    expect(sanitizeBffPathSegments([]).ok).toBe(false);
  });

  it('rejects scheme-like and separator segments', () => {
    expect(sanitizeBffPathSegments(['https:']).ok).toBe(false);
    expect(sanitizeBffPathSegments(['a/b']).ok).toBe(false);
  });
});
