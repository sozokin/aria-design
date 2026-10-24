export interface IBrief {
  /** The latest answer's suggested next step, or the opening question before any answer. */
  suggestedNextStep: string;
  onAskNextStep: (question: string) => void;
}
