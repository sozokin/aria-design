import { type FC as ReactFC } from 'react';

import { ILiveAnnouncer } from './AssistantExperience.types';

/**
 * A hidden area that screen readers read out politely. It is the one place the assistant speaks:
 * status changes, "Answer ready", pin and undo.
 *
 * Streamed text is never read out here. Unpinning is not either, because its toast already
 * speaks for itself.
 */
const LiveAnnouncer: ReactFC<ILiveAnnouncer> = ({ announcement }) => (
  <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
    {/* A new key per message, so the same text repeated is still read again. */}
    {announcement && <span key={announcement.id}>{announcement.text}</span>}
  </div>
);

export default LiveAnnouncer;
