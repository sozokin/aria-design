import { type FC as ReactFC } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { EASE_OUT } from '@/lib/motion';

import { IReveal } from './AssistantExperience.types';

/** How content below glides when this block changes height. */
const LAYOUT_GLIDE = { duration: 0.45, ease: EASE_OUT };

/**
 * Shows a placeholder until `ready`, then swaps in the real content: the placeholder fades out
 * as the content fades in.
 *
 * Both keep their place in the layout, so when the content grows, whatever is below glides down
 * smoothly instead of jumping one line at a time.
 */
const Reveal: ReactFC<IReveal> = ({ ready, skeleton, className, children }) => (
  <AnimatePresence initial={false} mode="popLayout">
    {ready ? (
      <motion.div
        key="content"
        layout="position"
        className={className}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ opacity: { duration: 0.3 }, layout: LAYOUT_GLIDE }}
      >
        {children}
      </motion.div>
    ) : (
      <motion.div
        key="skeleton"
        layout="position"
        exit={{ opacity: 0 }}
        transition={{ opacity: { duration: 0.18 }, layout: LAYOUT_GLIDE }}
      >
        {skeleton}
      </motion.div>
    )}
  </AnimatePresence>
);

export default Reveal;
