/** Where the overview is shown: the desktop right rail, or inline under the brief on mobile. */
export type TTeamOverviewVariant = 'rail' | 'inline';

export interface ITeamOverview {
  variant?: TTeamOverviewVariant;
}
