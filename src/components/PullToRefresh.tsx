import { ReactNode, useRef } from 'react';
import { usePullToRefresh } from '../hooks/useMobileGestures';

interface PullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
  enabled?: boolean;
  threshold?: number;
  className?: string;
}

export default function PullToRefresh({
  onRefresh,
  children,
  enabled = true,
  threshold = 80,
  className = '',
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  usePullToRefresh(containerRef, {
    onRefresh,
    threshold,
    enabled,
  });

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto h-full ${className}`}
      style={{
        WebkitOverflowScrolling: 'touch',
        overscrollBehavior: 'contain',
      }}
    >
      {children}
    </div>
  );
}
