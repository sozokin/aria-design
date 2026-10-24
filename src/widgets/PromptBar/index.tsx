import { type FC as ReactFC } from 'react';

import Icons from '@/components/Icons';

import { IPromptBar } from './PromptBar.types';

/** The shell's AI Assistant entry point: the floating bar at the bottom centre of every page. */
const PromptBar: ReactFC<IPromptBar> = ({ ref, value, onValueChange, onSubmit, anchor }) => (
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
      Ask AI Assistant anything
    </label>
    <input
      ref={ref}
      id="assistant-prompt"
      value={value}
      autoComplete="off"
      onChange={event => onValueChange(event.target.value)}
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
