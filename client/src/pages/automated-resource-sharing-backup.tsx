import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/layout";

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
  CheckCircle
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

export default function AutomatedResourceSharing() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'earning' | 'demand'>('earning');
  const [incomeProjection, setIncomeProjection] = useState<'minimum' | 'mid' | 'maximum'>('mid');
  
  // Market Maker Order States
  const [showMarketMakerDialog, setShowMarketMakerDialog] = useState(false);
  const [selectedServiceForOrder, setSelectedServiceForOrder] = useState<string>('');
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [triggerPrice, setTriggerPrice] = useState<number>(0);
  const [targetPrice, setTargetPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [stopLoss, setStopLoss] = useState<number>(0);
  const [takeProfit, setTakeProfit] = useState<number>(0);

  // Fetch user's service allocations and usage with default empty array
  const { data: serviceAllocations = [] } = useQuery({
    queryKey: ['/api/resources/allocations'],
    retry: false,
  });

  // Fetch current arbitrage opportunities with default empty array
  const { data: arbitrageOpportunities = [] } = useQuery({
    queryKey: ['/api/resources/arbitrage-opportunities'],
    retry: false,
  });

  // Fetch user's automation settings with default values
  const { data: automationSettings = { global_enabled: false } } = useQuery({
    queryKey: ['/api/resources/automation-settings'],
    retry: false,
  });

  // Fetch market demand data for supply/demand analytics
  const { data: marketDemand = [] } = useQuery({
    queryKey: ['/api/resources/market-demand'],
    retry: false,
  });

  // Fetch user's market maker orders
  const { data: marketMakerOrders = [] } = useQuery({
    queryKey: ['/api/resources/market-maker-orders'],
    retry: false,
  });

  // Update automation settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<ResourceConfig>) => {
      const res = await apiRequest("POST", "/api/resources/update-automation", settings);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resources/automation-settings'] });
      toast({
        title: "Settings Updated",
        description: "Your automation settings have been saved.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update automation settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Create market maker order
  const createMarketMakerOrderMutation = useMutation({
    mutationFn: async (orderData: Omit<MarketMakerOrder, 'id' | 'status' | 'createdAt'>) => {
      const res = await apiRequest("POST", "/api/resources/market-maker-orders", orderData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resources/market-maker-orders'] });
      setShowMarketMakerDialog(false);
      resetOrderForm();
      toast({
        title: "Order Created",
        description: "Your automated trading order has been placed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Order Failed",
        description: "Failed to create market maker order. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Cancel market maker order
  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest("DELETE", `/api/resources/market-maker-orders/${orderId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/resources/market-maker-orders'] });
      toast({
        title: "Order Cancelled",
        description: "Your automated trading order has been cancelled.",
      });
    },
  });

  // Helper functions
  const resetOrderForm = () => {
    setSelectedServiceForOrder('');
    setOrderType('buy');
    setTriggerPrice(0);
    setTargetPrice(0);
    setQuantity(1);
    setStopLoss(0);
    setTakeProfit(0);
  };

  const handleCreateMarketMakerOrder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const orderData = {
      serviceType: selectedServiceForOrder,
      orderType,
      triggerPrice,
      targetPrice,
      quantity,
      stopLoss: stopLoss || undefined,
      takeProfit: takeProfit || undefined,
    };

    createMarketMakerOrderMutation.mutate(orderData);
  };

  // Service icons mapping
  const serviceIcons = {
    'chatgpt': Brain,
    'anthropic': Brain,
    'grok': Brain,
    'perplexity': Brain,
    'huggingface': Brain,
    'replit': Activity,
    'runpod': Activity,
    'graph-protocol': Globe,
    'moralis': Globe,
    'alchemy': Globe,
    'thirdweb': Globe,
    'infura': Globe,
    'bacalhau': Database,
    'akash': Database,
    'vercel': Database,
    'netlify': Database,
    'arweave': Database,
    'cloudflare': Database,
    'ethereum-gas': DollarSign,
    'polygon-gas': DollarSign,
    'solana-gas': DollarSign,
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Calculate potential income based on selected services and projection tier
  const calculatePotentialIncome = () => {
    if (!Array.isArray(serviceAllocations)) return { daily: 0, weekly: 0, monthly: 0 };

    const selectedServiceData = serviceAllocations.filter((service: any) => 
      selectedServices.includes(service.id)
    );

    const totalHourlyRate = selectedServiceData.reduce((total: number, service: any) => {
      let rate = service.hourly_rate || 0;
      
      // Apply projection multipliers
      if (incomeProjection === 'minimum') rate *= 0.6;
      else if (incomeProjection === 'maximum') rate *= 1.8;
      
      // Apply demand premium from market data
      const marketData = Array.isArray(marketDemand) ? 
        marketDemand.find((m: any) => m.service_type === service.type) : null;
      if (marketData?.demand_status === 'high') rate *= 1.3;
      else if (marketData?.demand_status === 'critical') rate *= 1.6;
      
      return total + rate;
    }, 0);

    return {
      daily: totalHourlyRate * 24,
      weekly: totalHourlyRate * 24 * 7,
      monthly: totalHourlyRate * 24 * 30
    };
  };

  // Sort services based on selected criteria
  const getSortedServices = () => {
    if (!Array.isArray(serviceAllocations)) return [];
    
    return [...serviceAllocations].sort((a: any, b: any) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'usage':
          return (b.usage_percentage || 0) - (a.usage_percentage || 0);
        case 'earning':
          return (b.hourly_rate || 0) - (a.hourly_rate || 0);
        case 'demand':
          const aDemand = Array.isArray(marketDemand) ? 
            marketDemand.find((m: any) => m.service_type === a.type) : null;
          const bDemand = Array.isArray(marketDemand) ? 
            marketDemand.find((m: any) => m.service_type === b.type) : null;
          const aPriority = aDemand?.demand_status === 'critical' ? 3 : 
                           aDemand?.demand_status === 'high' ? 2 : 1;
          const bPriority = bDemand?.demand_status === 'critical' ? 3 : 
                           bDemand?.demand_status === 'high' ? 2 : 1;
          return bPriority - aPriority;
        default:
          return 0;
      }
    });
  };

  // Get supply/demand status for a service
  const getSupplyDemandStatus = (serviceType: string) => {
    if (!Array.isArray(marketDemand)) return { status: 'balanced', premium: 0 };
    
    const marketData = marketDemand.find((m: any) => m.service_type === serviceType);
    if (!marketData) return { status: 'balanced', premium: 0 };
    
    return {
      status: marketData.demand_status || 'balanced',
      premium: marketData.premium_multiplier || 0,
      shortage: marketData.supply_shortage || false
    };
  };

  // Modular ServiceCard Component for Mobile-First Design
  const ServiceCard = ({ service, category, IconComponent }: {
    service: any;
    category: string;
    IconComponent: any;
  }) => (
    <Card className="relative hover:shadow-md transition-shadow">
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className={`p-1.5 sm:p-2 rounded-lg ${
              category === 'AI' ? 'bg-purple-50' : 
              category === 'Web3' ? 'bg-blue-50' : 'bg-green-50'
            }`}>
              <IconComponent className={`w-3 h-3 sm:w-4 sm:h-4 ${
                category === 'AI' ? 'text-purple-600' : 
                category === 'Web3' ? 'text-blue-600' : 'text-green-600'
              }`} />
            </div>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-sm sm:text-base truncate">{service.name}</CardTitle>
              <CardDescription className="text-xs hidden sm:block">
                {service.description}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {service.sharing_enabled && (
              <Badge variant="outline" className="text-green-600 border-green-600 text-xs">
                Active
              </Badge>
            )}
            {service.referral_program?.available && (
              <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs">
                {service.referral_program.commission}%
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3">
        <div>
          <div className="flex justify-between text-xs mb-1">
            <span>Usage</span>
            <span>{service.usage_percentage}%</span>
          </div>
          <Progress value={service.usage_percentage} className="h-1.5" />
        </div>
        
        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs">
          <div>
            <Label className="text-gray-600 text-xs">Allocated</Label>
            <p className="font-medium text-sm">{service.allocated_units} {service.unit_type}</p>
          </div>
          <div>
            <Label className="text-gray-600 text-xs">Available</Label>
            <p className="font-medium text-green-600 text-sm">{service.available_units} {service.unit_type}</p>
          </div>
        </div>

        {service.sharing_enabled && (
          <div className="pt-2 border-t">
            <div className="flex justify-between text-xs">
              <span>Earning Rate</span>
              <span className="font-medium text-green-600">
                {formatCurrency(service.hourly_rate)}/hr
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold">Decentralized Service Marketplace</h1>
          <p className="text-gray-600 mt-2">
            HyperDAG's revolutionary marketplace enables automated resource sharing, letting you monetize unused service allocations while accessing premium resources at optimal rates through intelligent arbitrage and supply-demand balancing
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="px-3 py-1">
            <Activity className="w-4 h-4 mr-1" />
            Auto-Optimization Active
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="portfolio">My Portfolio</TabsTrigger>
          <TabsTrigger value="arbitrage">Arbitrage</TabsTrigger>
          <TabsTrigger value="market-maker">Market Maker</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 md:space-y-6">
          {/* Mobile-First Service Categories Overview */}
          {Array.isArray(serviceAllocations) && (() => {
            const categorizedServices = {
              AI: {
                'AI Chat': serviceAllocations.filter((s: any) => ['chatgpt', 'anthropic', 'grok', 'perplexity'].includes(s.type)),
                'AI Compute': serviceAllocations.filter((s: any) => ['huggingface', 'replit', 'runpod'].includes(s.type))
              },
              Web3: {
                'Blockchain Data': serviceAllocations.filter((s: any) => ['graph-protocol', 'moralis', 'alchemy'].includes(s.type)),
                'Smart Contracts': serviceAllocations.filter((s: any) => ['thirdweb'].includes(s.type)),
                'Node Operations': serviceAllocations.filter((s: any) => ['infura'].includes(s.type))
              },
              Infrastructure: {
                'Distributed Compute': serviceAllocations.filter((s: any) => ['bacalhau', 'akash'].includes(s.type)),
                'Deployment': serviceAllocations.filter((s: any) => ['vercel', 'netlify'].includes(s.type)),
                'Storage': serviceAllocations.filter((s: any) => ['arweave'].includes(s.type)),
                'CDN & Edge': serviceAllocations.filter((s: any) => ['cloudflare'].includes(s.type))
              }
            };

            return Object.entries(categorizedServices).map(([category, subcategories]) => (
              <div key={category} className="space-y-3 md:space-y-4">
                {/* Mobile-Optimized Category Header */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3 md:mb-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className={`p-1.5 sm:p-2 rounded-lg ${
                      category === 'AI' ? 'bg-purple-100' : 
                      category === 'Web3' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {category === 'AI' && <Brain className={`w-4 h-4 sm:w-5 sm:h-5 text-purple-600`} />}
                      {category === 'Web3' && <Globe className={`w-4 h-4 sm:w-5 sm:h-5 text-blue-600`} />}
                      {category === 'Infrastructure' && <Database className={`w-4 h-4 sm:w-5 sm:h-5 text-green-600`} />}
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold">{category}</h2>
                  </div>
                  <Badge variant="outline" className="text-xs sm:text-sm w-fit sm:ml-auto">
                    {Object.values(subcategories).flat().length} services
                  </Badge>
                </div>

                {/* Mobile-First Subcategories */}
                {Object.entries(subcategories).map(([subcategory, services]) => 
                  services.length > 0 && (
                    <div key={subcategory} className="space-y-2 md:space-y-3">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-700 border-l-4 border-gray-300 pl-2 sm:pl-3">
                        {subcategory}
                      </h3>
                      {/* Mobile-First Grid Layout */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 ml-3 sm:ml-7">
                        {services.map((service: any) => {
                          const IconComponent = serviceIcons[service.type as keyof typeof serviceIcons] || Activity;
                          
                          return (
                            <ServiceCard 
                              key={service.id}
                              service={service}
                              category={category}
                              IconComponent={IconComponent}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>
            ));
          })()}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Services</p>
                    <p className="text-2xl font-bold">{Array.isArray(serviceAllocations) ? serviceAllocations.length : 0}</p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(
                        Array.isArray(serviceAllocations) ? serviceAllocations.reduce((sum: number, service: any) => 
                          sum + (service.hourly_rate * 24 * 30), 0) : 0
                      )}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Sharing Active</p>
                    <p className="text-2xl font-bold">
                      {Array.isArray(serviceAllocations) ? serviceAllocations.filter((service: any) => service.sharing_enabled).length : 0}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Opportunities</p>
                    <p className="text-2xl font-bold">{Array.isArray(arbitrageOpportunities) ? arbitrageOpportunities.length : 0}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="portfolio" className="space-y-4 md:space-y-6">
          {/* Service Selection and Income Calculator */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Service Selection Panel */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle>Customize Your Service Portfolio</CardTitle>
                      <CardDescription>Select and prioritize services for automated resource sharing in HyperDAG's decentralized marketplace</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                        <SelectTrigger className="w-full sm:w-40">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="earning">Earning Rate</SelectItem>
                          <SelectItem value="demand">Market Demand</SelectItem>
                          <SelectItem value="usage">Usage %</SelectItem>
                          <SelectItem value="name">Name</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getSortedServices().map((service: any) => {
                      const demandStatus = getSupplyDemandStatus(service.type);
                      const isSelected = selectedServices.includes(service.id);
                      
                      return (
                        <div 
                          key={service.id}
                          className={`border rounded-lg p-4 cursor-pointer transition-all ${
                            isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedServices(prev => prev.filter(id => id !== service.id));
                            } else {
                              setSelectedServices(prev => [...prev, service.id]);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                ['chatgpt', 'anthropic', 'grok', 'perplexity', 'huggingface', 'replit', 'runpod'].includes(service.type) ? 'bg-purple-50' :
                                ['graph-protocol', 'moralis', 'alchemy', 'thirdweb', 'infura'].includes(service.type) ? 'bg-blue-50' : 'bg-green-50'
                              }`}>
                                <Activity className={`w-4 h-4 ${
                                  ['chatgpt', 'anthropic', 'grok', 'perplexity', 'huggingface', 'replit', 'runpod'].includes(service.type) ? 'text-purple-600' :
                                  ['graph-protocol', 'moralis', 'alchemy', 'thirdweb', 'infura'].includes(service.type) ? 'text-blue-600' : 'text-green-600'
                                }`} />
                              </div>
                              <div>
                                <h4 className="font-medium">{service.name}</h4>
                                <p className="text-sm text-gray-600">{service.type}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {demandStatus.shortage && (
                                <Badge variant="outline" className="text-red-600 border-red-600 text-xs">
                                  High Demand
                                </Badge>
                              )}
                              {service.referral_program?.available && (
                                <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs">
                                  {service.referral_program.commission}% Referral
                                </Badge>
                              )}
                              <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                                isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                              }`}>
                                {isSelected && <Check className="w-4 h-4 text-white" />}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <Label className="text-gray-600 text-xs">Earning Rate</Label>
                              <p className="font-medium text-green-600">{formatCurrency(service.hourly_rate)}/hr</p>
                            </div>
                            <div>
                              <Label className="text-gray-600 text-xs">Usage</Label>
                              <p className="font-medium">{service.usage_percentage}%</p>
                            </div>
                            <div>
                              <Label className="text-gray-600 text-xs">Available</Label>
                              <p className="font-medium">{service.available_units} {service.unit_type}</p>
                            </div>
                          </div>
                          
                          {demandStatus.shortage && (
                            <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
                              <span className="text-red-700 font-medium">Premium Opportunity:</span> Supply shortage detected. 
                              Earn up to {demandStatus.premium ? ((demandStatus.premium - 1) * 100).toFixed(0) : '0'}% premium rates for contributing this resource.
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Income Projection Panel */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Income Projections</CardTitle>
                  <CardDescription>Estimated earnings from your selected services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm">Projection Tier</Label>
                    <Select value={incomeProjection} onValueChange={(value: any) => setIncomeProjection(value)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimum">Conservative (60%)</SelectItem>
                        <SelectItem value="mid">Realistic (100%)</SelectItem>
                        <SelectItem value="maximum">Optimistic (180%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Daily Income</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(calculatePotentialIncome().daily)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Weekly Income</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(calculatePotentialIncome().weekly)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Monthly Income</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(calculatePotentialIncome().monthly)}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <div className="text-sm text-gray-600 mb-2">Selected Services ({selectedServices.length})</div>
                    <div className="text-xs text-gray-500">
                      Income calculations include market demand premiums and referral bonuses from HyperDAG's decentralized marketplace.
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Supply/Demand Analytics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Market Opportunities</CardTitle>
                  <CardDescription>Real-time supply and demand analytics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.isArray(marketDemand) && marketDemand.slice(0, 5).map((market: any) => (
                      <div key={market.service_type} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-sm capitalize">{market.service_type.replace('-', ' ')}</div>
                          <div className="text-xs text-gray-600">
                            Supply: {market.current_supply} | Demand: {market.current_demand}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${
                              market.demand_status === 'critical' ? 'text-red-600 border-red-600' :
                              market.demand_status === 'high' ? 'text-orange-600 border-orange-600' :
                              'text-green-600 border-green-600'
                            }`}
                          >
                            {market.demand_status === 'critical' ? `${((market.premium_multiplier - 1) * 100).toFixed(0)}% Premium` :
                             market.demand_status === 'high' ? `${((market.premium_multiplier - 1) * 100).toFixed(0)}% Premium` :
                             'Balanced'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="arbitrage" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Arbitrage Opportunities */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-semibold">Available Opportunities</h3>
              {Array.isArray(arbitrageOpportunities) && arbitrageOpportunities.map((opportunity: ArbitrageOpportunity) => (
                <Card key={opportunity.id} className="p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold">{opportunity.serviceType}</h4>
                      <p className="text-sm text-gray-600">{opportunity.timeframe}</p>
                    </div>
                    <Badge 
                      className={`${getRiskColor(opportunity.risk)} border-0`}
                    >
                      {opportunity.risk.toUpperCase()} RISK
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Label className="text-gray-600 text-xs">Buy Price</Label>
                      <p className="font-medium">{formatCurrency(opportunity.buyPrice)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-xs">Sell Price</Label>
                      <p className="font-medium text-green-600">{formatCurrency(opportunity.sellPrice)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-xs">Profit</Label>
                      <p className="font-medium text-green-600">{formatCurrency(opportunity.profit)}</p>
                    </div>
                    <div>
                      <Label className="text-gray-600 text-xs">Margin</Label>
                      <p className="font-medium">{opportunity.profitMargin.toFixed(1)}%</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4 pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      Volume: {opportunity.volume} units
                    </div>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      Execute Trade
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {/* Arbitrage Analytics */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Total Arbitrage Potential</CardTitle>
                  <CardDescription>Combined profit from all opportunities in HyperDAG's marketplace</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {formatCurrency(Array.isArray(arbitrageOpportunities) ? arbitrageOpportunities.reduce((total, opp) => total + opp.profit, 0) : 0)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {Array.isArray(arbitrageOpportunities) ? arbitrageOpportunities.length : 0} opportunities available
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(
                        Array.isArray(serviceAllocations) ? serviceAllocations.reduce((sum: number, service: any) => 
                          sum + (service.hourly_rate * 24 * 30), 0) : 0
                      )}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Services</p>
                    <p className="text-2xl font-bold">
                      {Array.isArray(serviceAllocations) ? serviceAllocations.filter((service: any) => service.sharing_enabled).length : 0}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Usage</p>
                    <p className="text-2xl font-bold">
                      {Array.isArray(serviceAllocations) && serviceAllocations.length > 0 ? 
                        Math.round(serviceAllocations.reduce((sum: number, service: any) => 
                          sum + service.usage_percentage, 0) / serviceAllocations.length) : 0}%
                    </p>
                  </div>
                  <PieChart className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Arbitrage Profit</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(Array.isArray(arbitrageOpportunities) ? arbitrageOpportunities.reduce((total, opp) => total + opp.profit, 0) : 0)}
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="market-maker" className="space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold">Market Maker Orders</h2>
              <p className="text-gray-600">Set automated buy/sell orders with price ranges and get alerts when orders are filled</p>
            </div>
            <Dialog open={showMarketMakerDialog} onOpenChange={setShowMarketMakerDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Order
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Market Maker Order</DialogTitle>
                  <DialogDescription>
                    Set automated buy/sell orders that execute when price conditions are met
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateMarketMakerOrder} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="service">Service</Label>
                      <Select value={selectedServiceForOrder} onValueChange={setSelectedServiceForOrder} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="chatgpt">ChatGPT API</SelectItem>
                          <SelectItem value="anthropic">Anthropic Claude</SelectItem>
                          <SelectItem value="grok">Grok AI</SelectItem>
                          <SelectItem value="perplexity">Perplexity AI</SelectItem>
                          <SelectItem value="huggingface">HuggingFace</SelectItem>
                          <SelectItem value="bacalhau">Bacalhau Compute</SelectItem>
                          <SelectItem value="graph-protocol">Graph Protocol</SelectItem>
                          <SelectItem value="ethereum-gas">Ethereum Gas</SelectItem>
                          <SelectItem value="polygon-gas">Polygon Gas</SelectItem>
                          <SelectItem value="solana-gas">Solana Fees</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="orderType">Order Type</Label>
                      <Select value={orderType} onValueChange={(value: 'buy' | 'sell') => setOrderType(value)} required>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="buy">Buy Order</SelectItem>
                          <SelectItem value="sell">Sell Order</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="triggerPrice">Trigger Price ($)</Label>
                      <Input 
                        type="number" 
                        step="0.001" 
                        value={triggerPrice} 
                        onChange={(e) => setTriggerPrice(parseFloat(e.target.value) || 0)}
                        placeholder="0.000" 
                        required 
                      />
                      <p className="text-xs text-gray-500">Price to activate the order</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="targetPrice">Target Price ($)</Label>
                      <Input 
                        type="number" 
                        step="0.001" 
                        value={targetPrice} 
                        onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                        placeholder="0.000" 
                        required 
                      />
                      <p className="text-xs text-gray-500">Price to execute at</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input 
                      type="number" 
                      step="1" 
                      value={quantity} 
                      onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                      placeholder="1" 
                      required 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="stopLoss">Stop Loss ($) - Optional</Label>
                      <Input 
                        type="number" 
                        step="0.001" 
                        value={stopLoss} 
                        onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
                        placeholder="0.000" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="takeProfit">Take Profit ($) - Optional</Label>
                      <Input 
                        type="number" 
                        step="0.001" 
                        value={takeProfit} 
                        onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 0)}
                        placeholder="0.000" 
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={() => setShowMarketMakerDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createMarketMakerOrderMutation.isPending}>
                      {createMarketMakerOrderMutation.isPending ? "Creating..." : "Create Order"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Active Orders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Active Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {Array.isArray(marketMakerOrders) && marketMakerOrders.length > 0 ? (
                <div className="space-y-4">
                  {marketMakerOrders.map((order: MarketMakerOrder) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={order.orderType === 'buy' ? 'default' : 'secondary'}>
                              {order.orderType.toUpperCase()}
                            </Badge>
                            <span className="font-medium">{order.serviceType}</span>
                            <Badge variant="outline" className={
                              order.status === 'active' ? 'border-green-500 text-green-600' :
                              order.status === 'filled' ? 'border-blue-500 text-blue-600' :
                              'border-gray-500 text-gray-600'
                            }>
                              {order.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">Trigger:</span> ${order.triggerPrice}
                            </div>
                            <div>
                              <span className="font-medium">Target:</span> ${order.targetPrice}
                            </div>
                            <div>
                              <span className="font-medium">Quantity:</span> {order.quantity}
                            </div>
                            <div>
                              <span className="font-medium">Created:</span> {new Date(order.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                          {order.filledAt && (
                            <div className="mt-2 text-sm text-green-600">
                              <span className="font-medium">Filled:</span> ${order.filledPrice} on {new Date(order.filledAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        {order.status === 'active' && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => cancelOrderMutation.mutate(order.id)}
                            disabled={cancelOrderMutation.isPending}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No market maker orders yet</p>
                  <p className="text-sm">Create your first automated trading order</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Market Maker Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Orders</p>
                    <p className="text-2xl font-bold">
                      {Array.isArray(marketMakerOrders) ? marketMakerOrders.filter((order: MarketMakerOrder) => order.status === 'active').length : 0}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Filled Orders</p>
                    <p className="text-2xl font-bold">
                      {Array.isArray(marketMakerOrders) ? marketMakerOrders.filter((order: MarketMakerOrder) => order.status === 'filled').length : 0}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Profit</p>
                    <p className="text-2xl font-bold">
                      $0.00
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </Layout>
  );
}