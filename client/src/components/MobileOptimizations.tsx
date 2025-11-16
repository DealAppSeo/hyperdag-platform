import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

// Mobile performance monitoring and optimization hooks
export function useMobilePerformance() {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    networkLatency: 0
  });

  useEffect(() => {
    // Monitor performance metrics
    const startTime = performance.now();
    
    // Measure initial load time
    window.addEventListener('load', () => {
      const loadTime = performance.now() - startTime;
      setPerformanceMetrics(prev => ({ ...prev, loadTime }));
    });

    // Monitor memory usage if available
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      setPerformanceMetrics(prev => ({
        ...prev,
        memoryUsage: memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit
      }));
    }

    // Network latency monitoring
    const measureNetworkLatency = async () => {
      const start = performance.now();
      try {
        await fetch('/api/health', { method: 'HEAD' });
        const latency = performance.now() - start;
        setPerformanceMetrics(prev => ({ ...prev, networkLatency: latency }));
      } catch (error) {
        console.warn('Network latency measurement failed:', error);
      }
    };

    measureNetworkLatency();
    const interval = setInterval(measureNetworkLatency, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return performanceMetrics;
}

// Lazy loading hook for images and components
export function useLazyLoading(threshold = 0.1) {
  const [isVisible, setIsVisible] = useState(false);
  const [ref, setRef] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return [setRef, isVisible] as const;
}

// Connection quality detection
export function useConnectionQuality() {
  const [connectionQuality, setConnectionQuality] = useState<'high' | 'medium' | 'low'>('high');

  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const updateConnectionQuality = () => {
        const effectiveType = connection.effectiveType;
        switch (effectiveType) {
          case '4g':
            setConnectionQuality('high');
            break;
          case '3g':
            setConnectionQuality('medium');
            break;
          case '2g':
          case 'slow-2g':
            setConnectionQuality('low');
            break;
          default:
            setConnectionQuality('medium');
        }
      };

      updateConnectionQuality();
      connection.addEventListener('change', updateConnectionQuality);
      
      return () => {
        connection.removeEventListener('change', updateConnectionQuality);
      };
    }
  }, []);

  return connectionQuality;
}

// Data prefetching for improved performance
export function usePrefetch() {
  const connectionQuality = useConnectionQuality();

  const prefetchData = useMemo(() => {
    if (connectionQuality === 'low') return false;
    return true;
  }, [connectionQuality]);

  const prefetchQuery = useQuery({
    queryKey: ['/api/user/stats'],
    enabled: prefetchData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  return { prefetchData, isPrefetching: prefetchQuery.isFetching };
}

// Mobile-optimized image component
export function OptimizedImage({ 
  src, 
  alt, 
  className,
  priority = false 
}: { 
  src: string; 
  alt: string; 
  className?: string;
  priority?: boolean;
}) {
  const [imageRef, isVisible] = useLazyLoading();
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const connectionQuality = useConnectionQuality();

  // Determine image quality based on connection
  const optimizedSrc = useMemo(() => {
    if (connectionQuality === 'low') {
      // Serve lower quality images for slow connections
      return src.replace(/\.(jpg|jpeg|png)$/i, '_low.$1');
    }
    return src;
  }, [src, connectionQuality]);

  const shouldLoad = priority || isVisible;

  return (
    <div 
      ref={imageRef as any} 
      className={`relative overflow-hidden ${className}`}
    >
      {shouldLoad && (
        <img
          src={optimizedSrc}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setError(true)}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}
      {!isLoaded && !error && shouldLoad && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      {error && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
          Failed to load image
        </div>
      )}
    </div>
  );
}

// Mobile performance wrapper component
export function MobilePerformanceWrapper({ children }: { children: React.ReactNode }) {
  const metrics = useMobilePerformance();
  const connectionQuality = useConnectionQuality();

  // Apply performance optimizations based on device capabilities
  useEffect(() => {
    // Reduce animations for low-end devices
    if (connectionQuality === 'low' || metrics.memoryUsage > 0.8) {
      document.documentElement.style.setProperty('--animation-duration', '0.1s');
    }

    // Optimize rendering for mobile
    if (window.innerWidth < 768) {
      document.documentElement.style.setProperty('--mobile-optimization', 'true');
    }
  }, [connectionQuality, metrics.memoryUsage]);

  return (
    <div data-connection-quality={connectionQuality}>
      {children}
      
      {/* Performance monitoring in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-50">
          <div>Load: {metrics.loadTime.toFixed(0)}ms</div>
          <div>Memory: {(metrics.memoryUsage * 100).toFixed(1)}%</div>
          <div>Network: {metrics.networkLatency.toFixed(0)}ms</div>
          <div>Quality: {connectionQuality}</div>
        </div>
      )}
    </div>
  );
}