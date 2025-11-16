import { useState } from 'react';
import { useMoralis } from '@/hooks/use-moralis';
import { useAuth } from '@/hooks/use-auth';
import { useWeb3 } from '@/web3/hooks/useWeb3';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, RefreshCw, Wallet, Link, File, Database, HardDrive } from 'lucide-react';

// Helper to format addresses
const formatAddress = (address: string) => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

// Helper to format timestamp
const formatTimestamp = (timestamp: string) => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch (e) {
    return timestamp;
  }
};

// Helper to format amount with token symbol
const formatAmount = (amount: string, decimals: number = 18, symbol: string = 'ETH') => {
  try {
    // Parse the amount as a big number
    const parsedAmount = parseFloat(amount) / Math.pow(10, decimals);
    return `${parsedAmount.toFixed(6)} ${symbol}`;
  } catch (e) {
    return `${amount} ${symbol}`;
  }
};

export function MoralisExplorer() {
  const { user } = useAuth();
  const { address: connectedAddress, isConnected } = useWeb3();
  const [manualAddress, setManualAddress] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Use wallet address from web3 hook if connected, otherwise use manual entry
  const walletAddress = isConnected ? connectedAddress : manualAddress;
  
  const {
    address,
    setAddress,
    chain,
    setChain,
    nativeBalance,
    tokenBalances,
    nfts,
    transactions,
    tokenTransfers,
    multiChainBalances,
    ensLookupValue,
    ensResult,
    addressLookupValue,
    addressResult,
    resolveEns,
    resolveAddress,
    isLoadingNativeBalance,
    isLoadingTokenBalances,
    isLoadingNfts,
    isLoadingTransactions,
    isLoadingTokenTransfers,
    isLoadingMultiChainBalances,
    isResolvingEns,
    isResolvingAddress,
    refreshAllData,
  } = useMoralis(walletAddress);

  // Update Moralis hook when wallet address changes
  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddress(manualAddress);
  };

  // Handle ENS lookup
  const [ensInput, setEnsInput] = useState('');
  const handleEnsLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (ensInput) resolveEns(ensInput);
  };

  // Handle Address to ENS lookup
  const [addressInput, setAddressInput] = useState('');
  const handleAddressLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (addressInput) resolveAddress(addressInput);
  };

  // Render loading spinner
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center p-4">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );

  // Render no data message
  const NoDataMessage = ({ message = "No data available" }) => (
    <div className="text-center p-4 text-muted-foreground">
      <p>{message}</p>
    </div>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="mr-2 h-5 w-5" />
          Moralis Blockchain Explorer
        </CardTitle>
        <CardDescription>
          Explore blockchain data using Moralis APIs, including balances, NFTs, and transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Address Input Section */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Wallet Address</h3>
            
            {isConnected ? (
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="py-1 px-3">
                  {formatAddress(connectedAddress || '')}
                </Badge>
                <Badge variant="secondary">Connected via Web3</Badge>
              </div>
            ) : (
              <form onSubmit={handleAddressSubmit} className="flex space-x-2">
                <Input 
                  placeholder="Enter wallet address (0x...)" 
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={!manualAddress}>
                  Search
                </Button>
              </form>
            )}
            
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Label>Chain:</Label>
              <Select value={chain} onValueChange={setChain}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select chain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eth">Ethereum</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="bsc">Binance Smart Chain</SelectItem>
                  <SelectItem value="arbitrum">Arbitrum</SelectItem>
                  <SelectItem value="optimism">Optimism</SelectItem>
                  <SelectItem value="avalanche">Avalanche</SelectItem>
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshAllData}
                disabled={!address}
                className="ml-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </div>

          <Separator />

          {/* ENS Resolution Section */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">ENS Lookup</h3>
              <form onSubmit={handleEnsLookup} className="flex space-x-2">
                <Input 
                  placeholder="vitalik.eth" 
                  value={ensInput}
                  onChange={(e) => setEnsInput(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" variant="secondary" size="sm" disabled={!ensInput || isResolvingEns}>
                  {isResolvingEns ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Resolve'}
                </Button>
              </form>
              {ensResult && (
                <div className="mt-2 p-2 bg-muted rounded-md text-sm">
                  <span className="font-semibold">Address:</span> {ensResult}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Address to ENS</h3>
              <form onSubmit={handleAddressLookup} className="flex space-x-2">
                <Input 
                  placeholder="0x..." 
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" variant="secondary" size="sm" disabled={!addressInput || isResolvingAddress}>
                  {isResolvingAddress ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Lookup'}
                </Button>
              </form>
              {addressResult && (
                <div className="mt-2 p-2 bg-muted rounded-md text-sm">
                  <span className="font-semibold">ENS Domain:</span> {addressResult}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Data Display Section */}
          {address ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="tokens">Tokens</TabsTrigger>
                <TabsTrigger value="nfts">NFTs</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="transfers">Transfers</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {/* Native Balance Card */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Native Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoadingNativeBalance ? (
                        <LoadingSpinner />
                      ) : nativeBalance ? (
                        <div className="text-2xl font-bold">
                          {formatAmount(nativeBalance, 18, chain === 'eth' ? 'ETH' : chain === 'polygon' ? 'MATIC' : 'BNB')}
                        </div>
                      ) : (
                        <NoDataMessage message="No balance data" />
                      )}
                    </CardContent>
                  </Card>

                  {/* Multi-Chain Balances */}
                  <Card className="md:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Multi-Chain Balances</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isLoadingMultiChainBalances ? (
                        <LoadingSpinner />
                      ) : multiChainBalances && multiChainBalances.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {multiChainBalances.map((item: any, index: number) => (
                            <div key={index} className="p-2 border rounded-md">
                              <div className="text-sm font-medium capitalize">{item.chain}</div>
                              <div className="text-base mt-1">
                                {formatAmount(
                                  item.balance,
                                  18,
                                  item.chain === 'eth' ? 'ETH' : 
                                  item.chain === 'polygon' ? 'MATIC' : 
                                  item.chain === 'bsc' ? 'BNB' : 
                                  item.chain === 'arbitrum' ? 'ETH' : 
                                  item.chain === 'optimism' ? 'ETH' : 'AVAX'
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <NoDataMessage message="No multi-chain balance data" />
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                {/* Token Overview */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Token Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingTokenBalances ? (
                      <LoadingSpinner />
                    ) : tokenBalances && tokenBalances.length > 0 ? (
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground mb-2">
                          Showing first 5 tokens. View all in the Tokens tab.
                        </div>
                        <div className="grid gap-2">
                          {tokenBalances.slice(0, 5).map((token: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                              <div className="flex items-center">
                                {token.logo ? (
                                  <Avatar className="h-6 w-6 mr-2">
                                    <AvatarImage src={token.logo} alt={token.symbol} />
                                    <AvatarFallback>{token.symbol?.substring(0, 2) || "??"}</AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center mr-2 text-xs">
                                    {token.symbol?.substring(0, 2) || "??"}
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">{token.symbol || "Unknown"}</div>
                                  <div className="text-xs text-muted-foreground">{token.name || "Unknown Token"}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">
                                  {formatAmount(token.balance, token.decimals || 18, '')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatAddress(token.token_address)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <NoDataMessage message="No token balances found" />
                    )}
                  </CardContent>
                </Card>
                
                {/* NFT Overview */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">NFT Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingNfts ? (
                      <LoadingSpinner />
                    ) : nfts && nfts.length > 0 ? (
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground mb-2">
                          Showing first 4 NFTs. View all in the NFTs tab.
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {nfts.slice(0, 4).map((nft: any, index: number) => {
                            // Try to get the image URL from metadata
                            let imageUrl = "";
                            try {
                              if (nft.metadata) {
                                const metadata = typeof nft.metadata === 'string' 
                                  ? JSON.parse(nft.metadata) 
                                  : nft.metadata;
                                imageUrl = metadata.image || metadata.image_url || metadata.image_data || "";
                                // If IPFS, convert to gateway URL
                                if (imageUrl && imageUrl.startsWith('ipfs://')) {
                                  imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
                                }
                              }
                            } catch (e) {
                              console.error("Error parsing NFT metadata", e);
                            }
                            
                            return (
                              <div key={index} className="border rounded-md overflow-hidden flex flex-col">
                                <div className="aspect-square w-full bg-muted flex items-center justify-center overflow-hidden">
                                  {imageUrl ? (
                                    <img src={imageUrl} alt={nft.name || `NFT #${nft.token_id}`} className="w-full h-full object-cover" />
                                  ) : (
                                    <File className="h-12 w-12 text-muted-foreground" />
                                  )}
                                </div>
                                <div className="p-2">
                                  <div className="text-sm font-medium truncate">
                                    {nft.name || `${nft.symbol || 'NFT'} #${nft.token_id}`}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    ID: {nft.token_id}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <NoDataMessage message="No NFTs found" />
                    )}
                  </CardContent>
                </Card>
                
                {/* Recent Activity */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingTransactions ? (
                      <LoadingSpinner />
                    ) : transactions && transactions.length > 0 ? (
                      <div className="space-y-2">
                        <div className="text-sm text-muted-foreground mb-2">
                          Showing last 5 transactions.
                        </div>
                        <div className="grid gap-2">
                          {transactions.slice(0, 5).map((tx: any, index: number) => (
                            <div key={index} className="p-2 border rounded-md">
                              <div className="flex justify-between">
                                <div className="text-sm font-medium truncate max-w-[70%]">Transaction: {formatAddress(tx.hash)}</div>
                                <div className="text-xs text-muted-foreground">{formatTimestamp(tx.block_timestamp)}</div>
                              </div>
                              <div className="mt-1 grid grid-cols-2 gap-1 text-xs">
                                <div>
                                  <span className="text-muted-foreground">From:</span> {formatAddress(tx.from_address)}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">To:</span> {formatAddress(tx.to_address || '')}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Value:</span> {formatAmount(tx.value || '0', 18)}
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Block:</span> {tx.block_number}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <NoDataMessage message="No transaction history found" />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tokens Tab */}
              <TabsContent value="tokens" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Token Balances</CardTitle>
                    <CardDescription>
                      ERC-20 tokens held in this wallet on {chain === 'eth' ? 'Ethereum' : 
                        chain === 'polygon' ? 'Polygon' : 
                        chain === 'bsc' ? 'Binance Smart Chain' : 
                        chain === 'arbitrum' ? 'Arbitrum' : 
                        chain === 'optimism' ? 'Optimism' : 'Avalanche'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingTokenBalances ? (
                      <LoadingSpinner />
                    ) : tokenBalances && tokenBalances.length > 0 ? (
                      <div className="space-y-4">
                        <div className="rounded-md border">
                          <div className="grid grid-cols-12 p-3 bg-muted text-sm font-medium">
                            <div className="col-span-5">Token</div>
                            <div className="col-span-3 text-right">Balance</div>
                            <div className="col-span-4 text-right">Address</div>
                          </div>
                          {tokenBalances.map((token: any, index: number) => (
                            <div key={index} className="grid grid-cols-12 p-3 border-t items-center">
                              <div className="col-span-5 flex items-center">
                                {token.logo ? (
                                  <Avatar className="h-6 w-6 mr-2">
                                    <AvatarImage src={token.logo} alt={token.symbol} />
                                    <AvatarFallback>{token.symbol?.substring(0, 2) || "??"}</AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center mr-2 text-xs">
                                    {token.symbol?.substring(0, 2) || "??"}
                                  </div>
                                )}
                                <div>
                                  <div className="font-medium">{token.symbol || "Unknown"}</div>
                                  <div className="text-xs text-muted-foreground">{token.name || "Unknown Token"}</div>
                                </div>
                              </div>
                              <div className="col-span-3 text-right">
                                <div className="font-medium">
                                  {formatAmount(token.balance, token.decimals || 18, '')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {token.symbol}
                                </div>
                              </div>
                              <div className="col-span-4 text-right">
                                <div className="text-sm">
                                  {formatAddress(token.token_address)}
                                </div>
                                <a 
                                  href={`https://${chain === 'eth' ? 'etherscan.io' : 
                                    chain === 'polygon' ? 'polygonscan.com' : 
                                    chain === 'bsc' ? 'bscscan.com' : 
                                    chain === 'arbitrum' ? 'arbiscan.io' : 
                                    chain === 'optimism' ? 'optimistic.etherscan.io' : 
                                    'snowtrace.io'}/token/${token.token_address}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-500 hover:underline flex items-center justify-end"
                                >
                                  <Link className="h-3 w-3 mr-1" />
                                  View on explorer
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <NoDataMessage message="No token balances found" />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* NFTs Tab */}
              <TabsContent value="nfts" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>NFT Collection</CardTitle>
                    <CardDescription>
                      Non-fungible tokens (ERC-721 and ERC-1155) held in this wallet
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingNfts ? (
                      <LoadingSpinner />
                    ) : nfts && nfts.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {nfts.map((nft: any, index: number) => {
                          // Try to get the image URL from metadata
                          let imageUrl = "";
                          let attributes = [];
                          try {
                            if (nft.metadata) {
                              const metadata = typeof nft.metadata === 'string' 
                                ? JSON.parse(nft.metadata) 
                                : nft.metadata;
                              imageUrl = metadata.image || metadata.image_url || metadata.image_data || "";
                              // If IPFS, convert to gateway URL
                              if (imageUrl && imageUrl.startsWith('ipfs://')) {
                                imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
                              }
                              attributes = metadata.attributes || [];
                            }
                          } catch (e) {
                            console.error("Error parsing NFT metadata", e);
                          }
                          
                          return (
                            <Card key={index} className="overflow-hidden">
                              <div className="aspect-square w-full bg-muted flex items-center justify-center overflow-hidden">
                                {imageUrl ? (
                                  <img src={imageUrl} alt={nft.name || `NFT #${nft.token_id}`} className="w-full h-full object-cover" />
                                ) : (
                                  <File className="h-16 w-16 text-muted-foreground" />
                                )}
                              </div>
                              <CardContent className="p-3">
                                <h3 className="font-medium truncate">
                                  {nft.name || `${nft.symbol || 'NFT'} #${nft.token_id}`}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {nft.contract_type || 'Unknown'} · ID: {nft.token_id}
                                </p>
                                
                                {attributes && attributes.length > 0 && (
                                  <div className="mt-2">
                                    <p className="text-xs font-medium mb-1">Attributes:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {attributes.slice(0, 3).map((attr: any, i: number) => (
                                        <Badge key={i} variant="outline" className="text-xs">
                                          {attr.trait_type}: {attr.value}
                                        </Badge>
                                      ))}
                                      {attributes.length > 3 && (
                                        <Badge variant="outline" className="text-xs">+{attributes.length - 3} more</Badge>
                                      )}
                                    </div>
                                  </div>
                                )}
                                
                                <div className="mt-2">
                                  <a 
                                    href={`https://${chain === 'eth' ? 'opensea.io' : 'opensea.io/polygon'}/assets/${nft.token_address}/${nft.token_id}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-500 hover:underline flex items-center"
                                  >
                                    <Link className="h-3 w-3 mr-1" />
                                    View on OpenSea
                                  </a>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    ) : (
                      <NoDataMessage message="No NFTs found in this wallet" />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Transactions Tab */}
              <TabsContent value="transactions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>
                      Recent transactions for this wallet on the {chain === 'eth' ? 'Ethereum' : 
                        chain === 'polygon' ? 'Polygon' : 
                        chain === 'bsc' ? 'Binance Smart Chain' : 
                        chain === 'arbitrum' ? 'Arbitrum' : 
                        chain === 'optimism' ? 'Optimism' : 'Avalanche'} network
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingTransactions ? (
                      <LoadingSpinner />
                    ) : transactions && transactions.length > 0 ? (
                      <div className="rounded-md border">
                        <div className="grid grid-cols-12 p-3 bg-muted text-sm font-medium">
                          <div className="col-span-3">Hash</div>
                          <div className="col-span-2">Block</div>
                          <div className="col-span-3">From</div>
                          <div className="col-span-3">To</div>
                          <div className="col-span-1 text-right">Value</div>
                        </div>
                        {transactions.map((tx: any, index: number) => {
                          // Determine if this wallet is the sender or receiver
                          const isSender = tx.from_address.toLowerCase() === address.toLowerCase();
                          const isReceiver = tx.to_address && tx.to_address.toLowerCase() === address.toLowerCase();
                          
                          return (
                            <div key={index} className="grid grid-cols-12 p-3 border-t">
                              <div className="col-span-3">
                                <div className="truncate text-sm font-medium">
                                  {formatAddress(tx.hash)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatTimestamp(tx.block_timestamp)}
                                </div>
                                <a 
                                  href={`https://${chain === 'eth' ? 'etherscan.io' : 
                                    chain === 'polygon' ? 'polygonscan.com' : 
                                    chain === 'bsc' ? 'bscscan.com' : 
                                    chain === 'arbitrum' ? 'arbiscan.io' : 
                                    chain === 'optimism' ? 'optimistic.etherscan.io' : 
                                    'snowtrace.io'}/tx/${tx.hash}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-500 hover:underline flex items-center"
                                >
                                  <Link className="h-3 w-3 mr-1" />
                                  View
                                </a>
                              </div>
                              <div className="col-span-2">
                                <div className="text-sm">{tx.block_number}</div>
                                <div className="text-xs text-muted-foreground">Gas: {parseInt(tx.gas || '0').toLocaleString()}</div>
                              </div>
                              <div className="col-span-3">
                                <div className="truncate text-sm">
                                  {isSender ? (
                                    <Badge variant="secondary" className="mr-1 py-0">OUT</Badge>
                                  ) : null}
                                  {formatAddress(tx.from_address)}
                                </div>
                              </div>
                              <div className="col-span-3">
                                <div className="truncate text-sm">
                                  {isReceiver ? (
                                    <Badge variant="default" className="mr-1 py-0">IN</Badge>
                                  ) : null}
                                  {tx.to_address ? formatAddress(tx.to_address) : 'Contract Creation'}
                                </div>
                              </div>
                              <div className="col-span-1 text-right">
                                <div className="text-sm">
                                  {formatAmount(tx.value || '0', 18, '')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {chain === 'eth' ? 'ETH' : 
                                   chain === 'polygon' ? 'MATIC' : 
                                   chain === 'bsc' ? 'BNB' : 
                                   chain === 'arbitrum' ? 'ETH' : 
                                   chain === 'optimism' ? 'ETH' : 'AVAX'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <NoDataMessage message="No transaction history found" />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Transfers Tab */}
              <TabsContent value="transfers" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Token Transfers</CardTitle>
                    <CardDescription>
                      ERC-20 token transfers for this wallet
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingTokenTransfers ? (
                      <LoadingSpinner />
                    ) : tokenTransfers && tokenTransfers.length > 0 ? (
                      <div className="rounded-md border">
                        <div className="grid grid-cols-12 p-3 bg-muted text-sm font-medium">
                          <div className="col-span-3">Transaction</div>
                          <div className="col-span-3">Token</div>
                          <div className="col-span-2">From</div>
                          <div className="col-span-2">To</div>
                          <div className="col-span-2 text-right">Value</div>
                        </div>
                        {tokenTransfers.map((transfer: any, index: number) => {
                          // Determine if this wallet is the sender or receiver
                          const isSender = transfer.from_address.toLowerCase() === address.toLowerCase();
                          const isReceiver = transfer.to_address.toLowerCase() === address.toLowerCase();
                          
                          return (
                            <div key={index} className="grid grid-cols-12 p-3 border-t">
                              <div className="col-span-3">
                                <div className="truncate text-sm font-medium">
                                  {formatAddress(transfer.transaction_hash)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatTimestamp(transfer.block_timestamp)}
                                </div>
                                <a 
                                  href={`https://${chain === 'eth' ? 'etherscan.io' : 
                                    chain === 'polygon' ? 'polygonscan.com' : 
                                    chain === 'bsc' ? 'bscscan.com' : 
                                    chain === 'arbitrum' ? 'arbiscan.io' : 
                                    chain === 'optimism' ? 'optimistic.etherscan.io' : 
                                    'snowtrace.io'}/tx/${transfer.transaction_hash}`} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-500 hover:underline flex items-center"
                                >
                                  <Link className="h-3 w-3 mr-1" />
                                  View
                                </a>
                              </div>
                              <div className="col-span-3">
                                <div className="text-sm font-medium">
                                  {transfer.token_symbol || 'Unknown'}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {transfer.token_name || 'Unknown Token'}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatAddress(transfer.address)}
                                </div>
                              </div>
                              <div className="col-span-2">
                                <div className="truncate text-sm">
                                  {isSender ? (
                                    <Badge variant="secondary" className="mr-1 py-0">YOU</Badge>
                                  ) : null}
                                  {formatAddress(transfer.from_address)}
                                </div>
                              </div>
                              <div className="col-span-2">
                                <div className="truncate text-sm">
                                  {isReceiver ? (
                                    <Badge variant="default" className="mr-1 py-0">YOU</Badge>
                                  ) : null}
                                  {formatAddress(transfer.to_address)}
                                </div>
                              </div>
                              <div className="col-span-2 text-right">
                                <div className="text-sm">
                                  {formatAmount(transfer.value || '0', transfer.token_decimals || 18, '')}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {transfer.token_symbol || 'tokens'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <NoDataMessage message="No token transfers found" />
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="border rounded-md p-4 bg-muted/50">
              <h3 className="text-lg font-medium mb-2">Enter a wallet address to explore</h3>
              <p className="text-muted-foreground">
                Connect your Web3 wallet or enter a wallet address above to view blockchain data.
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4 pb-2">
        <div className="w-full text-xs text-muted-foreground">
          <p>Data provided by Moralis. For educational and demonstration purposes only.</p>
        </div>
      </CardFooter>
    </Card>
  );
}