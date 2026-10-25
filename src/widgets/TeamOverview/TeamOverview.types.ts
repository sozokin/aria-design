import type { Ref } from 'react';

import type { IPinnedTurn } from '@/types/assistant.types';
import type { IToggleAnchor } from '@/types/layout.types';
import type { IChatHistory } from '@/widgets/AssistantExperience/AssistantExperience.types';

/** Where the overview is shown: the desktop right rail, the mobile drawer, or inline under the brief. */
export type TTeamOverviewVariant = 'rail' | 'drawer' | 'inline';

/** Props for `TeamOverview`. */
export interface ITeamOverview {
  /** Cards pinned to the dashboard, for the Pinned block. */
  pinned: IPinnedTurn[];
  /** Scrolls to a pinned card and focuses it. */
  onJumpToPinned: (turnId: string) => void;
  /** Where it is shown. Defaults to the desktop rail. */
  variant?: TTeamOverviewVariant;
}

/** Props for `InlineTeamOverview`. */
export interface IInlineTeamOverview extends Omit<ITeamOverview, 'variant'> {
  /** Passed in by AnimatePresence, so it can animate the block as it leaves. */
  ref?: Ref<HTMLDivElement>;
  /** Collapses the block into the menu toggle. */
  onCollapse: () => void;
}

/** Props for `TeamOverviewDrawer`. */
export interface ITeamOverviewDrawer
  extends
    Omit<ITeamOverview, 'variant'>,
    Pick<IChatHistory, 'chats' | 'activeChatId' | 'onSwitchChat' | 'onChoiceClosed'> {
  /** Where the toggle is fixed on screen. */
  anchor: IToggleAnchor;
  /** True once the page has scrolled: the toggle gets a background so it shows over content. */
  surfaced: boolean;
  /** True once the inline overview has collapsed into the toggle; a ring pulses out to mark it. */
  collapsed: boolean;
}

/** Props for `PinnedList`. */
export interface IPinnedList {
  /** Cards pinned to the dashboard, newest first. */
  pinned: IPinnedTurn[];
  /** Jumps to a pinned card. */
  onJump: (turnId: string) => void;
}
