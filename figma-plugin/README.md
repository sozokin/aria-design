# Publish tokens to code (governance test)

A private Figma plugin that reads the **Dummy tokens · Governance test** collection and commits it
to `feat/governance` as `tokens/tokens.json` and the generated `src/tokens.css`, in one commit. It
reads nothing else in the file and changes nothing in Figma. The branch is fixed in `ui.html`, and
the plugin refuses `main`.

## Set up (once)

1. Build it: `npm run plugin:build` (writes `figma-plugin/dist/code.js`, which git ignores).
2. Make a GitHub token at <https://github.com/settings/personal-access-tokens/new>:
   - Repository access: **Only select repositories** → `sozokin/aria-design`
   - Permissions: **Contents → Read and write** (nothing else)
   - A short expiry is fine; make a new one when it runs out.
3. In the Figma **desktop app**, open the file, then **Plugins → Development → Import plugin from
   manifest…** and pick `figma-plugin/manifest.json`.

## Publish a change

1. Change a variable in **Dummy tokens · Governance test** (e.g. `dummy-governance-test/primary`).
2. Run **Plugins → Development → Aria · Publish tokens to code**. Paste the token the first time;
   the plugin keeps it on this machine only.
3. **Check changes** lists every token that differs from the branch, old value → new.
4. **Publish to feat/governance** makes the commit. CI runs on it.
5. In `aria-design`, `git pull` with `npm run dev` running: the colour updates without a reload.

## Remove it

Right-click it under **Plugins → Development → Remove**, and delete the token on GitHub.
