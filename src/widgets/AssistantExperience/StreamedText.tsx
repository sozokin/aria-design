import { type FC as ReactFC } from 'react';

import { IStreamedText } from './AssistantExperience.types';

/** The answer text as it arrives, one span per chunk. A caret marks that more is coming. */
const StreamedText: ReactFC<IStreamedText> = ({ deltas, streaming }) => (
  <p className="text-sm leading-relaxed">
    {deltas.map((delta, index) => (
      <span key={index}>{delta}</span>
    ))}
    {streaming && (
      <span
        className="ml-0.5 inline-block h-[1em] w-0.5 translate-y-[0.15em] bg-accent"
        aria-hidden="true"
      />
    )}
  </p>
);

export default StreamedText;
