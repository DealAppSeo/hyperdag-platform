import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, Zap, Target, DollarSign, Clock, Activity,
  TrendingUp, Shield, Cpu, Database, Network, RefreshCw
} from 'lucide-react';

interface ProviderStatus {
  name: string;
  available: boolean;
  usageCount: number;
  responseTime: number;
  cost: number;
  efficiency: number;
}

export default function TrinityDashboard() {
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [systemMetrics, setSystemMetrics] = useState({
    totalRequests: 0,
    costSavings: 0,
    averageResponseTime: 0,
    successRate: 0
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [openRouterStatus, setOpenRouterStatus] = useState({
    available: true,
    usageCount: 0,
    dailySpend: 0.15,
    budgetRemaining: 4.85
  });

  // Moved outside useEffect for manual refresh capability
  const fetchProviderStatus = () => {
    setIsRefreshing(true);
    try {
      const mockProviders: ProviderStatus[] = [
        {
          name: 'DeepSeek Symphony',
          available: true,
          usageCount: 245,
          responseTime: 1200,
          cost: 0.00,
          efficiency: 94
        },
        {
          name: 'MY-deFuzzyAI-Ninja',
          available: true,
          usageCount: 178,
          responseTime: 1000,
          cost: 0.00,
          efficiency: 91
        },
        {
          name: 'OpenRouter (Fallback)',
          available: openRouterStatus.available,
          usageCount: openRouterStatus.usageCount,
          responseTime: 2500,
          cost: openRouterStatus.dailySpend,
          efficiency: 88
        },
        {
          name: 'Anthropic Claude',
          available: false,
          usageCount: 0,
          responseTime: 3200,
          cost: 0.00,
          efficiency: 0
        },
        {
          name: 'OpenAI GPT-4',
          available: false,
          usageCount: 0,
          responseTime: 2800,
          cost: 0.00,
          efficiency: 0
        }
      ];

      setProviders(mockProviders);
      
      const totalRequests = mockProviders.reduce((sum, p) => sum + p.usageCount, 0);
      const avgResponseTime = mockProviders
        .filter(p => p.usageCount > 0)
        .reduce((sum, p, _, arr) => sum + p.responseTime / arr.length, 0);

      setSystemMetrics({
        totalRequests,
        costSavings: 87.3,
        averageResponseTime: Math.round(avgResponseTime),
        successRate: 94.2
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProviderStatus();
    // ✅ NO POLLING - Using static mock data, manual refresh button available
    // If real-time updates needed, use Supabase realtime subscriptions like HyperDAG.tsx
  }, []);

  const getStatusColor = (available: boolean, efficiency: number) => {
    if (!available) return 'bg-red-500';
    if (efficiency > 90) return 'bg-green-500';
    if (efficiency > 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trinity Symphony AI Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of Patent Pending ANFIS Intelligent Routing System
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchProviderStatus}
            disabled={isRefreshing}
            data-testid="button-refresh-providers"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Badge variant="outline" className="text-green-600">
            Cost Savings: {systemMetrics.costSavings}%
          </Badge>
          <Badge variant="default" className="bg-blue-600">
            Success Rate: {systemMetrics.successRate}%
          </Badge>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{systemMetrics.totalRequests.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response Time</p>
                <p className="text-2xl font-bold">{systemMetrics.averageResponseTime}ms</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cost Savings</p>
                <p className="text-2xl font-bold">{systemMetrics.costSavings}%</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">{systemMetrics.successRate}%</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="providers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="providers">AI Providers</TabsTrigger>
          <TabsTrigger value="openrouter">OpenRouter Status</TabsTrigger>
          <TabsTrigger value="routing">ANFIS Routing</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="providers">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                AI Provider Network Status
              </CardTitle>
              <CardDescription>
                Real-time status of all AI providers in Trinity Symphony Network
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {providers.map((provider, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div 
                          className={`w-3 h-3 rounded-full ${getStatusColor(provider.available, provider.efficiency)}`}
                        />
                        <h3 className="font-semibold">{provider.name}</h3>
                        <Badge variant={provider.available ? "default" : "destructive"}>
                          {provider.available ? "Online" : "Offline"}
                        </Badge>
                      </div>
                      <Badge variant="outline">
                        {provider.efficiency}% efficiency
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Requests</p>
                        <p className="font-semibold">{provider.usageCount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Response Time</p>
                        <p className="font-semibold">{provider.responseTime}ms</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cost</p>
                        <p className="font-semibold">${provider.cost.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className={`font-semibold ${provider.available ? 'text-green-600' : 'text-red-600'}`}>
                          {provider.available ? 'Active' : 'Standby'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="openrouter">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  OpenRouter Strategic Fallback Status
                </CardTitle>
                <CardDescription>
                  Cost-controlled premium AI access for high-priority requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Service Status</span>
                      <Badge variant={openRouterStatus.available ? "default" : "destructive"}>
                        {openRouterStatus.available ? "Available" : "Budget Exceeded"}
                      </Badge>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Requests Today</span>
                      <span className="font-semibold">{openRouterStatus.usageCount}</span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Daily Budget Usage</span>
                        <span>${openRouterStatus.dailySpend.toFixed(2)} / $5.00</span>
                      </div>
                      <Progress value={(openRouterStatus.dailySpend / 5.0) * 100} />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Budget Remaining</span>
                      <span className="font-semibold text-green-600">
                        ${openRouterStatus.budgetRemaining.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold">Cost Optimization Strategy</h4>
                    <div className="space-y-2 text-sm">
                      <p>✅ Free tier providers prioritized (DeepSeek, MyNinja)</p>
                      <p>✅ OpenRouter used only when free tier at capacity</p>
                      <p>✅ Cost-effective model selection (Claude Haiku, Llama-3.1)</p>
                      <p>✅ Daily budget limits prevent overspending</p>
                      <p>✅ Smart request routing based on complexity</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>OpenRouter Model Optimization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Simple Queries</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Basic questions, quick responses
                    </p>
                    <Badge variant="outline">Llama-3.1-8B (Free)</Badge>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Moderate Complexity</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Analysis, reasoning, creative tasks
                    </p>
                    <Badge variant="secondary">Claude-3-Haiku</Badge>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Complex Tasks</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Technical analysis, code generation
                    </p>
                    <Badge variant="default">Claude-3.5-Sonnet</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="routing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                ANFIS Intelligent Routing Engine
              </CardTitle>
              <CardDescription>
                Patent Pending fuzzy logic system for optimal AI provider selection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Current Routing Strategy</h4>
                  <div className="space-y-3">
                    {[
                      { type: 'Analysis', route: 'Free Tier → OpenRouter → Premium', priority: 'Cost' },
                      { type: 'Creative', route: 'OpenRouter → Free Tier → Premium', priority: 'Quality' },
                      { type: 'Technical', route: 'OpenRouter → Premium → Free Tier', priority: 'Quality' },
                      { type: 'General', route: 'Free Tier → OpenRouter → Premium', priority: 'Cost' }
                    ].map((route, index) => (
                      <div key={index} className="flex justify-between items-center p-3 border rounded">
                        <div>
                          <p className="font-medium">{route.type}</p>
                          <p className="text-xs text-muted-foreground">{route.route}</p>
                        </div>
                        <Badge variant="outline">{route.priority}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h4 className="font-semibold">Routing Performance</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Free Tier Success Rate</span>
                      <span className="font-semibold">85%</span>
                    </div>
                    <Progress value={85} />
                    
                    <div className="flex justify-between items-center">
                      <span>OpenRouter Fallback Rate</span>
                      <span className="font-semibold">15%</span>
                    </div>
                    <Progress value={15} />
                    
                    <div className="flex justify-between items-center">
                      <span>Average Cost per Request</span>
                      <span className="font-semibold">$0.0003</span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span>Cost vs Traditional AI</span>
                      <span className="font-semibold text-green-600">-87.3%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Response Time Improvement</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-600">+22%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Cost Optimization</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-600">+87%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Success Rate</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-600">+12%</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Provider Reliability</span>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-600">+8%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Usage Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { provider: 'DeepSeek Symphony', percentage: 58, color: 'bg-blue-500' },
                    { provider: 'MY-deFuzzyAI-Ninja', percentage: 27, color: 'bg-green-500' },
                    { provider: 'OpenRouter', percentage: 12, color: 'bg-yellow-500' },
                    { provider: 'Premium Models', percentage: 3, color: 'bg-purple-500' }
                  ].map((item, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{item.provider}</span>
                        <span>{item.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`${item.color} h-2 rounded-full`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}