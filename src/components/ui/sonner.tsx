import { Toaster as Sonner, type ToasterProps } from 'sonner';
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from 'lucide-react';

/**
 * The app's toasts (sonner), styled to match the app.
 *
 * - Light theme only, because the app has no dark theme.
 * - Toasts appear over a white dashboard with white cards, so they use the grey surface colour
 *   with a blue border to stand out. The action button (Undo) is solid blue; the text stays dark.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--surface)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--ring)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'cn-toast',
          // `!` (important) is needed: sonner's own style would otherwise colour the button like the text.
          actionButton: 'bg-info! text-white!',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
