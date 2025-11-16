import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, CheckCircle, AlertTriangle, Loader2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BasicMetaMaskConnectProps {
  onConnect?: (address: string, chainId: string, walletType: string) => void;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function BasicMetaMaskConnect({ onConnect }: BasicMetaMaskConnectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string>('');
  const [chainId, setChainId] = useState<number>(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkMetaMask = () => {
      const hasWallet = typeof window.ethereum !== 'undefined';
      console.log('MetaMask detection result:', hasWallet);
      setHasMetaMask(hasWallet);
      
      if (hasWallet) {
        console.log('MetaMask detected, checking existing connection...');
        checkExistingConnection();
        
        // Listen for account changes
        if (window.ethereum.on) {
          window.ethereum.on('accountsChanged', handleAccountsChanged);
          window.ethereum.on('chainChanged', handleChainChanged);
        }
      } else {
        console.log('MetaMask not detected');
      }
    };

    // Add a small delay to ensure window.ethereum is loaded
    const timer = setTimeout(checkMetaMask, 100);

    return () => {
      clearTimeout(timer);
      if (window.ethereum && window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const checkExistingConnection = async () => {
    if (!window.ethereum) return;
    
    try {
      console.log('Checking for existing accounts...');
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      console.log('Existing accounts:', accounts);
      
      if (accounts.length > 0) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        console.log('Connected to chain:', chainId);
        
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
    console.log('Accounts changed:', accounts);
    if (accounts.length === 0) {
      setIsConnected(false);
      setAddress('');
      setChainId(0);
      toast({
        title: 'Wallet Disconnected',
        description: 'MetaMask has been disconnected',
      });
    } else {
      setAddress(accounts[0]);
      if (onConnect) {
        onConnect(accounts[0], chainId.toString(), 'MetaMask');
      }
    }
  };

  const handleChainChanged = (chainId: string) => {
    console.log('Chain changed to:', chainId);
    const newChainId = parseInt(chainId, 16);
    setChainId(newChainId);
    
    toast({
      title: 'Network Changed',
      description: `Switched to ${getNetworkName(newChainId)}`,
    });
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
      
      console.log('Connection successful, accounts:', accounts);
      
      if (accounts.length === 0) {
        throw new Error('No accounts returned from MetaMask');
      }

      // Get chain ID
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log('Chain ID received:', chainId);
      
      const newChainId = parseInt(chainId, 16);
      setAddress(accounts[0]);
      setChainId(newChainId);
      setIsConnected(true);
      
      if (onConnect) {
        onConnect(accounts[0], chainId, 'MetaMask');
      }

      toast({
        title: 'Wallet Connected',
        description: `Connected to ${getNetworkName(newChainId)}`,
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

  const getNetworkName = (chainId: number) => {
    switch (chainId) {
      case 1: return 'Ethereum Mainnet';
      case 5: return 'Goerli Testnet';
      case 11155111: return 'Sepolia Testnet';
      case 137: return 'Polygon Mainnet';
      case 80001: return 'Polygon Mumbai';
      case 10: return 'Optimism';
      case 420: return 'Optimism Goerli';
      case 8453: return 'Base';
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

  const openInEtherscan = () => {
    const baseUrl = chainId === 1 ? 'https://etherscan.io' : 
                   chainId === 5 ? 'https://goerli.etherscan.io' :
                   chainId === 11155111 ? 'https://sepolia.etherscan.io' :
                   chainId === 137 ? 'https://polygonscan.com' :
                   chainId === 10 ? 'https://optimistic.etherscan.io' :
                   'https://etherscan.io';
    
    window.open(`${baseUrl}/address/${address}`, '_blank');
  };

  if (!hasMetaMask) {
    return (
      <div className="text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="h-8 w-8 text-orange-600" />
        </div>
        
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">MetaMask Required</h3>
          <p className="text-sm text-gray-600 mb-4">
            Please install MetaMask to connect your wallet and access Web3 features
          </p>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            MetaMask is required to connect your wallet. Please install the MetaMask browser extension and refresh this page.
          </AlertDescription>
        </Alert>
        
        <Button 
          onClick={() => window.open('https://metamask.io/download/', '_blank')}
          className="w-full"
          size="lg"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Install MetaMask
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isConnected ? (
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
            <Wallet className="h-8 w-8 text-white" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Your Wallet</h3>
            <p className="text-sm text-gray-600 mb-4">
              Connect with MetaMask to access Web3 features
            </p>
          </div>

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

          <p className="text-xs text-gray-500">
            Make sure MetaMask is unlocked and try again if the connection fails.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-green-900 mb-2">Wallet Connected</h3>
            <p className="text-sm text-green-700 mb-4">
              Successfully connected to {getNetworkName(chainId)}
            </p>
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="space-y-3">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Wallet Address:</p>
                <button
                  onClick={copyAddress}
                  className="font-mono text-sm text-gray-900 hover:text-blue-600 transition-colors"
                  title="Click to copy"
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

          <div className="flex gap-2">
            <Button 
              onClick={copyAddress}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              Copy Address
            </Button>
            <Button 
              onClick={openInEtherscan}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View on Explorer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}