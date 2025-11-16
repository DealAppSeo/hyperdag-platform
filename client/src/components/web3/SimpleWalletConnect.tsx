import { useState, useEffect } from 'react';
import { useWeb3 } from '@/web3/hooks/useWeb3';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Wallet, AlertCircle, Check, RefreshCcw, ExternalLink } from 'lucide-react';

interface SimpleWalletConnectProps {
  onConnect?: (address: string, chainId: string, walletType: string) => void;
  requiredChainId?: number;
}

export function SimpleWalletConnect({ onConnect, requiredChainId = 2442 }: SimpleWalletConnectProps) {
  const { address, isConnected, isConnecting, connectWallet, disconnectWallet, formatAddress } = useWeb3();
  const [error, setError] = useState<string | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [chainId, setChainId] = useState<string | null>(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = window.ethereum?.isMetaMask || false;

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

  // Call onConnect when wallet connects successfully
  useEffect(() => {
    if (isConnected && address && onConnect) {
      onConnect(address, chainId || '0x1', 'MetaMask');
    }
  }, [isConnected, address, chainId, onConnect]);

  const handleConnect = async () => {
    try {
      setError(null);
      await connectWallet();
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError('Failed to connect wallet. Please try again.');
    }
  };

  const switchToPolygonAmoy = async () => {
    if (!window.ethereum) return;
    
    const polygonAmoyNetwork = {
      chainId: '0x98a', // 2442 in hex
      chainName: 'Polygon Amoy',
      nativeCurrency: {
        name: 'ETH',
        symbol: 'ETH',
        decimals: 18,
      },
      rpcUrls: ['https://rpc-amoy.polygon.technology/'],
      blockExplorerUrls: ['https://amoy-scan.polygon.technology'],
    };
    
    try {
      setError(null);
      
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: polygonAmoyNetwork.chainId }],
        });
      } catch (switchError: any) {
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
      setError('Failed to switch network. Please try manually in MetaMask.');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" /> Connect Wallet
        </CardTitle>
        <CardDescription>
          Connect your MetaMask wallet to access HyperDAG
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
            
            <div className="flex justify-between items-center">
              <span className="font-medium">Address:</span>
              <code className="bg-muted px-2 py-1 rounded text-xs">
                {formatAddress(address!)}
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
          </div>
        ) : (
          <div className="py-6 text-center">
            {isConnecting ? (
              <div className="flex flex-col items-center gap-2">
                <RefreshCcw className="h-6 w-6 animate-spin" />
                <p className="text-muted-foreground">Connecting to MetaMask...</p>
              </div>
            ) : isMetaMaskInstalled ? (
              <p className="text-muted-foreground">Click below to connect your MetaMask wallet</p>
            ) : (
              <div className="space-y-2">
                <p className="text-muted-foreground">MetaMask not detected</p>
                <Button asChild variant="outline" size="sm">
                  <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Install MetaMask
                  </a>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex gap-2">
        {!isConnected && isMetaMaskInstalled ? (
          <Button onClick={handleConnect} className="w-full" disabled={isConnecting}>
            {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </Button>
        ) : isConnected && !isCorrectNetwork ? (
          <Button onClick={switchToPolygonAmoy} className="w-full" variant="secondary">
            Switch to Polygon Amoy
          </Button>
        ) : isConnected ? (
          <Button onClick={disconnectWallet} variant="outline" className="w-full">
            Disconnect
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}