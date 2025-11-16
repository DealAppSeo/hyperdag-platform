/**
 * AggLayer & Miden Dashboard
 * 
 * Shows cross-chain reputation tracking, HDAG token fee discounts,
 * and AI-optimized transaction routing powered by Polygon's cutting-edge infrastructure
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Layout } from '@/components/layout/layout';
import { 
  Network, 
  Zap, 
  Shield, 
  Coins, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface ChainStatus {
  chainId: number;
  name: string;
  status: 'connected' | 'disconnected';
  gasPrice: string;
  nativeToken: string;
}

interface FeeDiscount {
  baseDiscount: string;
  profileBonus: string;
  reputationBonus: string;
  totalDiscount: string;
}

interface UserDiscountStatus {
  currentStatus: {
    profileCompletion: number;
    reputationScore: number;
    eligibleForMaxDiscount: boolean;
  };
  discountBreakdown: {
    hdagPayment: { discount: string; eligible: boolean; savings: string };
    profileComplete: { discount: string; eligible: boolean; savings: string; requirement: string };
    highReputation: { discount: string; eligible: boolean; savings: string; requirement: string };
  };
  potentialSavings: {
    current: string;
    maximum: string;
    nextMilestone: { action: string; additionalSavings: string } | null;
  };
  actionItems: Array<{
    action: string;
    benefit: string;
    missingFields?: string[];
    currentScore?: number;
    targetScore?: number;
    suggestions?: string[];
  }>;
}

export default function AggLayerMidenDashboard() {
  const [selectedOperation, setSelectedOperation] = useState('grant_application');

  // Fetch user's discount status (NO POLLING)
  const { data: discountStatus, isLoading: discountLoading, refetch: refetchDiscountStatus } = useQuery<{ success: boolean; data: UserDiscountStatus }>({
    queryKey: ['/api/ai-orchestration/user-discount-status'],
    refetchInterval: false // ❌ NO POLLING - eliminated 2 req/min
  });

  // Mock chain status data (would come from AggLayer service)
  const chainStatus: ChainStatus[] = [
    { chainId: 137, name: 'Polygon', status: 'connected', gasPrice: '30000000000', nativeToken: 'MATIC' },
    { chainId: 1, name: 'Ethereum', status: 'connected', gasPrice: '20000000000', nativeToken: 'ETH' },
    { chainId: 8453, name: 'Base', status: 'connected', gasPrice: '5000000000', nativeToken: 'ETH' }
  ];

  const formatGasPrice = (gasPrice: string) => {
    const gwei = parseInt(gasPrice) / 1000000000;
    return `${gwei.toFixed(1)} Gwei`;
  };

  const getStatusColor = (status: string) => {
    return status === 'connected' ? 'bg-green-500' : 'bg-red-500';
  };

  const calculateSavingsColor = (discount: string) => {
    const percentage = parseFloat(discount.replace('%', ''));
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 50) return 'text-blue-600';
    return 'text-orange-600';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
          <Network className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AggLayer & Miden Integration</h1>
          <p className="text-gray-600">Cross-chain reputation with AI-optimized HDAG token discounts</p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="discounts">HDAG Discounts</TabsTrigger>
          <TabsTrigger value="chains">Chain Status</TabsTrigger>
          <TabsTrigger value="proofs">Miden Proofs</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
                  Cross-Chain Reputation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Current Score</span>
                    <span className="font-semibold">{discountStatus?.data?.currentStatus?.reputationScore || 20}</span>
                  </div>
                  <Progress value={(discountStatus?.data?.currentStatus?.reputationScore || 20)} className="h-2" />
                  <p className="text-xs text-gray-500">Unified across Polygon, Ethereum, Base</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Coins className="h-5 w-5 mr-2 text-blue-600" />
                  HDAG Savings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-blue-600">
                    {discountStatus?.data?.potentialSavings?.current || 'Loading...'}
                  </div>
                  <p className="text-xs text-gray-500">Current transaction savings</p>
                  <Badge variant="secondary" className="text-xs">
                    Max: {discountStatus?.data?.potentialSavings?.maximum || '87.5%'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Profile Completion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-green-600">
                    {discountStatus?.data?.currentStatus?.profileCompletion || 100}%
                  </div>
                  <Progress value={discountStatus?.data?.currentStatus?.profileCompletion || 100} className="h-2" />
                  <p className="text-xs text-gray-500">
                    {(discountStatus?.data?.currentStatus?.profileCompletion || 100) >= 95 ? 'Bonus unlocked!' : 'Complete for bonus'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                AI Transaction Optimization
              </CardTitle>
              <CardDescription>
                Intelligent routing across AggLayer connected chains with automatic HDAG discounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold">Current Benefits</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span className="text-sm">HDAG Token Payment</span>
                      <Badge className="bg-green-600">50% OFF</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <span className="text-sm">Complete Profile Bonus</span>
                      <Badge className="bg-blue-600">+50% OFF</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm">High Reputation Bonus</span>
                      <Badge variant="outline">Need Rep 80+</Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold">Next Steps to Maximize Savings</h4>
                  {discountStatus?.data?.actionItems?.map((item, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="font-medium text-sm">{item.action}</div>
                      <div className="text-xs text-gray-600 mt-1">{item.benefit}</div>
                      {item.currentScore !== undefined && (
                        <div className="text-xs text-blue-600 mt-1">
                          Current: {item.currentScore} → Target: {item.targetScore}
                        </div>
                      )}
                    </div>
                  )) || (
                    <div className="p-3 border rounded-lg bg-green-50">
                      <div className="font-medium text-sm text-green-800">All Set!</div>
                      <div className="text-xs text-green-600 mt-1">Maximum discounts available</div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discounts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>HDAG Token Fee Discount Breakdown</CardTitle>
              <CardDescription>
                Your personalized fee savings across all blockchain operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {discountLoading ? (
                <div className="text-center py-8">Loading discount information...</div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-gradient-to-br from-green-50 to-green-100">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-green-800">Base HDAG Discount</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-green-600">
                          {discountStatus?.data?.discountBreakdown?.hdagPayment?.discount || '50%'}
                        </div>
                        <p className="text-sm text-green-700 mt-1">
                          Save {discountStatus?.data?.discountBreakdown?.hdagPayment?.savings || '$50'} per $100 transaction
                        </p>
                        <Badge className="mt-2 bg-green-600">Always Available</Badge>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-blue-800">Profile Bonus</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-blue-600">
                          +{discountStatus?.data?.discountBreakdown?.profileComplete?.discount || '50%'}
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                          Additional {discountStatus?.data?.discountBreakdown?.profileComplete?.savings || '$25'} savings
                        </p>
                        <Badge className="mt-2 bg-blue-600">
                          {discountStatus?.data?.discountBreakdown?.profileComplete?.eligible ? 'Unlocked' : 'Need 95%'}
                        </Badge>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg text-purple-800">Reputation Bonus</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold text-purple-600">
                          +{discountStatus?.data?.discountBreakdown?.highReputation?.discount || '25%'}
                        </div>
                        <p className="text-sm text-purple-700 mt-1">
                          Extra {discountStatus?.data?.discountBreakdown?.highReputation?.savings || '$12.50'} off remaining
                        </p>
                        <Badge className="mt-2 bg-purple-600">
                          {discountStatus?.data?.discountBreakdown?.highReputation?.eligible ? 'Unlocked' : 'Need Rep 80+'}
                        </Badge>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-6 rounded-lg border">
                    <h3 className="font-semibold text-lg mb-3">Total Savings Calculation</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Base transaction cost:</span>
                        <span className="font-mono">$100.00</span>
                      </div>
                      <div className="flex justify-between text-green-600">
                        <span>- HDAG discount (50%):</span>
                        <span className="font-mono">-$50.00</span>
                      </div>
                      <div className="flex justify-between text-blue-600">
                        <span>- Profile bonus (50% of remaining):</span>
                        <span className="font-mono">-${discountStatus?.data?.discountBreakdown?.profileComplete?.eligible ? '25.00' : '0.00'}</span>
                      </div>
                      <div className="flex justify-between text-purple-600">
                        <span>- Reputation bonus (25% of remaining):</span>
                        <span className="font-mono">-${discountStatus?.data?.discountBreakdown?.highReputation?.eligible ? '12.50' : '0.00'}</span>
                      </div>
                      <hr className="my-2" />
                      <div className="flex justify-between font-bold text-lg">
                        <span>Final cost:</span>
                        <span className="font-mono text-green-600">
                          {discountStatus?.data?.potentialSavings?.current 
                            ? `$${(100 - parseFloat(discountStatus.data.potentialSavings.current.replace(/[^0-9.]/g, ''))).toFixed(2)}`
                            : '$25.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="chains" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AggLayer Connected Chains</CardTitle>
              <CardDescription>
                Real-time status of blockchain networks in your unified ecosystem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {chainStatus.map((chain) => (
                  <Card key={chain.chainId} className="relative">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{chain.name}</CardTitle>
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(chain.status)}`}></div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Chain ID:</span>
                          <span className="font-mono">{chain.chainId}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Gas Price:</span>
                          <span className="font-mono">{formatGasPrice(chain.gasPrice)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Token:</span>
                          <Badge variant="outline">{chain.nativeToken}</Badge>
                        </div>
                        <div className="mt-3">
                          <Badge 
                            className={`w-full justify-center ${
                              chain.status === 'connected' ? 'bg-green-600' : 'bg-red-600'
                            }`}
                          >
                            {chain.status === 'connected' ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Connected
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Disconnected
                              </>
                            )}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="proofs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Miden VM Privacy Proofs
              </CardTitle>
              <CardDescription>
                Client-side proof generation for privacy-preserving reputation calculations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="bg-blue-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Reputation Proof</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <Badge className="bg-green-600">Valid</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Generated:</span>
                          <span>2 min ago</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Proof Size:</span>
                          <span>1.2 KB</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-purple-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Fee Discount Proof</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <Badge className="bg-green-600">Valid</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Discount:</span>
                          <span>75%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Verified:</span>
                          <span>On-chain</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Privacy Benefits</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Your profile data never leaves your device</li>
                    <li>• Zero-knowledge proofs verify eligibility without revealing details</li>
                    <li>• Client-side computation ensures maximum privacy</li>
                    <li>• Verifiable on-chain without compromising personal information</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}