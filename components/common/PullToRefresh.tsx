import React, { useState, useRef, useEffect } from 'react';

interface PullToRefreshProps {
    onRefresh: () => Promise<void>;
    children: React.ReactNode;
    className?: string;
    refreshing?: boolean;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({ onRefresh, children, className = '', refreshing: externalRefreshing }) => {
    const [pullStartPoint, setPullStartPoint] = useState<number | null>(null);
    const [pullDistance, setPullDistance] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Threshold to trigger refresh
    const PULL_THRESHOLD = 80;
    // Maximum distance visual pull
    const MAX_PULL = 150;

    const isInternalRefreshing = useRef(false);

    useEffect(() => {
        if (externalRefreshing !== undefined) {
            setIsRefreshing(externalRefreshing);
        }
    }, [externalRefreshing]);

    const handleTouchStart = (e: React.TouchEvent) => {
        // Only allow pulling if we are at the very top of the scroll container
        if (containerRef.current && containerRef.current.scrollTop <= 0 && !isRefreshing) {
            setPullStartPoint(e.targetTouches[0].clientY);
        } else {
            setPullStartPoint(null);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (pullStartPoint === null || isRefreshing) return;

        const currentPoint = e.targetTouches[0].clientY;
        const diff = currentPoint - pullStartPoint;

        // Only allow pulling down
        if (diff > 0) {
            // Add resistance/damping as we pull further
            const newDistance = Math.min(diff * 0.5, MAX_PULL);

            // If dragging down while at top, prevent default to stop native browser refresh if any
            if (e.cancelable && diff > 5) {
                // e.preventDefault(); // Note: treating passive listeners usually prevents this
            }

            setPullDistance(newDistance);
        }
    };

    const handleTouchEnd = async () => {
        if (pullStartPoint === null || isRefreshing) return;

        if (pullDistance >= PULL_THRESHOLD) {
            setIsRefreshing(true);
            isInternalRefreshing.current = true;
            setPullDistance(PULL_THRESHOLD); // Snap to threshold

            try {
                await onRefresh();
            } finally {
                setTimeout(() => {
                    setIsRefreshing(false);
                    isInternalRefreshing.current = false;
                    setPullDistance(0);
                }, 500); // Small delay to finish animation
            }
        } else {
            // Spring back
            setPullDistance(0);
        }
        setPullStartPoint(null);
    };

    // Elastic effect style - Content remains fixed as per request
    const contentStyle: React.CSSProperties = {
        // transform: `translateY(${pullDistance}px)`, // Removed to keep page fixed
        transition: 'none',
    };

    return (
        <div
            ref={containerRef}
            className={`relative overflow-y-auto h-full ${className}`}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Refresh Indicator */}
            <div
                className="absolute left-0 right-0 top-0 flex justify-center items-center pointer-events-none z-10"
                style={{
                    height: PULL_THRESHOLD,
                    transform: `translateY(${pullDistance - PULL_THRESHOLD}px)`,
                    transition: pullStartPoint === null ? 'transform 0.3s cubic-bezier(0.25, 0.8, 0.5, 1)' : 'none',
                    opacity: Math.min(pullDistance / (PULL_THRESHOLD * 0.8), 1)
                }}
            >
                <div className={`rounded-full bg-[#252525] border border-gray-700 p-2 shadow-lg flex items-center justify-center ${isRefreshing ? 'animate-spin-slow' : ''}`}>
                    {/* Custom Red/White Spinner/Icon */}
                    {isRefreshing ? (
                        <svg className="w-6 h-6 text-red-600 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : (
                        <svg className="w-6 h-6 text-red-600" style={{ transform: `rotate(${pullDistance * 2}deg)` }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    )}
                </div>
            </div>

            {/* Content */}
            <div style={contentStyle}>
                {children}
            </div>
        </div>
    );
};

export default PullToRefresh;
