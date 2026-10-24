import { describe, expect, it } from 'vitest';

import { chatSummaries } from './chats';
import { createTurn } from './stream';

const CARD = { rep: 'Marcus Bell', period: 'Q3', summary: '', rows: [], nextStep: '' };

describe('chatSummaries', () => {
  it('titles each chat with its first question and counts the rest', () => {
    const turns = [
      createTurn('t1', 'c1', 'How is Marcus doing?'),
      createTurn('t2', 'c1', 'And Lena?'),
    ];
    expect(chatSummaries(turns)).toEqual([
      { id: 'c1', title: 'How is Marcus doing?', turnCount: 2, rep: null },
    ]);
  });

  it('names the rep from the latest card', () => {
    const turns = [
      { ...createTurn('t1', 'c1', 'How is Marcus doing?'), card: CARD },
      createTurn('t2', 'c1', 'And the next call?'),
    ];
    expect(chatSummaries(turns)[0].rep).toBe('Marcus Bell');
  });

  it('orders chats by their most recent turn, newest first', () => {
    const turns = [
      createTurn('t1', 'c1', 'First chat'),
      createTurn('t2', 'c2', 'Second chat'),
      createTurn('t3', 'c1', 'A follow-up in the first chat'),
    ];
    expect(chatSummaries(turns).map(chat => chat.id)).toEqual(['c1', 'c2']);
  });

  it('lists nothing before a question is asked', () => {
    expect(chatSummaries([])).toEqual([]);
  });
});
