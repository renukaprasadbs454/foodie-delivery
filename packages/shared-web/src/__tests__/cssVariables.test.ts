import { tokensToCssVariables } from '../theme/cssVariables';
import { lightTokens } from '../theme/tokens';

describe('cssVariables', () => {
  it('maps semantic tokens to CSS custom properties', () => {
    const vars = tokensToCssVariables(lightTokens);
    expect(vars['--color-accent']).toBe(lightTokens.color.accent);
    expect(vars['--space-md']).toBe(`${lightTokens.spacing.md}px`);
    expect(vars['--radius-md']).toBe(`${lightTokens.radius.md}px`);
  });
});
