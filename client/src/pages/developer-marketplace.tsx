import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Star, DollarSign, Clock, Users } from 'lucide-react';

interface DeveloperService {
  id: number;
  serviceName: string;
  serviceType: string;
  description: string;
  pricePerCall: string;
  qualityRating: string;
  totalCalls: number;
  successRate: string;
  avgResponseTime: number;
  developer: {
    id: number;
    username: string;
  };
}

export default function DeveloperMarketplace() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('price');

  // Fetch marketplace services
  const { data: marketplaceData, isLoading } = useQuery({
    queryKey: ['/api/web3-ai/marketplace/services', selectedType, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedType !== 'all') params.set('type', selectedType);
      params.set('sort', sortBy);
      
      const response = await fetch(`/api/web3-ai/marketplace/services?${params}`);
      if (!response.ok) throw new Error('Failed to fetch services');
      return response.json();
    }
  });

  // Service registration form
  const [formData, setFormData] = useState({
    serviceName: '',
    serviceType: 'ai',
    description: '',
    pricePerCall: '',
    endpoint: '',
    apiKey: ''
  });

  const registerService = useMutation({
    mutationFn: async (serviceData: typeof formData) => {
      const response = await fetch('/api/web3-ai/marketplace/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData)
      });
      if (!response.ok) throw new Error('Failed to register service');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Service Registered",
        description: "Your service has been successfully registered in the marketplace",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/web3-ai/marketplace/services'] });
      setFormData({
        serviceName: '',
        serviceType: 'ai',
        description: '',
        pricePerCall: '',
        endpoint: '',
        apiKey: ''
      });
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    registerService.mutate(formData);
  };

  const services = marketplaceData?.services || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Developer Marketplace</h1>
          <p className="text-slate-600">Discover AI and Web3 services from the community or register your own</p>
        </div>

        <Tabs defaultValue="browse" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="browse">Browse Services</TabsTrigger>
            <TabsTrigger value="register">Register Service</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            <div className="flex gap-4 items-center">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Service Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="ai">AI Services</SelectItem>
                  <SelectItem value="web3">Web3 Services</SelectItem>
                  <SelectItem value="blockchain">Blockchain</SelectItem>
                  <SelectItem value="storage">Storage</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="price">Price (Low to High)</SelectItem>
                  <SelectItem value="rating">Rating (High to Low)</SelectItem>
                  <SelectItem value="calls">Most Popular</SelectItem>
                  <SelectItem value="recent">Recently Added</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-slate-200 rounded"></div>
                        <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {services.map((service: DeveloperService) => (
                  <Card key={service.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {service.serviceName}
                        <Badge variant="secondary">{service.serviceType}</Badge>
                      </CardTitle>
                      <CardDescription>
                        by {service.developer.username}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-slate-600 mb-4">{service.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-green-600" />
                          <span className="font-medium">{service.pricePerCall}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium">{service.qualityRating}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-blue-600" />
                          <span className="font-medium">{service.totalCalls} calls</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-purple-600" />
                          <span className="font-medium">{service.avgResponseTime}ms</span>
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className="text-xs">
                            {service.successRate} success rate
                          </Badge>
                          <Button size="sm">Use Service</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {services.length === 0 && !isLoading && (
              <Card className="text-center p-8">
                <CardContent>
                  <h3 className="text-lg font-semibold mb-2">No services found</h3>
                  <p className="text-slate-600 mb-4">
                    Be the first to register a service in this category!
                  </p>
                  <Button onClick={() => {
                    const registerTab = document.querySelector('[value="register"]') as HTMLButtonElement;
                    if (registerTab) registerTab.click();
                  }}>
                    Register Your Service
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Register Your Service</CardTitle>
                <CardDescription>
                  Add your AI or Web3 service to the marketplace and start earning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="serviceName">Service Name</Label>
                      <Input
                        id="serviceName"
                        value={formData.serviceName}
                        onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                        placeholder="e.g., GPT-4 Text Generation"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="serviceType">Service Type</Label>
                      <Select
                        value={formData.serviceType}
                        onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ai">AI Service</SelectItem>
                          <SelectItem value="web3">Web3 Service</SelectItem>
                          <SelectItem value="blockchain">Blockchain</SelectItem>
                          <SelectItem value="storage">Storage</SelectItem>
                          <SelectItem value="compute">Compute</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe what your service does and its capabilities"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pricePerCall">Price per Call</Label>
                      <Input
                        id="pricePerCall"
                        value={formData.pricePerCall}
                        onChange={(e) => setFormData({ ...formData, pricePerCall: e.target.value })}
                        placeholder="e.g., $0.001"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="endpoint">API Endpoint</Label>
                      <Input
                        id="endpoint"
                        value={formData.endpoint}
                        onChange={(e) => setFormData({ ...formData, endpoint: e.target.value })}
                        placeholder="https://your-api.com/endpoint"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="apiKey">API Key (optional)</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={formData.apiKey}
                      onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                      placeholder="Your API key for authentication"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={registerService.isPending}
                  >
                    {registerService.isPending ? 'Registering...' : 'Register Service'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}