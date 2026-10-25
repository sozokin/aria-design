import { useEffect, type RefObject } from 'react';

/**
 * Makes Cmd+K (Ctrl+K on Windows) jump to the sidebar's search field, as its hint promises.
 *
 * @param searchRef - The search field.
 * @param enabled - Off on mobile, where the field is hidden.
 * @param beforeFocus - Runs first, so a compact sidebar can expand and show the field.
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
      // Wait a frame: the field may only appear once the expanded sidebar has rendered.
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
