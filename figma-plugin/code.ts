/**
 * The plugin's Figma side. It reads the dummy governance-test collection, turns it into
 * tokens.json and tokens.css with the same code the repo's CLI uses, and hands both to the
 * window (ui.html), which talks to GitHub. It never changes the Figma file.
 */
import {
  diffTokens,
  figmaColorsToTokens,
  renderTokensCss,
  serializeTokens,
  type IFigmaColor,
} from '../scripts/tokens-core.ts';

/** Only this collection is read; the file's real Color collection is never touched. */
const COLLECTION = 'Dummy tokens · Governance test';
const PREFIX = 'dummy-governance-test/';
const TOKEN_KEY = 'github-token';

figma.showUI(__html__, { width: 440, height: 560, themeColors: true });

figma.ui.onmessage = async (message: { type: string; token?: string; current?: string }) => {
  try {
    if (message.type === 'save-token') {
      await figma.clientStorage.setAsync(TOKEN_KEY, message.token ?? '');
    } else if (message.type === 'diff') {
      // Read Figma afresh each time, so edits made while the plugin is open are included.
      const tokens = figmaColorsToTokens(await readCollection());
      const current = message.current ? JSON.parse(message.current) : { color: { $type: 'color' } };
      figma.ui.postMessage({
        type: 'diff-result',
        changes: diffTokens(current, tokens),
        json: serializeTokens(tokens),
        css: renderTokensCss(tokens),
      });
    }
  } catch (error) {
    figma.ui.postMessage({
      type: 'error',
      message: String(error instanceof Error ? error.message : error),
    });
  }
};

figma.clientStorage.getAsync(TOKEN_KEY).then(token => {
  figma.ui.postMessage({ type: 'ready', token: token ?? '', collection: COLLECTION });
});

/** The collection's colour variables, in Figma's order, with the group prefix dropped. */
async function readCollection(): Promise<IFigmaColor[]> {
  const collections = await figma.variables.getLocalVariableCollectionsAsync();
  const collection = collections.find(c => c.name === COLLECTION);
  if (!collection) throw new Error(`No variable collection named "${COLLECTION}" in this file.`);

  const variables = await Promise.all(
    collection.variableIds.map(id => figma.variables.getVariableByIdAsync(id)),
  );
  const nameById = new Map(variables.map(v => [v!.id, v!.name]));

  return variables.map(variable => {
    const v = variable!;
    const name = stripPrefix(v.name);
    const value = v.valuesByMode[collection.defaultModeId];
    if (typeof value === 'object' && 'type' in value && value.type === 'VARIABLE_ALIAS') {
      const target = nameById.get(value.id);
      if (!target) throw new Error(`"${v.name}" points outside the ${COLLECTION} collection.`);
      return { name, aliasOf: stripPrefix(target) };
    }
    if (v.resolvedType !== 'COLOR' || typeof value !== 'object' || !('r' in value)) {
      throw new Error(`"${v.name}" is not a colour.`);
    }
    return { name, rgba: { r: value.r, g: value.g, b: value.b, a: 'a' in value ? value.a : 1 } };
  });
}

function stripPrefix(name: string) {
  if (!name.startsWith(PREFIX)) throw new Error(`"${name}" is not named ${PREFIX}…`);
  return name.slice(PREFIX.length);
}
