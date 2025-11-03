import { useEffect, useRef, RefObject } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface PullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  maxPullDistance?: number;
  enabled?: boolean;
}

export function useSwipeGesture(
  elementRef: RefObject<HTMLElement>,
  handlers: SwipeHandlers,
  threshold: number = 50
) {
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX;
      touchEndY = e.changedTouches[0].screenY;
      handleSwipe();
    };

    const handleSwipe = () => {
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;
      const absDiffX = Math.abs(diffX);
      const absDiffY = Math.abs(diffY);

      if (absDiffX > threshold || absDiffY > threshold) {
        if (absDiffX > absDiffY) {
          if (diffX > 0) {
            handlers.onSwipeRight?.();
          } else {
            handlers.onSwipeLeft?.();
          }
        } else {
          if (diffY > 0) {
            handlers.onSwipeDown?.();
          } else {
            handlers.onSwipeUp?.();
          }
        }
      }
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, handlers, threshold]);
}

export function usePullToRefresh(
  scrollContainerRef: RefObject<HTMLElement>,
  options: PullToRefreshOptions
) {
  const { onRefresh, threshold = 80, maxPullDistance = 120, enabled = true } = options;
  const pullStartY = useRef(0);
  const currentPullDistance = useRef(0);
  const isRefreshing = useRef(false);
  const pullIndicatorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const createPullIndicator = () => {
      if (pullIndicatorRef.current) return pullIndicatorRef.current;

      const indicator = document.createElement('div');
      indicator.style.cssText = `
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%) translateY(-100%);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(245, 158, 11, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.2s ease-out;
        z-index: 1000;
        pointer-events: none;
      `;
      indicator.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <polyline points="17 1 21 5 17 9"></polyline>
          <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
        </svg>
      `;
      scrollContainer.style.position = 'relative';
      scrollContainer.appendChild(indicator);
      pullIndicatorRef.current = indicator;
      return indicator;
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (scrollContainer.scrollTop === 0 && !isRefreshing.current) {
        pullStartY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isRefreshing.current || scrollContainer.scrollTop > 0) return;

      const touchY = e.touches[0].clientY;
      const pullDistance = Math.min(
        Math.max(0, touchY - pullStartY.current),
        maxPullDistance
      );

      if (pullDistance > 0) {
        currentPullDistance.current = pullDistance;
        const indicator = createPullIndicator();
        const progress = Math.min(pullDistance / threshold, 1);
        indicator.style.transform = `translateX(-50%) translateY(${pullDistance - 40}px) rotate(${progress * 360}deg)`;
        indicator.style.opacity = String(progress);

        if (pullDistance > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      const indicator = pullIndicatorRef.current;

      if (currentPullDistance.current >= threshold && !isRefreshing.current) {
        isRefreshing.current = true;

        if (indicator) {
          indicator.style.transform = `translateX(-50%) translateY(20px)`;
        }

        try {
          await onRefresh();
        } finally {
          if (indicator) {
            indicator.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
            indicator.style.transform = 'translateX(-50%) translateY(-100%)';
            indicator.style.opacity = '0';

            setTimeout(() => {
              if (indicator && indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
                pullIndicatorRef.current = null;
              }
            }, 300);
          }
          isRefreshing.current = false;
        }
      } else if (indicator) {
        indicator.style.transform = 'translateX(-50%) translateY(-100%)';
        indicator.style.opacity = '0';
        setTimeout(() => {
          if (indicator && indicator.parentNode) {
            indicator.parentNode.removeChild(indicator);
            pullIndicatorRef.current = null;
          }
        }, 200);
      }

      currentPullDistance.current = 0;
      pullStartY.current = 0;
    };

    scrollContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
    scrollContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    scrollContainer.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      scrollContainer.removeEventListener('touchstart', handleTouchStart);
      scrollContainer.removeEventListener('touchmove', handleTouchMove);
      scrollContainer.removeEventListener('touchend', handleTouchEnd);

      if (pullIndicatorRef.current && pullIndicatorRef.current.parentNode) {
        pullIndicatorRef.current.parentNode.removeChild(pullIndicatorRef.current);
        pullIndicatorRef.current = null;
      }
    };
  }, [scrollContainerRef, onRefresh, threshold, maxPullDistance, enabled]);
}

export function useLongPress(
  callback: () => void,
  duration: number = 500
) {
  const timerRef = useRef<NodeJS.Timeout>();
  const isLongPress = useRef(false);

  const start = () => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      callback();

      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }, duration);
  };

  const clear = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
  };

  return {
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: clear,
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
  };
}
