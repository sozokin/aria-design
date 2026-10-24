import type { Ref } from 'react';

import type { IPinnedTurn } from '@/types/assistant.types';
import type { IToggleAnchor } from '@/types/layout.types';
import type { IChatHistory } from '@/widgets/AssistantExperience/AssistantExperience.types';

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

export interface ITeamOverviewDrawer
  extends
    Omit<ITeamOverview, 'variant'>,
    Pick<IChatHistory, 'chats' | 'activeChatId' | 'onSwitchChat'> {
  anchor: IToggleAnchor;
  /** The page has scrolled, so content passes under the toggle and it needs a surface. */
  surfaced: boolean;
  /** The inline overview has collapsed into the toggle; a ring pulses out to mark where it went. */
  collapsed: boolean;
}

export interface IPinnedList {
  pinned: IPinnedTurn[];
  onJump: (turnId: string) => void;
}
