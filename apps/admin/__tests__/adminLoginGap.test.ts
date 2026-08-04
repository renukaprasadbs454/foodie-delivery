import {
  ADMIN_LOGIN_GAP_MESSAGE,
  GAP_API_13_ADMIN_LOGIN,
} from '../constants/gaps';

describe('P2-AUTH-04 GAP-API-13 fail-closed contract', () => {
  it('documents Admin login Gap id and message', () => {
    expect(GAP_API_13_ADMIN_LOGIN).toBe('GAP-API-13');
    expect(ADMIN_LOGIN_GAP_MESSAGE).toContain('GAP-API-13');
    expect(ADMIN_LOGIN_GAP_MESSAGE.toLowerCase()).toContain('not invent');
  });
});
