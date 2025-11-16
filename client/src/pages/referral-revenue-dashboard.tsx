import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Link2, 
  ExternalLink, 
  Copy,
  ChevronRight,
  Calendar,
  Target,
  Award
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';


interface ReferralEarnings {
  service: string;
  commission: number;
  earnings: number;
  referrals: number;
  conversionRate: number;
  status: 'active' | 'pending' | 'inactive';
  trend: 'up' | 'down' | 'stable';
}

interface ServiceIntegration {
  id: string;
  name: string;
  description: string;
  commission: number;
  referralUrl: string;
  earnings: {
    total: number;
    thisMonth: number;
    lastMonth: number;
  };
  metrics: {
    clicks: number;
    conversions: number;
    conversionRate: number;
  };
  status: 'connected' | 'pending' | 'available';
}

export default function ReferralRevenueDashboard() {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Fetch referral revenue data
  const { data: revenueData, isLoading } = useQuery({
    queryKey: ['/api/referral-revenue/revenue', selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/referral-revenue/revenue?period=${selectedPeriod}`);
      return response.json();
    },
  });

  // High-commission service integrations
  const serviceIntegrations: ServiceIntegration[] = [
    {
      id: 'vercel',
      name: 'Vercel',
      description: 'Frontend deployment platform',
      commission: 35,
      referralUrl: 'https://vercel.com/signup?ref=hyperdag',
      earnings: { total: 1247.50, thisMonth: 425.20, lastMonth: 312.80 },
      metrics: { clicks: 342, conversions: 28, conversionRate: 8.2 },
      status: 'connected'
    },
    {
      id: 'alchemy',
      name: 'Alchemy',
      description: 'Blockchain infrastructure and APIs',
      commission: 30,
      referralUrl: 'https://alchemy.com/?r=hyperdag',
      earnings: { total: 892.40, thisMonth: 267.80, lastMonth: 445.60 },
      metrics: { clicks: 156, conversions: 12, conversionRate: 7.7 },
      status: 'connected'
    },
    {
      id: 'netlify',
      name: 'Netlify',
      description: 'Web development platform',
      commission: 30,
      referralUrl: 'https://netlify.com/signup?ref=hyperdag',
      earnings: { total: 634.20, thisMonth: 178.90, lastMonth: 223.40 },
      metrics: { clicks: 89, conversions: 8, conversionRate: 9.0 },
      status: 'connected'
    },
    {
      id: 'replit',
      name: 'Replit',
      description: 'Cloud development environment',
      commission: 25,
      referralUrl: 'https://replit.com/signup?ref=hyperdag',
      earnings: { total: 456.75, thisMonth: 142.50, lastMonth: 198.25 },
      metrics: { clicks: 234, conversions: 15, conversionRate: 6.4 },
      status: 'connected'
    },
    {
      id: 'infura',
      name: 'Infura',
      description: 'Ethereum and IPFS infrastructure',
      commission: 25,
      referralUrl: 'https://infura.io/register?ref=hyperdag',
      earnings: { total: 387.60, thisMonth: 125.40, lastMonth: 156.20 },
      metrics: { clicks: 67, conversions: 5, conversionRate: 7.5 },
      status: 'connected'
    },
    {
      id: 'moralis',
      name: 'Moralis',
      description: 'Web3 development platform',
      commission: 20,
      referralUrl: 'https://moralis.io/signup?ref=hyperdag',
      earnings: { total: 298.40, thisMonth: 89.20, lastMonth: 134.60 },
      metrics: { clicks: 45, conversions: 4, conversionRate: 8.9 },
      status: 'connected'
    },
    {
      id: 'cloudflare',
      name: 'Cloudflare',
      description: 'CDN and security services',
      commission: 20,
      referralUrl: 'https://cloudflare.com/signup?ref=hyperdag',
      earnings: { total: 234.80, thisMonth: 76.40, lastMonth: 98.20 },
      metrics: { clicks: 123, conversions: 7, conversionRate: 5.7 },
      status: 'connected'
    }
  ];

  const totalEarnings = serviceIntegrations.reduce((sum, service) => sum + service.earnings.total, 0);
  const monthlyEarnings = serviceIntegrations.reduce((sum, service) => sum + service.earnings.thisMonth, 0);
  const totalConversions = serviceIntegrations.reduce((sum, service) => sum + service.metrics.conversions, 0);
  const avgConversionRate = serviceIntegrations.reduce((sum, service) => sum + service.metrics.conversionRate, 0) / serviceIntegrations.length;

  const copyReferralLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "Referral link copied",
      description: "Share this link to earn commission on signups",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Referral Revenue Dashboard</h1>
          <p className="text-muted-foreground">
            Track earnings from service integrations and optimize your referral strategy
          </p>
        </div>

        {/* Revenue Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalEarnings)}</div>
            <div className="flex items-center text-sm text-green-600 mt-1">
              <TrendingUp className="h-4 w-4 mr-1" />
              +12.5% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyEarnings)}</div>
            <div className="flex items-center text-sm text-green-600 mt-1">
              <TrendingUp className="h-4 w-4 mr-1" />
              +8.7% vs last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConversions}</div>
            <div className="flex items-center text-sm text-blue-600 mt-1">
              <Users className="h-4 w-4 mr-1" />
              Active referrals
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgConversionRate.toFixed(1)}%</div>
            <div className="flex items-center text-sm text-purple-600 mt-1">
              <Target className="h-4 w-4 mr-1" />
              Industry leading
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="services" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="services">Service Integrations</TabsTrigger>
          <TabsTrigger value="performance">Performance Analytics</TabsTrigger>
          <TabsTrigger value="optimization">Revenue Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>High-Commission Services</CardTitle>
              <CardDescription>
                Integrated services with the highest earning potential
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {serviceIntegrations.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">{service.name}</h3>
                          <Badge variant="secondary">{service.commission}% Commission</Badge>
                          {service.status === 'connected' && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              Connected
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm">
                          <span>Earned: <strong>{formatCurrency(service.earnings.total)}</strong></span>
                          <span>Conversions: <strong>{service.metrics.conversions}</strong></span>
                          <span>Rate: <strong>{service.metrics.conversionRate}%</strong></span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyReferralLink(service.referralUrl)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy Link
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Services</CardTitle>
                <CardDescription>Ranked by total earnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {serviceIntegrations
                    .sort((a, b) => b.earnings.total - a.earnings.total)
                    .slice(0, 5)
                    .map((service, index) => (
                      <div key={service.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </div>
                          <span className="font-medium">{service.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(service.earnings.total)}</div>
                          <div className="text-xs text-muted-foreground">{service.commission}% commission</div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Leaders</CardTitle>
                <CardDescription>Highest conversion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {serviceIntegrations
                    .sort((a, b) => b.metrics.conversionRate - a.metrics.conversionRate)
                    .slice(0, 5)
                    .map((service, index) => (
                      <div key={service.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-xs font-medium text-green-700">
                            {index + 1}
                          </div>
                          <span className="font-medium">{service.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{service.metrics.conversionRate}%</div>
                          <div className="text-xs text-muted-foreground">{service.metrics.conversions} conversions</div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Optimization Tips</CardTitle>
                <CardDescription>Maximize your referral earnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Award className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Focus on high-commission services</h4>
                      <p className="text-sm text-muted-foreground">Vercel (35%) and Alchemy (30%) offer the highest returns</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Improve conversion rates</h4>
                      <p className="text-sm text-muted-foreground">Create targeted content for developer audiences</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium">Track performance monthly</h4>
                      <p className="text-sm text-muted-foreground">Monitor trends and adjust strategy accordingly</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Opportunities</CardTitle>
                <CardDescription>Untapped revenue potential</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Enterprise Referrals</span>
                      <Badge variant="outline">High Value</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Target enterprise customers for Alchemy and Vercel integrations
                    </p>
                    <div className="text-sm font-medium text-green-600">
                      Potential: +$2,500/month
                    </div>
                  </div>
                  
                  <div className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Content Marketing</span>
                      <Badge variant="outline">Medium Effort</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Create tutorials and guides featuring integrated services
                    </p>
                    <div className="text-sm font-medium text-blue-600">
                      Potential: +$800/month
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}