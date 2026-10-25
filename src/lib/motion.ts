/** The app's standard easing curve: starts fast, settles gently. Same as CSS `--ease-out`. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/**
 * Timings, in seconds, for how the dashboard appears on first load. The order is:
 * 1. The navigation slides in, and the greeting and date rise with it (`greeting`).
 * 2. The brief's lines fade in, top to bottom (`brief`).
 * 3. The team overview's blocks fade in (`rail`).
 * 4. Last, the prompt bar rises from the bottom (`hero`), because it is what the page is about.
 *
 * `step` is the gap between items in the same group. `duration` is how long each item takes.
 */
export const LOAD_IN = {
  greeting: 0.05,
  brief: 0.3,
  rail: 0.55,
  hero: 0.95,
  step: 0.07,
  duration: 0.45,
};

/**
 * Motion props that fade an element in and lift it slightly.
 *
 * @param delay - Seconds to wait after the element mounts.
 * @returns `initial`, `animate` and `transition` props for a Motion element.
 */
export const loadIn = (delay: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: LOAD_IN.duration, ease: EASE_OUT },
});

/**
 * Timing for the team overview's collapse on mobile. Slow on purpose, and eased at both ends,
 * so the eye can follow the block all the way into the toggle.
 */
export const COLLAPSE_TRANSITION = {
  duration: 0.5,
  ease: [0.65, 0, 0.35, 1] as const,
};

/**
 * The speed curve of the collapsing block's flight. It is already moving as it leaves (so it is
 * seen going), then speeds up smoothly as it shrinks into the toggle, without a sudden burst.
 */
export const COLLAPSE_FLIGHT_EASE = [0.3, 0.15, 0.8, 0.5] as const;
