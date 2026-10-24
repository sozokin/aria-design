import { useEffect, type RefObject } from 'react';

/**
 * The prompt bar floats over the page, so content that scrolls needs room to clear it at the end.
 * A page that already fits must not become scrollable because of that room, so the flag is set
 * only when the content on its own is taller than the viewport. styles.css reads the attribute.
 */
function useNeedsBarClearance(
  mainRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    const main = mainRef.current;
    const content = contentRef.current;
    if (!main || !content) return;

    const update = () => {
      const verticalPadding = parseFloat(getComputedStyle(main).paddingTop) * 2;
      const contentIsTaller = content.offsetHeight + verticalPadding > window.innerHeight;
      main.dataset.needsBarClearance = String(contentIsTaller);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(content);
    window.addEventListener('resize', update);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [mainRef, contentRef]);
}

export default useNeedsBarClearance;
