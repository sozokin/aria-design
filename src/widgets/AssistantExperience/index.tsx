import { type FC as ReactFC } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import AssistantPanel from './AssistantPanel';

import { IAssistantExperience } from './AssistantExperience.types';

/**
 * The AI Assistant answer experience. State lives in the host so an answer keeps streaming while
 * this surface is closed; this component only decides how the panel enters and leaves.
 * AnimatePresence keeps the panel mounted until its exit animation has played. On mobile the
 * sheet sits on a dimmed, blurred backdrop; on desktop the panel floats over the dashboard without
 * one.
 */
const AssistantExperience: ReactFC<IAssistantExperience> = ({
  isOpen,
  onDismiss,
  ...panelProps
}) => (
  <AnimatePresence>
    {isOpen && (
      // The blur is a static layer and only the dim fades: animating the opacity of a
      // backdrop-filter re-blurs the whole page every frame, which stutters on iOS WebKit.
      <motion.div
        key="assistant-backdrop"
        aria-hidden="true"
        onClick={onDismiss}
        className="fixed inset-0 z-[calc(var(--z-assistant)-1)] supports-backdrop-filter:backdrop-blur-xs shell:hidden"
        exit={{ opacity: 0, transition: { duration: 0.2 } }}
      >
        <motion.div
          className="absolute inset-0 bg-black/10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25 }}
        />
      </motion.div>
    )}
    {isOpen && <AssistantPanel key="assistant-panel" onDismiss={onDismiss} {...panelProps} />}
  </AnimatePresence>
);

export default AssistantExperience;
