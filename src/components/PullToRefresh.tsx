import { useState, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

const PULL_THRESHOLD = 80; // pixels needed to trigger refresh
const MAX_PULL = 120; // maximum pull distance

/**
 * PullToRefresh Component
 * Wraps content and enables pull-to-refresh on touch devices
 */
export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const { t } = useTranslation();
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only enable pull-to-refresh when at the top of the page
    if (window.scrollY > 0 || isRefreshing) return;

    startYRef.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    currentYRef.current = e.touches[0].clientY;
    const diff = currentYRef.current - startYRef.current;

    // Only allow pulling down (positive diff) and when at top of page
    if (diff > 0 && window.scrollY === 0) {
      // Apply resistance to make the pull feel natural
      const resistance = 0.5;
      const newPullDistance = Math.min(diff * resistance, MAX_PULL);
      setPullDistance(newPullDistance);

      // Prevent default scroll behavior when pulling
      if (newPullDistance > 10) {
        e.preventDefault();
      }
    }
  }, [isPulling, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(PULL_THRESHOLD); // Hold at threshold during refresh

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, pullDistance, isRefreshing, onRefresh]);

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const shouldTrigger = pullDistance >= PULL_THRESHOLD;

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative"
    >
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center overflow-hidden transition-all duration-200 ease-out"
        style={{
          height: pullDistance > 0 || isRefreshing ? `${Math.max(pullDistance, isRefreshing ? PULL_THRESHOLD : 0)}px` : '0px',
          top: 0,
          zIndex: 10,
        }}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <div
            className={`transition-transform duration-200 ${isRefreshing ? 'animate-spin' : ''}`}
            style={{
              transform: isRefreshing ? 'rotate(0deg)' : `rotate(${progress * 180}deg)`,
              opacity: Math.max(progress, isRefreshing ? 1 : 0),
            }}
          >
            <RefreshCw
              size={24}
              className={`${shouldTrigger || isRefreshing ? 'text-indigo-600' : 'text-slate-400'}`}
            />
          </div>
          <span
            className={`text-xs font-medium transition-opacity duration-200 ${
              progress > 0.3 || isRefreshing ? 'opacity-100' : 'opacity-0'
            } ${shouldTrigger || isRefreshing ? 'text-indigo-600' : 'text-slate-500'}`}
          >
            {isRefreshing
              ? t('pullToRefresh.refreshing')
              : shouldTrigger
              ? t('pullToRefresh.release')
              : t('pullToRefresh.pull')}
          </span>
        </div>
      </div>

      {/* Content container */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: pullDistance > 0 || isRefreshing
            ? `translateY(${Math.max(pullDistance, isRefreshing ? PULL_THRESHOLD : 0)}px)`
            : 'translateY(0)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
