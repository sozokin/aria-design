import { useState, type FC as ReactFC } from 'react';
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
 * The Chat history button and the sheet it opens: every chat so far, most recently asked first, in
 * a list that scrolls however many there are. On desktop the button sits in the right rail under
 * the date, with its label; on mobile it is in the dashboard menu. Choosing a chat closes the sheet
 * and switches the panel to it; focus returns to the button, which stays where it was.
 */
const ChatHistory: ReactFC<IChatHistory> = ({ chats, activeChatId, onSwitchChat, withLabel }) => {
  const [isOpen, setIsOpen] = useState(false);

  // Also for the chat that is already active: choosing it still brings the panel up on it.
  const choose = (chatId: string) => {
    setIsOpen(false);
    onSwitchChat(chatId);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {withLabel ? (
          // Negative margin: the label's right edge lines up with the date above, not the padding's.
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
        // The same data-[side] selector as the sheet's default width, so this one can override it.
        className="scrollbar-stable overflow-y-auto data-[side=right]:w-[min(22rem,88vw)]"
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
