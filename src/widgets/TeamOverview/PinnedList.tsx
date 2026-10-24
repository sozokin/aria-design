import { type FC as ReactFC } from 'react';
import { Pin } from 'lucide-react';

/** The "Pinned" block. Until answers can be pinned it only holds the empty hint. */
const PinnedList: ReactFC = () => (
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
    </h2>
    <p className="mt-2 text-[0.8125rem] leading-snug text-text-secondary">
      Pin an AI answer to keep it on your dashboard. Pinned answers are listed here.
    </p>
  </section>
);

export default PinnedList;
