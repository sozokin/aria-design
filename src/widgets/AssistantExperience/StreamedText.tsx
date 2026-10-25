import { type FC as ReactFC } from 'react';
import { motion } from 'motion/react';

import { EASE_OUT } from '@/lib/motion';

import { IStreamedText } from './AssistantExperience.types';

/**
 * The answer text as it arrives. Each chunk takes its space straight away, then fades in, so
 * lines never pop. A blinking caret shows that more text is coming.
 */
const StreamedText: ReactFC<IStreamedText> = ({ deltas, streaming }) => (
  <p className="text-sm leading-relaxed">
    {deltas.map((delta, index) => (
      <motion.span
        key={index}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
      >
        {delta}
      </motion.span>
    ))}
    {streaming && (
      <span
        className="ml-0.5 inline-block h-[1em] w-0.5 translate-y-[0.15em] bg-accent motion-safe:animate-caret"
        aria-hidden="true"
      />
    )}
  </p>
);

export default StreamedText;
