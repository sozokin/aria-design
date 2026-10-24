/**
 * Aria Sales Hub: the coded host shell.
 *
 * The shell owns invocation and the dashboard. App only composes: it holds the refs and the state
 * the widgets share, and each widget owns its own markup.
 */
import { useRef, useState, type FC as ReactFC } from 'react';

import AssistantExperience from '@/widgets/AssistantExperience';
import Brief from '@/widgets/Brief';
import PromptBar from '@/widgets/PromptBar';
import Sidebar from '@/widgets/Sidebar';
import TeamOverview from '@/widgets/TeamOverview';

import useAssistant from '@/hooks/useAssistant';
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

  const dismissAssistant = () => {
    assistant.close();
    window.requestAnimationFrame(() => promptRef.current?.focus());
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
                    <TeamOverview variant="inline" />
                  </div>
                )}
              </div>
            </div>

            {isDesktop && (
              <aside
                className="flex flex-col gap-6 pt-1"
                aria-label="Team overview and pinned answers"
              >
                <p className="date-eyebrow text-right">{TODAY}</p>
                <TeamOverview />
              </aside>
            )}
          </div>
        </div>

        <AssistantExperience
          isOpen={assistant.isOpen}
          turns={assistant.turns}
          columnRef={columnRef}
          onDismiss={dismissAssistant}
        />
      </main>

      <PromptBar
        ref={promptRef}
        value={prompt}
        onValueChange={setPrompt}
        onSubmit={submitPrompt}
        anchor={columnAnchor}
      />
    </div>
  );
};

export default App;
