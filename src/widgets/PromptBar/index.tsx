import { type FC as ReactFC } from 'react';

import Icons from '@/components/Icons';
import PromptBarStatus from './PromptBarStatus';

import { IPromptBar } from './PromptBar.types';

// The new-chat pill and the gap to it: 3.25rem + 0.75rem (styles.css, .new-chat-trigger). On
// desktop the bar gives up this much width, so the bar and the pill stay centred as a pair.
const NEW_CHAT_FOOTPRINT_PX = 64;

/**
 * The shell's AI Assistant entry point: the floating bar at the bottom centre of every page, with
 * the new-chat button beside it in a pill of its own that matches the bar.
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
}) => {
  // On desktop, centre the pair on the dashboard column rather than the whole main area. The bar
  // is positioned by its centre (CSS translates it back by half), the pill by its left edge.
  const barCenter = anchor ? anchor.left + (anchor.width - NEW_CHAT_FOOTPRINT_PX) / 2 : null;
  const barWidth = anchor
    ? `min(var(--assistant-w), ${anchor.width - NEW_CHAT_FOOTPRINT_PX}px)`
    : null;

  return (
    <>
      <form
        className="assistant-trigger"
        aria-label="Ask AI Assistant"
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
        <input
          ref={ref}
          id="assistant-prompt"
          value={value}
          placeholder={hasThread ? 'Ask a follow-up…' : 'Ask anything…'}
          autoComplete="off"
          onChange={event => {
            onValueChange(event.target.value);
            onInteract();
          }}
          onFocus={onInteract}
          onClick={onInteract}
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

      {/* The same pill as the bar, so the plus reads as the send button's twin rather than a loose dot. */}
      <div
        className="new-chat-trigger"
        style={
          barCenter !== null
            ? { left: `calc(${barCenter}px + ${barWidth} / 2 + 0.75rem)` }
            : undefined
        }
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
