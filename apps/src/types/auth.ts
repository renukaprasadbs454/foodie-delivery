/**
 * Auth identity types aligned with 04_API_Contracts.md Module 1 + Blueprint §11.1.
 * authSlice itself lives in each app's features/auth — shared package only types it.
 */
export type UserType = 'CUSTOMER' | 'RESTAURANT' | 'DELIVERY_PARTNER' | 'ADMIN';

export type AuthStatus =
  | 'idle'
  | 'authenticating'
  | 'authenticated'
  | 'unauthenticated';

export type AuthCredentialsPayload = {
  accessToken: string;
  refreshToken: string;
  userType: UserType;
  userId: string;
  isNewUser: boolean;
};
