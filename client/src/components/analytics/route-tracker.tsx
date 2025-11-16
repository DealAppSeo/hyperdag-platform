import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import analytics from '@/lib/analytics';

/**
 * RouteTracker component
 * This component tracks page views when the route changes by integrating with wouter's useLocation
 */
export const RouteTracker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location] = useLocation();

  useEffect(() => {
    // Only track page views on the client side
    if (typeof window !== 'undefined') {
      const title = document.title;
      analytics.trackPageView({ path: location, title });
    }
  }, [location]);

  return <>{children}</>;
};