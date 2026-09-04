import fs from 'fs';
import path from 'path';

describe('CTO REQUIREMENT — MAKE RESTAURANT MODULE FULLY RESPONSIVE', () => {
  const restaurantsPagePath = path.join(
    __dirname,
    '../features/restaurants/pages/RestaurantsPage.tsx',
  );
  const restaurantDetailsPagePath = path.join(
    __dirname,
    '../features/restaurants/pages/RestaurantDetailsPage.tsx',
  );

  const restaurantsPageCode = fs.readFileSync(restaurantsPagePath, 'utf8');
  const restaurantDetailsCode = fs.readFileSync(restaurantDetailsPagePath, 'utf8');

  it('RestaurantsPage table container enables Option A horizontal scroll for mobile/tablet', () => {
    expect(restaurantsPageCode).toContain("overflowX: 'auto'");
    expect(restaurantsPageCode).toContain("WebkitOverflowScrolling: 'touch'");
    expect(restaurantsPageCode).toContain('minWidth: 880');
  });

  it('RestaurantsPage search bar uses flexible responsive sizing instead of fixed width', () => {
    expect(restaurantsPageCode).toContain("flex: '1 1 260px'");
    expect(restaurantsPageCode).not.toContain('width: 320,');
  });

  it('RestaurantsPage filter tabs container supports horizontal scrolling on mobile', () => {
    expect(restaurantsPageCode).toContain("overflowX: 'auto'");
    expect(restaurantsPageCode).toContain("whiteSpace: 'nowrap'");
  });

  it('Add New Vendor Modal has responsive maximum width and viewport-based max height scroll', () => {
    expect(restaurantsPageCode).toContain("maxHeight: '90vh'");
    expect(restaurantsPageCode).toContain("overflowY: 'auto'");
    expect(restaurantsPageCode).toContain("gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))'");
  });

  it('RestaurantDetailsPage applies text wrapping and responsive review table scroll', () => {
    expect(restaurantDetailsCode).toContain("wordBreak: 'break-word'");
    expect(restaurantDetailsCode).toContain("overflowX: 'auto'");
  });
});
