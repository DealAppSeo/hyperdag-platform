/**
 * AI Redundancy Dashboard
 * 
 * A dashboard component for monitoring the AI redundancy system,
 * showing provider status, metrics, and allowing configuration.
 */

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

type ProviderHealth = Record<string, boolean>;
type ProviderMetrics = {
  successRate: number;
  avgResponseTime: number;
  costPerRequest: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  lastFailure: string | null;
};

type Metrics = Record<string, ProviderMetrics>;

export function AIRedundancyDashboard() {
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch health data (NO POLLING)
  const { data: healthData, isLoading: isLoadingHealth, refetch: refetchHealth } = useQuery({
    queryKey: ['/api/ai/health'],
    refetchInterval: false // ❌ NO POLLING - eliminated 2 req/min
  });

  // Fetch metrics data (NO POLLING)
  const { data: metricsData, isLoading: isLoadingMetrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['/api/ai/metrics'],
    refetchInterval: false // ❌ NO POLLING - eliminated 1 req/min
  });

  // Fetch providers data
  const { data: providersData, isLoading: isLoadingProviders } = useQuery({
    queryKey: ['/api/ai/providers'],
  });

  // Set primary provider mutation
  const setPrimaryMutation = useMutation({
    mutationFn: async (provider: string) => {
      const response = await apiRequest('POST', '/api/ai/set-primary', { provider });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Primary provider updated',
        description: `Primary provider set to ${selectedProvider}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/ai/providers'] });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update primary provider',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    },
  });

  // Extract data from API responses
  const health: ProviderHealth = healthData?.data || {};
  const metrics: Metrics = metricsData?.data || {};
  const providers: string[] = providersData?.data?.providers || [];
  const primaryProvider: string = providersData?.data?.primary || '';

  // Set selectedProvider when primaryProvider is loaded
  useEffect(() => {
    if (primaryProvider && !selectedProvider) {
      setSelectedProvider(primaryProvider);
    }
  }, [primaryProvider, selectedProvider]);

  // Handle provider change
  const handleProviderChange = (value: string) => {
    setSelectedProvider(value);
  };

  // Set primary provider
  const handleSetPrimary = () => {
    if (selectedProvider) {
      setPrimaryMutation.mutate(selectedProvider);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Overall Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Status</CardTitle>
            <CardDescription>System-wide health and performance</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingHealth ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>System Status</span>
                  {Object.values(health).some(Boolean) ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />
                      Operational
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      <XCircle className="h-3.5 w-3.5 mr-1" />
                      Critical
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span>Active Providers</span>
                  <span className="font-medium">
                    {Object.values(health).filter(Boolean).length} / {Object.keys(health).length}
                  </span>
                </div>
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">Provider Availability</span>
                    <span className="text-sm">
                      {Object.keys(health).length > 0
                        ? Math.round(
                            (Object.values(health).filter(Boolean).length / Object.keys(health).length) * 100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      Object.keys(health).length > 0
                        ? (Object.values(health).filter(Boolean).length / Object.keys(health).length) * 100
                        : 0
                    }
                    className="h-2"
                  />
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </CardFooter>
        </Card>

        {/* Primary Provider Card */}
        <Card>
          <CardHeader>
            <CardTitle>Primary Provider</CardTitle>
            <CardDescription>Configure your preferred AI provider</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingProviders ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <span className="block mb-2 text-sm">Current Primary: </span>
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {primaryProvider || 'Not set'}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <span className="block text-sm">Change Primary Provider:</span>
                  <Select value={selectedProvider} onValueChange={handleProviderChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider} value={provider}>
                          {provider}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSetPrimary}
              disabled={
                isLoadingProviders ||
                setPrimaryMutation.isPending ||
                !selectedProvider ||
                selectedProvider === primaryProvider
              }
              className="w-full"
            >
              {setPrimaryMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                </>
              ) : (
                'Set as Primary'
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* System Metrics Card */}
        <Card>
          <CardHeader>
            <CardTitle>System Metrics</CardTitle>
            <CardDescription>Performance and usage statistics</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingMetrics ? (
              <div className="flex justify-center p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <span className="text-sm">Total Requests</span>
                  <div className="font-medium text-lg">
                    {Object.values(metrics).reduce((sum, m) => sum + m.totalRequests, 0)}
                  </div>
                </div>
                <div>
                  <span className="text-sm">Average Success Rate</span>
                  <div className="font-medium text-lg">
                    {Object.values(metrics).length > 0
                      ? Math.round(
                          Object.values(metrics).reduce((sum, m) => sum + m.successRate, 0) /
                            Object.values(metrics).length
                        )
                      : 0}
                    %
                  </div>
                </div>
                <div>
                  <span className="text-sm">Average Response Time</span>
                  <div className="font-medium text-lg">
                    {Object.values(metrics).length > 0
                      ? Math.round(
                          Object.values(metrics).reduce((sum, m) => sum + m.avgResponseTime, 0) /
                            Object.values(metrics).length
                        )
                      : 0}
                    ms
                  </div>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Based on all provider metrics combined
          </CardFooter>
        </Card>
      </div>

      {/* Provider Health Cards */}
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Provider Health</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoadingHealth ? (
            Array(3)
              .fill(0)
              .map((_, i) => (
                <Card key={i} className="flex items-center justify-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </Card>
              ))
          ) : Object.keys(health).length > 0 ? (
            Object.entries(health).map(([provider, isHealthy]) => (
              <Card key={provider} className={isHealthy ? '' : 'border-red-200'}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base">{provider}</CardTitle>
                    {isHealthy ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        Healthy
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Unhealthy
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    {primaryProvider === provider ? 'Primary Provider' : 'Fallback Provider'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {metrics[provider] ? (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Success Rate:</span>
                        <div>{metrics[provider].successRate.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Avg Response:</span>
                        <div>{metrics[provider].avgResponseTime.toFixed(0)} ms</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total Requests:</span>
                        <div>{metrics[provider].totalRequests}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Failures:</span>
                        <div>{metrics[provider].failedRequests}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">No metrics available</div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-3 flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg">
              <AlertTriangle className="h-10 w-10 text-amber-500" />
              <h3 className="mt-2 text-xl font-semibold">No providers found</h3>
              <p className="text-muted-foreground mt-1">
                Check API key configurations or connectivity issues
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}