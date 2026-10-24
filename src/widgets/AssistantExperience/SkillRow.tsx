import { type FC as ReactFC } from 'react';
import { Info } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { RATING_BANDS, ratingBand } from '@/lib/rating';
import { cn } from '@/lib/utils';

import { ISkillRow } from './AssistantExperience.types';

/** One scored skill: name, score bar, the number, and the evidence line beneath. */
const SkillRow: ReactFC<ISkillRow> = ({ row, isLowest }) => {
  const band = RATING_BANDS[ratingBand(row.score)];

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1">
      <span className="flex items-center gap-1.5 text-sm font-semibold">
        {row.skill}
        {isLowest && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex size-4 items-center justify-center rounded-full text-destructive outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-label="About this score"
              >
                <Info className="size-3.5" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              Lowest score across these calls. Suggested coaching focus.
            </TooltipContent>
          </Tooltip>
        )}
      </span>
      <span className="flex items-center gap-3">
        <span className="h-1.5 w-20 overflow-hidden rounded-full bg-muted" aria-hidden="true">
          <span
            className={cn('block h-full origin-left rounded-full', band.fill)}
            style={{ transform: `scaleX(${row.score / 5})` }}
          />
        </span>
        <span
          className={cn(
            'w-8 text-right text-lg leading-none font-semibold tabular-nums',
            band.text,
          )}
        >
          {row.score.toFixed(1)}
          <span className="sr-only"> out of 5</span>
        </span>
      </span>
      <p className="col-span-2 text-[0.8125rem] leading-snug text-text-secondary">{row.evidence}</p>
    </li>
  );
};

export default SkillRow;
