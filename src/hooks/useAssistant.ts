import { useCallback, useEffect, useRef, useState } from 'react';

import { streamAnswer } from '../../mock/streamAnswer';
import { chatSummaries } from '@/lib/chats';
import { applyEvent, createTurn } from '@/lib/stream';

import type { CoachingCard } from '../../mock/types';
import type { IAnnouncement, IAssistant, IPinnedTurn, ITurn } from '@/types/assistant.types';

/** How long, in milliseconds, an unpin can still be undone. */
export const UNDO_WINDOW_MS = 10_000;

/** A card that was just unpinned and can still be put back. */
interface IUndoable {
  turn: IPinnedTurn;
  index: number;
  timer: number;
}

/**
 * Holds everything the AI Assistant knows: every chat, the open panel, pinned cards and what
 * screen readers should hear.
 *
 * It lives in `App`, not in the panel, so that:
 * - an answer keeps streaming while the panel is closed, and
 * - a pinned card stays on the dashboard after the panel has gone.
 *
 * How an answer arrives: `ask` adds an empty turn and starts `consume`. `consume` reads the mock
 * stream one event at a time (status, three text chunks, the card, done) and adds each event to
 * that turn with `applyEvent`.
 *
 * @returns The state and actions described on `IAssistant`.
 */
function useAssistant(): IAssistant {
  /** Every chat's turns, oldest first. A turn is one question plus its answer. */
  const [allTurns, setAllTurns] = useState<ITurn[]>([]);
  /** The chat the panel is showing. */
  const [activeChatId, setActiveChatId] = useState('chat-1');
  /** Whether the panel is on screen. Closing it does not stop an answer from streaming. */
  const [isOpen, setIsOpen] = useState(false);
  /** Desktop only: the panel fills most of the screen. Remembered across closes. */
  const [isExpanded, setIsExpanded] = useState(false);
  /** Cards pinned to the dashboard, newest first. */
  const [pinned, setPinned] = useState<IPinnedTurn[]>([]);
  /**
   * A chat whose answer finished while the reader was not looking (panel closed, or another chat
   * open). The prompt bar shows "Answer ready" for it.
   */
  const [unseenChatId, setUnseenChatId] = useState<string | null>(null);
  /** The next thing screen readers should hear. Text chunks are never announced. */
  const [announcement, setAnnouncement] = useState<IAnnouncement | null>(null);

  /** Copies of `isOpen` and `activeChatId` that the stream can read when it finishes. */
  const isOpenRef = useRef(false);
  const activeChatIdRef = useRef(activeChatId);
  /** Counters for new turn and chat ids. Refs, because a new id never needs a re-render. */
  const turnCount = useRef(0);
  const chatCount = useRef(1);
  /** Unpinned cards that can still be undone, by turn id. */
  const undoable = useRef(new Map<string, IUndoable>());
  /**
   * Something to run once the panel has finished leaving the screen, so the dashboard changes
   * where the reader can see it: a pin on mobile, or an unpin started from the panel.
   */
  const afterClose = useRef<(() => void) | null>(null);

  useEffect(() => {
    isOpenRef.current = isOpen;
    activeChatIdRef.current = activeChatId;
  }, [isOpen, activeChatId]);

  /** Says `text` to screen readers. A fresh id makes a repeated message be read again. */
  const announce = useCallback((text: string) => setAnnouncement({ id: Date.now(), text }), []);

  const turns = allTurns.filter(turn => turn.chatId === activeChatId);
  const chats = chatSummaries(allTurns);
  /**
   * An answer is still arriving somewhere the reader is not looking (another chat, or behind a
   * closed panel). The prompt bar shows a pulsing dot for it.
   */
  const isAnswering = allTurns.some(
    turn => turn.phase !== 'complete' && (turn.chatId !== activeChatId || !isOpen),
  );

  /** Reads one answer from the mock stream into its turn, event by event. */
  const consume = useCallback(
    async (id: string, chatId: string, prompt: string) => {
      let card: CoachingCard | null = null;

      for await (const event of streamAnswer(prompt)) {
        // Update only this answer's turn, using the latest list. That way a follow-up never
        // changes an earlier answer, and an answer still lands in its own chat after a switch.
        setAllTurns(all => all.map(turn => (turn.id === id ? applyEvent(turn, event) : turn)));

        if (event.type === 'status') announce(event.label);
        if (event.type === 'artifact') card = event.data;
        if (event.type === 'done') {
          announce(
            card
              ? `Answer ready. Coaching card for ${card.rep} with ${card.rows.length} scored skills.`
              : 'Answer ready.',
          );
          // The reader missed it (panel closed, or another chat open): mark it as unseen.
          if (!isOpenRef.current || activeChatIdRef.current !== chatId) setUnseenChatId(chatId);
        }
      }
    },
    [announce],
  );

  /** Asks a question in the active chat: adds an empty turn, opens the panel, starts streaming. */
  const ask = useCallback(
    (prompt: string) => {
      const id = `turn-${++turnCount.current}`;
      setAllTurns(all => [...all, createTurn(id, activeChatId, prompt)]);
      setIsOpen(true);
      setUnseenChatId(unseen => (unseen === activeChatId ? null : unseen));
      void consume(id, activeChatId, prompt);
    },
    [consume, activeChatId],
  );

  /** Opens the panel on the active chat. Looking at it clears its "unseen" mark. */
  const open = useCallback(() => {
    setIsOpen(true);
    setUnseenChatId(unseen => (unseen === activeChatId ? null : unseen));
  }, [activeChatId]);

  /** Hides the panel. Chats and any answer still streaming are left alone. */
  const close = useCallback(() => setIsOpen(false), []);

  /**
   * Hides the panel, then runs `action` once it has finished leaving the screen.
   * If the panel is already hidden, `action` runs straight away.
   */
  const closeThen = (action: () => void) => {
    if (!isOpen) {
      action();
      return;
    }
    afterClose.current = action;
    setIsOpen(false);
  };

  /** Called by `App` when the panel has left the screen: runs the waiting action, if any. */
  const onClosed = useCallback(() => {
    const action = afterClose.current;
    afterClose.current = null;
    action?.();
  }, []);

  // Reopened before it finished leaving: that exit never reports back, so stop waiting here.
  useEffect(() => {
    if (isOpen) onClosed();
  }, [isOpen, onClosed]);

  /**
   * Starts a new chat and opens the panel on "How can I help?".
   * If the active chat has no questions yet, it already is a new chat, so only the panel opens.
   * A chat shows up in the history once its first question is asked.
   */
  const newChat = () => {
    if (turns.length > 0) setActiveChatId(`chat-${++chatCount.current}`);
    setIsOpen(true);
    announce('New chat. How can I help?');
  };

  /**
   * Opens an earlier chat in the panel. Screen readers hear which chat it is, because the
   * panel's title changes while focus may be somewhere else.
   */
  const switchChat = (chatId: string) => {
    setActiveChatId(chatId);
    setIsOpen(true);
    setUnseenChatId(unseen => (unseen === chatId ? null : unseen));
    const title = chats.find(chat => chat.id === chatId)?.title;
    if (title) announce(`Opened chat: ${title}`);
  };

  /** For the "Answer ready" pill: opens the chat whose answer finished unseen. */
  const openUnseenAnswer = () => {
    if (!unseenChatId) return;
    if (unseenChatId === activeChatId) open();
    else switchChat(unseenChatId);
  };

  /** Pins a turn's card to the top of the dashboard and closes the panel so the card is seen. */
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

  /**
   * Removes a pinned card and keeps it for `UNDO_WINDOW_MS` so it can be put back.
   * Each unpin has its own timer, so two quick unpins can both be undone.
   */
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
    // No announcement here: the undo toast already tells screen readers, time limit included.
  };

  /**
   * Puts an unpinned card back in its old place, if its undo time has not run out.
   * Works on the latest list, so a late Undo never restores into an old version of it.
   */
  const undoUnpin = (turnId: string) => {
    const entry = undoable.current.get(turnId);
    if (!entry) return;

    undoable.current.delete(turnId);
    window.clearTimeout(entry.timer);
    setPinned(current => {
      if (current.some(pinnedTurn => pinnedTurn.turnId === turnId)) return current;
      const at = Math.min(entry.index, current.length);
      return [...current.slice(0, at), { ...entry.turn, restored: true }, ...current.slice(at)];
    });
    announce('Coaching card pinned to your dashboard again.');
  };

  // Clear any undo timers still running when the app unmounts.
  useEffect(() => {
    const pending = undoable.current;
    return () => pending.forEach(entry => window.clearTimeout(entry.timer));
  }, []);

  return {
    turns,
    activeChatId,
    chats,
    isOpen,
    isExpanded,
    isAnswering,
    hasUnseenAnswer: unseenChatId !== null,
    announcement,
    pinned,
    ask,
    open,
    close,
    closeThen,
    onClosed,
    setExpanded: setIsExpanded,
    newChat,
    switchChat,
    openUnseenAnswer,
    pin,
    unpin,
    undoUnpin,
  };
}

export default useAssistant;
