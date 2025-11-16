import React, { ReactNode } from 'react';
import { Layout } from './layout';
import { useConditionalNavigation } from '@/hooks/use-deep-link';

interface PageWrapperProps {
  children: ReactNode;
  forceStandalone?: boolean;
  allowDeepLink?: boolean;
}

export function PageWrapper({ children, forceStandalone = false, allowDeepLink = true }: PageWrapperProps) {
  const { shouldShowLayout } = useConditionalNavigation();
  
  // If deep linking is disabled, always use layout
  if (!allowDeepLink) {
    return <Layout>{children}</Layout>;
  }
  
  // If forced standalone or deep link config says no layout
  if (forceStandalone || !shouldShowLayout) {
    return <>{children}</>;
  }
  
  // Default to layout
  return <Layout>{children}</Layout>;
}