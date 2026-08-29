export type SocialMediaStatus = 'ACTIVE' | 'INACTIVE';

export interface SocialMediaLink {
  id: string;
  sl: number;
  name: string;
  link: string;
  status: SocialMediaStatus;
}

export const SOCIAL_MEDIA_OPTIONS = [
  { value: 'pinterest', label: 'Pinterest' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'tiktok', label: 'TikTok' },
] as const;
