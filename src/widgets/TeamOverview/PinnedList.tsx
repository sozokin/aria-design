import { type FC as ReactFC } from 'react';
import { Pin } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';

import { getInitials } from '@/lib/utils';

import { IPinnedList } from './TeamOverview.types';

/** The "Pinned" block: an empty hint, or one link per pinned card, newest first. */
const PinnedList: ReactFC<IPinnedList> = ({ pinned, onJump }) => (
  <section
    className="rounded-xl border border-border bg-card p-4 shadow-xs"
    aria-labelledby="pinned-title"
  >
    <h2
      id="pinned-title"
      className="flex items-center gap-1.5 text-[0.8125rem] font-semibold text-tertiary-foreground"
    >
      <Pin className="size-3.5" aria-hidden="true" />
      Pinned
      {pinned.length > 1 && (
        <span className="ml-auto text-xs font-medium text-text-secondary">{pinned.length}</span>
      )}
    </h2>

    {pinned.length > 0 ? (
      <ul className="mt-3 flex flex-col gap-2" aria-label="Pinned answers">
        {pinned.map(entry => (
          <li key={entry.turnId}>
            <button
              type="button"
              onClick={() => onJump(entry.turnId)}
              className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-secondary px-2.5 py-2 text-left transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Avatar size="sm">
                <AvatarFallback className="bg-info-muted text-[0.625rem] font-semibold text-info-muted-foreground">
                  {getInitials(entry.card.rep)}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0">
                <span className="block truncate text-[0.8125rem] font-semibold">
                  {entry.card.rep}
                </span>
                <span className="block truncate text-xs text-text-secondary">
                  Coaching card · {entry.card.period}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    ) : (
      <p className="mt-2 text-[0.8125rem] leading-snug text-text-secondary">
        Pin an AI answer to keep it on your dashboard. Pinned answers are listed here.
      </p>
    )}
  </section>
);

export default PinnedList;
