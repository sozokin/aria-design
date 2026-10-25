import { useEffect, useRef, type FC as ReactFC } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { RemoveScroll } from 'react-remove-scroll';
import { X } from 'lucide-react';

import Icons from '@/components/Icons';
import { Button } from '@/components/ui/button';

import { EASE_OUT } from '@/lib/motion';
import { PRIMARY_NAV, SECONDARY_NAV } from './nav';

import { IMobileNav } from './Sidebar.types';

/** DOM id of the mobile menu, so the avatar button can point to it. */
export const MOBILE_NAV_ID = 'mobile-nav';

/**
 * Mobile only: the navigation as a menu that drops down below the top bar.
 *
 * The avatar opens it. Escape, the close button and the dimmed backdrop all close it.
 */
const MobileNav: ReactFC<IMobileNav> = ({ open, onClose }) => {
  const navRef = useRef<HTMLElement>(null);
  /** With reduced motion the menu's height snaps open instead of sliding. */
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;

    navRef.current?.focus({ preventScroll: true });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  return (
    // While the menu is open, the page behind it cannot scroll.
    <RemoveScroll enabled={open} className="contents">
      <AnimatePresence>
        {open && (
          <motion.nav
            key="mobile-nav"
            ref={navRef}
            id={MOBILE_NAV_ID}
            tabIndex={-1}
            aria-label="Main"
            className="absolute inset-x-0 top-full overflow-hidden border-b border-sidebar-border bg-sidebar text-sidebar-foreground shadow-lg outline-none"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0, transition: { duration: reduceMotion ? 0 : 0.26, ease: EASE_OUT } }}
            transition={{ duration: reduceMotion ? 0 : 0.38, ease: EASE_OUT }}
          >
            <motion.div
              className="flex flex-col gap-0.5 px-3 pt-2 pb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.25, delay: 0.1 } }}
              exit={{ opacity: 0, transition: { duration: 0.12 } }}
            >
              <div className="mb-2 flex items-center gap-2">
                <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-input bg-popover px-2.5 text-text-secondary transition-colors focus-within:border-ring focus-within:ring-1 focus-within:ring-ring/60">
                  <Icons.search className="size-4 shrink-0" aria-hidden="true" />
                  {/* 16px text, so iPhones do not zoom in when the field is tapped. */}
                  <input
                    type="search"
                    placeholder="Search"
                    aria-label="Search"
                    autoComplete="off"
                    className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-text-secondary"
                  />
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="text-text-secondary"
                  onClick={onClose}
                  aria-label="Close menu"
                >
                  <X aria-hidden="true" />
                </Button>
              </div>

              {PRIMARY_NAV.map(({ label, icon: Icon, current }) => (
                <span
                  key={label}
                  className="nav-item shell-context"
                  aria-current={current ? 'page' : undefined}
                >
                  <Icon data-icon="inline-start" aria-hidden="true" />
                  <span>{label}</span>
                </span>
              ))}

              <div role="separator" className="my-2 border-t border-sidebar-border" />

              {SECONDARY_NAV.map(({ label, icon: Icon }) => (
                <span key={label} className="nav-item shell-context">
                  <Icon data-icon="inline-start" aria-hidden="true" />
                  <span>{label}</span>
                </span>
              ))}
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>
    </RemoveScroll>
  );
};

export default MobileNav;
