import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Wallet, AlertCircle, Check, RefreshCcw, ExternalLink, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BasicWalletConnectProps {
  onConnect?: (address: string, chainId: string, walletType: string) => void;
}



export function BasicWalletConnect({ onConnect }: BasicWalletConnectProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string>('');
  const [chainId, setChainId] = useState<string>('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');
  const { toast } = useToast();

  // Check if MetaMask is installed
  const isMetaMaskInstalled = typeof window !== 'undefined' && window.ethereum?.isMetaMask;

  // Check for existing connection on load
  useEffect(() => {
    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAddress(accounts[0]);
        setIsConnected(true);
        if (onConnect) {
          onConnect(accounts[0], chainId || '0x1', 'MetaMask');
        }
      }
    };

    const handleChainChanged = (newChainId: string) => {
      setChainId(newChainId);
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [chainId, onConnect]);

  const checkConnection = async () => {
    if (!window.ethereum) return;

    try {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
      
      if (accounts.length > 0) {
        setAddress(accounts[0]);
        setChainId(currentChainId);
        setIsConnected(true);
      }
    } catch (err) {
      console.error('Error checking connection:', err);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setIsConnecting(true);
    setError('');

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });

      setAddress(accounts[0]);
      setChainId(currentChainId);
      setIsConnected(true);

      if (onConnect) {
        onConnect(accounts[0], currentChainId, 'MetaMask');
      }

      toast({
        title: 'Wallet Connected',
        description: 'Your MetaMask wallet has been connected successfully.',
      });

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect wallet';
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

  const disconnect = () => {
    setIsConnected(false);
    setAddress('');
    setChainId('');
    setError('');
    
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected.',
    });
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    toast({
      title: 'Address Copied',
      description: 'Wallet address copied to clipboard.',
    });
  };

  const switchToPolygonAmoy = async () => {
    if (!window.ethereum) return;

    const polygonAmoy = {
      chainId: '0x13882', // 80002 in hex - Polygon Amoy
      chainName: 'Polygon Amoy',
      nativeCurrency: {
        name: 'MATIC',
        symbol: 'MATIC',
        decimals: 18,
      },
      rpcUrls: ['https://rpc-amoy.polygon.technology/'],
      blockExplorerUrls: ['https://amoy.polygonscan.com/'],
    };

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: polygonAmoy.chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [polygonAmoy],
          });
        } catch (addError) {
          setError('Failed to add Polygon Amoy network');
        }
      } else {
        setError('Failed to switch to Polygon Amoy network');
      }
    }
  };

  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const getNetworkName = (id: string) => {
    const networks: { [key: string]: string } = {
      '0x1': 'Ethereum Mainnet',
      '0x89': 'Polygon Mainnet', 
      '0x13882': 'Polygon Amoy',
      '0xa4b1': 'Arbitrum One',
    };
    return networks[id] || `Chain ID: ${parseInt(id, 16)}`;
  };

  const isCorrectNetwork = chainId === '0x13882'; // Polygon Amoy

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Connect Wallet
        </CardTitle>
        <CardDescription>
          Connect your MetaMask wallet to access HyperDAG
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isMetaMaskInstalled && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>MetaMask Required</AlertTitle>
            <AlertDescription>
              Please install MetaMask to connect your wallet.
              <Button asChild variant="link" className="h-auto p-0 ml-1">
                <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Install MetaMask
                </a>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isConnected ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Check className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Address:</span>
              <div className="flex items-center gap-1">
                <code className="text-xs bg-muted px-2 py-1 rounded">
                  {formatAddress(address)}
                </code>
                <Button size="sm" variant="ghost" onClick={copyAddress} className="h-6 w-6 p-0">
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Network:</span>
              <Badge variant={isCorrectNetwork ? "default" : "secondary"}>
                {getNetworkName(chainId)}
              </Badge>
            </div>

            {!isCorrectNetwork && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please switch to Polygon Amoy testnet for full functionality.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            {isConnecting ? (
              <div className="flex flex-col items-center gap-2">
                <RefreshCcw className="h-6 w-6 animate-spin" />
                <p className="text-sm text-muted-foreground">Connecting to MetaMask...</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Click below to connect your MetaMask wallet
              </p>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {!isConnected && isMetaMaskInstalled ? (
          <Button 
            onClick={connectWallet} 
            className="w-full" 
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </Button>
        ) : isConnected && !isCorrectNetwork ? (
          <Button 
            onClick={switchToPolygonAmoy} 
            className="w-full" 
            variant="secondary"
          >
            Switch to Polygon Amoy
          </Button>
        ) : isConnected ? (
          <Button 
            onClick={disconnect} 
            variant="outline" 
            className="w-full"
          >
            Disconnect
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}