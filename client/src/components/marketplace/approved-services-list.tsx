import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Cloud, 
  Cpu, 
  Database, 
  Brain, 
  Fuel, 
  Shield, 
  Globe, 
  TrendingUp,
  DollarSign,
  Users,
  Star,
  Search,
  Filter,
  Code,
  Code2,
  Zap,
  Bot,
  Video,
  Scissors,
  Blocks,
  Hammer,
  GitBranch,
  Workflow,
  Globe2,
  Server,
  Package,
  HardDrive,
  Link,
  FolderTree,
  Network,
  BarChart3,
  MessageSquare,
  MessageCircle,
  FileText,
  Layers,
  ArrowLeftRight,
  Atom,
  LineChart,
  Hexagon,
  Terminal,
  ArrowUpDown,
  Grid,
  List
} from 'lucide-react';

interface ApprovedService {
  id: string;
  name: string;
  category: 'compute' | 'storage' | 'ai' | 'gas' | 'security' | 'network' | 'development' | 'analytics';
  description: string;
  demandLevel: number; // 0-100
  avgEarningRate: number; // HDAG per hour
  referralCommission: number; // percentage
  popularity: number; // 1-5 stars
  minimumShare: string;
  estimatedUsers: number;
  icon: React.ComponentType<any>;
  website: string;
  features: string[];
}

const approvedServices: ApprovedService[] = [
  {
    id: 'vercel-pro',
    name: 'Vercel Pro',
    category: 'compute',
    description: 'Serverless deployment platform with advanced features',
    demandLevel: 92,
    avgEarningRate: 12.5,
    referralCommission: 30,
    popularity: 5,
    minimumShare: '10% of monthly allocation',
    estimatedUsers: 2450,
    icon: Globe,
    website: 'vercel.com',
    features: ['Edge Functions', 'Analytics', 'Team Collaboration', 'Custom Domains']
  },
  {
    id: 'openai-api',
    name: 'OpenAI API Credits',
    category: 'ai',
    description: 'GPT-4 and other AI model access credits',
    demandLevel: 98,
    avgEarningRate: 18.75,
    referralCommission: 25,
    popularity: 5,
    minimumShare: '$50 worth of credits',
    estimatedUsers: 3800,
    icon: Brain,
    website: 'openai.com',
    features: ['GPT-4 Turbo', 'DALL-E 3', 'Whisper', 'Embeddings']
  },
  {
    id: 'aws-credits',
    name: 'AWS Credits',
    category: 'compute',
    description: 'Amazon Web Services compute and storage credits',
    demandLevel: 88,
    avgEarningRate: 15.25,
    referralCommission: 20,
    popularity: 5,
    minimumShare: '$100 worth of credits',
    estimatedUsers: 4200,
    icon: Cloud,
    website: 'aws.amazon.com',
    features: ['EC2', 'S3', 'Lambda', 'RDS']
  },
  {
    id: 'alchemy-premium',
    name: 'Alchemy Premium',
    category: 'network',
    description: 'Blockchain infrastructure and API access',
    demandLevel: 85,
    avgEarningRate: 14.0,
    referralCommission: 35,
    popularity: 4,
    minimumShare: '500k compute units',
    estimatedUsers: 1850,
    icon: Shield,
    website: 'alchemy.com',
    features: ['Enhanced APIs', 'Real-time Webhooks', 'Debug Tools', 'Analytics']
  },
  {
    id: 'anthropic-api',
    name: 'Anthropic Claude',
    category: 'ai',
    description: 'Claude AI model access and API credits',
    demandLevel: 95,
    avgEarningRate: 17.5,
    referralCommission: 28,
    popularity: 5,
    minimumShare: '$75 worth of credits',
    estimatedUsers: 2900,
    icon: Brain,
    website: 'anthropic.com',
    features: ['Claude 3.5 Sonnet', 'Long Context', 'Vision', 'Function Calling']
  },
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    category: 'development',
    description: 'AI-powered code completion and assistance',
    demandLevel: 82,
    avgEarningRate: 8.5,
    referralCommission: 40,
    popularity: 5,
    minimumShare: '1 seat license',
    estimatedUsers: 3200,
    icon: Cpu,
    website: 'github.com',
    features: ['Code Completion', 'Chat Interface', 'CLI Assistant', 'Security Scanning']
  },
  {
    id: 'pinecone-pro',
    name: 'Pinecone Pro',
    category: 'storage',
    description: 'Vector database for AI applications',
    demandLevel: 78,
    avgEarningRate: 11.25,
    referralCommission: 32,
    popularity: 4,
    minimumShare: '100k vectors',
    estimatedUsers: 1650,
    icon: Database,
    website: 'pinecone.io',
    features: ['Serverless', 'Metadata Filtering', 'Real-time Updates', 'Multi-cloud']
  },
  {
    id: 'replit-premium',
    name: 'Replit Premium',
    category: 'development',
    description: 'Cloud development environment with AI features',
    demandLevel: 75,
    avgEarningRate: 6.75,
    referralCommission: 45,
    popularity: 4,
    minimumShare: '50% of monthly compute',
    estimatedUsers: 2100,
    icon: Globe,
    website: 'replit.com',
    features: ['Always-on Repls', 'Ghostwriter AI', 'Private Repos', 'Multiplayer']
  }
];

const categoryIcons = {
  compute: Cloud,
  storage: Database,
  ai: Brain,
  gas: Fuel,
  security: Shield,
  network: Globe,
  development: Cpu,
  analytics: TrendingUp
};

const categoryColors = {
  compute: 'bg-blue-100 text-blue-800',
  storage: 'bg-green-100 text-green-800',
  ai: 'bg-purple-100 text-purple-800',
  gas: 'bg-orange-100 text-orange-800',
  security: 'bg-red-100 text-red-800',
  network: 'bg-indigo-100 text-indigo-800',
  development: 'bg-cyan-100 text-cyan-800',
  analytics: 'bg-pink-100 text-pink-800'
};

const getEarningPotential = (demandLevel: number, commission: number) => {
  // Green: Can arbitrage paid accounts (95%+ demand, 25%+ commission)
  if (demandLevel >= 95 && commission >= 25) return 'high';
  // Yellow: Can earn from free tier signups (85%+ demand, 20%+ commission)
  if (demandLevel >= 85 && commission >= 20) return 'medium';
  // Red: No significant arbitrage potential
  return 'low';
};

const getDemandColor = (potential: string) => {
  if (potential === 'high') return 'text-green-600';
  if (potential === 'medium') return 'text-yellow-600';
  return 'text-red-600';
};

const getDemandLabel = (potential: string) => {
  if (potential === 'high') return 'Arbitrage Ready';
  if (potential === 'medium') return 'Free Tier Earnings';
  return 'Low Potential';
};

export function ApprovedServicesList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState('earning');
  const [viewMode, setViewMode] = useState<'category' | 'list'>('category');

  const filteredServices = approvedServices
    .filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           service.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'demand':
          return b.demandLevel - a.demandLevel;
        case 'earning':
          return b.avgEarningRate - a.avgEarningRate;
        case 'commission':
          return b.referralCommission - a.referralCommission;
        case 'popularity':
          return b.popularity - a.popularity;
        default:
          return 0;
      }
    });

  // Group services by category for organized display
  const servicesByCategory = filteredServices.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, ApprovedService[]>);

  const ServiceCard = ({ service }: { service: ApprovedService }) => {
    const IconComponent = service.icon;
    const CategoryIcon = categoryIcons[service.category];
    const earningPotential = getEarningPotential(service.demandLevel, service.referralCommission);
    
    return (
      <Card className="h-full hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <IconComponent className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{service.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={categoryColors[service.category]}>
                    <CategoryIcon className="h-3 w-3 mr-1" />
                    {service.category}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-medium ${getDemandColor(earningPotential)}`}>
                {getDemandLabel(earningPotential)}
              </div>
              <div className="text-xs text-muted-foreground">
                {service.estimatedUsers.toLocaleString()} users
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <CardDescription>{service.description}</CardDescription>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Demand Level</span>
                <span className={`font-medium ${getDemandColor(service.demandLevel)}`}>
                  {service.demandLevel}%
                </span>
              </div>
              <Progress value={service.demandLevel} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Earning Rate</div>
                <div className="font-medium text-green-600">
                  {service.avgEarningRate} HDAG/hr
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Commission</div>
                <div className="font-medium text-primary">
                  {service.referralCommission}%
                </div>
              </div>
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground mb-1">Minimum Share</div>
              <div className="text-sm font-medium">{service.minimumShare}</div>
            </div>
            
            <div>
              <div className="text-sm text-muted-foreground mb-2">Key Features</div>
              <div className="flex flex-wrap gap-1">
                {service.features.slice(0, 3).map((feature, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {feature}
                  </Badge>
                ))}
                {service.features.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{service.features.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button size="sm" className="flex-1">
              Share Service
            </Button>
            <Button variant="outline" size="sm">
              Learn More
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Approved Services</h2>
          <p className="text-muted-foreground">
            High-demand services with verified earning potential
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="ai">AI</SelectItem>
              <SelectItem value="compute">Compute</SelectItem>
              <SelectItem value="storage">Storage</SelectItem>
              <SelectItem value="network">Network</SelectItem>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="security">Security</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="demand">Demand</SelectItem>
              <SelectItem value="earning">Earning Rate</SelectItem>
              <SelectItem value="commission">Commission</SelectItem>
              <SelectItem value="popularity">Popularity</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list">
          <div className="space-y-4">
            {filteredServices.map((service) => {
              const IconComponent = service.icon;
              const CategoryIcon = categoryIcons[service.category];
              
              return (
                <Card key={service.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">{service.name}</h3>
                            <Badge variant="outline" className={categoryColors[service.category]}>
                              <CategoryIcon className="h-3 w-3 mr-1" />
                              {service.category}
                            </Badge>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < service.popularity ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-muted-foreground mb-3">{service.description}</p>
                          <div className="flex items-center gap-6 text-sm">
                            <div>
                              <span className="text-muted-foreground">Demand: </span>
                              <span className={`font-medium ${getDemandColor(service.demandLevel)}`}>
                                {getDemandLabel(service.demandLevel)} ({service.demandLevel}%)
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Earning: </span>
                              <span className="font-medium text-green-600">
                                {service.avgEarningRate} HDAG/hr
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Commission: </span>
                              <span className="font-medium text-primary">
                                {service.referralCommission}%
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Users: </span>
                              <span className="font-medium">
                                {service.estimatedUsers.toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button size="sm">Share Service</Button>
                        <Button variant="outline" size="sm">Details</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {filteredServices.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground">
            No services found matching your criteria
          </div>
        </div>
      )}
    </div>
  );
}