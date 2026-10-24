import { useEffect, useRef, useState } from 'react';
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
 * Mobile only: the team overview starts inline under the brief and collapses, once, into a toggle
 * beside the greeting. This hook owns that one-way move: measuring the flight, holding the page's
 * height while the block travels, easing the scroll afterwards, and moving focus to the toggle.
 */
function useRailCollapse() {
  const reduceMotion = useReducedMotion();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [flight, setFlight] = useState<ICollapseFlight | null>(null);
  const [toggleAnchor, setToggleAnchor] = useState<IToggleAnchor | null>(null);
  // Holds the page's height while the block flies, so the scroll position cannot snap mid-flight.
  const [spacerHeight, setSpacerHeight] = useState(0);
  // Collapsing removes the control that had focus; focus moves to the toggle once it can take it.
  const shouldFocusToggle = useRef(false);

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

    shouldFocusToggle.current = true;
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

  // The toggle fades in late, so the attempt on mount covers reduced motion and the attempt after
  // its fade covers the rest.
  const focusToggle = () => {
    if (!shouldFocusToggle.current) return;

    const toggle = document.getElementById(RAIL_TOGGLE_ID);
    toggle?.focus({ preventScroll: true });
    if (toggle && document.activeElement === toggle) shouldFocusToggle.current = false;
  };

  useEffect(() => {
    if (isCollapsed) window.requestAnimationFrame(focusToggle);
    // Only when the collapse happens.
  }, [isCollapsed]);

  return {
    isCollapsed,
    collapse,
    flight,
    spacerHeight,
    toggleAnchor,
    settlePage,
    focusToggle,
  };
}

export default useRailCollapse;
