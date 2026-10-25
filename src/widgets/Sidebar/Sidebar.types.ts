import type { ComponentType, Ref } from 'react';

/** One entry in the navigation. */
export interface INavEntry {
  /** The entry's name. */
  label: string;
  /** The entry's icon. */
  icon: ComponentType<{ 'data-icon'?: string; 'aria-hidden'?: boolean | 'true' }>;
  /** True for the page we are on. */
  current?: boolean;
}

/** Props for `Sidebar`. */
export interface ISidebar {
  /** Desktop: show icons only. */
  isCompact: boolean;
  /** Called when the reader compacts or expands the sidebar. */
  onCompactChange: (compact: boolean) => void;
  /** True on desktop (a side column); false on mobile (a top bar). */
  isDesktop: boolean;
}

/** Props for `UserMenuButton`. */
export interface IUserMenuButton {
  /** The button, so focus can come back to it when the menu closes. */
  ref: Ref<HTMLButtonElement>;
  /** Whether the menu is open. */
  isOpen: boolean;
  /** Opens or closes the menu. */
  onToggle: () => void;
}

/** Props for `MobileNav`. */
export interface IMobileNav {
  /** Whether the menu is open. */
  open: boolean;
  /** Closes the menu. */
  onClose: () => void;
}
