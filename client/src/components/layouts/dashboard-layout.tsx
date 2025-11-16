import React from 'react';
import Sidebar from '@/components/layout/sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Dashboard Layout Component
 * 
 * A layout component that includes the sidebar and provides the main dashboard structure.
 * Used for pages that should have sidebar navigation.
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <main>{children}</main>
    </div>
  );
}