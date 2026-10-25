import { useRef, useState, type FC as ReactFC } from 'react';
import { History } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import ChatList from './ChatList';

import { IChatHistory } from './AssistantExperience.types';

/**
 * The "Chat history" button and the side sheet it opens, listing every chat (newest first).
 *
 * - Desktop: the button sits in the right rail, under the date, with its label.
 * - Mobile: it sits in the dashboard menu.
 *
 * Picking a chat closes the sheet and opens that chat in the panel. Focus then goes to the panel
 * (through `onChoiceClosed`). If the sheet is closed without a pick, focus goes back to the button.
 */
const ChatHistory: ReactFC<IChatHistory> = ({
  chats,
  activeChatId,
  onSwitchChat,
  onChoiceClosed,
  withLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  /** True when a chat was picked, so closing hands focus to the panel instead of the button. */
  const hasChosen = useRef(false);

  /** Opens the picked chat, even if it is already the active one, and closes the sheet. */
  const choose = (chatId: string) => {
    hasChosen.current = true;
    setIsOpen(false);
    onSwitchChat(chatId);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {withLabel ? (
          // The negative margin lines the label's right edge up with the date above it.
          <Button type="button" variant="ghost" size="sm" className="-mr-2.5 text-text-secondary">
            <History data-icon="inline-start" aria-hidden="true" />
            Chat history
          </Button>
        ) : (
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Chat history">
            <History aria-hidden="true" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="right"
        // Uses the same data-[side] selector as the sheet's default width, so it can override it.
        className="scrollbar-stable overflow-y-auto data-[side=right]:w-[min(22rem,88vw)]"
        onCloseAutoFocus={event => {
          if (!hasChosen.current) return;
          hasChosen.current = false;
          event.preventDefault();
          onChoiceClosed?.();
        }}
      >
        <SheetHeader className="pb-0">
          <SheetTitle>Chat history</SheetTitle>
          <SheetDescription>
            {chats.length === 1 ? '1 chat' : `${chats.length} chats`} · most recent first
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          <ChatList chats={chats} activeChatId={activeChatId} onSwitchChat={choose} />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChatHistory;
