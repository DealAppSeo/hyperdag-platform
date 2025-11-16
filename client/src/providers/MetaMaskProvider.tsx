import { ReactNode, useState, useEffect } from 'react';
import { createContext } from 'react';

// Create a context for MetaMask functionality
export const MetaMaskContext = createContext({
  isMetaMaskAvailable: false,
  isConnected: false,
  connectWallet: async () => false as boolean,
  account: '',
});

// Simple mobile-friendly provider that doesn't cause cyclic JSON structures
const MetaMaskProvider = ({ children }: { children: ReactNode }) => {
  const [isMetaMaskAvailable, setIsMetaMaskAvailable] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState('');

  // Check for MetaMask on load
  useEffect(() => {
    const checkMetaMask = async () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        setIsMetaMaskAvailable(true);
        
        // Check if already connected
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            setAccount(accounts[0]);
            setIsConnected(true);
          }
        } catch (err) {
          console.error('Error checking MetaMask accounts:', err);
        }
      }
    };
    
    checkMetaMask();
  }, []);

  // Connect wallet function
  const connectWallet = async () => {
    if (!window.ethereum) return false;
    
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        return true;
      }
    } catch (err) {
      console.error('Error connecting to MetaMask:', err);
    }
    
    return false;
  };

  return (
    <MetaMaskContext.Provider value={{
      isMetaMaskAvailable,
      isConnected,
      connectWallet,
      account
    }}>
      {children}
    </MetaMaskContext.Provider>
  );
};

export default MetaMaskProvider;