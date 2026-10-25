import { type FC as ReactFC } from 'react';

import AnswerSkeleton from './AnswerSkeleton';
import CoachingCard from './CoachingCard';
import Reveal from './Reveal';
import StatusLine from './StatusLine';
import StreamedText from './StreamedText';

import { IAnswerTurn } from './AssistantExperience.types';

/**
 * One question and its answer, in the panel.
 *
 * Shows, top to bottom:
 * - the question as a message bubble (follow-ups only),
 * - the status line,
 * - the answer text, and
 * - the coaching card.
 *
 * The text and the card each show a grey placeholder until they arrive.
 */
const AnswerTurn: ReactFC<IAnswerTurn> = ({
  turn,
  isFollowUp,
  isPinned,
  shareCardLayout,
  onTogglePin,
  onAskNextStep,
}) => {
  const isStreaming = turn.phase === 'streaming';

  return (
    <div data-turn={turn.id} className="flex flex-col gap-3">
      {isFollowUp && (
        <p className="max-w-[85%] self-end rounded-2xl rounded-br-md border border-border bg-secondary px-3.5 py-2 text-[0.8125rem] leading-snug">
          <span className="sr-only">You asked: </span>
          {turn.prompt}
        </p>
      )}

      <StatusLine turn={turn} />

      <Reveal
        ready={turn.text !== ''}
        skeleton={<AnswerSkeleton.Text />}
        // Keep the placeholder's height while text arrives, so the block does not shrink and grow.
        className={isStreaming ? 'min-h-[4.125rem]' : ''}
      >
        <StreamedText deltas={turn.deltas} streaming={isStreaming} />
      </Reveal>

      <Reveal ready={turn.card !== null} skeleton={<AnswerSkeleton.Card />}>
        {turn.card && (
          <CoachingCard
            card={turn.card}
            // Once pinned, the dashboard copy takes over the fly-to-dashboard id.
            layoutId={isPinned || !shareCardLayout ? undefined : `coaching-card-${turn.id}`}
            isPinned={isPinned}
            onTogglePin={onTogglePin}
            onAskNextStep={onAskNextStep}
          />
        )}
      </Reveal>
    </div>
  );
};

export default AnswerTurn;
