import { useEffect, useState } from 'react';

/**
 * Tells whether a scroll area has more content further down.
 *
 * Takes the element itself (from a callback ref), so a replaced element is watched afresh.
 *
 * @param element - The scroll area, or `null` before it exists.
 * @param contentHeight - The content's height. Not read; passing it re-checks when content grows,
 *   not only when the reader scrolls.
 * @returns True while there is content below the visible part.
 */
function useHasMoreBelow(element: HTMLElement | null, contentHeight: number | null) {
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!element) return;

    /** Checks whether more than 4 px of content is hidden below. */
    const check = () => {
      const remaining = element.scrollHeight - element.scrollTop - element.clientHeight;
      setHasMore(remaining > 4);
    };

    check();
    element.addEventListener('scroll', check, { passive: true });
    const observer = new ResizeObserver(check);
    observer.observe(element);

    return () => {
      element.removeEventListener('scroll', check);
      observer.disconnect();
    };
  }, [element, contentHeight]);

  return hasMore;
}

export default useHasMoreBelow;
