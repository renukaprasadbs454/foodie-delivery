import reducer, {
  clearKycForm,
  documentUploaded,
  profileImageUploaded,
  setSelectedDocType,
} from '../features/kyc/kycFormSlice';
import { clearCredentials } from '../features/auth/authSlice';

describe('kycFormSlice (P2-DEL-01)', () => {
  it('tracks document and profile uploads in session state', () => {
    let state = reducer(undefined, { type: '@@init' });
    state = reducer(state, setSelectedDocType('IDENTITY'));
    expect(state.selectedDocType).toBe('IDENTITY');

    state = reducer(
      state,
      documentUploaded({
        documentId: 'doc-1',
        docType: 'LICENSE',
        verificationStatus: 'PENDING',
        fileKey: 'k/license',
        uploadedAt: '2026-08-03T00:00:00Z',
      }),
    );
    expect(state.documents.LICENSE?.documentId).toBe('doc-1');

    state = reducer(
      state,
      profileImageUploaded({
        fileKey: 'k/profile',
        uploadedAt: '2026-08-03T00:01:00Z',
      }),
    );
    expect(state.profileImage?.fileKey).toBe('k/profile');
  });

  it('clears on clearKycForm and clearCredentials', () => {
    let state = reducer(
      undefined,
      documentUploaded({
        documentId: 'doc-1',
        docType: 'VEHICLE_RC',
        verificationStatus: 'PENDING',
        fileKey: 'k/rc',
        uploadedAt: '2026-08-03T00:00:00Z',
      }),
    );
    state = reducer(state, clearKycForm());
    expect(state.documents).toEqual({});

    state = reducer(
      undefined,
      documentUploaded({
        documentId: 'doc-2',
        docType: 'IDENTITY',
        verificationStatus: 'PENDING',
        fileKey: 'k/id',
        uploadedAt: '2026-08-03T00:00:00Z',
      }),
    );
    state = reducer(state, clearCredentials());
    expect(state.documents).toEqual({});
    expect(state.profileImage).toBeNull();
  });
});
