import { describe, expect, it } from 'vitest';

import { renderTokensCss, type ITokens } from './tokens';

const tokens = (color: Record<string, unknown>) =>
  ({ color: { $type: 'color', ...color } }) as ITokens;

describe('renderTokensCss', () => {
  it('declares each OKLCH token on :root, in file order', () => {
    const css = renderTokensCss(
      tokens({
        background: { $value: { colorSpace: 'oklch', components: [1, 0, 0] } },
        primary: { $value: { colorSpace: 'oklch', components: [0.395, 0.222, 272.5] } },
      }),
    );
    expect(css).toContain(
      ':root {\n  --background: oklch(1 0 0);\n  --primary: oklch(0.395 0.222 272.5);\n}',
    );
  });

  it('writes alpha only when the colour is see-through', () => {
    const css = renderTokensCss(
      tokens({
        solid: { $value: { colorSpace: 'oklch', components: [0.5, 0.1, 200], alpha: 1 } },
        veil: { $value: { colorSpace: 'oklch', components: [0.17, 0, 0], alpha: 0.5 } },
      }),
    );
    expect(css).toContain('--solid: oklch(0.5 0.1 200);');
    expect(css).toContain('--veil: oklch(0.17 0 0 / 0.5);');
  });

  it('keeps a reference to another token as a reference', () => {
    const css = renderTokensCss(
      tokens({
        foreground: { $value: { colorSpace: 'oklch', components: [0.17, 0, 0] } },
        'card-foreground': { $value: '{color.foreground}' },
      }),
    );
    expect(css).toContain('--card-foreground: var(--foreground);');
  });

  it('refuses a reference to a token that does not exist', () => {
    expect(() => renderTokensCss(tokens({ ring: { $value: '{color.focus}' } }))).toThrow(
      'Token "ring" refers to missing token "focus"',
    );
  });
});
