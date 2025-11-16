import React, { useState } from 'react';
import { WalletIcon, Loader2, ArrowRightIcon, CheckCircleIcon, Shield, Zap, Network, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';
import { EnhancedMetaMaskConnect } from '@/components/web3/EnhancedMetaMaskConnect';
// OptimismWalletConnect will be integrated later

interface EnhancedWalletStepProps {
  user: User;
  onSuccess: (updatedUser: User) => void;
  onSkip?: () => void;
}

export function EnhancedWalletStep({ user, onSuccess, onSkip }: EnhancedWalletStepProps) {
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
        title: 'Wallet Linked Successfully',
        description: 'You now have access to all Web3 features',
      });
      
      onSuccess(updatedUser);
    } catch (error) {
      console.error('Failed to link wallet:', error);
      toast({
        title: 'Failed to Link Wallet',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 mb-4 mx-auto">
          <WalletIcon className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Connect Your Web3 Wallet
        </CardTitle>
        <CardDescription className="text-base leading-relaxed">
          Unlock the full potential of HyperDAG's privacy-first ecosystem by connecting your wallet. 
          Your wallet is your gateway to decentralized collaboration, secure transactions, and AI-powered features.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Value Proposition Grid */}
        <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">Web3 Features You'll Unlock</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 bg-white/70 rounded-lg border border-white/50">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">Privacy-First Identity</div>
                <div className="text-sm text-gray-600">Zero-knowledge authentication and encrypted data</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/70 rounded-lg border border-white/50">
              <Zap className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">Instant Transactions</div>
                <div className="text-sm text-gray-600">Lightning-fast cross-chain operations</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/70 rounded-lg border border-white/50">
              <Network className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">Cross-Chain Access</div>
                <div className="text-sm text-gray-600">Multi-blockchain ecosystem integration</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/70 rounded-lg border border-white/50">
              <CheckCircleIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">Decentralized Rewards</div>
                <div className="text-sm text-gray-600">Earn tokens for platform contributions</div>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet Connection Section */}
        {connected ? (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircleIcon className="text-green-600 w-6 h-6" />
                </div>
                <div>
                  <div className="font-semibold text-green-900">Wallet Connected Successfully</div>
                  <div className="text-sm text-green-700">Ready to access Web3 features</div>
                </div>
              </div>
              <span className="text-xs bg-green-100 text-green-800 px-3 py-1 rounded-full font-medium">
                ✓ Connected
              </span>
            </div>
            <div className="bg-white p-4 rounded-lg border border-green-100">
              <p className="text-xs font-medium text-gray-500 mb-2">Connected Wallet Address:</p>
              <p className="font-mono text-sm text-gray-900 break-all bg-gray-50 p-2 rounded">
                {walletAddress}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <h4 className="font-semibold text-gray-900 mb-2">Choose Your Wallet Connection Method</h4>
              <p className="text-sm text-gray-600 mb-4">
                Connect with over 300+ supported wallets for the best experience
              </p>
            </div>
            <EnhancedMetaMaskConnect onConnect={handleWalletConnect} />
          </div>
        )}

        {/* Link Wallet Action */}
        {connected && !user.walletAddress && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-center mb-4">
              <h4 className="font-semibold text-blue-900 mb-1">Final Step: Link to Your Account</h4>
              <p className="text-sm text-blue-700">
                Connect your wallet to your HyperDAG account to access all features
              </p>
            </div>
            <Button 
              onClick={handleLinkWallet} 
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Linking Wallet...
                </>
              ) : (
                <>
                  Link Wallet to Account <ArrowRightIcon className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-4 pt-6">
        {!connected && onSkip && (
          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={onSkip} 
              disabled={isSubmitting}
              className="text-gray-500 hover:text-gray-700"
            >
              Skip wallet connection for now
            </Button>
            <p className="text-xs text-gray-400 mt-2">
              You can connect your wallet later from your profile settings
            </p>
          </div>
        )}
        
        <div className="text-center">
          <p className="text-xs text-gray-500">
            🔒 Your wallet connection is secure and privacy-focused. 
            Only your wallet address is stored, never your private keys.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}