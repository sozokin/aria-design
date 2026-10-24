import { useEffect, type RefObject } from 'react';

/**
 * Cmd/Ctrl+K focuses the sidebar search its hint advertises. `beforeFocus` runs first so a compact
 * sidebar can expand and make the field visible. Disabled on mobile, where the field is hidden.
 */
function useSearchShortcut(
  searchRef: RefObject<HTMLInputElement | null>,
  enabled: boolean,
  beforeFocus: () => void,
) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isShortcut =
        event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey) && !event.altKey;
      if (!isShortcut || !searchRef.current) return;

      event.preventDefault();
      beforeFocus();
      // The field may be hidden until the expanded layout has rendered.
      window.requestAnimationFrame(() => {
        searchRef.current?.focus();
        searchRef.current?.select();
      });
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchRef, enabled, beforeFocus]);
}

export default useSearchShortcut;
