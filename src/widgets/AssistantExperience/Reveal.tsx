import { type FC as ReactFC } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import { EASE_OUT } from '@/lib/motion';

import { IReveal } from './AssistantExperience.types';

const LAYOUT_GLIDE = { duration: 0.45, ease: EASE_OUT };

/**
 * Shows a skeleton until `ready`, then the real content in its place: the skeleton fades out as
 * the content fades in. Both keep their layout position, so whatever sits below glides when the
 * content above it grows instead of stepping down a line at a time.
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
