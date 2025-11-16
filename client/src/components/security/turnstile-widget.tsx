import React, { useEffect } from 'react';

// Add TypeScript definitions for Turnstile
declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact';
          language?: string;
          tabindex?: number;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: (error: string) => void;
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: (error: string) => void;
  onExpire?: () => void;
  siteKey?: string;
  theme?: 'light' | 'dark' | 'auto';
  size?: 'normal' | 'compact';
  language?: string;
  tabIndex?: number;
}

// TEMPORARILY DISABLED: Cloudflare Turnstile Widget
// This is a temporary mock implementation until Cloudflare setup is completed
const TurnstileWidget: React.FC<TurnstileWidgetProps> = ({
  onVerify,
}) => {
  // Auto-verify on component mount with a mock token - only once per mount
  useEffect(() => {
    console.log('Using temporary mock Turnstile widget');
    // Automatically provide a mock token that will be accepted by the backend
    // The backend verification will be temporarily disabled as well
    const mockToken = 'temporary-mock-token-until-cloudflare-setup-complete';
    
    // Call onVerify only once when the component mounts
    onVerify(mockToken);
    
    // Toast notification removed to avoid distracting users
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="cf-turnstile-mock mt-4 mb-2 p-3 border border-dashed rounded-md bg-muted/50">
      <p className="text-sm text-muted-foreground">
        Human verification is temporarily disabled while Cloudflare setup is being completed.
      </p>
    </div>
  );
};

export default TurnstileWidget;