import { useCallback, useEffect, useRef, useState } from 'react';

import { streamAnswer } from '../../mock/streamAnswer';
import { applyEvent, createTurn } from '@/lib/stream';

import type { CoachingCard } from '../../mock/types';
import type { IAnnouncement, IAssistant, ITurn } from '@/types/assistant.types';

/**
 * Owns the assistant's conversation: the turns, whether the panel is open and what the live region
 * should say. It lives in the host (App) rather than the panel so an answer keeps streaming while
 * the panel is closed. Each returned value is documented on `IAssistant`.
 *
 * Flow: `ask` adds an empty turn and starts `consume`, which pulls the mock stream one event at a
 * time and folds each into that turn with `applyEvent` (status, three text deltas, the card, done).
 */
function useAssistant(): IAssistant {
  // The conversation, oldest first. Each turn is one question and the answer streaming into it.
  const [turns, setTurns] = useState<ITurn[]>([]);
  // Whether the panel shows. Separate from streaming: closing hides it, the answer keeps arriving.
  const [isOpen, setIsOpen] = useState(false);
  // An answer finished while the panel was closed; the prompt bar shows "Answer ready".
  const [hasUnseenAnswer, setHasUnseenAnswer] = useState(false);
  // What the live region says next: the status, then "Answer ready". Text chunks are not announced.
  const [announcement, setAnnouncement] = useState<IAnnouncement | null>(null);

  // The stream reads this when it finishes, long after the render that started it.
  const isOpenRef = useRef(false);
  // Numbers the turns' ids. A ref, because a new id never needs a re-render.
  const turnCount = useRef(0);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // A fresh id makes the live region repeat a message even when its text is unchanged.
  const announce = useCallback((text: string) => setAnnouncement({ id: Date.now(), text }), []);

  // Pulls one answer from the mock stream into its turn, event by event.
  const consume = useCallback(
    async (id: string, prompt: string) => {
      let card: CoachingCard | null = null;

      for await (const event of streamAnswer(prompt)) {
        // The functional updater sees the latest turns, not the ones from when this loop began;
        // only this answer's turn changes, so a follow-up never touches an earlier one.
        setTurns(all => all.map(turn => (turn.id === id ? applyEvent(turn, event) : turn)));

        if (event.type === 'status') announce(event.label);
        if (event.type === 'artifact') card = event.data;
        if (event.type === 'done') {
          announce(
            card
              ? `Answer ready. Coaching card for ${card.rep} with ${card.rows.length} scored skills.`
              : 'Answer ready.',
          );
          if (!isOpenRef.current) setHasUnseenAnswer(true);
        }
      }
    },
    [announce],
  );

  // A new question: add its empty turn, show the panel and start streaming without waiting for it.
  const ask = useCallback(
    (prompt: string) => {
      const id = `turn-${++turnCount.current}`;
      setTurns(all => [...all, createTurn(id, prompt)]);
      setIsOpen(true);
      setHasUnseenAnswer(false);
      void consume(id, prompt);
    },
    [consume],
  );

  // Back to the existing conversation without asking anything; looking at it clears "unseen".
  const open = useCallback(() => {
    setIsOpen(true);
    setHasUnseenAnswer(false);
  }, []);

  // Only hides the panel: the turns and any running stream are left alone.
  const close = useCallback(() => setIsOpen(false), []);

  return {
    turns,
    isOpen,
    hasUnseenAnswer,
    announcement,
    ask,
    open,
    close,
  };
}

export default useAssistant;
