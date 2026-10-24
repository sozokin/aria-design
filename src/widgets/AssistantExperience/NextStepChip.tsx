import { type FC as ReactFC } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

import { cn } from '@/lib/utils';

import { INextStepChip } from './AssistantExperience.types';

const CHIP =
  'mt-1.5 inline-flex max-w-full items-start gap-2 rounded-lg bg-accent-muted px-3 py-2 text-left text-[0.8125rem] leading-snug text-accent-muted-foreground';

/** The suggested next step as a chip. With `onAsk` it is a button that asks the step as a question. */
const NextStepChip: ReactFC<INextStepChip> = ({ text, onAsk }) => {
  const content = (
    <>
      <Sparkles className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>{text}</span>
    </>
  );

  if (!onAsk) return <p className={CHIP}>{content}</p>;

  return (
    <button
      type="button"
      onClick={() => onAsk(text)}
      className={cn(
        CHIP,
        'transition-colors outline-none hover:bg-[color-mix(in_oklch,var(--accent-muted),var(--accent)_8%)] focus-visible:ring-3 focus-visible:ring-ring/50',
      )}
    >
      {content}
      <ArrowRight className="ml-1 size-3.5 shrink-0 self-center" aria-hidden="true" />
      <span className="sr-only"> (ask the assistant about this step)</span>
    </button>
  );
};

export default NextStepChip;
