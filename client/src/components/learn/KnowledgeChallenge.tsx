import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Lightbulb, 
  Check, 
  Brain, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Gift
} from 'lucide-react';
import { motion } from 'framer-motion';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export function KnowledgeChallenge() {
  const [stage, setStage] = useState<'question' | 'thinking' | 'result'>('question');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [thinkingProgress, setThinkingProgress] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const { toast } = useToast();
  
  const { data: challenge, isLoading, error } = useQuery({
    queryKey: ['/api/learn/daily-challenge'],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', '/api/learn/daily-challenge');
        return await res.json?.() || res;
      } catch (error) {
        console.error('Error fetching challenge:', error);
        // Return example data if API endpoint isn't available yet
        return {
          id: 'web3-basics-1',
          topic: 'Web3 & Blockchain',
          question: 'What is the main advantage of Directed Acyclic Graph (DAG) over traditional blockchain?',
          answers: [
            'Lower transaction fees',
            'Faster transaction finality with parallel processing',
            'Better security features',
            'Improved smart contract capabilities'
          ],
          correctAnswer: 1,
          explanation: 'DAGs allow for parallel transaction processing rather than sequential blocks, which significantly improves throughput and transaction finality times. While DAGs can also offer lower fees, the primary technical advantage is the parallel processing architecture.',
          funFact: 'Some DAG-based networks can handle thousands of transactions per second compared to traditional blockchains that process only dozens.',
          relevance: 'Understanding DAG technology is crucial for HyperDAG\'s architecture and helps you evaluate different blockchain technologies for your projects.',
          rewardDescription: '50 reputation points and unlock of the "Blockchain Architect" badge',
          rewardPoints: 50,
          rewardBadge: 'blockchain-architect'
        };
      }
    }
  });
  
  const submitAnswer = () => {
    if (selectedAnswer === null) return;
    
    setStage('thinking');
    // Simulate AI thinking with variable speed progress bar
    simulateThinking(() => {
      setStage('result');
    });
  };
  
  const simulateThinking = (onComplete: () => void) => {
    let progress = 0;
    const totalDuration = 3000; // 3 seconds total
    const interval = 100; // Update every 100ms
    const steps = totalDuration / interval;
    
    // Show hint halfway through
    setTimeout(() => setShowHint(true), totalDuration / 2);
    
    const intervalId = setInterval(() => {
      // Non-linear progress with "thinking" moments
      const step = (1 / steps) * (0.5 + Math.random() * 1.5);
      progress += step;
      
      if (progress >= 1) {
        clearInterval(intervalId);
        setThinkingProgress(1);
        setTimeout(onComplete, 500);
      } else {
        // Occasionally pause to simulate "thinking"
        if (Math.random() > 0.8) {
          // Pause for a moment
          clearInterval(intervalId);
          setTimeout(() => {
            setThinkingProgress(progress);
            // Resume
            simulateThinking(onComplete);
          }, 300 + Math.random() * 500);
        } else {
          setThinkingProgress(progress);
        }
      }
    }, interval);
  };
  
  const getReward = async () => {
    try {
      await apiRequest('POST', '/api/learn/claim-reward', { 
        challengeId: challenge?.id 
      });
      // Refresh challenges
      queryClient.invalidateQueries({ queryKey: ['/api/learn/daily-challenge'] });
      
      toast({
        title: 'Reward Claimed!',
        description: `You've earned ${challenge?.rewardPoints} reputation points!`,
        variant: 'default',
      });
      
      // Reset state for next challenge
      setTimeout(() => {
        setStage('question');
        setSelectedAnswer(null);
        setShowHint(false);
      }, 1500);
    } catch (error) {
      console.error('Error claiming reward:', error);
      toast({
        title: 'Error',
        description: 'Could not claim the reward. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error || !challenge) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Challenge</CardTitle>
          <CardDescription>
            Learn something new every day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Could not load today's challenge. Please try again later.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/learn/daily-challenge'] })} 
            className="w-full"
          >
            Retry
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  const isCorrect = selectedAnswer === challenge.correctAnswer;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          Daily Knowledge Challenge
        </CardTitle>
        <CardDescription>
          Learn something new about {challenge.topic}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {stage === 'question' && (
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-medium mb-2">{challenge.question}</h3>
              
              <div className="space-y-2 mt-4">
                {challenge.answers.map((answer: string, index: number) => (
                  <Button
                    key={index}
                    variant={selectedAnswer === index ? "default" : "outline"}
                    className="w-full justify-start text-left"
                    onClick={() => setSelectedAnswer(index)}
                  >
                    <div className="mr-2 h-5 w-5 rounded-full border flex items-center justify-center">
                      {selectedAnswer === index ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <span className="text-xs">{String.fromCharCode(65 + index)}</span>
                      )}
                    </div>
                    {answer}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {stage === 'thinking' && (
          <div className="space-y-6 py-6">
            <div className="flex justify-center">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-4 border-muted" />
                <div 
                  className="absolute inset-0 rounded-full border-4 border-primary" 
                  style={{ 
                    clipPath: `polygon(0 0, ${thinkingProgress * 100}% 0, ${thinkingProgress * 100}% 100%, 0 100%)` 
                  }} 
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Brain className="h-8 w-8 text-primary animate-pulse" />
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing your answer...</span>
                <span>{Math.round(thinkingProgress * 100)}%</span>
              </div>
              <Progress value={thinkingProgress * 100} className="h-2" />
            </div>
            
            {showHint && (
              <div className="text-sm text-muted-foreground italic animate-in fade-in duration-700">
                <p>Did you know? {challenge.funFact}</p>
              </div>
            )}
          </div>
        )}
        
        {stage === 'result' && (
          <div className="space-y-4">
            <div className={`p-4 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'}`}>
              <div className="flex items-center">
                {isCorrect ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                )}
                <h3 className="font-medium">
                  {isCorrect ? 'Correct!' : 'Not quite right'}
                </h3>
              </div>
              
              <p className="mt-2 text-sm">
                {challenge.explanation}
              </p>
              
              {!isCorrect && (
                <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-800 text-sm">
                  <p>The correct answer was: <span className="font-medium">{challenge.answers[challenge.correctAnswer]}</span></p>
                </div>
              )}
            </div>
            
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Why this matters for your journey:</h4>
              <p className="text-sm">{challenge.relevance}</p>
            </div>
            
            {isCorrect && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="p-4 border border-dashed border-amber-300 rounded-lg bg-amber-50 dark:bg-amber-900/20"
              >
                <div className="flex items-center">
                  <Gift className="h-5 w-5 text-amber-500 mr-2" />
                  <h3 className="font-medium text-amber-700 dark:text-amber-300">You've earned a reward!</h3>
                </div>
                <p className="mt-2 text-sm">
                  {challenge.rewardDescription}
                </p>
              </motion.div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        {stage === 'question' && (
          <Button 
            onClick={submitAnswer} 
            disabled={selectedAnswer === null}
            className="w-full"
          >
            Submit Answer
          </Button>
        )}
        
        {stage === 'thinking' && (
          <Button disabled className="w-full">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Analyzing Response...
          </Button>
        )}
        
        {stage === 'result' && (
          <div className="w-full flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setStage('question');
                setSelectedAnswer(null);
                setShowHint(false);
              }}
              className="flex-1"
            >
              Try Another
            </Button>
            
            {isCorrect && (
              <Button 
                onClick={getReward}
                className="flex-1"
              >
                <Gift className="mr-2 h-4 w-4" />
                Claim Reward
              </Button>
            )}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}