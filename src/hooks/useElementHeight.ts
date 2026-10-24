import { useLayoutEffect, useState, type RefObject } from 'react';

/** An element's rendered height, kept current by a ResizeObserver. Null until first measured. */
function useElementHeight(ref: RefObject<HTMLElement | null>) {
  const [height, setHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new ResizeObserver(() => setHeight(element.offsetHeight));
    observer.observe(element);
    setHeight(element.offsetHeight);

    return () => observer.disconnect();
  }, [ref]);

  return height;
}

export default useElementHeight;
