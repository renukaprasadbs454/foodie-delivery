/**
 * Development & Mock Data Configuration
 * Controls fallback behavior when backend APIs are offline or returning empty results.
 */

export const MOCK_CONFIG = {
  /** Master toggle to enable mock data fallbacks when real API data is unavailable or empty */
  ENABLE_MOCK_FALLBACK: true,

  /** Toggle whether to display a subtle "DEMO MODE" badge when mock data is active */
  SHOW_MOCK_INDICATOR: true,

  /** Valid UUID v4 default restaurant ID for local demo/development */
  DEFAULT_MOCK_RESTAURANT_ID: '11111111-1111-4111-8111-111111111111',
};
