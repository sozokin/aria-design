import { useId, type FC as ReactFC } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import NextStepChip from './NextStepChip';
import SkillRow from './SkillRow';

import { groupByBand, lowestRow, RATING_BANDS } from '@/lib/rating';
import { cn, getInitials } from '@/lib/utils';

import { ICoachingCard } from './AssistantExperience.types';

/**
 * The structured answer: who it is about, a summary, the scored skills grouped by rating band, and
 * one suggested next step.
 */
const CoachingCard: ReactFC<ICoachingCard> = ({ card, onAskNextStep, className }) => {
  const id = useId();
  const groups = groupByBand(card.rows);
  const lowest = lowestRow(card.rows);

  return (
    <article
      className={cn('rounded-xl border border-border bg-card shadow-xs', className)}
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
      </header>

      <p className="px-4 pb-3 text-sm">{card.summary}</p>

      {groups.map(({ band, rows }) => (
        <section
          key={band}
          className="border-t border-border px-4 py-3"
          aria-labelledby={`${id}-${band}`}
        >
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
            {rows.map(row => (
              <SkillRow key={row.id} row={row} isLowest={row.id === lowest?.id} />
            ))}
          </ul>
        </section>
      ))}

      <footer className="border-t border-border px-4 py-3">
        <p className="text-xs font-semibold text-accent-muted-foreground">Suggested next step</p>
        <NextStepChip text={card.nextStep} onAsk={onAskNextStep} />
      </footer>
    </article>
  );
};

export default CoachingCard;
