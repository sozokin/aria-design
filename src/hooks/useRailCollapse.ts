import { useEffect, useLayoutEffect, useState } from 'react';
import { animate, useReducedMotion } from 'motion/react';

import { COLLAPSE_TRANSITION } from '@/lib/motion';

import type { ICollapseFlight, IToggleAnchor } from '@/types/layout.types';

/** DOM id of the inline team overview block on mobile. */
export const MOBILE_RAIL_ID = 'mobile-rail';
/** DOM id of the menu toggle the block collapses into. */
export const RAIL_TOGGLE_ID = 'rail-toggle';
/** DOM id of the empty spot beside the greeting where the toggle belongs. */
export const RAIL_TOGGLE_SLOT_ID = 'rail-toggle-slot';
/** The toggle's size in pixels (the `icon-sm` button). */
const RAIL_TOGGLE_SIZE = 28;

/**
 * Works out where the fixed toggle should sit: on the spot beside the greeting.
 * Uses page coordinates (screen position plus scroll), so the spot is right at any scroll.
 *
 * @returns The toggle's `top` and `right` in pixels, or `null` if the spot is not on the page.
 */
const measureToggleAnchor = (): IToggleAnchor | null => {
  const slot = document.getElementById(RAIL_TOGGLE_SLOT_ID)?.getBoundingClientRect();
  if (!slot) return null;

  return {
    top: slot.top + window.scrollY + (slot.height - RAIL_TOGGLE_SIZE) / 2,
    right: window.innerWidth - slot.right,
  };
};

/**
 * Mobile only: runs the team overview's collapse into the menu toggle beside the greeting.
 *
 * On mobile the overview starts inline under the brief. Collapsing is one-way: the block flies
 * into the toggle and stays there. This hook:
 * - keeps the toggle placed beside the greeting,
 * - measures the flight from the block to the toggle,
 * - holds the page's height while the block flies, then eases the scroll into place, and
 * - moves focus to the toggle, because the Collapse button that had focus is gone.
 *
 * @param isDesktop - True on desktop, where none of this applies.
 * @returns The collapse state, the flight, the toggle's position and the helpers `App` needs.
 */
function useRailCollapse(isDesktop: boolean) {
  const reduceMotion = useReducedMotion();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [flight, setFlight] = useState<ICollapseFlight | null>(null);
  const [toggleAnchor, setToggleAnchor] = useState<IToggleAnchor | null>(null);
  /** Extra height that keeps the page from shrinking while the block flies away. */
  const [spacerHeight, setSpacerHeight] = useState(0);
  /** True once the page has scrolled: the toggle then needs a background over the content. */
  const [pageScrolled, setPageScrolled] = useState(false);

  /** Collapses the inline block: measures its flight to the toggle, then starts it. */
  const collapse = () => {
    const block = document.getElementById(MOBILE_RAIL_ID);
    const anchor = measureToggleAnchor();

    if (block && anchor) {
      const rect = block.getBoundingClientRect();
      // The block's top margin closes during the flight and lifts the block by that much,
      // so aim that much lower to still land on the toggle.
      const slot = block.parentElement;
      const slotMargin = slot ? parseFloat(getComputedStyle(slot).marginTop) || 0 : 0;
      const landingX = window.innerWidth - anchor.right - RAIL_TOGGLE_SIZE / 2;
      const landingY = anchor.top + RAIL_TOGGLE_SIZE / 2;

      setToggleAnchor(anchor);
      setSpacerHeight(rect.height + slotMargin);
      setFlight({
        dx: landingX - (rect.left + rect.width / 2),
        dy: landingY - (rect.top + rect.height / 2) + slotMargin,
        scaleX: RAIL_TOGGLE_SIZE / rect.width,
        scaleY: RAIL_TOGGLE_SIZE / rect.height,
      });
    }

    setIsCollapsed(true);
  };

  /**
   * After the flight: eases the page to where it will rest, then removes the spacer.
   * Without this, the scroll would jump the moment the page got shorter.
   */
  const settlePage = () => {
    const pageHeight = document.documentElement.scrollHeight - spacerHeight;
    const restingMax = Math.max(0, pageHeight - window.innerHeight);
    const from = window.scrollY;

    if (reduceMotion || from <= restingMax) {
      setSpacerHeight(0);
      return;
    }

    animate(from, restingMax, {
      duration: 0.6,
      ease: COLLAPSE_TRANSITION.ease,
      // "instant", because the page's smooth scrolling would lag behind every frame.
      onUpdate: value => window.scrollTo({ top: value, behavior: 'instant' }),
      onComplete: () => setSpacerHeight(0),
    });
  };

  // The Collapse button that had focus is gone, so move focus to the toggle the block flew into.
  useEffect(() => {
    if (!isCollapsed) return;

    const frame = window.requestAnimationFrame(() =>
      document.getElementById(RAIL_TOGGLE_ID)?.focus({ preventScroll: true }),
    );
    return () => window.cancelAnimationFrame(frame);
  }, [isCollapsed]);

  // Place the toggle before the first paint, keep it placed on resize, and note when the page
  // has scrolled (so the toggle can get its background).
  useLayoutEffect(() => {
    if (isDesktop) {
      setToggleAnchor(null);
      return;
    }

    const handleResize = () => setToggleAnchor(measureToggleAnchor());
    const handleScroll = () => setPageScrolled(window.scrollY > 4);

    handleResize();
    handleScroll();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isDesktop]);

  return {
    isCollapsed,
    collapse,
    flight,
    spacerHeight,
    toggleAnchor,
    pageScrolled,
    settlePage,
  };
}

export default useRailCollapse;
