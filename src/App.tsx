/**
 * Aria Sales Hub: the coded host shell.
 *
 * The shell owns invocation and the dashboard. App only composes: it holds the refs and the state
 * the widgets share, and each widget owns its own markup.
 */
import { useRef, useState, type CSSProperties, type FC as ReactFC } from 'react';
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
import useNeedsBarClearance from '@/hooks/useNeedsBarClearance';
import usePanelScrollMemory from '@/hooks/usePanelScrollMemory';
import useRailCollapse, { RAIL_TOGGLE_SLOT_ID } from '@/hooks/useRailCollapse';
import { cn } from '@/lib/utils';

const DEFAULT_PROMPT = 'How is Marcus doing on discovery calls this quarter?';
const TODAY = 'Today · Friday, September 4';

const App: ReactFC = () => {
  const isDesktop = useMediaQuery(SHELL_DESKTOP_QUERY);
  const reduceMotion = useReducedMotion();
  const assistant = useAssistant();
  const rail = useRailCollapse(isDesktop);

  const mainRef = useRef<HTMLElement>(null);
  const mainInnerRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const columnAnchor = useColumnAnchor(columnRef);
  useNeedsBarClearance(mainRef, mainInnerRef);

  const [sidebarIsCompact, setSidebarIsCompact] = useState(false);
  // The bar starts empty; the opening question is offered by the brief's suggested next step chip.
  const [prompt, setPrompt] = useState('');
  // How many lines the bar shows. The panel and the pill sit above the bar, so they read its height.
  const [promptLines, setPromptLines] = useState(1);

  const thread = assistant.turns[0];
  const latestTurn = assistant.turns[assistant.turns.length - 1];
  // The brief's suggested next step mirrors the latest answer's; before any answer it is the
  // question that produces one.
  const latestCard = [...assistant.turns].reverse().find(turn => turn.card)?.card;
  const suggestedNextStep = latestCard?.nextStep ?? DEFAULT_PROMPT;

  // Whether the next opening should move focus into the panel. Opening by focusing the input must
  // not (WCAG 3.2.1: focus alone never changes context); opening by submitting may.
  const [panelTakesFocus, setPanelTakesFocus] = useState(true);
  // Focus the app itself returns to the input (after a close) must not reopen the panel.
  const suppressFocusOpen = useRef(false);
  const panelScroll = usePanelScrollMemory(`${assistant.activeChatId}:${assistant.turns.length}`);

  const askWithFocus = (question: string) => {
    setPanelTakesFocus(true);
    assistant.ask(question);
  };

  const openWithFocus = () => {
    setPanelTakesFocus(true);
    assistant.open();
  };

  // A typed question is asked and the bar cleared for the next one. An empty bar reopens the
  // conversation if there is one, or asks the opening question if there is not.
  const submitPrompt = () => {
    const text = prompt.trim();
    setPanelTakesFocus(true);
    if (text) {
      setPrompt('');
      assistant.ask(text);
    } else if (thread) {
      assistant.open();
    } else {
      assistant.ask(DEFAULT_PROMPT);
    }
  };

  // Focusing, clicking or typing in the bar brings the panel up as a companion: the thread behind a
  // closed panel, or the empty "How can I help?" state before anything has been asked. Click and
  // typing matter because after Escape the input is already focused.
  const reopenFromBar = () => {
    if (assistant.isOpen || suppressFocusOpen.current) return;
    setPanelTakesFocus(false);
    assistant.open();
  };

  // Returns focus to the bar without that focus counting as "the user reopened the panel".
  const focusPromptBar = () =>
    window.requestAnimationFrame(() => {
      suppressFocusOpen.current = true;
      promptRef.current?.focus();
      window.setTimeout(() => {
        suppressFocusOpen.current = false;
      }, 0);
    });

  // Closing hands focus back to the entry point on desktop (Escape, the close button). On mobile
  // that would raise the keyboard again under a panel that has just gone, so focus is dropped
  // instead: panel, focus and keyboard leave together.
  const dismissAssistant = () => {
    assistant.close();
    if (isDesktop) focusPromptBar();
    else (document.activeElement as HTMLElement | null)?.blur();
  };

  // The plus beside the bar: the panel opens on its empty state as a companion, and focus goes to
  // the bar, ready for the first question. Focused here, inside the tap, not deferred: iOS only
  // honours a programmatic focus (and raises the keyboard) while the user's gesture is running.
  // The bar's focus handler would open the panel too, which newChat is already doing.
  const startNewChat = () => {
    setPanelTakesFocus(false);
    assistant.newChat();
    promptRef.current?.focus();
  };

  // A chat chosen in a history sheet (the rail's, or the mobile menu's) or in the expanded panel's
  // left pane: the panel shows it as a companion, since a sheet returns focus to its own button as
  // it closes and the pane keeps it; the live region names the chat.
  const openChatFromHistory = (chatId: string) => {
    setPanelTakesFocus(false);
    assistant.switchChat(chatId);
  };

  // Every unpin offers its own undo for UNDO_WINDOW_MS; each toast restores only its own card.
  // The toast has no timer of its own (sonner's pauses on hover, the undo window does not): its
  // progress bar runs for exactly the undo window and dismisses it, so bar, toast and Undo end together.
  const unpinWithUndo = (turnId: string) => {
    const entry = assistant.pinned.find(pin => pin.turnId === turnId);
    assistant.unpin(turnId);
    const toastId = toast('Removed from your dashboard', {
      description: (
        <>
          {entry && `${entry.card.rep} · ${entry.card.period}`}
          {/* The toast is the announcement for an unpin, so it carries the time limit too. */}
          <span className="sr-only">
            {` Undo is available for ${UNDO_WINDOW_MS / 1000} seconds.`}
          </span>
          <ToastProgress durationMs={UNDO_WINDOW_MS} onComplete={() => toast.dismiss(toastId)} />
        </>
      ),
      duration: Infinity,
      action: { label: 'Undo', onClick: () => assistant.undoUnpin(turnId) },
    });
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

      <main ref={mainRef} className="main" id="top">
        {/* One layout context for the dashboard and the panel, so a pinned card's shared layoutId
            can fly from the panel into the dashboard. */}
        <LayoutGroup>
          <div ref={mainInnerRef} className="main-inner">
            <div className="grid gap-x-10 gap-y-8 shell:grid-cols-[minmax(0,1fr)_17rem]">
              <div ref={columnRef} className="min-w-0">
                <div className="greeting-row">
                  <div
                    id={RAIL_TOGGLE_SLOT_ID}
                    className="flex w-full items-center justify-between gap-3 shell:w-auto"
                  >
                    {/* Room on the right for the fixed menu toggle, so a long greeting never runs under it. */}
                    <h1 className="greeting pr-10 shell:pr-0">Good to see you, Jordan.</h1>
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
                      />
                    )}
                  </div>
                  <p className="date-eyebrow shell:hidden">{TODAY}</p>
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
                      collapsed into the menu's toggle; on desktop it is the right rail. */}
                  <AnimatePresence
                    initial={false}
                    custom={rail.flight}
                    onExitComplete={rail.settlePage}
                  >
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
                        onUnpin={() => {
                          unpinWithUndo(pin.turnId);
                          focusPromptBar();
                        }}
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
                  className="flex flex-col gap-6 pt-1"
                  aria-label="Team overview and pinned answers"
                >
                  <div className="flex flex-col items-end gap-1.5">
                    <p className="date-eyebrow text-right">{TODAY}</p>
                    <ChatHistory
                      chats={assistant.chats}
                      activeChatId={assistant.activeChatId}
                      onSwitchChat={openChatFromHistory}
                      withLabel
                    />
                  </div>
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
            initialScrollTop={panelScroll.resumeTop}
            onScrollChange={panelScroll.remember}
            anchor={columnAnchor}
            onDismiss={dismissAssistant}
            pinned={assistant.pinned}
            onAsk={askWithFocus}
            onPin={assistant.pin}
            onUnpin={unpinWithUndo}
          />
        </LayoutGroup>
      </main>

      <PromptBar
        ref={promptRef}
        value={prompt}
        onValueChange={setPrompt}
        onSubmit={submitPrompt}
        onInteract={reopenFromBar}
        hasThread={thread !== undefined}
        anchor={columnAnchor}
        latestTurn={latestTurn}
        isPanelOpen={assistant.isOpen}
        hasUnseenAnswer={assistant.hasUnseenAnswer}
        onReopen={openWithFocus}
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
