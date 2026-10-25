export { cn } from 'cn';

/**
 * Turns a name into up to two capital initials, for avatars.
 *
 * @example getInitials('Marcus Bell') // "MB"
 * @param name - A full name.
 * @returns The initials.
 */
export const getInitials = (name: string) =>
  name
    .split(' ')
    .map(word => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
