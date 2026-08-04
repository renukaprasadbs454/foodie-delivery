/**
 * Admin analytics bootstrap — System Design §28.1 (lighter internal-usage setup).
 * Separate taxonomy from consumer mobile apps; still never sends tokens/OTPs/PII secrets.
 */

export type AnalyticsProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

export type AnalyticsClient = {
  init: (options: { appName: string; appVersion?: string }) => Promise<void> | void;
  track: (event: string, properties?: AnalyticsProperties) => void;
  identify?: (userId: string, traits?: AnalyticsProperties) => void;
  reset?: () => void;
};

const SENSITIVE_PROP =
  /(token|otp|password|authorization|refresh|accessToken|refreshToken|card|upi|phone|email)/i;

function sanitizeProps(
  properties?: AnalyticsProperties,
): AnalyticsProperties | undefined {
  if (!properties) return undefined;
  const cleaned: AnalyticsProperties = {};
  for (const [key, value] of Object.entries(properties)) {
    if (SENSITIVE_PROP.test(key)) continue;
    cleaned[key] = value;
  }
  return cleaned;
}

let client: AnalyticsClient | null = null;
let initialized = false;

export const noOpAnalyticsClient: AnalyticsClient = {
  init: () => undefined,
  track: () => undefined,
  identify: () => undefined,
  reset: () => undefined,
};

export async function initAnalytics(
  analyticsClient: AnalyticsClient,
  options: { appName: string; appVersion?: string },
): Promise<void> {
  client = analyticsClient;
  await client.init(options);
  initialized = true;
}

export function trackAnalyticsEvent(
  event: string,
  properties?: AnalyticsProperties,
): void {
  if (!initialized || !client) return;
  client.track(event, sanitizeProps(properties));
}

export function identifyAnalyticsUser(
  userId: string,
  traits?: AnalyticsProperties,
): void {
  if (!initialized || !client?.identify) return;
  client.identify(userId, sanitizeProps(traits));
}

export function resetAnalytics(): void {
  client?.reset?.();
}

export function isAnalyticsInitialized(): boolean {
  return initialized;
}
