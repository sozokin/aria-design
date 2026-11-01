import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import {
  diffTokens,
  figmaColorsToTokens,
  renderTokensCss,
  serializeTokens,
  srgbToOklch,
  type ITokens,
} from './tokens-core';

const tokens = (color: Record<string, unknown>) =>
  ({ color: { $type: 'color', ...color } }) as ITokens;
const oklch = (l: number, c: number, h: number) => ({
  $value: { colorSpace: 'oklch', components: [l, c, h] },
});

describe('renderTokensCss', () => {
  it('declares each OKLCH token on :root, in file order', () => {
    const css = renderTokensCss(
      tokens({ background: oklch(1, 0, 0), primary: oklch(0.395, 0.222, 272.5) }),
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
        foreground: oklch(0.17, 0, 0),
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

describe('serializeTokens', () => {
  it('writes tokens.json exactly as it is checked in', () => {
    const file = readFileSync('tokens/tokens.json', 'utf8');
    expect(serializeTokens(JSON.parse(file))).toBe(file);
  });
});

describe('srgbToOklch', () => {
  it('gives white and black no chroma and no hue', () => {
    expect(srgbToOklch(1, 1, 1)).toEqual([1, 0, 0]);
    expect(srgbToOklch(0, 0, 0)).toEqual([0, 0, 0]);
  });

  it('lands within rounding of the hand-written primary', () => {
    // Figma's value for primary, from the code's oklch(0.395 0.222 272.5)
    const [l, c, h] = srgbToOklch(0.168715, 0.128344, 0.728916);
    expect(l).toBeCloseTo(0.395, 3);
    expect(c).toBeCloseTo(0.222, 3);
    expect(h).toBeCloseTo(272.5, 1);
  });
});

describe('figmaColorsToTokens', () => {
  it('converts colours, keeps aliases, and notes alpha only below 1', () => {
    const result = figmaColorsToTokens([
      { name: 'background', rgba: { r: 1, g: 1, b: 1, a: 1 } },
      { name: 'veil', rgba: { r: 0, g: 0, b: 0, a: 0.5 } },
      { name: 'card', aliasOf: 'background' },
    ]);
    expect(result).toEqual(
      tokens({
        background: oklch(1, 0, 0),
        veil: { $value: { colorSpace: 'oklch', components: [0, 0, 0], alpha: 0.5 } },
        card: { $value: '{color.background}' },
      }),
    );
  });
});

describe('diffTokens', () => {
  it('lists changed, added and removed tokens by their CSS value', () => {
    const before = tokens({ primary: oklch(0.395, 0.222, 272.5), ring: oklch(0.65, 0.19, 252) });
    const after = tokens({ primary: oklch(0.7, 0.19, 45), accent: { $value: '{color.primary}' } });
    expect(diffTokens(before, after)).toEqual([
      { name: 'primary', before: 'oklch(0.395 0.222 272.5)', after: 'oklch(0.7 0.19 45)' },
      { name: 'accent', before: null, after: 'var(--primary)' },
      { name: 'ring', before: 'oklch(0.65 0.19 252)', after: null },
    ]);
  });

  it('finds nothing when the files match', () => {
    const same = tokens({ primary: oklch(0.395, 0.222, 272.5) });
    expect(diffTokens(same, same)).toEqual([]);
  });
});
