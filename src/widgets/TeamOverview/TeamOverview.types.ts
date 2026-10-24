import type { IPinnedTurn } from '@/types/assistant.types';

/** Where the overview is shown: the desktop right rail, or inline under the brief on mobile. */
export type TTeamOverviewVariant = 'rail' | 'inline';

export interface ITeamOverview {
  pinned: IPinnedTurn[];
  onJumpToPinned: (turnId: string) => void;
  variant?: TTeamOverviewVariant;
}

export interface IPinnedList {
  pinned: IPinnedTurn[];
  onJump: (turnId: string) => void;
}
