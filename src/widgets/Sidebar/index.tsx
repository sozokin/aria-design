import { useCallback, useRef, type FC as ReactFC } from 'react';

import Icons from '@/components/Icons';

import useSearchShortcut from '@/hooks/useSearchShortcut';
import { PRIMARY_NAV, SECONDARY_NAV } from './nav';

import { ISidebar } from './Sidebar.types';

/**
 * The shell's primary navigation. On desktop it is the left column, with a compact mode that keeps
 * only the icons.
 */
const Sidebar: ReactFC<ISidebar> = ({ isCompact, onCompactChange, isDesktop }) => {
  const searchRef = useRef<HTMLInputElement>(null);

  const expandSidebar = useCallback(() => onCompactChange(false), [onCompactChange]);
  useSearchShortcut(searchRef, isDesktop, expandSidebar);

  return (
    <aside className="sidebar" aria-label="Primary">
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
        <div className="user-row shell-context" data-label="Jordan Ashby">
          <span className="avatar">JA</span>
          <span className="who">
            <strong>Jordan Ashby</strong>
            <small>Sales manager · North America</small>
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
