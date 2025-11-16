import { useEffect } from 'react';

/**
 * Preload critical resources to improve page loading performance
 */
export const usePreload = () => {
  useEffect(() => {
    // Preload critical CSS and font resources
    const criticalResources = [
      '/assets/fonts/inter.woff2',
      '/assets/images/logo.svg'
    ];

    criticalResources.forEach(resource => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = resource;
      link.as = resource.includes('.woff2') ? 'font' : 'image';
      if (resource.includes('.woff2')) {
        link.crossOrigin = 'anonymous';
      }
      document.head.appendChild(link);
    });

    // Preload critical API endpoints
    const criticalEndpoints = [
      '/api/user/stats',
      '/api/auth/verify'
    ];

    criticalEndpoints.forEach(endpoint => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = endpoint;
      document.head.appendChild(link);
    });
  }, []);
};

/**
 * Prefetch route components for faster navigation
 */
export const usePrefetchRoutes = (routes: string[]) => {
  useEffect(() => {
    const prefetchRoutes = () => {
      routes.forEach(route => {
        // Dynamically import route components to prefetch them
        import(`@/pages/${route}`).catch(() => {
          // Silently fail if route doesn't exist
        });
      });
    };

    // Prefetch after initial load
    const timer = setTimeout(prefetchRoutes, 2000);
    return () => clearTimeout(timer);
  }, [routes]);
};