import { type FC as ReactFC } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { EASE_OUT } from '@/lib/motion';

import { MOBILE_NAV_ID } from './MobileNav';
import { IUserMenuButton } from './Sidebar.types';

/**
 * The avatar in the mobile top bar. It opens the navigation menu, and while the menu is open the
 * user's name and title slide in beside it, pushing the avatar left as far as they need.
 */
const UserMenuButton: ReactFC<IUserMenuButton> = ({ ref, isOpen, onToggle }) => {
  // Reduced motion only switches off transforms; the width snaps here, the name still fades in.
  const reduceMotion = useReducedMotion();
  const widthDuration = (seconds: number) => (reduceMotion ? 0 : seconds);

  return (
    <button
      ref={ref}
      type="button"
      // No gap here: the spacing lives inside the animated span, so nothing pops when it unmounts.
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
              // Natural width, so the outer span clips it as it opens instead of the title truncating to "…".
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
