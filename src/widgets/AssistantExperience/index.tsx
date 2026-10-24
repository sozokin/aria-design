import { type FC as ReactFC } from 'react';
import { AnimatePresence } from 'motion/react';

import AssistantPanel from './AssistantPanel';

import { IAssistantExperience } from './AssistantExperience.types';

/**
 * The AI Assistant answer experience. State lives in the host so an answer keeps streaming while
 * this surface is closed; this component only decides how the panel enters and leaves.
 * AnimatePresence keeps the panel mounted until its exit animation has played.
 */
const AssistantExperience: ReactFC<IAssistantExperience> = ({ isOpen, turns, ...panelProps }) => (
  <AnimatePresence>
    {isOpen && turns.length > 0 && (
      <AssistantPanel key="assistant-panel" turns={turns} {...panelProps} />
    )}
  </AnimatePresence>
);

export default AssistantExperience;
