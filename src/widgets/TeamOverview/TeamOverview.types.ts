import type { IPinnedTurn } from '@/types/assistant.types';

/** Where the overview is shown: the desktop right rail, the mobile drawer, or inline under the brief. */
export type TTeamOverviewVariant = 'rail' | 'drawer' | 'inline';

export interface ITeamOverview {
  pinned: IPinnedTurn[];
  onJumpToPinned: (turnId: string) => void;
  variant?: TTeamOverviewVariant;
}

export interface IInlineTeamOverview extends Omit<ITeamOverview, 'variant'> {
  onCollapse: () => void;
}

export interface ITeamOverviewDrawer extends Omit<ITeamOverview, 'variant'> {
  /** Fires once the toggle is on screen, so focus can move to it after a collapse. */
  onToggleShown: () => void;
}

export interface IPinnedList {
  pinned: IPinnedTurn[];
  onJump: (turnId: string) => void;
}
