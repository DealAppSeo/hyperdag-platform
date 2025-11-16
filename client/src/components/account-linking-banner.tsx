import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, Link2, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

interface AccountLinkingBannerProps {
  user: any;
  onDismiss?: () => void;
}

export function AccountLinkingBanner({ user, onDismiss }: AccountLinkingBannerProps) {
  const [, setLocation] = useLocation();
  const [isDismissed, setIsDismissed] = useState(false);

  // Only show for new Telegram users without linked accounts
  const shouldShow = user?.isNewUser && 
                    user?.authMethods?.telegram && 
                    Object.keys(user?.authMethods || {}).length === 1 &&
                    !isDismissed;

  if (!shouldShow) return null;

  const handleLinkAccount = () => {
    setLocation("/link-account");
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  return (
    <Alert className="mb-6 border-blue-200 bg-blue-50">
      <Link2 className="h-4 w-4 text-blue-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          <strong className="text-blue-900">Link Your Existing Account</strong>
          <p className="text-blue-800 mt-1">
            Do you have an existing HyperDAG profile? Connect your Telegram authentication 
            to access all your projects, reputation, and data.
          </p>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Button 
            onClick={handleLinkAccount}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            Link Account <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
          <Button 
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-800"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}