import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '@/web3/hooks/useWeb3';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Wallet, AlertCircle, Check, RefreshCcw } from 'lucide-react';

interface MetaMaskConnectProps {
  onConnect?: (address: string, chainId: string) => void;
  requiredChainId?: number; // Chain ID that the app requires (e.g., 2442 for Polygon Amoy)
}

export function MetaMaskConnect({ onConnect, requiredChainId = 2442 }: MetaMaskConnectProps) {
  const { address, isConnected, isConnecting, connectWallet, disconnectWallet } = useWeb3();
  const [error, setError] = useState<string | null>(null);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);

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
    if (isConnected && address && chainId && isCorrectNetwork && onConnect) {
      onConnect(address, chainId);
    }
  }, [isConnected, address, chainId, isCorrectNetwork, onConnect]);

  const handleConnect = async () => {
    try {
      setError(null);
      await connectWallet();
    } catch (err) {
      console.error('Error connecting to MetaMask:', err);
      setError('Failed to connect to MetaMask. Please make sure the extension is installed and unlocked.');
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
      setError('Failed to switch network. Please try adding Polygon Amoy network manually in MetaMask.');
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" /> Connect Wallet
        </CardTitle>
        <CardDescription>
          Connect your MetaMask wallet to interact with the Polygon Amoy network
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
          <div className="py-6 text-center text-muted-foreground">
            {isConnecting ? (
              <div className="flex flex-col items-center gap-2">
                <RefreshCcw className="h-6 w-6 animate-spin" />
                <p>Connecting to MetaMask...</p>
              </div>
            ) : (
              <p>Not connected. Click the button below to connect your wallet.</p>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex gap-2">
        {!isConnected ? (
          <Button onClick={handleConnect} className="w-full" disabled={isConnecting}>
            Connect MetaMask
          </Button>
        ) : !isCorrectNetwork ? (
          <Button onClick={switchToPolygonAmoy} className="w-full" variant="secondary">
            Switch to Polygon Amoy
          </Button>
        ) : (
          <Button onClick={() => disconnectWallet()} variant="outline" className="w-full">
            Disconnect
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}