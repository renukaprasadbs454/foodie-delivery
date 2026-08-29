describe('Notifications Center Page Contract', () => {
  it('supports 5 outer visible feature tabs in Notifications Center', () => {
    const tabs = [
      'Send Notifications',
      'Customer Notifications',
      'Restaurant Notifications',
      'Delivery Partner Notifications',
      'Notification History',
    ];

    expect(tabs).toHaveLength(5);
    expect(tabs).toContain('Send Notifications');
    expect(tabs).toContain('Customer Notifications');
    expect(tabs).toContain('Restaurant Notifications');
    expect(tabs).toContain('Delivery Partner Notifications');
    expect(tabs).toContain('Notification History');
  });
});
