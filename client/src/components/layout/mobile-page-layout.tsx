import { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

interface MobilePageLayoutProps {
  title: string;
  children: ReactNode;
  showBackButton?: boolean;
  actions?: ReactNode;
  withPadding?: boolean;
  fullWidth?: boolean;
  hideOnDesktop?: boolean;
}

export default function MobilePageLayout({
  title,
  children,
  showBackButton = false,
  actions,
  withPadding = true,
  fullWidth = false,
  hideOnDesktop = false,
}: MobilePageLayoutProps) {
  const [_, navigate] = useLocation();

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate("/");
    }
  };

  return (
    <div className={`${hideOnDesktop ? "md:hidden" : ""} flex flex-col min-h-[calc(100vh-4rem)]`}>
      {/* Mobile header */}
      <header className="sticky top-0 z-30 bg-background border-b border-border flex items-center justify-between h-14 px-4">
        <div className="flex items-center">
          {showBackButton && (
            <button
              onClick={handleBack}
              className="mr-2 rounded-full w-8 h-8 flex items-center justify-center hover:bg-accent"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <h1 className="text-lg font-semibold truncate">{title}</h1>
        </div>
        {actions && <div className="flex items-center space-x-2">{actions}</div>}
      </header>

      {/* Content area with bottom padding for navigation */}
      <main
        className={`flex-1 ${
          withPadding ? "px-4 py-4" : ""
        } pb-16 ${fullWidth ? "max-w-full" : "max-w-3xl mx-auto w-full"}`}
      >
        {children}
      </main>
    </div>
  );
}