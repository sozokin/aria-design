import { useSyncExternalStore } from 'react';

/** The shell switches to its desktop layout at this width (styles.css: max-width: 760px). */
export const SHELL_DESKTOP_QUERY = '(min-width: 761px)';

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
