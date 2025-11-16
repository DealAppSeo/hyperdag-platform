import { MetaMaskProvider } from "@metamask/sdk-react";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { type WalletClient, createWalletClient, custom } from "viem";
import { type Address } from "viem";
import { SiweMessage } from "siwe";
import { apiRequest } from "@/lib/queryClient";

// Context for wallet state
type WalletContextType = {
  address: Address | null;
  isConnected: boolean;
  isConnecting: boolean;
  walletClient: WalletClient | null;
  error: Error | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  signMessage: (message: string) => Promise<string>;
  verifySignature: (message: string, signature: string) => Promise<boolean>;
  signInWithEthereum: () => Promise<boolean>;
};

const WalletContext = createContext<WalletContextType | null>(null);

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

// Provider component
export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<Address | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Initialize wallet from localStorage on component mount
  useEffect(() => {
    const savedAddress = localStorage.getItem("walletAddress");
    if (savedAddress) {
      try {
        setAddress(savedAddress as Address);
        setIsConnected(true);
        
        // Create a wallet client with the ethereum provider
        if (window.ethereum) {
          const client = createWalletClient({
            transport: custom(window.ethereum)
          });
          setWalletClient(client);
        }
      } catch (err) {
        console.error("Failed to restore wallet connection", err);
        localStorage.removeItem("walletAddress");
      }
    }
  }, []);

  // Connect wallet function
  const connectWallet = async () => {
    if (!window.ethereum) {
      setError(new Error("No Ethereum wallet found. Please install MetaMask."));
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);

      // Request account access
      const accounts = await window.ethereum.request({ 
        method: "eth_requestAccounts" 
      }) as string[];
      
      if (accounts.length === 0) {
        throw new Error("No accounts found");
      }

      // Create a wallet client
      const client = createWalletClient({
        transport: custom(window.ethereum)
      });

      // Update state
      setAddress(accounts[0] as Address);
      setWalletClient(client);
      setIsConnected(true);
      
      // Save to localStorage
      localStorage.setItem("walletAddress", accounts[0]);
    } catch (err: any) {
      console.error("Failed to connect wallet", err);
      setError(err instanceof Error ? err : new Error(err?.message || "Unknown error"));
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    setAddress(null);
    setWalletClient(null);
    setIsConnected(false);
    localStorage.removeItem("walletAddress");
  };

  // Sign message function
  const signMessage = async (message: string): Promise<string> => {
    if (!walletClient || !address) {
      throw new Error("Wallet not connected");
    }

    try {
      const signature = await walletClient.signMessage({
        account: address,
        message
      });
      
      return signature;
    } catch (err) {
      console.error("Failed to sign message", err);
      throw err;
    }
  };

  // Verify signature function (client-side)
  const verifySignature = async (message: string, signature: string): Promise<boolean> => {
    if (!address) return false;
    
    try {
      // In a real application, you would typically verify this on the server side
      // This is a placeholder for now
      return true;
    } catch (err) {
      console.error("Failed to verify signature", err);
      return false;
    }
  };

  // Sign in with Ethereum (SIWE) function
  const signInWithEthereum = async (): Promise<boolean> => {
    if (!walletClient || !address) {
      throw new Error("Wallet not connected");
    }

    try {
      // Create SIWE message
      const domain = window.location.host;
      const origin = window.location.origin;
      const statement = "Sign in with Ethereum to HyperDAG";
      
      const siweMessage = new SiweMessage({
        domain,
        address,
        statement,
        uri: origin,
        version: '1',
        chainId: 1, // Ethereum mainnet
        nonce: crypto.randomUUID(),
      });
      
      const message = siweMessage.prepareMessage();
      
      // Sign the message
      const signature = await signMessage(message);
      
      // Verify on the server
      const res = await apiRequest("POST", "/api/auth/verify-siwe", {
        message,
        signature
      });
      
      if (!res.ok) {
        throw new Error("Failed to verify SIWE signature");
      }
      
      return true;
    } catch (err) {
      console.error("Failed to sign in with Ethereum", err);
      return false;
    }
  };

  const value = {
    address,
    isConnected,
    isConnecting,
    walletClient,
    error,
    connectWallet,
    disconnectWallet,
    signMessage,
    verifySignature,
    signInWithEthereum
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

// Combined provider wrapping MetaMask SDK
export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <MetaMaskProvider
      debug={false}
      sdkOptions={{
        dappMetadata: {
          name: "HyperDAG",
          url: window.location.href,
        }
      }}
    >
      <WalletProvider>
        {children}
      </WalletProvider>
    </MetaMaskProvider>
  );
}

// Add TypeScript declaration for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}