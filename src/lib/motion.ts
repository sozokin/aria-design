/** Shared easing, matching the shell's --ease-out token. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/**
 * The team overview's collapse is deliberately slow and eases in as well as out, so the eye can
 * follow the block all the way to the toggle it disappears into.
 */
export const COLLAPSE_TRANSITION = {
  duration: 0.5,
  ease: [0.65, 0, 0.35, 1] as const,
};

/**
 * The collapsing block's own flight: it is already moving as it leaves (at about half its average
 * speed, so it is seen going) and picks up speed as it shrinks into the toggle, ending at about
 * 2.5× its average speed rather than in a burst.
 */
export const COLLAPSE_FLIGHT_EASE = [0.3, 0.15, 0.8, 0.5] as const;
