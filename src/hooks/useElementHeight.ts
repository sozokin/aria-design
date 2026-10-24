import { useLayoutEffect, useState } from 'react';

/**
 * An element's rendered height, kept current by a ResizeObserver. Null until first measured. Takes
 * the element itself (from a callback ref) rather than a ref object, so an element that remounts
 * is observed afresh instead of the observer staying on the one that was removed.
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
