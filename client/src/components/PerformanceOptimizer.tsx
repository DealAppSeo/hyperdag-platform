import React, { useEffect } from 'react';
import { preloadResource, performanceMonitor } from '@/utils/performance';

export const PerformanceOptimizer: React.FC = () => {
  useEffect(() => {
    performanceMonitor.markStart('app-initialization');
    
    // Preload critical resources
    const criticalResources = [
      { href: '/api/user/stats', as: 'fetch' },
      { href: '/api/auth/verify', as: 'fetch' }
    ];
    
    criticalResources.forEach(({ href, as }) => {
      preloadResource(href, as);
    });
    
    // DNS prefetch for external services
    const externalDomains = [
      'fonts.googleapis.com',
      'fonts.gstatic.com'
    ];
    
    externalDomains.forEach(domain => {
      const link = document.createElement('link');
      link.rel = 'dns-prefetch';
      link.href = `//${domain}`;
      document.head.appendChild(link);
    });
    
    // Enable service worker for caching
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Service worker registration failed, continue without it
      });
    }
    
    performanceMonitor.markEnd('app-initialization');
  }, []);
  
  return null;
};