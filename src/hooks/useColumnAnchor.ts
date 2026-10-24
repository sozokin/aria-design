import { useLayoutEffect, useState, type RefObject } from 'react';

import { SHELL_DESKTOP_QUERY } from './useMediaQuery';

import type { IColumnAnchor } from '@/types/layout.types';

/**
 * The dashboard column's horizontal box on desktop, so fixed surfaces (the prompt bar, the answer
 * panel) can line up with it. Null below the shell's breakpoint, where CSS docks them full width.
 */
function useColumnAnchor(columnRef: RefObject<HTMLElement | null>) {
  const [anchor, setAnchor] = useState<IColumnAnchor | null>(null);

  useLayoutEffect(() => {
    const column = columnRef.current;
    const desktop = window.matchMedia(SHELL_DESKTOP_QUERY);

    const update = () => {
      if (!desktop.matches || !column) {
        setAnchor(null);
        return;
      }
      const rect = column.getBoundingClientRect();
      setAnchor({ left: rect.left, width: rect.width });
    };

    update();
    window.addEventListener('resize', update);
    desktop.addEventListener('change', update);
    const observer = new ResizeObserver(update);
    if (column) observer.observe(column);

    // The column can move without changing size: the sidebar gliding to its compact width shifts
    // the whole main area, which ResizeObserver cannot see. Follow that transition frame by frame.
    let frame = 0;
    let transitionsRunning = 0;
    const isSidebarTransition = (event: TransitionEvent) =>
      event.propertyName === 'grid-template-columns';
    const tick = () => {
      update();
      if (transitionsRunning > 0) frame = window.requestAnimationFrame(tick);
    };
    const handleTransitionStart = (event: TransitionEvent) => {
      if (!isSidebarTransition(event)) return;
      transitionsRunning += 1;
      if (transitionsRunning === 1) frame = window.requestAnimationFrame(tick);
    };
    const handleTransitionEnd = (event: TransitionEvent) => {
      if (!isSidebarTransition(event)) return;
      transitionsRunning = Math.max(0, transitionsRunning - 1);
      update();
    };
    document.addEventListener('transitionstart', handleTransitionStart);
    document.addEventListener('transitionend', handleTransitionEnd);
    document.addEventListener('transitioncancel', handleTransitionEnd);

    return () => {
      window.removeEventListener('resize', update);
      desktop.removeEventListener('change', update);
      observer.disconnect();
      document.removeEventListener('transitionstart', handleTransitionStart);
      document.removeEventListener('transitionend', handleTransitionEnd);
      document.removeEventListener('transitioncancel', handleTransitionEnd);
      window.cancelAnimationFrame(frame);
    };
  }, [columnRef]);

  return anchor;
}

export default useColumnAnchor;
