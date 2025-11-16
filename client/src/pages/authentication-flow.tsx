import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Shield, Wallet, Coins, UserCheck, Camera, Mic, MousePointer, Eye } from 'lucide-react';

interface AuthLevel {
  authLevel: number;
  capabilities: {
    canExplore: boolean;
    canConnectWallet: boolean;
    canWithdrawTokens: boolean;
    canMintDBT: boolean;
    canConvertToSBT: boolean;
  };
  nextRequirement?: string;
}

interface PoLChallenge {
  challengeId: string;
  type: 'captcha' | 'behavioral' | 'voice' | 'video';
  data: any;
  expiresAt: string;
  instructions: string;
}

export default function AuthenticationFlow() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [totpToken, setTotpToken] = useState('');
  const [polChallenge, setPolChallenge] = useState<PoLChallenge | null>(null);
  const [polResponse, setPolResponse] = useState<any>({});

  // Get current auth level
  const { data: authData, isLoading } = useQuery({
    queryKey: ['/api/auth/level'],
    queryFn: async () => {
      const response = await fetch('/api/auth/level');
      if (!response.ok) throw new Error('Failed to get auth level');
      return response.json();
    }
  });

  // Setup 2FA
  const setup2FA = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/2fa/setup', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to setup 2FA');
      return response.json();
    },
    onSuccess: (data) => {
      toast({ title: "2FA setup initiated", description: "Scan the QR code with your authenticator app" });
    }
  });

  // Verify 2FA
  const verify2FA = useMutation({
    mutationFn: async (token: string) => {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });
      if (!response.ok) throw new Error('Invalid verification code');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "2FA enabled successfully", description: "You can now connect your wallet" });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/level'] });
      setStep(2);
    }
  });

  // Generate PoL challenge
  const generateChallenge = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/pol/challenge', { method: 'POST' });
      if (!response.ok) throw new Error('Failed to generate challenge');
      return response.json();
    },
    onSuccess: (data) => {
      setPolChallenge(data.data);
      setStep(3);
    }
  });

  // Verify PoL response
  const verifyPoL = useMutation({
    mutationFn: async (response: any) => {
      const res = await fetch('/api/auth/pol/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeId: polChallenge?.challengeId,
          response
        })
      });
      if (!res.ok) throw new Error('Verification failed');
      return res.json();
    },
    onSuccess: (data) => {
      toast({ 
        title: "Human verification successful", 
        description: "Your SBT credentials have been converted to DBT" 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/level'] });
      setStep(4);
    }
  });

  const authLevel: AuthLevel = authData?.data;
  const progressValue = authLevel ? (authLevel.authLevel / 4) * 100 : 0;

  const getStepIcon = (stepNum: number) => {
    switch (stepNum) {
      case 1: return Shield;
      case 2: return Wallet;
      case 3: return UserCheck;
      case 4: return Coins;
      default: return Shield;
    }
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'captcha': return Eye;
      case 'behavioral': return MousePointer;
      case 'voice': return Mic;
      case 'video': return Camera;
      default: return UserCheck;
    }
  };

  const renderPoLChallenge = () => {
    if (!polChallenge) return null;

    const Icon = getChallengeIcon(polChallenge.type);

    switch (polChallenge.type) {
      case 'captcha':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              <span className="font-medium">Visual Verification</span>
            </div>
            <p className="text-sm text-gray-600">{polChallenge.instructions}</p>
            <div className="grid grid-cols-3 gap-2">
              {polChallenge.data.images.map((img: string, idx: number) => (
                <div
                  key={idx}
                  className={`border-2 rounded cursor-pointer p-2 ${
                    polResponse.selectedIndices?.includes(idx) ? 'border-blue-500' : 'border-gray-200'
                  }`}
                  onClick={() => {
                    const selected = polResponse.selectedIndices || [];
                    const newSelected = selected.includes(idx)
                      ? selected.filter((i: number) => i !== idx)
                      : [...selected, idx];
                    setPolResponse({ ...polResponse, selectedIndices: newSelected });
                  }}
                >
                  <div className="w-full h-20 bg-gray-100 rounded flex items-center justify-center">
                    Image {idx + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'behavioral':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              <span className="font-medium">Behavioral Verification</span>
            </div>
            <p className="text-sm text-gray-600">{polChallenge.instructions}</p>
            <div className="border rounded-lg p-8 bg-gray-50 text-center">
              <p>Move your mouse in the specified pattern in this area</p>
              <div className="mt-4">
                <Button 
                  onClick={() => setPolResponse({ pattern: 'figure8' })}
                  variant="outline"
                >
                  Start Pattern Recognition
                </Button>
              </div>
            </div>
          </div>
        );

      case 'voice':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              <span className="font-medium">Voice Verification</span>
            </div>
            <p className="text-sm text-gray-600">{polChallenge.instructions}</p>
            <div className="border rounded-lg p-6 bg-gray-50">
              <p className="text-lg font-medium mb-4">Please say:</p>
              <p className="text-center italic text-lg mb-4">"{polChallenge.data.phrase}"</p>
              <div className="text-center">
                <Button 
                  onClick={() => setPolResponse({ duration: 3000, recorded: true })}
                  variant="outline"
                >
                  🎤 Start Recording
                </Button>
              </div>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              <span className="font-medium">Video Verification</span>
            </div>
            <p className="text-sm text-gray-600">{polChallenge.instructions}</p>
            <div className="border rounded-lg p-6 bg-gray-50 text-center">
              <p className="mb-4">{polChallenge.data.instruction}</p>
              <div className="w-64 h-48 bg-black rounded mx-auto mb-4 flex items-center justify-center text-white">
                Camera Feed
              </div>
              <Button 
                onClick={() => setPolResponse({ blinkCount: 3, faceDetected: true })}
                variant="outline"
              >
                📹 Start Video Challenge
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Authentication & Security</h1>
        <p className="text-gray-600">
          Progressive security levels unlock different platform capabilities
        </p>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentication Level: {authLevel?.authLevel || 1}/4
          </CardTitle>
          <CardDescription>
            {authLevel?.nextRequirement || 'All authentication levels completed'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progressValue} className="mb-4" />
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <Badge variant={authLevel?.authLevel >= 1 ? "default" : "secondary"}>
                Level 1
              </Badge>
              <p className="mt-1">Explore Network</p>
            </div>
            <div className="text-center">
              <Badge variant={authLevel?.authLevel >= 2 ? "default" : "secondary"}>
                Level 2
              </Badge>
              <p className="mt-1">Connect Wallet</p>
            </div>
            <div className="text-center">
              <Badge variant={authLevel?.authLevel >= 3 ? "default" : "secondary"}>
                Level 3
              </Badge>
              <p className="mt-1">Enhanced Security</p>
            </div>
            <div className="text-center">
              <Badge variant={authLevel?.authLevel >= 4 ? "default" : "secondary"}>
                Level 4
              </Badge>
              <p className="mt-1">Token Operations</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle>Current Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-3 rounded border ${authLevel?.capabilities.canExplore ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <Badge variant={authLevel?.capabilities.canExplore ? "default" : "secondary"}>
                  {authLevel?.capabilities.canExplore ? '✓' : '✗'}
                </Badge>
                Explore Network
              </div>
            </div>
            <div className={`p-3 rounded border ${authLevel?.capabilities.canConnectWallet ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <Badge variant={authLevel?.capabilities.canConnectWallet ? "default" : "secondary"}>
                  {authLevel?.capabilities.canConnectWallet ? '✓' : '✗'}
                </Badge>
                Connect Wallet
              </div>
            </div>
            <div className={`p-3 rounded border ${authLevel?.capabilities.canMintDBT ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <Badge variant={authLevel?.capabilities.canMintDBT ? "default" : "secondary"}>
                  {authLevel?.capabilities.canMintDBT ? '✓' : '✗'}
                </Badge>
                Mint DBT Credentials
              </div>
            </div>
            <div className={`p-3 rounded border ${authLevel?.capabilities.canWithdrawTokens ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <Badge variant={authLevel?.capabilities.canWithdrawTokens ? "default" : "secondary"}>
                  {authLevel?.capabilities.canWithdrawTokens ? '✓' : '✗'}
                </Badge>
                Token Operations
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authentication Steps */}
      {authLevel?.authLevel < 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Enable 2FA (Required for Wallet Connection)</CardTitle>
            <CardDescription>
              Two-factor authentication is required before you can connect wallets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!setup2FA.data ? (
              <Button 
                onClick={() => setup2FA.mutate()}
                disabled={setup2FA.isPending}
              >
                {setup2FA.isPending ? 'Setting up...' : 'Setup 2FA'}
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-100 p-4 rounded">
                  <p className="text-sm mb-2">Scan this QR code with your authenticator app:</p>
                  <div className="bg-white p-4 rounded text-center">
                    [QR Code would display here]
                  </div>
                  <p className="text-sm mt-2">Secret: {setup2FA.data.data.secret}</p>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter 6-digit code"
                    value={totpToken}
                    onChange={(e) => setTotpToken(e.target.value)}
                    maxLength={6}
                  />
                  <Button 
                    onClick={() => verify2FA.mutate(totpToken)}
                    disabled={verify2FA.isPending || totpToken.length !== 6}
                  >
                    Verify
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Proof of Life Challenge */}
      {authLevel?.authLevel >= 2 && authLevel?.authLevel < 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Proof of Life Verification</CardTitle>
            <CardDescription>
              Complete human verification to unlock token operations and convert SBTs to DBTs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!polChallenge ? (
              <div className="space-y-4">
                <Alert>
                  <UserCheck className="h-4 w-4" />
                  <AlertDescription>
                    This verification proves you are a living human with body and soul, not a bot or AI agent.
                    Upon successful verification, your DBT credentials will be converted to SBT (soulbound) credentials.
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={() => generateChallenge.mutate()}
                  disabled={generateChallenge.isPending}
                >
                  {generateChallenge.isPending ? 'Generating Challenge...' : 'Start Soul Verification'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {renderPoLChallenge()}
                <Button 
                  onClick={() => verifyPoL.mutate(polResponse)}
                  disabled={verifyPoL.isPending || !polResponse}
                  className="w-full"
                >
                  {verifyPoL.isPending ? 'Verifying...' : 'Submit Verification'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Success State */}
      {authLevel?.authLevel >= 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-700">Full Authentication Completed</CardTitle>
            <CardDescription>
              You have completed all authentication levels and can access all platform features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 p-4 rounded">
              <p className="text-green-800">
                ✓ Soul verified - Your DBT credentials are now SBT (soulbound to living human)<br/>
                ✓ Token operations unlocked<br/>
                ✓ Full platform access enabled<br/>
                ✓ Confirmed living human with body and soul
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}