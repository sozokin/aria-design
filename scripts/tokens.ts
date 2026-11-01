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

import { renderTokensCss } from './tokens-core.ts';

const TOKENS_PATH = 'tokens/tokens.json';
const CSS_PATH = 'src/tokens.css';

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
