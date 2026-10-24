import { type FC as ReactFC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Info } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

import { EASE_OUT } from '@/lib/motion';
import { RATING_BANDS, ratingBand } from '@/lib/rating';
import { cn } from '@/lib/utils';

import { ISkillRow } from './AssistantExperience.types';

/** One scored skill: name, score bar, the number, and the evidence line beneath. */
const SkillRow: ReactFC<ISkillRow> = ({ row, delay, isLowest, reveal }) => {
  const reduceMotion = useReducedMotion();
  const band = RATING_BANDS[ratingBand(row.score)];

  return (
    <motion.li
      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1"
      initial={reveal ? { opacity: 0, y: reduceMotion ? 0 : 6 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay, ease: EASE_OUT }}
    >
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
          {/* The bar fills just after its row has appeared. */}
          <motion.span
            className={cn('block h-full origin-left rounded-full', band.fill)}
            initial={reveal ? { scaleX: 0 } : false}
            animate={{ scaleX: row.score / 5 }}
            transition={{ duration: 0.6, delay: delay + 0.1, ease: EASE_OUT }}
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
    </motion.li>
  );
};

export default SkillRow;
