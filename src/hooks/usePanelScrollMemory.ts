import { useRef } from 'react';

/**
 * Where the reader had scrolled the panel, kept across a close so reopening can resume there.
 * `key` names what the panel is showing (the chat and how many turns it has); the memory is
 * forgotten when it changes, since a new answer or another chat opens at its own start.
 */
function usePanelScrollMemory(key: string) {
  const memory = useRef<{ top: number; key: string } | null>(null);

  const remember = (top: number) => {
    memory.current = { top, key };
  };

  const resumeTop = memory.current?.key === key ? memory.current.top : undefined;

  return { remember, resumeTop };
}

export default usePanelScrollMemory;
