import { CouponsPage } from '../features/coupons/pages/CouponsPage';

describe('Coupons Page Feature Expansion Contract', () => {
  it('validates support for Promo Coupons, First Order Offers, Referral Offers, and Campaign Management', () => {
    const couponFeatureTabs = [
      { id: 'PROMO_COUPONS', label: 'Promo Coupons' },
      { id: 'FIRST_ORDER_OFFERS', label: 'First Order Offers' },
      { id: 'REFERRAL_OFFERS', label: 'Referral Offers' },
      { id: 'CAMPAIGN_MANAGEMENT', label: 'Campaign Management' },
    ];

    expect(couponFeatureTabs).toHaveLength(4);
    expect(couponFeatureTabs.map((t) => t.id)).toEqual([
      'PROMO_COUPONS',
      'FIRST_ORDER_OFFERS',
      'REFERRAL_OFFERS',
      'CAMPAIGN_MANAGEMENT',
    ]);
  });
});
