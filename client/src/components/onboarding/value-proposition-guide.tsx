import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Brain, 
  Network, 
  Users, 
  Zap, 
  Lock, 
  Globe,
  ArrowRight,
  CheckCircle,
  Star,
  Lightbulb,
  Target,
  Gift
} from 'lucide-react';

interface ValuePropositionGuideProps {
  onComplete: () => void;
  currentStep?: number;
}

export function ValuePropositionGuide({ onComplete, currentStep = 0 }: ValuePropositionGuideProps) {
  const [activeStep, setActiveStep] = useState(currentStep);

  const valueSteps = [
    {
      id: 'privacy',
      title: 'Privacy-First Technology',
      icon: Shield,
      description: 'Your Identity, Your Control',
      content: {
        problem: 'Traditional platforms expose your personal data and activities',
        solution: 'HyperDAG uses zero-knowledge proofs to protect your identity while building reputation',
        benefits: [
          'Complete anonymity while maintaining verifiable reputation',
          'Quantum-resistant encryption protects against future threats',
          'You control what data to share and with whom'
        ],
        realWorld: 'Apply for grants anonymously while proving your track record'
      }
    },
    {
      id: 'ai',
      title: 'AI-Powered Intelligence',
      icon: Brain,
      description: 'Work Smarter, Not Harder',
      content: {
        problem: 'Finding relevant opportunities and optimizing projects takes too much time',
        solution: 'Our AI automatically matches you with grants, teammates, and optimizes your workflows',
        benefits: [
          'Automatic grant matching based on your skills and interests',
          'Smart contract optimization reduces gas costs by up to 40%',
          'Personalized recommendations for team building and collaboration'
        ],
        realWorld: 'Get notified about $50K grant opportunities that match your project perfectly'
      }
    },
    {
      id: 'interoperability',
      title: 'Cross-Chain Freedom',
      icon: Network,
      description: 'One Platform, All Blockchains',
      content: {
        problem: 'Managing multiple wallets and platforms for different blockchains is complex',
        solution: 'Our hybrid DAG architecture connects all major blockchains seamlessly',
        benefits: [
          'Access Ethereum, Polygon, Solana, and more from one interface',
          'Automatic cross-chain transaction routing',
          'Unified reputation across all networks'
        ],
        realWorld: 'Deploy your dApp on multiple chains with a single click'
      }
    },
    {
      id: 'collaboration',
      title: 'Decentralized Collaboration',
      icon: Users,
      description: 'Build the Future Together',
      content: {
        problem: 'Finding skilled team members and collaborators in Web3 is challenging',
        solution: 'Connect with verified builders through our reputation-based matching system',
        benefits: [
          'Skill-based matching with verified developers and creators',
          'Decentralized project management with built-in incentives',
          'Community-driven quality assurance and peer review'
        ],
        realWorld: 'Find a Solidity developer with 5+ years experience for your DeFi project'
      }
    }
  ];

  const getStepProgress = () => ((activeStep + 1) / valueSteps.length) * 100;

  const currentStepData = valueSteps[activeStep];
  const Icon = currentStepData.icon;

  const handleNext = () => {
    if (activeStep < valueSteps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">Discover HyperDAG's Power</h2>
            <p className="text-gray-600">Learn how our technology transforms Web3 collaboration</p>
          </div>
          <Badge variant="outline">
            Step {activeStep + 1} of {valueSteps.length}
          </Badge>
        </div>
        <Progress value={getStepProgress()} className="h-2" />
      </div>

      {/* Step Navigation */}
      <div className="flex space-x-2 mb-8 overflow-x-auto">
        {valueSteps.map((step, index) => {
          const StepIcon = step.icon;
          const isActive = index === activeStep;
          const isCompleted = index < activeStep;
          
          return (
            <button
              key={step.id}
              onClick={() => setActiveStep(index)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                isActive 
                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' 
                  : isCompleted
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {isCompleted ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <StepIcon className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">{step.title}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content */}
      <Card className="mb-8">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Icon className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
          <CardDescription className="text-lg">{currentStepData.description}</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Problem/Solution */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <Target className="h-4 w-4 text-red-600" />
                </div>
                <h3 className="font-semibold text-red-700">The Problem</h3>
              </div>
              <p className="text-gray-600 pl-10">{currentStepData.content.problem}</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Lightbulb className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="font-semibold text-green-700">Our Solution</h3>
              </div>
              <p className="text-gray-600 pl-10">{currentStepData.content.solution}</p>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500" />
              <h3 className="font-semibold">Key Benefits</h3>
            </div>
            <div className="grid gap-3">
              {currentStepData.content.benefits.map((benefit, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span className="text-blue-800">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Real World Example */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <Gift className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-purple-700">Real-World Impact</h3>
            </div>
            <p className="text-purple-800 font-medium">
              "{currentStepData.content.realWorld}"
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={activeStep === 0}
        >
          Previous
        </Button>

        <div className="flex space-x-2">
          {valueSteps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === activeStep 
                  ? 'bg-blue-600 w-8' 
                  : index < activeStep 
                    ? 'bg-green-500' 
                    : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        <Button onClick={handleNext} className="bg-gradient-to-r from-blue-600 to-purple-600">
          {activeStep === valueSteps.length - 1 ? 'Get Started' : 'Next'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">99.9%</div>
          <div className="text-sm text-gray-600">Privacy Protected</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">$2M+</div>
          <div className="text-sm text-gray-600">Grants Matched</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">8</div>
          <div className="text-sm text-gray-600">Blockchains</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">1000+</div>
          <div className="text-sm text-gray-600">Active Builders</div>
        </div>
      </div>
    </div>
  );
}