/**
 * Aria Sales Hub: coded host shell.
 *
 * This responsive shell gives your AI Assistant a realistic product context.
 * Most candidate work belongs in the post-invocation experience rendered by
 * <AssistantExperience />. Small shell integration changes are welcome when
 * they help the proposed experience feel coherent.
 */
import { useRef, useState } from 'react';
import { AssistantExperience } from './AssistantExperience';
import Brief from '@/widgets/Brief';
import PromptBar from '@/widgets/PromptBar';
import Sidebar from '@/widgets/Sidebar';
import TeamOverview from '@/widgets/TeamOverview';

import useColumnAnchor from '@/hooks/useColumnAnchor';
import useMediaQuery, { SHELL_DESKTOP_QUERY } from '@/hooks/useMediaQuery';
import useNeedsBarClearance from '@/hooks/useNeedsBarClearance';
import { cn } from '@/lib/utils';

export const DEFAULT_PROMPT = 'How is Marcus doing on discovery calls this quarter?';

const TODAY = 'Today · Friday, September 4';

export function App() {
  const isDesktop = useMediaQuery(SHELL_DESKTOP_QUERY);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [submittedPrompt, setSubmittedPrompt] = useState(DEFAULT_PROMPT);
  const [assistantIsOpen, setAssistantIsOpen] = useState(false);
  const [sidebarIsCompact, setSidebarIsCompact] = useState(false);
  const triggerRef = useRef<HTMLInputElement>(null);

  const mainRef = useRef<HTMLElement>(null);
  const mainInnerRef = useRef<HTMLDivElement>(null);
  const columnRef = useRef<HTMLDivElement>(null);
  const columnAnchor = useColumnAnchor(columnRef);
  useNeedsBarClearance(mainRef, mainInnerRef);

  const invokeAssistant = (text?: string) => {
    const next = (text ?? prompt).trim() || DEFAULT_PROMPT;
    setPrompt(next);
    setSubmittedPrompt(next);
    setAssistantIsOpen(true);
  };

  const dismissAssistant = () => {
    setAssistantIsOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
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

        {assistantIsOpen ? (
          <AssistantExperience
            prompt={submittedPrompt}
            onDismiss={dismissAssistant}
            triggerRef={triggerRef}
          />
        ) : null}
      </main>

      <PromptBar
        ref={triggerRef}
        value={prompt}
        onValueChange={setPrompt}
        onSubmit={() => invokeAssistant()}
        anchor={columnAnchor}
      />
    </div>
  );
}
