import { useLayoutEffect, useState } from 'react';

/**
 * Tracks an element's height as it changes.
 *
 * Takes the element itself (from a callback ref), not a ref object. That way, if the element is
 * replaced by a new one, the new one gets measured instead of the old one.
 *
 * @param element - The element to measure, or `null` before it exists.
 * @returns The height in pixels, or `null` until the first measurement.
 */
function useElementHeight(element: HTMLElement | null) {
  const [height, setHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!element) return;

    const observer = new ResizeObserver(() => setHeight(element.offsetHeight));
    observer.observe(element);
    setHeight(element.offsetHeight);

    return () => observer.disconnect();
  }, [element]);

  return height;
}

export default useElementHeight;
