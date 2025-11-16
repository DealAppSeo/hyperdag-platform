
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Zap, ArrowUpDown } from 'lucide-react';

interface OptimismWalletProps {
  onNetworkSwitch?: (network: string) => void;
}

export function OptimismWalletConnect({ onNetworkSwitch }: OptimismWalletProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setIsConnected(true);
          await checkNetwork();
          await updateBalance();
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        setIsConnected(true);
        await switchToOptimism();
        await updateBalance();
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    }
  };

  const switchToOptimism = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Try to switch to Optimism network
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xa' }], // Optimism mainnet chain ID (10)
        });
        setCurrentNetwork('Optimism');
        onNetworkSwitch?.('optimism');
      } catch (switchError: any) {
        // Network doesn't exist, add it
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
            setCurrentNetwork('Optimism');
            onNetworkSwitch?.('optimism');
          } catch (addError) {
            console.error('Error adding Optimism network:', addError);
          }
        }
      }
    }
  };

  const checkNetwork = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        switch (chainId) {
          case '0xa':
            setCurrentNetwork('Optimism');
            break;
          case '0x1a4':
            setCurrentNetwork('Optimism Goerli');
            break;
          default:
            setCurrentNetwork('Unknown');
        }
      } catch (error) {
        console.error('Error checking network:', error);
      }
    }
  };

  const updateBalance = async () => {
    if (typeof window.ethereum !== 'undefined' && isConnected) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const balance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [accounts[0], 'latest'],
          });
          const balanceInEth = (parseInt(balance, 16) / 10**18).toFixed(4);
          setBalance(balanceInEth);
        }
      } catch (error) {
        console.error('Error getting balance:', error);
      }
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-red-500" />
          Optimism L2 Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <Button onClick={connectWallet} className="w-full">
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Network:</span>
              <Badge variant={currentNetwork === 'Optimism' ? 'default' : 'secondary'}>
                {currentNetwork}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Balance:</span>
              <span className="font-mono text-sm">{balance} ETH</span>
            </div>

            {currentNetwork !== 'Optimism' && (
              <Button onClick={switchToOptimism} variant="outline" className="w-full">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                Switch to Optimism
              </Button>
            )}

            <div className="text-xs text-gray-500 text-center">
              ⚡ Enjoy 10-100x lower gas fees on Optimism L2
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
