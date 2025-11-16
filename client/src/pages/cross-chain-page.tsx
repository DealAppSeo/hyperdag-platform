import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Info, AlertTriangle, CheckCircle2, ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Layout } from "@/components/layout/layout";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TransactionContext {
  amount: number;
  amountUSD: number;
  transactionType: string;
  userRiskTolerance: 'low' | 'medium' | 'high';
  timeConstraint: 'urgent' | 'normal' | 'flexible';
  isSmartContract: boolean;
  contractComplexity?: 'simple' | 'moderate' | 'complex';
  isDAGEnabled: boolean;
  dagConsensusLevel?: number;
}

interface BlockchainStatus {
  name: string;
  gasPrice: number;
  txFee: number;
  confirmationTime: number;
  congestion: number;
  reliability: number;
}

interface SolanaAccount {
  userId: number | string;
  publicKey: string;
  address: string;
  network: string;
}

interface TransactionStrategy {
  priorityFactors: {
    speed: number;
    cost: number;
    security: number;
  };
  recommendedChain: string;
  gasStrategy?: string;
  gasMultiplier?: number;
  timeoutSeconds?: number;
  batchingRecommended?: boolean;
  securityChecks?: string[];
  dagIntegrationStrategy?: string;
  aiReasoning: string;
  confidenceScore: number;
}

const CrossChainPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [showStrategyDialog, setShowStrategyDialog] = useState(false);
  const [currentStrategy, setCurrentStrategy] = useState<TransactionStrategy | null>(null);
  
  // Transaction context state
  const [transactionContext, setTransactionContext] = useState<TransactionContext>({
    amount: 0.1,
    amountUSD: 50,
    transactionType: "transfer",
    userRiskTolerance: "medium",
    timeConstraint: "normal",
    isSmartContract: false,
    contractComplexity: "simple",
    isDAGEnabled: true,
    dagConsensusLevel: 0.5,
  });

  // For batch transactions demo
  const [batchSize, setBatchSize] = useState(3);
  
  // Chain network status query
  const { data: chainStatus, isLoading: isLoadingChainStatus, refetch: refetchChainStatus } = useQuery({
    queryKey: ["/api/blockchain/chain-status"],
    refetchInterval: false // ❌ NO POLLING - eliminated 56 req/min overhead
  });
  
  // Solana account query
  const { data: solanaAccount, isLoading: isLoadingSolanaAccount } = useQuery({
    queryKey: ["/api/blockchain/solana/account"],
  });
  
  // Solana balance query
  const { data: solanaBalance, isLoading: isLoadingSolanaBalance } = useQuery({
    queryKey: ["/api/blockchain/solana/balance"],
    enabled: !!solanaAccount,
  });

  // Create Solana account mutation
  const createAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/blockchain/solana/create-account");
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Solana Account Created",
        description: `Public key: ${data.publicKey.slice(0, 8)}...${data.publicKey.slice(-8)}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Creating Account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Request Solana airdrop mutation
  const requestAirdropMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/blockchain/solana/request-airdrop", {
        amount: 1
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Airdrop Successful",
        description: `Received 1 SOL`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Requesting Airdrop",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Get strategy mutation
  const getStrategyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/blockchain/transaction-strategy", {
        context: transactionContext
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setCurrentStrategy(data.strategy);
      setShowStrategyDialog(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error Getting Strategy",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Process batch mutation
  const processBatchMutation = useMutation({
    mutationFn: async () => {
      // Generate mock batch transactions
      const transactions = Array.from({ length: batchSize }, (_, i) => ({
        id: `tx-${i+1}`,
        fromUserId: 1,
        toAddress: "DummyAddress" + (i+1),
        amount: 0.01,
        amountUSD: 5,
        priority: ["high", "medium", "low"][i % 3] as "high" | "medium" | "low",
        type: ["transfer", "token-transfer", "smart-contract-interaction"][i % 3],
      }));
      
      const res = await apiRequest("POST", "/api/blockchain/batch-transactions", {
        transactions
      });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Batch Processing Complete",
        description: `Successfully processed ${data.results.filter((r: any) => r.success).length} of ${batchSize} transactions`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error Processing Batch",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form input changes
  const handleInputChange = (field: keyof TransactionContext, value: any) => {
    setTransactionContext((prev) => ({
      ...prev,
      [field]: value
    }));

    // Update USD value if amount changes (assuming SOL price of $500)
    if (field === 'amount') {
      setTransactionContext((prev) => ({
        ...prev,
        amountUSD: parseFloat(value) * 500
      }));
    }
  };

  // Slider label mapping
  const getSliderLabel = (value: number) => {
    if (value <= 0.33) return "Low";
    if (value <= 0.66) return "Medium";
    return "High";
  };

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-bold mb-6">Cross-Chain AI Optimization</h1>
        
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="blockchains">Blockchains</TabsTrigger>
            <TabsTrigger value="optimizer">Transaction Optimizer</TabsTrigger>
            <TabsTrigger value="batch">Batch Processing</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cross-Chain Status</CardTitle>
                  <CardDescription>Current status of supported blockchain networks</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingChainStatus ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : chainStatus?.chains ? (
                    <div className="space-y-4">
                      {chainStatus.chains.map((chain: BlockchainStatus) => (
                        <div key={chain.name} className="flex items-center justify-between border-b pb-2">
                          <div>
                            <h3 className="font-medium">{chain.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Gas: {chain.gasPrice.toFixed(2)} | Fee: ${chain.txFee.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`w-3 h-3 rounded-full ${
                              chain.congestion < 0.3 ? "bg-green-500" : 
                              chain.congestion < 0.7 ? "bg-yellow-500" : "bg-red-500"
                            }`}></span>
                            <span className="text-sm">
                              {chain.congestion < 0.3 ? "Low" : 
                               chain.congestion < 0.7 ? "Medium" : "High"} congestion
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-6">
                      <AlertTriangle className="h-12 w-12 text-yellow-500 mb-2" />
                      <p className="text-center text-muted-foreground">
                        Could not fetch chain status. Please try again.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Your Accounts</CardTitle>
                  <CardDescription>Your connected blockchain accounts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-medium mb-2">Solana</h3>
                      {isLoadingSolanaAccount ? (
                        <div className="flex justify-center py-2">
                          <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        </div>
                      ) : solanaAccount ? (
                        <div>
                          <p className="text-sm mb-1">
                            <span className="text-muted-foreground">Address:</span>{" "}
                            {solanaAccount.publicKey.slice(0, 8)}...{solanaAccount.publicKey.slice(-8)}
                          </p>
                          <p className="text-sm">
                            <span className="text-muted-foreground">Network:</span>{" "}
                            {solanaAccount.network}
                          </p>
                          {isLoadingSolanaBalance ? (
                            <div className="flex justify-center py-2">
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            </div>
                          ) : solanaBalance ? (
                            <p className="text-sm mt-2">
                              <span className="text-muted-foreground">Balance:</span>{" "}
                              <span className="font-medium">{solanaBalance.balance} SOL</span>
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center py-2">
                          <p className="text-sm text-muted-foreground mb-2">
                            No Solana account found
                          </p>
                          <Button
                            size="sm"
                            onClick={() => createAccountMutation.mutate()}
                            disabled={createAccountMutation.isPending}
                          >
                            {createAccountMutation.isPending && (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            )}
                            Create Account
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="bg-muted p-4 rounded-lg">
                      <h3 className="font-medium mb-2">Polygon</h3>
                      <p className="text-sm text-muted-foreground">
                        Polygon integration coming soon
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("blockchains")}
                    className="w-full"
                  >
                    Manage Accounts
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>About Cross-Chain AI Optimization</CardTitle>
                <CardDescription>
                  How HyperDAG's AI-powered cross-chain compatibility works
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  HyperDAG's AI-powered cross-chain optimization system allows for intelligent routing 
                  of transactions across multiple blockchains to achieve the best balance of speed, cost, 
                  and security based on your specific requirements.
                </p>
                
                <Accordion type="single" collapsible>
                  <AccordionItem value="item-1">
                    <AccordionTrigger>Transaction Prioritization</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">
                        Our AI system analyzes your transaction context and determines the optimal 
                        prioritization factors (speed, cost, security) based on:
                      </p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Transaction amount and type</li>
                        <li>Your risk tolerance</li>
                        <li>Time constraints</li>
                        <li>Smart contract complexity</li>
                        <li>DAG consensus requirements</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-2">
                    <AccordionTrigger>Blockchain Selection</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">
                        Based on the prioritization factors, the system recommends the optimal blockchain for your transaction by evaluating:
                      </p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Current gas prices and transaction fees</li>
                        <li>Network congestion and confirmation times</li>
                        <li>Historical reliability and security features</li>
                        <li>Smart contract support and compatibility</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-3">
                    <AccordionTrigger>DAG Integration</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">
                        HyperDAG's hybrid blockchain/DAG architecture provides unique advantages:
                      </p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>High-throughput transaction processing</li>
                        <li>Reduced latency for urgent transactions</li>
                        <li>Configurable consensus levels for different security needs</li>
                        <li>Seamless interoperability with traditional blockchains</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="item-4">
                    <AccordionTrigger>Batch Processing</AccordionTrigger>
                    <AccordionContent>
                      <p className="mb-2">
                        For multiple similar transactions, our batch processing system:
                      </p>
                      <ul className="list-disc pl-6 space-y-1">
                        <li>Groups transactions by type and destination</li>
                        <li>Optimizes execution order to minimize fees</li>
                        <li>Routes each group to the most appropriate blockchain</li>
                        <li>Provides detailed execution reports and savings analysis</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab("optimizer")}
                  className="mr-2"
                >
                  Try Optimizer
                </Button>
                <Button 
                  onClick={() => setActiveTab("batch")}
                >
                  Try Batch Processing
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Blockchains Tab */}
          <TabsContent value="blockchains">
            <h2 className="text-2xl font-bold mb-4">Blockchain Networks</h2>
            <div className="grid grid-cols-1 gap-4 mb-6">
              <Tabs defaultValue="polygon">
                <TabsList className="w-full">
                  <TabsTrigger value="polygon">Polygon zkEVM</TabsTrigger>
                  <TabsTrigger value="solana">Solana</TabsTrigger>
                </TabsList>
                
                {/* Polygon Tab */}
                <TabsContent value="polygon">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Polygon zkEVM Account</CardTitle>
                        <CardDescription>Manage your Polygon zkEVM Cardona testnet account</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Network</h3>
                            <p>Polygon zkEVM Cardona Testnet</p>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Status</h3>
                            <div className="flex items-center">
                              <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                              <span>Connected (Primary Network)</span>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Features</h3>
                            <ul className="list-disc pl-5 text-sm space-y-1">
                              <li>Zero-knowledge proofs for privacy</li>
                              <li>EVM compatibility for smart contracts</li>
                              <li>Fast confirmation times (2-5 seconds)</li>
                              <li>Low transaction fees</li>
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button variant="outline">
                          Connect Wallet
                        </Button>
                        <Button>
                          Get Test Tokens
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Polygon Transactions</CardTitle>
                        <CardDescription>Send transactions on Polygon zkEVM testnet</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                              <h3 className="font-medium mb-2">Ready for Transactions</h3>
                              <p className="text-sm text-muted-foreground">
                                Polygon zkEVM is configured as your primary blockchain
                              </p>
                            </div>
                          </div>
                          <div className="pt-2">
                            <p className="text-sm text-muted-foreground mb-1">AI Optimization</p>
                            <div className="flex justify-between items-center">
                              <span className="text-sm">Use AI to optimize transactions</span>
                              <Switch defaultChecked id="use-ai-polygon" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          onClick={() => setActiveTab("optimizer")}
                          className="w-full"
                        >
                          Transaction Optimizer
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </TabsContent>
                
                {/* Solana Tab */}
                <TabsContent value="solana">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Solana Account</CardTitle>
                        <CardDescription>Manage your Solana testnet account</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoadingSolanaAccount ? (
                          <div className="flex justify-center py-6">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                          </div>
                        ) : solanaAccount ? (
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">Account Address</h3>
                              <p className="font-mono bg-muted p-2 rounded text-sm break-all">
                                {solanaAccount.publicKey}
                              </p>
                            </div>
                            
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">Network</h3>
                              <p>{solanaAccount.network}</p>
                            </div>
                            
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">Balance</h3>
                              {isLoadingSolanaBalance ? (
                                <div className="flex items-center">
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  <span>Loading...</span>
                                </div>
                              ) : solanaBalance ? (
                                <div className="flex items-center">
                                  <p className="text-2xl font-bold">{solanaBalance.balance} SOL</p>
                                  <span className="ml-2 text-muted-foreground">
                                    (~${(solanaBalance.balance * 500).toFixed(2)})
                                  </span>
                                </div>
                              ) : (
                                <p>Unable to fetch balance</p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center py-6">
                            <Info className="h-12 w-12 text-primary mb-4" />
                            <p className="text-center text-muted-foreground mb-4">
                              You don't have a Solana account yet. Create one to interact with the Solana blockchain.
                            </p>
                            <Button
                              onClick={() => createAccountMutation.mutate()}
                              disabled={createAccountMutation.isPending}
                            >
                              {createAccountMutation.isPending && (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              )}
                              Create Solana Account
                            </Button>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        {solanaAccount && (
                          <Button
                            onClick={() => requestAirdropMutation.mutate()}
                            disabled={requestAirdropMutation.isPending || !solanaAccount}
                          >
                            {requestAirdropMutation.isPending && (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            )}
                            Request Airdrop (1 SOL)
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Solana Transactions</CardTitle>
                        <CardDescription>Send SOL on the Solana testnet</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {!solanaAccount ? (
                          <div className="flex flex-col items-center py-6">
                            <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
                            <p className="text-center text-muted-foreground">
                              Create a Solana account first to make transactions
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="recipient">Recipient Address</Label>
                              <Input
                                id="recipient"
                                placeholder="Enter Solana address"
                                disabled={!solanaAccount}
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="amount">Amount (SOL)</Label>
                              <div className="flex space-x-2">
                                <Input
                                  id="amount"
                                  type="number"
                                  min="0.001"
                                  step="0.001"
                                  placeholder="0.01"
                                  disabled={!solanaAccount}
                                />
                                
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="outline" size="icon" disabled={!solanaAccount}>
                                        <ArrowRightIcon className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Send Transaction</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </div>
                            
                            <div className="pt-2">
                              <p className="text-sm text-muted-foreground mb-1">Transaction AI Optimization</p>
                              <div className="flex justify-between items-center">
                                <span className="text-sm">Use AI to optimize this transaction</span>
                                <Switch defaultChecked id="use-ai" />
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>
          
          {/* Optimizer Tab */}
          <TabsContent value="optimizer">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Transaction Optimizer</CardTitle>
                    <CardDescription>
                      Configure transaction details for AI-powered optimization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="amount">Amount</Label>
                          <div className="flex items-center space-x-2">
                            <Input
                              id="amount"
                              type="number"
                              step="0.01"
                              value={transactionContext.amount}
                              onChange={(e) => handleInputChange('amount', parseFloat(e.target.value))}
                            />
                            <span className="min-w-[80px]">SOL</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="amountUSD">USD Value</Label>
                          <Input
                            id="amountUSD"
                            type="number"
                            step="0.01"
                            value={transactionContext.amountUSD}
                            onChange={(e) => handleInputChange('amountUSD', parseFloat(e.target.value))}
                            disabled
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="transactionType">Transaction Type</Label>
                        <Select
                          value={transactionContext.transactionType}
                          onValueChange={(value) => handleInputChange('transactionType', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select transaction type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="transfer">Simple Transfer</SelectItem>
                            <SelectItem value="token-transfer">Token Transfer</SelectItem>
                            <SelectItem value="smart-contract-interaction">Smart Contract Interaction</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="userRiskTolerance">Risk Tolerance</Label>
                          <Select
                            value={transactionContext.userRiskTolerance}
                            onValueChange={(value) => handleInputChange('userRiskTolerance', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select risk tolerance" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low (Prioritize Security)</SelectItem>
                              <SelectItem value="medium">Medium (Balanced)</SelectItem>
                              <SelectItem value="high">High (Prioritize Speed/Cost)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="timeConstraint">Time Constraint</Label>
                          <Select
                            value={transactionContext.timeConstraint}
                            onValueChange={(value) => handleInputChange('timeConstraint', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select time constraint" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="urgent">Urgent (ASAP)</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="flexible">Flexible (Lower Cost)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {transactionContext.transactionType === 'smart-contract-interaction' && (
                        <div className="space-y-2">
                          <Label htmlFor="contractComplexity">Contract Complexity</Label>
                          <Select
                            value={transactionContext.contractComplexity}
                            onValueChange={(value) => handleInputChange('contractComplexity', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select contract complexity" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="simple">Simple (Basic Logic)</SelectItem>
                              <SelectItem value="moderate">Moderate (Multiple Operations)</SelectItem>
                              <SelectItem value="complex">Complex (Intensive Computations)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        <div className="flex justify-between mb-2">
                          <Label htmlFor="dagToggle">Enable DAG Integration</Label>
                          <Switch
                            id="dagToggle"
                            checked={transactionContext.isDAGEnabled}
                            onCheckedChange={(value) => handleInputChange('isDAGEnabled', value)}
                          />
                        </div>
                        
                        {transactionContext.isDAGEnabled && (
                          <div className="space-y-2">
                            <div className="flex justify-between mb-1">
                              <Label>DAG Consensus Level</Label>
                              <span className="text-sm">{getSliderLabel(transactionContext.dagConsensusLevel)}</span>
                            </div>
                            <Slider
                              defaultValue={[0.5]}
                              max={1}
                              step={0.01}
                              value={[transactionContext.dagConsensusLevel]}
                              onValueChange={(value) => handleInputChange('dagConsensusLevel', value[0])}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Faster</span>
                              <span>More Secure</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      onClick={() => getStrategyMutation.mutate()}
                      disabled={getStrategyMutation.isPending}
                      className="w-full"
                    >
                      {getStrategyMutation.isPending && (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      )}
                      Generate Optimal Transaction Strategy
                    </Button>
                  </CardFooter>
                </Card>
              </div>
              
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Optimization Factors</CardTitle>
                    <CardDescription>How different factors affect transaction optimization</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Transaction Amount</h3>
                      <p className="text-sm">
                        Larger transactions typically prioritize security over speed, while smaller transactions
                        may prioritize cost efficiency.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Risk Tolerance</h3>
                      <p className="text-sm">
                        Your risk preference determines the balance between using newer, faster networks
                        versus established, more secure chains.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Time Constraints</h3>
                      <p className="text-sm">
                        Urgent transactions prioritize confirmation speed, potentially at higher costs,
                        while flexible timing allows for cost optimization.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Contract Complexity</h3>
                      <p className="text-sm">
                        Complex contracts require networks with robust smart contract support and
                        higher gas limits, affecting blockchain selection.
                      </p>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">DAG Integration</h3>
                      <p className="text-sm">
                        Enabling DAG components allows for pre-consensus validation and parallel
                        processing, improving throughput for compatible transaction types.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Batch Processing Tab */}
          <TabsContent value="batch">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Batch Transaction Processor</CardTitle>
                  <CardDescription>
                    Optimize multiple transactions for better efficiency and lower fees
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="batchSize">Batch Size</Label>
                      <div className="flex items-center space-x-4">
                        <Slider
                          id="batchSize"
                          defaultValue={[3]}
                          min={1}
                          max={10}
                          step={1}
                          value={[batchSize]}
                          onValueChange={(value) => setBatchSize(value[0])}
                          className="flex-1"
                        />
                        <span className="font-medium min-w-[40px] text-center">{batchSize}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Number of transactions to process in this batch
                      </p>
                    </div>
                    
                    <div className="rounded-md border p-4">
                      <div className="font-medium mb-2">Batch Summary</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Transaction Types:</span>
                          <span>Mixed (Transfer, Token, Contract)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Priority Levels:</span>
                          <span>Mixed (High, Medium, Low)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Value:</span>
                          <span>${(batchSize * 5).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Estimated Gas Savings:</span>
                          <span className="text-green-600">~{(batchSize * 3.5).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="aiOptimize">AI Optimization</Label>
                        <Switch id="aiOptimize" defaultChecked />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Use AI to determine the optimal execution order and blockchain routing
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => processBatchMutation.mutate()}
                    disabled={processBatchMutation.isPending}
                    className="w-full"
                  >
                    {processBatchMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    )}
                    Process Batch
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Batch Processing Benefits</CardTitle>
                  <CardDescription>
                    How AI-optimized batch processing improves efficiency
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Gas Fee Reduction</h3>
                    <p className="text-sm">
                      By batching similar transactions together, fixed costs are amortized across
                      multiple operations, reducing the per-transaction gas cost.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Network Selection</h3>
                    <p className="text-sm">
                      Different blockchains excel at different transaction types. Our AI routes
                      each transaction subgroup to the most appropriate network.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Priority Optimization</h3>
                    <p className="text-sm">
                      High-priority transactions are processed on faster chains, while lower-priority
                      ones use more cost-effective routes.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Execution Order</h3>
                    <p className="text-sm">
                      The processing order is optimized to minimize dependencies and maximize
                      parallelization possibilities.
                    </p>
                  </div>
                  
                  <div className="pt-4">
                    <div className="font-medium mb-2">Example Savings</div>
                    <div className="bg-muted p-3 rounded-md">
                      <div className="text-sm space-y-1">
                        <div className="flex justify-between">
                          <span>Individual Processing:</span>
                          <span>$12.50</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Batch Processing:</span>
                          <span>$8.75</span>
                        </div>
                        <div className="flex justify-between font-medium border-t pt-1 mt-1">
                          <span>Savings:</span>
                          <span className="text-green-600">30%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Strategy Dialog */}
      <Dialog open={showStrategyDialog} onOpenChange={setShowStrategyDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Transaction Strategy</DialogTitle>
            <DialogDescription>
              AI-optimized strategy for your transaction
            </DialogDescription>
          </DialogHeader>
          
          {currentStrategy && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Priority Factors</h3>
                <div className="flex space-x-2">
                  <div className="flex-1 bg-blue-100 p-2 rounded-lg text-center">
                    <div className="text-xs text-muted-foreground">Speed</div>
                    <div className="font-bold">{currentStrategy.priorityFactors.speed.toFixed(1)}</div>
                  </div>
                  <div className="flex-1 bg-green-100 p-2 rounded-lg text-center">
                    <div className="text-xs text-muted-foreground">Cost</div>
                    <div className="font-bold">{currentStrategy.priorityFactors.cost.toFixed(1)}</div>
                  </div>
                  <div className="flex-1 bg-purple-100 p-2 rounded-lg text-center">
                    <div className="text-xs text-muted-foreground">Security</div>
                    <div className="font-bold">{currentStrategy.priorityFactors.security.toFixed(1)}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Recommended Chain</h3>
                <p className="font-medium">{currentStrategy.recommendedChain}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Strategy Parameters</h3>
                <div className="bg-muted p-3 rounded text-sm space-y-1">
                  {currentStrategy.gasStrategy && (
                    <div className="flex justify-between">
                      <span>Gas Strategy:</span>
                      <span className="font-medium">{currentStrategy.gasStrategy}</span>
                    </div>
                  )}
                  {currentStrategy.gasMultiplier && (
                    <div className="flex justify-between">
                      <span>Gas Multiplier:</span>
                      <span className="font-medium">{currentStrategy.gasMultiplier.toFixed(2)}x</span>
                    </div>
                  )}
                  {currentStrategy.timeoutSeconds && (
                    <div className="flex justify-between">
                      <span>Timeout:</span>
                      <span className="font-medium">{currentStrategy.timeoutSeconds}s</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Batching:</span>
                    <span className="font-medium">{currentStrategy.batchingRecommended ? 'Recommended' : 'Not needed'}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">AI Reasoning</h3>
                <p className="text-sm">{currentStrategy.aiReasoning}</p>
              </div>
              
              <div className="flex items-center justify-between bg-muted p-2 rounded">
                <span className="text-sm">Confidence Score</span>
                <div className="flex items-center">
                  <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden mr-2">
                    <div 
                      className={`h-full rounded-full ${
                        currentStrategy.confidenceScore > 0.7 ? 'bg-green-500' : 
                        currentStrategy.confidenceScore > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} 
                      style={{ width: `${currentStrategy.confidenceScore * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{(currentStrategy.confidenceScore * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setShowStrategyDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default CrossChainPage;