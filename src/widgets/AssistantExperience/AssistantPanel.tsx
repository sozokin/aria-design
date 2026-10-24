import { useEffect, useId, useLayoutEffect, useRef, useState, type FC as ReactFC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Sparkles, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import AnswerTurn from './AnswerTurn';
import NextStepChip from './NextStepChip';

import useElementHeight from '@/hooks/useElementHeight';
import useHasMoreBelow from '@/hooks/useHasMoreBelow';
import useMediaQuery, { SHELL_DESKTOP_QUERY } from '@/hooks/useMediaQuery';
import { EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/utils';

import { IAssistantPanel } from './AssistantExperience.types';

// Rises a little and settles, so it reads as coming up from the prompt bar below it.
const DESKTOP_ENTRANCE = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 8, scale: 0.98 },
};

// No scale on mobile: scaling a large shadowed surface re-rasterises every frame on iOS WebKit,
// which is what made the entrance stutter.
const MOBILE_ENTRANCE = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

/**
 * The answer surface. Non-modal on purpose: the prompt bar underneath stays usable for follow-ups,
 * so there is no focus trap. Escape closes; the host returns focus to the entry point. Before
 * anything is asked in a chat the panel asks how it can help and offers a first question.
 * Switching chats from the history sheet swaps the turns in place.
 *
 * Before anything is asked the panel is docked: it sits on the prompt bar at its natural height, so
 * "How can I help?" reads as part of the bar. Asking a question raises it. On desktop the raised
 * panel is anchored by its top edge, placed where the top would sit at full height, so arriving
 * content only ever extends it downward and what has already loaded never moves. On mobile the
 * sheet stays on the bar and grows upward to its cap. The move between the two is a layout
 * animation; the inner height animation carries the size.
 */
const AssistantPanel: ReactFC<IAssistantPanel> = ({
  turns,
  suggestedQuestion,
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
  const contentRef = useRef<HTMLDivElement>(null);
  // Set on mount when a scroll position was resumed, so the "new turn" scroll below skips once.
  const resumedScroll = useRef(false);

  const reduceMotion = useReducedMotion();
  const isDesktop = useMediaQuery(SHELL_DESKTOP_QUERY);
  const entrance = isDesktop ? DESKTOP_ENTRANCE : MOBILE_ENTRANCE;
  const contentHeight = useElementHeight(contentRef);
  const hasMoreBelow = useHasMoreBelow(scrollRef, contentHeight);
  // The bottom fade and the height animation wait until the entrance has finished, so they never
  // compete with it.
  const [hasEntered, setHasEntered] = useState(false);

  const thread = turns[0];
  const isDocked = thread === undefined;

  // Take focus so screen readers announce the dialog; Tab then reaches its controls. Not when the
  // panel was opened by focusing the prompt: focus stays there and the panel is a companion.
  useEffect(() => {
    if (takeFocus) rootRef.current?.focus({ preventScroll: true });
    // Mount only: later prop changes must not refocus or rescroll an open panel.
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Already handled means a sheet took it (radix listens in the capture phase): that sheet
      // closes and the panel stays.
      if (event.key === 'Escape' && !event.defaultPrevented) {
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
    <motion.section
      ref={rootRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby={titleId}
      tabIndex={-1}
      style={anchor ? { left: anchor.left, width: anchor.width } : undefined}
      className={cn(
        'fixed inset-x-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom,0px))] z-(--z-assistant) flex max-h-[calc(100dvh-7.25rem-env(safe-area-inset-bottom,0px))] flex-col rounded-2xl border border-border bg-popover text-popover-foreground shadow-md will-change-transform outline-none shell:inset-x-auto shell:max-h-(--assistant-panel-max) shell:shadow-lg',
        // Docked: on the bar, 1rem above it. Raised: top edge where it sits at full height.
        isDocked
          ? 'shell:bottom-[5.75rem]'
          : 'shell:top-[calc(100dvh-5.75rem-var(--assistant-panel-max))] shell:bottom-auto',
      )}
      // Position only: the move from docked to raised glides, while the size is left to the inner
      // height animation so nothing inside is stretched on the way.
      layout="position"
      initial={entrance.initial}
      animate={entrance.animate}
      exit={{ ...entrance.exit, transition: { duration: 0.22, ease: EASE_OUT } }}
      transition={{ duration: 0.38, ease: EASE_OUT, layout: { duration: 0.45, ease: EASE_OUT } }}
      onAnimationComplete={() => setHasEntered(true)}
    >
      <header className="flex items-start gap-3 border-b border-border px-5 pt-4 pb-3">
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[0.6875rem] font-semibold tracking-[0.08em] text-accent-muted-foreground uppercase">
            <Sparkles className="size-3" aria-hidden="true" />
            AI Assistant
          </p>
          <h2 id={titleId} className="mt-0.5 truncate text-[0.9375rem] font-semibold">
            {thread ? thread.prompt : 'How can I help?'}
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

      {/* Animates to the content's height, so new content grows the panel smoothly (downward only,
          since the top edge is fixed). Capped by the panel's max height, beyond which it scrolls. */}
      <motion.div
        ref={scrollRef}
        onScroll={event => onScrollChange(event.currentTarget.scrollTop)}
        data-overflow={hasEntered && hasMoreBelow}
        // Relative so it is the turns' offsetParent: their offsetTop is then measured from the
        // scroll area, not from the dialog with its header.
        className="relative min-h-0 shrink overflow-y-auto overscroll-contain data-[overflow=true]:scroll-fade"
        initial={false}
        animate={{ height: contentHeight ?? 'auto' }}
        transition={{ duration: reduceMotion || !hasEntered ? 0 : 0.32, ease: EASE_OUT }}
      >
        <div ref={contentRef} className="flex flex-col gap-5 px-5 py-4">
          {/* The empty state: nothing asked in this chat yet, so offer a question to start with. */}
          {turns.length === 0 && (
            <div>
              <p className="text-sm text-text-secondary">
                Ask about a rep, a deal or a coaching moment, or start with this:
              </p>
              <NextStepChip text={suggestedQuestion} onAsk={onAsk} />
            </div>
          )}
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
      </motion.div>
    </motion.section>
  );
};

export default AssistantPanel;
