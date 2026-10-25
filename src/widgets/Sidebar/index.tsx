import { useCallback, useRef, useState, type FC as ReactFC } from 'react';
import { AnimatePresence, motion } from 'motion/react';

import Icons from '@/components/Icons';
import MobileNav from './MobileNav';
import UserMenuButton from './UserMenuButton';

import useSearchShortcut from '@/hooks/useSearchShortcut';
import { EASE_OUT, LOAD_IN } from '@/lib/motion';
import { PRIMARY_NAV, SECONDARY_NAV } from './nav';

import { ISidebar } from './Sidebar.types';

/**
 * The app's main navigation.
 *
 * - Desktop: the left column. It can be compacted to show icons only.
 * - Mobile: the same element becomes a sticky top bar that stays put while scrolling. The avatar
 *   opens the navigation as a menu that drops down below it.
 */
const Sidebar: ReactFC<ISidebar> = ({ isCompact, onCompactChange, isDesktop }) => {
  const searchRef = useRef<HTMLInputElement>(null);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  /** Expands a compact sidebar (used by the Cmd+K shortcut, so the search field is visible). */
  const expandSidebar = useCallback(() => onCompactChange(false), [onCompactChange]);
  useSearchShortcut(searchRef, isDesktop, expandSidebar);

  /** Closes the mobile menu and puts focus back on the avatar that opened it. */
  const closeMobileNav = () => {
    setMobileNavOpen(false);
    // Focus goes back to the avatar that opened the menu.
    window.requestAnimationFrame(() => avatarButtonRef.current?.focus({ preventScroll: true }));
  };

  return (
    <>
      {/* On first load: slides in from the left on desktop, or drops in from above on mobile. */}
      <motion.aside
        className="sidebar"
        aria-label="Primary"
        initial={{ opacity: 0, x: isDesktop ? -24 : 0, y: isDesktop ? 0 : -12 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: LOAD_IN.duration, ease: EASE_OUT }}
      >
        <div className="brand-row">
          <a className="brand" href="#top" aria-label="Aria Sales Hub home">
            <img src="/aria-logo.png" alt="" width={26} height={26} />
            <span className="nav-label">Aria</span>
          </a>
          <button
            className="sidebar-toggle"
            type="button"
            aria-label={isCompact ? 'Expand sidebar' : 'Compact sidebar'}
            aria-expanded={!isCompact}
            aria-controls="primary-navigation"
            onClick={() => onCompactChange(!isCompact)}
          >
            {isCompact ? (
              <Icons.panelOpen data-icon="inline-only" />
            ) : (
              <Icons.panelClose data-icon="inline-only" />
            )}
          </button>
        </div>

        <div className="sidebar-search" data-label="Search">
          <Icons.search data-icon="inline-start" aria-hidden="true" />
          <input
            ref={searchRef}
            className="nav-label"
            type="search"
            placeholder="Search"
            aria-label="Search"
            aria-keyshortcuts="Meta+K Control+K"
            autoComplete="off"
          />
          <span className="kbd" aria-hidden="true">
            ⌘K
          </span>
        </div>

        <nav className="nav-group" id="primary-navigation" aria-label="Main">
          {PRIMARY_NAV.map(({ label, icon: Icon, current }) => (
            <span
              key={label}
              className="nav-item shell-context"
              aria-current={current ? 'page' : undefined}
              data-label={label}
            >
              <Icon data-icon="inline-start" aria-hidden="true" />
              <span className="nav-label">{label}</span>
            </span>
          ))}
        </nav>

        <div className="sidebar-foot">
          {SECONDARY_NAV.map(({ label, icon: Icon }) => (
            <span key={label} className="nav-item shell-context" data-label={label}>
              <Icon data-icon="inline-start" aria-hidden="true" />
              <span className="nav-label">{label}</span>
            </span>
          ))}
          {isDesktop ? (
            <div className="user-row shell-context" data-label="Jordan Ashby">
              <span className="avatar">JA</span>
              <span className="who">
                <strong>Jordan Ashby</strong>
                <small>Sales manager · North America</small>
              </span>
            </div>
          ) : (
            <UserMenuButton
              ref={avatarButtonRef}
              isOpen={mobileNavOpen}
              onToggle={() => (mobileNavOpen ? closeMobileNav() : setMobileNavOpen(true))}
            />
          )}
        </div>

        {!isDesktop && <MobileNav open={mobileNavOpen} onClose={closeMobileNav} />}
      </motion.aside>

      {/* Dims the page while the mobile menu is open. Tapping it closes the menu. */}
      <AnimatePresence>
        {!isDesktop && mobileNavOpen && (
          <motion.div
            key="mobile-nav-backdrop"
            aria-hidden="true"
            onClick={closeMobileNav}
            className="fixed inset-0 z-[9] supports-backdrop-filter:backdrop-blur-xs"
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
          >
            <motion.div
              className="absolute inset-0 bg-black/10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
