import type { IChatSummary, ITurn } from '@/types/assistant.types';

/**
 * The chats with at least one turn, most recently asked first. A chat's title is its first
 * question, which is also what the panel's header shows for it.
 */
export function chatSummaries(turns: ITurn[]): IChatSummary[] {
  const summaries = new Map<string, IChatSummary>();
  for (const turn of turns) {
    const previous = summaries.get(turn.chatId);
    // Deleting and re-adding moves the chat to the end, so the map reads least recently asked first.
    summaries.delete(turn.chatId);
    summaries.set(turn.chatId, {
      id: turn.chatId,
      title: previous?.title ?? turn.prompt,
      turnCount: (previous?.turnCount ?? 0) + 1,
      rep: turn.card?.rep ?? previous?.rep ?? null,
      isAnswering: (previous?.isAnswering ?? false) || turn.phase !== 'complete',
    });
  }
  return [...summaries.values()].reverse();
}
