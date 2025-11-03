import { useEffect, RefObject } from 'react';
import { useSwipeGesture } from '../hooks/useMobileGestures';

interface SwipeBackHandlerProps {
  containerRef: RefObject<HTMLElement>;
  onSwipeBack?: () => void;
  enabled?: boolean;
}

export default function SwipeBackHandler({
  containerRef,
  onSwipeBack,
  enabled = true,
}: SwipeBackHandlerProps) {
  useSwipeGesture(
    containerRef,
    {
      onSwipeRight: () => {
        if (enabled && onSwipeBack) {
          onSwipeBack();
        }
      },
    },
    100
  );

  return null;
}
