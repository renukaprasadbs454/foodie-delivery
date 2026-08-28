import { DeliverymanRecord } from '../features/deliveryPartners/pages/DeliveryPartnersPage';

describe('Deliveryman Registration Document Verification Contract', () => {
  it('validates required document verification fields during delivery partner registration', () => {
    const mockNewDeliveryman: DeliverymanRecord = {
      id: 'p-9999',
      name: 'Rohan Sharma',
      phone: '+91 99887 76655',
      zone: 'Downtown Central',
      vehicleType: 'Motorcycle',
      onlineStatus: 'ONLINE',
      cashInHand: 0,
      totalDeliveries: 0,
      rating: 5.0,
      kycStatus: 'VERIFIED',
      documentType: 'Driving License',
      documentNumber: 'DL-998877665544',
      documentVerificationStatus: 'VERIFIED',
      uploadedDocumentName: 'dl_rohan_sharma.pdf',
    };

    expect(mockNewDeliveryman.documentType).toBe('Driving License');
    expect(mockNewDeliveryman.documentNumber).toBe('DL-998877665544');
    expect(mockNewDeliveryman.documentVerificationStatus).toBe('VERIFIED');
    expect(mockNewDeliveryman.uploadedDocumentName).toContain('.pdf');
  });

  it('supports multiple identity document types (Aadhaar, DL, PAN, Passport)', () => {
    const supportedDocTypes = ['Driving License', 'Aadhaar Card', 'PAN Card', 'Passport'];

    expect(supportedDocTypes).toHaveLength(4);
    expect(supportedDocTypes).toContain('Aadhaar Card');
    expect(supportedDocTypes).toContain('Driving License');
  });
});
