import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Link, useLocation } from 'wouter';
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Share2,
  User,
  Mail,
  Shield,
  Wallet,
  FileText,
  Users,
  X,
  ChevronDown,
  ChevronUp,
  UserPlus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { OnboardingProgress } from './onboarding-progress';

interface OnboardingStatusProps {
  onDismiss?: () => void;
  showDetailed?: boolean;
}

export function OnboardingStatus({ onDismiss, showDetailed = false }: OnboardingStatusProps) {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [isExpanded, setIsExpanded] = useState(showDetailed);

  // Fetch onboarding status data from the API
  const { data: onboardingStatus, isLoading } = useQuery({
    queryKey: ["/api/onboarding/status"],
    enabled: !!user,
  });

  if (!user || isLoading) {
    return (
      <Card className="w-full bg-slate-50 border-blue-100 animate-pulse">
        <CardContent className="p-6">
          <div className="h-16 bg-slate-200 rounded-md mb-4"></div>
          <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2 mb-6"></div>
          <div className="h-10 bg-slate-200 rounded-md"></div>
        </CardContent>
      </Card>
    );
  }
  
  // If profile is complete or no next steps, don't show
  if (!onboardingStatus?.data?.nextSteps || onboardingStatus.data.nextSteps.length === 0) {
    return null;
  }

  const profileCompletion = onboardingStatus.data.profile.completion;
  const nextSteps = onboardingStatus.data.nextSteps;
  const highPrioritySteps = nextSteps.filter(step => step.importance === 'high');
  
  // Determine action button details based on highest priority next step
  let primaryAction = { label: 'Complete Your Profile', link: '/settings' };
  if (highPrioritySteps.length > 0) {
    const topStep = highPrioritySteps[0];
    primaryAction = { 
      label: topStep.id === 'refer' 
        ? 'Refer Friends & Earn Rewards' 
        : `Complete: ${topStep.label}`, 
      link: topStep.link 
    };
  }
  
  return (
    <Card className="w-full mb-6 border-primary/20 bg-gradient-to-r from-slate-50 to-blue-50">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl flex items-center text-primary">
              <AlertCircle className="mr-2 h-5 w-5 text-amber-500" />
              Continue Your Onboarding
            </CardTitle>
            <CardDescription className="mt-1">
              Complete these steps to unlock all features and maximize your rewards
            </CardDescription>
          </div>
          {onDismiss && (
            <Button variant="ghost" size="icon" onClick={onDismiss} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          )}
          {!showDetailed && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-primary h-8"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="mr-1 h-4 w-4" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="mr-1 h-4 w-4" />
                  Show Details
                </>
              )}
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div className="mb-4 mt-1">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">Profile Completion</span>
            <span className="text-sm font-medium">{profileCompletion}%</span>
          </div>
          <Progress value={profileCompletion} className="h-2" />
        </div>
        
        {(isExpanded || showDetailed) && (
          <>
            {/* Full onboarding progress steps */}
            <div className="mb-4">
              <OnboardingProgress user={user} />
            </div>
            
            {/* Next steps accordion */}
            <div className="mt-4 mb-2">
              <h4 className="text-sm font-medium mb-2">Recommended Next Steps:</h4>
              <Accordion type="multiple" defaultValue={['high-priority']} className="w-full">
                <AccordionItem value="high-priority" className="border-b-0">
                  <AccordionTrigger className="py-2 text-sm">
                    <span className="flex items-center">
                      <Badge variant="default" className="mr-2 bg-amber-500">High Priority</Badge>
                      Complete these first
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2">
                      {highPrioritySteps.map((step) => (
                        <li key={step.id} className="flex items-start">
                          <div className="mr-3 mt-0.5">
                            {step.id === 'persona' && <User className="h-4 w-4 text-blue-500" />}
                            {step.id === 'email' && <Mail className="h-4 w-4 text-orange-500" />}
                            {step.id === 'verify-email' && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {step.id === '2fa' && <Shield className="h-4 w-4 text-purple-500" />}
                            {step.id === 'wallet' && <Wallet className="h-4 w-4 text-yellow-500" />}
                            {step.id === 'refer' && <UserPlus className="h-4 w-4 text-red-500" />}
                          </div>
                          <div className="flex-1">
                            <Link href={step.link} className="text-sm font-medium text-primary hover:underline">
                              {step.label}
                            </Link>
                            {step.note && (
                              <p className="text-xs text-amber-700 mt-0.5">{step.note}</p>
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400 ml-2 self-center" />
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                {nextSteps.filter(step => step.importance !== 'high').length > 0 && (
                  <AccordionItem value="additional-steps" className="border-t-0">
                    <AccordionTrigger className="py-2 text-sm">
                      <span className="flex items-center">
                        <Badge variant="outline" className="mr-2">Optional</Badge>
                        Additional profile enhancements
                      </span>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-2">
                        {nextSteps
                          .filter(step => step.importance !== 'high')
                          .map((step) => (
                            <li key={step.id} className="flex items-start">
                              <div className="mr-3 mt-0.5">
                                {step.id === 'bio' && <FileText className="h-4 w-4 text-gray-500" />}
                                {step.id === 'skills' && <Users className="h-4 w-4 text-gray-500" />}
                              </div>
                              <div className="flex-1">
                                <Link href={step.link} className="text-sm font-medium text-gray-700 hover:underline">
                                  {step.label}
                                </Link>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400 ml-2 self-center" />
                            </li>
                          ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            </div>
            
            {/* Add referral highlights */}
            {highPrioritySteps.some(step => step.id === 'refer') && (
              <div className="mt-4 bg-amber-50 border border-amber-100 rounded-md p-3">
                <div className="flex items-start">
                  <Share2 className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-amber-800">Referral Rewards Decrease Over Time</h4>
                    <p className="text-xs text-amber-700 mt-1">
                      Early referrers earn maximum rewards. Invite friends now before rewards decrease as more users join the platform.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={() => {
            // Handle wallet connection navigation specially
            if (primaryAction.label.includes('Connect your Web3 wallet')) {
              navigate('/onboarding?step=5');
            } else {
              navigate(primaryAction.link);
            }
          }} 
          className="w-full bg-primary hover:bg-primary/90"
        >
          {primaryAction.label}
        </Button>
      </CardFooter>
    </Card>
  );
}