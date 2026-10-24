/**
 * Aria Sales Hub: coded host shell.
 *
 * This responsive shell gives your AI Assistant a realistic product context.
 * Most candidate work belongs in the post-invocation experience rendered by
 * <AssistantExperience />. Small shell integration changes are welcome when
 * they help the proposed experience feel coherent.
 */
import { useRef, useState, type CSSProperties } from 'react';
import { AssistantExperience } from './AssistantExperience';
import EntityPreview from '@/components/EntityPreview';
import Icons from '@/components/Icons';
import Sidebar from '@/widgets/Sidebar';

import useMediaQuery, { SHELL_DESKTOP_QUERY } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

export const DEFAULT_PROMPT = 'How is Marcus doing on discovery calls this quarter?';

const overviewSignals = [
  {
    label: 'Calls reviewed',
    value: '18',
    context: 'this week',
    trend: [42, 54, 48, 68, 74, 100],
    note: 'Five reps have new moments ready to review.',
  },
  {
    label: 'Coaching follow-ups',
    value: '4',
    context: 'open',
    trend: [56, 72, 62, 78, 70, 88],
    note: 'Lena and Didi have check-ins scheduled today.',
  },
  {
    label: 'Deals needing attention',
    value: '3',
    context: 'active',
    trend: [88, 76, 82, 68, 58, 52],
    note: 'Brookfield and Percepto have follow-ups this week.',
  },
] as const;

export function App() {
  const isDesktop = useMediaQuery(SHELL_DESKTOP_QUERY);
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [submittedPrompt, setSubmittedPrompt] = useState(DEFAULT_PROMPT);
  const [assistantIsOpen, setAssistantIsOpen] = useState(false);
  const [sidebarIsCompact, setSidebarIsCompact] = useState(false);
  const triggerRef = useRef<HTMLInputElement>(null);

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

      <main className="main" id="top">
        <div className="main-inner">
          <div className="greeting-row">
            <h1 className="greeting">Good to see you, Jordan.</h1>
            <p className="date-eyebrow">Today · Friday, September 4</p>
          </div>

          <div className="content">
            <section className="brief" aria-labelledby="brief-title">
              <h2 id="brief-title" className="sr-only">
                Today's brief
              </h2>
              <p className="brief-lead">
                Your morning brief has <strong>three coaching moments</strong> and{' '}
                <strong>two deal follow-ups</strong> across the team.
              </p>
              <ul className="brief-points">
                <li>
                  <b>Coaching.</b>{' '}
                  <EntityPreview
                    id="marcus-preview"
                    label={
                      <>
                        <span className="avatar cool">MB</span>Marcus Bell
                      </>
                    }
                  >
                    <span className="hover-card-head">
                      <span className="avatar cool lg">MB</span>
                      <span>
                        <strong>Marcus Bell</strong>
                        <small>Account executive · Mid-market</small>
                      </span>
                    </span>
                    <span className="preview-grid">
                      <span>
                        <small>Calls available</small>
                        <strong>6 this quarter</strong>
                      </span>
                      <span>
                        <small>Coaching moments</small>
                        <strong>2 ready</strong>
                      </span>
                    </span>
                    <span className="preview-note">
                      <b>Active deal</b> Brookfield is in evaluation.
                    </span>
                  </EntityPreview>
                  {', Lena Ortiz, and Didi Rao each have recent calls ready for review.'}
                </li>
                <li>
                  <b>Deals.</b>{' '}
                  <EntityPreview
                    id="brookfield-preview"
                    label={
                      <>
                        <span className="mark">
                          <Icons.shield data-icon="inline-start" />
                        </span>
                        Brookfield
                      </>
                    }
                  >
                    <span className="hover-card-head">
                      <span className="mark large">
                        <Icons.shield data-icon="inline-start" />
                      </span>
                      <span>
                        <strong>Brookfield</strong>
                        <small>Enterprise opportunity</small>
                      </span>
                    </span>
                    <span className="preview-grid">
                      <span>
                        <small>Stage</small>
                        <strong>Evaluation</strong>
                      </span>
                      <span>
                        <small>Next meeting</small>
                        <strong>September 9</strong>
                      </span>
                    </span>
                    <span className="preview-note">
                      <b>Latest update</b> Security review is scheduled.
                    </span>
                  </EntityPreview>{' '}
                  enters security review today; Percepto has a pricing follow-up Friday.
                </li>
              </ul>
            </section>

            <section className="section" aria-labelledby="signals-title">
              <div className="section-head">
                <h2 id="signals-title" className="section-title">
                  Team overview
                </h2>
                <span className="section-meta">Today · 6 reps · 12 active deals</span>
              </div>
              <div className="stat-grid">
                {overviewSignals.map(signal => (
                  <article
                    className="stat"
                    key={signal.label}
                    aria-label={`${signal.label}: ${signal.value} ${signal.context}`}
                  >
                    <div className="stat-head">
                      <span className="stat-skill">{signal.label}</span>
                    </div>
                    <div className="stat-value-row">
                      <span className="stat-value">{signal.value}</span>
                      <span className="stat-context">{signal.context}</span>
                    </div>
                    <div className="bars" aria-hidden="true">
                      {signal.trend.map((height, index) => (
                        <span key={index} style={{ '--h': `${height}%` } as CSSProperties} />
                      ))}
                    </div>
                    <p className="stat-note">{signal.note}</p>
                  </article>
                ))}
              </div>
            </section>
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

      <form
        className="assistant-trigger"
        aria-label="Ask AI Assistant"
        onSubmit={event => {
          event.preventDefault();
          invokeAssistant();
        }}
      >
        <label className="sr-only" htmlFor="assistant-prompt">
          Ask AI Assistant anything
        </label>
        <input
          ref={triggerRef}
          id="assistant-prompt"
          value={prompt}
          autoComplete="off"
          onChange={event => setPrompt(event.target.value)}
        />
        <button
          className="icon-button optional-action"
          type="button"
          aria-label="Voice input"
          disabled
        >
          <Icons.mic data-icon="inline-only" />
        </button>
        <button className="icon-button primary" type="submit" aria-label="Ask AI Assistant">
          <Icons.arrowUp data-icon="inline-only" />
        </button>
      </form>
    </div>
  );
}
