import { useEffect, useLayoutEffect, useState } from 'react';
import { animate, useReducedMotion } from 'motion/react';

import { COLLAPSE_TRANSITION } from '@/lib/motion';

import type { ICollapseFlight, IToggleAnchor } from '@/types/layout.types';

export const MOBILE_RAIL_ID = 'mobile-rail';
export const RAIL_TOGGLE_ID = 'rail-toggle';
export const RAIL_TOGGLE_SLOT_ID = 'rail-toggle-slot';
const RAIL_TOGGLE_SIZE = 28; // the icon-sm button

// The toggle is fixed where the greeting row would place it. Measured in page coordinates
// (viewport + scroll), the spot holds whatever the scroll position.
const measureToggleAnchor = (): IToggleAnchor | null => {
  const slot = document.getElementById(RAIL_TOGGLE_SLOT_ID)?.getBoundingClientRect();
  if (!slot) return null;

  return {
    top: slot.top + window.scrollY + (slot.height - RAIL_TOGGLE_SIZE) / 2,
    right: window.innerWidth - slot.right,
  };
};

/**
 * Mobile only: the dashboard menu's toggle sits beside the greeting from the start, and the team
 * overview also starts inline under the brief. Collapsing the inline block is a one-way move into
 * that toggle. This hook keeps the toggle placed and owns the move: measuring the flight, holding
 * the page's height while the block travels, easing the scroll afterwards, and moving focus to the
 * toggle once the block, and the Collapse button that had focus, are gone.
 */
function useRailCollapse(isDesktop: boolean) {
  const reduceMotion = useReducedMotion();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [flight, setFlight] = useState<ICollapseFlight | null>(null);
  const [toggleAnchor, setToggleAnchor] = useState<IToggleAnchor | null>(null);
  // Holds the page's height while the block flies, so the scroll position cannot snap mid-flight.
  const [spacerHeight, setSpacerHeight] = useState(0);
  // Once the page has scrolled, content passes under the fixed toggle, so it needs a surface.
  const [pageScrolled, setPageScrolled] = useState(false);

  const collapse = () => {
    const block = document.getElementById(MOBILE_RAIL_ID);
    const anchor = measureToggleAnchor();

    if (block && anchor) {
      const rect = block.getBoundingClientRect();
      // The block's slot closes its top margin over the same curve, carrying the block up by that
      // much, so the flight aims that much lower to still land on the toggle.
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

  // After the flight, ease the page to where it will rest, then let the spacer go. Left to the
  // browser, the scroll would snap the instant the page became shorter than the viewport.
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
      // "instant": the shell sets scroll-behavior: smooth, which would lag each frame.
      onUpdate: value => window.scrollTo({ top: value, behavior: 'instant' }),
      onComplete: () => setSpacerHeight(0),
    });
  };

  // Collapsing removes the control that had focus; it moves to the toggle the block flew into.
  useEffect(() => {
    if (!isCollapsed) return;

    const frame = window.requestAnimationFrame(() =>
      document.getElementById(RAIL_TOGGLE_ID)?.focus({ preventScroll: true }),
    );
    return () => window.cancelAnimationFrame(frame);
  }, [isCollapsed]);

  // The toggle is placed before first paint, follows resizes, and picks up its surface once the
  // page has scrolled.
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
