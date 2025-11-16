import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

export interface DeepLinkConfig {
  showSidebar: boolean;
  isDirectAccess: boolean;
  referrer: string | null;
}

export function useDeepLink(): DeepLinkConfig {
  const [location] = useLocation();
  const [config, setConfig] = useState<DeepLinkConfig>({
    showSidebar: false,
    isDirectAccess: true,
    referrer: null
  });

  useEffect(() => {
    // Check if user came from within the app or externally
    const referrer = document.referrer;
    const currentHost = window.location.host;
    const isDirectAccess = !referrer || !referrer.includes(currentHost);
    
    // Check if there's a navigation state indicating internal navigation
    const hasInternalState = window.history.state?.internal === true;
    
    // Check for URL parameters that indicate how the page should be displayed
    const urlParams = new URLSearchParams(window.location.search);
    const embedMode = urlParams.get('embed') === 'true';
    const standaloneMode = urlParams.get('standalone') === 'true';
    
    // Determine if sidebar should be shown
    let showSidebar = false;
    
    if (embedMode || standaloneMode) {
      // Explicitly requested to hide sidebar
      showSidebar = false;
    } else if (hasInternalState) {
      // User navigated from within the app
      showSidebar = true;
    } else if (!isDirectAccess) {
      // User came from the same domain
      showSidebar = true;
    } else {
      // Direct access or external link - always show standalone nav for public routes
      showSidebar = false;
    }

    setConfig({
      showSidebar,
      isDirectAccess,
      referrer
    });
  }, [location]);

  return config;
}

// Helper function to navigate with internal state
export function navigateInternal(path: string) {
  window.history.pushState({ internal: true }, '', path);
  // Trigger a popstate event to update wouter
  window.dispatchEvent(new PopStateEvent('popstate'));
}

// Hook to track if user is authenticated for conditional navigation
export function useConditionalNavigation() {
  const deepLink = useDeepLink();
  
  // Always show layout for authenticated users, regardless of access method
  return {
    ...deepLink,
    shouldShowLayout: true // Always show sidebar for authenticated users
  };
}