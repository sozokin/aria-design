import { type FC as ReactFC } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { RemoveScroll } from 'react-remove-scroll';

import AssistantPanel from './AssistantPanel';

import useMediaQuery, { SHELL_DESKTOP_QUERY } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

import { IAssistantExperience } from './AssistantExperience.types';

/**
 * The AI Assistant answer experience. State lives in the host so an answer keeps streaming while
 * this surface is closed; this component only decides how the panel enters and leaves.
 * AnimatePresence keeps the panel mounted until its exit animation has played. The dimmed, blurred
 * backdrop sits under the mobile sheet and under the expanded desktop panel; the usual desktop
 * panel floats over the dashboard without one. The panel keeps its identity across forms and
 * animates between them itself; only the backdrop is keyed, so it fades in and out with the form.
 * While the backdrop shows, the page behind it holds still and the panel is the only scroller.
 */
const AssistantExperience: ReactFC<IAssistantExperience> = ({
  isOpen,
  isExpanded,
  onDismiss,
  onExpandedChange,
  ...panelProps
}) => {
  const isDesktop = useMediaQuery(SHELL_DESKTOP_QUERY);

  return (
    <AnimatePresence>
      {isOpen && (
        // The blur is a static layer and only the dim fades: animating the opacity of a
        // backdrop-filter re-blurs the whole page every frame, which stutters on iOS WebKit.
        <motion.div
          key={isExpanded ? 'assistant-backdrop-expanded' : 'assistant-backdrop'}
          aria-hidden="true"
          // Under the expanded panel, a click steps back to the usual panel rather than closing.
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
        // The same lock the sheets use: it blocks wheel and touch scrolling outside the panel
        // without moving the page, so nothing behind the backdrop is measured as having moved.
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
