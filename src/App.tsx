/**
 * Aria Sales Hub: the coded host shell.
 *
 * The shell owns invocation and the dashboard. App only composes: it holds the refs and the state
 * the widgets share, and each widget owns its own markup.
 */
import { useRef, useState, type FC as ReactFC } from 'react';
import { toast } from 'sonner';

import ToastProgress from '@/components/ToastProgress';
import { Toaster } from '@/components/ui/sonner';
import AssistantExperience from '@/widgets/AssistantExperience';
import PinnedAnswer, { pinnedAnswerId } from '@/widgets/AssistantExperience/PinnedAnswer';
import Brief from '@/widgets/Brief';
import PromptBar from '@/widgets/PromptBar';
import Sidebar from '@/widgets/Sidebar';
import TeamOverview from '@/widgets/TeamOverview';

import useAssistant, { UNDO_WINDOW_MS } from '@/hooks/useAssistant';
import useColumnAnchor from '@/hooks/useColumnAnchor';
import useMediaQuery, { SHELL_DESKTOP_QUERY } from '@/hooks/useMediaQuery';
import useNeedsBarClearance from '@/hooks/useNeedsBarClearance';
import { cn } from '@/lib/utils';

const DEFAULT_PROMPT = 'How is Marcus doing on discovery calls this quarter?';
const TODAY = 'Today · Friday, September 4';

const App: ReactFC = () => {
  const isDesktop = useMediaQuery(SHELL_DESKTOP_QUERY);
  const assistant = useAssistant();

  const mainRef = useRef<HTMLElement>(null);
  const mainInnerRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const promptRef = useRef<HTMLInputElement>(null);
  const columnAnchor = useColumnAnchor(columnRef);
  useNeedsBarClearance(mainRef, mainInnerRef);

  const [sidebarIsCompact, setSidebarIsCompact] = useState(false);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);

  const submitPrompt = () => {
    const question = prompt.trim() || DEFAULT_PROMPT;
    setPrompt(question);
    assistant.ask(question);
  };

  const focusPromptBar = () => window.requestAnimationFrame(() => promptRef.current?.focus());

  const dismissAssistant = () => {
    assistant.close();
    focusPromptBar();
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
          <ToastProgress durationMs={UNDO_WINDOW_MS} onComplete={() => toast.dismiss(toastId)} />
        </>
      ),
      duration: Infinity,
      action: { label: 'Undo', onClick: () => assistant.undoUnpin(turnId) },
    });
  };

  const jumpToPinned = (turnId: string) => {
    const card = document.getElementById(pinnedAnswerId(turnId));
    card?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    card?.focus({ preventScroll: true });
  };

  return (
    <div className={cn('app-shell', sidebarIsCompact ? 'sidebar-compact' : '')}>
      <Sidebar
        isCompact={sidebarIsCompact}
        onCompactChange={setSidebarIsCompact}
        isDesktop={isDesktop}
      />

      <main ref={mainRef} className="main" id="top">
        <div ref={mainInnerRef} className="main-inner">
          <div className="grid gap-x-10 gap-y-8 shell:grid-cols-[minmax(0,1fr)_17rem]">
            <div ref={columnRef} className="min-w-0">
              <div className="greeting-row">
                <h1 className="greeting">Good to see you, Jordan.</h1>
                <p className="date-eyebrow shell:hidden">{TODAY}</p>
              </div>

              <div className="content">
                <Brief />

                {/* On mobile the team overview sits under the brief; on desktop it is the right rail. */}
                {!isDesktop && (
                  <div className="section flex flex-col gap-6">
                    <TeamOverview
                      pinned={assistant.pinned}
                      onJumpToPinned={jumpToPinned}
                      variant="inline"
                    />
                  </div>
                )}

                {/* Pinned answers stack newest first; each is unpinned and undone on its own. */}
                {assistant.pinned.map(pin => (
                  <PinnedAnswer
                    key={pin.turnId}
                    pinned={pin}
                    onUnpin={() => {
                      unpinWithUndo(pin.turnId);
                      focusPromptBar();
                    }}
                  />
                ))}
              </div>
            </div>

            {isDesktop && (
              <aside
                className="flex flex-col gap-6 pt-1"
                aria-label="Team overview and pinned answers"
              >
                <p className="date-eyebrow text-right">{TODAY}</p>
                <TeamOverview pinned={assistant.pinned} onJumpToPinned={jumpToPinned} />
              </aside>
            )}
          </div>
        </div>

        <AssistantExperience
          isOpen={assistant.isOpen}
          turns={assistant.turns}
          columnRef={columnRef}
          onDismiss={dismissAssistant}
          pinned={assistant.pinned}
          onPin={assistant.pin}
          onUnpin={unpinWithUndo}
        />
      </main>

      <PromptBar
        ref={promptRef}
        value={prompt}
        onValueChange={setPrompt}
        onSubmit={submitPrompt}
        anchor={columnAnchor}
      />

      {/* Toasts sit above the prompt bar's line, never over it: the bar is 1.5rem from the bottom and
          3.25rem tall, so 5.5rem leaves a 0.75rem gap. It also covers 601–760px, where sonner still
          uses this offset but our bar is already docked full width. */}
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
