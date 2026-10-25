import { useLayoutEffect, useState, type RefObject } from 'react';

import { SHELL_DESKTOP_QUERY } from './useMediaQuery';

import type { IColumnAnchor } from '@/types/layout.types';

/**
 * Measures where the dashboard column sits on screen, so the prompt bar and the answer panel
 * (which are fixed in place) can line up with it.
 *
 * On mobile it returns `null`: there, CSS stretches those surfaces to the full width instead.
 *
 * @param columnRef - The dashboard column element.
 * @returns The column's `left` and `width` in pixels on desktop, or `null` on mobile.
 */
function useColumnAnchor(columnRef: RefObject<HTMLElement | null>) {
  const [anchor, setAnchor] = useState<IColumnAnchor | null>(null);

  useLayoutEffect(() => {
    const column = columnRef.current;
    const desktop = window.matchMedia(SHELL_DESKTOP_QUERY);

    /** Measures the column again, or clears the anchor on mobile. */
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

    // When the sidebar slides to its compact width, the column moves but keeps its size, so
    // ResizeObserver does not notice. Re-measure on every frame while that slide is running.
    let frame = 0;
    let transitionsRunning = 0;
    /** True for the sidebar's width transition (the grid columns change). */
    const isSidebarTransition = (event: TransitionEvent) =>
      event.propertyName === 'grid-template-columns';
    /** Measures, and keeps measuring each frame until the slide ends. */
    const tick = () => {
      update();
      if (transitionsRunning > 0) frame = window.requestAnimationFrame(tick);
    };
    /** The slide started: begin measuring every frame. */
    const handleTransitionStart = (event: TransitionEvent) => {
      if (!isSidebarTransition(event)) return;
      transitionsRunning += 1;
      if (transitionsRunning === 1) frame = window.requestAnimationFrame(tick);
    };
    /** The slide ended or was cancelled: take one last measurement. */
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
