import { SOCIAL_MEDIA_OPTIONS } from '../features/social-media/types/socialMediaTypes';
import { DASHBOARD_NAV } from '../lib/routeGuards';

describe('Social Media Feature Contract', () => {
  it('includes /social-media in DASHBOARD_NAV under BUSINESS MANAGERS', () => {
    const socialNav = DASHBOARD_NAV.find((item) => item.href === '/social-media');

    expect(socialNav).toBeDefined();
    expect(socialNav?.label).toBe('Social Media');
    expect(socialNav?.category).toBe('BUSINESS MANAGERS');
    expect(socialNav?.icon).toBe('');
  });

  it('supports essential social media platforms (Pinterest, LinkedIn, Facebook, Instagram, YouTube, Twitter, TikTok)', () => {
    const values = SOCIAL_MEDIA_OPTIONS.map((opt) => opt.value);

    expect(values).toContain('pinterest');
    expect(values).toContain('linkedin');
    expect(values).toContain('facebook');
    expect(values).toContain('instagram');
    expect(values).toContain('youtube');
    expect(values).toContain('twitter');
    expect(values).toContain('tiktok');
  });
});
