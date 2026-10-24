import { useCallback, useEffect, useRef, useState } from 'react';

import { streamAnswer } from '../../mock/streamAnswer';
import { applyEvent, createTurn } from '@/lib/stream';

import type { CoachingCard } from '../../mock/types';
import type { IAnnouncement, IAssistant, IPinnedTurn, ITurn } from '@/types/assistant.types';

/** How long an unpin can be undone. */
export const UNDO_WINDOW_MS = 10_000;

/** An unpinned card waiting for its undo, with the place it left and the timer that forgets it. */
interface IUndoable {
  turn: IPinnedTurn;
  index: number;
  timer: number;
}

/**
 * Owns the assistant's conversation: the turns, whether the panel is open, what is pinned and what
 * the live region should say. It lives in the host (App) rather than the panel so an answer keeps
 * streaming while the panel is closed and a pinned card outlives the panel on the dashboard. Each
 * returned value is documented on `IAssistant`.
 *
 * Flow: `ask` adds an empty turn and starts `consume`, which pulls the mock stream one event at a
 * time and folds each into that turn with `applyEvent` (status, three text deltas, the card, done).
 */
function useAssistant(): IAssistant {
  // The conversation, oldest first. Each turn is one question and the answer streaming into it.
  const [turns, setTurns] = useState<ITurn[]>([]);
  // Whether the panel shows. Separate from streaming: closing hides it, the answer keeps arriving.
  const [isOpen, setIsOpen] = useState(false);
  // Cards on the dashboard, newest first. Kept here so they outlive the panel.
  const [pinned, setPinned] = useState<IPinnedTurn[]>([]);
  // An answer finished while the panel was closed; the prompt bar shows "Answer ready".
  const [hasUnseenAnswer, setHasUnseenAnswer] = useState(false);
  // What the live region says next: the status, then "Answer ready". Text chunks are not announced.
  const [announcement, setAnnouncement] = useState<IAnnouncement | null>(null);

  // The stream reads this when it finishes, long after the render that started it.
  const isOpenRef = useRef(false);
  // Numbers the turns' ids. A ref, because a new id never needs a re-render.
  const turnCount = useRef(0);
  // Unpinned cards that can still be undone, by turn id. A ref: the toasts read it, nothing renders it.
  const undoable = useRef(new Map<string, IUndoable>());

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

  // Newest pin goes on top, and the panel closes so the card can be seen settling on the dashboard.
  const pin = ({ id, prompt, card }: ITurn) => {
    if (!card || pinned.some(entry => entry.turnId === id)) return;

    const pinnedCount = pinned.length + 1;
    setPinned(current => [{ turnId: id, prompt, card }, ...current]);
    setIsOpen(false);
    announce(
      pinnedCount > 1
        ? `Coaching card pinned to your dashboard. ${pinnedCount} answers pinned.`
        : 'Coaching card pinned to your dashboard.',
    );
  };

  // Each unpin keeps its own undo timer, so two quick unpins can both be undone from their own toasts.
  const unpin = (turnId: string) => {
    const index = pinned.findIndex(entry => entry.turnId === turnId);
    if (index === -1) return;

    window.clearTimeout(undoable.current.get(turnId)?.timer);
    undoable.current.set(turnId, {
      turn: pinned[index],
      index,
      timer: window.setTimeout(() => undoable.current.delete(turnId), UNDO_WINDOW_MS),
    });
    setPinned(current => current.filter(entry => entry.turnId !== turnId));
    announce(
      `Coaching card removed from your dashboard. Undo is available for ${UNDO_WINDOW_MS / 1000} seconds.`,
    );
  };

  // Puts one unpinned card back where it was, if its undo window is still open. The updater reads
  // the latest list, so a toast clicked after other changes never restores into a stale one.
  const undoUnpin = (turnId: string) => {
    const entry = undoable.current.get(turnId);
    if (!entry) return;

    undoable.current.delete(turnId);
    window.clearTimeout(entry.timer);
    setPinned(current => {
      if (current.some(pinnedTurn => pinnedTurn.turnId === turnId)) return current;
      const at = Math.min(entry.index, current.length);
      return [...current.slice(0, at), entry.turn, ...current.slice(at)];
    });
    announce('Coaching card pinned to your dashboard again.');
  };

  // Pending undo timers die with the host.
  useEffect(() => {
    const pending = undoable.current;
    return () => pending.forEach(entry => window.clearTimeout(entry.timer));
  }, []);

  return {
    turns,
    isOpen,
    hasUnseenAnswer,
    announcement,
    pinned,
    ask,
    open,
    close,
    pin,
    unpin,
    undoUnpin,
  };
}

export default useAssistant;
