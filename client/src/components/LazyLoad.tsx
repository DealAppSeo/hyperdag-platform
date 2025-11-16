import React, { useEffect, useRef, useState, lazy as reactLazy } from 'react';
import { Loader2 } from 'lucide-react';

// Re-export React's lazy function for code splitting
export const lazy = reactLazy;

interface LazyLoadProps {
  children: React.ReactNode;
  onLoadMore: () => void;
  hasMore: boolean;
  loadingText?: string;
  endMessage?: string;
  threshold?: number;
  className?: string;
  loadingClassName?: string;
  endMessageClassName?: string;
  disabled?: boolean;
}

/**
 * A component that implements infinite scrolling by detecting when the user
 * scrolls near the bottom of the content and triggering a callback to load more items.
 */
export const LazyLoad: React.FC<LazyLoadProps> = ({
  children,
  onLoadMore,
  hasMore,
  loadingText = 'Loading more items...',
  endMessage = 'No more items to load',
  threshold = 200, // pixels from bottom to trigger loading
  className = '',
  loadingClassName = 'text-muted-foreground text-sm flex items-center justify-center gap-2 py-4',
  endMessageClassName = 'text-muted-foreground text-sm text-center py-4',
  disabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loading && !disabled) {
          setLoading(true);
          
          // Call the load more function
          Promise.resolve(onLoadMore()).finally(() => {
            setLoading(false);
          });
        }
      },
      {
        root: null, // Use viewport as root
        rootMargin: `0px 0px ${threshold}px 0px`, // Bottom margin to trigger earlier
        threshold: 0.1, // Trigger when 10% of the element is visible
      }
    );
    
    const currentRef = loaderRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }
    
    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, loading, onLoadMore, threshold, disabled]);
  
  return (
    <div className={className} ref={scrollContainerRef}>
      {children}
      
      <div ref={loaderRef}>
        {loading && (
          <div className={loadingClassName}>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{loadingText}</span>
          </div>
        )}
        
        {!hasMore && !loading && (
          <div className={endMessageClassName}>
            {endMessage}
          </div>
        )}
      </div>
    </div>
  );
};

export default LazyLoad;