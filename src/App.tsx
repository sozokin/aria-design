/**
 * @file Aria Sales Hub: the app shell.
 *
 * The shell owns the dashboard and the AI Assistant entry point. `App` only puts the pieces
 * together: it holds the state and refs the widgets share, and each widget owns its own markup.
 */
import { useMemo, useRef, useState, type CSSProperties, type FC as ReactFC } from 'react';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'motion/react';
import { toast } from 'sonner';

import ToastProgress from '@/components/ToastProgress';
import { Toaster } from '@/components/ui/sonner';
import AssistantExperience from '@/widgets/AssistantExperience';
import ChatHistory from '@/widgets/AssistantExperience/ChatHistory';
import LiveAnnouncer from '@/widgets/AssistantExperience/LiveAnnouncer';
import PinnedAnswer, { pinnedAnswerId } from '@/widgets/AssistantExperience/PinnedAnswer';
import Brief from '@/widgets/Brief';
import PromptBar, { promptBarHeight } from '@/widgets/PromptBar';
import Sidebar from '@/widgets/Sidebar';
import TeamOverview from '@/widgets/TeamOverview';
import InlineTeamOverview from '@/widgets/TeamOverview/InlineTeamOverview';
import TeamOverviewDrawer from '@/widgets/TeamOverview/TeamOverviewDrawer';

import useAssistant, { UNDO_WINDOW_MS } from '@/hooks/useAssistant';
import useColumnAnchor from '@/hooks/useColumnAnchor';
import useMediaQuery, { SHELL_DESKTOP_QUERY } from '@/hooks/useMediaQuery';
import usePanelScrollMemory from '@/hooks/usePanelScrollMemory';
import useRailCollapse, { RAIL_TOGGLE_SLOT_ID } from '@/hooks/useRailCollapse';
import { LOAD_IN, loadIn } from '@/lib/motion';
import { cn } from '@/lib/utils';

/** The opening question the brief suggests before any answer exists. */
const DEFAULT_PROMPT = 'How is Marcus doing on discovery calls this quarter?';
/** The date line shown on the dashboard. */
const TODAY = 'Today · Friday, September 4';

/**
 * The whole page: sidebar, dashboard (greeting, brief, pinned answers, team overview), the AI
 * Assistant panel, the prompt bar, and the toasts.
 *
 * It also decides where keyboard focus goes as the panel opens and closes:
 * - Opening the panel moves focus into it, except when it opens because the reader focused or
 *   typed in the prompt bar (the caret stays there).
 * - Closing it puts focus back on the send button.
 * - Unpinning a card moves focus to the toast's Undo button.
 */
const App: ReactFC = () => {
  const isDesktop = useMediaQuery(SHELL_DESKTOP_QUERY);
  const reduceMotion = useReducedMotion();
  const assistant = useAssistant();
  const rail = useRailCollapse(isDesktop);

  const columnRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  /** The prompt field and send button. The open panel fits itself between them when tabbing. */
  const entryPoint = useMemo(() => ({ field: promptRef, send: sendButtonRef }), []);
  const columnAnchor = useColumnAnchor(columnRef);

  const [sidebarIsCompact, setSidebarIsCompact] = useState(false);
  /** The prompt bar's text. It starts empty; the brief's chip offers the opening question. */
  const [prompt, setPrompt] = useState('');
  /** How many lines the prompt bar shows. The panel and the + button sit above it, so they need this. */
  const [promptLines, setPromptLines] = useState(1);

  const thread = assistant.turns[0];
  /**
   * The brief's suggested next step: the latest answer's next step, or the opening question
   * before there is any answer.
   */
  const latestCard = [...assistant.turns].reverse().find(turn => turn.card)?.card;
  const suggestedNextStep = latestCard?.nextStep ?? DEFAULT_PROMPT;

  /**
   * Whether the panel should take focus the next time it opens. It always does, except when it
   * opens because the reader focused or typed in the prompt bar: focusing something should never
   * change what is on screen around it (WCAG 3.2.1), and the caret should stay where the reader is
   * typing. Tab from the field then goes into the panel.
   */
  const [panelTakesFocus, setPanelTakesFocus] = useState(true);
  /**
   * Raised to ask an already open panel to take focus: after a new chat, after a chip that held
   * focus disappeared, or after a history sheet closed. The panel ignores it if focus is already
   * inside it.
   */
  const [panelFocusRequest, setPanelFocusRequest] = useState(0);
  /** Asks the open panel to take focus (see `panelFocusRequest`). */
  const focusPanel = () => setPanelFocusRequest(request => request + 1);
  const panelScroll = usePanelScrollMemory(`${assistant.activeChatId}:${assistant.turns.length}`);

  /**
   * Asks a suggested step from a chip (in the brief, on a pinned card, or in the panel) and moves
   * focus to the panel. The panel's empty-state chip disappears once the answer starts, so without
   * this, focus would fall back to the page.
   */
  const askWithFocus = (question: string) => {
    setPanelTakesFocus(true);
    assistant.ask(question);
    focusPanel();
  };

  /**
   * For the "Answer ready" pill: opens the answer that finished out of sight. The pill disappears
   * once the answer is seen, so focus moves to the panel.
   */
  const openUnseenAnswer = () => {
    setPanelTakesFocus(true);
    assistant.openUnseenAnswer();
    focusPanel();
  };

  /**
   * The send button (and Enter on desktop). It does what its arrow shows:
   * - With text: asks the question and clears the bar.
   * - Empty bar, panel closed: opens the panel, with focus in it.
   * - Empty bar, panel open: closes the panel.
   *
   * When asking while the panel is already open (typing opens it), the caret stays in the field,
   * Tab from there goes into the panel, and screen readers hear the progress.
   */
  const submitPrompt = () => {
    const text = prompt.trim();
    if (text) {
      setPanelTakesFocus(true);
      setPrompt('');
      assistant.ask(text);
    } else if (assistant.isOpen) {
      dismissAssistant();
    } else {
      setPanelTakesFocus(true);
      assistant.open();
    }
  };

  /**
   * Focusing, clicking or typing in the prompt bar opens the panel alongside it: the current
   * chat behind a closed panel, or "How can I help?" before anything is asked. Clicking and typing
   * also count, because after Escape the field may still have focus.
   */
  const reopenFromBar = () => {
    if (assistant.isOpen) return;
    setPanelTakesFocus(false);
    assistant.open();
  };

  /**
   * Closes the panel (Escape, the close button, the send arrow) and puts focus back on the send
   * button.
   * - Desktop: if focus is already in the prompt bar (Escape while typing), it stays there.
   * - Mobile: always moves to the button. iPhones do not focus a tapped button, so the field may
   *   still have focus, and leaving it there would keep the keyboard open over a closed panel.
   */
  const dismissAssistant = () => {
    assistant.close();
    const send = sendButtonRef.current;
    if (!send) return;
    if (isDesktop && send.form?.contains(document.activeElement)) return;
    send.focus({ preventScroll: true });
  };

  /**
   * The + button beside the bar, or the expanded panel's New chat button: opens the panel on a new
   * chat, with focus in it, so Tab reaches the suggested first question.
   */
  const startNewChat = () => {
    setPanelTakesFocus(true);
    assistant.newChat();
    focusPanel();
  };

  /**
   * Opens a chat picked from a history sheet (in the rail or the mobile menu) or from the expanded
   * panel's chats pane. Screen readers hear which chat opened.
   *
   * The panel does not take focus straight away, because the sheet still holds focus at that
   * moment. Once the sheet has closed, it hands focus to the panel (`onChoiceClosed`). From the
   * chats pane, focus is already inside the panel.
   */
  const openChatFromHistory = (chatId: string) => {
    setPanelTakesFocus(false);
    assistant.switchChat(chatId);
  };

  /** Counts undo toasts, so each one gets its own class and focus goes to the newest one's Undo. */
  const undoToastCount = useRef(0);

  /**
   * Focuses the element that `selector` matches, as soon as it appears on the page.
   * It watches the page for changes instead of checking every frame, because a background tab
   * slows frame checks to a crawl.
   *
   * @param selector - A CSS selector for the element to focus.
   */
  const focusWhenRendered = (selector: string) => {
    /** Focuses `element`, twice if needed (see below). */
    const focus = (element: HTMLElement) => {
      element.focus({ preventScroll: true });
      // When focus leaves a toast, sonner moves it back to whatever had it before the toast (an
      // Unpin button). Focusing a second time wins over that.
      if (document.activeElement !== element) element.focus({ preventScroll: true });
    };
    const rendered = document.querySelector<HTMLElement>(selector);
    if (rendered) {
      focus(rendered);
      return;
    }
    const observer = new MutationObserver(() => {
      const element = document.querySelector<HTMLElement>(selector);
      if (!element) return;
      observer.disconnect();
      focus(element);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    window.setTimeout(() => observer.disconnect(), UNDO_WINDOW_MS);
  };

  /**
   * After a toast that had focus goes away (its time ran out, or it was closed), puts focus on the
   * send button instead of leaving it on the page.
   *
   * Waits until sonner has finished removing the toast, because focus stays on the leaving toast
   * until then. If Undo already moved focus to the restored card, it is left there.
   */
  const returnFocusFromToast = () =>
    window.setTimeout(() => {
      const active = document.activeElement;
      if (!active || active === document.body || active.closest('[data-removed="true"]')) {
        sendButtonRef.current?.focus({ preventScroll: true });
      }
    }, 400);

  /**
   * Unpins a card and shows a toast with Undo for `UNDO_WINDOW_MS`. Each toast restores only its
   * own card.
   *
   * - The toast has no timer of its own (sonner's pauses on hover; the undo window does not).
   *   Its progress bar runs for exactly the undo window and then closes it, so the bar, the toast
   *   and Undo all end together.
   * - The Unpin button disappears with its card, so focus moves to the toast's Undo button.
   *   Screen readers hear the button, then the toast's message.
   */
  const unpinWithUndo = (turnId: string) => {
    const entry = assistant.pinned.find(pin => pin.turnId === turnId);
    assistant.unpin(turnId);
    const toastClass = `undo-toast-${++undoToastCount.current}`;
    const toastId = toast('Removed from your dashboard', {
      className: toastClass,
      description: (
        <>
          {entry && `${entry.card.rep} · ${entry.card.period}`}
          {/* The toast is what screen readers hear for an unpin, so it states the time limit too. */}
          <span className="sr-only">
            {` Undo is available for ${UNDO_WINDOW_MS / 1000} seconds.`}
          </span>
          <ToastProgress
            durationMs={UNDO_WINDOW_MS}
            onComplete={() => {
              toast.dismiss(toastId);
              returnFocusFromToast();
            }}
          />
        </>
      ),
      duration: Infinity,
      // The restored card takes focus. It normally does this itself when it appears, but if Undo
      // is pressed while the card is still collapsing, that same card comes back instead of a new one.
      action: {
        label: 'Undo',
        onClick: () => {
          assistant.undoUnpin(turnId);
          focusWhenRendered(`#${pinnedAnswerId(turnId)}`);
        },
      },
      onDismiss: returnFocusFromToast,
    });
    focusWhenRendered(`.${toastClass} [data-action]`);
  };

  /** Scrolls to a pinned card and focuses it (from the Pinned list). */
  const jumpToPinned = (turnId: string) => {
    const card = document.getElementById(pinnedAnswerId(turnId));
    // Asking for 'smooth' here works even though the page turns smooth scrolling off for reduced motion.
    card?.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    card?.focus({ preventScroll: true });
  };

  return (
    <div
      className={cn('app-shell', sidebarIsCompact ? 'sidebar-compact' : '')}
      style={{ '--prompt-bar-h': promptBarHeight(promptLines) } as CSSProperties}
    >
      <Sidebar
        isCompact={sidebarIsCompact}
        onCompactChange={setSidebarIsCompact}
        isDesktop={isDesktop}
      />

      <main className="main" id="top">
        {/* The dashboard and the panel share one layout group, so a pinned card can fly from the
            panel into the dashboard. */}
        <LayoutGroup>
          <div className="main-inner">
            {/* On desktop, the column and the right rail each scroll on their own (see .dashboard-* in styles.css). */}
            <div className="dashboard grid gap-x-10 gap-y-8 shell:grid-cols-[minmax(0,1fr)_17rem]">
              <div ref={columnRef} className="dashboard-column min-w-0">
                <div className="greeting-row">
                  <div
                    id={RAIL_TOGGLE_SLOT_ID}
                    className="flex w-full items-center justify-between gap-3 shell:w-auto"
                  >
                    {/* Space on the right for the fixed menu toggle, so a long greeting never runs under it. */}
                    {/* Only the heading animates, not its row: the row holds the mobile menu toggle's
                        spot, which is measured on load and must not be moving then. */}
                    <motion.h1 className="greeting pr-10 shell:pr-0" {...loadIn(LOAD_IN.greeting)}>
                      Good to see you, Jordan.
                    </motion.h1>
                    {!isDesktop && rail.toggleAnchor && (
                      <TeamOverviewDrawer
                        anchor={rail.toggleAnchor}
                        surfaced={rail.pageScrolled}
                        collapsed={rail.isCollapsed}
                        pinned={assistant.pinned}
                        onJumpToPinned={jumpToPinned}
                        chats={assistant.chats}
                        activeChatId={assistant.activeChatId}
                        onSwitchChat={openChatFromHistory}
                        onChoiceClosed={focusPanel}
                      />
                    )}
                  </div>
                  <motion.p className="date-eyebrow shell:hidden" {...loadIn(LOAD_IN.greeting)}>
                    {TODAY}
                  </motion.p>
                </div>

                <div className="content">
                  <Brief
                    suggestedNextStep={suggestedNextStep}
                    onAskNextStep={question => {
                      // If the bar still holds this exact question, clear it so "Ask a follow-up…" shows.
                      if (prompt.trim() === question) setPrompt('');
                      askWithFocus(question);
                    }}
                  />

                  {/* Mobile: the team overview also sits under the brief until it is collapsed into
                      the menu toggle (on desktop it is the right rail). AnimatePresence runs the
                      collapse. It allows the first-load animation (no initial={false}), so the card
                      fades in in its turn. */}
                  <AnimatePresence custom={rail.flight} onExitComplete={rail.settlePage}>
                    {!isDesktop && !rail.isCollapsed && (
                      <InlineTeamOverview
                        key="inline-team-overview"
                        pinned={assistant.pinned}
                        onJumpToPinned={jumpToPinned}
                        onCollapse={rail.collapse}
                      />
                    )}
                  </AnimatePresence>

                  {/* Pinned answers, newest first. Each can be unpinned and undone on its own. */}
                  <AnimatePresence>
                    {assistant.pinned.map(pin => (
                      <PinnedAnswer
                        key={pin.turnId}
                        pinned={pin}
                        shareCardLayout={isDesktop}
                        // Focus moves to the toast's Undo (see unpinWithUndo); Undo focuses the card again.
                        onUnpin={() => unpinWithUndo(pin.turnId)}
                        onAskNextStep={askWithFocus}
                      />
                    ))}
                  </AnimatePresence>

                  {/* Keeps the page's height while the team overview flies away, so the scroll never jumps. */}
                  <motion.div
                    aria-hidden="true"
                    initial={false}
                    animate={{ height: rail.spacerHeight }}
                    transition={{ duration: 0 }}
                  />
                </div>
              </div>

              {isDesktop && (
                <aside
                  className="dashboard-rail flex flex-col gap-6 pt-1"
                  aria-label="Team overview and pinned answers"
                >
                  <motion.div
                    className="flex flex-col items-end gap-1.5"
                    {...loadIn(LOAD_IN.greeting)}
                  >
                    <p className="date-eyebrow text-right">{TODAY}</p>
                    <ChatHistory
                      chats={assistant.chats}
                      activeChatId={assistant.activeChatId}
                      onSwitchChat={openChatFromHistory}
                      onChoiceClosed={focusPanel}
                      withLabel
                    />
                  </motion.div>
                  <TeamOverview pinned={assistant.pinned} onJumpToPinned={jumpToPinned} />
                </aside>
              )}
            </div>
          </div>

          <AssistantExperience
            isOpen={assistant.isOpen}
            // Expanded is desktop only; on mobile the panel already fills the screen.
            isExpanded={isDesktop && assistant.isExpanded}
            onExpandedChange={assistant.setExpanded}
            turns={assistant.turns}
            suggestedQuestion={suggestedNextStep}
            chats={assistant.chats}
            activeChatId={assistant.activeChatId}
            onSwitchChat={openChatFromHistory}
            onNewChat={startNewChat}
            takeFocus={panelTakesFocus}
            focusRequest={panelFocusRequest}
            initialScrollTop={panelScroll.resumeTop}
            onScrollChange={panelScroll.remember}
            anchor={columnAnchor}
            onDismiss={dismissAssistant}
            entryPoint={entryPoint}
            onClosed={assistant.onClosed}
            pinned={assistant.pinned}
            onAsk={askWithFocus}
            // Desktop: in one movement, the card flies from the panel to the dashboard while the
            // panel fades out. Mobile: the card's spot is further down, so the panel closes first
            // and the card then arrives where the reader can see it.
            onPin={turn =>
              isDesktop ? assistant.pin(turn) : assistant.closeThen(() => assistant.pin(turn))
            }
            // Unpinning from the panel waits for the panel to close, so the card is seen leaving.
            // Focus then moves to the toast's Undo, as on the dashboard.
            onUnpin={turnId => assistant.closeThen(() => unpinWithUndo(turnId))}
          />
        </LayoutGroup>
      </main>

      <PromptBar
        ref={promptRef}
        sendButtonRef={sendButtonRef}
        value={prompt}
        onValueChange={setPrompt}
        onSubmit={submitPrompt}
        onInteract={reopenFromBar}
        hasThread={thread !== undefined}
        anchor={columnAnchor}
        isPanelOpen={assistant.isOpen}
        isAnswering={assistant.isAnswering}
        hasUnseenAnswer={assistant.hasUnseenAnswer}
        onReopen={openUnseenAnswer}
        onNewChat={startNewChat}
        onLinesChange={setPromptLines}
      />

      {/* The one place screen readers hear the assistant's news. Toasts come after it. */}
      <LiveAnnouncer announcement={assistant.announcement} />
      <Toaster
        position="bottom-right"
        // Toasts sit above the prompt bar, never on top of it: the bar is 1.5rem from the bottom and
        // 3.25rem tall, so 5.5rem leaves a 0.75rem gap. This also covers screens 601–760px wide,
        // where sonner still uses this offset but the bar already spans the full width.
        offset={{ bottom: '5.5rem', right: '1.5rem' }}
        mobileOffset={{ bottom: 96, left: 12, right: 12 }}
        closeButton
      />
    </div>
  );
};

export default App;
