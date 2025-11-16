import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

// Define knowledge areas with questions for each persona
const KNOWLEDGE_AREAS = {
  developer: [
    {
      id: 'blockchain',
      title: 'Blockchain Technology',
      question: 'How familiar are you with blockchain technology concepts?',
      details: 'This includes understanding consensus mechanisms, distributed ledgers, smart contracts, and cryptographic principles.',
      followupQuestion: 'Which aspects of blockchain technology interest you most?',
      followupOptions: ['Smart Contracts', 'Consensus Mechanisms', 'Tokenomics', 'Security', 'Scalability Solutions']
    },
    {
      id: 'web3',
      title: 'Web3 Development',
      question: 'How experienced are you with Web3 development?',
      details: 'This includes developing dApps, using Web3 libraries, and integrating wallet connections.',
      followupQuestion: 'Which Web3 development frameworks have you used?',
      followupOptions: ['ethers.js/web3.js', 'Hardhat/Truffle', 'Moralis', 'thirdweb', 'None yet']
    },
    {
      id: 'zkp',
      title: 'Zero-Knowledge Proofs',
      question: 'How knowledgeable are you about zero-knowledge proofs?',
      details: 'This includes understanding privacy-preserving technologies, ZK-SNARKs, ZK-STARKs, and their applications.',
      followupQuestion: 'What aspects of ZKPs are you most interested in?',
      followupOptions: ['Identity Verification', 'Private Transactions', 'Scalability', 'Voting Systems', 'Just learning']
    },
    {
      id: 'dag',
      title: 'Directed Acyclic Graphs (DAGs)',
      question: 'How well do you understand DAG-based architectures?',
      details: 'This includes knowledge of non-blockchain distributed ledgers like IOTA, Hedera, or similar technologies.',
      followupQuestion: 'What do you find most intriguing about DAG structures?',
      followupOptions: ['Scalability', 'Fee-less Transactions', 'Quantum Resistance', 'Network Design', 'Just curious']
    },
    {
      id: 'ai',
      title: 'Artificial Intelligence',
      question: 'How would you rate your AI/ML development knowledge?',
      details: 'This includes understanding machine learning models, neural networks, and AI integration with blockchain.',
      followupQuestion: 'Which AI applications in Web3 interest you most?',
      followupOptions: ['Predictive Analytics', 'Smart Contract Optimization', 'Agent Systems', 'Content Generation', 'Governance']
    }
  ],
  designer: [
    {
      id: 'web3_ux',
      title: 'Web3 UX Design',
      question: 'How familiar are you with designing for Web3 applications?',
      details: 'This includes understanding wallet interactions, transaction states, and blockchain-specific user flows.',
      followupQuestion: 'What aspects of Web3 UX do you find most challenging?',
      followupOptions: ['Wallet Integration', 'Transaction Feedback', 'Explaining Technical Concepts', 'Security Features', 'Onboarding New Users']
    },
    {
      id: 'interfaces',
      title: 'Interface Design',
      question: 'How would you rate your interface design skills?',
      details: 'This includes UI component design, information hierarchy, and visual systems.',
      followupQuestion: 'Which design systems or frameworks do you prefer?',
      followupOptions: ['Material Design', 'Apple Human Interface', 'Custom Systems', 'Fluent Design', 'Tailwind/Bootstrap']
    },
    {
      id: 'user_research',
      title: 'User Research',
      question: 'How experienced are you with user research methods?',
      details: 'This includes conducting interviews, usability testing, and synthesizing research findings.',
      followupQuestion: 'Which research methods do you typically use?',
      followupOptions: ['Interviews', 'Usability Testing', 'Surveys', 'Analytics', 'Competitive Analysis']
    },
    {
      id: 'web3',
      title: 'Web3 Knowledge',
      question: 'How well do you understand Web3 concepts?',
      details: 'This includes basic knowledge of blockchain, wallets, and decentralized applications.',
      followupQuestion: 'Which Web3 concepts are you most interested in learning more about?',
      followupOptions: ['Wallets & Keys', 'Smart Contracts', 'Tokenomics', 'NFTs', 'DAOs']
    },
    {
      id: 'accessibility',
      title: 'Accessibility Design',
      question: 'How knowledgeable are you about accessible design?',
      details: 'This includes understanding WCAG guidelines, designing for screen readers, and inclusive design principles.',
      followupQuestion: 'Which accessibility considerations do you prioritize in your work?',
      followupOptions: ['Screen Reader Support', 'Color Contrast', 'Keyboard Navigation', 'Reduced Motion', 'Clear Instructions']
    }
  ],
  influencer: [
    {
      id: 'crypto_community',
      title: 'Crypto Community',
      question: 'How connected are you to crypto/Web3 communities?',
      details: 'This includes participation in Discord servers, Twitter/X spaces, and other Web3 social platforms.',
      followupQuestion: 'Which Web3 communities are you most active in?',
      followupOptions: ['Twitter/X', 'Discord', 'Telegram', 'Reddit', 'In-person Events']
    },
    {
      id: 'web3',
      title: 'Web3 Knowledge',
      question: 'How would you rate your understanding of Web3 concepts?',
      details: 'This includes basic knowledge of blockchain, DeFi, NFTs, and other Web3 innovations.',
      followupQuestion: 'Which Web3 topics do you most enjoy discussing?',
      followupOptions: ['DeFi', 'NFTs', 'DAOs', 'Layer 2 Solutions', 'Regulation & Adoption']
    },
    {
      id: 'content_creation',
      title: 'Content Creation',
      question: 'How experienced are you with creating educational content?',
      details: 'This includes creating articles, videos, infographics, or other educational materials.',
      followupQuestion: 'Which content formats do you prefer creating?',
      followupOptions: ['Video', 'Written Articles', 'Twitter/X Threads', 'Visuals/Infographics', 'Audio/Podcasts']
    },
    {
      id: 'community_building',
      title: 'Community Building',
      question: 'How would you rate your community building skills?',
      details: 'This includes growing and nurturing online communities, moderating discussions, and creating engagement.',
      followupQuestion: 'What community building strategies have worked best for you?',
      followupOptions: ['Regular Events', 'AMAs', 'Educational Content', 'Contests/Rewards', 'Collaborative Projects']
    },
    {
      id: 'analytics',
      title: 'Growth Analytics',
      question: 'How familiar are you with social media analytics and growth metrics?',
      details: 'This includes understanding engagement rates, conversion metrics, and audience growth strategies.',
      followupQuestion: 'Which metrics do you find most valuable for measuring success?',
      followupOptions: ['Engagement Rate', 'Conversion Rate', 'Audience Growth', 'Retention', 'Sentiment Analysis']
    }
  ]
};

// Common knowledge areas across all personas
const COMMON_KNOWLEDGE_AREAS = [
  {
    id: 'crypto',
    title: 'Cryptocurrency',
    question: 'How familiar are you with cryptocurrencies and tokens?',
    details: 'This includes understanding different types of cryptocurrencies, tokens, and their use cases.',
    followupQuestion: 'Which aspects of cryptocurrency interest you most?',
    followupOptions: ['Investment', 'Technology', 'Economic Impact', 'Governance', 'Privacy Features']
  },
  {
    id: 'defi',
    title: 'Decentralized Finance (DeFi)',
    question: 'How would you rate your understanding of DeFi?',
    details: 'This includes knowledge of lending protocols, DEXs, yield farming, and other DeFi applications.',
    followupQuestion: 'Which DeFi applications do you find most compelling?',
    followupOptions: ['Lending/Borrowing', 'DEXs', 'Yield Optimization', 'Insurance', 'Stablecoins']
  }
];

interface KnowledgeAssessmentProps {
  persona: 'developer' | 'designer' | 'influencer';
  onComplete: (scores: Record<string, number>, interests: Record<string, string[]>) => void;
  onBack?: () => void;
}

export default function KnowledgeAssessment({ persona, onComplete, onBack }: KnowledgeAssessmentProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAreaIndex, setCurrentAreaIndex] = useState(0);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [interests, setInterests] = useState<Record<string, string[]>>({});
  const [showFollowUp, setShowFollowUp] = useState(false);
  
  // Combine persona-specific areas with common areas
  const allAreas = [...KNOWLEDGE_AREAS[persona], ...COMMON_KNOWLEDGE_AREAS];
  const currentArea = allAreas[currentAreaIndex];
  
  // Calculate progress percentage
  const progress = ((currentAreaIndex + (showFollowUp ? 0.5 : 0)) / allAreas.length) * 100;
  
  const handleScoreChange = (value: number[]) => {
    setScores({ ...scores, [currentArea.id]: value[0] });
  };
  
  const handleContinue = () => {
    if (!scores[currentArea.id]) {
      toast({
        title: "Please provide an answer",
        description: "Drag the slider to indicate your knowledge level.",
        variant: "destructive"
      });
      return;
    }
    
    if (showFollowUp) {
      // Moving to next question
      if (currentAreaIndex < allAreas.length - 1) {
        setCurrentAreaIndex(currentAreaIndex + 1);
        setShowFollowUp(false);
      } else {
        // All questions completed, submit assessment
        handleSubmit();
      }
    } else {
      // Show follow-up question
      setShowFollowUp(true);
    }
  };
  
  const handleBack = () => {
    if (showFollowUp) {
      setShowFollowUp(false);
    } else if (currentAreaIndex > 0) {
      setCurrentAreaIndex(currentAreaIndex - 1);
      setShowFollowUp(true);
    } else if (onBack) {
      onBack();
    }
  };
  
  const handleInterestToggle = (interest: string) => {
    const currentInterests = interests[currentArea.id] || [];
    if (currentInterests.includes(interest)) {
      setInterests({
        ...interests,
        [currentArea.id]: currentInterests.filter(i => i !== interest)
      });
    } else {
      setInterests({
        ...interests,
        [currentArea.id]: [...currentInterests, interest]
      });
    }
  };
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Format the data for the backend
      const formattedInterests: Record<string, string[]> = {};
      Object.keys(interests).forEach(areaId => {
        if (interests[areaId]?.length > 0) {
          formattedInterests[areaId] = interests[areaId];
        }
      });
      
      // Submit assessment to backend and get back unlocked features
      const response = await apiRequest('POST', '/api/onboarding/knowledge-assessment', { 
        scores, 
        interests: formattedInterests 
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Call the onComplete callback with the results
        onComplete(scores, formattedInterests);
        
        // Show a toast with newly unlocked features if any
        if (data.unlockedFeatures && data.unlockedFeatures.length > 0) {
          toast({
            title: "New features unlocked!",
            description: `You've unlocked ${data.unlockedFeatures.length} new features based on your knowledge.`,
            variant: "default"
          });
        }
      } else {
        throw new Error(data.message || "Failed to save assessment");
      }
    } catch (error) {
      toast({
        title: "Error saving assessment",
        description: error instanceof Error ? error.message : "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg animate-fadeIn">
      <CardHeader>
        <CardTitle className="text-center">Knowledge Assessment</CardTitle>
        <CardDescription className="text-center">
          Help us personalize your experience by sharing your knowledge level in these areas.
          This helps us show you the most relevant features and content.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        {showFollowUp ? (
          <div className="space-y-4 animate-fadeIn">
            <div>
              <h3 className="text-lg font-semibold">{currentArea.title}</h3>
              <p className="text-muted-foreground">{currentArea.followupQuestion}</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentArea.followupOptions.map(option => (
                <Button
                  key={option}
                  variant={interests[currentArea.id]?.includes(option) ? "default" : "outline"}
                  onClick={() => handleInterestToggle(option)}
                  className="h-auto py-3 justify-start text-left"
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fadeIn">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor={`rating-${currentArea.id}`} className="text-lg font-semibold">
                  {currentArea.title}
                </Label>
                <span className="font-medium">
                  {!scores[currentArea.id] ? "-" : getKnowledgeLevelLabel(scores[currentArea.id])}
                </span>
              </div>
              <p className="text-muted-foreground mb-4">{currentArea.question}</p>
              <p className="text-sm text-muted-foreground italic">{currentArea.details}</p>
            </div>
            
            <div className="py-4">
              <Slider
                id={`rating-${currentArea.id}`}
                defaultValue={scores[currentArea.id] ? [scores[currentArea.id]] : [1]}
                max={5}
                min={1}
                step={1}
                onValueChange={handleScoreChange}
              />
              
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>Beginner</span>
                <span>Intermediate</span>
                <span>Expert</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between border-t p-4">
        <Button 
          variant="ghost" 
          onClick={handleBack}
          disabled={isSubmitting}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        <Button 
          onClick={handleContinue}
          disabled={isSubmitting || (showFollowUp && !interests[currentArea.id]?.length)}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              {currentAreaIndex === allAreas.length - 1 && showFollowUp ? "Complete" : "Continue"}
              <ChevronRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Helper function to convert numeric score to text label
function getKnowledgeLevelLabel(score: number): string {
  switch (score) {
    case 1: return "Beginner";
    case 2: return "Basic";
    case 3: return "Intermediate";
    case 4: return "Advanced";
    case 5: return "Expert";
    default: return "Unknown";
  }
}