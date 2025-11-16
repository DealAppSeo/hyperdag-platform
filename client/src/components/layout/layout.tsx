import { ReactNode, useState } from "react";
import Sidebar from "./sidebar";
import SideDrawer from "./side-drawer";
import MobileHeader from "./mobile-header";
import BottomNav from "./bottom-nav";
import { FloatingShareButton } from "../sharing/floating-share-button";
import NonprofitFloatingButton from "../nonprofit-floating-button";
import FloatingAIButton from "../global/FloatingAIButton";
import { useAuth } from "@/hooks/use-auth";
// import { useConditionalNavigation } from "@/hooks/use-deep-link";

export function Layout({ children, forceStandalone = false }: { children: ReactNode; forceStandalone?: boolean }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { user } = useAuth();
  // const { shouldShowLayout } = useConditionalNavigation();
  
  // If forceStandalone is true, render standalone
  if (forceStandalone) {
    return (
      <div className="min-h-screen bg-background">
        <FloatingAIButton />
        {children}
      </div>
    );
  }
  
  return (
    <div className="flex flex-col md:flex-row h-screen bg-background">
      {/* Desktop Sidebar - hidden on mobile */}
      <Sidebar />
      
      {/* Mobile Header - shown only on mobile */}
      <div className="md:hidden sticky top-0 z-30 w-full">
        <MobileHeader onMenuClick={() => setIsMobileNavOpen(true)} />
      </div>
      
      {/* Mobile Navigation Drawer */}
      <SideDrawer isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />
      
      {/* Main Content - adjust margin to account for fixed sidebar */}
      <div className="flex-1 overflow-auto w-full md:ml-64">
        <main className="px-3 sm:px-4 md:px-6 pt-12 sm:pt-14 md:pt-6 pb-20 sm:pb-24 md:pb-12">{children}</main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <BottomNav />
      
      {/* Floating Share Button - always visible */}
      <FloatingShareButton />
      
      {/* Floating AI Button - always visible */}
      <FloatingAIButton />
      
      {/* Floating Nonprofit Button - always visible on mobile */}
      <NonprofitFloatingButton />
    </div>
  );
}