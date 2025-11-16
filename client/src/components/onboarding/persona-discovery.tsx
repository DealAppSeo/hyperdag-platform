import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Shield, Heart, Users, Lightbulb, Award, Code, ChevronRight, Info } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PersonaQuestion {
  id: string;
  question: string;
  options: Array<{
    value: string;
    label: string;
    icon?: string;
    description?: string;
  }>;
  category: string;
}

interface DidYouKnowFact {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  category: 'security' | 'transparency' | 'community';
}

export function PersonaDiscovery() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showDidYouKnow, setShowDidYouKnow] = useState(false);
  const [currentFact, setCurrentFact] = useState<DidYouKnowFact | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const questions: PersonaQuestion[] = [
    {
      id: 'identity',
      question: 'Who do you most identify as?',
      category: 'role',
      options: [
        {
          value: 'nonprofit',
          label: 'Nonprofit Leader',
          icon: 'Heart',
          description: 'Leading or working with organizations focused on social impact'
        },
        {
          value: 'business_owner',
          label: 'Business Owner',
          icon: 'Users',
          description: 'Running or managing a business or startup'
        },
        {
          value: 'aspiring_entrepreneur',
          label: 'Aspiring Entrepreneur',
          icon: 'Lightbulb',
          description: 'Looking to start your own venture or project'
        },
        {
          value: 'developer',
          label: 'Developer/Tech Professional',
          icon: 'Code',
          description: 'Building technology solutions and applications'
        },
        {
          value: 'student_learner',
          label: 'Student/Learner',
          icon: 'Award',
          description: 'Currently learning and developing new skills'
        }
      ]
    },
    {
      id: 'passion',
      question: 'What are you most passionate about?',
      category: 'motivation',
      options: [
        {
          value: 'family_friends',
          label: 'Family & Friends',
          description: 'Building strong personal relationships and community connections'
        },
        {
          value: 'work_career',
          label: 'Work & Career',
          description: 'Professional growth and career advancement'
        },
        {
          value: 'faith_spirituality',
          label: 'Faith & Spirituality',
          description: 'Spiritual growth and faith-based activities'
        },
        {
          value: 'learning_growth',
          label: 'Learning & Growth',
          description: 'Continuous education and personal development'
        },
        {
          value: 'social_impact',
          label: 'Social Impact',
          description: 'Making a positive difference in the world'
        }
      ]
    },
    {
      id: 'goals',
      question: 'What would you like help with?',
      category: 'objectives',
      options: [
        {
          value: 'making_impact',
          label: 'Making an Impact',
          description: 'Creating meaningful change in your community or field'
        },
        {
          value: 'leaving_legacy',
          label: 'Leaving a Legacy',
          description: 'Building something that will last beyond your lifetime'
        },
        {
          value: 'helping_others',
          label: 'Helping Others',
          description: 'Mentoring, coaching, and supporting others in their journey'
        },
        {
          value: 'learning_skills',
          label: 'Learning New Skills',
          description: 'Acquiring knowledge and capabilities for personal growth'
        },
        {
          value: 'building_network',
          label: 'Building My Network',
          description: 'Connecting with like-minded individuals and collaborators'
        }
      ]
    },
    {
      id: 'engagement_style',
      question: 'How do you prefer to engage with others?',
      category: 'interaction',
      options: [
        {
          value: 'mentor',
          label: 'As a Mentor/Coach',
          description: 'I enjoy sharing knowledge and guiding others'
        },
        {
          value: 'mentee',
          label: 'As a Mentee/Learner',
          description: 'I seek guidance and learning opportunities from others'
        },
        {
          value: 'collaborator',
          label: 'As a Collaborator',
          description: 'I prefer working together as equals on shared goals'
        },
        {
          value: 'connector',
          label: 'As a Connector',
          description: 'I like bringing people together and facilitating relationships'
        }
      ]
    }
  ];

  const didYouKnowFacts: DidYouKnowFact[] = [
    {
      id: 'security',
      icon: <Shield className="h-5 w-5 text-blue-600" />,
      title: 'Military-Grade Security',
      description: 'All your personal information on HyperDAG is protected with AES-256 military-grade encryption - the same security standard used by government agencies and major financial institutions.',
      category: 'security'
    },
    {
      id: 'opensource',
      icon: <Code className="h-5 w-5 text-green-600" />,
      title: 'Fully Open Source',
      description: 'HyperDAG is completely open source, meaning our code is transparent and auditable by anyone. You can see exactly how your data is handled and contribute to the platform\'s development.',
      category: 'transparency'
    },
    {
      id: 'founders',
      icon: <Users className="h-5 w-5 text-purple-600" />,
      title: 'Zero Equity Founders',
      description: 'HyperDAG\'s founders have taken zero equity in the platform. They can only earn value the same way everyone else does - by providing value to the ecosystem. This ensures complete alignment with the community.',
      category: 'community'
    },
    {
      id: 'privacy',
      icon: <Shield className="h-5 w-5 text-indigo-600" />,
      title: 'Privacy by Design',
      description: 'Your data belongs to you. We use zero-knowledge proofs and privacy-preserving technologies so you can verify your credentials without revealing sensitive information.',
      category: 'security'
    }
  ];

  const getRandomFact = () => {
    const randomIndex = Math.floor(Math.random() * didYouKnowFacts.length);
    return didYouKnowFacts[randomIndex];
  };

  const handleAnswer = (value: string) => {
    const newAnswers = { ...answers, [questions[currentQuestionIndex].id]: value };
    setAnswers(newAnswers);

    // Show "Did you know?" fact after every 2 questions
    if ((currentQuestionIndex + 1) % 2 === 0 && currentQuestionIndex < questions.length - 1) {
      setCurrentFact(getRandomFact());
      setShowDidYouKnow(true);
    } else {
      proceedToNext();
    }
  };

  const proceedToNext = () => {
    setShowDidYouKnow(false);
    setCurrentFact(null);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      handleSubmitAnswers();
    }
  };

  const handleSubmitAnswers = async () => {
    setIsSubmitting(true);
    try {
      // Determine persona based on answers
      const persona = determinePersona(answers);
      
      await apiRequest('POST', '/api/onboarding/persona-discovery', {
        answers,
        detectedPersona: persona,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Profile updated successfully",
        description: `Your ${persona} persona has been saved. We'll use this to personalize your HyperDAG experience.`
      });

      // Move to next onboarding step
      window.location.href = '/onboarding';
      
    } catch (error) {
      toast({
        title: "Failed to save profile",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const determinePersona = (answers: Record<string, string>) => {
    const identity = answers.identity;
    const goals = answers.goals;
    const engagement = answers.engagement_style;

    // Logic to determine persona based on answers
    if (identity === 'nonprofit' || goals === 'making_impact') return 'social_impact_leader';
    if (identity === 'business_owner' && engagement === 'mentor') return 'business_mentor';
    if (identity === 'developer' || identity === 'aspiring_entrepreneur') return 'tech_innovator';
    if (engagement === 'mentee' || goals === 'learning_skills') return 'aspiring_learner';
    if (engagement === 'mentor' || goals === 'helping_others') return 'community_mentor';
    if (engagement === 'connector') return 'ecosystem_connector';
    
    return 'community_builder'; // default
  };

  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const currentQuestion = questions[currentQuestionIndex];

  if (showDidYouKnow && currentFact) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {currentFact.icon}
            </div>
            <CardTitle className="text-xl font-bold text-blue-900">
              Did You Know?
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {currentFact.title}
            </h3>
            <p className="text-gray-700 leading-relaxed">
              {currentFact.description}
            </p>
            <Button 
              onClick={proceedToNext}
              className="w-full mt-6"
            >
              Continue <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Let's Get to Know You
          </h1>
          <span className="text-sm text-gray-500">
            {currentQuestionIndex + 1} of {questions.length}
          </span>
        </div>
        <Progress value={progress} className="w-full" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {currentQuestion.question}
          </CardTitle>
          <CardDescription>
            This helps us personalize your HyperDAG experience and connect you with the right opportunities.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={answers[currentQuestion.id] || ''}
            onValueChange={handleAnswer}
            className="space-y-4"
          >
            {currentQuestion.options.map((option) => (
              <div key={option.value} className="flex items-start space-x-3">
                <RadioGroupItem
                  value={option.value}
                  id={option.value}
                  className="mt-1"
                />
                <Label
                  htmlFor={option.value}
                  className="flex-1 cursor-pointer"
                >
                  <div className="font-medium text-gray-900">
                    {option.label}
                  </div>
                  {option.description && (
                    <div className="text-sm text-gray-600 mt-1">
                      {option.description}
                    </div>
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {currentQuestionIndex === 0 && (
            <Alert className="mt-6 border-green-200 bg-green-50">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-green-800">
                <strong>Your privacy is our priority.</strong> All information you share is encrypted with military-grade AES-256 security and stored securely.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {isSubmitting && (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span className="text-gray-600">Saving your preferences...</span>
          </div>
        </div>
      )}
    </div>
  );
}