import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FC as ReactFC,
} from 'react';
import { AnimatePresence, motion, useIsPresent, useReducedMotion } from 'motion/react';
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

/** Elements that the Tab key can land on. */
const TABBABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Lists the panel's controls in Tab order, skipping hidden, inert and untabbable ones.
 *
 * @param root - The panel element.
 * @returns The controls, first to last.
 */
const tabbablesIn = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>(TABBABLE)].filter(
    element =>
      element.tabIndex >= 0 && !element.closest('[inert]') && element.getClientRects().length > 0,
  );

/** Desktop entrance: rises a little and settles, as if coming up from the prompt bar. */
const DESKTOP_ENTRANCE = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 8, scale: 0.98 },
};

/**
 * Mobile entrance: slides up without scaling. Scaling a large, shadowed surface redraws it on
 * every frame on iPhones, which made the entrance stutter.
 */
const MOBILE_ENTRANCE = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

/** Entrance when opening straight into the expanded form: grows from its own centre. */
const EXPANDED_ENTRANCE = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.98 },
};

/**
 * Timings, in seconds, for switching between the normal and the expanded panel. Each step starts
 * when the one before it ends:
 * 1. `clear`: the content fades out.
 * 2. `shell`: the empty box grows or shrinks to its new size.
 * 3. `pane`: the chats pane slides in from the left (expanding only).
 * 4. `content`: the content fades back in.
 */
const FORM_SWITCH = { clear: 0.1, shell: 0.4, pane: 0.25, content: 0.25 };

/**
 * The AI Assistant panel, where answers appear.
 *
 * It is not modal: there is no focus trap, so the prompt bar below stays usable for follow-ups.
 *
 * Focus:
 * - It takes focus when it opens, except when it was opened by typing in the prompt bar (the
 *   caret stays there).
 * - `App` can also ask it to take focus while open (`focusRequest`).
 * - While open, Tab goes field → panel → send button.
 * - Escape closes it, and `App` puts focus back on the send button.
 *
 * Its forms:
 * - Docked: before anything is asked, it sits on the prompt bar and asks "How can I help?".
 * - Raised: once a question is asked. On desktop its top edge stays put and it grows downward,
 *   so text already read never moves. On mobile it grows up from the bar to a maximum height.
 * - Expanded (desktop only): centred, most of the screen, with chats on the left. Switching to
 *   and from it follows the `FORM_SWITCH` steps.
 *
 * Switching chats (from the history sheet or the chats pane) swaps the answers in place.
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
  focusRequest,
  initialScrollTop,
  onScrollChange,
  anchor,
  onDismiss,
  entryPoint,
  pinned,
  onAsk,
  onPin,
  onUnpin,
}) => {
  const titleId = useId();
  const rootRef = useRef<HTMLElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  /**
   * The scroll area and its content are rebuilt when the form changes, so the measuring hooks are
   * given the elements themselves (and each new one). The scroll area is also kept in a ref for
   * scrolling.
   */
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
  const [contentElement, setContentElement] = useState<HTMLDivElement | null>(null);
  /** Callback ref for the scroll area: stores it in both places above. */
  const setScrollArea = useCallback((node: HTMLDivElement | null) => {
    scrollRef.current = node;
    setScrollElement(node);
  }, []);
  /** True when the panel opened at a remembered scroll spot, so the "new answer" scroll skips once. */
  const resumedScroll = useRef(false);

  const reduceMotion = useReducedMotion();
  const isDesktop = useMediaQuery(SHELL_DESKTOP_QUERY);
  const entrance = isExpanded ? EXPANDED_ENTRANCE : isDesktop ? DESKTOP_ENTRANCE : MOBILE_ENTRANCE;

  /**
   * The form the box is drawn in. It catches up with `isExpanded` only after the content has faded
   * out, so the box changes size while empty.
   */
  const [shownExpanded, setShownExpanded] = useState(isExpanded);
  /** True while the old content is fading out before a form change. */
  const isClearing = shownExpanded !== isExpanded;
  /** True during a form change: the box then animates its size, not only its position. */
  const [isChangingForm, setIsChangingForm] = useState(false);
  /**
   * The Expand / Shrink button that was pressed disappears with the old content. When the new
   * content appears, focus moves to the new button. A stable callback ref, so it only runs when
   * the button first mounts.
   */
  const focusToggleOnMount = useRef(false);
  const focusToggle = useCallback((node: HTMLButtonElement | null) => {
    if (!node || !focusToggleOnMount.current) return;
    focusToggleOnMount.current = false;
    node.focus({ preventScroll: true });
  }, []);
  /** A step's delay in seconds, or 0 when the reader prefers reduced motion (plain fades only). */
  const step = (seconds: number) => (reduceMotion ? 0 : seconds);

  useEffect(() => {
    // Switched back before the box moved: nothing to do.
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
    // Only `isExpanded` restarts this. `shownExpanded` catching up must not.
  }, [isExpanded]);
  const contentHeight = useElementHeight(contentElement);
  const hasMoreBelow = useHasMoreBelow(scrollElement, contentHeight);
  /** True once the entrance has finished. The bottom fade and height animation wait for it. */
  const [hasEntered, setHasEntered] = useState(false);

  const thread = turns[0];
  /** Docked = nothing asked in this chat yet. */
  const isDocked = thread === undefined;

  // Take focus on open, so screen readers announce the panel and Tab reaches its controls.
  // Skipped when it was opened by typing in the prompt bar: the caret stays there.
  useEffect(() => {
    if (takeFocus) rootRef.current?.focus({ preventScroll: true });
    // On mount only: later prop changes must not move focus or scroll an open panel.
  }, []);

  /**
   * The last focus request already handled. `App` raises `focusRequest` when the panel's content
   * was replaced (a new chat, or a chip that disappeared) or when a sheet that held focus closed.
   * The panel then takes focus, unless focus is already inside it.
   */
  const handledFocusRequest = useRef(focusRequest);
  useEffect(() => {
    if (focusRequest === handledFocusRequest.current) return;
    handledFocusRequest.current = focusRequest;
    const root = rootRef.current;
    if (root && !root.contains(document.activeElement)) root.focus({ preventScroll: true });
  }, [focusRequest]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // If something else already handled Escape (an open sheet), let that sheet close instead.
      if (event.key === 'Escape' && !event.defaultPrevented) {
        event.preventDefault();
        // Same as the close button: closes in whatever form, and reopens in that form.
        onDismiss();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  /**
   * Whether the panel is still on screen (false while its closing animation plays).
   *
   * While on screen, the panel fits itself into the Tab order between the prompt field and the
   * send button, however it was opened:
   * - Tab from the field goes to the panel's first control.
   * - Tab from the panel's last control goes to the send button, then on through the page.
   * - Shift+Tab does the same in reverse.
   *
   * This is needed because the panel comes before the prompt bar on the page, so Tab would
   * otherwise skip it. It does nothing if something else (a sheet) has handled the key.
   */
  const isPresent = useIsPresent();
  useEffect(() => {
    if (!isPresent) return;

    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || event.defaultPrevented) return;
      const root = rootRef.current;
      const field = entryPoint.field.current;
      const send = entryPoint.send.current;
      if (!root || !field || !send) return;

      const active = document.activeElement;
      const controls = tabbablesIn(root);
      const first = controls[0] ?? root;
      const last = controls[controls.length - 1] ?? root;
      /** Moves focus to `target` instead of where Tab would have gone. */
      const move = (target: HTMLElement) => {
        event.preventDefault();
        target.focus();
      };

      if (!event.shiftKey) {
        if (active === field) move(first);
        else if (active === last || (active === root && controls.length === 0)) move(send);
      } else if (active === send) move(last);
      else if (active === first || active === root) move(field);
    };

    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [isPresent, entryPoint]);

  // Reopen at the remembered scroll spot. Done before paint, so the panel never flashes at the top.
  useLayoutEffect(() => {
    if (initialScrollTop && scrollRef.current) {
      scrollRef.current.scrollTop = initialScrollTop;
      resumedScroll.current = true;
    }
    // On mount only: later prop changes must not move focus or scroll an open panel.
  }, []);

  // A new follow-up scrolls to the top of the panel, like a fresh page.
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
      // Normally the panel takes the dashboard column's width. The corner radius is set here (not as
      // a class) so corners stay round while Motion resizes the box.
      style={{
        borderRadius: 16,
        ...(!shownExpanded && anchor ? { left: anchor.left, width: anchor.width } : {}),
      }}
      className={cn(
        // When the panel itself has keyboard focus, it shows the same ring as any control.
        'fixed z-(--z-assistant) flex overflow-hidden border border-border bg-popover text-popover-foreground will-change-transform outline-none focus-visible:ring-3 focus-visible:ring-ring/50 shell:shadow-lg',
        shownExpanded
          ? // Expanded: from near the top to 1rem above the bar, 80% of the screen wide (at least
            // 56rem, or nearly full width on a small desktop). Centred on the whole screen with auto
            // margins, not with a transform: Motion's size animation would then head the wrong way.
            // Uses % (not vw), which leaves out the scrollbar, so the centre is the visible centre.
            // The bottom follows the bar's height with a CSS transition, since the top never moves.
            'inset-x-0 top-[5dvh] bottom-[calc(var(--prompt-bar-h)+2.5rem)] mx-auto w-[min(calc(100%_-_2rem),max(80%,56rem))] flex-row transition-[bottom] duration-(--duration-base) ease-(--ease-out)'
          : cn(
              'inset-x-3 max-h-[calc(100dvh-var(--prompt-bar-h)-4rem-env(safe-area-inset-bottom,0px))] flex-col shadow-md shell:inset-x-auto shell:max-h-(--assistant-panel-max)',
              // Docked: sits 1rem above the bar. Raised: the top edge stays where it would be at full
              // height, so the panel grows downward and text already read stays still. (Hanging
              // from the bar instead, every new chunk would push everything up.)
              isDocked
                ? 'bottom-[calc(var(--prompt-bar-h)+2rem+env(safe-area-inset-bottom,0px))] shell:bottom-[calc(var(--prompt-bar-h)+2.5rem)]'
                : 'top-8 shell:top-[calc(100dvh-var(--prompt-bar-h)-2.5rem-var(--assistant-panel-max))]',
            ),
      )}
      // Usually only the position animates (docked to raised), while the inner area animates the
      // height, so nothing inside is stretched. During a form change the whole box animates,
      // size included; its content has already faded out by then.
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
      {/* The chats pane: added as the box starts to grow, it waits for the box, then slides in. */}
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
            <div className="min-h-0 flex-1 scrollbar-stable overflow-y-auto">
              <ChatList chats={chats} activeChatId={activeChatId} onSwitchChat={onSwitchChat} />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* The content, keyed by form: the old content fades out before the box moves, and the new
          content fades in once the box (and the chats pane) has arrived. `min-h-0` lets the scroll
          area shrink and scroll, instead of pushing the panel past its maximum height. */}
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
              {/* Desktop only: on mobile the panel already fills the screen. */}
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

          {/* The scroll area. It animates to the content's height, so new content grows the panel
            smoothly (downward, since the top stays put). Past the maximum height it scrolls.
            When expanded, it simply fills the box. */}
          <motion.div
            ref={setScrollArea}
            onScroll={event => onScrollChange(event.currentTarget.scrollTop)}
            data-overflow={hasEntered && hasMoreBelow}
            // `relative`, so each answer's offsetTop is measured from the scroll area, not from
            // the whole panel with its header.
            className={cn(
              'relative min-h-0 shrink scrollbar-stable overflow-y-auto overscroll-contain data-[overflow=true]:scroll-fade',
              shownExpanded && 'flex-1',
            )}
            initial={false}
            animate={{ height: shownExpanded ? 'auto' : (contentHeight ?? 'auto') }}
            transition={{ duration: reduceMotion || !hasEntered ? 0 : 0.32, ease: EASE_OUT }}
          >
            <div
              ref={setContentElement}
              // In the wide box, keep lines to a comfortable reading width.
              className={cn(
                'flex flex-col gap-5 px-5 py-4',
                shownExpanded && 'mx-auto w-full max-w-2xl',
              )}
            >
              {/* Empty state: nothing asked in this chat yet, so suggest a first question. */}
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
