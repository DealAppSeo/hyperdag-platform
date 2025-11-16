import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Loader2, RefreshCw, Check, BarChart4, Activity } from 'lucide-react';
import AdminLayout from '@/components/admin/admin-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Separator } from '@/components/ui/separator';

// Type definitions for system metrics and optimization recommendations
interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    cached: number;
  };
  network: {
    rx: number;
    tx: number;
    connections: number;
  };
  storage: {
    total: number;
    used: number;
    free: number;
    readOps: number;
    writeOps: number;
  };
  database: {
    queries: number;
    slowQueries: number;
    connectionPool: {
      total: number;
      active: number;
      idle: number;
    };
    avgResponseTime: number;
  };
  api: {
    requests: number;
    latency: {
      avg: number;
      p95: number;
      p99: number;
    };
    errorRate: number;
  };
}

interface SuggestedChange {
  change: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
}

interface OptimizationRecommendation {
  id: number;
  target: string;
  currentMetrics: Record<string, any>;
  suggestedChanges: SuggestedChange[];
  expectedImprovement: number;
  confidence: number;
  implementationComplexity: 'low' | 'medium' | 'high';
  createdAt: string;
  implementedAt: string | null;
  effectiveness: number | null;
}

interface AnalysisResult {
  metrics: SystemMetrics;
  targets: any[];
  recommendations: OptimizationRecommendation[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Format bytes to human-readable format
const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Effort and complexity badges
const EffortBadge: React.FC<{ level: 'low' | 'medium' | 'high' }> = ({ level }) => {
  const colorMap = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };
  
  return (
    <Badge className={`${colorMap[level]} hover:${colorMap[level]}`}>
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </Badge>
  );
};

// Resources usage card
const ResourceUsageCard: React.FC<{ title: string; used: number; total: number; unit: string }> = ({ 
  title, used, total, unit 
}) => {
  const percentage = Math.round((used / total) * 100);
  
  return (
    <Card className="col-span-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{formatBytes(used)}</span>
            <span>{formatBytes(total)}</span>
          </div>
          <Progress value={percentage} className="h-2" />
          <div className="text-xs text-muted-foreground text-right">
            {percentage}% used
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Main page component
const SystemOptimizationPage: React.FC = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('metrics');

  // Fetch metrics data
  const { 
    data: metricsResponse, 
    isLoading: metricsLoading, 
    refetch: refetchMetrics 
  } = useQuery<ApiResponse<SystemMetrics>>({
    queryKey: ['/api/optimization/metrics'],
    retry: 2,
  });

  // Fetch recommendations
  const { 
    data: recommendationsResponse, 
    isLoading: recommendationsLoading,
    refetch: refetchRecommendations
  } = useQuery<ApiResponse<OptimizationRecommendation[]>>({
    queryKey: ['/api/optimization/recommendations'],
    retry: 2,
  });

  // Run analysis mutation
  const analysisMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/optimization/analyze');
      return await response.json();
    },
    onSuccess: (data: { success: boolean; data: AnalysisResult }) => {
      if (data.success) {
        toast({
          title: 'Analysis Complete',
          description: `Generated ${data.data.recommendations.length} optimization recommendations`,
        });
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/optimization/recommendations'] });
        queryClient.invalidateQueries({ queryKey: ['/api/optimization/metrics'] });
        
        // Switch to recommendations tab
        setActiveTab('recommendations');
      }
    },
    onError: () => {
      toast({
        title: 'Analysis Failed',
        description: 'Failed to analyze system performance',
        variant: 'destructive',
      });
    },
  });

  // Implementation mutation
  const implementMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('POST', `/api/optimization/recommendations/${id}/implement`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Recommendation marked as implemented',
      });
      
      // Refresh recommendations data
      queryClient.invalidateQueries({ queryKey: ['/api/optimization/recommendations'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to mark recommendation as implemented',
        variant: 'destructive',
      });
    },
  });

  // Record effectiveness mutation
  const recordEffectivenessMutation = useMutation({
    mutationFn: async ({ id, effectiveness }: { id: number; effectiveness: number }) => {
      const response = await apiRequest(
        'POST', 
        `/api/optimization/recommendations/${id}/effectiveness`,
        { effectiveness }
      );
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Effectiveness recorded successfully',
      });
      
      // Refresh recommendations data
      queryClient.invalidateQueries({ queryKey: ['/api/optimization/recommendations'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to record effectiveness',
        variant: 'destructive',
      });
    },
  });

  const metrics = metricsResponse?.data;
  const recommendations = recommendationsResponse?.data;

  // Format API latency data for charts
  const formatLatencyData = () => {
    if (!metrics?.api) return [];
    
    return [
      { name: 'Average', value: metrics.api.latency.avg },
      { name: '95th %', value: metrics.api.latency.p95 },
      { name: '99th %', value: metrics.api.latency.p99 },
    ];
  };

  // Format CPU usage data for chart
  const formatCpuData = () => {
    if (!metrics?.cpu) return [];
    
    return [
      { name: 'Usage', value: Math.round(metrics.cpu.usage * 100) },
    ];
  };

  // Format database connection pool data for chart
  const formatDbConnectionData = () => {
    if (!metrics?.database?.connectionPool) return [];
    
    const { total, active, idle } = metrics.database.connectionPool;
    
    return [
      { name: 'Active', value: active },
      { name: 'Idle', value: idle },
      { name: 'Available', value: total - (active + idle) },
    ];
  };

  return (
    <AdminLayout title="System Optimization" description="Analyze and optimize system performance">
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => analysisMutation.mutate()}
          disabled={analysisMutation.isPending}
        >
          {analysisMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Activity className="mr-2 h-4 w-4" />
              Run System Analysis
            </>
          )}
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="metrics">System Metrics</TabsTrigger>
          <TabsTrigger value="recommendations">Optimization Recommendations</TabsTrigger>
        </TabsList>
        
        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-4">
          {metricsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !metrics ? (
            <div className="text-center py-12">
              <p>No metrics data available</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => refetchMetrics()}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Metrics
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => refetchMetrics()}
                  className="mb-4"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Metrics
                </Button>
              </div>
              
              {/* Resource Usage Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Resource Usage</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Memory Usage */}
                  <ResourceUsageCard
                    title="Memory Usage"
                    used={metrics.memory.used}
                    total={metrics.memory.total}
                    unit="bytes"
                  />
                  
                  {/* Storage Usage */}
                  <ResourceUsageCard
                    title="Storage Usage"
                    used={metrics.storage.used}
                    total={metrics.storage.total}
                    unit="bytes"
                  />
                  
                  {/* CPU Usage */}
                  <Card className="col-span-1">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">CPU Usage</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[100px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={formatCpuData()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 100]} />
                            <RechartsTooltip formatter={(value) => [`${value}%`, 'Usage']} />
                            <Bar dataKey="value" fill="#8884d8" name="CPU" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="text-xs text-muted-foreground text-center mt-2">
                        {metrics.cpu.cores} cores available
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              {/* Performance Metrics Section */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* API Latency */}
                  <Card>
                    <CardHeader>
                      <CardTitle>API Latency</CardTitle>
                      <CardDescription>Response time in milliseconds</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={formatLatencyData()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <RechartsTooltip formatter={(value) => [`${value} ms`, 'Latency']} />
                            <Bar dataKey="value" fill="#82ca9d" name="Latency" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <div className="text-sm text-muted-foreground">
                        Error Rate: {(metrics.api.errorRate * 100).toFixed(2)}%
                      </div>
                    </CardFooter>
                  </Card>
                  
                  {/* Database Metrics */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Database Connections</CardTitle>
                      <CardDescription>Active and idle connections</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[200px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={formatDbConnectionData()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <RechartsTooltip />
                            <Bar dataKey="value" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <div className="text-sm text-muted-foreground">
                        Avg. Response: {metrics.database.avgResponseTime.toFixed(2)} ms
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Slow Queries: {metrics.database.slowQueries}
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              {/* Network Metrics */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Network Activity</h2>
                <div className="grid grid-cols-1 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Network Traffic</CardTitle>
                      <CardDescription>Data transfer metrics</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h3 className="text-sm font-medium mb-2">Data Received</h3>
                          <div className="text-2xl font-bold">{formatBytes(metrics.network.rx)}</div>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium mb-2">Data Sent</h3>
                          <div className="text-2xl font-bold">{formatBytes(metrics.network.tx)}</div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <div className="text-sm text-muted-foreground">
                        Active Connections: {metrics.network.connections}
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </>
          )}
        </TabsContent>
        
        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          {recommendationsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !recommendations || !recommendations?.length ? (
            <div className="text-center py-12">
              <p>No recommendations available</p>
              <Button 
                variant="outline"
                onClick={() => refetchRecommendations()}
                className="mt-4"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Data
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {recommendations.length} recommendations found
                </p>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => refetchRecommendations()}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                {recommendations.map((rec) => (
                  <Card key={rec.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{rec.target}</CardTitle>
                          <CardDescription className="mt-1">
                            Created: {new Date(rec.createdAt).toLocaleString()}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <EffortBadge level={rec.implementationComplexity} />
                          <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 hover:bg-blue-50"
                          >
                            +{rec.expectedImprovement.toFixed(0)}%
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <p className="text-sm text-muted-foreground mb-4">
                        Confidence: {(rec.confidence * 100).toFixed(0)}%
                      </p>
                      
                      <h4 className="text-sm font-semibold mb-2">Suggested Changes:</h4>
                      <ul className="space-y-2 text-sm">
                        {rec.suggestedChanges.map((change, idx) => (
                          <li key={idx} className="border-l-2 border-primary pl-3 py-1">
                            <p className="font-medium">{change.change}</p>
                            <p className="text-muted-foreground text-xs mt-1">{change.impact}</p>
                            <div className="mt-1">
                              <EffortBadge level={change.effort} />
                            </div>
                          </li>
                        ))}
                      </ul>
                      
                      {rec.implementedAt && (
                        <div className="mt-4 bg-green-50 rounded-md p-3 flex items-center text-green-700">
                          <Check className="mr-2 h-4 w-4" />
                          <span className="text-sm">
                            Implemented on {new Date(rec.implementedAt).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                      
                      {rec.effectiveness !== null && (
                        <div className="mt-4">
                          <h4 className="text-sm font-semibold mb-2">Measured Effectiveness:</h4>
                          <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                              <div
                                className="bg-primary h-2.5 rounded-full"
                                style={{ width: `${rec.effectiveness * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">
                              {(rec.effectiveness * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-end">
                      {rec.implementedAt ? (
                        <div className="text-sm text-green-700 flex items-center">
                          <Check className="mr-2 h-4 w-4" />
                          Implemented
                        </div>
                      ) : (
                        <Button
                          variant="outline"
                          onClick={() => implementMutation.mutate(rec.id)}
                          disabled={implementMutation.isPending}
                        >
                          {implementMutation.isPending ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="mr-2 h-4 w-4" />
                          )}
                          Mark as Implemented
                        </Button>
                      )}
                      
                      {rec.implementedAt && rec.effectiveness === null && (
                        <div className="flex items-center space-x-2 ml-4">
                          <span className="text-sm">Record effectiveness:</span>
                          {[0.1, 0.5, 0.9].map((value) => (
                            <Button
                              key={value}
                              variant="outline"
                              size="sm"
                              onClick={() => 
                                recordEffectivenessMutation.mutate({ 
                                  id: rec.id, 
                                  effectiveness: value 
                                })
                              }
                            >
                              {Math.round(value * 100)}%
                            </Button>
                          ))}
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default SystemOptimizationPage;