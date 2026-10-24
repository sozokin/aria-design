export { cn } from 'cn';

/** "Marcus Bell" → "MB". */
export const getInitials = (name: string) =>
  name
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
