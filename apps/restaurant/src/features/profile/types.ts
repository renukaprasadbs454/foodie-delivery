/**
 * P2-RES-04 profile update — UI-API Restaurant Profile + UpdateRestaurantRequestDto.
 */

import type { RegisterRestaurantRequest } from '../onboarding/types';
import { validateRegistrationForm } from '../onboarding/types';

export type UpdateRestaurantProfileRequest = RegisterRestaurantRequest;

/** PUT profile validation — same §3.3 rules; commission omitted. */
export function validateProfileForm(input: {
  name: string;
  description: string;
  cuisineTypes: string[];
  line1: string;
  line2: string;
  city: string;
  pincode: string;
  latitude: string;
  longitude: string;
}):
  | { ok: true; value: UpdateRestaurantProfileRequest }
  | { ok: false; message: string } {
  return validateRegistrationForm(input);
}
