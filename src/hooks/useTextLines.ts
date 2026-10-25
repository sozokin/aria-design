import { useLayoutEffect, useState } from 'react';

/**
 * Counts how many lines a field's text wraps onto.
 *
 * It measures a hidden copy of the text (the "mirror") that has the field's width and font: the
 * mirror's height divided by one line's height is the number of lines. It measures again when the
 * text changes and when the mirror's width changes, since a new width wraps differently.
 *
 * @param mirror - The hidden copy of the text, or `null` before it exists.
 * @param text - The field's text.
 * @returns The number of lines, at least 1.
 */
function useTextLines(mirror: HTMLElement | null, text: string) {
  const [lines, setLines] = useState(1);

  useLayoutEffect(() => {
    if (!mirror) return;

    /** Divides the mirror's height by one line's height. */
    const measure = () => {
      const lineHeight = parseFloat(getComputedStyle(mirror).lineHeight);
      setLines(Math.max(1, Math.round(mirror.offsetHeight / lineHeight)));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(mirror);

    return () => observer.disconnect();
  }, [mirror, text]);

  return lines;
}

export default useTextLines;
