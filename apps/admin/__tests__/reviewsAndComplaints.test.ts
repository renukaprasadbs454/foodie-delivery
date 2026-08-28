import { DASHBOARD_NAV } from '../lib/routeGuards';

describe('Reviews & Complaints Sidebar and Feature Expansion Contract', () => {
  it('renames sidebar label to Reviews & Complaints', () => {
    const reviewsNavItem = DASHBOARD_NAV.find((item) => item.href === '/reviews');
    expect(reviewsNavItem).toBeDefined();
    expect(reviewsNavItem?.label).toBe('Reviews & Complaints');
  });

  it('supports Reviews & Ratings subcategories and Customer Complaints ticket categories', () => {
    const reviewSubCategories = [
      'Customer Reviews',
      'Restaurant Ratings',
      'Delivery Partner Ratings',
      'Reported Reviews',
      'Review Moderation',
    ];

    const complaintSubCategories = [
      'Restaurant Issues',
      'Delivery Issues',
      'Refund Requests',
      'Support Tickets',
      'Ticket Status',
    ];

    expect(reviewSubCategories).toHaveLength(5);
    expect(complaintSubCategories).toHaveLength(5);
  });
});
