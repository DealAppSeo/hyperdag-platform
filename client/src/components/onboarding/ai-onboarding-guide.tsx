import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, CheckCircle, ChevronRight, Code, Palette, Users, Shield, Megaphone, Zap, Award, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Define types for the AI response data
interface OnboardingGuide {
  welcomeMessage: string;
  persona: string;
  keyFeatures: Array<{
    title: string;
    description: string;
    relevanceScore: number;
    path: string;
  }>;
  recommendedActions: Array<{
    title: string;
    description: string;
    path: string;
  }>;
  personalizationInsights: string;
}

interface PersonaFeature {
  title: string;
  description: string;
  path: string;
  icon: string;
}

interface SkillQuestion {
  id: string;
  text: string;
  options: Array<{
    value: string;
    label: string;
    skillLevel: string;
  }>;
  skillCategory: string;
}

// Map icon names to components
const iconMap: Record<string, React.ReactNode> = {
  code: <Code className="w-5 h-5" />,
  palette: <Palette className="w-5 h-5" />,
  megaphone: <Megaphone className="w-5 h-5" />,
  users: <Users className="w-5 h-5" />,
  shield: <Shield className="w-5 h-5" />,
  coins: <Coins className="w-5 h-5" />,
  zap: <Zap className="w-5 h-5" />,
  award: <Award className="w-5 h-5" />
};

// Get the color class based on persona
const getPersonaColorClass = (persona: string) => {
  switch (persona) {
    case 'developer':
      return 'text-blue-500 border-blue-200 bg-blue-50';
    case 'designer':
      return 'text-orange-500 border-orange-200 bg-orange-50';
    case 'influencer':
      return 'text-green-500 border-green-200 bg-green-50';
    default:
      return 'text-primary border-primary/20 bg-primary/10';
  }
};

export function AiOnboardingGuide() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedPersona, setSelectedPersona] = useState<string>(user?.persona || 'developer');
  const [loadingPersona, setLoadingPersona] = useState<boolean>(false);
  const [userSkills, setUserSkills] = useState<string[]>(user?.skills || []);
  const [userInterests, setUserInterests] = useState<string[]>(user?.interests || []);
  
  // Fetch personalized onboarding guide
  const { data: guideData, isLoading: guideLoading, error: guideError } = useQuery({
    queryKey: ["/api/ai/onboarding/guide"], 
    queryFn: async () => {
      const response = await fetch("/api/ai/onboarding/guide");
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Failed to load onboarding guide");
      return data.guide as OnboardingGuide;
    },
    enabled: !!user // Only run query if user is authenticated
  });
  
  // Fetch persona-specific features
  const { data: featuresData, isLoading: featuresLoading } = useQuery({
    queryKey: ["/api/ai/onboarding/features", selectedPersona],
    queryFn: async () => {
      const response = await fetch(`/api/ai/onboarding/features/${selectedPersona}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Failed to load persona features");
      return data.features?.features || [];
    },
    enabled: !!selectedPersona && currentStep >= 2 // Only run when persona is selected and we're on step 2+
  });
  
  // Fetch persona-specific skill questions
  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: ["/api/ai/onboarding/skills", selectedPersona],
    queryFn: async () => {
      const response = await fetch(`/api/ai/onboarding/skills/${selectedPersona}`);
      const data = await response.json();
      if (!data.success) throw new Error(data.message || "Failed to load skill questions");
      return data.questions?.questions || [];
    },
    enabled: !!selectedPersona && currentStep >= 3 // Only run when persona is selected and we're on step 3+
  });
  
  // Save user persona selection
  const savePersona = async () => {
    if (!selectedPersona || loadingPersona) return;
    
    setLoadingPersona(true);
    try {
      await apiRequest('POST', '/api/onboarding/progress', {
        persona: selectedPersona
      });
      
      // Show success toast
      toast({
        title: "Persona saved",
        description: `Your ${selectedPersona} persona has been saved.`,
        variant: "default"
      });
      
      // Move to next step
      setCurrentStep(2);
    } catch (error) {
      toast({
        title: "Failed to save persona",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setLoadingPersona(false);
    }
  };
  
  // Save user skills and interests
  const saveSkillsAndInterests = async () => {
    try {
      await apiRequest('POST', '/api/onboarding/progress', {
        skills: userSkills,
        interests: userInterests
      });
      
      // Show success toast
      toast({
        title: "Profile updated",
        description: "Your skills and interests have been saved.",
        variant: "default"
      });
      
      // Move to next step
      setCurrentStep(prevStep => prevStep + 1);
    } catch (error) {
      toast({
        title: "Failed to update profile",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };
  
  // Save onboarding progress
  const completeOnboarding = async () => {
    try {
      await apiRequest('POST', '/api/onboarding/progress', {
        stage: 5 // Mark as completed
      });
      
      // Show success toast
      toast({
        title: "Onboarding complete",
        description: "Your personalized journey is ready to begin!",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Failed to complete onboarding",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    }
  };
  
  // Add a skill to the user's profile
  const addSkill = (skill: string) => {
    if (!userSkills.includes(skill)) {
      setUserSkills([...userSkills, skill]);
    }
  };
  
  // Add an interest to the user's profile
  const addInterest = (interest: string) => {
    if (!userInterests.includes(interest)) {
      setUserInterests([...userInterests, interest]);
    }
  };
  
  // Handle skill question answers
  const handleQuestionAnswer = (questionId: string, value: string, category: string) => {
    // Find the question and selected option
    const question = questionsData?.find(q => q.id === questionId);
    if (!question) return;
    
    const option = question.options.find(o => o.value === value);
    if (!option) return;
    
    // Add the skill category to the user's skills
    addSkill(category);
  };
  
  // Component for step 1: Persona selection
  const renderPersonaSelection = () => (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Choose Your Path</CardTitle>
        <CardDescription>
          Select your primary role in the HyperDAG ecosystem to personalize your experience.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedPersona} onValueChange={setSelectedPersona} className="flex flex-col space-y-3">
          <div className={`flex items-start space-x-3 p-4 border rounded-md cursor-pointer ${selectedPersona === 'developer' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
            <RadioGroupItem value="developer" id="developer" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="developer" className="text-lg font-semibold text-blue-600 flex items-center">
                <Code className="mr-2" /> Developer
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                For those who build and code, focused on technical implementation, smart contracts, and infrastructure.
              </p>
            </div>
          </div>
          
          <div className={`flex items-start space-x-3 p-4 border rounded-md cursor-pointer ${selectedPersona === 'designer' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'}`}>
            <RadioGroupItem value="designer" id="designer" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="designer" className="text-lg font-semibold text-orange-600 flex items-center">
                <Palette className="mr-2" /> Designer
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                For those who create experiences and interfaces, focused on UX/UI, visual assets, and user journeys.
              </p>
            </div>
          </div>
          
          <div className={`flex items-start space-x-3 p-4 border rounded-md cursor-pointer ${selectedPersona === 'influencer' ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
            <RadioGroupItem value="influencer" id="influencer" className="mt-1" />
            <div className="flex-1">
              <Label htmlFor="influencer" className="text-lg font-semibold text-green-600 flex items-center">
                <Megaphone className="mr-2" /> Influencer
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                For those who connect and promote, focused on community building, content creation, and engagement.
              </p>
            </div>
          </div>
        </RadioGroup>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)} disabled={currentStep === 1}>
          Back
        </Button>
        <Button onClick={savePersona} disabled={loadingPersona || !selectedPersona}>
          {loadingPersona ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Continue
        </Button>
      </CardFooter>
    </Card>
  );
  
  // Component for step 2: Personalized features
  const renderPersonalizedFeatures = () => {
    if (featuresLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    const personaColor = getPersonaColorClass(selectedPersona);
    
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Key Features for You</CardTitle>
          <CardDescription>
            Based on your {selectedPersona} persona, here are the features you'll find most valuable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {featuresData?.map((feature: PersonaFeature, index: number) => (
              <div key={index} className={`p-4 border rounded-md ${personaColor}`}>
                <div className="flex items-center">
                  <div className="mr-3 bg-white p-2 rounded-full">
                    {iconMap[feature.icon] || <Zap className="w-5 h-5 text-primary" />}
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                </div>
                <p className="mt-2 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep(1)}>
            Back
          </Button>
          <Button onClick={() => setCurrentStep(3)}>
            Continue
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  // Component for step 3: Skill assessment
  const renderSkillAssessment = () => {
    if (questionsLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Skill Assessment</CardTitle>
          <CardDescription>
            Answer a few questions to help us personalize your experience even further.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {questionsData?.map((question: SkillQuestion) => (
              <div key={question.id} className="border p-4 rounded-md">
                <h3 className="font-semibold mb-3">{question.text}</h3>
                <RadioGroup 
                  onValueChange={(value) => handleQuestionAnswer(question.id, value, question.skillCategory)}
                  className="space-y-2"
                >
                  {question.options.map((option) => (
                    <div key={option.value} className="flex items-start space-x-2">
                      <RadioGroupItem value={option.value} id={`${question.id}-${option.value}`} className="mt-1" />
                      <div>
                        <Label htmlFor={`${question.id}-${option.value}`} className="text-sm font-medium">
                          {option.label}
                        </Label>
                      </div>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep(2)}>
            Back
          </Button>
          <Button onClick={saveSkillsAndInterests}>
            Continue
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  // Component for step 4: Personalized guide
  const renderPersonalizedGuide = () => {
    if (guideLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    if (guideError || !guideData) {
      return (
        <Card className="w-full max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Something went wrong</CardTitle>
            <CardDescription>
              We couldn't load your personalized guide. Please try again later.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setCurrentStep(3)} variant="outline">
              Go Back
            </Button>
          </CardContent>
        </Card>
      );
    }
    
    const personaColor = getPersonaColorClass(guideData.persona);
    
    return (
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Your Personalized Guide</CardTitle>
          <CardDescription>
            {guideData.welcomeMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-3">Recommended Actions</h3>
            <div className="space-y-3">
              {guideData.recommendedActions.map((action, index) => (
                <div key={index} className="flex items-start p-3 border rounded-md">
                  <div className="mr-3 mt-0.5">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary">
                      {index + 1}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium">{action.title}</h4>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold mb-3">Key Features for You</h3>
            <div className="space-y-3">
              {guideData.keyFeatures.map((feature, index) => (
                <div key={index} className={`p-3 border rounded-md flex items-start ${personaColor}`}>
                  <div className="mr-3">
                    <Progress value={feature.relevanceScore} className="w-12 h-2" />
                  </div>
                  <div>
                    <h4 className="font-medium">{feature.title}</h4>
                    <p className="text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <h3 className="font-semibold mb-2">Personalization Insights</h3>
            <p className="text-sm text-gray-700">{guideData.personalizationInsights}</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep(3)}>
            Back
          </Button>
          <Button onClick={completeOnboarding}>
            Complete Onboarding
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  // Progress indicator
  const renderProgress = () => (
    <div className="mb-8 w-full max-w-3xl mx-auto">
      <div className="flex justify-between mb-2">
        <span className="text-sm text-gray-600">Step {currentStep} of 4</span>
        <span className="text-sm font-medium">{Math.round((currentStep / 4) * 100)}% Complete</span>
      </div>
      <Progress value={(currentStep / 4) * 100} className="h-2" />
    </div>
  );
  
  // Render the appropriate step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderPersonaSelection();
      case 2:
        return renderPersonalizedFeatures();
      case 3:
        return renderSkillAssessment();
      case 4:
        return renderPersonalizedGuide();
      default:
        return null;
    }
  };
  
  return (
    <div className="py-8 px-4">
      {renderProgress()}
      {renderStep()}
    </div>
  );
}