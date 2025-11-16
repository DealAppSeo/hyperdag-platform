import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DirectWalletConnectProps {
  onConnect?: (address: string, chainId: string, walletType: string) => void;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function DirectWalletConnect({ onConnect }: DirectWalletConnectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string>('');
  const [chainId, setChainId] = useState<number>(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const { toast } = useToast();

  // Check for MetaMask on load
  useEffect(() => {
    const checkMetaMask = () => {
      const hasWallet = typeof window.ethereum !== 'undefined';
      setHasMetaMask(hasWallet);
      
      if (hasWallet) {
        console.log('MetaMask detected');
        checkExistingConnection();
        
        // Listen for account changes
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
      } else {
        console.log('MetaMask not detected');
      }
    };

    checkMetaMask();

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const checkExistingConnection = async () => {
    if (!window.ethereum) return;
    
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
      console.error('Error checking existing connection:', err);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      setIsConnected(false);
      setAddress('');
      setChainId(0);
    } else {
      setAddress(accounts[0]);
      if (onConnect) {
        onConnect(accounts[0], chainId.toString(), 'MetaMask');
      }
    }
  };

  const handleChainChanged = (chainId: string) => {
    setChainId(parseInt(chainId, 16));
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    try {
      setIsConnecting(true);
      setError('');
      
      console.log('Requesting wallet connection...');
      
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      console.log('Accounts received:', accounts);
      
      if (accounts.length === 0) {
        throw new Error('No accounts returned from MetaMask');
      }

      // Get chain ID
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log('Chain ID received:', chainId);
      
      setAddress(accounts[0]);
      setChainId(parseInt(chainId, 16));
      setIsConnected(true);
      
      if (onConnect) {
        onConnect(accounts[0], chainId, 'MetaMask');
      }

      toast({
        title: 'Wallet Connected',
        description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
      });
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      
      let errorMessage = 'Failed to connect wallet';
      
      if (err.code === 4001) {
        errorMessage = 'Connection rejected by user';
      } else if (err.code === -32002) {
        errorMessage = 'Connection request already pending. Please check MetaMask.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      
      toast({
        title: 'Connection Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAddress('');
    setChainId(0);
    setError('');
    
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected',
    });
  };

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1: return 'Ethereum Mainnet';
      case 5: return 'Goerli Testnet';
      case 11155111: return 'Sepolia Testnet';
      case 137: return 'Polygon Mainnet';
      case 80001: return 'Polygon Mumbai';
      case 10: return 'Optimism';
      case 420: return 'Optimism Goerli';
      default: return `Chain ${chainId}`;
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(address);
      toast({
        title: 'Address Copied',
        description: 'Wallet address copied to clipboard',
      });
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  if (!hasMetaMask) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-2">
            <AlertTriangle className="h-6 w-6 text-orange-600" />
          </div>
          <CardTitle>MetaMask Required</CardTitle>
          <CardDescription>
            Please install MetaMask to connect your wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              MetaMask is required to connect your wallet. Please install the MetaMask browser extension and refresh this page.
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={() => window.open('https://metamask.io/download/', '_blank')}
            className="w-full"
          >
            Install MetaMask
          </Button>
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
          Connect with MetaMask to access Web3 features
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
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              size="lg"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4 mr-2" />
                  Connect MetaMask
                </>
              )}
            </Button>

            <div className="text-xs text-gray-500 text-center">
              Make sure MetaMask is unlocked and try again if the connection fails.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-900">Connected</span>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  MetaMask
                </span>
              </div>
              
              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Address:</p>
                  <button
                    onClick={copyAddress}
                    className="font-mono text-sm text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {formatAddress(address)}
                  </button>
                </div>
                
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Network:</p>
                  <p className="text-sm text-gray-900">{getNetworkName(chainId)}</p>
                </div>
              </div>
            </div>

            <Button 
              onClick={disconnectWallet}
              variant="outline"
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