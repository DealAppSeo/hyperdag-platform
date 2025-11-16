import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { ShieldIcon, ArrowUpIcon, WalletIcon, LockIcon, Sparkles, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { OnboardingProgress } from './onboarding-progress';
import { AIOnboardingExplainer } from './ai-onboarding-explainer';

// Define user persona type
type UserPersona = 'developer' | 'designer' | 'influencer' | null;

export function WelcomeModal() {
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(false);
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [showPersonaSelection, setShowPersonaSelection] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<UserPersona>(null);
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  useEffect(() => {
    // Show welcome modal for new users who have just registered
    if (user && user.onboardingStage === 1) {
      const hasSeenWelcome = window.localStorage.getItem(`welcome_seen_${user.id}`);
      
      if (!hasSeenWelcome) {
        // Show after a short delay
        const timer = setTimeout(() => {
          setIsWelcomeOpen(true);
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [user]);
  
  // Handle welcome modal close
  const handleWelcomeClose = () => {
    if (user) {
      // Mark welcome as seen
      window.localStorage.setItem(`welcome_seen_${user.id}`, 'true');
    }
    setIsWelcomeOpen(false);
  };
  
  // Proceed to AI explainer after welcome
  const handleProceedToExplainer = () => {
    if (user) {
      // Mark welcome as seen
      window.localStorage.setItem(`welcome_seen_${user.id}`, 'true');
    }
    setIsWelcomeOpen(false);
    
    // Show AI explainer with a short delay
    setTimeout(() => {
      setIsExplainerOpen(true);
    }, 300);
  };
  
  // Handle AI explainer close and go to persona selection
  const handleExplainerFinish = () => {
    setIsExplainerOpen(false);
    setShowPersonaSelection(true);
  };
  
  // Handle completion of persona selection
  const handlePersonaSelected = (persona: UserPersona) => {
    setSelectedPersona(persona);
    setShowPersonaSelection(false);
    
    // Navigate to the dashboard
    navigate('/');
  };
  
  if (!user) return null;
  
  return (
    <>
      {/* Initial Welcome Dialog */}
      <Dialog open={isWelcomeOpen} onOpenChange={setIsWelcomeOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-xl sm:text-2xl">Welcome to HyperDAG!</DialogTitle>
            <DialogDescription className="text-sm">
              Your account has been created with basic access. Complete your profile to unlock more features.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2 sm:py-4">
            {/* More compact mobile view */}
            <div className="block sm:hidden mb-2 text-center">
              <div className="text-sm text-primary font-medium">Onboarding Progress</div>
              <div className="text-xs text-gray-500 mt-1">
                {(user?.onboardingStage || 1) < 5 ? `${user?.onboardingStage || 1} of 5 completed` : "All steps completed!"}
              </div>
              <div className="h-2 bg-gray-200 rounded-full mt-2 mx-2">
                <div 
                  className="h-full bg-primary rounded-full transition-all" 
                  style={{ width: `${Math.max(0, ((user?.onboardingStage || 1) - 1) / 4) * 100}%` }}
                />
              </div>
            </div>

            {/* Full progress display for larger screens */}
            <div className="hidden sm:block">
              <OnboardingProgress user={user} />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 rounded-lg flex items-start">
                <ShieldIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-1 mr-2" />
                <div>
                  <h3 className="font-medium text-sm">Enhanced Privacy</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Control what information you share with the community.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 rounded-lg flex items-start">
                <ArrowUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mt-1 mr-2" />
                <div>
                  <h3 className="font-medium text-sm">Unlock Features</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Access more powerful features as you complete your profile.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 rounded-lg flex items-start">
                <WalletIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 mt-1 mr-2" />
                <div>
                  <h3 className="font-medium text-sm">Web3 Integration</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Connect your wallet to earn tokens and access DApps.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 rounded-lg flex items-start">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 mt-1 mr-2" />
                <div>
                  <h3 className="font-medium text-sm">Track Your Journey</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Earn rewards and unlock features as you engage.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 rounded-lg flex items-start">
                <LockIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 mt-1 mr-2" />
                <div>
                  <h3 className="font-medium text-sm">Four-Factor Auth</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Advanced security model to protect your digital assets.
                  </p>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-900 p-2 sm:p-3 rounded-lg flex items-start">
                <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 mt-1 mr-2" />
                <div>
                  <h3 className="font-medium text-sm">AI-Optimized Onboarding</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Personalized feature discovery based on your interests and expertise.
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:justify-between sm:space-x-2 mt-2">
            <Button variant="outline" size="sm" onClick={handleWelcomeClose} className="text-sm">
              Explore First
            </Button>
            <Button size="sm" onClick={handleProceedToExplainer} className="text-sm">
              Learn More
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Onboarding Explainer Dialog */}
      <AIOnboardingExplainer 
        open={isExplainerOpen} 
        onOpenChange={(open) => {
          setIsExplainerOpen(open);
          if (!open) {
            // If they close the explainer, show persona selection
            setShowPersonaSelection(true);
          }
        }} 
      />

      {/* Persona Selection Modal - Redirecting to Sticky Features page */}
      {showPersonaSelection && (
        <div className="fixed inset-0 bg-background flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card rounded-lg shadow-lg w-full max-w-md p-5 text-center">
            <h2 className="text-xl font-bold mb-4">Personalize Your Experience</h2>
            <p className="text-muted-foreground mb-6">
              Choose your path to personalize your HyperDAG experience based on your interests and skills.
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/personalized-journey')} className="w-full">
                Personalize Your Journey
              </Button>
              <Button variant="outline" onClick={() => setShowPersonaSelection(false)} className="w-full">
                Later
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
