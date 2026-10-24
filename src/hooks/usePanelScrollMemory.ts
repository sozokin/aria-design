import { useRef } from 'react';

/**
 * Where the reader had scrolled the panel, kept across a close so reopening can resume there.
 * Forgotten once a new answer arrives, since the panel then opens at that answer's start.
 */
function usePanelScrollMemory(turnCount: number) {
  const memory = useRef<{ top: number; turnCount: number } | null>(null);

  const remember = (top: number) => {
    memory.current = { top, turnCount };
  };

  const resumeTop = memory.current?.turnCount === turnCount ? memory.current.top : undefined;

  return { remember, resumeTop };
}

export default usePanelScrollMemory;
