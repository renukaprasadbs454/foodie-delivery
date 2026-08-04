/**
 * GAP-API-13 resolved — Admin login gap constants removed from open blockers.
 */

describe('GAP-API-13 resolved constants', () => {
  it('no longer exports an open Admin login gap blocker', async () => {
    const gaps = await import('../constants/gaps');
    expect('GAP_API_13_ADMIN_LOGIN' in gaps).toBe(false);
    expect('ADMIN_LOGIN_GAP_MESSAGE' in gaps).toBe(false);
    expect(gaps.GAP_API_14_RESTAURANT_LIST).toBe('GAP-API-14');
  });
});
