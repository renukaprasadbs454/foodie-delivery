import {
  isTransportFetchStatus,
  parseEnvelopeFromUnknown,
} from '../api/createBaseApi';

/** TD-009 unit coverage for envelope/transport classification helpers. */
describe('createBaseApi TD-009 helpers', () => {
  it('isTransportFetchStatus detects transport-only statuses', () => {
    expect(isTransportFetchStatus('FETCH_ERROR')).toBe(true);
    expect(isTransportFetchStatus(401)).toBe(false);
  });

  it('parseEnvelopeFromUnknown reads failed UNAUTHORIZED envelopes', () => {
    const envelope = parseEnvelopeFromUnknown({
      success: false,
      data: null,
      error: {
        code: 'UNAUTHORIZED',
        message: 'expired',
        fields: null,
      },
      meta: {
        timestamp: '2026-01-01T00:00:00.000Z',
        requestId: 'req-1',
        pagination: null,
      },
    });
    expect(envelope?.error?.code).toBe('UNAUTHORIZED');
  });
});
