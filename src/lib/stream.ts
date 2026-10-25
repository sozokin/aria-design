import type { StreamEvent } from '../../mock/types';
import type { ITurn } from '@/types/assistant.types';

/**
 * Makes a new, empty turn for a question that has just been asked.
 *
 * @param id - The turn's id.
 * @param chatId - The chat it belongs to.
 * @param prompt - The question.
 * @returns A turn with no status, text or card yet.
 */
export const createTurn = (id: string, chatId: string, prompt: string): ITurn => ({
  id,
  chatId,
  prompt,
  phase: 'reviewing',
  status: '',
  text: '',
  deltas: [],
  card: null,
});

/**
 * Adds one stream event to a turn and returns the updated turn.
 * Has no side effects, so it is easy to test.
 *
 * @param turn - The turn so far.
 * @param event - The next event from the stream.
 * @returns A new turn with the event applied.
 */
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

/**
 * The status line's text. Once the answer is complete it switches to the past tense:
 * "Reviewing…" becomes "Reviewed…".
 *
 * @param turn - The turn whose status to show.
 * @returns The text to show.
 */
export const statusLabel = (turn: ITurn) =>
  turn.phase === 'complete' ? turn.status.replace(/^Reviewing\b/, 'Reviewed') : turn.status;
