import type { ComponentType } from 'react';

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
