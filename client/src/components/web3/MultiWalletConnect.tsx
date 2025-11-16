import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '@/web3/hooks/useWeb3';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, AlertCircle, Check, RefreshCcw, ExternalLink } from 'lucide-react';
import { Wallet as WalletIcon, Zap, CreditCard } from 'lucide-react';

interface MultiWalletConnectProps {
  onConnect?: (address: string, chainId: string, walletType: string) => void;
  requiredChainId?: number; // Chain ID that the app requires (e.g., 2442 for Polygon Amoy)
}

type WalletType = 'metamask' | 'walletconnect' | 'coinbase';

interface WalletOption {
  id: WalletType;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  downloadUrl: string;
  isInstalled: () => boolean;
  connect: () => Promise<void>;
}

export function MultiWalletConnect({ onConnect, requiredChainId = 2442 }: MultiWalletConnectProps) {
  const { address, isConnected, isConnecting, connectWallet, disconnectWallet } = useWeb3();
  const [error, setError] = useState<string | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [connectedWallet, setConnectedWallet] = useState<WalletType | null>(null);

  // Network details for Polygon Amoy
  const polygonAmoyNetwork = {
    chainId: ethers.toBeHex(requiredChainId), // Amoy is 2442 (0x98a)
    chainName: 'Polygon Amoy',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: [import.meta.env.VITE_INFURA_POLYGON_URL || 'https://polygon-amoy.infura.io/v3/'],
    blockExplorerUrls: ['https://amoy-scan.polygon.technology'],
  };

  // Define wallet options
  const walletOptions: WalletOption[] = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: WalletIcon,
      description: 'Connect using MetaMask browser extension',
      downloadUrl: 'https://metamask.io/download/',
      isInstalled: () => window.ethereum?.isMetaMask || false,
      connect: async () => {
        await connectWallet();
        setConnectedWallet('metamask');
      }
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: Zap,
      description: 'Connect using WalletConnect protocol',
      downloadUrl: 'https://walletconnect.com/',
      isInstalled: () => true, // WalletConnect is always available
      connect: async () => {
        // For now, use the same connection method
        // In production, you'd integrate actual WalletConnect
        await connectWallet();
        setConnectedWallet('walletconnect');
      }
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      icon: CreditCard,
      description: 'Connect using Coinbase Wallet',
      downloadUrl: 'https://www.coinbase.com/wallet/',
      isInstalled: () => window.ethereum?.isCoinbaseWallet || false,
      connect: async () => {
        await connectWallet();
        setConnectedWallet('coinbase');
      }
    }
  ];

  // Get current network info
  useEffect(() => {
    const getCurrentNetwork = async () => {
      if (window.ethereum && isConnected) {
        try {
          const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
          setChainId(currentChainId);
          setIsCorrectNetwork(parseInt(currentChainId, 16) === requiredChainId);
        } catch (err) {
          console.error('Error getting network info:', err);
        }
      }
    };

    getCurrentNetwork();
  }, [isConnected, requiredChainId]);

  // Fetch balance when connected
  useEffect(() => {
    const fetchBalance = async () => {
      if (isConnected && address && window.ethereum && isCorrectNetwork) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const balanceWei = await provider.getBalance(address);
          const balanceEth = ethers.formatEther(balanceWei);
          setBalance(parseFloat(balanceEth).toFixed(4));
        } catch (err) {
          console.error('Error fetching balance:', err);
          setBalance(null);
        }
      }
    };

    fetchBalance();
  }, [isConnected, address, isCorrectNetwork]);

  // Callback when connected
  useEffect(() => {
    if (isConnected && address && onConnect && connectedWallet) {
      // Call the callback with available data
      onConnect(address, chainId || '0x1', connectedWallet);
    }
  }, [isConnected, address, chainId, onConnect, connectedWallet]);

  const handleWalletConnect = async (wallet: WalletOption) => {
    try {
      setError(null);
      await wallet.connect();
    } catch (err) {
      console.error(`Error connecting to ${wallet.name}:`, err);
      setError(`Failed to connect to ${wallet.name}. Please make sure it's installed and unlocked.`);
    }
  };

  const switchToPolygonAmoy = async () => {
    if (!window.ethereum) return;
    
    try {
      setError(null);
      
      // First try to switch to the chain
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: polygonAmoyNetwork.chainId }],
        });
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [polygonAmoyNetwork],
          });
        } else {
          throw switchError;
        }
      }
    } catch (err) {
      console.error('Error switching network:', err);
      setError('Failed to switch network. Please try adding Polygon Amoy network manually in your wallet.');
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setConnectedWallet(null);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" /> Connect Wallet
        </CardTitle>
        <CardDescription>
          Choose your preferred wallet to connect to the Polygon Amoy network
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Status:</span>
              <Badge variant="outline" className="bg-green-50">
                <Check className="h-3 w-3 mr-1 text-green-500" /> Connected
              </Badge>
            </div>
            
            {connectedWallet && (
              <div className="flex justify-between items-center">
                <span className="font-medium">Wallet:</span>
                <Badge variant="outline">
                  {walletOptions.find(w => w.id === connectedWallet)?.name}
                </Badge>
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Address:</span>
              <code className="bg-muted px-2 py-1 rounded text-xs">
                {address?.substring(0, 6)}...{address?.substring(address.length - 4)}
              </code>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Network:</span>
              {isCorrectNetwork ? (
                <Badge className="bg-green-500 hover:bg-green-600">Polygon Amoy</Badge>
              ) : (
                <Badge variant="outline" className="text-orange-500 border-orange-300">
                  Wrong Network
                </Badge>
              )}
            </div>
            
            {isCorrectNetwork && balance !== null && (
              <div className="flex justify-between items-center">
                <span className="font-medium">Balance:</span>
                <span>{balance} ETH</span>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {isConnecting ? (
              <div className="flex flex-col items-center gap-2 py-6">
                <RefreshCcw className="h-6 w-6 animate-spin" />
                <p className="text-muted-foreground">Connecting to wallet...</p>
              </div>
            ) : (
              <Tabs defaultValue={walletOptions[0].id} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  {walletOptions.map((wallet) => (
                    <TabsTrigger key={wallet.id} value={wallet.id} className="text-xs">
                      <wallet.icon className="h-4 w-4" />
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {walletOptions.map((wallet) => (
                  <TabsContent key={wallet.id} value={wallet.id} className="space-y-4">
                    <div className="text-center space-y-2">
                      <wallet.icon className="h-12 w-12 mx-auto text-muted-foreground" />
                      <h3 className="font-medium">{wallet.name}</h3>
                      <p className="text-sm text-muted-foreground">{wallet.description}</p>
                    </div>
                    
                    {wallet.isInstalled() ? (
                      <Button 
                        onClick={() => handleWalletConnect(wallet)} 
                        className="w-full"
                        disabled={isConnecting}
                      >
                        Connect {wallet.name}
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Button asChild variant="outline" className="w-full">
                          <a href={wallet.downloadUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Install {wallet.name}
                          </a>
                        </Button>
                        <p className="text-xs text-muted-foreground text-center">
                          Install {wallet.name} to continue
                        </p>
                      </div>
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex gap-2">
        {isConnected && !isCorrectNetwork ? (
          <Button onClick={switchToPolygonAmoy} className="w-full" variant="secondary">
            Switch to Polygon Amoy
          </Button>
        ) : isConnected ? (
          <Button onClick={handleDisconnect} variant="outline" className="w-full">
            Disconnect
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}