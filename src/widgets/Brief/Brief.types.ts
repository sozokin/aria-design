/** Props for `Brief`. */
export interface IBrief {
  /** The latest answer's suggested next step, or the opening question before any answer. */
  suggestedNextStep: string;
  /** Asks the suggested next step as a question. */
  onAskNextStep: (question: string) => void;
}
