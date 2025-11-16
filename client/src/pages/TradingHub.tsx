import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  ShoppingCart, 
  Bot, 
  ArrowUpDown, 
  Info, 
  Users, 
  DollarSign, 
  BarChart3,
  Zap,
  Shield,
  Lightbulb
} from 'lucide-react';
import { Link } from 'wouter';
import { Layout } from '@/components/layout/layout';

const TradingHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Layout>
      <div className="container mx-auto p-3 sm:p-6 max-w-6xl">
        {/* Mobile-optimized Header Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Trading Hub</h1>
          <p className="text-muted-foreground text-sm sm:text-lg">
            Advanced trading tools for decentralized marketplaces and automated market making
          </p>
        </div>

        {/* Mobile-optimized Introduction Alert */}
        <Alert className="mb-4 sm:mb-6 border-blue-200 bg-blue-50">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-blue-800 text-sm sm:text-base">
            <strong>New to trading?</strong> These are advanced tools for users familiar with DeFi protocols. 
            Start with the Overview tab to understand when and how to use these features.
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-0 h-auto sm:h-10">
          <TabsTrigger value="overview" className="text-xs sm:text-sm py-2 sm:py-1">Overview</TabsTrigger>
          <TabsTrigger value="marketplace" className="text-xs sm:text-sm py-2 sm:py-1">Marketplace</TabsTrigger>
          <TabsTrigger value="market-maker" className="text-xs sm:text-sm py-2 sm:py-1">Market Maker</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs sm:text-sm py-2 sm:py-1">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Marketplace Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  <CardTitle>Decentralized Marketplace</CardTitle>
                </div>
                <CardDescription>
                  Trade digital assets, services, and compute resources
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Best for:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Buying/selling digital services</li>
                    <li>• Trading compute resources</li>
                    <li>• NFT and token exchanges</li>
                    <li>• Peer-to-peer transactions</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Use cases:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Developer looking for computing power</li>
                    <li>• Artist selling digital artwork</li>
                    <li>• Data scientist needing GPU time</li>
                  </ul>
                </div>
                <Button 
                  onClick={() => setActiveTab('marketplace')} 
                  className="w-full"
                >
                  Explore Marketplace
                </Button>
              </CardContent>
            </Card>

            {/* Market Maker Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-green-600" />
                  <CardTitle>Automated Market Maker</CardTitle>
                </div>
                <CardDescription>
                  Provide liquidity and earn rewards through automated trading
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Best for:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Providing liquidity to earn fees</li>
                    <li>• Automated arbitrage trading</li>
                    <li>• Yield farming strategies</li>
                    <li>• Risk-managed exposure</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Use cases:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Investor wanting passive income</li>
                    <li>• Trader with significant capital</li>
                    <li>• Institution providing liquidity</li>
                  </ul>
                </div>
                <Button 
                  onClick={() => setActiveTab('market-maker')} 
                  variant="outline" 
                  className="w-full"
                >
                  Learn Market Making
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Feature Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Feature Comparison</CardTitle>
              <CardDescription>
                Choose the right tool for your trading needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">Feature</th>
                      <th className="text-center p-2 font-medium">Marketplace</th>
                      <th className="text-center p-2 font-medium">Market Maker</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    <tr className="border-b">
                      <td className="p-2">User Type</td>
                      <td className="p-2 text-center">All users</td>
                      <td className="p-2 text-center">Advanced traders</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Capital Required</td>
                      <td className="p-2 text-center">Low to Medium</td>
                      <td className="p-2 text-center">Medium to High</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Risk Level</td>
                      <td className="p-2 text-center">Low to Medium</td>
                      <td className="p-2 text-center">Medium to High</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Time Commitment</td>
                      <td className="p-2 text-center">Occasional</td>
                      <td className="p-2 text-center">Ongoing monitoring</td>
                    </tr>
                    <tr>
                      <td className="p-2">Potential Returns</td>
                      <td className="p-2 text-center">Variable</td>
                      <td className="p-2 text-center">Steady yield + fees</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Marketplace Tab */}
        <TabsContent value="marketplace" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Active Marketplace</CardTitle>
                  <CardDescription>
                    Browse and trade digital assets, services, and resources
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-2 flex-wrap">
                      <Badge variant="secondary">Compute Resources</Badge>
                      <Badge variant="secondary">Digital Services</Badge>
                      <Badge variant="secondary">NFTs</Badge>
                      <Badge variant="secondary">Data</Badge>
                    </div>
                    
                    <Alert>
                      <Lightbulb className="h-4 w-4" />
                      <AlertDescription>
                        The marketplace connects buyers and sellers directly. Perfect for one-time 
                        purchases or selling your digital assets and services.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      <h4 className="font-medium">Popular Categories:</h4>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 border rounded-lg">
                          <h5 className="font-medium text-sm">AI/ML Services</h5>
                          <p className="text-xs text-muted-foreground">Model training, inference</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <h5 className="font-medium text-sm">Compute Power</h5>
                          <p className="text-xs text-muted-foreground">GPU, CPU rental</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <h5 className="font-medium text-sm">Digital Assets</h5>
                          <p className="text-xs text-muted-foreground">NFTs, tokens</p>
                        </div>
                        <div className="p-3 border rounded-lg">
                          <h5 className="font-medium text-sm">Data Services</h5>
                          <p className="text-xs text-muted-foreground">Datasets, APIs</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Link href="/service-marketplace">
                        <Button className="flex-1">
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Browse Marketplace
                        </Button>
                      </Link>
                      <Button variant="outline">
                        <DollarSign className="h-4 w-4 mr-2" />
                        List Item
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Market Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold">1,234</div>
                    <div className="text-xs text-muted-foreground">Active Listings</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">$45.6K</div>
                    <div className="text-xs text-muted-foreground">24h Volume</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">567</div>
                    <div className="text-xs text-muted-foreground">Active Traders</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Market Maker Tab */}
        <TabsContent value="market-maker" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Automated Market Making</CardTitle>
                  <CardDescription>
                    Provide liquidity to earn trading fees and rewards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Alert className="border-orange-200 bg-orange-50">
                      <Shield className="h-4 w-4" />
                      <AlertDescription className="text-orange-800">
                        <strong>Advanced Feature:</strong> Market making involves providing liquidity 
                        to trading pairs. Requires understanding of impermanent loss and market dynamics.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      <h4 className="font-medium">How it works:</h4>
                      <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                        <li>Deposit tokens into liquidity pools</li>
                        <li>Automated algorithms manage price spreads</li>
                        <li>Earn fees from trades that use your liquidity</li>
                        <li>Withdraw anytime with accumulated rewards</li>
                      </ol>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          <h5 className="font-medium text-sm">Stable Pairs</h5>
                        </div>
                        <p className="text-xs text-muted-foreground">Lower risk, steady returns</p>
                        <div className="text-sm font-medium text-green-600 mt-1">2-5% APY</div>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-yellow-600" />
                          <h5 className="font-medium text-sm">Volatile Pairs</h5>
                        </div>
                        <p className="text-xs text-muted-foreground">Higher risk, higher rewards</p>
                        <div className="text-sm font-medium text-yellow-600 mt-1">8-25% APY</div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Link href="/automated-resource-sharing">
                        <Button className="flex-1">
                          <Bot className="h-4 w-4 mr-2" />
                          Start Market Making
                        </Button>
                      </Link>
                      <Button variant="outline">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Strategies
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Pool Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold text-green-600">12.3%</div>
                    <div className="text-xs text-muted-foreground">Average APY</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">$123K</div>
                    <div className="text-xs text-muted-foreground">Total Liquidity</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">89</div>
                    <div className="text-xs text-muted-foreground">Active Liquidity Providers</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-4">
                <CardHeader>
                  <CardTitle className="text-sm">Risk Warning</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">
                  Market making involves risks including impermanent loss, 
                  smart contract risks, and market volatility. Only invest 
                  what you can afford to lose.
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">$789K</div>
                    <div className="text-xs text-muted-foreground">Total Volume (24h)</div>
                  </div>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">1,456</div>
                    <div className="text-xs text-muted-foreground">Active Users</div>
                  </div>
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">234</div>
                    <div className="text-xs text-muted-foreground">Transactions (24h)</div>
                  </div>
                  <ArrowUpDown className="h-4 w-4 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">98.5%</div>
                    <div className="text-xs text-muted-foreground">Uptime</div>
                  </div>
                  <Shield className="h-4 w-4 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Trading Activity</CardTitle>
              <CardDescription>Overview of marketplace and market maker activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                  <p>Analytics dashboard coming soon</p>
                  <p className="text-sm">Real-time trading metrics and performance data</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default TradingHub;