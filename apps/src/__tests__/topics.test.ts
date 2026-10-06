import {
  orderTopic,
  restaurantOrdersTopic,
  userNotificationsTopic,
} from '../websocket/topics';

describe('websocket topics', () => {
  it('builds only contract-defined destinations', () => {
    expect(orderTopic('o1')).toBe('/topic/order/o1');
    expect(restaurantOrdersTopic('r1')).toBe('/topic/restaurant/r1/orders');
    expect(userNotificationsTopic('u1')).toBe('/topic/user/u1/notifications');
  });
});
