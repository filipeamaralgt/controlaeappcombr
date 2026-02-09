import { useRef, useState, useCallback, ReactNode } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface SwipeableRowProps {
  children: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
}

const ACTION_WIDTH = 72;
const TOTAL_ACTIONS_WIDTH = ACTION_WIDTH * 2;
const SWIPE_THRESHOLD = 40;

export function SwipeableRow({ children, onEdit, onDelete }: SwipeableRowProps) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const isSwipingHorizontally = useRef<boolean | null>(null);
  const [offset, setOffset] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  const animateTo = useCallback((target: number) => {
    setTransitioning(true);
    setOffset(target);
    setIsOpen(target !== 0);
    setTimeout(() => setTransitioning(false), 250);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (transitioning) return;
    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    currentX.current = isOpen ? -TOTAL_ACTIONS_WIDTH : 0;
    isSwipingHorizontally.current = null;
  }, [isOpen, transitioning]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (transitioning) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX.current;
    const deltaY = touch.clientY - startY.current;

    // Determine swipe direction on first significant movement
    if (isSwipingHorizontally.current === null) {
      if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
        isSwipingHorizontally.current = Math.abs(deltaX) > Math.abs(deltaY);
      }
      return;
    }

    if (!isSwipingHorizontally.current) return;

    // Prevent vertical scroll while swiping horizontally
    e.preventDefault();

    const newOffset = currentX.current + deltaX;
    // Clamp: don't go right past 0, don't go left past total actions width
    const clamped = Math.max(-TOTAL_ACTIONS_WIDTH, Math.min(0, newOffset));
    setOffset(clamped);
  }, [transitioning]);

  const handleTouchEnd = useCallback(() => {
    if (isSwipingHorizontally.current === false) return;
    if (transitioning) return;

    if (isOpen) {
      // If already open, check if user swiped back
      if (offset > -TOTAL_ACTIONS_WIDTH + SWIPE_THRESHOLD) {
        animateTo(0);
      } else {
        animateTo(-TOTAL_ACTIONS_WIDTH);
      }
    } else {
      // If closed, check if user swiped enough to open
      if (offset < -SWIPE_THRESHOLD) {
        animateTo(-TOTAL_ACTIONS_WIDTH);
      } else {
        animateTo(0);
      }
    }
  }, [offset, isOpen, transitioning, animateTo]);

  const handleActionClick = useCallback((action: 'edit' | 'delete') => {
    animateTo(0);
    // Small delay for visual feedback
    setTimeout(() => {
      if (action === 'edit') onEdit?.();
      if (action === 'delete') onDelete?.();
    }, 200);
  }, [animateTo, onEdit, onDelete]);

  // Desktop: no swipe, just render children
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-xl">
      {/* Action buttons behind the content */}
      <div className="absolute inset-y-0 right-0 flex">
        <button
          onClick={() => handleActionClick('edit')}
          className="flex w-[72px] items-center justify-center bg-primary text-primary-foreground"
          aria-label="Editar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>
          </svg>
        </button>
        <button
          onClick={() => handleActionClick('delete')}
          className="flex w-[72px] items-center justify-center bg-destructive text-destructive-foreground"
          aria-label="Excluir"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
          </svg>
        </button>
      </div>

      {/* Swipeable content */}
      <div
        className="relative z-10 bg-card"
        style={{
          transform: `translateX(${offset}px)`,
          transition: transitioning ? 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
