import type { RefObject } from "react";

type AssistantExperienceProps = {
  /** The question Jordan just asked. */
  prompt: string;
  /** Call this to close your surface. The host returns focus to the entry point. */
  onDismiss: () => void;
  /** The entry-point input, if you need to position relative to it or read it. */
  triggerRef: RefObject<HTMLInputElement | null>;
};

/**
 * Candidate starting point.
 *
 * The host owns invocation. Replace this neutral placeholder with your AI
 * Assistant answer experience. You choose its form, hierarchy, interaction and
 * motion. Consume `streamAnswer(prompt)` from `../mock/streamAnswer`.
 */
export function AssistantExperience({ prompt, onDismiss }: AssistantExperienceProps) {
  return (
    <section className="assistant-placeholder" aria-labelledby="assistant-placeholder-title">
      <div>
        <p className="eyebrow">AI Assistant invoked</p>
        <h2 id="assistant-placeholder-title">Your answer experience starts here.</h2>
        <p>“{prompt}”</p>
      </div>
      <button className="plain-button" type="button" onClick={onDismiss}>
        Dismiss placeholder
      </button>
    </section>
  );
}
