import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Bot, 
  Brain, 
  TrendingUp, 
  Shield, 
  Code, 
  Zap, 
  Search,
  Award,
  CheckCircle,
  AlertCircle,
  Star,
  Activity,
  Database,
  Cpu
} from 'lucide-react';

interface DBTCredential {
  id: number;
  entityId: number;
  tokenId: string;
  contractAddress: string;
  chainId: number;
  performanceRating: number;
  reliabilityRating: number;
  securityRating: number;
  efficiencyRating: number;
  overallRating: number;
  uptimePercentage: string;
  responseTime: number;
  errorRate: string;
  throughput: number;
  dataProcessed: number;
  aiModelVersion: string;
  apiEndpoints: number;
  securityAudited: boolean;
  complianceStatus: string;
  lastPerformanceCheck: string;
  energyEfficiencyRating: number;
  carbonFootprint: number;
  issuedAt: string;
  expiresAt: string;
  isRevoked: boolean;
  verificationLevel: number;
  entityName: string;
  entityType: string;
  entityDescription: string;
  organizationName: string;
}

const getRatingColor = (rating: number) => {
  if (rating >= 80) return 'bg-green-500';
  if (rating >= 60) return 'bg-yellow-500';
  if (rating >= 40) return 'bg-orange-500';
  return 'bg-red-500';
};

const getRatingLabel = (rating: number) => {
  if (rating >= 80) return 'Excellent';
  if (rating >= 60) return 'Good';
  if (rating >= 40) return 'Fair';
  return 'Poor';
};

const getEntityTypeIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'ai_agent': return Bot;
    case 'ml_model': return Brain;
    case 'api_service': return Code;
    case 'data_processor': return Database;
    default: return Cpu;
  }
};

export default function DBTCredentials() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCredential, setSelectedCredential] = useState<DBTCredential | null>(null);
  const [filterType, setFilterType] = useState<string>('all');

  // Fetch DBT credentials
  const { data: credentialsResponse, isLoading } = useQuery({
    queryKey: ['/api/dbt/credentials'],
    retry: false
  });

  // Fetch entity leaderboard
  const { data: leaderboardResponse } = useQuery({
    queryKey: ['/api/dbt/leaderboard'],
    retry: false
  });

  const credentials = credentialsResponse?.data?.credentials || [];
  const leaderboard = leaderboardResponse?.data?.entities || [];

  const filteredCredentials = credentials.filter((cred: DBTCredential) => {
    const matchesSearch = cred.entityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cred.entityDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cred.organizationName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || cred.entityType === filterType;
    return matchesSearch && matchesType;
  });

  const entityTypes = ['all', 'ai_agent', 'ml_model', 'api_service', 'data_processor'];

  const ComplianceIndicator = ({ label, value }: { label: string; value: boolean }) => (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
      <span className="text-sm font-medium">{label}</span>
      {value ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <AlertCircle className="h-4 w-4 text-red-500" />
      )}
    </div>
  );

  const RatingCard = ({ 
    title, 
    rating, 
    icon: Icon, 
    description 
  }: { 
    title: string; 
    rating: number; 
    icon: any; 
    description: string;
  }) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{rating}/100</span>
            <Badge className={getRatingColor(rating)}>
              {getRatingLabel(rating)}
            </Badge>
          </div>
          <Progress value={rating} className="h-2" />
          <p className="text-xs text-gray-600">{description}</p>
        </div>
      </CardContent>
    </Card>
  );

  const MetricCard = ({ 
    title, 
    value, 
    unit, 
    icon: Icon, 
    trend 
  }: { 
    title: string; 
    value: string | number; 
    unit?: string; 
    icon: any; 
    trend?: 'up' | 'down' | 'stable';
  }) => (
    <div className="bg-white p-4 rounded-lg border">
      <div className="flex items-center justify-between mb-2">
        <Icon className="h-5 w-5 text-gray-600" />
        {trend && (
          <div className={`text-xs px-2 py-1 rounded ${
            trend === 'up' ? 'bg-green-100 text-green-600' :
            trend === 'down' ? 'bg-red-100 text-red-600' :
            'bg-gray-100 text-gray-600'
          }`}>
            {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold">{value}{unit}</div>
      <div className="text-sm text-gray-600">{title}</div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading digital entity credentials...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">DBT Digital Entity Registry</h1>
        <p className="text-gray-600">
          Digital Bound Tokens for AI agents and non-living entities reputation tracking
        </p>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Browse Entities</TabsTrigger>
          <TabsTrigger value="leaderboard">Top Performers</TabsTrigger>
          <TabsTrigger value="details">Entity Details</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search entities by name, description, or organization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border rounded-md bg-white"
            >
              {entityTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-6">
            {filteredCredentials.map((credential: DBTCredential) => {
              const EntityIcon = getEntityTypeIcon(credential.entityType);
              return (
                <Card key={credential.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => setSelectedCredential(credential)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <EntityIcon className="h-5 w-5" />
                          {credential.entityName}
                        </CardTitle>
                        <CardDescription>{credential.entityDescription}</CardDescription>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">{credential.entityType.replace('_', ' ')}</Badge>
                          <Badge variant="secondary">{credential.organizationName}</Badge>
                        </div>
                      </div>
                      <Badge variant="outline">
                        Level {credential.verificationLevel}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {credential.overallRating}
                        </div>
                        <div className="text-sm text-gray-600">Overall Rating</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {parseFloat(credential.uptimePercentage || '0').toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Uptime</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {credential.responseTime}ms
                        </div>
                        <div className="text-sm text-gray-600">Response Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {credential.securityRating}
                        </div>
                        <div className="text-sm text-gray-600">Security</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>
                        <Activity className="inline h-4 w-4 mr-1" />
                        {credential.throughput?.toLocaleString()} req/sec
                      </span>
                      <span>
                        Model: {credential.aiModelVersion || 'N/A'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredCredentials.length === 0 && (
            <div className="text-center py-12">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No entities found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search terms or filters.' : 'No digital entity credentials available yet.'}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top Performing Digital Entities
              </CardTitle>
              <CardDescription>
                Entities ranked by overall performance, reliability, and security scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.map((entity: any, index: number) => {
                  const EntityIcon = getEntityTypeIcon(entity.entityType);
                  return (
                    <div key={entity.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">
                          {index + 1}
                        </div>
                        <EntityIcon className="h-6 w-6 text-gray-600" />
                        <div>
                          <h3 className="font-medium">{entity.entityName}</h3>
                          <p className="text-sm text-gray-600">{entity.organizationName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{entity.overallRating}/100</div>
                        <div className="flex gap-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < Math.floor(entity.overallRating / 20)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          {selectedCredential ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {(() => {
                      const EntityIcon = getEntityTypeIcon(selectedCredential.entityType);
                      return <EntityIcon className="h-5 w-5" />;
                    })()}
                    {selectedCredential.entityName}
                  </CardTitle>
                  <CardDescription>{selectedCredential.entityDescription}</CardDescription>
                  <div className="flex gap-2">
                    <Badge variant="outline">{selectedCredential.entityType.replace('_', ' ')}</Badge>
                    <Badge variant="secondary">{selectedCredential.organizationName}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <RatingCard
                      title="Performance"
                      rating={selectedCredential.performanceRating}
                      icon={TrendingUp}
                      description="Speed and throughput metrics"
                    />
                    <RatingCard
                      title="Reliability"
                      rating={selectedCredential.reliabilityRating}
                      icon={Shield}
                      description="Uptime and error rate tracking"
                    />
                    <RatingCard
                      title="Security"
                      rating={selectedCredential.securityRating}
                      icon={Shield}
                      description="Security audit and compliance"
                    />
                    <RatingCard
                      title="Efficiency"
                      rating={selectedCredential.efficiencyRating}
                      icon={Zap}
                      description="Resource utilization optimization"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <MetricCard
                      title="Uptime"
                      value={parseFloat(selectedCredential.uptimePercentage || '0').toFixed(2)}
                      unit="%"
                      icon={Activity}
                      trend="up"
                    />
                    <MetricCard
                      title="Response Time"
                      value={selectedCredential.responseTime}
                      unit="ms"
                      icon={Zap}
                      trend="stable"
                    />
                    <MetricCard
                      title="Throughput"
                      value={selectedCredential.throughput?.toLocaleString()}
                      unit=" req/s"
                      icon={TrendingUp}
                      trend="up"
                    />
                    <MetricCard
                      title="Error Rate"
                      value={parseFloat(selectedCredential.errorRate || '0').toFixed(3)}
                      unit="%"
                      icon={AlertCircle}
                      trend="down"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Technical Specifications</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">AI Model Version:</span>
                          <span className="text-sm">{selectedCredential.aiModelVersion || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">API Endpoints:</span>
                          <span className="text-sm">{selectedCredential.apiEndpoints}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Data Processed:</span>
                          <span className="text-sm">{selectedCredential.dataProcessed?.toLocaleString()} GB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Energy Efficiency:</span>
                          <span className="text-sm">{selectedCredential.energyEfficiencyRating}/100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Carbon Footprint:</span>
                          <span className="text-sm">{selectedCredential.carbonFootprint} kg CO₂</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Compliance & Security</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <ComplianceIndicator 
                          label="Security Audited" 
                          value={selectedCredential.securityAudited} 
                        />
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-sm font-medium">Compliance Status</span>
                          <Badge variant={selectedCredential.complianceStatus === 'compliant' ? 'default' : 'destructive'}>
                            {selectedCredential.complianceStatus}
                          </Badge>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="text-sm text-gray-600">
                            <strong>Last Performance Check:</strong><br/>
                            {new Date(selectedCredential.lastPerformanceCheck).toLocaleDateString()}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select an entity</h3>
              <p className="text-gray-600">Choose a digital entity from the browse tab to view detailed information.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}