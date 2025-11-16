import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lock, Unlock, CheckCircle, Loader2 } from 'lucide-react';
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

export function FeatureUnveiling({ featureId }: { featureId: string }) {
  const [stage, setStage] = useState<'initial' | 'unveiling' | 'revealed'>('initial');
  const [progress, setProgress] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const { toast } = useToast();
  
  const { data: featureData, isLoading } = useQuery({
    queryKey: ['/api/features', featureId],
    queryFn: async () => {
      try {
        const res = await apiRequest('GET', `/api/features/${featureId}`);
        return await res.json?.() || res;
      } catch (error) {
        console.error('Error fetching feature data:', error);
        // Return mock data if API endpoint doesn't exist yet
        return {
          id: featureId,
          name: 'Grant Matching',
          description: 'Find the perfect grants for your project using our AI-powered matching system.',
          unlockRequirement: 'Complete your profile and add at least 3 skills to unlock this feature.',
          icon: '🔍',
          capabilities: [
            'Search through thousands of grant opportunities',
            'Get AI-matched grants based on your profile',
            'Track application status',
            'Receive notifications about new matching grants'
          ],
          isUnlocked: false
        };
      }
    }
  });
  
  const startUnveiling = () => {
    setStage('unveiling');
    
    // Simulate a progress bar that moves at variable speeds
    let currentProgress = 0;
    const totalDuration = 5000; // 5 seconds total
    const interval = 100; // Update every 100ms
    const totalSteps = totalDuration / interval;
    
    const progressInterval = setInterval(() => {
      // Create a non-linear progress curve with random variations
      const randomFactor = 0.5 + Math.random();
      const step = (1 / totalSteps) * randomFactor;
      
      currentProgress += step;
      
      if (currentProgress >= 1) {
        clearInterval(progressInterval);
        setProgress(1);
        setTimeout(() => {
          setStage('revealed');
          setShowConfetti(true);
        }, 500);
      } else {
        setProgress(currentProgress);
      }
    }, interval);
  };
  
  const unlockFeature = async () => {
    try {
      await apiRequest('POST', '/api/features/unlock', { featureId });
      queryClient.invalidateQueries({ queryKey: ['/api/features', featureId] });
      queryClient.invalidateQueries({ queryKey: ['/api/features/unlocked'] });
      
      toast({
        title: 'Feature Unlocked!',
        description: `You've unlocked the ${featureData?.name} feature!`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Error unlocking feature:', error);
      toast({
        title: 'Error',
        description: 'Could not unlock the feature. Please try again.',
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
  
  if (!featureData) return null;
  
  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Discover a New Feature</CardTitle>
        <CardDescription>
          Complete the challenge to unlock this feature
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {stage === 'initial' && (
          <div className="space-y-4">
            <div className="bg-muted rounded-lg p-6 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/80 flex items-center justify-center">
                <Lock className="h-12 w-12 text-muted-foreground opacity-50" />
              </div>
              <div className="text-4xl opacity-20">{featureData.icon || '?'}</div>
              <h3 className="mt-4 font-medium">Mystery Feature</h3>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Challenge to Unlock:</h3>
              <p className="text-muted-foreground text-sm">
                {featureData.unlockRequirement}
              </p>
            </div>
          </div>
        )}
        
        {stage === 'unveiling' && (
          <div className="space-y-6 py-4">
            <div className="relative h-40 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-primary/10" 
                   style={{ clipPath: `inset(0 ${100 - progress * 100}% 0 0)` }} />
              
              <motion.div 
                initial={{ opacity: 0.2 }}
                animate={{ 
                  opacity: 0.2 + progress * 0.8,
                  scale: 0.8 + progress * 0.2
                }}
              >
                <div className="text-4xl">{featureData.icon || '?'}</div>
              </motion.div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Unveiling feature...</span>
                <span>{Math.round(progress * 100)}%</span>
              </div>
              <Progress value={progress * 100} className="h-2" />
            </div>
            
            <p className="text-sm text-center text-muted-foreground italic animate-pulse">
              {progress < 0.3 && "Identifying feature..."}
              {progress >= 0.3 && progress < 0.6 && "Preparing resources..."}
              {progress >= 0.6 && progress < 0.9 && "Almost there..."}
              {progress >= 0.9 && "Finalizing..."}
            </p>
          </div>
        )}
        
        {stage === 'revealed' && (
          <div className="space-y-6 py-4">
            {showConfetti && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Simple confetti effect */}
                {[...Array(30)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute"
                    initial={{
                      top: "0%",
                      left: `${Math.random() * 100}%`,
                      width: `${Math.random() * 10 + 5}px`,
                      height: `${Math.random() * 10 + 5}px`,
                      backgroundColor: [
                        "#FF5733", "#33FF57", "#3357FF", "#F3FF33", "#FF33F3"
                      ][Math.floor(Math.random() * 5)],
                      borderRadius: "50%",
                      opacity: 1
                    }}
                    animate={{
                      top: "100%",
                      opacity: 0,
                      rotate: Math.random() * 360
                    }}
                    transition={{
                      duration: 2 + Math.random() * 2,
                      ease: "easeOut"
                    }}
                  />
                ))}
              </div>
            )}
            
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-primary/10 rounded-lg p-6 text-center"
            >
              <div className="text-4xl mb-3">{featureData.icon || '?'}</div>
              <h3 className="text-xl font-medium">{featureData.name}</h3>
              <p className="text-muted-foreground mt-2">
                {featureData.description}
              </p>
            </motion.div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-sm">What you can do with this feature:</h4>
              <ul className="space-y-2">
                {featureData.capabilities?.map((capability: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{capability}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        {stage === 'initial' && (
          <Button onClick={startUnveiling} className="w-full">
            Start Unveiling
          </Button>
        )}
        
        {stage === 'unveiling' && (
          <Button disabled className="w-full">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Unveiling...
          </Button>
        )}
        
        {stage === 'revealed' && (
          <Button 
            onClick={unlockFeature} 
            className="w-full"
            variant={featureData.isUnlocked ? "outline" : "default"}
            disabled={featureData.isUnlocked}
          >
            {featureData.isUnlocked ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Already Unlocked
              </>
            ) : (
              <>
                <Unlock className="mr-2 h-4 w-4" />
                Unlock & Explore
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}