// BACKEND INTEGRATION POINT: replace these adapters with API implementations later.
export const mockConfig = { latencyMs: 350, failureRate: 0.03, realtimeEnabled: true };
export const orderService = { source: "mock", async getOrders() { return []; }, subscribeToNewOrders(callback) { return () => callback; } };
export const menuService = { source: "mock" };
export const dashboardService = { source: "mock" };
export const analyticsService = { source: "mock" };
export const offersService = { source: "mock" };
export const payoutsService = { source: "mock" };
export const restaurantService = { source: "mock" };