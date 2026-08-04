/**
 * P2-ADM-03 delivery partner KYC response — DeliveryProfileResponseDto.
 * No admin partner detail GET (GAP-API-15 / no frozen Details screen).
 */

export type DeliveryPartnerProfile = {
  partnerId: string;
  fullName?: string | null;
  vehicleType?: string | null;
  vehicleNumber?: string | null;
  kycStatus?: string | null;
  isOnline?: boolean;
  profileImageUrl?: string | null;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isPartnerUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}
