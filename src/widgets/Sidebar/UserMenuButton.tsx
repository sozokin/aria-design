import { type FC as ReactFC } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { EASE_OUT } from '@/lib/motion';

import { MOBILE_NAV_ID } from './MobileNav';
import { IUserMenuButton } from './Sidebar.types';

/**
 * Mobile only: the avatar in the top bar, which opens and closes the navigation menu.
 *
 * While the menu is open, the user's name and title slide in beside the avatar, pushing it left
 * as far as they need.
 */
const UserMenuButton: ReactFC<IUserMenuButton> = ({ ref, isOpen, onToggle }) => {
  /** With reduced motion the width snaps instead of sliding; the name still fades in. */
  const reduceMotion = useReducedMotion();
  /** The width animation's duration, or 0 with reduced motion. */
  const widthDuration = (seconds: number) => (reduceMotion ? 0 : seconds);

  return (
    <button
      ref={ref}
      type="button"
      // No gap on the button: the spacing is inside the sliding part, so nothing jumps when it leaves.
      className="user-row cursor-pointer gap-0 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      aria-expanded={isOpen}
      aria-controls={MOBILE_NAV_ID}
      aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
      onClick={onToggle}
    >
      <span className="avatar">JA</span>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.span
            key="who"
            className="overflow-hidden whitespace-nowrap"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{
              width: 0,
              opacity: 0,
              transition: {
                duration: 0.22,
                ease: EASE_OUT,
                width: { duration: widthDuration(0.22) },
              },
            }}
            transition={{
              duration: 0.38,
              ease: EASE_OUT,
              width: { duration: widthDuration(0.38) },
            }}
          >
            <motion.span
              // Full natural width, so the outer part clips it while opening (instead of the title being cut to "…").
              className="ml-2.5 grid w-max pr-1 text-left leading-tight [&_small]:overflow-visible [&_small]:text-clip"
              initial={{ x: 24 }}
              animate={{ x: 0 }}
              exit={{ x: 24 }}
              transition={{ duration: 0.38, ease: EASE_OUT }}
            >
              <strong className="text-[0.8125rem] font-semibold">Jordan Ashby</strong>
              <small className="text-xs text-text-secondary">Sales manager · North America</small>
            </motion.span>
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};

export default UserMenuButton;
