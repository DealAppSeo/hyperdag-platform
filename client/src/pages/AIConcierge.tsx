import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowRight, 
  Zap, 
  TrendingDown, 
  BarChart3, 
  Key,
  Copy,
  Check,
  Sparkles,
  Brain
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function AIConcierge() {
  const [activeTab, setActiveTab] = useState('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { toast } = useToast();

  // For MVP demo, use a demo userId (in production, get from auth)
  const demoUserId = '1';

  const { data: apiKeys, isLoading: isLoadingKeys, error: keysError } = useQuery({
    queryKey: [`/api/ai/keys?userId=${demoUserId}`],
  });

  const { data: analytics, isLoading: isLoadingAnalytics, error: analyticsError } = useQuery({
    queryKey: [`/api/ai/analytics?userId=${demoUserId}`],
  });

  const generateKeyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/ai/keys', {
        method: 'POST',
        body: JSON.stringify({ userId: demoUserId, keyName: 'My API Key' }),
      });
      return response;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/ai/keys?userId=${demoUserId}`] });
      toast({
        title: '✨ Success!',
        description: 'API key generated! Copy it from the list below.',
        duration: 5000,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to generate API key. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const copyToClipboard = (text: string, keyId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyId);
    toast({
      title: 'Copied!',
      description: 'API key copied to clipboard',
    });
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-transparent to-black/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(99,102,241,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(168,85,247,0.1),transparent_50%)]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span className="text-sm text-indigo-300 font-medium">AI Cost Optimization Platform</span>
            </div>
            
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-200 to-purple-200">
              AI Concierge API
            </h1>
            
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Intelligent AI routing that <span className="text-indigo-400 font-semibold">saves you 70% on AI costs</span> by automatically selecting the cheapest, fastest provider for each request
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm" data-testid="card-feature-anfis">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-3">
                    <Brain className="w-6 h-6 text-indigo-400" />
                  </div>
                  <CardTitle className="text-white text-lg">ANFIS Routing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400 text-sm">
                    Fuzzy logic intelligently routes to OpenAI, Anthropic, Gemini, or Perplexity
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-sm" data-testid="card-feature-savings">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mb-3">
                    <TrendingDown className="w-6 h-6 text-green-400" />
                  </div>
                  <CardTitle className="text-white text-lg">70% Cost Savings</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400 text-sm">
                    Real-time cost tracking shows exactly how much you save vs OpenAI
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-sm" data-testid="card-feature-analytics">
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3">
                    <BarChart3 className="w-6 h-6 text-purple-400" />
                  </div>
                  <CardTitle className="text-white text-lg">Real-time Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-400 text-sm">
                    Track usage, costs, and savings with detailed provider breakdown
                  </p>
                </CardContent>
              </Card>
            </div>

            <Button 
              size="lg" 
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
              data-testid="button-get-started"
            >
              Get Started Free
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white/5 border border-white/10" data-testid="tabs-navigation">
            <TabsTrigger value="overview" className="data-[state=active]:bg-white/10" data-testid="tab-overview">
              <Zap className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="data-[state=active]:bg-white/10" data-testid="tab-api-keys">
              <Key className="w-4 h-4 mr-2" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white/10" data-testid="tab-analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6" data-testid="content-overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm" data-testid="card-stat-credits">
                <CardHeader className="pb-2">
                  <CardDescription className="text-slate-400">Current Balance</CardDescription>
                  <CardTitle className="text-3xl text-white">
                    {isLoadingAnalytics ? '...' : `$${analytics?.credits?.currentBalance || '0.00'}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-green-400">
                    {analytics?.credits ? `Lifetime spent: $${analytics.credits.lifetimeSpent}` : 'No usage yet'}
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-sm" data-testid="card-stat-savings">
                <CardHeader className="pb-2">
                  <CardDescription className="text-slate-400">Total Savings</CardDescription>
                  <CardTitle className="text-3xl text-green-400">
                    {isLoadingAnalytics ? '...' : `$${analytics?.credits?.totalSavings || '0.00'}`}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-400">vs OpenAI pricing</p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-sm" data-testid="card-stat-requests">
                <CardHeader className="pb-2">
                  <CardDescription className="text-slate-400">API Requests</CardDescription>
                  <CardTitle className="text-3xl text-white">
                    {isLoadingAnalytics ? '...' : analytics?.analytics?.totalRequests || 0}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-400">All time</p>
                </CardContent>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-sm" data-testid="card-stat-tokens">
                <CardHeader className="pb-2">
                  <CardDescription className="text-slate-400">Tokens Used</CardDescription>
                  <CardTitle className="text-3xl text-white">
                    {isLoadingAnalytics ? '...' : analytics?.analytics?.totalTokens?.toLocaleString() || 0}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-400">All time</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm" data-testid="card-quick-start">
              <CardHeader>
                <CardTitle className="text-white">Quick Start Guide</CardTitle>
                <CardDescription className="text-slate-400">
                  Get started with AI Concierge in 3 simple steps
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4 p-4 rounded-lg bg-white/5">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Generate API Key</h3>
                    <p className="text-sm text-slate-400">
                      Create your API key in the API Keys tab
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg bg-white/5">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Make Your First Request</h3>
                    <p className="text-sm text-slate-400 mb-2">
                      Send a POST request to /api/ai/chat with your messages
                    </p>
                    <pre className="text-xs bg-black/30 text-green-400 p-3 rounded overflow-x-auto">
{`POST /api/ai/chat
Headers: x-api-key: YOUR_API_KEY
Body: { "messages": [{ "role": "user", "content": "Hello!" }] }`}
                    </pre>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-lg bg-white/5">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">Track Your Savings</h3>
                    <p className="text-sm text-slate-400">
                      Monitor real-time cost savings in the Analytics tab
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-6" data-testid="content-api-keys">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">API Keys</CardTitle>
                    <CardDescription className="text-slate-400">
                      Manage your API keys for accessing the AI Concierge API
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => generateKeyMutation.mutate()}
                    disabled={generateKeyMutation.isPending}
                    className="bg-indigo-600 hover:bg-indigo-700"
                    data-testid="button-generate-key"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Generate Key
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingKeys ? (
                  <div className="text-center py-12 text-slate-400">
                    <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
                    <p>Loading API keys...</p>
                  </div>
                ) : keysError ? (
                  <div className="text-center py-12 text-red-400">
                    <p className="mb-2">Error loading API keys</p>
                    <p className="text-sm text-slate-400">Please try refreshing the page</p>
                  </div>
                ) : apiKeys && Array.isArray(apiKeys) && apiKeys.length > 0 ? (
                  <div className="space-y-3">
                    {apiKeys.map((key: any) => (
                      <div
                        key={key.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
                        data-testid={`key-item-${key.id}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-white font-medium truncate">{key.keyName || 'Unnamed Key'}</h3>
                            <Badge variant={key.isActive ? 'default' : 'secondary'} className="text-xs">
                              {key.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                          <code className="text-xs text-slate-400 font-mono break-all">{key.apiKey}</code>
                          <div className="flex gap-4 mt-2 text-xs text-slate-500">
                            <span>Usage: {key.usageCount || 0} requests</span>
                            <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(key.apiKey, key.id)}
                          className="ml-4 text-slate-400 hover:text-white"
                          data-testid={`button-copy-${key.id}`}
                        >
                          {copiedKey === key.id ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-4">No API keys yet</p>
                    <p className="text-sm">Click "Generate Key" to create your first API key</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6" data-testid="content-analytics">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm" data-testid="card-analytics-overview">
              <CardHeader>
                <CardTitle className="text-white">Usage Analytics</CardTitle>
                <CardDescription className="text-slate-400">
                  Track your API usage and cost savings over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAnalytics ? (
                  <div className="text-center py-12 text-slate-400">
                    <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4" />
                    <p>Loading analytics...</p>
                  </div>
                ) : analyticsError ? (
                  <div className="text-center py-12 text-red-400">
                    <p className="mb-2">Error loading analytics</p>
                    <p className="text-sm text-slate-400">Make sure you have generated an API key first</p>
                  </div>
                ) : analytics?.analytics?.totalRequests > 0 ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Avg Cost/Request</p>
                        <p className="text-2xl text-white font-semibold">
                          ${analytics.analytics.avgCostPerRequest.toFixed(4)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Avg Latency</p>
                        <p className="text-2xl text-white font-semibold">
                          {Math.round(analytics.analytics.avgLatencyMs)}ms
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Total Cost</p>
                        <p className="text-2xl text-white font-semibold">
                          ${analytics.analytics.totalCost.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400 mb-1">Savings %</p>
                        <p className="text-2xl text-green-400 font-semibold">
                          {analytics.analytics.totalSavings > 0 
                            ? Math.round((analytics.analytics.totalSavings / (analytics.analytics.totalCost + analytics.analytics.totalSavings)) * 100)
                            : 0}%
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-white font-semibold mb-3">Provider Breakdown</h3>
                      <div className="space-y-2">
                        {Object.entries(analytics.analytics.providerBreakdown || {}).map(([provider, data]: [string, any]) => (
                          <div key={provider} className="flex items-center justify-between p-3 rounded bg-white/5">
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 rounded-full bg-indigo-400" />
                              <span className="text-white capitalize">{provider}</span>
                            </div>
                            <div className="flex gap-6 text-sm text-slate-400">
                              <span>{data.requests} requests</span>
                              <span>{data.tokens.toLocaleString()} tokens</span>
                              <span className="text-white">${data.cost.toFixed(4)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-2">No usage data yet</p>
                    <p className="text-sm">Make your first API request to see analytics</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 bg-black/20 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-slate-400 text-sm">
            <p>AI Concierge API - Democratizing AI through intelligent cost optimization</p>
            <p className="mt-2">
              Powered by ANFIS routing with OpenAI, Anthropic, Gemini, and Perplexity
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
