import { useId, useState, type FC as ReactFC } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Pin, PinOff } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CARD_FOOTPRINT } from './AnswerSkeleton';
import NextStepChip from './NextStepChip';
import SkillRow from './SkillRow';

import { EASE_OUT } from '@/lib/motion';
import { groupByBand, lowestRow, RATING_BANDS } from '@/lib/rating';
import { cn, getInitials } from '@/lib/utils';

import { ICoachingCard } from './AssistantExperience.types';

/**
 * The card's unfold, in seconds: one part (a rating band, then the footer) starts opening every
 * `step`, each taking `duration` to reach its height; within a band the rows follow from `row`
 * after it starts, one every `rowStep`.
 */
const UNFOLD = { step: 0.22, duration: 0.4, row: 0.12, rowStep: 0.07 };

/**
 * The structured answer: who it is about, a summary, the scored skills grouped by rating band, and
 * one suggested next step. The same component renders inside the panel and, once pinned, on the
 * dashboard; the shared `layoutId` is what lets Motion fly it between the two.
 */
const CoachingCard: ReactFC<ICoachingCard> = ({
  card,
  layoutId,
  isPinned,
  onTogglePin,
  onAskNextStep,
  unfold = true,
  className,
}) => {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const groups = groupByBand(card.rows);
  const lowest = lowestRow(card.rows);
  // Reduced motion keeps the stagger of the rows' fades but opens every part at once.
  const unfoldsInSteps = unfold && !reduceMotion;
  // True until the last part has opened. The parts change the box's height every frame while
  // they open, and the box re-renders along with the panel as they do, so a size animation on
  // the box would fight them; once they are open, the box animates its size again, which is
  // what carries it to the dashboard on a pin.
  const [isUnfolding, setIsUnfolding] = useState(unfoldsInSteps);

  // One part of the card opening from nothing to its height, in its turn.
  const opening = (order: number) =>
    unfoldsInSteps
      ? {
          initial: { height: 0, opacity: 0 },
          animate: { height: 'auto', opacity: 1 },
          transition: { delay: order * UNFOLD.step, duration: UNFOLD.duration, ease: EASE_OUT },
        }
      : {};

  return (
    <motion.article
      layoutId={layoutId}
      layout={isUnfolding ? 'position' : true}
      transition={{ layout: { duration: 0.5, ease: EASE_OUT } }}
      className={cn(
        'rounded-xl border border-border bg-card shadow-xs',
        unfoldsInSteps && CARD_FOOTPRINT,
        className,
      )}
      aria-labelledby={`${id}-rep`}
    >
      <header className="flex items-start gap-3 px-4 pt-4 pb-3">
        <Avatar size="lg">
          <AvatarFallback className="bg-info-muted text-xs font-semibold text-info-muted-foreground">
            {getInitials(card.rep)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 id={`${id}-rep`} className="text-[0.9375rem] leading-tight font-semibold">
            {card.rep}
          </h3>
          <p className="mt-0.5 text-xs text-text-secondary">
            {card.period}
            {/* Beside the period on desktop. The mobile header is too narrow for one line, so it drops below, in brackets. */}
            <span className="block shell:inline">
              <span className="shell:hidden">(</span>
              <span className="hidden shell:inline">{' · '}</span>
              Scores out of 5<span className="shell:hidden">)</span>
            </span>
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="ml-auto shrink-0"
          onClick={onTogglePin}
        >
          {isPinned ? <PinOff data-icon="inline-start" /> : <Pin data-icon="inline-start" />}
          {isPinned ? (
            'Unpin'
          ) : (
            <>
              Pin
              {/* The full label only fits beside the name on desktop; screen readers always get it. */}
              <span className="sr-only shell:not-sr-only"> to dashboard</span>
            </>
          )}
        </Button>
      </header>

      <p className="px-4 pb-3 text-sm">{card.summary}</p>

      {groups.map(({ band, rows }, order) => (
        <motion.div key={band} className="overflow-hidden" {...opening(order)}>
          <section className="border-t border-border px-4 py-3" aria-labelledby={`${id}-${band}`}>
            <h4
              id={`${id}-${band}`}
              className={cn(
                'flex items-center gap-2 text-[0.8125rem] font-semibold',
                RATING_BANDS[band].text,
              )}
            >
              <span
                className={cn('size-1.5 rounded-full', RATING_BANDS[band].fill)}
                aria-hidden="true"
              />
              {RATING_BANDS[band].label}
            </h4>
            <ul className="mt-2.5 flex flex-col gap-3">
              {rows.map((row, index) => (
                <SkillRow
                  key={row.id}
                  row={row}
                  delay={
                    (unfoldsInSteps ? order * UNFOLD.step : 0) + UNFOLD.row + index * UNFOLD.rowStep
                  }
                  isLowest={row.id === lowest?.id}
                  reveal={unfold}
                />
              ))}
            </ul>
          </section>
        </motion.div>
      ))}

      <motion.div
        className="overflow-hidden"
        {...opening(groups.length)}
        onAnimationComplete={() => setIsUnfolding(false)}
      >
        <footer className="border-t border-border px-4 py-3">
          <p className="text-xs font-semibold text-accent-muted-foreground">Suggested next step</p>
          <NextStepChip text={card.nextStep} onAsk={onAskNextStep} />
        </footer>
      </motion.div>
    </motion.article>
  );
};

export default CoachingCard;
