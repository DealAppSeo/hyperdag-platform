import React, { useState } from 'react';
import { WalletIcon, Loader2, ArrowRightIcon, CheckCircleIcon, LinkIcon, Shield, Zap, Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';
import { ReownWalletConnect } from '@/components/web3/ReownWalletConnect';
import { BasicWalletConnect } from '@/components/web3/BasicWalletConnect';

interface WalletStepProps {
  user: User;
  onSuccess: (updatedUser: User) => void;
  onSkip?: () => void;
}

export function WalletStep({ user, onSuccess, onSkip }: WalletStepProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');

  // Handle wallet connection success
  const handleWalletConnect = (address: string, chainId: string, walletType: string) => {
    setWalletAddress(address);
    setConnected(true);
    
    toast({
      title: 'Wallet Connected',
      description: `Successfully connected ${walletType} wallet`,
    });
  };

  // Link wallet to account
  const handleLinkWallet = async () => {
    if (!walletAddress) return;
    
    setIsSubmitting(true);
    try {
      const res = await apiRequest('POST', '/api/user/connect-wallet', { walletAddress });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to link wallet');
      }
      const updatedUser = await res.json();
      
      toast({
        title: 'Wallet linked successfully',
        description: 'You now have access to all Web3 features',
      });
      
      onSuccess(updatedUser);
    } catch (error) {
      console.error('Failed to link wallet:', error);
      toast({
        title: 'Failed to link wallet',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
          <WalletIcon className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>Connect your crypto wallet</CardTitle>
        <CardDescription>
          Connecting a wallet gives you access to Web3 features like tokens, NFTs, and decentralized applications.
          <br />
          Your wallet address is the only information that will be stored.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {connected ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <CheckCircleIcon className="text-green-500 w-6 h-6 mr-2" />
                <span className="font-medium">Wallet Connected</span>
              </div>
              <div className="mt-3 bg-white p-2 rounded border border-gray-200">
                <code className="text-xs break-all">{walletAddress}</code>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-sm">
                <img 
                  src="https://cdn.iconscout.com/icon/free/png-256/metamask-2728406-2261817.png" 
                  alt="MetaMask" 
                  className="w-12 h-12"
                />
              </div>
              <h3 className="text-lg font-medium mb-2">Connect with MetaMask</h3>
              <p className="text-sm text-gray-600 mb-4">
                The most popular Ethereum wallet that's easy to use and secure.
              </p>
              <Button 
                onClick={handleConnectWallet} 
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    Connect Wallet <LinkIcon className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
          
          {connected && !user.walletAddress && (
            <Button 
              onClick={handleLinkWallet} 
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Linking...
                </>
              ) : (
                <>
                  Link Wallet to Account <ArrowRightIcon className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        {!connected && onSkip && (
          <Button 
            variant="outline" 
            onClick={onSkip} 
            disabled={isSubmitting}
          >
            Skip for now
          </Button>
        )}
        
        <div className="flex items-start bg-blue-50 text-blue-800 p-3 rounded-md">
          <div className="text-sm">
            <strong>Note:</strong> You can always connect a wallet later from your profile settings.
            However, some platform features require a connected wallet to function.
          </div>
        </div>
        
        <div className="flex items-start bg-yellow-50 text-yellow-800 p-3 rounded-md">
          <div className="text-sm">
            <strong>Important:</strong> Full onboarding is not considered complete until you connect a wallet.
            Without a wallet connection, some platform features will remain inaccessible.
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
