/** Shared easing, matching the shell's --ease-out token. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/**
 * The dashboard's first paint, in seconds. The navigation slides in while the greeting and the
 * rail's header rise with it; then the brief's lines fade in, top to bottom; then the team
 * overview's blocks (the rail on desktop, the inline card on mobile) top to bottom or left to
 * right; and last the prompt bar rises from the bottom, the piece the page is about. `step` is the
 * gap between lines or blocks in one group.
 */
export const LOAD_IN = {
  greeting: 0.05,
  brief: 0.3,
  rail: 0.55,
  hero: 0.95,
  step: 0.07,
  duration: 0.45,
};

/** Props for a motion element that fades in and rises a little, `delay` seconds after mount. */
export const loadIn = (delay: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: LOAD_IN.duration, ease: EASE_OUT },
});

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
