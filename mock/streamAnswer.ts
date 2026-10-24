import type { StreamEvent } from './types';

const ANSWER = [
  "Marcus is improving at discovery, especially when he slows down and follows the buyer's language.",
  ' His strongest recent moment was turning a vague security concern into a concrete success measure.',
  ' The next coaching opportunity is to involve more stakeholders before proposing a solution.',
];

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
 * A second scripted answer, served when the first card's suggested next step
 * is asked as a follow-up, so a thread can show two different answers. Pure
 * fixture data; the contract (status, three deltas, one card, done) is the same.
 */
const BROOKFIELD_ANSWER = [
  'For the next Brookfield call, the gap is ownership rather than interest. Omar is engaged on security, but nobody on their side has been named for legal or operational sign-off.',
  ' Ask Marcus to open with a direct question about who validates each, and to get names rather than teams.',
  ' Once those owners are known, the security review on September 9 has a clear path to approval.',
];

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
    // Leads back to the first answer, so following next steps cycles between the two scripted
    // answers and every question gets a reply that is about it.
    nextStep:
      "After the Brookfield call, review how Marcus's discovery calls are going this quarter.",
  },
};

type ScriptedAnswer = {
  status: string;
  deltas: string[];
  card: Extract<StreamEvent, { type: 'artifact' }>;
};

/** Picks the scripted answer for a prompt. Everything but the Brookfield follow-up gets the default. */
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

const wait = (milliseconds: number) =>
  new Promise<void>(resolve => window.setTimeout(resolve, milliseconds));

/**
 * The whole candidate contract: one status, three text deltas, one complete
 * artifact, and done. Set speed to 0 in tests or while iterating.
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
