import { useRef, useState, type FC as ReactFC } from 'react';
import { motion } from 'motion/react';
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
import ChatHistory from '@/widgets/AssistantExperience/ChatHistory';
import TeamOverview from '.';

import { RAIL_TOGGLE_ID } from '@/hooks/useRailCollapse';
import { COLLAPSE_TRANSITION, EASE_OUT } from '@/lib/motion';
import { cn } from '@/lib/utils';

import { ITeamOverviewDrawer } from './TeamOverview.types';

// The ring starts just before the collapsing block lands on the toggle.
const RING_DELAY = COLLAPSE_TRANSITION.duration - 0.1;
const RING_DURATION = 0.5;

/**
 * The mobile dashboard menu: a toggle fixed beside the greeting that opens, in a sheet from the
 * right, what the desktop right rail shows: the date, chat history, the team overview and the
 * pinned answers. The inline team overview collapses into this toggle, and a ring pulses out as
 * the block lands to mark where it went.
 */
const TeamOverviewDrawer: ReactFC<ITeamOverviewDrawer> = ({
  anchor,
  surfaced,
  collapsed,
  pinned,
  onJumpToPinned,
  chats,
  activeChatId,
  onSwitchChat,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  // A pinned card chosen inside the sheet is jumped to once the sheet has closed.
  const pendingJump = useRef<string | null>(null);

  const pinnedCount = pinned.length;
  const toggleLabel =
    pinnedCount > 0
      ? `Open dashboard menu, ${pinnedCount} pinned ${pinnedCount === 1 ? 'answer' : 'answers'}`
      : 'Open dashboard menu';

  const jumpAfterClose = (turnId: string) => {
    pendingJump.current = turnId;
    setIsOpen(false);
  };

  // A chat chosen in the history sheet inside this one: both close, so the panel showing it is in view.
  const switchAndClose = (chatId: string) => {
    setIsOpen(false);
    onSwitchChat(chatId);
  };

  return (
    <div className="fixed z-[8] rounded-lg" style={{ top: anchor.top, right: anchor.right }}>
      {/* The ring that pulses out as the block lands. */}
      {collapsed && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-lg bg-accent-muted ring-[3px] ring-accent"
          initial={{ opacity: 0, scale: 1 }}
          // The scale is one segment, so its ease-out decelerates once and never stalls and restarts
          // (easing over several keyframes applies per segment). The opacity starts at 0, because a
          // keyframe array shows its first value during the delay, steps to 0.8 the moment the block
          // lands, then eases out to nothing.
          animate={{ opacity: [0, 0.8, 0], scale: 2.4 }}
          transition={{
            delay: RING_DELAY,
            duration: RING_DURATION,
            ease: EASE_OUT,
            opacity: {
              delay: RING_DELAY,
              duration: RING_DURATION,
              times: [0, 0.02, 1],
              ease: EASE_OUT,
            },
          }}
        />
      )}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            id={RAIL_TOGGLE_ID}
            type="button"
            variant="ghost"
            size="icon-sm"
            className={cn(
              'relative text-text-secondary transition-[background-color,box-shadow] duration-200',
              surfaced ? 'bg-popover shadow-sm ring-1 ring-border' : '',
            )}
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
            {/* The desktop rail's order: the date above, chat history under it, then the overview. */}
            <div className="-mt-2.5 flex justify-end">
              <ChatHistory
                chats={chats}
                activeChatId={activeChatId}
                onSwitchChat={switchAndClose}
                withLabel
              />
            </div>
            <TeamOverview pinned={pinned} onJumpToPinned={jumpAfterClose} variant="drawer" />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default TeamOverviewDrawer;
