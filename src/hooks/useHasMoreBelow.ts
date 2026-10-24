import { useEffect, useState } from 'react';

/**
 * True while a scroll region has content below the fold. Takes the element itself (from a callback
 * ref), so a region that remounts is watched afresh. `contentHeight` is only a dependency:
 * re-checking when the content grows, not just when the user scrolls.
 */
function useHasMoreBelow(element: HTMLElement | null, contentHeight: number | null) {
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!element) return;

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
