/**
 * Date/time formatting — API ISO-8601 UTC in, localized display out.
 * 04_API_Contracts.md Time Format / Timezone.
 */
export function parseApiUtc(isoUtc: string): Date {
  return new Date(isoUtc);
}

export function formatDateTimeLocal(
  isoUtc: string,
  locale: string = 'en-IN',
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = parseApiUtc(isoUtc);
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    ...options,
  }).format(date);
}

export function formatDateLocal(
  isoUtcOrDateOnly: string,
  locale: string = 'en-IN',
): string {
  const date = parseApiUtc(
    isoUtcOrDateOnly.includes('T')
      ? isoUtcOrDateOnly
      : `${isoUtcOrDateOnly}T00:00:00Z`,
  );
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

export function formatRelativeFromNow(
  isoUtc: string,
  now: Date = new Date(),
): string {
  const then = parseApiUtc(isoUtc).getTime();
  const diffMs = now.getTime() - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
