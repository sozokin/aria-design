import { useCallback, useEffect, useRef, useState } from 'react';

import { streamAnswer } from '../../mock/streamAnswer';
import { chatSummaries } from '@/lib/chats';
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
 * Owns the assistant's conversations: the turns of every chat, which chat is active, whether the
 * panel is open, what is pinned and what the live region should say. It lives in the host (App)
 * rather than the panel so an answer keeps streaming while the panel is closed and a pinned card
 * outlives the panel on the dashboard. Each returned value is documented on `IAssistant`.
 *
 * Flow: `ask` adds an empty turn to the active chat and starts `consume`, which pulls the mock
 * stream one event at a time and folds each into that turn with `applyEvent` (status, three text
 * deltas, the card, done).
 */
function useAssistant(): IAssistant {
  // Every chat's turns, oldest first. Each turn is one question and the answer streaming into it,
  // tagged with the chat it was asked in.
  const [allTurns, setAllTurns] = useState<ITurn[]>([]);
  // The chat the panel shows. Switching only changes which turns are picked out below.
  const [activeChatId, setActiveChatId] = useState('chat-1');
  // Whether the panel shows. Separate from streaming: closing hides it, the answer keeps arriving.
  const [isOpen, setIsOpen] = useState(false);
  // Desktop: the panel at most of the screen's size. Kept across closes; the host ignores it on mobile.
  const [isExpanded, setIsExpanded] = useState(false);
  // Cards on the dashboard, newest first. Kept here so they outlive the panel.
  const [pinned, setPinned] = useState<IPinnedTurn[]>([]);
  // The chat whose answer finished out of view (behind a closed panel, or while another chat was
  // active) and has not been looked at since; the prompt bar shows "Answer ready" for it.
  const [unseenChatId, setUnseenChatId] = useState<string | null>(null);
  // What the live region says next: the status, then "Answer ready". Text chunks are not announced.
  const [announcement, setAnnouncement] = useState<IAnnouncement | null>(null);

  // The stream reads these when it finishes, long after the render that started it.
  const isOpenRef = useRef(false);
  const activeChatIdRef = useRef(activeChatId);
  // Number the turns' and chats' ids. Refs, because a new id never needs a re-render.
  const turnCount = useRef(0);
  const chatCount = useRef(1);
  // Unpinned cards that can still be undone, by turn id. A ref: the toasts read it, nothing renders it.
  const undoable = useRef(new Map<string, IUndoable>());
  // What waits for the panel to leave the screen (a pin on mobile, where there is no glide to
  // follow; an unpin asked from the chat), so the dashboard changes in view, not behind the panel.
  const afterClose = useRef<(() => void) | null>(null);

  useEffect(() => {
    isOpenRef.current = isOpen;
    activeChatIdRef.current = activeChatId;
  }, [isOpen, activeChatId]);

  // A fresh id makes the live region repeat a message even when its text is unchanged.
  const announce = useCallback((text: string) => setAnnouncement({ id: Date.now(), text }), []);

  const turns = allTurns.filter(turn => turn.chatId === activeChatId);
  const chats = chatSummaries(allTurns);
  // An answer still arriving where the reader is not looking: in another chat, or behind a closed
  // panel. The prompt bar shows a pulse for it.
  const isAnswering = allTurns.some(
    turn => turn.phase !== 'complete' && (turn.chatId !== activeChatId || !isOpen),
  );

  // Pulls one answer from the mock stream into its turn, event by event.
  const consume = useCallback(
    async (id: string, chatId: string, prompt: string) => {
      let card: CoachingCard | null = null;

      for await (const event of streamAnswer(prompt)) {
        // The functional updater sees the latest turns, not the ones from when this loop began;
        // only this answer's turn changes, so a follow-up never touches an earlier one, and an
        // answer keeps landing in its own chat after the reader has switched to another.
        setAllTurns(all => all.map(turn => (turn.id === id ? applyEvent(turn, event) : turn)));

        if (event.type === 'status') announce(event.label);
        if (event.type === 'artifact') card = event.data;
        if (event.type === 'done') {
          announce(
            card
              ? `Answer ready. Coaching card for ${card.rep} with ${card.rows.length} scored skills.`
              : 'Answer ready.',
          );
          // Finished out of view: behind a closed panel, or in a chat the reader has left.
          if (!isOpenRef.current || activeChatIdRef.current !== chatId) setUnseenChatId(chatId);
        }
      }
    },
    [announce],
  );

  // A new question in the active chat: add its empty turn, show the panel and start streaming
  // without waiting for it.
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

  // Back to the active chat without asking anything; looking at it clears its "unseen".
  const open = useCallback(() => {
    setIsOpen(true);
    setUnseenChatId(unseen => (unseen === activeChatId ? null : unseen));
  }, [activeChatId]);

  // Only hides the panel: the turns and any running stream are left alone.
  const close = useCallback(() => setIsOpen(false), []);

  // Hides the panel and holds `action` until the host reports the exit finished. With the panel
  // already hidden there is nothing to wait for.
  const closeThen = (action: () => void) => {
    if (!isOpen) {
      action();
      return;
    }
    afterClose.current = action;
    setIsOpen(false);
  };

  const onClosed = useCallback(() => {
    const action = afterClose.current;
    afterClose.current = null;
    action?.();
  }, []);

  // Reopened before the exit could finish: that exit never reports, so the wait ends here.
  useEffect(() => {
    if (isOpen) onClosed();
  }, [isOpen, onClosed]);

  // A fresh chat, opened on its empty state so the panel can ask how it can help. An active chat
  // that has not been asked anything is that fresh chat already, so then only the panel opens. The
  // chat joins the history once its first question is asked.
  const newChat = () => {
    if (turns.length > 0) setActiveChatId(`chat-${++chatCount.current}`);
    setIsOpen(true);
    announce('New chat. How can I help?');
  };

  // Back to an earlier chat, with the panel open on it. The dialog's title changes under a focused
  // History button, so the live region says which chat this now is.
  const switchChat = (chatId: string) => {
    setActiveChatId(chatId);
    setIsOpen(true);
    setUnseenChatId(unseen => (unseen === chatId ? null : unseen));
    const title = chats.find(chat => chat.id === chatId)?.title;
    if (title) announce(`Opened chat: ${title}`);
  };

  // The "Answer ready" pill: shows the chat whose answer finished out of view, switching to it if
  // the reader has moved on to another chat since.
  const openUnseenAnswer = () => {
    if (!unseenChatId) return;
    if (unseenChatId === activeChatId) open();
    else switchChat(unseenChatId);
  };

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
    // Not announced here: the host's undo toast is a live region of its own and says it, with the
    // time limit, so a second announcement would only repeat it.
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
      return [...current.slice(0, at), { ...entry.turn, restored: true }, ...current.slice(at)];
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
