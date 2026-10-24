import { Skeleton } from '@/components/ui/skeleton';

const LINE = 'motion-reduce:animate-none';

/** Reserves the space the streamed answer will take, so the text does not push the card around. */
const Text = () => (
  <div className="flex flex-col gap-2 py-1" aria-hidden="true">
    <Skeleton className={`${LINE} h-3.5 w-full`} />
    <Skeleton className={`${LINE} h-3.5 w-[92%]`} />
    <Skeleton className={`${LINE} h-3.5 w-[58%]`} />
  </div>
);

/** Reserves the coaching card's footprint while the stream is still working. */
const Card = () => (
  <div className="rounded-xl border border-border bg-card p-4" aria-hidden="true">
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

const AnswerSkeleton = {
  Text,
  Card,
};

export default AnswerSkeleton;
