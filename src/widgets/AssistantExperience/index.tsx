import { type FC as ReactFC } from 'react';

import AssistantPanel from './AssistantPanel';

import { IAssistantExperience } from './AssistantExperience.types';

/**
 * The AI Assistant answer experience. State lives in the host so an answer keeps streaming while
 * this surface is closed; this component only decides whether the panel is there.
 */
const AssistantExperience: ReactFC<IAssistantExperience> = ({ isOpen, turns, ...panelProps }) =>
  isOpen && turns.length > 0 ? <AssistantPanel turns={turns} {...panelProps} /> : null;

export default AssistantExperience;
