import { useEffect, useId, useLayoutEffect, useRef, type FC as ReactFC } from 'react';
import { useReducedMotion } from 'motion/react';
import { Sparkles, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import AnswerTurn from './AnswerTurn';

import { IAssistantPanel } from './AssistantExperience.types';

/**
 * The answer surface. Non-modal on purpose: the prompt bar underneath stays usable for follow-ups,
 * so there is no focus trap. Escape closes; the host returns focus to the entry point.
 *
 * On desktop the panel is anchored by its top edge, placed where the top would sit at full height,
 * so arriving content only ever extends it downward and what has already loaded never moves. On
 * mobile the sheet is a fixed box.
 */
const AssistantPanel: ReactFC<IAssistantPanel> = ({
  turns,
  takeFocus,
  initialScrollTop,
  onScrollChange,
  anchor,
  onDismiss,
  pinned,
  onAsk,
  onPin,
  onUnpin,
}) => {
  const titleId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Set on mount when a scroll position was resumed, so the "new turn" scroll below skips once.
  const resumedScroll = useRef(false);

  const reduceMotion = useReducedMotion();
  const thread = turns[0];

  // Take focus so screen readers announce the dialog; Tab then reaches its controls. Not when the
  // panel was opened by focusing the prompt: focus stays there and the panel is a companion.
  useEffect(() => {
    if (takeFocus) rootRef.current?.focus({ preventScroll: true });
    // Mount only: later prop changes must not refocus or rescroll an open panel.
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onDismiss();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  // Reopening resumes where the reader left off, if they had scrolled. Before paint, so the panel
  // never flashes at the top first.
  useLayoutEffect(() => {
    if (initialScrollTop && scrollRef.current) {
      scrollRef.current.scrollTop = initialScrollTop;
      resumedScroll.current = true;
    }
    // Mount only: later prop changes must not refocus or rescroll an open panel.
  }, []);

  // A new follow-up scrolls into view at the top of the panel, like a fresh page.
  useEffect(() => {
    const resumed = resumedScroll.current;
    resumedScroll.current = false;
    if (turns.length < 2 || resumed) return;

    const scroller = scrollRef.current;
    const latest = scroller?.querySelector<HTMLElement>('[data-turn]:last-child');
    if (!scroller || !latest) return;

    scroller.scrollTo({ top: latest.offsetTop - 16, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [turns.length, reduceMotion]);

  return (
    <section
      ref={rootRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      tabIndex={-1}
      style={anchor ? { left: anchor.left, width: anchor.width } : undefined}
      className="fixed inset-x-3 top-8 bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] z-(--z-assistant) flex flex-col rounded-2xl border border-border bg-popover text-popover-foreground shadow-md outline-none shell:inset-x-auto shell:top-[calc(100dvh-5.75rem-var(--assistant-panel-max))] shell:bottom-auto shell:max-h-(--assistant-panel-max) shell:shadow-lg"
    >
      <header className="flex items-start gap-3 border-b border-border px-5 pt-4 pb-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[0.6875rem] font-semibold tracking-[0.08em] text-accent-muted-foreground uppercase">
            <Sparkles className="size-3" aria-hidden="true" />
            AI Assistant
          </p>
          <h2 id={titleId} className="mt-0.5 truncate text-[0.9375rem] font-semibold">
            {thread.prompt}
          </h2>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onDismiss}
          aria-label="Close AI Assistant"
        >
          <X aria-hidden="true" />
        </Button>
      </header>

      <div
        ref={scrollRef}
        onScroll={event => onScrollChange(event.currentTarget.scrollTop)}
        // Relative so it is the turns' offsetParent: their offsetTop is then measured from the
        // scroll area, not from the dialog with its header.
        className="relative min-h-0 shrink overflow-y-auto overscroll-contain"
      >
        <div className="flex flex-col gap-5 px-5 py-4">
          {turns.map((turn, index) => {
            const isPinned = pinned.some(entry => entry.turnId === turn.id);
            return (
              <AnswerTurn
                key={turn.id}
                turn={turn}
                isFollowUp={index > 0}
                isPinned={isPinned}
                onTogglePin={() => (isPinned ? onUnpin(turn.id) : onPin(turn))}
                onAskNextStep={onAsk}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AssistantPanel;
