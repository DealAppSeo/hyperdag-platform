/**
 * Enterprise AI Cost Arbitrage Dashboard
 * 
 * B2B SaaS platform demonstrating 40-70% AI cost reduction
 * with ANFIS routing and tiered pricing model
 */

import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingDown, 
  Zap, 
  Target, 
  DollarSign, 
  Clock, 
  BarChart3, 
  Sparkles,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface ArbitrageResult {
  success: boolean;
  result: any;
  pricing: {
    originalCost: number;
    finalCost: number;
    actualSavings: number;
    savingsPercentage: number;
    customerSavings: number;
    revenueShare: number;
    tier: string;
  };
  performance: {
    latency: number;
    strategy: string[];
    fromCache: boolean;
    fromFree: boolean;
    fromTemporal: boolean;
  };
}

interface CostEstimate {
  analysis: {
    currentMonthlySpend: number;
    estimatedSavingsRate: string;
    strategiesUsed: string[];
  };
  tierEstimates: Array<{
    tier: string;
    potentialMonthlySavings: string;
    netMonthlySavings: string;
    annualNetSavings: string;
    roiPercentage: string;
    features: string[];
  }>;
  recommendation: any;
}

const EnterpriseArbitrage: React.FC = () => {
  const [testQuery, setTestQuery] = useState("Generate a comprehensive business plan for an AI startup focusing on cost optimization");
  const [monthlySpend, setMonthlySpend] = useState("25000");
  const [customerApiKey] = useState("demo_key_enterprise_" + Math.random().toString(36).substring(7));

  // Test arbitrage processing
  const arbitrageMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch('/api/enterprise/ai-arbitrage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          customerApiKey,
          estimatedCost: 0.50, // Estimated $0.50 for this query
          urgency: 0.5
        })
      });
      if (!response.ok) throw new Error('Arbitrage request failed');
      return response.json();
    }
  });

  // Get cost estimates
  const { data: costEstimate } = useQuery({
    queryKey: ['cost-estimate', monthlySpend],
    queryFn: async () => {
      const response = await fetch('/api/enterprise/cost-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyAISpend: parseFloat(monthlySpend) || 25000
        })
      });
      if (!response.ok) throw new Error('Cost estimate failed');
      return response.json();
    },
    enabled: !isNaN(parseFloat(monthlySpend))
  });

  // Get pricing tiers
  const { data: pricingTiers } = useQuery({
    queryKey: ['pricing-tiers'],
    queryFn: async () => {
      const response = await fetch('/api/enterprise/pricing-tiers');
      if (!response.ok) throw new Error('Failed to fetch pricing');
      return response.json();
    }
  });

  const handleArbitrageTest = () => {
    arbitrageMutation.mutate(testQuery);
  };

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Enterprise AI Cost Arbitrage Platform
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-6">
            Reduce your AI API costs by 40-70% with ANFIS routing and intelligent optimization
          </p>
          
          {/* Key Metrics Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">40-70%</div>
                <div className="text-sm text-green-700 dark:text-green-300">Cost Reduction</div>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">19x</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Speed Improvement</div>
              </CardContent>
            </Card>
            <Card className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">96.4%</div>
                <div className="text-sm text-purple-700 dark:text-purple-300">Max Efficiency</div>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">20-30%</div>
                <div className="text-sm text-orange-700 dark:text-orange-300">Revenue Share</div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs defaultValue="demo" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="demo">Live Demo</TabsTrigger>
            <TabsTrigger value="calculator">Cost Calculator</TabsTrigger>
            <TabsTrigger value="pricing">Pricing Tiers</TabsTrigger>
          </TabsList>

          {/* Live Demo Tab */}
          <TabsContent value="demo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-600" />
                  AI Arbitrage Live Demo
                </CardTitle>
                <CardDescription>
                  Test our ANFIS routing system with real cost optimization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">AI Query to Optimize</label>
                  <Textarea
                    placeholder="Enter your AI query to see cost optimization in action..."
                    value={testQuery}
                    onChange={(e) => setTestQuery(e.target.value)}
                    className="min-h-20"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <Button 
                    onClick={handleArbitrageTest}
                    disabled={arbitrageMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {arbitrageMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <Target className="h-4 w-4" />
                    )}
                    Test Arbitrage
                  </Button>
                  
                  <Badge variant="outline">
                    Customer: {customerApiKey.substring(0, 12)}...
                  </Badge>
                </div>

                {/* Results */}
                {arbitrageMutation.data && (
                  <div className="border rounded-lg p-6 bg-slate-50 dark:bg-slate-800">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Arbitrage Results
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Cost Savings */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">Cost Analysis</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Original Cost:</span>
                            <span className="line-through text-red-600">
                              {formatCurrency(arbitrageMutation.data.pricing.originalCost)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Optimized Cost:</span>
                            <span className="text-green-600 font-semibold">
                              {formatCurrency(arbitrageMutation.data.pricing.finalCost)}
                            </span>
                          </div>
                          <div className="flex justify-between border-t pt-2">
                            <span className="font-medium">Your Savings:</span>
                            <span className="text-green-600 font-semibold">
                              {formatCurrency(arbitrageMutation.data.pricing.customerSavings)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Savings Rate:</span>
                            <span className="text-blue-600 font-semibold">
                              {arbitrageMutation.data.pricing.savingsPercentage.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Performance */}
                      <div className="space-y-3">
                        <h4 className="font-medium text-slate-900 dark:text-slate-100">Performance</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Response Time:</span>
                            <span className="text-blue-600">{arbitrageMutation.data.performance.latency}ms</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Strategies Used:</span>
                            <span className="text-purple-600">
                              {arbitrageMutation.data.performance.strategy.length} methods
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {arbitrageMutation.data.performance.strategy.map((strategy: string) => (
                              <Badge key={strategy} variant="secondary" className="text-xs">
                                {strategy.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                      <div className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>Tier:</strong> {arbitrageMutation.data.pricing.tier} | 
                        <strong> Revenue Share:</strong> {formatCurrency(arbitrageMutation.data.pricing.revenueShare)} |
                        <strong> Net Benefit:</strong> {formatCurrency(arbitrageMutation.data.pricing.customerSavings)}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cost Calculator Tab */}
          <TabsContent value="calculator" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Enterprise Cost Calculator
                </CardTitle>
                <CardDescription>
                  Calculate your potential AI cost savings across different pricing tiers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Current Monthly AI Spend ($)</label>
                  <Input
                    type="number"
                    placeholder="25000"
                    value={monthlySpend}
                    onChange={(e) => setMonthlySpend(e.target.value)}
                    className="max-w-xs"
                  />
                </div>

                {costEstimate && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="bg-green-50 dark:bg-green-900/20">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-green-600 mb-1">
                            {costEstimate.analysis.estimatedSavingsRate}
                          </div>
                          <div className="text-sm text-green-700 dark:text-green-300">Projected Savings Rate</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-blue-50 dark:bg-blue-900/20">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600 mb-1">
                            {formatCurrency(costEstimate.analysis.currentMonthlySpend)}
                          </div>
                          <div className="text-sm text-blue-700 dark:text-blue-300">Current Monthly Spend</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-purple-50 dark:bg-purple-900/20">
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600 mb-1">
                            {costEstimate.analysis.strategiesUsed.length}
                          </div>
                          <div className="text-sm text-purple-700 dark:text-purple-300">Optimization Strategies</div>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Savings by Tier</h3>
                      {costEstimate.tierEstimates.map((tier, index) => (
                        <Card key={index} className={index === 1 ? "ring-2 ring-blue-500" : ""}>
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className="text-lg font-semibold">{tier.tier}</h4>
                                {index === 1 && <Badge className="mt-1">Recommended</Badge>}
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-green-600">
                                  {formatCurrency(tier.netMonthlySavings)}
                                </div>
                                <div className="text-sm text-slate-600">monthly savings</div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-slate-600">Annual Savings:</span>
                                <div className="font-semibold">{formatCurrency(tier.annualNetSavings)}</div>
                              </div>
                              <div>
                                <span className="text-slate-600">ROI:</span>
                                <div className="font-semibold text-blue-600">{tier.roiPercentage}</div>
                              </div>
                              <div>
                                <span className="text-slate-600">Features:</span>
                                <div className="font-semibold">{tier.features.length} included</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pricing Tiers Tab */}
          <TabsContent value="pricing" className="space-y-6">
            {pricingTiers && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(pricingTiers.tiers).map(([tierKey, tier]: [string, any]) => (
                  <Card key={tierKey} className={tierKey === 'enterprise' ? 'ring-2 ring-blue-500' : ''}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {tier.name}
                        {tierKey === 'enterprise' && <Badge>Popular</Badge>}
                      </CardTitle>
                      <CardDescription>
                        Revenue Share: {(tier.revenueShare * 100)}% of savings
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="text-2xl font-bold">
                            {tier.monthlyLimit === Infinity ? 'Unlimited' : tier.monthlyLimit.toLocaleString()}
                          </div>
                          <div className="text-sm text-slate-600">monthly API calls</div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="text-sm font-medium">Features:</div>
                          <ul className="space-y-1 text-sm text-slate-600">
                            {tier.features.map((feature: string, index: number) => (
                              <li key={index} className="flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <Button className="w-full" variant={tierKey === 'enterprise' ? 'default' : 'outline'}>
                          Get Started
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
            
            {pricingTiers && (
              <Card>
                <CardHeader>
                  <CardTitle>Platform Benefits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <TrendingDown className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <div className="font-semibold">{pricingTiers.benefits.costReduction}</div>
                    </div>
                    <div className="text-center">
                      <Zap className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <div className="font-semibold">{pricingTiers.benefits.speedImprovement}</div>
                    </div>
                    <div className="text-center">
                      <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <div className="font-semibold">{pricingTiers.benefits.reliability}</div>
                    </div>
                    <div className="text-center">
                      <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                      <div className="font-semibold">{pricingTiers.benefits.support}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnterpriseArbitrage;