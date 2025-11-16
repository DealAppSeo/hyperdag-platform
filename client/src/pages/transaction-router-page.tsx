import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { 
  BarChart, 
  Terminal, 
  Activity, 
  Shield, 
  Eye, 
  Database, 
  Brain, 
  Cpu, 
  Zap, 
  BadgeCheck, 
  FileCheck, 
  RefreshCcw,
  ArrowRight,
  Bitcoin,
  BarChart4
} from 'lucide-react';
import AnimatedNetworkLines from '@/components/animated-network-lines';
import TransactionRouterExplanation from '@/components/transaction-router-explanation';

// Transaction types from the backend
enum TransactionType {
  PAYMENT = 'payment',
  DATA_STORAGE = 'data-storage',
  SMART_CONTRACT = 'smart-contract',
  TOKEN_TRANSFER = 'token-transfer',
  NFT_TRANSFER = 'nft-transfer',
  VERIFICATION = 'verification',
  IDENTITY = 'identity',
  DOCUMENT_NOTARIZATION = 'document-notarization'
}

// Requirements interface
interface TransactionRequirements {
  speed: number;
  cost: number;
  security: number;
  privacy: number;
  dataSize: number;
  complexity: number;
}

// Network metrics interface
interface NetworkMetrics {
  id: string;
  name: string;
  status: string;
  metrics: {
    txFee: number;
    confirmationTime: number;
    congestion: number;
    reliability: number;
  };
  capabilities: {
    smartContracts: boolean;
    maxDataSize: number;
    throughput: number;
  };
}

// Component for the transaction router page
const TransactionRouterPage: React.FC = () => {
  const { toast } = useToast();
  const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.PAYMENT);
  const [requirements, setRequirements] = useState<TransactionRequirements>({
    speed: 0.5,
    cost: 0.5,
    security: 0.5,
    privacy: 0.5,
    dataSize: 5000,
    complexity: 0.5
  });
  const [activeTab, setActiveTab] = useState('parameters');

  // Fetch network status
  const { data: networkStatus, isLoading: isLoadingNetworks, error: networkError, refetch: refetchNetworks } = useQuery({
    queryKey: ['/api/blockchain/networks/status'],
    refetchInterval: false // ❌ NO POLLING - eliminated 2 req/min overhead
  });

  // Mutation to route a transaction
  const routeTransactionMutation = useMutation({
    mutationFn: async (data: { transactionType: TransactionType, requirements: TransactionRequirements }) => {
      const response = await apiRequest('POST', '/api/blockchain/route-transaction', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Transaction routing complete',
        description: 'The optimal network has been determined',
      });
      setActiveTab('results');
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to route transaction',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    },
  });

  // Handler for submitting the routing request
  const handleRouteTransaction = () => {
    routeTransactionMutation.mutate({ transactionType, requirements });
  };

  // Get transaction type icon
  const getTransactionTypeIcon = (type: TransactionType) => {
    switch (type) {
      case TransactionType.PAYMENT:
        return <Bitcoin className="mr-2 h-4 w-4" />;
      case TransactionType.DATA_STORAGE:
        return <Database className="mr-2 h-4 w-4" />;
      case TransactionType.SMART_CONTRACT:
        return <Terminal className="mr-2 h-4 w-4" />;
      case TransactionType.TOKEN_TRANSFER:
        return <RefreshCcw className="mr-2 h-4 w-4" />;
      case TransactionType.NFT_TRANSFER:
        return <BarChart4 className="mr-2 h-4 w-4" />;
      case TransactionType.VERIFICATION:
        return <BadgeCheck className="mr-2 h-4 w-4" />;
      case TransactionType.IDENTITY:
        return <Shield className="mr-2 h-4 w-4" />;
      case TransactionType.DOCUMENT_NOTARIZATION:
        return <FileCheck className="mr-2 h-4 w-4" />;
      default:
        return <Activity className="mr-2 h-4 w-4" />;
    }
  };

  // Update a specific requirement
  const updateRequirement = (key: keyof TransactionRequirements, value: number) => {
    setRequirements(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Format data size for display
  const formatDataSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Reset requirements to default values
  const resetRequirements = () => {
    const defaults = {
      speed: 0.5,
      cost: 0.5,
      security: 0.5,
      privacy: 0.5,
      dataSize: 5000,
      complexity: 0.5
    };
    setRequirements(defaults);
  };

  // Dynamically determine the optimal preset based on transaction type
  const applyOptimalPreset = () => {
    switch (transactionType) {
      case TransactionType.PAYMENT:
        setRequirements({
          speed: 0.8,
          cost: 0.5,
          security: 0.9,
          privacy: 0.6,
          dataSize: 500,
          complexity: 0.2
        });
        break;
      case TransactionType.DATA_STORAGE:
        setRequirements({
          speed: 0.2,
          cost: 0.9,
          security: 0.7,
          privacy: 0.5,
          dataSize: 50000,
          complexity: 0.3
        });
        break;
      case TransactionType.SMART_CONTRACT:
        setRequirements({
          speed: 0.6,
          cost: 0.4,
          security: 0.95,
          privacy: 0.7,
          dataSize: 10000,
          complexity: 0.9
        });
        break;
      case TransactionType.VERIFICATION:
        setRequirements({
          speed: 0.9,
          cost: 0.3,
          security: 0.95,
          privacy: 0.7,
          dataSize: 2000,
          complexity: 0.4
        });
        break;
      case TransactionType.IDENTITY:
        setRequirements({
          speed: 0.5,
          cost: 0.4,
          security: 0.99,
          privacy: 0.95,
          dataSize: 3000,
          complexity: 0.7
        });
        break;
      default:
        resetRequirements();
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Intelligent Transaction Router</h1>
          <p className="text-muted-foreground mt-1">
            Optimize transaction routing across multiple chains and DAGs based on specific requirements
          </p>
        </div>
        <div className="flex gap-2">
          <TransactionRouterExplanation />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetchNetworks()}
            disabled={isLoadingNetworks}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh Networks
          </Button>
        </div>
      </div>

      <AnimatedNetworkLines className="h-24 my-4" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Network Status Panel */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5" />
              Network Status
            </CardTitle>
            <CardDescription>
              Real-time metrics of available networks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
            {isLoadingNetworks ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : networkError ? (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Failed to load network status. Please try again.
                </AlertDescription>
              </Alert>
            ) : (
              networkStatus?.networks?.map((network: NetworkMetrics) => (
                <Card key={network.id} className="mb-4 bg-muted/30">
                  <CardHeader className="py-2 px-4">
                    <CardTitle className="text-md flex items-center justify-between">
                      {network.name}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        network.status === 'online' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'
                      }`}>
                        {network.status}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 px-4 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center text-muted-foreground">
                        <Zap className="mr-1 h-3 w-3" />
                        Tx Fee:
                      </div>
                      <div className="text-right">${network.metrics.txFee.toFixed(4)}</div>
                      
                      <div className="flex items-center text-muted-foreground">
                        <Activity className="mr-1 h-3 w-3" />
                        Confirm:
                      </div>
                      <div className="text-right">{network.metrics.confirmationTime.toFixed(1)}s</div>
                      
                      <div className="flex items-center text-muted-foreground">
                        <BarChart className="mr-1 h-3 w-3" />
                        Congestion:
                      </div>
                      <div className="text-right">{(network.metrics.congestion * 100).toFixed(0)}%</div>
                      
                      <div className="flex items-center text-muted-foreground">
                        <Shield className="mr-1 h-3 w-3" />
                        Reliability:
                      </div>
                      <div className="text-right">{(network.metrics.reliability * 100).toFixed(0)}%</div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Transaction Configuration Panel */}
        <div className="lg:col-span-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="parameters">
                <Terminal className="mr-2 h-4 w-4" />
                Parameters
              </TabsTrigger>
              <TabsTrigger value="results">
                <BarChart className="mr-2 h-4 w-4" />
                Results
              </TabsTrigger>
            </TabsList>

            {/* Parameters Tab */}
            <TabsContent value="parameters" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Transaction Parameters</CardTitle>
                  <CardDescription>
                    Configure transaction type and requirements
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Transaction Type Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="transaction-type">Transaction Type</Label>
                    <Select 
                      value={transactionType} 
                      onValueChange={(value) => setTransactionType(value as TransactionType)}
                    >
                      <SelectTrigger id="transaction-type">
                        <SelectValue placeholder="Select transaction type" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.values(TransactionType).map((type) => (
                          <SelectItem key={type} value={type}>
                            <div className="flex items-center">
                              {getTransactionTypeIcon(type as TransactionType)}
                              {type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {/* Quick Presets */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Quick Presets</Label>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={applyOptimalPreset}
                      >
                        <Brain className="mr-2 h-4 w-4" />
                        Optimal for {transactionType.replace('-', ' ')}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={resetRequirements}
                      >
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Reset to Balanced
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Sliders for Requirements */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="speed-slider" className="flex items-center">
                          <Zap className="mr-2 h-4 w-4" />
                          Speed Priority
                        </Label>
                        <span className="text-sm text-muted-foreground">
                          {(requirements.speed * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Slider
                        id="speed-slider"
                        min={0}
                        max={1}
                        step={0.05}
                        value={[requirements.speed]}
                        onValueChange={(value) => updateRequirement('speed', value[0])}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="cost-slider" className="flex items-center">
                          <Bitcoin className="mr-2 h-4 w-4" />
                          Cost Sensitivity
                        </Label>
                        <span className="text-sm text-muted-foreground">
                          {(requirements.cost * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Slider
                        id="cost-slider"
                        min={0}
                        max={1}
                        step={0.05}
                        value={[requirements.cost]}
                        onValueChange={(value) => updateRequirement('cost', value[0])}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="security-slider" className="flex items-center">
                          <Shield className="mr-2 h-4 w-4" />
                          Security Needs
                        </Label>
                        <span className="text-sm text-muted-foreground">
                          {(requirements.security * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Slider
                        id="security-slider"
                        min={0}
                        max={1}
                        step={0.05}
                        value={[requirements.security]}
                        onValueChange={(value) => updateRequirement('security', value[0])}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="privacy-slider" className="flex items-center">
                          <Eye className="mr-2 h-4 w-4" />
                          Privacy Needs
                        </Label>
                        <span className="text-sm text-muted-foreground">
                          {(requirements.privacy * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Slider
                        id="privacy-slider"
                        min={0}
                        max={1}
                        step={0.05}
                        value={[requirements.privacy]}
                        onValueChange={(value) => updateRequirement('privacy', value[0])}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="data-size-input" className="flex items-center">
                          <Database className="mr-2 h-4 w-4" />
                          Data Size
                        </Label>
                        <span className="text-sm text-muted-foreground">
                          {formatDataSize(requirements.dataSize)}
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <Input
                          id="data-size-input"
                          type="number"
                          min={0}
                          value={requirements.dataSize}
                          onChange={(e) => updateRequirement('dataSize', parseInt(e.target.value) || 0)}
                        />
                        <Select 
                          value={
                            requirements.dataSize >= 1024 * 1024 ? "MB" :
                            requirements.dataSize >= 1024 ? "KB" : "B"
                          }
                          onValueChange={(value) => {
                            const baseValue = 
                              value === "MB" ? requirements.dataSize / (1024 * 1024) :
                              value === "KB" ? requirements.dataSize / 1024 : 
                              requirements.dataSize;
                            
                            const newValue = 
                              value === "MB" ? Math.round(baseValue * (1024 * 1024)) :
                              value === "KB" ? Math.round(baseValue * 1024) : 
                              Math.round(baseValue);
                            
                            updateRequirement('dataSize', newValue);
                          }}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue placeholder="Unit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="B">Bytes</SelectItem>
                            <SelectItem value="KB">Kilobytes</SelectItem>
                            <SelectItem value="MB">Megabytes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="complexity-slider" className="flex items-center">
                          <Cpu className="mr-2 h-4 w-4" />
                          Computational Complexity
                        </Label>
                        <span className="text-sm text-muted-foreground">
                          {(requirements.complexity * 100).toFixed(0)}%
                        </span>
                      </div>
                      <Slider
                        id="complexity-slider"
                        min={0}
                        max={1}
                        step={0.05}
                        value={[requirements.complexity]}
                        onValueChange={(value) => updateRequirement('complexity', value[0])}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button 
                    onClick={handleRouteTransaction}
                    disabled={routeTransactionMutation.isPending}
                  >
                    {routeTransactionMutation.isPending ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        Route Transaction
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Routing Results</CardTitle>
                  <CardDescription>
                    AI-optimized transaction routing recommendation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {routeTransactionMutation.isPending ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                      <p className="mt-4 text-muted-foreground">Analyzing networks and optimizing route...</p>
                    </div>
                  ) : !routeTransactionMutation.data ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        Configure transaction parameters and click "Route Transaction" to get an AI-optimized recommendation
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="bg-accent/30 p-4 rounded-lg">
                        <h3 className="text-lg font-semibold mb-2 flex items-center">
                          <BadgeCheck className="mr-2 h-5 w-5 text-primary" />
                          Recommended Network
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Network</p>
                            <p className="text-xl font-semibold">
                              {networkStatus?.networks?.find((n: NetworkMetrics) => 
                                n.id === routeTransactionMutation.data.recommendation.network
                              )?.name || routeTransactionMutation.data.recommendation.network}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Confidence</p>
                            <p className="text-xl font-semibold">
                              {(routeTransactionMutation.data.recommendation.confidence * 100).toFixed(0)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Estimated Cost</p>
                            <p className="text-xl font-semibold">
                              ${routeTransactionMutation.data.recommendation.estimatedCost.toFixed(4)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Estimated Time</p>
                            <p className="text-xl font-semibold">
                              {routeTransactionMutation.data.recommendation.estimatedTime.toFixed(1)}s
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-md font-semibold mb-2">Reasoning</h3>
                        <p className="text-sm text-muted-foreground">
                          {routeTransactionMutation.data.recommendation.reason}
                        </p>
                      </div>

                      {routeTransactionMutation.data.recommendation.zeroKnowledgeProofBenefits && (
                        <div className="bg-primary/10 p-3 rounded-lg">
                          <h3 className="text-sm font-semibold mb-1 flex items-center">
                            <Shield className="mr-2 h-4 w-4 text-primary" />
                            Privacy Benefits
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {routeTransactionMutation.data.recommendation.zeroKnowledgeProofBenefits}
                          </p>
                        </div>
                      )}

                      {routeTransactionMutation.data.recommendation.alternativeNetworks && (
                        <div>
                          <h3 className="text-md font-semibold mb-2">Alternative Networks</h3>
                          <div className="space-y-2">
                            {routeTransactionMutation.data.recommendation.alternativeNetworks.map((alt: any, index: number) => (
                              <div key={index} className="bg-muted/50 p-3 rounded-lg">
                                <p className="text-sm font-medium">
                                  {networkStatus?.networks?.find((n: NetworkMetrics) => n.id === alt.network)?.name || alt.network}
                                </p>
                                <p className="text-xs text-muted-foreground">{alt.reason}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => setActiveTab('parameters')}>
                    Back to Parameters
                  </Button>
                  {routeTransactionMutation.data && (
                    <Button onClick={() => handleRouteTransaction()}>
                      Re-evaluate Route
                      <RefreshCcw className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default TransactionRouterPage;