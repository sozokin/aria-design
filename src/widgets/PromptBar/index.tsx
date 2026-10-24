import { useEffect, useLayoutEffect, useState, type FC as ReactFC } from 'react';

import Icons from '@/components/Icons';
import PromptBarStatus from './PromptBarStatus';

import useMediaQuery, { SHELL_DESKTOP_QUERY } from '@/hooks/useMediaQuery';
import useTextLines from '@/hooks/useTextLines';

import { IPromptBar } from './PromptBar.types';

// The new-chat pill and the gap to it: 3.25rem + 0.75rem (styles.css, .new-chat-trigger). While
// the pill is out, the desktop bar gives up this much width, so the bar and the pill stay centred
// as a pair.
const NEW_CHAT_FOOTPRINT_PX = 64;
// How long the bar and the pill take to glide into their places (styles.css, --duration-slow).
const GLIDE_MS = 320;
// On mobile the pill's retreat waits for the keyboard: once the visual viewport has stopped
// changing for this long it has arrived, and if it never changes (a hardware keyboard, say) the
// retreat goes ahead after the fallback.
const KEYBOARD_SETTLE_MS = 120;
const KEYBOARD_FALLBACK_MS = 700;

// The field shows up to this many lines, growing a line at a time; longer questions scroll inside.
const MAX_LINES = 3;
// One line of the field, and the field's vertical padding at one line and at more, in rem
// (styles.css, .assistant-field). A taller pill gives its first and last lines more room.
const LINE_REM = 1.5;
const PADDING_REM = { oneLine: 1.625, multiline: 2.25 };

// What the send button will do, which its arrow points at: up to open the panel, at the text to
// ask it, down to close the panel.
const SEND_LABEL = {
  open: 'Open AI Assistant',
  ask: 'Ask AI Assistant',
  close: 'Close AI Assistant',
};

/** The bar's height for a number of shown lines: the lines, the field's padding and the bar's borders. One line is the shell's 3.25rem. */
export const promptBarHeight = (lines: number) =>
  `${lines * LINE_REM + (lines > 1 ? PADDING_REM.multiline : PADDING_REM.oneLine) + 0.125}rem`;

/**
 * The shell's AI Assistant entry point: the floating bar at the bottom centre of every page, with
 * the new-chat button beside it in a pill of its own that matches the bar. The field is one line
 * until the question needs more: it then grows to three lines, and beyond that scrolls, keeping the
 * line being typed at the bottom while the lines above fade out at the top. The send button does
 * what its arrow shows: with text it asks (arrow at the text), with an empty bar it opens the panel
 * (up) or closes it (down). On desktop Enter does the same and Shift+Enter starts a line; on mobile
 * Enter only starts a line. The new-chat pill waits behind the bar's right end until the chat has a
 * question in it, then the bar makes room and the pill glides out beside it: a first question is a
 * new chat already, so the pill matters only once there is a chat to leave.
 */
const PromptBar: ReactFC<IPromptBar> = ({
  ref,
  value,
  onValueChange,
  onSubmit,
  onInteract,
  hasThread,
  anchor,
  latestTurn,
  isPanelOpen,
  hasUnseenAnswer,
  onReopen,
  onNewChat,
  onLinesChange,
}) => {
  const isDesktop = useMediaQuery(SHELL_DESKTOP_QUERY);
  // The pill is out while the active chat has a question; otherwise it is behind the bar. Its state
  // lags `hasThread` on mobile when a new chat starts: the bar takes focus and the keyboard rises,
  // and the pill's retreat (with the bar widening into its room) waits until the keyboard has
  // arrived, so the two moves do not happen on top of each other.
  const [showsNewChat, setShowsNewChat] = useState(hasThread);
  // Positions also follow the column (resizes, the sidebar gliding), which must not be eased, so
  // the transitions are switched on only for the pill's own coming and going: set in the same
  // update as the new positions (anything measuring layout in between would otherwise see the
  // move with transitions still off), and switched off once the glide is over.
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
  // On desktop, centre the bar (and, when out, the pill with it) on the dashboard column rather
  // than the whole main area. The bar is positioned by its centre (CSS translates it back by
  // half), the pill by its left edge: beside the bar when out, under its right end when hidden.
  const barCenter = anchor ? anchor.left + (anchor.width - footprint) / 2 : null;
  const barWidth = anchor ? `min(var(--assistant-w), ${anchor.width - footprint}px)` : null;
  const pillLeft =
    barCenter !== null
      ? `calc(${barCenter}px + ${barWidth} / 2 ${showsNewChat ? '+ 0.75rem' : '- 3.25rem'})`
      : undefined;

  const intent = value.trim() ? 'ask' : isPanelOpen ? 'close' : 'open';
  const [mirror, setMirror] = useState<HTMLDivElement | null>(null);
  const lines = useTextLines(mirror, value);
  const shownLines = Math.min(lines, MAX_LINES);
  const overflows = lines > MAX_LINES;
  // Whether text sits above or below the scrolled view, to fade the edge it continues past.
  const [edges, setEdges] = useState({ above: false, below: false });
  const syncEdges = (element: HTMLTextAreaElement) =>
    setEdges({
      above: element.scrollTop > 2,
      below: element.scrollHeight - element.scrollTop - element.clientHeight > 2,
    });

  // The field, for the host (focus) and for the scrolling below.
  const [field, setField] = useState<HTMLTextAreaElement | null>(null);
  const setFieldRef = (node: HTMLTextAreaElement | null) => {
    setField(node);
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  useEffect(() => {
    onLinesChange(shownLines);
  }, [shownLines, onLinesChange]);

  // Typing at the end, keep the view at the very bottom: the browser alone scrolls only as far as
  // the caret. Editing higher up is left to the browser. Either way the edges are re-read, since
  // the text has changed under them.
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
        style={barCenter !== null ? { left: barCenter, width: barWidth ?? undefined } : undefined}
        onSubmit={event => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <label className="sr-only" htmlFor="assistant-prompt">
          {hasThread ? 'Ask AI Assistant a follow-up' : 'Ask AI Assistant anything'}
        </label>
        <PromptBarStatus
          latestTurn={latestTurn}
          isPanelOpen={isPanelOpen}
          hasUnseenAnswer={hasUnseenAnswer}
          onReopen={onReopen}
        />
        {/* The padding is on this wrapper, not the field: the field is the scroll viewport, so its
            text is clipped at the padded edge and never runs to the pill's curve while scrolling. */}
        <div className="assistant-field" data-multiline={shownLines > 1}>
          <textarea
            ref={setFieldRef}
            id="assistant-prompt"
            rows={1}
            value={value}
            placeholder={hasThread ? 'Ask a follow-up…' : 'Ask anything…'}
            autoComplete="off"
            // Set here rather than measured from the content, so the change is a CSS transition.
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
              // Desktop only: Enter asks, Shift+Enter starts a new line. A composing IME keeps
              // Enter for itself. On mobile Enter is a new line and the send button asks.
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
          {/* The same text, hidden, to measure how many lines it wraps to. The zero-width space
              gives a trailing newline a line of its own, as it has in the field. */}
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
          className="icon-button primary"
          type="submit"
          aria-label={SEND_LABEL[intent]}
          data-intent={intent}
        >
          <Icons.arrowUp data-icon="inline-only" />
        </button>
      </form>

      {/* The same pill as the bar, so the plus reads as the send button's twin rather than a loose
          dot. Inert while hidden behind the bar, so it is neither focusable nor announced. */}
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
