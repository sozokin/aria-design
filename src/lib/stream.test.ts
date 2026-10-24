import { describe, expect, it } from 'vitest';

import { streamAnswer } from '../../mock/streamAnswer';
import { applyEvent, createTurn, statusLabel } from './stream';

const BROOKFIELD_NEXT_STEP =
  'In the next Brookfield call, ask who must validate operational and legal readiness.';

describe('applyEvent', () => {
  it('folds the documented sequence into a complete turn', async () => {
    let turn = createTurn('t1', 'How is Marcus doing?');
    for await (const event of streamAnswer(turn.prompt, { speed: 0 })) {
      turn = applyEvent(turn, event);
    }
    expect(turn.phase).toBe('complete');
    expect(turn.status).toBe('Reviewing 6 discovery calls');
    expect(turn.text).toMatch(/^Marcus is improving/);
    expect(turn.deltas).toHaveLength(3);
    expect(turn.deltas.join('')).toBe(turn.text);
    expect(turn.card?.rows).toHaveLength(3);
  });

  it('moves to streaming on the first text delta and reads past tense when complete', () => {
    const start = createTurn('t1', 'q');
    const reviewing = applyEvent(start, { type: 'status', label: 'Reviewing 6 discovery calls' });
    expect(statusLabel(reviewing)).toBe('Reviewing 6 discovery calls');
    const streaming = applyEvent(reviewing, { type: 'text', delta: 'Hi' });
    expect(streaming.phase).toBe('streaming');
    const done = applyEvent(streaming, { type: 'done' });
    expect(statusLabel(done)).toBe('Reviewed 6 discovery calls');
  });
});

describe('scripted follow-up', () => {
  it('serves a different card when the Brookfield next step is asked', async () => {
    let turn = createTurn('t2', BROOKFIELD_NEXT_STEP);
    for await (const event of streamAnswer(turn.prompt, { speed: 0 })) {
      turn = applyEvent(turn, event);
    }
    expect(turn.status).toBe('Preparing the Brookfield call plan');
    expect(turn.card?.period).toBe('Brookfield · Next call prep');
    expect(turn.card?.rows.map(row => row.id)).toEqual([
      'call-opener',
      'stakeholder-map',
      'validation-plan',
    ]);
    expect(turn.card?.nextStep).not.toBe(BROOKFIELD_NEXT_STEP);
  });

  it("leads back to the discovery review from the Brookfield card's next step", async () => {
    let brookfield = createTurn('t2', BROOKFIELD_NEXT_STEP);
    for await (const event of streamAnswer(brookfield.prompt, { speed: 0 })) {
      brookfield = applyEvent(brookfield, event);
    }
    let next = createTurn('t3', brookfield.card!.nextStep);
    for await (const event of streamAnswer(next.prompt, { speed: 0 })) {
      next = applyEvent(next, event);
    }
    expect(next.status).toBe('Reviewing 6 discovery calls');
    expect(next.card?.nextStep).toBe(BROOKFIELD_NEXT_STEP);
  });
});
