import { ReactNode } from 'react';
import { MetaMaskProvider } from '@/web3/hooks/useMetaMask';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const blockchainQueryClient = new QueryClient();

interface Web3ProviderProps {
  children: ReactNode;
}

/**
 * A wrapper component that provides Web3 functionality to the application
 */
export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <QueryClientProvider client={blockchainQueryClient}>
      <MetaMaskProvider>
        {children}
      </MetaMaskProvider>
    </QueryClientProvider>
  );
}
