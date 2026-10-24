import { type FC as ReactFC } from 'react';
import { AnimatePresence, motion } from 'motion/react';
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

    <AnimatePresence initial={false} mode="popLayout">
      {pinned.length > 0 ? (
        <motion.ul key="entries" className="mt-3 flex flex-col gap-2" aria-label="Pinned answers">
          {/* No initial={false} here: on the first pin this list mounts fresh, and its entry must
              still fade in a beat after the card lands. The outer one keeps page load static. */}
          <AnimatePresence mode="popLayout">
            {pinned.map(entry => (
              <motion.li
                key={entry.turnId}
                layout="position"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                // The entry appears a beat after the card has landed on the dashboard.
                transition={{ duration: 0.22, delay: 0.2, layout: { duration: 0.22, delay: 0 } }}
              >
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
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      ) : (
        <motion.p
          key="empty"
          className="mt-2 text-[0.8125rem] leading-snug text-text-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          Pin an AI answer to keep it on your dashboard. Pinned answers are listed here.
        </motion.p>
      )}
    </AnimatePresence>
  </section>
);

export default PinnedList;
