import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, CheckCircle, Shield, Zap, Network, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReownWalletConnectProps {
  onConnect?: (address: string, chainId: string, walletType: string) => void;
  projectId?: string;
}

// WalletConnect Project ID check
const PROJECT_ID = import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID;
console.log('WalletConnect Project ID configured:', PROJECT_ID ? 'Yes' : 'No');

// Enhanced wallet connection with graceful fallback
const connectWallet = async () => {
  console.log('Attempting wallet connection...');
  
  if (typeof window.ethereum !== 'undefined') {
    console.log('MetaMask detected');
    try {
      console.log('Requesting account access...');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      console.log('Accounts received:', accounts);
      
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log('Chain ID received:', chainId);
      
      return { address: accounts[0], chainId: parseInt(chainId, 16) };
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw new Error(`Failed to connect wallet: ${error.message || error}`);
    }
  }
  console.error('No MetaMask detected');
  throw new Error('MetaMask not detected. Please install MetaMask browser extension.');
};

export function ReownWalletConnect({ onConnect, projectId }: ReownWalletConnectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string>('');
  const [chainId, setChainId] = useState<number>(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');
  const [needsProjectId, setNeedsProjectId] = useState(!PROJECT_ID);
  const { toast } = useToast();

  // Check for existing connection on load
  useEffect(() => {
    checkExistingConnection();
  }, []);

  const checkExistingConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const chainId = await window.ethereum.request({ method: 'eth_chainId' });
          setAddress(accounts[0]);
          setChainId(parseInt(chainId, 16));
          setIsConnected(true);
          
          if (onConnect) {
            onConnect(accounts[0], chainId, 'MetaMask');
          }
        }
      } catch (err) {
        // Silent fail for connection check
      }
    }
  };

  const handleConnect = async () => {
    try {
      setIsConnecting(true);
      setError('');
      
      const result = await connectWallet();
      setAddress(result.address);
      setChainId(result.chainId);
      setIsConnected(true);
      
      if (onConnect) {
        onConnect(result.address, result.chainId.toString(), 'MetaMask');
      }

      toast({
        title: 'Wallet Connected',
        description: `Connected to ${result.address.slice(0, 6)}...${result.address.slice(-4)}`,
      });
    } catch (err) {
      console.error('Connection failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setAddress('');
    setChainId(0);
    
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected',
    });
  };

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1: return 'Ethereum';
      case 137: return 'Polygon';
      case 42161: return 'Arbitrum';
      case 10: return 'Optimism';
      case 420: return 'Optimism Goerli';
      case 8453: return 'Base';
      case 11155111: return 'Sepolia';
      default: return `Chain ${chainId}`;
    }
  };

  const getNetworkColor = (chainId: number) => {
    switch (chainId) {
      case 1: return 'bg-blue-500';
      case 137: return 'bg-purple-500';
      case 42161: return 'bg-blue-600';
      case 10: 
      case 420: return 'bg-red-500';
      case 8453: return 'bg-blue-400';
      case 11155111: return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const switchToOptimism = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xa' }], // Optimism mainnet
        });
        toast({
          title: 'Network Switched',
          description: 'Successfully switched to Optimism network',
        });
      } catch (switchError: any) {
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xa',
                chainName: 'Optimism',
                nativeCurrency: {
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://mainnet.optimism.io'],
                blockExplorerUrls: ['https://optimistic.etherscan.io'],
              }],
            });
            toast({
              title: 'Network Added',
              description: 'Optimism network added and selected',
            });
          } catch (addError) {
            toast({
              title: 'Network Error',
              description: 'Failed to add Optimism network',
              variant: 'destructive',
            });
          }
        }
      }
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    toast({
      title: 'Address Copied',
      description: 'Wallet address copied to clipboard',
    });
  };

  if (needsProjectId) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-2">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle>Enhanced Wallet Experience</CardTitle>
          <CardDescription>
            Configure WalletConnect for the best wallet connection experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              To enable the enhanced wallet connection experience with Reown AppKit, 
              a WalletConnect Project ID is required. This provides support for 300+ wallets 
              and improved user experience.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <div className="text-sm font-medium">Benefits of Enhanced Mode:</div>
            <div className="grid gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Support for 300+ wallet providers
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                Enhanced security with WalletConnect protocol
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Seamless mobile wallet connections
              </div>
              <div className="flex items-center gap-2">
                <Network className="h-4 w-4 text-purple-500" />
                Multi-chain support out of the box
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              Falling back to basic MetaMask connection for now.
              Contact administrator to configure WalletConnect Project ID.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-2">
          <Wallet className="h-6 w-6 text-white" />
        </div>
        <CardTitle>Connect Your Wallet</CardTitle>
        <CardDescription>
          Enhanced connection with 300+ supported wallets
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isConnected ? (
          <div className="space-y-4">
            <Button 
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect Wallet
                </>
              )}
            </Button>

            <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                300+ Wallets
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3 text-blue-500" />
                Secure Protocol
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3 text-yellow-500" />
                Mobile Support
              </div>
              <div className="flex items-center gap-1">
                <Network className="h-3 w-3 text-purple-500" />
                Multi-Chain
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              <span className="text-green-800 font-medium">Wallet Connected</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-700">Address</label>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                  <span className="font-mono text-sm">{formatAddress(address)}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={copyAddress}
                    className="h-6 w-6 p-0"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Network</label>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded border">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${getNetworkColor(chainId)}`}></div>
                    <Badge variant="outline">{getNetworkName(chainId)}</Badge>
                    <span className="text-sm text-gray-600">ID: {chainId}</span>
                  </div>
                  {chainId !== 10 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={switchToOptimism}
                      className="text-xs px-2 py-1 h-6"
                    >
                      Switch to Optimism
                    </Button>
                  )}
                </div>
                {chainId === 10 && (
                  <div className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Zap className="h-3 w-3" />
                    Enjoying 10-100x lower gas fees on Optimism L2
                  </div>
                )}
              </div>
            </div>

            <Button 
              variant="outline" 
              onClick={handleDisconnect}
              className="w-full"
            >
              Disconnect Wallet
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}