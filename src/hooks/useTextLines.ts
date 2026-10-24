import { useLayoutEffect, useState } from 'react';

/**
 * How many lines a field's text wraps to. `mirror` is a hidden copy of the text with the field's
 * width and typography; its height, divided by the line height, is the count. Re-measured when the
 * text changes and when the mirror's width does (a resize wraps differently).
 */
function useTextLines(mirror: HTMLElement | null, text: string) {
  const [lines, setLines] = useState(1);

  useLayoutEffect(() => {
    if (!mirror) return;

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
