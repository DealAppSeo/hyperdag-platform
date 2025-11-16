import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { 
  Activity,
  Brain,
  Globe,
  Database,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  PieChart,
  BarChart3,
  Check,
  Plus,
  Zap,
  CheckCircle,
  Bell
} from "lucide-react";

interface ResourceConfig {
  serviceType: string;
  enabled: boolean;
  sharePercentage: number;
  minPrice: number;
  autoArbitrage: boolean;
  priority: 'low' | 'medium' | 'high';
  global_enabled?: boolean;
  service_id?: string;
  sharing_enabled?: boolean;
  share_percentage?: number;
  min_price?: number;
}

interface ArbitrageOpportunity {
  id: string;
  serviceType: string;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  profitMargin: number;
  volume: number;
  risk: 'low' | 'medium' | 'high';
  timeframe: string;
}

interface MarketMakerOrder {
  id: string;
  serviceType: string;
  orderType: 'buy' | 'sell';
  triggerPrice: number;
  targetPrice: number;
  quantity: number;
  status: 'active' | 'filled' | 'cancelled' | 'expired';
  createdAt: string;
  filledAt?: string;
  filledPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

function AutomatedResourceSharingPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [showMarketMakerDialog, setShowMarketMakerDialog] = useState(false);
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [showExecutionAlert, setShowExecutionAlert] = useState(false);
  
  // Market Maker Order Form State
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [serviceType, setServiceType] = useState('');
  const [triggerPrice, setTriggerPrice] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');

  // Mock data - in production, this would come from APIs
  const resourceConfigs: ResourceConfig[] = [
    {
      serviceType: 'AI Compute',
      enabled: true,
      sharePercentage: 75,
      minPrice: 0.50,
      autoArbitrage: true,
      priority: 'high'
    },
    {
      serviceType: 'Storage',
      enabled: true,
      sharePercentage: 60,
      minPrice: 0.10,
      autoArbitrage: false,
      priority: 'medium'
    },
    {
      serviceType: 'Bandwidth',
      enabled: false,
      sharePercentage: 50,
      minPrice: 0.05,
      autoArbitrage: true,
      priority: 'low'
    }
  ];

  const arbitrageOpportunities: ArbitrageOpportunity[] = [
    {
      id: '1',
      serviceType: 'AI Compute',
      buyPrice: 0.45,
      sellPrice: 0.65,
      profit: 0.20,
      profitMargin: 44.4,
      volume: 1250,
      risk: 'low',
      timeframe: '2h'
    },
    {
      id: '2',
      serviceType: 'Storage',
      buyPrice: 0.08,
      sellPrice: 0.12,
      profit: 0.04,
      profitMargin: 50.0,
      volume: 800,
      risk: 'medium',
      timeframe: '4h'
    }
  ];

  const marketMakerOrders: MarketMakerOrder[] = [
    {
      id: '1',
      serviceType: 'AI Compute',
      orderType: 'buy',
      triggerPrice: 0.40,
      targetPrice: 0.60,
      quantity: 500,
      status: 'active',
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      id: '2',
      serviceType: 'Storage',
      orderType: 'sell',
      triggerPrice: 0.15,
      targetPrice: 0.12,
      quantity: 300,
      status: 'filled',
      createdAt: '2024-01-15T09:15:00Z',
      filledAt: '2024-01-15T11:20:00Z',
      filledPrice: 0.13
    }
  ];

  const updateResourceConfig = useMutation({
    mutationFn: async (config: ResourceConfig) => {
      return apiRequest('/api/resources/config', 'PUT', config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resources/config'] });
      toast({
        title: "Configuration Updated",
        description: "Resource sharing settings have been saved successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const executeArbitrage = useMutation({
    mutationFn: async (opportunityId: string) => {
      return apiRequest('/api/arbitrage/execute', 'POST', { opportunityId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/arbitrage/opportunities'] });
      setShowExecutionAlert(true);
      toast({
        title: "Arbitrage Executed",
        description: "Trade has been executed successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Execution Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const createMarketMakerOrder = useMutation({
    mutationFn: async (orderData: any) => {
      return apiRequest('/api/market-maker/orders', 'POST', orderData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/market-maker/orders'] });
      setShowMarketMakerDialog(false);
      toast({
        title: "Order Created",
        description: "Market maker order has been placed successfully."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Order Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleCreateOrder = () => {
    const orderData = {
      serviceType,
      orderType,
      triggerPrice: parseFloat(triggerPrice),
      targetPrice: parseFloat(targetPrice),
      quantity: parseInt(quantity),
      stopLoss: stopLoss ? parseFloat(stopLoss) : undefined,
      takeProfit: takeProfit ? parseFloat(takeProfit) : undefined
    };
    createMarketMakerOrder.mutate(orderData);
  };

  const getServiceIcon = (serviceId: string) => {
    switch (serviceId) {
      case 'AI Compute': return <Brain className="h-4 w-4" />;
      case 'Storage': return <Database className="h-4 w-4" />;
      case 'Bandwidth': return <Globe className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automated Resource Sharing</h1>
          <p className="text-muted-foreground">
            Optimize resource allocation and maximize revenue through intelligent automation
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Resource
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="arbitrage">Arbitrage</TabsTrigger>
          <TabsTrigger value="market-maker">Market Maker</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$2,847.50</div>
                <p className="text-xs text-muted-foreground">+12.5% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Resources</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Array.isArray(resourceConfigs) ? resourceConfigs.filter((config: ResourceConfig) => config.enabled).length : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {Array.isArray(resourceConfigs) ? resourceConfigs.length : 0} total configured
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Arbitrage Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$186.25</div>
                <p className="text-xs text-muted-foreground">+8.2% efficiency</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Market Orders</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Array.isArray(marketMakerOrders) ? marketMakerOrders.filter((order: MarketMakerOrder) => order.status === 'active').length : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {Array.isArray(marketMakerOrders) ? marketMakerOrders.filter((order: MarketMakerOrder) => order.status === 'filled').length : 0} filled today
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Resource Configuration</CardTitle>
                <CardDescription>
                  Configure sharing parameters for each resource type
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {resourceConfigs.map((config) => (
                  <div key={config.serviceType} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getServiceIcon(config.serviceType)}
                      <div>
                        <div className="font-medium">{config.serviceType}</div>
                        <div className="text-sm text-muted-foreground">
                          Min: {formatCurrency(config.minPrice)} • {config.sharePercentage}% shared
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(config.priority)}>
                        {config.priority}
                      </Badge>
                      <Switch
                        checked={config.enabled}
                        onCheckedChange={(checked) => {
                          updateResourceConfig.mutate({
                            ...config,
                            enabled: checked
                          });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Real-time performance across all resources
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">AI Compute Utilization</span>
                    <span className="text-sm text-muted-foreground">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Storage Efficiency</span>
                    <span className="text-sm text-muted-foreground">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Revenue Optimization</span>
                    <span className="text-sm text-muted-foreground">78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Network Bandwidth</span>
                    <span className="text-sm text-muted-foreground">65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="arbitrage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Arbitrage Opportunities</CardTitle>
              <CardDescription>
                Automated detection and execution of profitable price differences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.isArray(arbitrageOpportunities) && arbitrageOpportunities.map((opportunity: ArbitrageOpportunity) => (
                  <div key={opportunity.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      {getServiceIcon(opportunity.serviceType)}
                      <div>
                        <div className="font-medium">{opportunity.serviceType}</div>
                        <div className="text-sm text-muted-foreground">
                          Buy: {formatCurrency(opportunity.buyPrice)} • Sell: {formatCurrency(opportunity.sellPrice)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-medium text-green-600">
                          +{formatCurrency(opportunity.profit)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {opportunity.profitMargin.toFixed(1)}% margin
                        </div>
                      </div>
                      <Badge className={`${getRiskColor(opportunity.risk)} border-current`} variant="outline">
                        {opportunity.risk} risk
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => executeArbitrage.mutate(opportunity.id)}
                        disabled={executeArbitrage.isPending}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Execute
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="market-maker" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">Market Maker Orders</h2>
              <p className="text-sm text-muted-foreground">
                Automated buy/sell orders to provide liquidity and capture spreads
              </p>
            </div>
            <Dialog open={showMarketMakerDialog} onOpenChange={setShowMarketMakerDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Order
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create Market Maker Order</DialogTitle>
                  <DialogDescription>
                    Set up automated trading parameters for market making
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="service-type" className="text-right">
                      Service
                    </Label>
                    <Select value={serviceType} onValueChange={setServiceType}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AI Compute">AI Compute</SelectItem>
                        <SelectItem value="Storage">Storage</SelectItem>
                        <SelectItem value="Bandwidth">Bandwidth</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="order-type" className="text-right">
                      Type
                    </Label>
                    <Select value={orderType} onValueChange={(value: 'buy' | 'sell') => setOrderType(value)}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="buy">Buy Order</SelectItem>
                        <SelectItem value="sell">Sell Order</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="trigger-price" className="text-right">
                      Trigger Price
                    </Label>
                    <Input
                      id="trigger-price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={triggerPrice}
                      onChange={(e) => setTriggerPrice(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="target-price" className="text-right">
                      Target Price
                    </Label>
                    <Input
                      id="target-price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={targetPrice}
                      onChange={(e) => setTargetPrice(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="quantity" className="text-right">
                      Quantity
                    </Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="0"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowMarketMakerDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateOrder} disabled={createMarketMakerOrder.isPending}>
                    {createMarketMakerOrder.isPending ? "Creating..." : "Create Order"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="space-y-1">
                {marketMakerOrders.map((order: MarketMakerOrder) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border-b last:border-b-0">
                    <div className="flex items-center gap-4">
                      {getServiceIcon(order.serviceType)}
                      <div>
                        <div className="font-medium">{order.serviceType}</div>
                        <div className="text-sm text-muted-foreground">
                          {order.orderType.toUpperCase()} • Trigger: {formatCurrency(order.triggerPrice)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(order.targetPrice)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Qty: {order.quantity}
                        </div>
                      </div>
                      <Badge 
                        variant={order.status === 'active' ? 'default' : 
                               order.status === 'filled' ? 'secondary' : 'outline'}
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-xs text-muted-foreground">+23% from last week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94.2%</div>
                <p className="text-xs text-muted-foreground">+1.5% improvement</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$12.45</div>
                <p className="text-xs text-muted-foreground">Per successful trade</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.1</div>
                <p className="text-xs text-muted-foreground">Low risk profile</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showExecutionAlert} onOpenChange={setShowExecutionAlert}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Trade Executed Successfully
            </DialogTitle>
            <DialogDescription>
              Your arbitrage opportunity has been executed successfully
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Profit Realized</span>
                <span className="text-lg font-bold text-green-600">+$186.25</span>
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Buy Price:</span>
                  <span>$0.45</span>
                </div>
                <div className="flex justify-between">
                  <span>Sell Price:</span>
                  <span>$0.65</span>
                </div>
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span>1,250 units</span>
                </div>
                <div className="flex justify-between">
                  <span>Transaction Fee:</span>
                  <span>0.5 HDAG</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowExecutionAlert(false)} className="flex-1">
                Close
              </Button>
              <Button className="flex-1">
                View Details
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AutomatedResourceSharingPage;