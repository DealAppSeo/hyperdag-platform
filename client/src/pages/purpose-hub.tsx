import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowRight, Heart, Target, Users, FileText, Brain, CheckCircle, Star, Zap, Trophy, Mic } from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

interface FlowStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: 'pending' | 'active' | 'completed';
  path: string;
  estimatedTime: string;
}

const PurposeHub: React.FC = () => {
  const { user } = useAuth();
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  const flowSteps: FlowStep[] = [
    {
      id: 1,
      title: "Discover Your Purpose",
      description: "Explore causes that align with your values and passions. Find what drives you to make a difference.",
      icon: <Heart className="h-6 w-6" />,
      status: completedSteps.includes(1) ? 'completed' : 'active',
      path: '/purposes',
      estimatedTime: "3-5 min"
    },
    {
      id: 2,
      title: "Connect with Nonprofits",
      description: "Browse verified organizations working on causes you care about. See their impact and needs.",
      icon: <Target className="h-6 w-6" />,
      status: completedSteps.includes(2) ? 'completed' : completedSteps.includes(1) ? 'active' : 'pending',
      path: '/nonprofits',
      estimatedTime: "5-10 min"
    },
    {
      id: 3,
      title: "Find Aligned Grants",
      description: "Discover funding opportunities that match your purpose and the causes you want to support.",
      icon: <FileText className="h-6 w-6" />,
      status: completedSteps.includes(3) ? 'completed' : completedSteps.includes(2) ? 'active' : 'pending',
      path: '/grantflow',
      estimatedTime: "10-15 min"
    },
    {
      id: 4,
      title: "Join Hackathons",
      description: "Participate in hackathons to prototype solutions, win prizes, and build your reputation while creating real impact.",
      icon: <Trophy className="h-6 w-6" />,
      status: completedSteps.includes(4) ? 'completed' : completedSteps.includes(3) ? 'active' : 'pending',
      path: '/hackathons',
      estimatedTime: "2-7 days"
    },
    {
      id: 5,
      title: "Build Your Dream Team",
      description: "Connect with like-minded people who share your mission and complement your skills for long-term collaboration.",
      icon: <Users className="h-6 w-6" />,
      status: completedSteps.includes(5) ? 'completed' : completedSteps.includes(4) ? 'active' : 'pending',
      path: '/hypercrowd',
      estimatedTime: "15-20 min"
    },
    {
      id: 6,
      title: "Complete Your Profile",
      description: "Define your role: Are you a mentor/mentee, trainer/trainee, or coach/assistant?",
      icon: <Star className="h-6 w-6" />,
      status: completedSteps.includes(6) ? 'completed' : completedSteps.includes(5) ? 'active' : 'pending',
      path: '/profile/roles',
      estimatedTime: "5-8 min"
    },
    {
      id: 7,
      title: "Get AI Recommendations",
      description: user ? "Receive personalized opportunities, connections, and projects combining all the above features with AI optimizing it to be tailored to your journey. Our intelligent system analyzes your purpose, nonprofit interests, grant matches, hackathon preferences, team dynamics, and profile completeness to deliver hyper-relevant recommendations that accelerate your impact." : "Sign up to unlock AI-powered matching and personalized recommendations that combine purpose discovery, grant opportunities, team connections, and hackathon suggestions into an intelligent system tailored specifically to your social impact journey.",
      icon: <Brain className="h-6 w-6" />,
      status: completedSteps.includes(7) ? 'completed' : completedSteps.includes(6) ? 'active' : 'pending',
      path: user ? '/dashboard' : '/auth',
      estimatedTime: "Ongoing"
    }
  ];

  const progressPercentage = (completedSteps.length / flowSteps.length) * 100;

  const getStepStatusColor = (status: FlowStep['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white';
      case 'active': return 'bg-blue-500 text-white';
      case 'pending': return 'bg-gray-200 text-gray-600';
    }
  };

  const getStepBorderColor = (status: FlowStep['status']) => {
    switch (status) {
      case 'completed': return 'border-green-500';
      case 'active': return 'border-blue-500';
      case 'pending': return 'border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8 sm:py-12 md:py-16">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <div className="inline-block bg-gradient-to-r from-blue-100 to-green-100 text-blue-800 font-bold px-6 py-3 text-lg rounded-full mb-6">
            🎯 PURPOSEHUB
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent leading-tight">
            Discover Your Purpose<br/>Create Your Impact
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
            A guided journey from purpose discovery to meaningful action. 
            Connect with causes, find funding, build teams, and let AI amplify your impact.
          </p>
          
          {/* Magical Onboarding Button */}
          <div className="mb-8 sm:mb-12">
            <Button 
              onClick={() => setShowOnboarding(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-full text-lg shadow-lg transform hover:scale-105 transition-all duration-300"
            >
              <Mic className="mr-2 h-6 w-6" />
              🎤 Start Journey
            </Button>
            <p className="text-sm text-gray-500 mt-2">Experience the magical onboarding flow</p>
          </div>
          
          {/* Progress Overview */}
          <div className="bg-white rounded-xl p-4 sm:p-6 max-w-2xl mx-auto mb-8 sm:mb-12 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h3 className="text-base sm:text-lg font-semibold text-gray-700">Your Progress</h3>
              <Badge variant="outline" className="text-blue-600 self-start sm:self-auto">
                {completedSteps.length} of {flowSteps.length} steps completed
              </Badge>
            </div>
            <Progress value={progressPercentage} className="h-3 mb-2" />
            <p className="text-sm text-gray-600">
              {progressPercentage === 100 
                ? "Journey complete! Keep making impact." 
                : `${Math.round(progressPercentage)}% complete - Keep going!`}
            </p>
          </div>
        </div>

        {/* Journey Flow */}
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 text-gray-800">Your Purpose-Driven Journey</h2>
          
          <div className="space-y-6 mb-8 sm:mb-12">
            {/* First 6 steps in grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {flowSteps.slice(0, 6).map((step, index) => (
                <Card key={step.id} className={`relative transition-all duration-300 hover:shadow-lg ${getStepBorderColor(step.status)} border-2 h-full`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 sm:p-3 rounded-full ${getStepStatusColor(step.status)}`}>
                        {step.status === 'completed' ? <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" /> : step.icon}
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {step.estimatedTime}
                      </Badge>
                    </div>
                    <CardTitle className="text-base sm:text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <CardDescription className="text-gray-600 mb-4 text-sm leading-relaxed flex-1">
                      {step.description}
                    </CardDescription>
                    
                    <Link href={step.path}>
                      <Button 
                        className={`w-full text-sm ${
                          step.status === 'completed' 
                            ? 'bg-green-500 hover:bg-green-600' 
                            : step.status === 'active'
                            ? 'bg-blue-500 hover:bg-blue-600'
                            : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                        disabled={step.status === 'pending'}
                      >
                        {step.status === 'completed' ? 'Review' : step.status === 'active' ? 'Start' : 'Locked'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                  
                  {/* Step Number */}
                  <div className="absolute -top-2 -left-2 sm:-top-3 sm:-left-3 bg-white border-2 border-gray-200 rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold text-gray-600">
                    {step.id}
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Step 7 (AI Recommendations) spans full width */}
            {flowSteps.slice(6).map((step) => (
              <Card key={step.id} className={`relative transition-all duration-300 hover:shadow-lg ${getStepBorderColor(step.status)} border-2`}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 sm:p-3 rounded-full ${getStepStatusColor(step.status)}`}>
                        {step.status === 'completed' ? <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6" /> : step.icon}
                      </div>
                      <CardTitle className="text-base sm:text-lg">{step.title}</CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs self-start sm:self-auto">
                      {step.estimatedTime}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600 mb-6 text-sm leading-relaxed">
                    {step.description}
                  </CardDescription>
                  
                  {step.id === 7 && !user ? (
                    <Link href="/auth">
                      <Button className="w-full bg-purple-500 hover:bg-purple-600 text-sm sm:text-base">
                        Sign Up for AI Matching
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Link href={step.path}>
                      <Button 
                        className={`w-full text-sm sm:text-base ${
                          step.status === 'completed' 
                            ? 'bg-green-500 hover:bg-green-600' 
                            : step.status === 'active'
                            ? 'bg-blue-500 hover:bg-blue-600'
                            : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                        disabled={step.status === 'pending' && step.id !== 7}
                      >
                        {step.status === 'completed' ? 'Review' : step.status === 'active' ? 'Start' : step.id === 7 && !user ? 'Sign Up Required' : 'Locked'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
                
                {/* Step Number */}
                <div className="absolute -top-2 -left-2 sm:-top-3 sm:-left-3 bg-white border-2 border-gray-200 rounded-full w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center text-xs sm:text-sm font-bold text-gray-600">
                  {step.id}
                </div>
              </Card>
            ))}
          </div>

          {/* Philosophy Section */}
          <div className="bg-white rounded-xl p-4 sm:p-6 md:p-8 mb-8 sm:mb-12 shadow-lg">
            <h3 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6 text-gray-800">Help Someone, Help Someone</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 text-center">
              <div className="p-3 sm:p-4">
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🌱</div>
                <h4 className="font-semibold text-gray-700 mb-2 text-sm sm:text-base">Discover & Connect</h4>
                <p className="text-xs sm:text-sm text-gray-600">Find causes that resonate with your values and connect with organizations making real impact.</p>
              </div>
              <div className="p-3 sm:p-4">
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">🤝</div>
                <h4 className="font-semibold text-gray-700 mb-2 text-sm sm:text-base">Build & Create</h4>
                <p className="text-xs sm:text-sm text-gray-600">Secure funding, build teams, and create solutions that address real-world challenges.</p>
              </div>
              <div className="p-3 sm:p-4">
                <div className="text-2xl sm:text-3xl mb-2 sm:mb-3">♾️</div>
                <h4 className="font-semibold text-gray-700 mb-2 text-sm sm:text-base">Multiply Impact</h4>
                <p className="text-xs sm:text-sm text-gray-600">Mentor others, share knowledge, and create a viral loop of positive change.</p>
              </div>
            </div>
          </div>

          {/* Role Selection Preview */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 sm:p-6 md:p-8 mb-8 sm:mb-12">
            <h3 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6 text-gray-800">Define Your Impact Role</h3>
            <p className="text-center text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">Choose how you want to contribute to the ecosystem. You can select multiple roles.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-white rounded-lg p-4 sm:p-6 text-center">
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🎓</div>
                <h4 className="font-semibold text-gray-700 mb-2 text-sm sm:text-base">Mentor ↔ Mentee</h4>
                <p className="text-xs sm:text-sm text-gray-600">Share expertise or learn from experienced professionals in your field.</p>
              </div>
              <div className="bg-white rounded-lg p-4 sm:p-6 text-center">
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">⚡</div>
                <h4 className="font-semibold text-gray-700 mb-2 text-sm sm:text-base">Trainer ↔ Trainee</h4>
                <p className="text-xs sm:text-sm text-gray-600">Provide skill-based training or develop new competencies through structured learning.</p>
              </div>
              <div className="bg-white rounded-lg p-4 sm:p-6 text-center">
                <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🚀</div>
                <h4 className="font-semibold text-gray-700 mb-2 text-sm sm:text-base">Coach ↔ Assistant</h4>
                <p className="text-xs sm:text-sm text-gray-600">Guide strategic decisions or support leaders in achieving their goals.</p>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-xl p-4 sm:p-6 md:p-8 text-white">
              <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Ready to Begin Your Purpose Journey?</h3>
              <p className="text-blue-100 mb-6 text-sm sm:text-base">Join thousands of change-makers who are using PurposeHub to create meaningful impact.</p>
              
              <div className="flex flex-col gap-4 justify-center">
                <Link href="/purposes">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 w-full sm:w-auto text-sm sm:text-base">
                    Start Your Journey
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </Link>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 w-full">
                  <Link href="/features">
                    <Button size="sm" variant="outline" className="border-white bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700 w-full text-xs sm:text-sm px-2 sm:px-3 py-2 h-auto min-h-[2.5rem]">
                      Learn Features
                    </Button>
                  </Link>
                  <Link href="/user-stories">
                    <Button size="sm" variant="outline" className="border-white bg-white text-green-600 hover:bg-green-50 hover:text-green-700 w-full text-xs sm:text-sm px-2 sm:px-3 py-2 h-auto min-h-[2.5rem]">
                      Success Stories
                    </Button>
                  </Link>
                  <Link href="/hackathons">
                    <Button size="sm" variant="outline" className="border-white bg-white text-purple-600 hover:bg-purple-50 hover:text-purple-700 w-full text-xs sm:text-sm px-2 sm:px-3 py-2 h-auto min-h-[2.5rem]">
                      Hackathons
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Magical Onboarding Flow Overlay */}
      {showOnboarding && (
        <OnboardingFlow 
          onComplete={(userData) => {
            console.log('Onboarding completed with data:', userData);
            setShowOnboarding(false);
            // Could integrate this data with user profile or preferences
          }}
        />
      )}
    </div>
  );
};

export default PurposeHub;