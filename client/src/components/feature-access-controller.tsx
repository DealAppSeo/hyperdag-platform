import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { Lock, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

// Define the access levels for features
export type AccessLevel = 'basic' | 'email' | 'knowledge' | '2fa' | 'wallet' | 'full';

interface FeatureAccessControllerProps {
  // The required access level for the feature
  requiredLevel: AccessLevel;
  // The feature name to display in the access denied message
  featureName: string;
  // The path to redirect to for completing the required step
  completionPath?: string;
  // The children component to render if access is granted
  children: React.ReactNode;
}

// Helper function to determine the numeric level from the access level string
const getAccessLevelValue = (level: AccessLevel): number => {
  switch (level) {
    case 'basic':
      return 1;
    case 'email':
      return 2;
    case 'knowledge':
      return 3;
    case '2fa':
      return 4;
    case 'wallet':
      return 5;
    case 'full':
      return 6;
    default:
      return 1;
  }
};

// Helper function to get the message for the next required step
const getRequiredStepMessage = (level: AccessLevel): string => {
  switch (level) {
    case 'email':
      return 'Verify your email to access this feature.';
    case 'knowledge':
      return 'Complete the knowledge assessment to access this feature.';
    case '2fa':
      return 'Set up two-factor authentication to access this feature.';
    case 'wallet':
      return 'Connect your wallet to access this feature.';
    case 'full':
      return 'Complete all profile steps to access this feature.';
    default:
      return 'Additional profile completion required to access this feature.';
  }
};

// Helper function to get the path for completing the required step
const getDefaultCompletionPath = (level: AccessLevel): string => {
  switch (level) {
    case 'email':
      return '/profile/email-verification';
    case 'knowledge':
      return '/personalized-journey?step=knowledge';
    case '2fa':
      return '/profile/2fa-setup';
    case 'wallet':
      return '/profile/wallet-connect';
    case 'full':
      return '/profile';
    default:
      return '/profile';
  }
};

export default function FeatureAccessController({
  requiredLevel,
  featureName,
  completionPath,
  children,
}: FeatureAccessControllerProps) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // If no user is logged in, show login required
  if (!user) {
    return (
      <Card className="w-full max-w-md mx-auto mt-8 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            Authentication Required
          </CardTitle>
          <CardDescription>
            You need to sign in to access {featureName}.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-end">
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </CardFooter>
      </Card>
    );
  }

  // Determine user's current access level based on profile completion
  let userAccessLevelValue = 1; // Basic level by default
  
  // Email verified
  if (user.emailVerified) {
    userAccessLevelValue = 2;
  }

  // Knowledge assessment completed
  // Check user.onboardingStage which is 1-5, 3+ means knowledge assessment done
  if (user.onboardingStage && user.onboardingStage >= 3) {
    userAccessLevelValue = 3;
  }

  // 2FA enabled
  // Check user.authLevel which is 1-3, 2+ means 2FA is enabled
  if (user.authLevel && user.authLevel >= 2) {
    userAccessLevelValue = 4;
  }

  // Wallet connected
  if (user.walletAddress) {
    userAccessLevelValue = 5;
  }

  // Full profile completed (onboardingStage = 5 means fully complete)
  if (user.onboardingStage && user.onboardingStage === 5) {
    userAccessLevelValue = 6;
  }

  // Check if user has the required access level
  const requiredLevelValue = getAccessLevelValue(requiredLevel);
  
  if (userAccessLevelValue >= requiredLevelValue) {
    // User has the required access level, render the children
    return <>{children}</>;
  }

  // User doesn't have the required access level, show access denied
  return (
    <Card className="w-full max-w-md mx-auto mt-8 shadow-lg border-destructive/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-destructive" />
          Access Restricted
        </CardTitle>
        <CardDescription>
          You need additional verification to access {featureName}.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-muted p-3 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
          <div>
            <p className="text-sm font-medium">{getRequiredStepMessage(requiredLevel)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              This ensures security and proper access to all platform features.
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={() => navigate(completionPath || getDefaultCompletionPath(requiredLevel))}
        >
          Complete Required Step
        </Button>
      </CardFooter>
    </Card>
  );
}