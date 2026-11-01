/**
 * Builds src/tokens.css from tokens/tokens.json, the design tokens exported from Figma.
 *
 *   node scripts/tokens.ts          writes src/tokens.css
 *   node scripts/tokens.ts --check  fails if src/tokens.css is not what tokens.json produces
 *
 * tokens.json follows the W3C Design Tokens format: each token has a `$value` that is either an
 * OKLCH colour or a reference to another token, written `{color.name}`. Every token becomes one
 * custom property of the same name on `:root`; the `@theme inline` block in src/index.css maps
 * those to Tailwind utilities, so `--primary` here is what `bg-primary` paints.
 */
import { readFileSync, writeFileSync } from 'node:fs';

interface IOklchValue {
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

const TOKENS_PATH = 'tokens/tokens.json';
const CSS_PATH = 'src/tokens.css';
const REFERENCE = /^\{color\.([a-z0-9-]+)\}$/;

const HEADER = `/* Generated from ${TOKENS_PATH} by scripts/tokens.ts. Do not edit by hand:
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
  const { $type: _type, ...color } = tokens.color;
  const lines = Object.entries(color).map(([name, token]) => {
    if (typeof token !== 'object') throw new Error(`Token "${name}" has no $value`);
    return `  --${name}: ${renderValue(name, token.$value, color)};`;
  });
  return `${HEADER}\n:root {\n${lines.join('\n')}\n}\n`;
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

if (import.meta.main) {
  const css = renderTokensCss(JSON.parse(readFileSync(TOKENS_PATH, 'utf8')));
  if (process.argv.includes('--check')) {
    if (readFileSync(CSS_PATH, 'utf8') !== css) {
      console.error(`${CSS_PATH} is out of date with ${TOKENS_PATH}. Run \`npm run tokens\`.`);
      process.exit(1);
    }
    console.log(`${CSS_PATH} matches ${TOKENS_PATH}.`);
  } else {
    writeFileSync(CSS_PATH, css);
    console.log(`Wrote ${CSS_PATH}.`);
  }
}
