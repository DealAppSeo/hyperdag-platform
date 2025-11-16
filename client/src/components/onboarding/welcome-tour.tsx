import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCircle, DollarSign, Award, Users, ArrowRight, Settings, ChevronRight, Home, Code, Palette, TrendingUp, Sparkles } from 'lucide-react';
import { UserPersona as ImportedUserPersona } from './persona-selection';
import { useToast } from '@/hooks/use-toast';

// Modified version that uses 'none' instead of null for TypeScript compatibility
type UserPersona = 'developer' | 'designer' | 'influencer' | 'none';

type TourStep = {
  id: string;
  title: string;
  description: string;
  element: string; // CSS selector for the element to highlight
  position: 'top' | 'right' | 'bottom' | 'left';
  icon: React.ReactNode;
};

type PersonaTourMap = {
  developer: TourStep[];
  designer: TourStep[];
  influencer: TourStep[];
  none: TourStep[];
};

function getHighlightedElement(selector: string): HTMLElement | null {
  return document.querySelector(selector);
}

export function WelcomeTour({
  isOpen,
  onClose,
  persona
}: {
  isOpen: boolean;
  onClose: () => void;
  persona: UserPersona;
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const { toast } = useToast();

  // Define tour steps based on persona
  const personaTours: PersonaTourMap = {
    developer: [
      {
        id: 'welcome',
        title: 'Welcome to HyperDAG',
        description: "We've tailored your experience for developers and hackers. Let's take a quick tour to help you get started!",
        element: 'body',
        position: 'top',
        icon: <Code className="h-6 w-6 text-blue-500" />,
      },
      {
        id: 'dashboard',
        title: 'Your Developer Dashboard',
        description: "This is your hub for all development-related activities. You'll see coding projects, Web3 opportunities, and technical challenges that match your skills.",
        element: '[href="/"]',
        position: 'bottom',
        icon: <Home className="h-6 w-6" />,
      },
      {
        id: 'journey',
        title: 'Track Your Journey',
        description: 'The My Journey page is where you track progress, unlock hidden features, and earn rewards through your daily activities and contributions to the ecosystem.',
        element: '[href="/sticky-features"]',
        position: 'right',
        icon: <Sparkles className="h-6 w-6 text-amber-500" />,
      },
      {
        id: 'grant-flow',
        title: 'Find Technical Projects',
        description: 'Browse RFPs that need developers. Many teams are looking for coders with Web3 and AI skills - your expertise could be just what they need!',
        element: '[href="/grant-flow"]',
        position: 'right',
        icon: <DollarSign className="h-6 w-6" />,
      },
      {
        id: 'profile',
        title: 'Showcase Your Skills',
        description: 'Update your profile to highlight your programming languages, frameworks, and technical achievements. This helps designers and investors find you for collaboration!',
        element: '[href="/profile"]',
        position: 'right',
        icon: <UserCircle className="h-6 w-6" />,
      },
      {
        id: 'reputation',
        title: 'Build Your Technical Reputation',
        description: 'As you contribute code and solve problems, you will earn technical reputation points. These verify your skills through zero-knowledge proofs.',
        element: '[href="/reputation"]',
        position: 'right',
        icon: <Award className="h-6 w-6" />,
      },
    ],
    designer: [
      {
        id: 'welcome',
        title: 'Welcome to HyperDAG',
        description: 'We have tailored your experience for designers and creatives. Let us take a quick tour to help you get started!',
        element: 'body',
        position: 'top',
        icon: <Palette className="h-6 w-6 text-orange-500" />,
      },
      {
        id: 'dashboard',
        title: 'Your Creative Dashboard',
        description: 'This is your hub for all design-related activities. You will see creative projects, UI/UX opportunities, and visual challenges that match your skills.',
        element: '[href="/"]',
        position: 'bottom',
        icon: <Home className="h-6 w-6" />,
      },
      {
        id: 'journey',
        title: 'Visualize Your Progress',
        description: 'The My Journey page is your personalized visual experience where you track achievements, collect design rewards, and unlock new creative features as you engage.',
        element: '[href="/sticky-features"]',
        position: 'right',
        icon: <Sparkles className="h-6 w-6 text-amber-500" />,
      },
      {
        id: 'grant-flow',
        title: 'Find Creative Projects',
        description: 'Browse RFPs that need designers. Many teams are looking for UI/UX experts who can create intuitive interfaces for Web3 and AI applications!',
        element: '[href="/grant-flow"]',
        position: 'right',
        icon: <DollarSign className="h-6 w-6" />,
      },
      {
        id: 'profile',
        title: 'Showcase Your Portfolio',
        description: 'Update your profile to highlight your design skills, portfolio, and creative achievements. This helps developers and investors find you for collaboration!',
        element: '[href="/profile"]',
        position: 'right',
        icon: <UserCircle className="h-6 w-6" />,
      },
      {
        id: 'reputation',
        title: 'Build Your Creative Reputation',
        description: 'As you contribute designs and solve creative challenges, you will earn creative reputation points. These verify your skills through zero-knowledge proofs.',
        element: '[href="/reputation"]',
        position: 'right',
        icon: <Award className="h-6 w-6" />,
      },
    ],
    influencer: [
      {
        id: 'welcome',
        title: 'Welcome to HyperDAG',
        description: 'We have tailored your experience for influencers and investors. Let us take a quick tour to help you get started!',
        element: 'body',
        position: 'top',
        icon: <TrendingUp className="h-6 w-6 text-green-500" />,
      },
      {
        id: 'dashboard',
        title: 'Your Network Dashboard',
        description: 'This is your hub for all networking activities. You will see investment opportunities, community growth metrics, and strategic partnerships that match your interests.',
        element: '[href="/"]',
        position: 'bottom',
        icon: <Home className="h-6 w-6" />,
      },
      {
        id: 'journey',
        title: 'Expand Your Influence',
        description: 'The My Journey page tracks your growing network reach, showcases your investment impact, and unlocks exclusive opportunities as your reputation grows.',
        element: '[href="/sticky-features"]',
        position: 'right',
        icon: <Sparkles className="h-6 w-6 text-amber-500" />,
      },
      {
        id: 'grant-flow',
        title: 'Discover Investment Opportunities',
        description: 'Browse RFPs that need funding and promotion. Your influence and resources can help promising projects reach their full potential!',
        element: '[href="/grant-flow"]',
        position: 'right',
        icon: <DollarSign className="h-6 w-6" />,
      },
      {
        id: 'refer',
        title: 'Grow Your Network',
        description: 'Invite developers, designers, and other investors to join HyperDAG. As your network grows, so does your influence and earning potential!',
        element: '[href="/refer"]',
        position: 'right',
        icon: <Users className="h-6 w-6" />,
      },
      {
        id: 'reputation',
        title: 'Build Your Influence Score',
        description: 'As you connect people, fund projects, and promote ideas, you will earn reputation points. These verify your impact through zero-knowledge proofs.',
        element: '[href="/reputation"]',
        position: 'right',
        icon: <Award className="h-6 w-6" />,
      },
    ],
    none: [] // Fallback for no persona selected
  };

  // Get the appropriate tour steps based on the selected persona
  const steps = persona ? personaTours[persona] : [];
  const currentStep = steps[currentStepIndex];

  // Control tooltip visibility
  useEffect(() => {
    if (isOpen && currentStep) {
      // Add a small delay to allow the UI to update
      const timer = setTimeout(() => {
        setShowTooltip(true);
      }, 300);
      return () => clearTimeout(timer);
    }
    return () => {};
  }, [isOpen, currentStep]);

  // Handle next step
  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setShowTooltip(false);
      setTimeout(() => {
        setCurrentStepIndex(currentStepIndex + 1);
      }, 300);
    } else {
      handleComplete();
    }
  };

  // Handle tour completion
  const handleComplete = () => {
    setShowTooltip(false);
    setTimeout(() => {
      onClose();
      toast({
        title: "Tour completed!",
        description: "You're all set to explore HyperDAG. Check out your personalized recommendations on the dashboard.",
      });
      setCurrentStepIndex(0);
    }, 300);
  };

  // Skip the tour
  const handleSkip = () => {
    setShowTooltip(false);
    setTimeout(() => {
      onClose();
      toast({
        title: "Tour skipped",
        description: "You can always access help via the support icon in the navigation bar.",
      });
      setCurrentStepIndex(0);
    }, 300);
  };

  if (!currentStep) return null;

  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  
  // For the first step, we show a dialog
  if (isFirstStep) {
    return (
      <Dialog open={isOpen && showTooltip} onOpenChange={() => setShowTooltip(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center space-x-2">
              {currentStep.icon}
              <DialogTitle>{currentStep.title}</DialogTitle>
            </div>
            <DialogDescription>{currentStep.description}</DialogDescription>
          </DialogHeader>
          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={handleSkip}>Skip Tour</Button>
            <Button onClick={handleNext}>Start Tour <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // For other steps, we show tooltips
  const targetElement = getHighlightedElement(currentStep.element);
  if (!targetElement) return null;

  const elementRect = targetElement.getBoundingClientRect();
  
  // Calculate position for the tooltip
  let positionStyle = {};
  switch (currentStep.position) {
    case 'top':
      positionStyle = {
        top: `${elementRect.top - 10}px`,
        left: `${elementRect.left + elementRect.width / 2}px`,
        transform: 'translate(-50%, -100%)'
      };
      break;
    case 'right':
      positionStyle = {
        top: `${elementRect.top + elementRect.height / 2}px`,
        left: `${elementRect.right + 10}px`,
        transform: 'translateY(-50%)'
      };
      break;
    case 'bottom':
      positionStyle = {
        top: `${elementRect.bottom + 10}px`,
        left: `${elementRect.left + elementRect.width / 2}px`,
        transform: 'translateX(-50%)'
      };
      break;
    case 'left':
      positionStyle = {
        top: `${elementRect.top + elementRect.height / 2}px`,
        left: `${elementRect.left - 10}px`,
        transform: 'translate(-100%, -50%)'
      };
      break;
  }

  return (
    <TooltipProvider>
      <div 
        className="fixed inset-0 z-50 bg-black/50"
        onClick={handleSkip}
      >
        <AnimatePresence>
          {showTooltip && (
            <motion.div 
              className="absolute z-50 p-4 bg-white rounded-lg shadow-lg w-80"
              style={positionStyle}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-2 mb-2">
                {currentStep.icon}
                <h3 className="font-bold">{currentStep.title}</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{currentStep.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex space-x-1">
                  {steps.slice(1).map((_, index) => (
                    <div 
                      key={index} 
                      className={`h-1.5 w-1.5 rounded-full ${index + 1 === currentStepIndex ? 'bg-primary' : 'bg-gray-300'}`} 
                    />
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleSkip}>Skip</Button>
                  <Button size="sm" onClick={handleNext}>
                    {isLastStep ? 'Finish' : 'Next'}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Highlight the target element */}
        <div 
          className="absolute border-2 border-primary rounded-md animate-pulse transition-all duration-300 pointer-events-none"
          style={{
            top: elementRect.top - 4,
            left: elementRect.left - 4,
            width: elementRect.width + 8,
            height: elementRect.height + 8,
          }}
        />
      </div>
    </TooltipProvider>
  );
}
