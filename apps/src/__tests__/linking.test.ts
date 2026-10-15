import { linking } from '@/navigation/linking';

describe('linking configuration for Extra Earning Offers', () => {
  const mainScreens = (linking.config?.screens as any)?.Main?.screens;

  it('has Incentives mapped in Main screens as extra-earning-offers', () => {
    expect(mainScreens).toBeDefined();
    expect(mainScreens.Incentives).toBe('extra-earning-offers');
  });

  it('preserves DeliveryHome as root dashboard path', () => {
    expect(mainScreens.DeliveryHome).toBe('');
  });

  it('preserves other existing route mappings', () => {
    expect(mainScreens.Availability).toBe('availability');
    expect(mainScreens.DeliveryOffers).toBe('offers');
    expect(mainScreens.AssignmentDetails).toBe('orders/:orderId');
    expect(mainScreens.Wallet).toBe('wallet');
    expect(mainScreens.DeliveryNotifications).toBe('notifications');
    expect(mainScreens.PrivacyPolicy).toBe('privacy-policy');
    expect(mainScreens.TermsAndConditions).toBe('terms-and-conditions');
    expect(mainScreens.Kyc).toBe('kyc');
  });

  it('includes universal link and app scheme prefixes', () => {
    expect(linking.prefixes).toContain('https://app.foodie.example');
    expect(linking.prefixes).toContain('foodie-delivery://');
  });
});

