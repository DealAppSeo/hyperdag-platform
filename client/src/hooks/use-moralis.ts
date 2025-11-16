import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

export interface TokenBalance {
  token_address: string;
  name: string;
  symbol: string;
  logo?: string;
  thumbnail?: string;
  decimals: number;
  balance: string;
  formatted_balance?: string;
}

export interface NFTItem {
  token_address: string;
  token_id: string;
  name?: string;
  symbol?: string;
  amount: string;
  contract_type: string;
  token_uri?: string;
  metadata?: any;
}

export interface Transaction {
  hash: string;
  from_address: string;
  to_address: string;
  value: string;
  gas: string;
  gas_price: string;
  block_timestamp: string;
  block_number: string;
  block_hash: string;
}

export interface TokenTransfer {
  transaction_hash: string;
  address: string;
  block_timestamp: string;
  block_number: string;
  block_hash: string;
  to_address: string;
  from_address: string;
  value: string;
}

export function useMoralis(walletAddress?: string) {
  const { toast } = useToast();
  const [address, setAddress] = useState<string>(walletAddress || '');
  const [chain, setChain] = useState<string>('eth');
  const [ensLookupValue, setEnsLookupValue] = useState<string>('');
  const [ensResult, setEnsResult] = useState<string | null>(null);
  const [addressLookupValue, setAddressLookupValue] = useState<string>('');
  const [addressResult, setAddressResult] = useState<string | null>(null);

  // Native balance query
  const {
    data: nativeBalance,
    isLoading: isLoadingNativeBalance,
    error: nativeBalanceError,
    refetch: refetchNativeBalance
  } = useQuery({
    queryKey: ['/api/moralis/balance', address, chain],
    queryFn: async () => {
      if (!address) return null;
      const res = await apiRequest('GET', `/api/moralis/balance/${address}?chain=${chain}`);
      const data = await res.json();
      return data.data?.balance;
    },
    enabled: !!address,
  });

  // Token balances query
  const {
    data: tokenBalances,
    isLoading: isLoadingTokenBalances,
    error: tokenBalancesError,
    refetch: refetchTokenBalances
  } = useQuery({
    queryKey: ['/api/moralis/tokens', address, chain],
    queryFn: async () => {
      if (!address) return [];
      const res = await apiRequest('GET', `/api/moralis/tokens/${address}?chain=${chain}`);
      const data = await res.json();
      return data.data?.tokens || [];
    },
    enabled: !!address,
  });

  // NFTs query
  const {
    data: nfts,
    isLoading: isLoadingNfts,
    error: nftsError,
    refetch: refetchNfts
  } = useQuery({
    queryKey: ['/api/moralis/nfts', address, chain],
    queryFn: async () => {
      if (!address) return [];
      const res = await apiRequest('GET', `/api/moralis/nfts/${address}?chain=${chain}`);
      const data = await res.json();
      return data.data?.nfts || [];
    },
    enabled: !!address,
  });

  // Transactions query
  const {
    data: transactions,
    isLoading: isLoadingTransactions,
    error: transactionsError,
    refetch: refetchTransactions
  } = useQuery({
    queryKey: ['/api/moralis/transactions', address, chain],
    queryFn: async () => {
      if (!address) return [];
      const res = await apiRequest('GET', `/api/moralis/transactions/${address}?chain=${chain}`);
      const data = await res.json();
      return data.data?.transactions || [];
    },
    enabled: !!address,
  });

  // Token transfers query
  const {
    data: tokenTransfers,
    isLoading: isLoadingTokenTransfers,
    error: tokenTransfersError,
    refetch: refetchTokenTransfers
  } = useQuery({
    queryKey: ['/api/moralis/token-transfers', address, chain],
    queryFn: async () => {
      if (!address) return [];
      const res = await apiRequest('GET', `/api/moralis/token-transfers/${address}?chain=${chain}`);
      const data = await res.json();
      return data.data?.transfers || [];
    },
    enabled: !!address,
  });

  // Multi-chain balances query
  const {
    data: multiChainBalances,
    isLoading: isLoadingMultiChainBalances,
    error: multiChainBalancesError,
    refetch: refetchMultiChainBalances
  } = useQuery({
    queryKey: ['/api/moralis/multi-chain-balances', address],
    queryFn: async () => {
      if (!address) return [];
      const chains = ['eth', 'polygon', 'bsc', 'arbitrum', 'optimism', 'avalanche'];
      const res = await apiRequest('GET', `/api/moralis/multi-chain-balances/${address}?chains=${chains.join(',')}`);
      const data = await res.json();
      return data.data?.balances || [];
    },
    enabled: !!address,
  });

  // Resolve ENS domain mutation
  const resolveEnsMutation = useMutation({
    mutationFn: async (domain: string) => {
      const res = await apiRequest('GET', `/api/moralis/resolve-ens/${domain}`);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success && data.data?.address) {
        setEnsResult(data.data.address);
      } else {
        setEnsResult(null);
        toast({
          title: 'ENS Resolution Failed',
          description: 'Could not resolve the ENS domain.',
          variant: 'destructive'
        });
      }
    },
    onError: (error: Error) => {
      setEnsResult(null);
      toast({
        title: 'ENS Resolution Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Resolve Address to ENS mutation
  const resolveAddressMutation = useMutation({
    mutationFn: async (address: string) => {
      const res = await apiRequest('GET', `/api/moralis/resolve-address/${address}`);
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success && data.data?.domain) {
        setAddressResult(data.data.domain);
      } else {
        setAddressResult(null);
        toast({
          title: 'Address Resolution Failed',
          description: 'Could not resolve the address to an ENS domain.',
          variant: 'destructive'
        });
      }
    },
    onError: (error: Error) => {
      setAddressResult(null);
      toast({
        title: 'Address Resolution Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const resolveEns = (domain: string) => {
    setEnsLookupValue(domain);
    resolveEnsMutation.mutate(domain);
  };

  const resolveAddress = (address: string) => {
    setAddressLookupValue(address);
    resolveAddressMutation.mutate(address);
  };

  const refreshAllData = () => {
    if (address) {
      refetchNativeBalance();
      refetchTokenBalances();
      refetchNfts();
      refetchTransactions();
      refetchTokenTransfers();
      refetchMultiChainBalances();
    }
  };

  return {
    // State
    address,
    setAddress,
    chain,
    setChain,
    ensLookupValue,
    ensResult,
    addressLookupValue,
    addressResult,
    
    // Data
    nativeBalance,
    tokenBalances,
    nfts,
    transactions,
    tokenTransfers,
    multiChainBalances,
    
    // Loading states
    isLoadingNativeBalance,
    isLoadingTokenBalances,
    isLoadingNfts,
    isLoadingTransactions,
    isLoadingTokenTransfers,
    isLoadingMultiChainBalances,
    isResolvingEns: resolveEnsMutation.isPending,
    isResolvingAddress: resolveAddressMutation.isPending,
    
    // Errors
    nativeBalanceError,
    tokenBalancesError,
    nftsError,
    transactionsError,
    tokenTransfersError,
    multiChainBalancesError,
    
    // Functions
    resolveEns,
    resolveAddress,
    refreshAllData,
  };
}
