import { type FC as ReactFC } from 'react';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { IChatSummary } from '@/types/assistant.types';
import { IChatList } from './AssistantExperience.types';

const chatSubtitle = ({ turnCount, rep }: IChatSummary) =>
  `${turnCount === 1 ? '1 question' : `${turnCount} questions`}${rep ? ` · ${rep}` : ''}`;

/**
 * Every chat so far, most recently asked first, each a button that switches to it; the active one
 * is marked. Shared by the history sheet and the expanded panel's left pane.
 */
const ChatList: ReactFC<IChatList> = ({ chats, activeChatId, onSwitchChat }) => {
  if (chats.length === 0) {
    return (
      <p className="text-[0.8125rem] leading-snug text-text-secondary">
        Nothing asked yet. Chats are listed here once they have a question.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2" aria-label="Chats">
      {chats.map(chat => {
        const isActive = chat.id === activeChatId;
        return (
          <li key={chat.id}>
            <button
              type="button"
              onClick={() => onSwitchChat(chat.id)}
              aria-current={isActive ? 'true' : undefined}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50',
                isActive ? 'border-accent/30 bg-accent-muted' : 'border-border bg-secondary',
              )}
            >
              {/* An answer still arriving in this chat: the accent dot, glowing the way the
                  "Answer ready" pill does, so the chat can be found from the list. */}
              {chat.isAnswering && (
                <span className="relative flex size-1.5 shrink-0">
                  <span
                    className="absolute inset-0 rounded-full ring-2 ring-accent motion-safe:animate-ready-pulse"
                    aria-hidden="true"
                  />
                  <span
                    className="size-1.5 rounded-full bg-accent motion-safe:animate-pulse"
                    aria-hidden="true"
                  />
                  <span className="sr-only">Answer in progress. </span>
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[0.8125rem] font-semibold">{chat.title}</span>
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
  );
};

export default ChatList;
