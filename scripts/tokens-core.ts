/**
 * The token format, shared by the command line (scripts/tokens.ts) and the Figma plugin
 * (figma-plugin/code.ts), so both turn the same variables into byte-identical files. Nothing here
 * touches the file system or Figma: values in, text out.
 */

export interface IOklchValue {
  colorSpace: 'oklch';
  components: [number, number, number];
  alpha?: number;
}

interface IToken {
  $value: IOklchValue | string;
}

export interface ITokens {
  color: { $type: 'color' } & Record<string, IToken | 'color'>;
}

/** One Figma colour variable, reduced to what the token file needs. */
export type IFigmaColor =
  | { name: string; rgba: { r: number; g: number; b: number; a: number } }
  | { name: string; aliasOf: string };

/** A token whose value differs between two token files; `null` means it is absent on that side. */
export interface ITokenChange {
  name: string;
  before: string | null;
  after: string | null;
}

const REFERENCE = /^\{color\.([a-z0-9-]+)\}$/;

const HEADER = `/* Generated from tokens/tokens.json by scripts/tokens.ts. Do not edit by hand:
   change the variable in Figma and publish it to code, or edit tokens.json and run
   \`npm run tokens\`. CI fails when this file and tokens.json disagree. */`;

/**
 * Turns the token file into the stylesheet that declares every token on `:root`.
 *
 * @param tokens - The parsed contents of tokens.json.
 * @returns The full text of tokens.css.
 * @throws If a token refers to one that does not exist, or its value is not one this script reads.
 */
export function renderTokensCss(tokens: ITokens): string {
  const lines = Object.entries(cssValues(tokens)).map(([name, value]) => `  --${name}: ${value};`);
  return `${HEADER}\n:root {\n${lines.join('\n')}\n}\n`;
}

/**
 * Writes tokens.json the way Prettier formats it (each colour's three numbers on one line), so a
 * publish from Figma changes only the lines whose values changed.
 *
 * @param tokens - The token file to write.
 * @returns The full text of tokens.json.
 */
export function serializeTokens(tokens: ITokens): string {
  const json = JSON.stringify(tokens, null, 2).replace(
    /\[\s+([^\]]*?)\s+\]/g,
    (_, items: string) => `[${items.split(/,\s+/).join(', ')}]`,
  );
  return `${json}\n`;
}

/**
 * Builds the token file from Figma's colour variables, in the order Figma lists them.
 *
 * @param colors - Each variable's name (without its group prefix) and either its colour or the
 *   name of the variable it points to.
 * @returns The token file, with every colour converted to OKLCH.
 */
export function figmaColorsToTokens(colors: IFigmaColor[]): ITokens {
  const color: ITokens['color'] = { $type: 'color' };
  for (const entry of colors) {
    if ('aliasOf' in entry) {
      color[entry.name] = { $value: `{color.${entry.aliasOf}}` };
      continue;
    }
    const { r, g, b, a } = entry.rgba;
    const value: IOklchValue = { colorSpace: 'oklch', components: srgbToOklch(r, g, b) };
    if (a < 1) value.alpha = round(a, 4);
    color[entry.name] = { $value: value };
  }
  return { color };
}

/**
 * Lists the tokens whose CSS value differs between two token files, in the newer file's order
 * followed by any tokens it removed.
 *
 * @param before - The token file as it is now (e.g. on the branch).
 * @param after - The token file about to replace it.
 * @returns One entry per changed, added or removed token.
 */
export function diffTokens(before: ITokens, after: ITokens): ITokenChange[] {
  const old = cssValues(before);
  const next = cssValues(after);
  const changes: ITokenChange[] = [];
  for (const [name, value] of Object.entries(next)) {
    if (old[name] !== value) changes.push({ name, before: old[name] ?? null, after: value });
  }
  for (const [name, value] of Object.entries(old)) {
    if (!(name in next)) changes.push({ name, before: value, after: null });
  }
  return changes;
}

/**
 * Converts a gamma-encoded sRGB colour (Figma's 0–1 channels) to OKLCH, rounded the way the
 * hand-written tokens were: lightness and chroma to 4 places, hue to 2. A colour with no chroma
 * gets hue 0, as `oklch(1 0 0)` does.
 */
export function srgbToOklch(r: number, g: number, b: number): [number, number, number] {
  const [lr, lg, lb] = [r, g, b].map(c =>
    c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4,
  );
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const chroma = round(Math.hypot(A, B), 4);
  const hue = chroma === 0 ? 0 : round(((Math.atan2(B, A) * 180) / Math.PI + 360) % 360, 2);
  return [round(L, 4), chroma, hue];
}

function round(value: number, places: number) {
  const factor = 10 ** places;
  // `+ 0` turns -0 into 0, so a rounded-away channel prints as "0".
  return Math.round(value * factor) / factor + 0;
}

/** Each token's CSS value (`oklch(…)` or `var(--…)`), keyed by token name, in file order. */
function cssValues(tokens: ITokens): Record<string, string> {
  const { $type: _type, ...color } = tokens.color;
  const values: Record<string, string> = {};
  for (const [name, token] of Object.entries(color)) {
    if (typeof token !== 'object') throw new Error(`Token "${name}" has no $value`);
    values[name] = renderValue(name, token.$value, color);
  }
  return values;
}

function renderValue(name: string, value: IToken['$value'], color: Record<string, unknown>) {
  if (typeof value === 'string') {
    const target = value.match(REFERENCE)?.[1];
    if (!target) throw new Error(`Token "${name}" has an unreadable reference: ${value}`);
    if (!(target in color)) throw new Error(`Token "${name}" refers to missing token "${target}"`);
    return `var(--${target})`;
  }
  if (value.colorSpace !== 'oklch' || value.components.length !== 3) {
    throw new Error(`Token "${name}" is not an OKLCH colour`);
  }
  const [l, c, h] = value.components;
  const alpha = value.alpha === undefined || value.alpha === 1 ? '' : ` / ${value.alpha}`;
  return `oklch(${l} ${c} ${h}${alpha})`;
}
