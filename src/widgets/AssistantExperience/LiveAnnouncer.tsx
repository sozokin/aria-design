import { type FC as ReactFC } from 'react';

import { ILiveAnnouncer } from './AssistantExperience.types';

/**
 * One polite live region for the whole assistant: status changes, answer ready, pin and undo.
 * Streamed text is never announced, only these moments. Unpinning is announced by its toast,
 * which is a live region of its own, so it is not repeated here.
 */
const LiveAnnouncer: ReactFC<ILiveAnnouncer> = ({ announcement }) => (
  <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
    {/* Keyed by id, so a repeated message is a new node and is read again. */}
    {announcement && <span key={announcement.id}>{announcement.text}</span>}
  </div>
);

export default LiveAnnouncer;
