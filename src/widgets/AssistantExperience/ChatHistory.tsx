import { useState, type FC as ReactFC } from 'react';
import { Check, History } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

import { cn } from '@/lib/utils';

import { IChatHistory } from './AssistantExperience.types';

const chatSubtitle = ({ turnCount, rep }: IChatHistory['chats'][number]) =>
  `${turnCount === 1 ? '1 question' : `${turnCount} questions`}${rep ? ` · ${rep}` : ''}`;

/**
 * The Chat history button and the sheet it opens: every chat so far, most recently asked first, in
 * a list that scrolls however many there are. On desktop the button sits in the right rail under
 * the date, with its label; on mobile it is the icon in the panel header. Choosing a chat closes the
 * sheet and switches the panel to it; focus returns to the button, which stays where it was.
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
        className="overflow-y-auto data-[side=right]:w-[min(22rem,88vw)]"
      >
        <SheetHeader className="pb-0">
          <SheetTitle>Chat history</SheetTitle>
          <SheetDescription>
            {chats.length === 1 ? '1 chat' : `${chats.length} chats`} · most recent first
          </SheetDescription>
        </SheetHeader>
        {chats.length > 0 ? (
          <ul className="flex flex-col gap-2 px-4 pb-6" aria-label="Chats">
            {chats.map(chat => {
              const isActive = chat.id === activeChatId;
              return (
                <li key={chat.id}>
                  <button
                    type="button"
                    onClick={() => choose(chat.id)}
                    aria-current={isActive ? 'true' : undefined}
                    className={cn(
                      'flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
                      isActive ? 'border-accent/30 bg-accent-muted' : 'border-border bg-secondary',
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.8125rem] font-semibold">
                        {chat.title}
                      </span>
                      <span className="block truncate text-xs text-text-secondary">
                        {chatSubtitle(chat)}
                      </span>
                    </span>
                    {isActive && (
                      <Check
                        className="size-4 shrink-0 text-accent-muted-foreground"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-4 text-[0.8125rem] leading-snug text-text-secondary">
            Nothing asked yet. Chats are listed here once they have a question.
          </p>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default ChatHistory;
