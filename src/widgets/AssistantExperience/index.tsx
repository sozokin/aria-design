import { type FC as ReactFC } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { RemoveScroll } from 'react-remove-scroll';

import AssistantPanel from './AssistantPanel';

import useMediaQuery, { SHELL_DESKTOP_QUERY } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

import { IAssistantExperience } from './AssistantExperience.types';

/**
 * The AI Assistant's answer experience: decides how the panel comes and goes.
 *
 * The answers themselves live in `App` (through `useAssistant`), so an answer keeps streaming
 * while this is closed.
 *
 * - The panel stays on screen until its closing animation has finished.
 * - A dimmed, blurred backdrop sits behind the mobile sheet and the expanded desktop panel.
 *   The normal desktop panel floats over the dashboard without one.
 * - While the backdrop shows, the page behind it cannot scroll; only the panel does.
 */
const AssistantExperience: ReactFC<IAssistantExperience> = ({
  isOpen,
  isExpanded,
  onDismiss,
  onExpandedChange,
  onClosed,
  ...panelProps
}) => {
  const isDesktop = useMediaQuery(SHELL_DESKTOP_QUERY);

  return (
    <AnimatePresence onExitComplete={onClosed}>
      {isOpen && (
        // Only the dark tint fades; the blur is a static layer. Fading a backdrop-filter makes the
        // whole page re-blur on every frame, which stutters on iPhones.
        <motion.div
          key={isExpanded ? 'assistant-backdrop-expanded' : 'assistant-backdrop'}
          aria-hidden="true"
          // Behind the expanded panel, a click shrinks the panel back instead of closing it.
          onClick={isExpanded ? () => onExpandedChange(false) : onDismiss}
          className={cn(
            'fixed inset-0 z-[calc(var(--z-assistant)-1)] supports-backdrop-filter:backdrop-blur-xs',
            !isExpanded && 'shell:hidden',
          )}
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
      {isOpen && (
        // Stops the page behind from scrolling (the same lock the sheets use), without moving it.
        <RemoveScroll key="assistant-panel" enabled={isExpanded || !isDesktop} className="contents">
          <AssistantPanel
            isExpanded={isExpanded}
            onExpandedChange={onExpandedChange}
            onDismiss={onDismiss}
            {...panelProps}
          />
        </RemoveScroll>
      )}
    </AnimatePresence>
  );
};

export default AssistantExperience;
