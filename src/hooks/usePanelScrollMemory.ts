import { useRef } from 'react';

/**
 * Remembers how far the reader scrolled the panel, so reopening it lands in the same place.
 *
 * The memory is tied to `key` (which chat, and how many turns it has). When the key changes,
 * because a new answer arrived or another chat opened, the panel starts at the top instead.
 *
 * @param key - Names what the panel is showing.
 * @returns `remember(top)` to save the scroll position, and `resumeTop` to restore it (or
 *   `undefined` when there is nothing to restore).
 */
function usePanelScrollMemory(key: string) {
  const memory = useRef<{ top: number; key: string } | null>(null);

  /** Saves the current scroll position for this key. */
  const remember = (top: number) => {
    memory.current = { top, key };
  };

  const resumeTop = memory.current?.key === key ? memory.current.top : undefined;

  return { remember, resumeTop };
}

export default usePanelScrollMemory;
