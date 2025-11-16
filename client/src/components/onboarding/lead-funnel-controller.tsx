import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';

// Import our onboarding components
import KnowledgeAssessment from './knowledge-assessment';
import ProgressiveDiscovery from './progressive-discovery';
// Import the default export from persona-selection
import PersonaSelectionComponent from './persona-selection';

// Rename for clarity
const PersonaSelection = PersonaSelectionComponent;

interface OnboardingProgress {
  persona: string;
  currentStep: string;
  knowledgeScore: number;
  knowledgeAreas: Record<string, number>;
  completedChallenges: string[];
  engagementScore: number;
  discoveredFeatures: string[];
  lastEngagement: string | null;
}

interface Challenge {
  id: string;
  name: string;
  description: string;
  persona: string;
  difficulty: string;
  tokenReward: number;
  reputationPoints: number;
  requiredStep: string;
  unlocksFeatures: string[];
}

interface UserProgressResponse {
  success: boolean;
  progress: OnboardingProgress;
  availableChallenges: Challenge[];
  activeGoals: string[];
}

// Define the steps in our funnel
const FUNNEL_STEPS = [
  'not_started',          // User hasn't started onboarding
  'persona_selected',     // User has selected their persona
  'identity_created',     // User has created their basic identity
  'profile_completed',    // User has completed their profile
  'knowledge_assessed',   // User has completed knowledge assessment
  'completed_basic_challenge', // User has completed at least one challenge
  'completed_intermediate_challenge', // User has completed more advanced challenges
  'completed_advanced_challenge'  // User has completed complex challenges
];

export default function LeadFunnelController() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('discover');
  
  // Fetch user's onboarding progress
  const { 
    data: progressData, 
    isLoading: isProgressLoading,
    error: progressError,
    refetch: refetchProgress
  } = useQuery<UserProgressResponse>({
    queryKey: ['/api/onboarding/progress'],
    enabled: !!user, // Only run this query if the user is logged in
    refetchOnWindowFocus: false
  });
  
  // Mutation for updating onboarding progress
  const progressMutation = useMutation({
    mutationFn: async (data: { step: string, data?: any }) => {
      const res = await apiRequest('POST', '/api/onboarding/progress', data);
      return res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch progress data after successful update
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding/progress'] });
      refetchProgress();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update onboarding progress',
        variant: 'destructive'
      });
    }
  });
  
  // Handle persona selection
  const handlePersonaSelected = (persona: string) => {
    progressMutation.mutate({
      step: 'persona_selected',
      data: { persona }
    });
  };
  
  // Handle knowledge assessment completion
  const handleKnowledgeAssessmentComplete = (scores: Record<string, number>, interests: Record<string, string[]>) => {
    // Knowledge assessment is handled by its own endpoint
    setActiveTab('discover');
  };
  
  // Handle challenge selection/start
  const handleStartChallenge = (challengeId: string) => {
    // Navigate to the appropriate challenge page based on the ID
    // This would normally navigate to a specific challenge page
    toast({
      title: 'Challenge Started',
      description: `You've started the ${challengeId} challenge. Complete it to unlock new features!`,
      duration: 5000
    });
  };
  
  // Handle feature selection
  const handleFeatureSelected = (featureId: string) => {
    // This would normally navigate to the specific feature
    // Here we just mark it as discovered
    progressMutation.mutate({
      step: 'feature_discovered',
      data: { featureId }
    });
  };
  
  // Determine which component to show based on onboarding progress
  const getCurrentStep = (): string => {
    if (!progressData?.progress) return 'not_started';
    return progressData.progress.currentStep || 'not_started';
  };
  
  // Loading state
  if (isAuthLoading || isProgressLoading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Error state
  if (progressError) {
    return (
      <div className="text-center p-6">
        <p className="text-destructive">Error loading your progress. Please try again.</p>
        <Button 
          variant="outline" 
          onClick={() => refetchProgress()}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }
  
  // Not logged in state
  if (!user) {
    return (
      <Card className="w-full max-w-lg mx-auto shadow-lg">
        <CardHeader>
          <CardTitle>Join HyperDAG</CardTitle>
          <CardDescription>
            Sign in or create an account to start your Web3 journey
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center p-6">
          <p className="mb-6">
            Unlock personalized features, build your reputation, and collaborate with others
            on cutting-edge Web3 projects.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-4">
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
          <Button variant="outline" onClick={() => navigate('/auth?register=true')}>Create Account</Button>
        </CardFooter>
      </Card>
    );
  }
  
  // Determine what to show based on current funnel step
  const currentStep = getCurrentStep();
  
  // User needs to select a persona first
  if (currentStep === 'not_started') {
    return (
      <div className="flex justify-center">
        <div className="max-w-4xl w-full">
          <PersonaSelection onSelectPersona={handlePersonaSelected} />
        </div>
      </div>
    );
  }
  
  // User needs to complete knowledge assessment
  if (currentStep === 'persona_selected' || currentStep === 'identity_created') {
    if (activeTab === 'assess') {
      return (
        <KnowledgeAssessment 
          persona={progressData?.progress.persona as any || 'developer'} 
          onComplete={handleKnowledgeAssessmentComplete}
          onBack={() => setActiveTab('discover')}
        />
      );
    }
  }
  
  // For all other steps, show the tabbed interface with progressive discovery and challenges
  return (
    <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <TabsList>
          <TabsTrigger value="discover">Discover Features</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="assess">Knowledge Assessment</TabsTrigger>
        </TabsList>
        
        {/* Knowledge level indicator */}
        <div className="bg-muted px-3 py-1 rounded-full text-sm">
          Knowledge Level: {progressData?.progress.knowledgeScore || 1} 
          {progressData?.progress.knowledgeScore === 1 && ' (Beginner)'}
          {progressData?.progress.knowledgeScore === 2 && ' (Basic)'}
          {progressData?.progress.knowledgeScore === 3 && ' (Intermediate)'}
          {progressData?.progress.knowledgeScore === 4 && ' (Advanced)'}
          {progressData?.progress.knowledgeScore === 5 && ' (Expert)'}
        </div>
      </div>
      
      <TabsContent value="discover" className="mt-2">
        <ProgressiveDiscovery onSelectFeature={handleFeatureSelected} />
      </TabsContent>
      
      <TabsContent value="challenges" className="mt-2">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {progressData?.availableChallenges && progressData.availableChallenges.length > 0 ? (
              progressData.availableChallenges.map(challenge => (
                <Card key={challenge.id} className="overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-lg font-medium">{challenge.name}</CardTitle>
                    <CardDescription>{challenge.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex items-center gap-2 mt-4">
                      <span className={`px-2 py-1 text-xs rounded-full border ${
                        challenge.difficulty === 'basic' 
                          ? 'bg-blue-100 border-blue-300 text-blue-700' 
                          : challenge.difficulty === 'intermediate'
                            ? 'bg-purple-100 border-purple-300 text-purple-700'
                            : 'bg-red-100 border-red-300 text-red-700'
                      }`}>
                        {challenge.difficulty}
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-amber-100 border border-amber-300 text-amber-700">
                        +{challenge.tokenReward} tokens
                      </span>
                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 border border-green-300 text-green-700">
                        +{challenge.reputationPoints} rep
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 pt-0 flex justify-end">
                    <Button size="sm" onClick={() => handleStartChallenge(challenge.id)}>
                      Start Challenge
                    </Button>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center p-6">
                <p>No challenges available at your current level. Complete the knowledge assessment or earlier steps to unlock challenges.</p>
                {(currentStep === 'persona_selected' || currentStep === 'identity_created') && (
                  <Button onClick={() => setActiveTab('assess')} className="mt-4">
                    Take Knowledge Assessment
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </TabsContent>
      
      <TabsContent value="assess" className="mt-2">
        <KnowledgeAssessment 
          persona={progressData?.progress.persona as any || 'developer'} 
          onComplete={handleKnowledgeAssessmentComplete} 
        />
      </TabsContent>
    </Tabs>
  );
}