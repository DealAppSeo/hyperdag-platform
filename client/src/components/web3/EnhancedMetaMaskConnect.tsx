import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Wallet, CheckCircle, AlertTriangle, Loader2, ExternalLink, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnhancedMetaMaskConnectProps {
  onConnect?: (address: string, chainId: string, walletType: string) => void;
}

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function EnhancedMetaMaskConnect({ onConnect }: EnhancedMetaMaskConnectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string>('');
  const [chainId, setChainId] = useState<number>(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [balance, setBalance] = useState<string>('');
  const { toast } = useToast();

  const ALCHEMY_API_KEY = import.meta.env.VITE_ALCHEMY_API_KEY;

  // Network configurations with Alchemy RPC endpoints
  const networks = {
    1: {
      name: 'Ethereum Mainnet',
      rpcUrl: `https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      explorer: 'https://etherscan.io',
      currency: 'ETH'
    },
    11155111: {
      name: 'Sepolia Testnet',
      rpcUrl: `https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      explorer: 'https://sepolia.etherscan.io',
      currency: 'ETH'
    },
    137: {
      name: 'Polygon Mainnet',
      rpcUrl: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      explorer: 'https://polygonscan.com',
      currency: 'MATIC'
    },
    1101: {
      name: 'Polygon zkEVM',
      rpcUrl: `https://polygonzkevm-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      explorer: 'https://zkevm.polygonscan.com',
      currency: 'ETH'
    },
    10: {
      name: 'Optimism',
      rpcUrl: `https://opt-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      explorer: 'https://optimistic.etherscan.io',
      currency: 'ETH'
    },
    42161: {
      name: 'Arbitrum One',
      rpcUrl: `https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      explorer: 'https://arbiscan.io',
      currency: 'ETH'
    }
  };

  useEffect(() => {
    const checkMetaMask = () => {
      const hasWallet = typeof window.ethereum !== 'undefined';
      console.log('MetaMask detection:', hasWallet);
      setHasMetaMask(hasWallet);
      
      if (hasWallet) {
        checkExistingConnection();
        
        // Listen for account and network changes
        if (window.ethereum.on) {
          window.ethereum.on('accountsChanged', handleAccountsChanged);
          window.ethereum.on('chainChanged', handleChainChanged);
        }
      }
    };

    // Check immediately and after a short delay
    checkMetaMask();
    const timer = setTimeout(checkMetaMask, 500);

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
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (accounts.length > 0) {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const numericChainId = parseInt(chainId, 16);
        
        setAddress(accounts[0]);
        setChainId(numericChainId);
        setIsConnected(true);
        
        // Get balance
        await fetchBalance(accounts[0], numericChainId);
        
        if (onConnect) {
          onConnect(accounts[0], chainId, 'MetaMask');
        }
      }
    } catch (err) {
      console.error('Error checking existing connection:', err);
    }
  };

  const fetchBalance = async (address: string, chainId: number) => {
    try {
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [address, 'latest']
      });
      
      // Convert from wei to ether
      const balanceInEth = parseInt(balance, 16) / Math.pow(10, 18);
      setBalance(balanceInEth.toFixed(4));
    } catch (err) {
      console.error('Error fetching balance:', err);
      setBalance('0.0000');
    }
  };

  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      setIsConnected(false);
      setAddress('');
      setChainId(0);
      setBalance('');
      toast({
        title: 'Wallet Disconnected',
        description: 'MetaMask has been disconnected',
      });
    } else {
      setAddress(accounts[0]);
      await fetchBalance(accounts[0], chainId);
      if (onConnect) {
        onConnect(accounts[0], chainId.toString(), 'MetaMask');
      }
    }
  };

  const handleChainChanged = async (chainId: string) => {
    const newChainId = parseInt(chainId, 16);
    setChainId(newChainId);
    
    if (address) {
      await fetchBalance(address, newChainId);
    }
    
    const network = networks[newChainId as keyof typeof networks];
    toast({
      title: 'Network Changed',
      description: `Switched to ${network?.name || `Chain ${newChainId}`}`,
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
      
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      if (accounts.length === 0) {
        throw new Error('No accounts returned from MetaMask');
      }

      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const numericChainId = parseInt(chainId, 16);
      
      setAddress(accounts[0]);
      setChainId(numericChainId);
      setIsConnected(true);
      
      // Fetch balance
      await fetchBalance(accounts[0], numericChainId);
      
      if (onConnect) {
        onConnect(accounts[0], chainId, 'MetaMask');
      }

      const network = networks[numericChainId as keyof typeof networks];
      toast({
        title: 'Wallet Connected',
        description: `Connected to ${network?.name || `Chain ${numericChainId}`}`,
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

  const switchNetwork = async (targetChainId: number) => {
    if (!window.ethereum) return;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // If the network isn't added to MetaMask, add it
      if (switchError.code === 4902) {
        const network = networks[targetChainId as keyof typeof networks];
        if (network) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${targetChainId.toString(16)}`,
                chainName: network.name,
                rpcUrls: [network.rpcUrl],
                blockExplorerUrls: [network.explorer],
                nativeCurrency: {
                  name: network.currency,
                  symbol: network.currency,
                  decimals: 18,
                },
              }],
            });
          } catch (addError) {
            console.error('Error adding network:', addError);
          }
        }
      }
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

  const openInExplorer = () => {
    const network = networks[chainId as keyof typeof networks];
    if (network) {
      window.open(`${network.explorer}/address/${address}`, '_blank');
    }
  };

  if (!hasMetaMask) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
          </div>
          <CardTitle>MetaMask Required</CardTitle>
          <CardDescription>
            Please install MetaMask to connect your wallet and access Web3 features
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
            size="lg"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Install MetaMask
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
          isConnected ? 'bg-green-100' : 'bg-gradient-to-br from-blue-500 to-purple-600'
        }`}>
          {isConnected ? (
            <CheckCircle className="h-8 w-8 text-green-600" />
          ) : (
            <Wallet className="h-8 w-8 text-white" />
          )}
        </div>
        <CardTitle>
          {isConnected ? 'Wallet Connected' : 'Connect Your Wallet'}
        </CardTitle>
        <CardDescription>
          {isConnected 
            ? `Connected to ${networks[chainId as keyof typeof networks]?.name || `Chain ${chainId}`}`
            : 'Connect with MetaMask to access Web3 features'
          }
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

            <p className="text-xs text-gray-500 text-center">
              Make sure MetaMask is unlocked and try again if the connection fails.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Address:</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    MetaMask
                  </Badge>
                </div>
                
                <button
                  onClick={copyAddress}
                  className="w-full font-mono text-sm text-gray-900 hover:text-blue-600 transition-colors text-left"
                  title="Click to copy"
                >
                  {formatAddress(address)}
                </button>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500">Balance:</span>
                  <span className="text-sm font-medium">
                    {balance} {networks[chainId as keyof typeof networks]?.currency || 'ETH'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-500">Network:</span>
                  <span className="text-sm">
                    {networks[chainId as keyof typeof networks]?.name || `Chain ${chainId}`}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={copyAddress}
                variant="outline"
                size="sm"
              >
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </Button>
              <Button 
                onClick={openInExplorer}
                variant="outline"
                size="sm"
                disabled={!networks[chainId as keyof typeof networks]}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Explorer
              </Button>
            </div>

            {/* Quick network switch buttons */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500">Quick Switch:</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => switchNetwork(1)}
                  variant="outline"
                  size="sm"
                  disabled={chainId === 1}
                >
                  Ethereum
                </Button>
                <Button
                  onClick={() => switchNetwork(137)}
                  variant="outline"
                  size="sm"
                  disabled={chainId === 137}
                >
                  Polygon
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}