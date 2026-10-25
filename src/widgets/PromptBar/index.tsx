import { useEffect, useLayoutEffect, useState, type FC as ReactFC } from 'react';

import Icons from '@/components/Icons';
import PromptBarStatus from './PromptBarStatus';

import useMediaQuery, { SHELL_DESKTOP_QUERY } from '@/hooks/useMediaQuery';
import useTextLines from '@/hooks/useTextLines';
import { LOAD_IN } from '@/lib/motion';

import { IPromptBar } from './PromptBar.types';

/**
 * Width of the new-chat pill plus the gap to it, in pixels (3.25rem + 0.75rem). While the pill is
 * showing, the desktop bar gives up this much width, so the bar and pill stay centred together.
 */
const NEW_CHAT_FOOTPRINT_PX = 64;
/** How long the bar and the pill take to glide into place, in milliseconds. */
const GLIDE_MS = 320;
/**
 * Mobile only: the pill waits for the on-screen keyboard to finish opening before it hides.
 * The keyboard counts as settled when the screen size has not changed for `KEYBOARD_SETTLE_MS`.
 * If the screen never changes (for example with a hardware keyboard), the pill hides after
 * `KEYBOARD_FALLBACK_MS`.
 */
const KEYBOARD_SETTLE_MS = 120;
const KEYBOARD_FALLBACK_MS = 700;

/** The field grows to at most this many lines. Longer questions scroll inside it. */
const MAX_LINES = 3;
/** One line of the field, in rem. */
const LINE_REM = 1.5;
/** The field's top plus bottom padding, in rem, for one line and for more (more lines get more room). */
const PADDING_REM = { oneLine: 1.625, multiline: 2.25 };

/**
 * The send button's label for each thing it can do. Its arrow points the same way: up to open the
 * panel, at the text to ask, down to close the panel.
 */
const SEND_LABEL = {
  open: 'Open AI Assistant',
  ask: 'Ask AI Assistant',
  close: 'Close AI Assistant',
};

/**
 * The bar's height for a given number of lines: the lines, the padding and the borders.
 *
 * @param lines - How many lines the field shows.
 * @returns A CSS height in rem. One line gives the starter app's 3.25rem.
 */
export const promptBarHeight = (lines: number) =>
  `${lines * LINE_REM + (lines > 1 ? PADDING_REM.multiline : PADDING_REM.oneLine) + 0.125}rem`;

/**
 * The AI Assistant's entry point: a bar floating at the bottom centre of every page, with a
 * matching round + button beside it for a new chat.
 *
 * The field:
 * - starts at one line and grows to three; after that it scrolls, keeping the line being typed in
 *   view and fading out the lines above.
 *
 * The send button does what its arrow shows:
 * - with text: asks the question (arrow points at the text),
 * - with an empty bar: opens the panel (arrow up) or closes it (arrow down).
 *
 * Keyboard: on desktop, Enter asks and Shift+Enter adds a line. On mobile, Enter only adds a line.
 *
 * The + button hides behind the bar's right end until the chat has a question. Then the bar makes
 * room and the + glides out next to it. (A first question already starts a new chat, so the +
 * only matters once there is a chat to leave.)
 */
const PromptBar: ReactFC<IPromptBar> = ({
  ref,
  sendButtonRef,
  value,
  onValueChange,
  onSubmit,
  onInteract,
  hasThread,
  anchor,
  isPanelOpen,
  isAnswering,
  hasUnseenAnswer,
  onReopen,
  onNewChat,
  onLinesChange,
}) => {
  const isDesktop = useMediaQuery(SHELL_DESKTOP_QUERY);
  /**
   * Whether the + button is showing (it shows while the chat has a question). On mobile, when a
   * new chat starts, hiding it waits for the keyboard to finish opening, so the two movements do
   * not happen at the same time.
   */
  const [showsNewChat, setShowsNewChat] = useState(hasThread);
  /**
   * True only while the + button is coming or going. The bar's position also follows the column
   * (resizes, the sidebar sliding), which must not be animated, so the glide transition is only
   * switched on for this moment, then off again.
   */
  const [isGliding, setIsGliding] = useState(false);
  useEffect(() => {
    if (!isGliding) return;
    const timer = window.setTimeout(() => setIsGliding(false), GLIDE_MS);
    return () => window.clearTimeout(timer);
  }, [isGliding]);
  useEffect(() => {
    if (hasThread === showsNewChat) return;
    const move = () => {
      setShowsNewChat(hasThread);
      setIsGliding(true);
    };
    if (hasThread || isDesktop) {
      move();
      return;
    }
    const viewport = window.visualViewport;
    const retreat = move;
    let settle = 0;
    const fallback = window.setTimeout(retreat, KEYBOARD_FALLBACK_MS);
    const handleViewportResize = () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        window.clearTimeout(fallback);
        retreat();
      }, KEYBOARD_SETTLE_MS);
    };
    viewport?.addEventListener('resize', handleViewportResize);
    return () => {
      window.clearTimeout(fallback);
      window.clearTimeout(settle);
      viewport?.removeEventListener('resize', handleViewportResize);
    };
  }, [hasThread, isDesktop, showsNewChat]);
  const footprint = showsNewChat ? NEW_CHAT_FOOTPRINT_PX : 0;
  /**
   * Desktop: centre the bar (and the + button with it) on the dashboard column, not the whole
   * screen. The bar is placed by its centre (CSS shifts it back by half its width). The + button
   * is placed by its left edge: beside the bar when showing, under the bar's right end when hidden.
   */
  const barCenter = anchor ? anchor.left + (anchor.width - footprint) / 2 : null;
  const barWidth = anchor ? `min(var(--assistant-w), ${anchor.width - footprint}px)` : null;
  const pillLeft =
    barCenter !== null
      ? `calc(${barCenter}px + ${barWidth} / 2 ${showsNewChat ? '+ 0.75rem' : '- 3.25rem'})`
      : undefined;

  /** What the send button will do now. */
  const intent = value.trim() ? 'ask' : isPanelOpen ? 'close' : 'open';
  const [mirror, setMirror] = useState<HTMLDivElement | null>(null);
  const lines = useTextLines(mirror, value);
  const shownLines = Math.min(lines, MAX_LINES);
  const overflows = lines > MAX_LINES;
  /** Whether there is hidden text above or below, so that edge can fade out. */
  const [edges, setEdges] = useState({ above: false, below: false });
  /** Checks the field's scroll position and updates `edges`. */
  const syncEdges = (element: HTMLTextAreaElement) =>
    setEdges({
      above: element.scrollTop > 2,
      below: element.scrollHeight - element.scrollTop - element.clientHeight > 2,
    });

  /** The field element, kept for scrolling and passed on to `App` through `ref`. */
  const [field, setField] = useState<HTMLTextAreaElement | null>(null);
  /** Callback ref: stores the field and passes it on to `ref`. */
  const setFieldRef = (node: HTMLTextAreaElement | null) => {
    setField(node);
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  useEffect(() => {
    onLinesChange(shownLines);
  }, [shownLines, onLinesChange]);

  // When typing at the end, keep the field scrolled to the very bottom (the browser alone only
  // scrolls as far as the caret). Editing higher up is left to the browser. Either way, re-check
  // the faded edges, since the text has changed.
  useLayoutEffect(() => {
    if (!field) return;
    if (overflows && field.selectionEnd === field.value.length) {
      field.scrollTop = field.scrollHeight;
    }
    syncEdges(field);
  }, [field, value, overflows]);

  return (
    <>
      <form
        className="assistant-trigger"
        aria-label="Ask AI Assistant"
        data-with-plus={showsNewChat}
        data-gliding={isGliding}
        style={{
          // On first load the bar rises in last (see `bar-rise` in styles.css).
          animationDelay: `${LOAD_IN.hero}s`,
          animationDuration: `${LOAD_IN.duration}s`,
          ...(barCenter !== null ? { left: barCenter, width: barWidth ?? undefined } : {}),
        }}
        onSubmit={event => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label className="sr-only" htmlFor="assistant-prompt">
          {hasThread ? 'Ask AI Assistant a follow-up' : 'Ask AI Assistant anything'}
        </label>
        <PromptBarStatus
          isAnswering={isAnswering}
          hasUnseenAnswer={hasUnseenAnswer}
          onReopen={onReopen}
        />
        {/* The padding is on this wrapper, not on the field. The field is what scrolls, so its text
            is cut off at the padding and never runs into the bar's round ends. */}
        <div className="assistant-field" data-multiline={shownLines > 1}>
          <textarea
            ref={setFieldRef}
            id="assistant-prompt"
            rows={1}
            value={value}
            placeholder={hasThread ? 'Ask a follow-up…' : 'Ask anything…'}
            autoComplete="off"
            // The height is set here (not grown from the content), so CSS can animate the change.
            style={{ height: `${shownLines * LINE_REM}rem` }}
            data-overflow={overflows}
            data-above={overflows && edges.above}
            data-below={overflows && edges.below}
            onChange={event => {
              onValueChange(event.target.value);
              onInteract();
            }}
            onFocus={onInteract}
            onClick={onInteract}
            onScroll={event => syncEdges(event.currentTarget)}
            onKeyDown={event => {
              // Desktop only: Enter asks, Shift+Enter adds a line. While typing with an input
              // method (for example Japanese), Enter belongs to it. On mobile, the send button asks.
              if (
                isDesktop &&
                event.key === 'Enter' &&
                !event.shiftKey &&
                !event.nativeEvent.isComposing
              ) {
                event.preventDefault();
                onSubmit();
              }
            }}
          />
          {/* A hidden copy of the text, used to count how many lines it wraps to. The zero-width
              space at the end gives a trailing new line its own line, as in the field. */}
          <div ref={setMirror} className="assistant-mirror" aria-hidden="true">
            {`${value}\u200b`}
          </div>
        </div>
        <button
          className="icon-button optional-action"
          type="button"
          aria-label="Voice input"
          disabled
        >
          <Icons.mic data-icon="inline-only" />
        </button>
        <button
          ref={sendButtonRef}
          className="icon-button primary"
          type="submit"
          aria-label={SEND_LABEL[intent]}
          data-intent={intent}
        >
          <Icons.arrowUp data-icon="inline-only" />
        </button>
      </form>

      {/* The + button, in a round pill that matches the bar, so it reads as the send button's
          twin. While hidden behind the bar it is inert: it cannot be focused or heard. */}
      <div
        className="new-chat-trigger"
        data-shown={showsNewChat}
        data-gliding={isGliding}
        inert={!showsNewChat}
        style={pillLeft ? { left: pillLeft } : undefined}
      >
        <button
          className="icon-button primary"
          type="button"
          aria-label="New chat"
          onClick={onNewChat}
        >
          <Icons.plus data-icon="inline-only" />
        </button>
      </div>
    </>
  );
};

export default PromptBar;
