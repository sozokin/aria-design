import { useSyncExternalStore } from 'react';

/** Screens this wide or wider get the desktop layout (styles.css switches at 760px). */
export const SHELL_DESKTOP_QUERY = '(min-width: 761px)';

/**
 * Tells whether a CSS media query matches, and updates when that changes.
 *
 * @param query - A media query, for example `SHELL_DESKTOP_QUERY`.
 * @returns True while the query matches. Always false during server rendering.
 */
function useMediaQuery(query: string) {
  return useSyncExternalStore(
    onChange => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export default useMediaQuery;
