import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FC as ReactFC,
} from 'react';
import { createPortal } from 'react-dom';

import { IEntityPreview, IPreviewPosition } from './EntityPreview.types';

/** The smallest gap, in pixels, between the card and the edge of the screen. */
const VIEWPORT_GUTTER = 16;
/** The gap, in pixels, between the chip and the card. */
const PREVIEW_GAP = 8;

/**
 * A chip in the brief (a rep or a deal) that shows a small preview card on hover, focus or tap.
 *
 * The card is placed at the end of the page body (a portal), below the chip, or above it when
 * there is no room below. Escape or a click elsewhere closes it.
 */
const EntityPreview: ReactFC<IEntityPreview> = ({ id, label, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<IPreviewPosition>({ left: 0, top: 0, ready: false });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const previewRef = useRef<HTMLSpanElement>(null);
  /** Leaving the chip closes the card after a short wait, so the pointer can move onto the card. */
  const closeTimerRef = useRef<number | null>(null);

  /** Cancels a close that is waiting to happen. */
  const cancelClose = useCallback(() => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  /** Opens the card (it is measured and placed before it shows). */
  const openPreview = useCallback(() => {
    cancelClose();
    setPosition(current => ({ ...current, ready: false }));
    setIsOpen(true);
  }, [cancelClose]);

  /** Closes the card straight away. */
  const closePreview = useCallback(() => {
    cancelClose();
    setIsOpen(false);
  }, [cancelClose]);

  /** Closes the card after a short wait (cancelled if the pointer comes back). */
  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimerRef.current = window.setTimeout(() => setIsOpen(false), 100);
  }, [cancelClose]);

  /** Places the card below the chip, or above it if there is no room below. */
  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const preview = previewRef.current;
    if (!trigger || !preview) return;

    const triggerRect = trigger.getBoundingClientRect();
    const previewRect = preview.getBoundingClientRect();

    // Keep the card inside the screen, with a small gap on each side.
    const maxLeft = Math.max(
      VIEWPORT_GUTTER,
      window.innerWidth - previewRect.width - VIEWPORT_GUTTER,
    );
    const left = Math.min(Math.max(VIEWPORT_GUTTER, triggerRect.left), maxLeft);

    const fitsBelow =
      triggerRect.bottom + PREVIEW_GAP + previewRect.height <= window.innerHeight - VIEWPORT_GUTTER;
    const top = fitsBelow
      ? triggerRect.bottom + PREVIEW_GAP
      : Math.max(VIEWPORT_GUTTER, triggerRect.top - previewRect.height - PREVIEW_GAP);

    setPosition({ left, top, ready: true });
  }, []);

  // Place the card as soon as it renders, and keep it in place while the page scrolls or resizes.
  useLayoutEffect(() => {
    if (!isOpen) return;

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  // A tap or click anywhere else closes the card.
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      const insideTrigger = triggerRef.current?.contains(target);
      const insidePreview = previewRef.current?.contains(target);
      if (!insideTrigger && !insidePreview) closePreview();
    };

    document.addEventListener('pointerdown', handleOutsidePointer);
    return () => document.removeEventListener('pointerdown', handleOutsidePointer);
  }, [closePreview, isOpen]);

  // Cancel a waiting close when the chip unmounts.
  useEffect(() => () => cancelClose(), [cancelClose]);

  return (
    <span className="entity-preview" onPointerEnter={openPreview} onPointerLeave={scheduleClose}>
      <button
        ref={triggerRef}
        className="chip"
        type="button"
        aria-expanded={isOpen}
        aria-controls={id}
        onClick={() => setIsOpen(open => !open)}
        onFocus={openPreview}
        onBlur={scheduleClose}
        onKeyDown={event => {
          if (event.key === 'Escape') {
            event.preventDefault();
            closePreview();
          }
        }}
      >
        {label}
      </button>

      {isOpen &&
        createPortal(
          <span
            ref={previewRef}
            className="hover-card"
            id={id}
            role="tooltip"
            data-ready={position.ready}
            style={{ left: position.left, top: position.top }}
            onPointerEnter={cancelClose}
            onPointerLeave={scheduleClose}
          >
            {children}
          </span>,
          document.body,
        )}
    </span>
  );
};

export default EntityPreview;
