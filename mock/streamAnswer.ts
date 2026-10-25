import type { StreamEvent } from './types';

/** The default answer's text, in the three chunks the stream sends. */
const ANSWER = [
  "Marcus is improving at discovery, especially when he slows down and follows the buyer's language.",
  ' His strongest recent moment was turning a vague security concern into a concrete success measure.',
  ' The next coaching opportunity is to involve more stakeholders before proposing a solution.',
];

/** The default answer's coaching card. */
const COACHING_CARD: Extract<StreamEvent, { type: 'artifact' }> = {
  type: 'artifact',
  kind: 'coaching-card',
  data: {
    rep: 'Marcus Bell',
    period: 'Last 6 discovery calls · Q3',
    summary: 'Clear progress, with one repeatable gap in stakeholder discovery.',
    rows: [
      {
        id: 'question-depth',
        skill: 'Question depth',
        score: 4.1,
        evidence: '“What would need to be true for your team to trust an autonomous patrol?”',
      },
      {
        id: 'active-listening',
        skill: 'Active listening',
        score: 3.8,
        evidence: "Marcus reflected Omar's compliance concern before moving to product detail.",
      },
      {
        id: 'multithreading',
        skill: 'Stakeholder discovery',
        score: 2.9,
        evidence: 'Three calls ended without confirming who else shapes the decision.',
      },
    ],
    nextStep: 'In the next Brookfield call, ask who must validate operational and legal readiness.',
  },
};

/**
 * A second scripted answer's text. It is sent when the first card's suggested next step is
 * asked as a follow-up, so a conversation can show two different answers.
 * Test data only: it follows the same pattern (one status, three chunks, one card, done).
 */
const BROOKFIELD_ANSWER = [
  'For the next Brookfield call, the gap is ownership rather than interest. Omar is engaged on security, but nobody on their side has been named for legal or operational sign-off.',
  ' Ask Marcus to open with a direct question about who validates each, and to get names rather than teams.',
  ' Once those owners are known, the security review on September 9 has a clear path to approval.',
];

/** The second answer's coaching card. */
const BROOKFIELD_CARD: Extract<StreamEvent, { type: 'artifact' }> = {
  type: 'artifact',
  kind: 'coaching-card',
  data: {
    rep: 'Marcus Bell',
    period: 'Brookfield · Next call prep',
    summary: 'Three sign-offs still need named owners before the security review lands.',
    rows: [
      {
        id: 'call-opener',
        skill: 'Call opener',
        score: 4.3,
        evidence: "Marcus's recap of last call's concerns was concise and accurate.",
      },
      {
        id: 'stakeholder-map',
        skill: 'Stakeholder map',
        score: 3.2,
        evidence: 'Omar (security) is engaged; the legal and operations owners are still unnamed.',
      },
      {
        id: 'validation-plan',
        skill: 'Validation plan',
        score: 2.6,
        evidence: 'No agreed checklist for who signs off operational readiness.',
      },
    ],
    // The last scripted step. Asking it gets the first answer again (see `answerFor`), so
    // following the suggested next steps loops back to the start.
    nextStep:
      'Open the call by asking Omar who owns legal sign-off, then confirm a date for the operational walkthrough.',
  },
};

/** Everything one scripted answer sends: its status, its text chunks and its card. */
type ScriptedAnswer = {
  status: string;
  deltas: string[];
  card: Extract<StreamEvent, { type: 'artifact' }>;
};

/**
 * Picks which scripted answer to send for a question.
 *
 * @param prompt - The question that was asked.
 * @returns The Brookfield answer for the Brookfield follow-up; the default answer for anything else.
 */
function answerFor(prompt: string): ScriptedAnswer {
  const asked = prompt.toLowerCase();
  if (asked.includes('brookfield') && (asked.includes('validate') || asked.includes('readiness'))) {
    return {
      status: 'Preparing the Brookfield call plan',
      deltas: BROOKFIELD_ANSWER,
      card: BROOKFIELD_CARD,
    };
  }
  return { status: 'Reviewing 6 discovery calls', deltas: ANSWER, card: COACHING_CARD };
}

/** Waits for the given number of milliseconds. */
const wait = (milliseconds: number) =>
  new Promise<void>(resolve => window.setTimeout(resolve, milliseconds));

/**
 * Streams a fake answer, with short pauses between events: one status, three text chunks, one
 * complete coaching card, then done.
 *
 * @param prompt - The question that was asked.
 * @param options.speed - How fast to play the pauses. 1 is normal; 0 skips them (for tests).
 * @returns The events, one at a time.
 */
export async function* streamAnswer(
  prompt: string,
  options: { speed?: number } = {},
): AsyncGenerator<StreamEvent> {
  const speed = options.speed ?? 1;
  const pause = (milliseconds: number) =>
    speed === 0 ? Promise.resolve() : wait(milliseconds / speed);
  const answer = answerFor(prompt);

  await pause(360);
  yield { type: 'status', label: answer.status };

  for (const delta of answer.deltas) {
    await pause(460);
    yield { type: 'text', delta };
  }

  await pause(520);
  yield answer.card;
  yield { type: 'done' };
}
