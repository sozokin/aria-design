import type { StreamEvent } from '../../mock/types';
import type { ITurn } from '@/types/assistant.types';

export const createTurn = (id: string, prompt: string): ITurn => ({
  id,
  prompt,
  phase: 'reviewing',
  status: '',
  text: '',
  deltas: [],
  card: null,
});

// Folds one stream event into a turn. Pure, so it is easy to test.
export function applyEvent(turn: ITurn, event: StreamEvent): ITurn {
  switch (event.type) {
    case 'status':
      return { ...turn, status: event.label };
    case 'text':
      return {
        ...turn,
        phase: 'streaming',
        text: turn.text + event.delta,
        deltas: [...turn.deltas, event.delta],
      };
    case 'artifact':
      return { ...turn, card: event.data };
    case 'done':
      return { ...turn, phase: 'complete' };
    default:
      return turn;
  }
}

// The status line reads in the past tense once the answer is complete.
export const statusLabel = (turn: ITurn) =>
  turn.phase === 'complete' ? turn.status.replace(/^Reviewing\b/, 'Reviewed') : turn.status;
