import type { IChatSummary, ITurn } from '@/types/assistant.types';

/**
 * Builds the chat list from all turns: one entry per chat that has at least one question,
 * most recently asked first.
 *
 * A chat's title is its first question (the panel's header shows the same).
 *
 * @param turns - Every turn in every chat, oldest first.
 * @returns One summary per chat, newest first.
 */
export function chatSummaries(turns: ITurn[]): IChatSummary[] {
  const summaries = new Map<string, IChatSummary>();
  for (const turn of turns) {
    const previous = summaries.get(turn.chatId);
    // Delete and add again to move this chat to the end; the map then runs oldest to newest.
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
