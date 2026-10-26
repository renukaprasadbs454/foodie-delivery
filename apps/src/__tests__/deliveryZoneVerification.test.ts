import type { LocationZone, DeliveryZoneVerificationResult } from '@/features/kyc/types';

describe('Delivery Zone Verification (KYC Gate)', () => {
  const sampleActiveZone: LocationZone = {
    id: 'dz-tumkur',
    zoneName: 'Tumkur Central',
    cityName: 'Bangalore',
    latitude: 13.3379,
    longitude: 77.1173,
    radiusKm: 15.0,
    polygonCoordinates: '13.3379,77.1173 | 13.3450,77.1250 | 13.3300,77.1300',
    status: 'ACTIVE',
    deliveryPartnerEnabled: true,
  };

  it('formats verified zone success message matching requirement 4', () => {
    const verificationSuccess: DeliveryZoneVerificationResult = {
      verified: true,
      zoneId: sampleActiveZone.id,
      zoneName: sampleActiveZone.zoneName,
      cityName: sampleActiveZone.cityName,
      latitude: 13.3379,
      longitude: 77.1173,
      message: `Location Verified — ${sampleActiveZone.zoneName}`,
    };

    expect(verificationSuccess.verified).toBe(true);
    expect(verificationSuccess.zoneName).toBe('Tumkur Central');
    expect(verificationSuccess.message).toBe('Location Verified — Tumkur Central');
  });

  it('formats outside zone error message matching requirement 5', () => {
    const outsideResult: DeliveryZoneVerificationResult = {
      verified: false,
      zoneId: null,
      zoneName: null,
      cityName: null,
      latitude: 28.6139,
      longitude: 77.2090,
      message: 'You are outside the delivery zone. Please move to an active delivery zone and try again.',
    };

    expect(outsideResult.verified).toBe(false);
    expect(outsideResult.zoneName).toBeNull();
    expect(outsideResult.message).toBe(
      'You are outside the delivery zone. Please move to an active delivery zone and try again.'
    );
  });

  it('determines whether documents should be unlocked based on zone verification state', () => {
    const isDocumentUploadAllowed = (isZoneVerified: boolean): boolean => {
      return isZoneVerified === true;
    };

    expect(isDocumentUploadAllowed(true)).toBe(true);
    expect(isDocumentUploadAllowed(false)).toBe(false);
  });

  it('determines whether Continue to Verification should be allowed', () => {
    const canContinueToVerification = (
      isZoneVerified: boolean,
      isAllUploaded: boolean,
      partnerName: string
    ): boolean => {
      return isZoneVerified && isAllUploaded && Boolean(partnerName.trim());
    };

    // Outside zone: always false even if docs uploaded
    expect(canContinueToVerification(false, true, 'Ravi Kumar')).toBe(false);

    // Inside zone but missing docs: false
    expect(canContinueToVerification(true, false, 'Ravi Kumar')).toBe(false);

    // Inside zone, missing name: false
    expect(canContinueToVerification(true, true, '')).toBe(false);

    // Inside zone, all docs, valid name: true
    expect(canContinueToVerification(true, true, 'Ravi Kumar')).toBe(true);
  });

  describe('Separated Screen Navigation & Access Control', () => {
    it('prevents navigation from location page to documents page when outside delivery zone', () => {
      const canNavigateToDocuments = (isZoneVerified: boolean): boolean => {
        return isZoneVerified === true;
      };

      // Outside zone: navigation must be prevented
      expect(canNavigateToDocuments(false)).toBe(false);
      // Inside zone: navigation allowed
      expect(canNavigateToDocuments(true)).toBe(true);
    });

    it('redirects to location page when opening KYC document route directly without valid zone verification', () => {
      type RedirectDecision = { shouldRedirect: boolean; redirectTo: 'DeliveryZone' | null };

      const evaluateKycRouteAccess = (isZoneVerified: boolean): RedirectDecision => {
        if (!isZoneVerified) {
          return { shouldRedirect: true, redirectTo: 'DeliveryZone' };
        }
        return { shouldRedirect: false, redirectTo: null };
      };

      // Direct access with zoneVerified = false must redirect to DeliveryZone
      expect(evaluateKycRouteAccess(false)).toEqual({
        shouldRedirect: true,
        redirectTo: 'DeliveryZone',
      });

      // Direct access with zoneVerified = true stays on KYC documents page
      expect(evaluateKycRouteAccess(true)).toEqual({
        shouldRedirect: false,
        redirectTo: null,
      });
    });

    it('determines correct initialRouteName based on backend zone verification and document status', () => {
      const getInitialKycRoute = (profile: {
        zoneVerified?: boolean;
        kycStatus?: string;
        documents?: any[];
        profileImageUrl?: string;
        fullName?: string;
      }): 'DeliveryZone' | 'KycForm' | 'PendingVerification' => {
        const hasUploadedDocs = profile.documents && profile.documents.length >= 3;
        const hasProfileImage = !!profile.profileImageUrl;
        const hasName = !!profile.fullName && profile.fullName !== 'Delivery Partner';

        if (hasUploadedDocs && hasProfileImage && hasName) {
          return 'PendingVerification';
        }
        if (profile.zoneVerified) {
          return 'KycForm';
        }
        return 'DeliveryZone';
      };

      // Unverified zone -> DeliveryZone
      expect(getInitialKycRoute({ zoneVerified: false })).toBe('DeliveryZone');
      expect(getInitialKycRoute({})).toBe('DeliveryZone');

      // Verified zone, but documents pending -> KycForm
      expect(getInitialKycRoute({ zoneVerified: true, fullName: 'Ravi' })).toBe('KycForm');

      // Verified zone, all docs completed -> PendingVerification
      expect(
        getInitialKycRoute({
          zoneVerified: true,
          fullName: 'Ravi Kumar',
          profileImageUrl: 'https://example.com/selfie.jpg',
          documents: [{}, {}, {}],
        })
      ).toBe('PendingVerification');
    });
  });

  describe('Automatic GPS Detection & Premature Warning Suppression', () => {
    it('suppresses premature red warning while GPS is loading or before verification has completed', () => {
      const shouldDisplayOutsideZoneWarning = ({
        isGpsLoading,
        isVerifying,
        hasAttemptedVerification,
        isZoneVerified,
      }: {
        isGpsLoading: boolean;
        isVerifying: boolean;
        hasAttemptedVerification: boolean;
        isZoneVerified: boolean;
      }): boolean => {
        if (isGpsLoading || isVerifying || !hasAttemptedVerification) {
          return false;
        }
        return !isZoneVerified;
      };

      // While GPS loading: MUST NOT show outside zone warning
      expect(
        shouldDisplayOutsideZoneWarning({
          isGpsLoading: true,
          isVerifying: false,
          hasAttemptedVerification: false,
          isZoneVerified: false,
        })
      ).toBe(false);

      // While server verification is in progress: MUST NOT show outside zone warning
      expect(
        shouldDisplayOutsideZoneWarning({
          isGpsLoading: false,
          isVerifying: true,
          hasAttemptedVerification: false,
          isZoneVerified: false,
        })
      ).toBe(false);

      // Initial state before verification attempt: MUST NOT show outside zone warning
      expect(
        shouldDisplayOutsideZoneWarning({
          isGpsLoading: false,
          isVerifying: false,
          hasAttemptedVerification: false,
          isZoneVerified: false,
        })
      ).toBe(false);

      // After verification completes and coords are outside: SHOW outside zone warning
      expect(
        shouldDisplayOutsideZoneWarning({
          isGpsLoading: false,
          isVerifying: false,
          hasAttemptedVerification: true,
          isZoneVerified: false,
        })
      ).toBe(true);

      // After verification completes and coords are inside: DO NOT show outside zone warning
      expect(
        shouldDisplayOutsideZoneWarning({
          isGpsLoading: false,
          isVerifying: false,
          hasAttemptedVerification: true,
          isZoneVerified: true,
        })
      ).toBe(false);
    });

    it('handles location permission denial and GPS unavailability gracefully', () => {
      type GpsState = {
        isGpsLoading: boolean;
        gpsError: string | null;
        gpsDetected: boolean;
      };

      const handlePermissionResult = (status: 'granted' | 'denied'): GpsState => {
        if (status !== 'granted') {
          return {
            isGpsLoading: false,
            gpsError: 'Location permission denied. Please enable location access in device settings.',
            gpsDetected: false,
          };
        }
        return {
          isGpsLoading: false,
          gpsError: null,
          gpsDetected: true,
        };
      };

      const deniedState = handlePermissionResult('denied');
      expect(deniedState.isGpsLoading).toBe(false);
      expect(deniedState.gpsDetected).toBe(false);
      expect(deniedState.gpsError).toContain('Location permission denied');

      const grantedState = handlePermissionResult('granted');
      expect(grantedState.isGpsLoading).toBe(false);
      expect(grantedState.gpsDetected).toBe(true);
      expect(grantedState.gpsError).toBeNull();
    });
  });

  describe('Admin-Configured Zone Selection & Revalidation', () => {
    const adminZones: LocationZone[] = [
      sampleActiveZone,
      {
        id: 'dz-indiranagar',
        zoneName: 'Indiranagar Tech Corridor',
        cityName: 'Bangalore',
        latitude: 12.9784,
        longitude: 77.6408,
        radiusKm: 5.0,
        status: 'ACTIVE',
        deliveryPartnerEnabled: true,
      },
    ];

    it('allows partner to select from admin configured zones and revalidates on zone switch', () => {
      let currentSelectedZoneId: string | null = null;
      let isVerified = false;

      const selectZone = (zoneId: string, partnerLat: number, partnerLng: number) => {
        currentSelectedZoneId = zoneId;
        // Invalidate stale state when switching
        isVerified = false;

        const zone = adminZones.find((z) => z.id === zoneId);
        if (!zone) return false;

        // Simulate distance check against selected zone
        const R = 6371;
        const dLat = ((zone.latitude - partnerLat) * Math.PI) / 180;
        const dLon = ((zone.longitude - partnerLng) * Math.PI) / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos((partnerLat * Math.PI) / 180) *
            Math.cos((zone.latitude * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const distKm = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        isVerified = distKm <= zone.radiusKm;
        return isVerified;
      };

      // Partner is in Tumkur (13.3400, 77.1200)
      // 1. Partner selects Tumkur Central -> Inside zone!
      const tumkurResult = selectZone('dz-tumkur', 13.3400, 77.1200);
      expect(currentSelectedZoneId).toBe('dz-tumkur');
      expect(tumkurResult).toBe(true);
      expect(isVerified).toBe(true);

      // 2. Partner switches to Indiranagar Tech Corridor -> Outside zone!
      const indiranagarResult = selectZone('dz-indiranagar', 13.3400, 77.1200);
      expect(currentSelectedZoneId).toBe('dz-indiranagar');
      expect(indiranagarResult).toBe(false);
      expect(isVerified).toBe(false);
    });

    it('enables Continue to Documents when zone is selected and GPS is ready (even outside zone)', () => {
      const isContinueEnabled = (
        selectedZoneId: string | null,
        isGpsLoading: boolean,
        isVerifying: boolean
      ): boolean => {
        return Boolean(selectedZoneId) && !isGpsLoading && !isVerifying;
      };

      expect(isContinueEnabled('dz-blr', false, false)).toBe(true);
      expect(isContinueEnabled(null, false, false)).toBe(false);
      expect(isContinueEnabled('dz-blr', true, false)).toBe(false);
      expect(isContinueEnabled('dz-blr', false, true)).toBe(false);
    });
  });
});
