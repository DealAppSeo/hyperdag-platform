/**
 * Web3 Training Academy - Gasless Learning Environment
 * 
 * Interactive tutorial system for onboarding new users to Web3
 * Features gasless transactions and step-by-step guidance
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  GraduationCap, 
  Wallet, 
  Shield, 
  Zap, 
  CheckCircle, 
  Circle, 
  Coins,
  TrendingUp,
  Users,
  Clock,
  Award
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TrainingStep {
  id: string;
  title: string;
  description: string;
  action: string;
  gasless: boolean;
  completed: boolean;
}

interface TrainingSession {
  id: string;
  userId: string;
  steps: TrainingStep[];
  currentStep: number;
  walletAddress: string | null;
  completed: boolean;
}

interface SmartWallet {
  address: string;
  isGasless: boolean;
  networkInfo: {
    name: string;
    chainId: number;
  };
}

export function Web3TrainingAcademy() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [wallet, setWallet] = useState<SmartWallet | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch training session
  const { data: session, isLoading } = useQuery({
    queryKey: ['/api/training/session', sessionId],
    queryFn: () => sessionId ? apiRequest(`/api/training/session/${sessionId}`) : null,
    enabled: !!sessionId
  });

  // Fetch training statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/training/stats']
  });

  // Start training session mutation
  const startTraining = useMutation({
    mutationFn: () => apiRequest('/api/training/start', {
      method: 'POST',
      body: JSON.stringify({ testMode: true }),
      headers: { 'Content-Type': 'application/json' }
    }),
    onSuccess: (data: any) => {
      setSessionId(data.sessionId);
      toast({
        title: "Training Started!",
        description: "Welcome to the Web3 Academy. Let's learn together!",
      });
    }
  });

  // Create wallet mutation
  const createWallet = useMutation({
    mutationFn: () => apiRequest('/api/training/create-wallet', {
      method: 'POST',
      body: JSON.stringify({ sessionId, testMode: true }),
      headers: { 'Content-Type': 'application/json' }
    }),
    onSuccess: (data: any) => {
      setWallet(data.wallet);
      completeStep.mutate({ stepId: 'step1' });
      queryClient.invalidateQueries({ queryKey: ['/api/training/session', sessionId] });
    }
  });

  // Complete step mutation
  const completeStep = useMutation({
    mutationFn: ({ stepId, transactionData }: { stepId: string; transactionData?: any }) => 
      apiRequest('/api/training/complete-step', {
        method: 'POST',
        body: JSON.stringify({ sessionId, stepId, transactionData }),
        headers: { 'Content-Type': 'application/json' }
      }),
    onSuccess: (data: any) => {
      toast({
        title: "Step Completed!",
        description: `${data.stepCompleted.title} - Progress: ${Math.round(data.progress)}%`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/training/session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['/api/training/stats'] });
    }
  });

  // Demo actions for different steps
  const executeStepAction = async (step: TrainingStep) => {
    switch (step.action) {
      case 'create_wallet':
        createWallet.mutate();
        break;
      case 'mint_nft':
        // Simulate ZKP RepID minting
        setTimeout(() => {
          completeStep.mutate({ 
            stepId: step.id, 
            transactionData: { type: 'mint_nft', gasless: true } 
          });
        }, 2000);
        break;
      case 'verify_identity':
        // Simulate 4FA verification
        setTimeout(() => {
          completeStep.mutate({ 
            stepId: step.id, 
            transactionData: { type: 'verify_identity', method: '4FA' } 
          });
        }, 1500);
        break;
      case 'transfer_token':
        // Simulate gasless transfer
        setTimeout(() => {
          completeStep.mutate({ 
            stepId: step.id, 
            transactionData: { type: 'transfer', gasless: true, amount: '0.1' } 
          });
        }, 1800);
        break;
    }
  };

  const getStepIcon = (action: string) => {
    switch (action) {
      case 'create_wallet': return <Wallet className="w-5 h-5" />;
      case 'mint_nft': return <Award className="w-5 h-5" />;
      case 'verify_identity': return <Shield className="w-5 h-5" />;
      case 'transfer_token': return <Coins className="w-5 h-5" />;
      default: return <Circle className="w-5 h-5" />;
    }
  };

  const currentStep = (session as any)?.steps?.[(session as any)?.currentStep];
  const progress = (session as any)?.steps ? ((session as any).steps.filter((s: TrainingStep) => s.completed).length / (session as any).steps.length) * 100 : 0;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6" data-testid="web3-training-academy">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <GraduationCap className="w-8 h-8 text-blue-500" />
          <h1 className="text-3xl font-bold">Web3 Training Academy</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Learn Web3 technology with zero gas fees and maximum security. 
          Experience smart wallets, ZKP identity, and gasless transactions in a safe environment.
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Learners</p>
                  <p className="text-xl font-bold">{stats.totalSessions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Completion Rate</p>
                  <p className="text-xl font-bold">{Math.round(stats.completionRate)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Time</p>
                  <p className="text-xl font-bold">{Math.round(stats.averageTimeToComplete)}m</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Gas Saved</p>
                  <p className="text-xl font-bold">100%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!sessionId ? (
        /* Welcome Screen */
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Ready to Learn Web3?</CardTitle>
            <CardDescription className="text-lg">
              Start your journey into decentralized technology with our interactive tutorial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="flex items-start space-x-3">
                <Zap className="w-6 h-6 text-yellow-500 mt-1" />
                <div>
                  <h4 className="font-semibold">Zero Gas Fees</h4>
                  <p className="text-sm text-muted-foreground">
                    Learn without worrying about transaction costs
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Shield className="w-6 h-6 text-green-500 mt-1" />
                <div>
                  <h4 className="font-semibold">Maximum Security</h4>
                  <p className="text-sm text-muted-foreground">
                    Experience 4FA and biometric authentication
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Wallet className="w-6 h-6 text-blue-500 mt-1" />
                <div>
                  <h4 className="font-semibold">Smart Wallets</h4>
                  <p className="text-sm text-muted-foreground">
                    Create wallets without complex setup
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Award className="w-6 h-6 text-purple-500 mt-1" />
                <div>
                  <h4 className="font-semibold">ZKP Reputation</h4>
                  <p className="text-sm text-muted-foreground">
                    Mint your identity NFT with zero-knowledge proofs
                  </p>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => startTraining.mutate()} 
              disabled={startTraining.isPending}
              size="lg"
              className="w-full md:w-auto"
              data-testid="button-start-training"
            >
              {startTraining.isPending ? 'Starting...' : 'Start Training'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Training Interface */
        <div className="space-y-6">
          {/* Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Training Progress
                <Badge variant="outline">{Math.round(progress)}% Complete</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={progress} className="mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                {session?.steps.map((step: TrainingStep) => (
                  <div 
                    key={step.id} 
                    className={`flex items-center space-x-2 p-2 rounded ${
                      step.completed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-800'
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      getStepIcon(step.action)
                    )}
                    <span className={`text-sm ${step.completed ? 'text-green-700 dark:text-green-300' : ''}`}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Current Step */}
          {currentStep && !session.completed && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getStepIcon(currentStep.action)}
                  <span>{currentStep.title}</span>
                  <Badge variant="secondary">Gasless</Badge>
                </CardTitle>
                <CardDescription>{currentStep.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentStep.action === 'create_wallet' && (
                  <Alert>
                    <Wallet className="w-4 h-4" />
                    <AlertDescription>
                      This will create a smart wallet using Alchemy's Account Abstraction. 
                      No gas fees required!
                    </AlertDescription>
                  </Alert>
                )}
                
                <Button 
                  onClick={() => executeStepAction(currentStep)}
                  disabled={createWallet.isPending || completeStep.isPending}
                  className="w-full"
                  data-testid={`button-${currentStep.action}`}
                >
                  {createWallet.isPending || completeStep.isPending 
                    ? 'Processing...' 
                    : `Complete: ${currentStep.title}`}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Wallet Info */}
          {wallet && (
            <Card>
              <CardHeader>
                <CardTitle>Your Training Wallet</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <div>
                    <p className="text-sm text-muted-foreground">Wallet Address</p>
                    <p className="font-mono text-sm">{wallet.address}</p>
                  </div>
                  <Badge variant="outline">Smart Wallet</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Network</p>
                    <p>{wallet.networkInfo.name}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Chain ID</p>
                    <p>{wallet.networkInfo.chainId}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completion */}
          {session?.completed && (
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-700 dark:text-green-300">
                  <Award className="w-6 h-6" />
                  <span>Training Completed!</span>
                </CardTitle>
                <CardDescription>
                  Congratulations! You've successfully learned the basics of Web3 technology.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm">What you've learned:</p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Created a smart wallet without gas fees</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Minted a ZKP Reputation ID NFT</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Experienced secure 4-Factor Authentication</span>
                    </li>
                    <li className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Executed gasless transactions</span>
                    </li>
                  </ul>
                  <Separator />
                  <Button 
                    onClick={() => {
                      setSessionId(null);
                      setWallet(null);
                    }}
                    variant="outline"
                    className="w-full"
                    data-testid="button-restart-training"
                  >
                    Start New Training Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}