import { Skeleton } from '@/components/ui/skeleton';

/** Turns off the skeleton's pulse when the reader prefers reduced motion. */
const LINE = 'motion-reduce:animate-none';

/** Grey lines that hold the answer text's space, so the card below does not jump when text arrives. */
const Text = () => (
  <div className="flex flex-col gap-2 py-1" aria-hidden="true">
    <Skeleton className={`${LINE} h-3.5 w-full`} />
    <Skeleton className={`${LINE} h-3.5 w-[92%]`} />
    <Skeleton className={`${LINE} h-3.5 w-[58%]`} />
  </div>
);

/**
 * The card skeleton's height. The real card keeps at least this height while it opens, so it
 * fills the space the skeleton held instead of shrinking and growing again.
 */
export const CARD_FOOTPRINT = 'min-h-[21rem]';

/** A grey outline that holds the coaching card's space while the answer is still coming. */
const Card = () => (
  <div
    className={`${CARD_FOOTPRINT} rounded-xl border border-border bg-card p-4`}
    aria-hidden="true"
  >
    <div className="flex items-center gap-3">
      <Skeleton className={`${LINE} size-10 rounded-full`} />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className={`${LINE} h-3.5 w-36`} />
        <Skeleton className={`${LINE} h-3 w-52`} />
      </div>
    </div>
    <Skeleton className={`${LINE} mt-4 h-3.5 w-[70%]`} />
    <div className="mt-4 flex flex-col gap-3">
      <Skeleton className={`${LINE} h-16 w-full rounded-lg`} />
      <Skeleton className={`${LINE} h-16 w-full rounded-lg`} />
      <Skeleton className={`${LINE} h-16 w-full rounded-lg`} />
    </div>
  </div>
);

/** Placeholders shown while an answer streams: `AnswerSkeleton.Text` and `AnswerSkeleton.Card`. */
const AnswerSkeleton = {
  Text,
  Card,
};

export default AnswerSkeleton;
