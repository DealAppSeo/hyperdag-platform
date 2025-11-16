import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Sparkles } from 'lucide-react';
import { OnboardingProgress } from '@/components/onboarding/onboarding-progress';
import { EmailStep } from '@/components/onboarding/email-step';
import { VerifyEmailStep } from '@/components/onboarding/verify-email-step';
import { TwoFactorStep } from '@/components/onboarding/two-factor-step';
import { EnhancedWalletStep } from '@/components/onboarding/enhanced-wallet-step';
import { AiOnboardingGuide } from '@/components/onboarding/ai-onboarding-guide';
import { ValuePropositionGuide } from '@/components/onboarding/value-proposition-guide';
import { User } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function OnboardingPage() {
  const { user, isLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [, navigate] = useLocation();
  
  // Redirect based on authentication and onboarding status
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
      return;
    }
    
    // If user is authenticated and has completed onboarding (stage 4+), redirect to dashboard
    if (user && user.onboardingStage && user.onboardingStage >= 4) {
      navigate('/dashboard');
      return;
    }
  }, [user, isLoading, navigate]);
  
  // Handle URL parameters for direct navigation to specific steps
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const stepParam = urlParams.get('step');
    if (stepParam) {
      const stepNumber = parseInt(stepParam, 10);
      if (stepNumber >= 1 && stepNumber <= 5) {
        setCurrentStep(stepNumber);
        return;
      }
    }
    
    // Set current step based on user's onboarding stage if no URL param
    if (user?.onboardingStage) {
      setCurrentStep(user.onboardingStage + 1 <= 5 ? user.onboardingStage + 1 : 5);
    }
  }, [user]);
  
  // Handle step completion
  const handleStepComplete = (updatedUser: User) => {
    // In a real app, you'd update the user in global state
    // For now, we'll just update the current step
    if (updatedUser.onboardingStage) {
      setCurrentStep(updatedUser.onboardingStage + 1 <= 5 ? updatedUser.onboardingStage + 1 : 5);
    }
  };
  
  // Skip current step
  const handleSkipStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 5));
  };
  
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Determine access level based on onboarding stage and wallet connection
  const getCurrentAccessLevel = () => {
    // If stage is 5 but wallet is not connected, show appropriate message
    if (user.onboardingStage === 5 && !user.walletAddress) {
      return 'Premium Platform Access (Wallet Needed)';
    }
    
    switch (user.onboardingStage) {
      case 1:
        return 'Basic Platform Access';
      case 2:
        return 'Intermediate Platform Access';
      case 3:
        return 'Enhanced Platform Access';
      case 4:
        return 'Premium Platform Access';
      case 5:
        return 'Complete Web3 Access';
      default:
        return 'Basic Platform Access';
    }
  };
  
  const currentAccess = getCurrentAccessLevel();
  
  const renderCurrentStep = () => {
    
    // Render the appropriate step component
    switch (currentStep) {
      case 2:
        return (
          <EmailStep 
            user={user} 
            onSuccess={handleStepComplete}
            onSkip={handleSkipStep}
          />
        );
      case 3:
        return (
          <VerifyEmailStep 
            user={user} 
            onSuccess={handleStepComplete}
            onSkip={handleSkipStep}
          />
        );
      case 4:
        return (
          <TwoFactorStep 
            user={user} 
            onSuccess={handleStepComplete}
            onSkip={handleSkipStep}
          />
        );
      case 5:
        return (
          <EnhancedWalletStep 
            user={user} 
            onSuccess={handleStepComplete}
            onSkip={handleSkipStep}
          />
        );
      default:
        return (
          <div className="text-center p-8 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Welcome to HyperDAG!</h3>
            <p className="text-gray-600 mb-6">
              Continue your onboarding to unlock more features and functionality.
            </p>
            <Button onClick={() => setCurrentStep(2)}>Continue Onboarding</Button>
          </div>
        );
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold">Account Setup</h1>
            <p className="text-gray-600">Complete your profile to unlock all features</p>
          </div>
          <div className="mt-2 sm:mt-0">
            <div className="text-sm bg-primary/10 text-primary px-3 py-1 rounded-full">
              Current: {currentAccess}
            </div>
          </div>
        </div>
        
        <Tabs defaultValue="value-prop" className="w-full mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="value-prop">
              Value Proposition
            </TabsTrigger>
            <TabsTrigger value="standard">
              Setup Steps
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-1">
              <Sparkles className="h-4 w-4" />
              AI-Powered
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="value-prop" className="mt-4">
            <ValuePropositionGuide 
              onComplete={() => navigate('/dashboard')}
              currentStep={0}
            />
          </TabsContent>
          
          <TabsContent value="standard" className="mt-4">
            <OnboardingProgress user={user} currentStep={currentStep} />
            
            <div className="mb-8">
              {renderCurrentStep()}
            </div>
          </TabsContent>
          
          <TabsContent value="ai" className="mt-4">
            <AiOnboardingGuide />
          </TabsContent>
        </Tabs>
        
        <div className="text-center">
          <Button variant="outline" asChild>
            <Link href="/">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
