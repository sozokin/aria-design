/**
 * Aria Sales Hub: the coded host shell.
 *
 * The shell owns invocation and the dashboard. App only composes: it holds the refs and the state
 * the widgets share, and each widget owns its own markup.
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

const DEFAULT_PROMPT = 'How is Marcus doing on discovery calls this quarter?';
const TODAY = 'Today · Friday, September 4';

const App: ReactFC = () => {
  const isDesktop = useMediaQuery(SHELL_DESKTOP_QUERY);
  const reduceMotion = useReducedMotion();
  const assistant = useAssistant();
  const rail = useRailCollapse(isDesktop);

  const columnRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  // The open panel places itself between these two in the tab order.
  const entryPoint = useMemo(() => ({ field: promptRef, send: sendButtonRef }), []);
  const columnAnchor = useColumnAnchor(columnRef);

  const [sidebarIsCompact, setSidebarIsCompact] = useState(false);
  // The bar starts empty; the opening question is offered by the brief's suggested next step chip.
  const [prompt, setPrompt] = useState('');
  // How many lines the bar shows. The panel and the pill sit above the bar, so they read its height.
  const [promptLines, setPromptLines] = useState(1);

  const thread = assistant.turns[0];
  // The brief's suggested next step mirrors the latest answer's; before any answer it is the
  // question that produces one.
  const latestCard = [...assistant.turns].reverse().find(turn => turn.card)?.card;
  const suggestedNextStep = latestCard?.nextStep ?? DEFAULT_PROMPT;

  // Whether the next opening moves focus into the panel. Every opening does, except one that comes
  // from focusing or typing in the bar: focus alone never changes context (WCAG 3.2.1), and the
  // caret stays where the reader is typing. Tab from the field then enters the panel (AssistantPanel
  // places itself between the field and the send button in the tab order).
  const [panelTakesFocus, setPanelTakesFocus] = useState(true);
  // Asks an open panel to take focus. Opening handles a closed one; this covers a panel that is
  // already up when its content is replaced (a new chat, an asked chip that unmounts, a history
  // sheet that has just closed). The panel ignores it while focus is already inside.
  const [panelFocusRequest, setPanelFocusRequest] = useState(0);
  const focusPanel = () => setPanelFocusRequest(request => request + 1);
  const panelScroll = usePanelScrollMemory(`${assistant.activeChatId}:${assistant.turns.length}`);

  // A suggested step asked from a chip: in the brief, on a pinned card, or in the panel itself (the
  // empty state's chip unmounts as the answer starts, so focus would otherwise drop to the page).
  const askWithFocus = (question: string) => {
    setPanelTakesFocus(true);
    assistant.ask(question);
    focusPanel();
  };

  // The bar's "Answer ready" pill: the answer that finished out of view, in whichever chat. The pill
  // unmounts once the answer is seen, so focus moves to the panel showing it.
  const openUnseenAnswer = () => {
    setPanelTakesFocus(true);
    assistant.openUnseenAnswer();
    focusPanel();
  };

  // The send button does what its arrow shows (and Enter on desktop with it): with text in the bar
  // it asks the question and clears the bar; with an empty bar it opens the panel if it is closed
  // and closes it if it is open. Opening with it moves focus into the panel. Asking does too when
  // the panel was closed; when it is already up (typing brings it up) the caret stays in the field,
  // Tab from there enters the panel, and the live region carries the answer's progress.
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

  // Focusing, clicking or typing in the bar brings the panel up as a companion: the thread behind a
  // closed panel, or the empty "How can I help?" state before anything has been asked. Click and
  // typing matter because after Escape the input may still be focused.
  const reopenFromBar = () => {
    if (assistant.isOpen) return;
    setPanelTakesFocus(false);
    assistant.open();
  };

  // Closing (Escape, the close button, the send arrow) hands focus back to the entry point: the send
  // button. On desktop, focus that is already in the bar stays there, so Escape while typing keeps
  // the field. On mobile it always moves to the button: iOS does not focus a tapped button, so the
  // field may still hold focus, and leaving it there would keep the keyboard up over a closed panel.
  const dismissAssistant = () => {
    assistant.close();
    const send = sendButtonRef.current;
    if (!send) return;
    if (isDesktop && send.form?.contains(document.activeElement)) return;
    send.focus({ preventScroll: true });
  };

  // The plus beside the bar, or the expanded panel's New chat button: the panel opens on its empty
  // state with focus on it, so Tab reaches the suggested first question.
  const startNewChat = () => {
    setPanelTakesFocus(true);
    assistant.newChat();
    focusPanel();
  };

  // A chat chosen in a history sheet (the rail's, or the mobile menu's) or in the expanded panel's
  // left pane; the live region names the chat. The panel does not take focus as it opens: a sheet
  // still holds focus inside it then. Once that sheet has closed it hands focus to the panel
  // (onChoiceClosed). The pane is inside the panel, so focus is already there.
  const openChatFromHistory = (chatId: string) => {
    setPanelTakesFocus(false);
    assistant.switchChat(chatId);
  };

  // Tells each undo toast apart, so focus goes to the Undo of the toast just raised.
  const undoToastCount = useRef(0);

  // Focuses the element `selector` matches as soon as it is in the page. Watched for rather than
  // polled on animation frames, which a background tab slows to a crawl.
  const focusWhenRendered = (selector: string) => {
    const focus = (element: HTMLElement) => {
      element.focus({ preventScroll: true });
      // Leaving a toast makes sonner refocus whatever had focus before the toast (an Unpin button):
      // the second call wins over that.
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

  // A toast that held focus has gone (its time ran out, or it was closed): focus goes to the entry
  // point rather than the page. After sonner's exit, since focus stays on the leaving toast until
  // then. An Undo that restored its card has already moved focus to the card, so that is left alone.
  const returnFocusFromToast = () =>
    window.setTimeout(() => {
      const active = document.activeElement;
      if (!active || active === document.body || active.closest('[data-removed="true"]')) {
        sendButtonRef.current?.focus({ preventScroll: true });
      }
    }, 400);

  // Every unpin offers its own undo for UNDO_WINDOW_MS; each toast restores only its own card.
  // The toast has no timer of its own (sonner's pauses on hover, the undo window does not): its
  // progress bar runs for exactly the undo window and dismisses it, so bar, toast and Undo end together.
  // The Unpin button leaves with its card, so focus moves to the toast's Undo, the next thing the
  // reader may want; screen readers hear the button, then the toast's own message.
  const unpinWithUndo = (turnId: string) => {
    const entry = assistant.pinned.find(pin => pin.turnId === turnId);
    assistant.unpin(turnId);
    const toastClass = `undo-toast-${++undoToastCount.current}`;
    const toastId = toast('Removed from your dashboard', {
      className: toastClass,
      description: (
        <>
          {entry && `${entry.card.rep} · ${entry.card.period}`}
          {/* The toast is the announcement for an unpin, so it carries the time limit too. */}
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
      // The restored card takes focus. It does so itself when it mounts, but an Undo pressed while
      // the card is still collapsing revives that card instead of mounting a new one.
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

  const jumpToPinned = (turnId: string) => {
    const card = document.getElementById(pinnedAnswerId(turnId));
    // An explicit 'smooth' overrides the CSS scroll-behavior that reduced motion turns off.
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
        {/* One layout context for the dashboard and the panel, so a pinned card's shared layoutId
            can fly from the panel into the dashboard. */}
        <LayoutGroup>
          <div className="main-inner">
            {/* On desktop the column and the rail scroll on their own (styles.css, .dashboard-*). */}
            <div className="dashboard grid gap-x-10 gap-y-8 shell:grid-cols-[minmax(0,1fr)_17rem]">
              <div ref={columnRef} className="dashboard-column min-w-0">
                <div className="greeting-row">
                  <div
                    id={RAIL_TOGGLE_SLOT_ID}
                    className="flex w-full items-center justify-between gap-3 shell:w-auto"
                  >
                    {/* Room on the right for the fixed menu toggle, so a long greeting never runs under it. */}
                    {/* The heading alone, not its row: the row holds the mobile menu toggle's slot,
                        whose position is measured on mount and must not be mid-move. */}
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
                      // If the bar still holds this same question, clear it so the follow-up placeholder shows.
                      if (prompt.trim() === question) setPrompt('');
                      askWithFocus(question);
                    }}
                  />

                  {/* On mobile the team overview also sits inline under the brief, until it is
                      collapsed into the menu's toggle; on desktop it is the right rail. The presence
                      wrapper is for the collapse exit; it lets the first paint through (no
                      initial={false}), so the inline card can take its turn in the sequence. */}
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

                  {/* Pinned answers stack newest first; each is unpinned and undone on its own. */}
                  <AnimatePresence>
                    {assistant.pinned.map(pin => (
                      <PinnedAnswer
                        key={pin.turnId}
                        pinned={pin}
                        shareCardLayout={isDesktop}
                        // Focus moves to the toast's Undo (unpinWithUndo); the undone card takes
                        // focus itself.
                        onUnpin={() => unpinWithUndo(pin.turnId)}
                        onAskNextStep={askWithFocus}
                      />
                    ))}
                  </AnimatePresence>

                  {/* Holds the page's height while the team overview flies, so the scroll never snaps. */}
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
            // Expanded is a desktop form; the mobile sheet already has the whole screen.
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
            // Desktop: the card glides from the panel to its slot while the panel fades under it, one
            // beat. Mobile has no glide (the slot is below the fold), so the sheet leaves first and
            // the card then arrives on a dashboard that is in view.
            onPin={turn =>
              isDesktop ? assistant.pin(turn) : assistant.closeThen(() => assistant.pin(turn))
            }
            // An unpin asked from the chat waits for the panel to leave, so the card is seen going.
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

      {/* Toasts sit above the prompt bar's line, never over it: the bar is 1.5rem from the bottom and
          3.25rem tall, so 5.5rem leaves a 0.75rem gap. It also covers 601–760px, where sonner still
          uses this offset but our bar is already docked full width. */}
      <LiveAnnouncer announcement={assistant.announcement} />
      <Toaster
        position="bottom-right"
        offset={{ bottom: '5.5rem', right: '1.5rem' }}
        mobileOffset={{ bottom: 96, left: 12, right: 12 }}
        closeButton
      />
    </div>
  );
};

export default App;
