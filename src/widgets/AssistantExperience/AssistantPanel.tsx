import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FC as ReactFC,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Maximize2, Minimize2, Plus, Sparkles, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import AnswerTurn from './AnswerTurn';
import ChatList from './ChatList';
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

// Opening straight into the expanded form (it is remembered across a close): the box grows from
// its own centre rather than rising from the bar.
const EXPANDED_ENTRANCE = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
};

// Changing form is a sequence, in seconds: the content clears, the box itself grows or shrinks to
// its new geometry, the chat pane slides in from the left (expanding only), and the content
// settles into the new box. Each step starts when the one before it has finished.
const FORM_SWITCH = { clear: 0.1, shell: 0.4, pane: 0.25, content: 0.25 };

/**
 * The answer surface. Non-modal on purpose: the prompt bar underneath stays usable for follow-ups,
 * so there is no focus trap. Escape closes; the host returns focus to the entry point. Before
 * anything is asked in a chat the panel asks how it can help and offers a first question.
 * Switching chats, from a history sheet or the expanded panel's pane, swaps the turns in place.
 *
 * Before anything is asked the panel is docked: it sits on the prompt bar at its natural height, so
 * "How can I help?" reads as part of the bar. Asking a question raises it. On desktop the raised
 * panel is anchored by its top edge, placed where the top would sit at full height, so arriving
 * content only ever extends it downward and what has already loaded never moves. On mobile the
 * sheet stays on the bar and grows upward to its cap. The move between the two is a layout
 * animation; the inner height animation carries the size.
 *
 * Expanded (desktop only) the panel is centred on the screen at most of its size, over a backdrop,
 * with the chats as a left pane and the thread on the right. Changing form keeps the one box and
 * runs a sequence (FORM_SWITCH): the content clears while the box still has its old geometry, the
 * box animates to its new geometry as a layout animation (empty by then, so the scaling distorts
 * nothing), the pane slides in, then the content settles in. Collapsing runs it back without the
 * pane step.
 */
const AssistantPanel: ReactFC<IAssistantPanel> = ({
  turns,
  suggestedQuestion,
  isExpanded,
  onExpandedChange,
  chats,
  activeChatId,
  onSwitchChat,
  onNewChat,
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
  // The scroll area and its content remount when the form changes, so the measuring hooks take the
  // elements themselves and are handed each new one. The scroll area also stays in a ref, for the
  // scrolling below.
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
  const [contentElement, setContentElement] = useState<HTMLDivElement | null>(null);
  const setScrollArea = useCallback((node: HTMLDivElement | null) => {
    scrollRef.current = node;
    setScrollElement(node);
  }, []);
  // Set on mount when a scroll position was resumed, so the "new turn" scroll below skips once.
  const resumedScroll = useRef(false);

  const reduceMotion = useReducedMotion();
  const isDesktop = useMediaQuery(SHELL_DESKTOP_QUERY);
  const entrance = isExpanded ? EXPANDED_ENTRANCE : isDesktop ? DESKTOP_ENTRANCE : MOBILE_ENTRANCE;

  // The form the box is in. It follows `isExpanded` once the content has cleared, so the box moves
  // empty; until then the two differ and the content is on its way out.
  const [shownExpanded, setShownExpanded] = useState(isExpanded);
  const isClearing = shownExpanded !== isExpanded;
  // True from the start of the sequence until the box has arrived: the box animates its whole
  // layout, size included, instead of its position alone.
  const [isChangingForm, setIsChangingForm] = useState(false);
  // The Expand/Collapse button that was pressed leaves with the old content; focus moves to its
  // counterpart when the new content mounts. A stable callback ref, so it runs on mount only and
  // not again for the old button on every re-render before it leaves.
  const focusToggleOnMount = useRef(false);
  const focusToggle = useCallback((node: HTMLButtonElement | null) => {
    if (!node || !focusToggleOnMount.current) return;
    focusToggleOnMount.current = false;
    node.focus({ preventScroll: true });
  }, []);
  // Under reduced motion the sequence collapses to plain fades with no waiting.
  const step = (seconds: number) => (reduceMotion ? 0 : seconds);

  useEffect(() => {
    // Toggled back before the box moved: nothing left to do.
    if (shownExpanded === isExpanded) {
      setIsChangingForm(false);
      return;
    }
    setIsChangingForm(true);
    const move = window.setTimeout(
      () => {
        focusToggleOnMount.current = true;
        setShownExpanded(isExpanded);
      },
      step(FORM_SWITCH.clear) * 1000,
    );
    const settle = window.setTimeout(
      () => setIsChangingForm(false),
      step(FORM_SWITCH.clear + FORM_SWITCH.shell) * 1000,
    );
    return () => {
      window.clearTimeout(move);
      window.clearTimeout(settle);
    };
    // Runs for a change of `isExpanded` only; `shownExpanded` catching up must not restart it.
  }, [isExpanded]);
  const contentHeight = useElementHeight(contentElement);
  const hasMoreBelow = useHasMoreBelow(scrollElement, contentHeight);
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
        // Like the close button: the panel closes in whichever form it is in, and reopens in it.
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
      // In the usual form the box takes the dashboard column's width. The radius is a style, not a
      // class, so the layout animation can keep the corners round while it scales the box.
      style={{
        borderRadius: 16,
        ...(!shownExpanded && anchor ? { left: anchor.left, width: anchor.width } : {}),
      }}
      className={cn(
        'fixed z-(--z-assistant) flex overflow-hidden border border-border bg-popover text-popover-foreground will-change-transform outline-none shell:shadow-lg',
        shownExpanded
          ? // From near the top down to 1rem above the bar; 80% of the viewport's width, but never
            // narrower than 56rem (nearly the whole width on a small desktop). The backdrop covers
            // the sidebar too, so the box is centred on the whole screen, with auto margins rather
            // than a transform: the layout animation measures the box without transforms, and a
            // translate would send it towards the wrong place first. Percentages, not vw: for a
            // fixed box they exclude the scrollbar, so the centre is the visible centre.
            // The bottom follows the bar's height with a transition: the top is fixed, so Motion's
            // position-only layout sees no move and leaves this to CSS.
            'inset-x-0 top-[5dvh] bottom-[calc(var(--prompt-bar-h)+2.5rem)] mx-auto w-[min(calc(100%_-_2rem),max(80%,56rem))] flex-row transition-[bottom] duration-(--duration-base) ease-(--ease-out)'
          : cn(
              'inset-x-3 bottom-[calc(var(--prompt-bar-h)+2rem+env(safe-area-inset-bottom,0px))] max-h-[calc(100dvh-var(--prompt-bar-h)-4rem-env(safe-area-inset-bottom,0px))] flex-col shadow-md shell:inset-x-auto shell:max-h-(--assistant-panel-max)',
              // Docked: on the bar, 1rem above it. Raised: top edge where it sits at full height.
              isDocked
                ? 'shell:bottom-[calc(var(--prompt-bar-h)+2.5rem)]'
                : 'shell:top-[calc(100dvh-var(--prompt-bar-h)-2.5rem-var(--assistant-panel-max))] shell:bottom-auto',
            ),
      )}
      // Position only, usually: the move from docked to raised glides, while the size is left to the
      // inner height animation so nothing inside is stretched on the way. Changing form animates
      // the whole box, size included; the content has cleared out of it by the time it moves.
      layout={isChangingForm ? true : 'position'}
      initial={entrance.initial}
      animate={entrance.animate}
      exit={{ ...entrance.exit, transition: { duration: 0.22, ease: EASE_OUT } }}
      transition={{
        duration: 0.38,
        ease: EASE_OUT,
        layout: { duration: isChangingForm ? FORM_SWITCH.shell : 0.45, ease: EASE_OUT },
      }}
      onAnimationComplete={() => setHasEntered(true)}
    >
      {/* Mounted as the box starts to grow, the pane waits for it to arrive, then slides in. */}
      <AnimatePresence initial={false}>
        {shownExpanded && (
          <motion.aside
            key="chats"
            className="flex w-60 shrink-0 flex-col gap-3 border-r border-border p-4"
            aria-label="Chats"
            initial={{ x: '-100%' }}
            animate={{
              x: 0,
              transition: {
                delay: step(FORM_SWITCH.shell),
                duration: FORM_SWITCH.pane,
                ease: EASE_OUT,
              },
            }}
            exit={{ x: '-100%', transition: { duration: 0.2, ease: EASE_OUT } }}
          >
            <h3 className="text-[0.8125rem] font-semibold text-tertiary-foreground">Chats</h3>
            <Button type="button" variant="outline" size="sm" onClick={onNewChat}>
              <Plus data-icon="inline-start" aria-hidden="true" />
              New chat
            </Button>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <ChatList chats={chats} activeChatId={activeChatId} onSwitchChat={onSwitchChat} />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Keyed on the box's form. The old content fades while the box is still in place, is gone by
          the time the box moves, and the new content settles in once the box (and, expanding, the
          pane) has arrived. min-h-0: a flex child defaults to its content's height, which would push
          the scroll area past the panel's max height instead of letting it shrink and scroll. */}
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={shownExpanded ? 'wide' : 'narrow'}
          className="flex min-h-0 min-w-0 flex-1 flex-col"
          initial={{ opacity: 0, y: 6 }}
          animate={
            isClearing
              ? { opacity: 0, transition: { duration: FORM_SWITCH.clear } }
              : {
                  opacity: 1,
                  y: 0,
                  transition: {
                    delay: step(FORM_SWITCH.shell + (shownExpanded ? FORM_SWITCH.pane : 0)),
                    duration: FORM_SWITCH.content,
                    ease: EASE_OUT,
                  },
                }
          }
          exit={{ opacity: 0, transition: { duration: 0 } }}
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
            <div className="flex shrink-0 gap-0.5">
              {/* Desktop only: mobile already has the whole screen. */}
              {isDesktop && (
                <Button
                  ref={focusToggle}
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => onExpandedChange(!isExpanded)}
                  aria-label={shownExpanded ? 'Back to the panel' : 'Expand'}
                >
                  {shownExpanded ? (
                    <Minimize2 aria-hidden="true" />
                  ) : (
                    <Maximize2 aria-hidden="true" />
                  )}
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={onDismiss}
                aria-label="Close AI Assistant"
              >
                <X aria-hidden="true" />
              </Button>
            </div>
          </header>

          {/* Animates to the content's height, so new content grows the panel smoothly (downward only,
            since the top edge is fixed). Capped by the panel's max height, beyond which it scrolls.
            Expanded, the box is fixed and the area simply fills it. */}
          <motion.div
            ref={setScrollArea}
            onScroll={event => onScrollChange(event.currentTarget.scrollTop)}
            data-overflow={hasEntered && hasMoreBelow}
            // Relative so it is the turns' offsetParent: their offsetTop is then measured from the
            // scroll area, not from the dialog with its header.
            className={cn(
              'relative min-h-0 shrink overflow-y-auto overscroll-contain data-[overflow=true]:scroll-fade',
              shownExpanded && 'flex-1',
            )}
            initial={false}
            animate={{ height: shownExpanded ? 'auto' : (contentHeight ?? 'auto') }}
            transition={{ duration: reduceMotion || !hasEntered ? 0 : 0.32, ease: EASE_OUT }}
          >
            <div
              ref={setContentElement}
              // A reading width in the wide box, so lines do not run the whole way across.
              className={cn(
                'flex flex-col gap-5 px-5 py-4',
                shownExpanded && 'mx-auto w-full max-w-2xl',
              )}
            >
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
                    shareCardLayout={!shownExpanded}
                    onTogglePin={() => (isPinned ? onUnpin(turn.id) : onPin(turn))}
                    onAskNextStep={onAsk}
                  />
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </motion.section>
  );
};

export default AssistantPanel;
