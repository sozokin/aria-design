import { type FC as ReactFC } from 'react';
import { PanelRightClose } from 'lucide-react';

import { Button } from '@/components/ui/button';
import TeamOverview from '.';

import { IInlineTeamOverview } from './TeamOverview.types';

/**
 * The team overview as it first appears on mobile: inline under the brief, with a Collapse button
 * that moves it into the drawer beside the greeting and gives the brief the room.
 */
const InlineTeamOverview: ReactFC<IInlineTeamOverview> = ({
  pinned,
  onJumpToPinned,
  onCollapse,
}) => (
  <div className="mt-8">
    <section
      aria-label="Team overview and pinned answers"
      className="flex flex-col gap-5 overflow-hidden rounded-2xl border border-border bg-card p-4 shadow-xs"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[0.8125rem] font-semibold text-tertiary-foreground">Team overview</h2>
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className="-mr-1.5 text-text-secondary"
          onClick={onCollapse}
        >
          <PanelRightClose data-icon="inline-start" aria-hidden="true" />
          Collapse
          <span className="sr-only"> into the side menu</span>
        </Button>
      </div>
      <TeamOverview pinned={pinned} onJumpToPinned={onJumpToPinned} variant="inline" />
    </section>
  </div>
);

export default InlineTeamOverview;
