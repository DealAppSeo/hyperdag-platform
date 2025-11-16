/**
 * Blockchain Redundancy Dashboard
 * 
 * This page displays the blockchain redundancy status and allows users to
 * interact with the multi-chain system, including the IOTA testnet integration.
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Network, 
  RefreshCw, 
  Shield, 
  Link, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  AlertCircle,
  Wallet,
  Send,
  Repeat,
  Loader2
} from 'lucide-react';
import { Link as RouterLink } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { queryClient } from '@/lib/queryClient';

// Define types for blockchain status
type BlockchainProvider = 'polygon' | 'solana' | 'iota' | 'stellar';
type BlockchainServiceMode = 'available' | 'degraded' | 'limited' | 'unavailable';

interface BlockchainServiceStatus {
  mode: BlockchainServiceMode;
  providers: {
    polygon: boolean;
    solana: boolean;
    iota: boolean;
    stellar: boolean;
  };
  primaryProvider: BlockchainProvider | null;
  lastUpdated: string;
}

interface BlockchainAccount {
  provider: BlockchainProvider;
  address: string;
  balance: number;
  explorerUrl?: string;
}

// Helper functions for UI
const getModeColor = (mode: BlockchainServiceMode) => {
  switch (mode) {
    case 'available': return 'text-green-500';
    case 'degraded': return 'text-amber-500';
    case 'limited': return 'text-orange-500';
    case 'unavailable': return 'text-red-500';
    default: return 'text-gray-500';
  }
};

const getProviderIcon = (provider: BlockchainProvider) => {
  switch (provider) {
    case 'polygon': return '⬡'; // Polygon symbol
    case 'solana': return '◎'; // Solana symbol
    case 'iota': return 'ℹ'; // IOTA symbol
    case 'stellar': return '✧'; // Stellar symbol
    default: return '?';
  }
};

export default function BlockchainRedundancyPage() {
  const { toast } = useToast();
  const [transferAmount, setTransferAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<BlockchainProvider | ''>('');

  // Fetch blockchain status (NO POLLING - manual refresh available)
  const {
    data: status,
    isLoading: isStatusLoading,
    error: statusError,
    refetch: refetchStatus
  } = useQuery<{ success: boolean; data: BlockchainServiceStatus }>({
    queryKey: ['/api/blockchain/status'],
    refetchInterval: false // ❌ NO POLLING - eliminated 2 req/min
  });

  // Fetch account balances
  const {
    data: balances,
    isLoading: isBalancesLoading,
    error: balancesError,
    refetch: refetchBalances
  } = useQuery<{ success: boolean; data: Record<BlockchainProvider, BlockchainAccount | null> }>({
    queryKey: ['/api/blockchain/balances'],
    enabled: !!status?.data.mode, // Only fetch if status is available
  });

  // Create account mutation
  const createAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/blockchain/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Accounts Created',
        description: 'Blockchain accounts have been created successfully',
      });
      // Refresh balances
      refetchBalances();
    },
    onError: (error: any) => {
      toast({
        title: 'Account Creation Failed',
        description: error.message || 'Failed to create blockchain accounts',
        variant: 'destructive',
      });
    }
  });

  // Request testnet tokens mutation
  const requestTokensMutation = useMutation({
    mutationFn: async (provider?: BlockchainProvider) => {
      const response = await fetch('/api/blockchain/testnet/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Request Submitted',
        description: 'Testnet tokens request has been submitted successfully',
      });
      // Refresh balances after a delay to allow for token receipt
      setTimeout(() => refetchBalances(), 5000);
    },
    onError: (error: any) => {
      toast({
        title: 'Request Failed',
        description: error.message || 'Failed to request testnet tokens',
        variant: 'destructive',
      });
    }
  });

  // Transfer tokens mutation
  const transferMutation = useMutation({
    mutationFn: async (data: { 
      toAddress: string;
      amount: number;
      provider?: BlockchainProvider;
    }) => {
      const response = await fetch('/api/blockchain/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Transfer Successful',
        description: 'Tokens have been transferred successfully',
      });
      // Reset form
      setTransferAmount('');
      setRecipientAddress('');
      // Refresh balances
      refetchBalances();
    },
    onError: (error: any) => {
      toast({
        title: 'Transfer Failed',
        description: error.message || 'Failed to transfer tokens',
        variant: 'destructive',
      });
    }
  });

  // Refresh provider status mutation (admin only)
  const refreshProvidersMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/blockchain/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Providers Refreshed',
        description: 'Blockchain provider status has been refreshed',
      });
      // Refresh status and balances
      refetchStatus();
      refetchBalances();
    },
    onError: (error: any) => {
      toast({
        title: 'Refresh Failed',
        description: error.message || 'Failed to refresh provider status',
        variant: 'destructive',
      });
    }
  });

  // Handle transfer submission
  const handleTransfer = () => {
    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid positive amount',
        variant: 'destructive',
      });
      return;
    }

    if (!recipientAddress) {
      toast({
        title: 'Missing Address',
        description: 'Please enter a recipient address',
        variant: 'destructive',
      });
      return;
    }

    transferMutation.mutate({
      toAddress: recipientAddress,
      amount,
      provider: selectedProvider as BlockchainProvider || undefined,
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Blockchain Redundancy System</h1>
            <p className="text-muted-foreground mt-1">
              Multi-chain redundancy with automatic failover across Polygon, Solana, IOTA, and Stellar
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => refetchStatus()}
              disabled={isStatusLoading}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refreshProvidersMutation.mutate()}
              disabled={refreshProvidersMutation.isPending}
            >
              <Repeat className="h-4 w-4 mr-2" />
              Refresh Providers
            </Button>
          </div>
        </div>

        {status?.data.mode && (
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Redundancy {status.data.mode}</AlertTitle>
            <AlertDescription>
              The blockchain redundancy system is currently in {' '}
              <span className={getModeColor(status.data.mode)}>{status.data.mode}</span> mode.
              {status.data.primaryProvider && (
                <> Using <strong>{status.data.primaryProvider}</strong> as the primary provider.</>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>

      <Tabs defaultValue="status">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="status">
            <Network className="h-4 w-4 mr-2" />
            Provider Status
          </TabsTrigger>
          <TabsTrigger value="accounts">
            <Wallet className="h-4 w-4 mr-2" />
            Accounts & Balances
          </TabsTrigger>
          <TabsTrigger value="transfer">
            <Send className="h-4 w-4 mr-2" />
            Transfer Tokens
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Blockchain Provider Status</CardTitle>
              <CardDescription>
                View the status of all blockchain providers in the redundancy layer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isStatusLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : statusError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to load blockchain status information
                  </AlertDescription>
                </Alert>
              ) : status?.data ? (
                <div className="space-y-4">
                  <div>
                    <div className="mb-3 font-medium">Service Mode</div>
                    <Badge className={`${getModeColor(status.data.mode)} bg-transparent`}>
                      {status.data.mode.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="mb-3 font-medium">Primary Provider</div>
                  {status.data.primaryProvider ? (
                    <Badge variant="outline">
                      {getProviderIcon(status.data.primaryProvider)} {status.data.primaryProvider}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">No primary provider available</span>
                  )}
                  
                  <div>
                    <div className="mb-3 font-medium">Provider Availability</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(status.data.providers).map(([provider, isAvailable]) => (
                        <div key={provider} className="flex items-center gap-2">
                          {isAvailable ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="capitalize">{provider}</span>
                          <span>
                            {isAvailable ? (
                              <Badge variant="outline" className="ml-auto text-green-500">Online</Badge>
                            ) : (
                              <Badge variant="outline" className="ml-auto text-red-500">Offline</Badge>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-4">
                    Last updated: {new Date(status.data.lastUpdated).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <AlertTriangle className="h-8 w-8 mx-auto text-amber-500 mb-2" />
                  <p>No status information available</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => refetchStatus()}
                disabled={isStatusLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="accounts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Blockchain Accounts</CardTitle>
              <CardDescription>
                View your accounts and balances across multiple blockchain networks
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isBalancesLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : balancesError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to load blockchain account information
                  </AlertDescription>
                </Alert>
              ) : balances?.data ? (
                <div className="space-y-6">
                  {Object.entries(balances.data).some(([_, account]) => account !== null) ? (
                    Object.entries(balances.data).map(([provider, account]) => 
                      account && (
                        <div key={provider} className="border rounded-lg p-4">
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-medium capitalize">
                              {getProviderIcon(provider as BlockchainProvider)} {provider}
                            </h3>
                            <Badge variant={status?.data.providers[provider as BlockchainProvider] ? "outline" : "secondary"}>
                              {status?.data.providers[provider as BlockchainProvider] ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Address</span>
                              <code className="text-xs bg-muted p-1 rounded truncate">
                                {account.address}
                              </code>
                            </div>
                            
                            <div className="flex flex-col">
                              <span className="text-sm text-muted-foreground">Balance</span>
                              <span className="font-mono">
                                {account.balance.toLocaleString()} {provider.toUpperCase()}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mt-2">
                            {account.explorerUrl && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={account.explorerUrl} target="_blank" rel="noopener noreferrer">
                                  <Link className="h-4 w-4 mr-2" />
                                  View on Explorer
                                </a>
                              </Button>
                            )}
                            
                            <Button 
                              variant="secondary" 
                              size="sm"
                              onClick={() => requestTokensMutation.mutate(provider as BlockchainProvider)}
                              disabled={requestTokensMutation.isPending || !status?.data.providers[provider as BlockchainProvider]}
                            >
                              Request Testnet Tokens
                            </Button>
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <div className="text-center py-6">
                      <AlertTriangle className="h-10 w-10 mx-auto text-amber-500 mb-3" />
                      <h3 className="text-lg font-medium mb-2">No accounts found</h3>
                      <p className="text-muted-foreground mb-4">
                        You don't have any blockchain accounts yet. Create accounts to get started.
                      </p>
                      <Button
                        onClick={() => createAccountMutation.mutate()}
                        disabled={createAccountMutation.isPending}
                      >
                        Create Accounts
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <AlertTriangle className="h-10 w-10 mx-auto text-amber-500 mb-3" />
                  <h3 className="text-lg font-medium mb-2">No account data</h3>
                  <p className="text-muted-foreground mb-4">
                    Failed to load account information
                  </p>
                  <Button
                    onClick={() => refetchBalances()}
                  >
                    Retry
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => refetchBalances()}
                disabled={isBalancesLoading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Balances
              </Button>
              
              <Button
                onClick={() => createAccountMutation.mutate()}
                disabled={createAccountMutation.isPending}
              >
                <Wallet className="h-4 w-4 mr-2" />
                {!balances?.data || Object.values(balances.data).every(acc => acc === null)
                  ? "Create Accounts"
                  : "Recreate Accounts"
                }
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="transfer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transfer Tokens</CardTitle>
              <CardDescription>
                Send tokens using the optimal blockchain provider with automatic failover
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient Address</Label>
                  <Input
                    id="recipient"
                    placeholder="Enter recipient address"
                    value={recipientAddress}
                    onChange={(e) => setRecipientAddress(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="Enter amount to send"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="provider">Provider (Optional)</Label>
                  <Select value={selectedProvider} onValueChange={(value) => setSelectedProvider(value as BlockchainProvider | '')}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a provider or leave empty for auto-selection" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Auto-select optimal provider</SelectItem>
                      {status?.data && Object.entries(status.data.providers)
                        .filter(([_, isAvailable]) => isAvailable)
                        .map(([provider]) => (
                          <SelectItem key={provider} value={provider}>
                            {getProviderIcon(provider as BlockchainProvider)} {provider}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedProvider && (
                  <Alert className="mt-2">
                    <InfoIcon className="h-4 w-4" />
                    <AlertTitle>Using {selectedProvider}</AlertTitle>
                    <AlertDescription>
                      You've selected to use {selectedProvider} for this transfer.
                      If this provider is unavailable, the transfer will fail.
                    </AlertDescription>
                  </Alert>
                )}
              </form>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={handleTransfer}
                disabled={
                  transferMutation.isPending ||
                  !recipientAddress ||
                  !transferAmount ||
                  parseFloat(transferAmount) <= 0 ||
                  (status?.data && status.data.mode === 'unavailable')
                }
              >
                {transferMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Transfer Tokens
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Helper components
const InfoIcon = AlertCircle;