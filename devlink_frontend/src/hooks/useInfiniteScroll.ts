import { useEffect, useRef } from 'react';

interface UseInfiniteScrollOptions {
    onLoadMore: () => void;
    hasMore: boolean;
    isLoading: boolean;
    threshold?: number;
}

export function useInfiniteScroll({
    onLoadMore,
    hasMore,
    isLoading,
    threshold = 0.1,
}: UseInfiniteScrollOptions) {
    const triggerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!triggerRef.current || !hasMore || isLoading) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    onLoadMore();
                }
            },
            { threshold }
        );

        observer.observe(triggerRef.current);

        return () => {
            observer.disconnect();
        };
    }, [hasMore, isLoading, onLoadMore, threshold]);

    return triggerRef;
}
