import { Toaster as Sonner, type ToasterProps } from 'sonner';
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from 'lucide-react';

// The shell ships a light theme only, so the theme is fixed rather than read from next-themes.
// Toasts sit on a white dashboard over white cards, so they take the surface tone and the ring's
// blue as a border to stand apart from it, with the action in solid info; the text keeps the
// popover's dark foreground.
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
          // Important: sonner's own rule paints the action in the toast's text colour.
          actionButton: 'bg-info! text-white!',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
