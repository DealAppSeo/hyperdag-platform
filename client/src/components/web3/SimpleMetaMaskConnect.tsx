import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wallet, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SimpleMetaMaskConnectProps {
  onConnect?: (address: string, chainId: string, walletType: string) => void;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function SimpleMetaMaskConnect({ onConnect }: SimpleMetaMaskConnectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string>('');
  const [chainId, setChainId] = useState<number>(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const { toast } = useToast();

  // Network names for display
  const getNetworkName = (chainId: number) => {
    const networks: { [key: number]: string } = {
      1: 'Ethereum Mainnet',
      11155111: 'Sepolia Testnet',
      137: 'Polygon Mainnet',
      80001: 'Polygon Mumbai',
      10: 'Optimism',
      42161: 'Arbitrum One'
    };
    return networks[chainId] || `Chain ${chainId}`;
  };

  useEffect(() => {
    const checkMetaMask = () => {
      const hasWallet = typeof window.ethereum !== 'undefined';
      console.log('MetaMask detection:', hasWallet);
      setHasMetaMask(hasWallet);
      
      if (hasWallet) {
        checkExistingConnection();
      }
    };

    checkMetaMask();
    // Check again after a delay to ensure MetaMask is fully loaded
    const timer = setTimeout(checkMetaMask, 1000);

    return () => clearTimeout(timer);
  }, []);

  const checkExistingConnection = async () => {
    if (!window.ethereum) return;
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length > 0) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const numericChainId = parseInt(chainId, 16);
        
        setAddress(accounts[0]);
        setChainId(numericChainId);
        setIsConnected(true);
        
        if (onConnect) {
          onConnect(accounts[0], chainId, 'MetaMask');
        }
      }
    } catch (err) {
      console.error('Error checking existing connection:', err);
    }
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
      
      // First, check if MetaMask is unlocked
      try {
        const permissions = await window.ethereum.request({
          method: 'wallet_getPermissions'
        });
        console.log('Current permissions:', permissions);
      } catch (permErr) {
        console.log('Permission check failed:', permErr);
      }

      // Request account access with timeout
      const accountsPromise = window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      // Add a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Connection request timed out')), 30000);
      });

      const accounts = await Promise.race([accountsPromise, timeoutPromise]);
      
      console.log('Accounts received:', accounts);
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from MetaMask');
      }

      // Get chain ID
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const numericChainId = parseInt(chainId, 16);
      
      console.log('Connection successful:', { address: accounts[0], chainId: numericChainId });
      
      setAddress(accounts[0]);
      setChainId(numericChainId);
      setIsConnected(true);
      
      if (onConnect) {
        onConnect(accounts[0], chainId, 'MetaMask');
      }

      toast({
        title: 'Wallet Connected',
        description: `Connected to ${getNetworkName(numericChainId)}`,
      });

    } catch (err: any) {
      console.error('Wallet connection error:', err);
      
      let errorMessage = 'Failed to connect wallet';
      
      if (err.code === 4001) {
        errorMessage = 'Connection rejected by user';
      } else if (err.code === -32002) {
        errorMessage = 'Connection request already pending. Please check MetaMask and try again.';
      } else if (err.message && err.message.includes('timeout')) {
        errorMessage = 'Connection timed out. Please ensure MetaMask is unlocked and try again.';
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
      description: 'MetaMask has been disconnected',
    });
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!hasMetaMask) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          MetaMask is not installed. Please install MetaMask to connect your wallet.
          <br />
          <a 
            href="https://metamask.io/download/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary underline mt-2 inline-block"
          >
            Download MetaMask
          </a>
        </AlertDescription>
      </Alert>
    );
  }

  if (isConnected) {
    return (
      <div className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex flex-col space-y-1">
              <span>Connected to {getNetworkName(chainId)}</span>
              <span className="text-sm font-mono">{formatAddress(address)}</span>
            </div>
          </AlertDescription>
        </Alert>
        <Button 
          onClick={disconnectWallet} 
          variant="outline" 
          className="w-full"
        >
          Disconnect Wallet
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Button 
        onClick={connectWallet} 
        disabled={isConnecting}
        className="w-full"
      >
        {isConnecting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet className="mr-2 h-4 w-4" />
            Connect MetaMask
          </>
        )}
      </Button>
    </div>
  );
}