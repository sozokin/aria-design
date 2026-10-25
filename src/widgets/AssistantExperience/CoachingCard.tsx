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
 * Timings, in seconds, for how the card opens the first time it shows:
 * - `step`: gap between parts starting to open (each score group, then the footer).
 * - `duration`: how long each part takes to open.
 * - `row`: delay before a group's first row appears, after the group starts.
 * - `rowStep`: gap between rows in the same group.
 */
const UNFOLD = { step: 0.22, duration: 0.4, row: 0.12, rowStep: 0.07 };

/**
 * The structured answer: who it is about, a summary, the scored skills grouped by how well they
 * went, and one suggested next step.
 *
 * The same card is used in the panel and, once pinned, on the dashboard. A shared `layoutId` lets
 * Motion fly it from one place to the other.
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
  /** Open in steps, unless the reader prefers reduced motion (then every part opens at once). */
  const unfoldsInSteps = unfold && !reduceMotion;
  /**
   * True until the last part has opened. While parts open, the card's height changes every frame,
   * so it only animates its position. Afterwards it animates its full size again, which is what
   * carries it to the dashboard when pinned.
   */
  const [isUnfolding, setIsUnfolding] = useState(unfoldsInSteps);

  /**
   * Motion props that open one part of the card from zero height, in its turn.
   *
   * @param order - The part's place in the opening order (0 is first).
   * @returns Motion props, or none when the card does not open in steps.
   */
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
            {/* Desktop: "· Scores out of 5" on the same line. Mobile: too narrow, so it goes on its own line, in brackets. */}
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
              {/* "to dashboard" only fits on desktop; screen readers always hear it. */}
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
