import { type FC as ReactFC } from 'react';

import AnswerSkeleton from './AnswerSkeleton';
import CoachingCard from './CoachingCard';
import StatusLine from './StatusLine';
import StreamedText from './StreamedText';

import { IAnswerTurn } from './AssistantExperience.types';

/** One question and its answer: status, text and card, each shown in place of a skeleton. */
const AnswerTurn: ReactFC<IAnswerTurn> = ({
  turn,
  isFollowUp,
  isPinned,
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

      {turn.text !== '' ? (
        // Hold the skeleton's height while chunks arrive, so the block does not shrink and regrow.
        <div className={isStreaming ? 'min-h-[4.125rem]' : ''}>
          <StreamedText deltas={turn.deltas} streaming={isStreaming} />
        </div>
      ) : (
        <AnswerSkeleton.Text />
      )}

      {turn.card ? (
        <CoachingCard
          card={turn.card}
          isPinned={isPinned}
          onTogglePin={onTogglePin}
          onAskNextStep={onAskNextStep}
        />
      ) : (
        <AnswerSkeleton.Card />
      )}
    </div>
  );
};

export default AnswerTurn;
