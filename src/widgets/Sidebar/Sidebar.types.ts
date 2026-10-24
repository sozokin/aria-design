import type { ComponentType, Ref } from 'react';

export interface INavEntry {
  label: string;
  icon: ComponentType<{ 'data-icon'?: string; 'aria-hidden'?: boolean | 'true' }>;
  /** The page we are on. */
  current?: boolean;
}

export interface ISidebar {
  isCompact: boolean;
  onCompactChange: (compact: boolean) => void;
  isDesktop: boolean;
}

export interface IUserMenuButton {
  ref: Ref<HTMLButtonElement>;
  isOpen: boolean;
  onToggle: () => void;
}

export interface IMobileNav {
  open: boolean;
  onClose: () => void;
}
