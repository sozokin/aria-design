import { useEffect, useRef, useState, type FC as ReactFC } from 'react';
import { PanelRightOpen } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import TeamOverview from '.';

import { ITeamOverviewDrawer } from './TeamOverview.types';

/** DOM id of the drawer toggle, so focus can move to it after the overview collapses. */
export const RAIL_TOGGLE_ID = 'rail-toggle';

/**
 * Where the team overview lives on mobile once it has collapsed: a toggle at the end of the
 * greeting row that opens the overview in a sheet from the right.
 */
const TeamOverviewDrawer: ReactFC<ITeamOverviewDrawer> = ({
  pinned,
  onJumpToPinned,
  onToggleShown,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  // A pinned card chosen inside the sheet is jumped to once the sheet has closed.
  const pendingJump = useRef<string | null>(null);

  const pinnedCount = pinned.length;
  const toggleLabel =
    pinnedCount > 0
      ? `Open team overview, ${pinnedCount} pinned ${pinnedCount === 1 ? 'answer' : 'answers'}`
      : 'Open team overview';

  useEffect(() => {
    onToggleShown();
    // Mount only: the toggle is shown once, when the overview collapses.
  }, []);

  const jumpAfterClose = (turnId: string) => {
    pendingJump.current = turnId;
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          id={RAIL_TOGGLE_ID}
          type="button"
          variant="ghost"
          size="icon-sm"
          className="relative shrink-0 text-text-secondary"
          aria-label={toggleLabel}
        >
          <PanelRightOpen aria-hidden="true" />
          {pinnedCount > 0 && (
            <span
              className="absolute top-1 right-1 size-1.5 rounded-full bg-accent"
              aria-hidden="true"
            />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        // The same data-[side] selector as the sheet's default width, so this one can override it.
        className="overflow-y-auto data-[side=right]:w-[min(22rem,88vw)]"
        aria-describedby={undefined}
        onCloseAutoFocus={event => {
          const turnId = pendingJump.current;
          if (!turnId) return;
          // Land on the card instead of back on the toggle.
          event.preventDefault();
          pendingJump.current = null;
          onJumpToPinned(turnId);
        }}
      >
        <SheetHeader className="pb-0">
          <SheetTitle className="sr-only">Dashboard</SheetTitle>
          <SheetDescription>Today · Friday, September 4</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-6 px-4 pb-6">
          <TeamOverview pinned={pinned} onJumpToPinned={jumpAfterClose} variant="drawer" />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default TeamOverviewDrawer;
