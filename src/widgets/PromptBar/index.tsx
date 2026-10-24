import { type FC as ReactFC } from 'react';

import Icons from '@/components/Icons';
import PromptBarStatus from './PromptBarStatus';

import { IPromptBar } from './PromptBar.types';

/** The shell's AI Assistant entry point: the floating bar at the bottom centre of every page. */
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
}) => (
  <form
    className="assistant-trigger"
    aria-label="Ask AI Assistant"
    // On desktop, centre the bar on the dashboard column rather than the whole main area.
    style={
      anchor
        ? {
            left: anchor.left + anchor.width / 2,
            width: `min(var(--assistant-w), ${anchor.width}px)`,
          }
        : undefined
    }
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
    <button className="icon-button optional-action" type="button" aria-label="Voice input" disabled>
      <Icons.mic data-icon="inline-only" />
    </button>
    <button className="icon-button primary" type="submit" aria-label="Ask AI Assistant">
      <Icons.arrowUp data-icon="inline-only" />
    </button>
  </form>
);

export default PromptBar;
