import type { Ref } from 'react';

import type { IPinnedTurn } from '@/types/assistant.types';
import type { IToggleAnchor } from '@/types/layout.types';

/** Where the overview is shown: the desktop right rail, the mobile drawer, or inline under the brief. */
export type TTeamOverviewVariant = 'rail' | 'drawer' | 'inline';

export interface ITeamOverview {
  pinned: IPinnedTurn[];
  onJumpToPinned: (turnId: string) => void;
  variant?: TTeamOverviewVariant;
}

export interface IInlineTeamOverview extends Omit<ITeamOverview, 'variant'> {
  /** AnimatePresence hands the exiting element's ref through here. */
  ref?: Ref<HTMLDivElement>;
  onCollapse: () => void;
}

export interface ITeamOverviewDrawer extends Omit<ITeamOverview, 'variant'> {
  anchor: IToggleAnchor;
  /** Fires once the toggle has faded in, so focus can move to it. */
  onToggleShown: () => void;
}

export interface IPinnedList {
  pinned: IPinnedTurn[];
  onJump: (turnId: string) => void;
}
