import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Loader2, Wallet, Shield, CheckCircle2, Lock } from 'lucide-react';
import { useMetaMask } from '@/web3/hooks/useMetaMask';

interface AuthLevelResponse {
  success: boolean;
  data: {
    authLevel: number;
    capabilities: {
      canExplore: boolean;
      canConnectWallet: boolean;
      canWithdrawTokens: boolean;
      canMintDBT: boolean;
      canConvertToSBT: boolean;
    };
    nextRequirement: string | null;
  };
}

interface Setup2FAResponse {
  success: boolean;
  data: {
    secret: string;
    qrCode: string;
    instructions: string;
  };
}

export function WalletConnect4FA() {
  const { toast } = useToast();
  const { connect: connectMetaMask, isConnected: walletConnected, address } = useMetaMask();
  const [totpCode, setTotpCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [show2FASetup, setShow2FASetup] = useState(false);

  // Get current auth level
  const { data: authData, isLoading: authLoading, error: authError } = useQuery<AuthLevelResponse>({
    queryKey: ['/api/auth/level'],
    retry: 1
  });

  const authLevel = authData?.data?.authLevel || 0;
  const capabilities = authData?.data?.capabilities;
  const isAuthenticated = !authError && authLevel >= 1;

  // Setup 2FA mutation
  const setup2FAMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/auth/2fa/setup', { 
        method: 'POST',
        body: JSON.stringify({})
      });
      return response.json();
    },
    onSuccess: (data: Setup2FAResponse) => {
      if (data.success) {
        setQrCodeUrl(data.data.qrCode);
        setShow2FASetup(true);
        toast({
          title: '2FA Setup Started',
          description: data.data.instructions,
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: '2FA Setup Failed',
        description: error.message || 'Failed to setup 2FA',
        variant: 'destructive',
      });
    }
  });

  // Verify 2FA mutation
  const verify2FAMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await apiRequest('/api/auth/2fa/verify', { 
        method: 'POST',
        body: JSON.stringify({ token })
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: '2FA Enabled!',
          description: data.data.message,
        });
        setShow2FASetup(false);
        setTotpCode('');
        queryClient.invalidateQueries({ queryKey: ['/api/auth/level'] });
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Verification Failed',
        description: error.message || 'Invalid code',
        variant: 'destructive',
      });
    }
  });

  // Connect wallet mutation (requires auth level 2+ and signature)
  const connectWalletMutation = useMutation({
    mutationFn: async ({ walletAddress, signature }: { walletAddress: string; signature: string }) => {
      const response = await apiRequest('/api/auth/wallet/connect', {
        method: 'POST',
        body: JSON.stringify({
          address: walletAddress,
          signature
        })
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Wallet Verified!',
        description: 'Your Web3 wallet has been securely linked to your account',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/level'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Verification Failed',
        description: error.message || 'Failed to verify wallet ownership',
        variant: 'destructive',
      });
    }
  });

  const handleSetup2FA = () => {
    setup2FAMutation.mutate();
  };

  const handleVerify2FA = () => {
    if (totpCode.length === 6) {
      verify2FAMutation.mutate(totpCode);
    } else {
      toast({
        title: 'Invalid Code',
        description: 'Please enter a 6-digit code',
        variant: 'destructive',
      });
    }
  };

  const handleConnectWallet = async () => {
    if (authLevel >= 2) {
      try {
        // Step 1: Connect MetaMask wallet
        await connectMetaMask();
        if (!address) {
          throw new Error('Failed to get wallet address');
        }

        // Step 2: Request challenge from backend
        const challengeResponse = await apiRequest('/api/auth/wallet/challenge', {
          method: 'POST',
          body: JSON.stringify({
            address: address
          })
        });
        const challengeData = await challengeResponse.json();
        
        if (!challengeData.success) {
          throw new Error(challengeData.error || 'Failed to get challenge');
        }

        // Step 3: Sign challenge message with MetaMask
        if (!window.ethereum) {
          throw new Error('MetaMask not installed');
        }

        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [challengeData.data.message, address]
        });

        // Step 4: Send signature to backend for verification
        connectWalletMutation.mutate({ 
          walletAddress: address, 
          signature: signature as string 
        });

      } catch (error: any) {
        toast({
          title: 'Connection Failed',
          description: error.message || 'Failed to connect wallet',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Setup Required',
        description: 'Please enable 2FA before connecting your wallet',
        variant: 'destructive',
      });
    }
  };

  if (authLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Show login/register UI if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              4-Factor Authentication
            </CardTitle>
            <CardDescription>
              Secure multi-layer authentication for Web3 access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
              <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                ⚠️ Authentication Required
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                You need to log in before setting up multi-factor authentication. Complete Level 1 (Password) first.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Authentication Levels</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Level 1: Password Authentication</p>
                    <p className="text-sm text-muted-foreground">Log in to continue</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg opacity-60">
                  <Lock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Level 2: Two-Factor Auth</p>
                    <p className="text-sm text-muted-foreground">Requires Level 1</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg opacity-60">
                  <Wallet className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Level 3: Web3 Wallet</p>
                    <p className="text-sm text-muted-foreground">Requires Level 2</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg opacity-60">
                  <Shield className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Level 4: Proof of Life</p>
                    <p className="text-sm text-muted-foreground">Full Web3 access</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                asChild 
                className="flex-1"
                data-testid="button-login"
              >
                <a href="/">Log In</a>
              </Button>
              <Button 
                asChild 
                variant="outline" 
                className="flex-1"
                data-testid="button-register"
              >
                <a href="/?register=true">Create Account</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Auth Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            4-Factor Authentication Progress
          </CardTitle>
          <CardDescription>
            Complete all steps to unlock full Web3 capabilities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Level 1: Password */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-muted" />
            )}
            <span className="font-medium">Level 1: Password</span>
            <span className="text-sm text-muted-foreground ml-auto">
              {isAuthenticated ? '✓ Complete' : 'Login required'}
            </span>
          </div>

          {/* Level 2: 2FA */}
          <div className="flex items-center gap-3">
            {authLevel >= 2 ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-muted" />
            )}
            <span className={`font-medium ${authLevel < 2 ? 'text-muted-foreground' : ''}`}>
              Level 2: Two-Factor Auth (2FA)
            </span>
            <span className="text-sm text-muted-foreground ml-auto">
              {authLevel >= 2 ? '✓ Complete' : 'Required for wallet'}
            </span>
          </div>

          {/* Level 3: Wallet */}
          <div className="flex items-center gap-3">
            {authLevel >= 3 ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-muted" />
            )}
            <span className={`font-medium ${authLevel < 3 ? 'text-muted-foreground' : ''}`}>
              Level 3: Web3 Wallet
            </span>
            <span className="text-sm text-muted-foreground ml-auto">
              {authLevel >= 3 ? '✓ Complete' : 'Requires Level 2'}
            </span>
          </div>

          {/* Level 4: PoL + Biometric */}
          <div className="flex items-center gap-3">
            {authLevel >= 4 ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <div className="h-5 w-5 rounded-full border-2 border-muted" />
            )}
            <span className={`font-medium ${authLevel < 4 ? 'text-muted-foreground' : ''}`}>
              Level 4: Proof of Life + Biometric
            </span>
            <span className="text-sm text-muted-foreground ml-auto">
              {authLevel >= 4 ? '✓ Complete' : 'Unlock SBT conversion'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 2FA Setup Card */}
      {authLevel < 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Enable Two-Factor Authentication
            </CardTitle>
            <CardDescription>
              Secure your account with 2FA to unlock wallet connection
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!show2FASetup ? (
              <Button
                onClick={handleSetup2FA}
                disabled={setup2FAMutation.isPending}
                className="w-full"
                data-testid="button-setup-2fa"
              >
                {setup2FAMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'Setup 2FA'
                )}
              </Button>
            ) : (
              <div className="space-y-4">
                {qrCodeUrl && (
                  <div className="flex flex-col items-center space-y-2">
                    <img src={qrCodeUrl} alt="2FA QR Code" className="w-48 h-48" />
                    <p className="text-sm text-muted-foreground text-center">
                      Scan this QR code with your authenticator app
                    </p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="totp">Enter 6-digit verification code</Label>
                  <Input
                    id="totp"
                    type="text"
                    placeholder="000000"
                    maxLength={6}
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    data-testid="input-2fa-code"
                  />
                </div>

                <Button
                  onClick={handleVerify2FA}
                  disabled={verify2FAMutation.isPending || totpCode.length !== 6}
                  className="w-full"
                  data-testid="button-verify-2fa"
                >
                  {verify2FAMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Enable 2FA'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Wallet Connection Card */}
      {authLevel >= 2 && authLevel < 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Connect Web3 Wallet
            </CardTitle>
            <CardDescription>
              Link your MetaMask wallet for blockchain interactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!walletConnected ? (
              <Button
                onClick={handleConnectWallet}
                disabled={connectWalletMutation.isPending}
                className="w-full"
                data-testid="button-connect-wallet"
              >
                {connectWalletMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect MetaMask Wallet
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Connected Wallet:</span>
                  <span className="text-sm font-mono">
                    {address?.substring(0, 6)}...{address?.substring(38)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Wallet successfully connected! Complete Proof of Life for full access.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Capabilities Summary */}
      {capabilities && (
        <Card>
          <CardHeader>
            <CardTitle>Current Capabilities</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              {capabilities.canExplore ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted" />
              )}
              <span className="text-sm">Explore Platform</span>
            </div>
            <div className="flex items-center gap-2">
              {capabilities.canConnectWallet ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted" />
              )}
              <span className="text-sm">Connect Wallet</span>
            </div>
            <div className="flex items-center gap-2">
              {capabilities.canMintDBT ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted" />
              )}
              <span className="text-sm">Mint DBT Tokens</span>
            </div>
            <div className="flex items-center gap-2">
              {capabilities.canWithdrawTokens ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted" />
              )}
              <span className="text-sm">Withdraw Tokens</span>
            </div>
            <div className="flex items-center gap-2">
              {capabilities.canConvertToSBT ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted" />
              )}
              <span className="text-sm">Convert to SBT</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
