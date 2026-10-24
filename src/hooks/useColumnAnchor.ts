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

    return () => {
      window.removeEventListener('resize', update);
      desktop.removeEventListener('change', update);
      observer.disconnect();
    };
  }, [columnRef]);

  return anchor;
}

export default useColumnAnchor;
