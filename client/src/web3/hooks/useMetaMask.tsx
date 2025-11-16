import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { ethers } from 'ethers';
import { useToast } from '@/hooks/use-toast';

type MetaMaskContextType = {
  isConnected: boolean;
  isConnecting: boolean;
  address: string | null;
  chainId: number | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
};

const MetaMaskContext = createContext<MetaMaskContextType | null>(null);

// Check if window.ethereum is available
const hasMetaMask = () => {
  return window.ethereum !== undefined;
};

interface MetaMaskProviderProps {
  children: ReactNode;
  supportedChainIds?: number[];
  defaultChainId?: number;
}

export function MetaMaskProvider({
  children,
  supportedChainIds = [1, 137, 80001, 1101, 2442], // Ethereum, Polygon, Mumbai, zkEVM, zkEVM Testnet
  defaultChainId = 2442, // zkEVM Cardona testnet by default
}: MetaMaskProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  
  const { toast } = useToast();
  
  // Handle account change
  const handleAccountsChanged = async (accounts: string[]) => {
    if (accounts.length === 0) {
      // User disconnected
      disconnect();
    } else if (accounts[0] !== address) {
      setAddress(accounts[0]);
      
      // Refresh signer with new account
      if (provider) {
        try {
          const newSigner = await provider.getSigner();
          setSigner(newSigner);
        } catch (error) {
          console.error('Error getting signer for new account:', error);
        }
      }
    }
  };
  
  // Handle chain change
  const handleChainChanged = (chainIdHex: string) => {
    // chainId is in hex, convert to number
    const newChainId = parseInt(chainIdHex, 16);
    setChainId(newChainId);
    
    // Check if the new chain is supported
    const isSupported = supportedChainIds.includes(newChainId);
    
    if (!isSupported) {
      toast({
        title: 'Unsupported Network',
        description: `Please switch to a supported network.`,
        variant: 'destructive',
      });
    }
  };
  
  // Connect to MetaMask
  const connect = async () => {
    if (!hasMetaMask()) {
      toast({
        title: 'MetaMask Not Found',
        description: 'Please install MetaMask browser extension to connect.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsConnecting(true);
      
      // Request accounts
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Initialize provider
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      setProvider(ethersProvider);
      
      // Get current chain ID
      const networkData = await ethersProvider.getNetwork();
      const currentChainId = Number(networkData.chainId);
      setChainId(currentChainId);
      
      // Check if current network is supported
      if (!supportedChainIds.includes(currentChainId)) {
        // Try to switch to the default chain
        await switchNetwork(defaultChainId);
      }
      
      // Get signer
      const ethersSigner = await ethersProvider.getSigner();
      setSigner(ethersSigner);
      
      // Set connected state
      setAddress(accounts[0]);
      setIsConnected(true);
      
      toast({
        title: 'Wallet Connected',
        description: `Connected to ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`,
      });
    } catch (error) {
      console.error('Error connecting to MetaMask:', error);
      toast({
        title: 'Connection Failed',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Disconnect from MetaMask
  const disconnect = () => {
    setIsConnected(false);
    setAddress(null);
    setSigner(null);
    setProvider(null);
    setChainId(null);
  };
  
  // Switch network
  const switchNetwork = async (targetChainId: number) => {
    if (!hasMetaMask() || !provider) {
      return;
    }
    
    try {
      const chainIdHex = `0x${targetChainId.toString(16)}`;
      
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
      
      // Chain ID will be updated by the chainChanged event
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          let params;
          
          // Define network parameters for known chains
          if (targetChainId === 137) {
            // Polygon Mainnet
            params = {
              chainId: '0x89',
              chainName: 'Polygon Mainnet',
              nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
              rpcUrls: ['https://polygon-rpc.com/'],
              blockExplorerUrls: ['https://polygonscan.com/'],
            };
          } else if (targetChainId === 80001) {
            // Polygon Mumbai Testnet
            params = {
              chainId: '0x13881',
              chainName: 'Polygon Mumbai Testnet',
              nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
              rpcUrls: ['https://rpc-mumbai.maticvigil.com/'],
              blockExplorerUrls: ['https://mumbai.polygonscan.com/'],
            };
          } else if (targetChainId === 1101) {
            // Polygon zkEVM Mainnet
            params = {
              chainId: '0x44d',
              chainName: 'Polygon zkEVM',
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://zkevm-rpc.com'],
              blockExplorerUrls: ['https://zkevm.polygonscan.com/'],
            };
          } else if (targetChainId === 2442) {
            // Polygon zkEVM Cardona Testnet
            params = {
              chainId: '0x98a',
              chainName: 'Polygon zkEVM Cardona Testnet',
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://cardona-testnet.polygon-v2.io'],
              blockExplorerUrls: ['https://cardona-zkevm.polygonscan.com/'],
            };
          } else {
            throw new Error(`No network configuration available for chain ID ${targetChainId}`);
          }
          
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [params],
          });
        } catch (addError) {
          console.error('Error adding network to MetaMask:', addError);
          toast({
            title: 'Network Error',
            description: `Failed to add network to MetaMask: ${(addError as Error).message}`,
            variant: 'destructive',
          });
        }
      } else {
        console.error('Error switching network:', switchError);
        toast({
          title: 'Network Switch Failed',
          description: switchError.message,
          variant: 'destructive',
        });
      }
    }
  };
  
  // Setup event listeners
  useEffect(() => {
    if (hasMetaMask()) {
      // Setup event listeners
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      // Check if already connected (don't auto-connect)
      window.ethereum.request({ method: 'eth_accounts' })
        .then(async (accounts: string[]) => {
          if (accounts.length > 0) {
            try {
              // User is already connected, initialize
              const ethersProvider = new ethers.BrowserProvider(window.ethereum);
              setProvider(ethersProvider);
              
              const networkData = await ethersProvider.getNetwork();
              setChainId(Number(networkData.chainId));
              
              const ethersSigner = await ethersProvider.getSigner();
              setSigner(ethersSigner);
              
              setAddress(accounts[0]);
              setIsConnected(true);
            } catch (error) {
              console.error('Error initializing existing connection:', error);
            }
          }
        })
        .catch((error: Error) => {
          console.error('Error checking accounts:', error);
        });
      
      // Cleanup function
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);
  
  const contextValue: MetaMaskContextType = {
    isConnected,
    isConnecting,
    address,
    chainId,
    provider,
    signer,
    connect,
    disconnect,
    switchNetwork,
  };
  
  return (
    <MetaMaskContext.Provider value={contextValue}>
      {children}
    </MetaMaskContext.Provider>
  );
}

export function useMetaMask() {
  const context = useContext(MetaMaskContext);
  
  if (!context) {
    throw new Error('useMetaMask must be used within a MetaMaskProvider');
  }
  
  return context;
}

// Add type definition for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}
