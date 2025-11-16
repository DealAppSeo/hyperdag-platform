import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

import { MarketplaceExplainer } from '@/components/marketplace/marketplace-explainer';
import { ApprovedServicesList } from '@/components/marketplace/approved-services-list';
import { ExpandedServicesList } from '@/components/marketplace/expanded-services-list';
import { 
  Cloud, 
  Cpu, 
  Database, 
  Brain, 
  Fuel, 
  Shield, 
  Globe, 
  Users,
  Star,
  Clock,
  DollarSign,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Zap
} from 'lucide-react';

interface ServiceOffering {
  id: string;
  title: string;
  description: string;
  category: 'compute' | 'storage' | 'ai' | 'gas' | 'security' | 'network';
  provider: {
    id: string;
    name: string;
    reputation: number;
    verified: boolean;
  };
  pricing: {
    type: 'fixed' | 'hourly' | 'usage' | 'subscription';
    amount: number;
    currency: 'USD' | 'ETH' | 'HDAG';
    unit?: string;
  };
  requirements: string[];
  availability: 'high' | 'medium' | 'low';
  performanceMetrics: {
    uptime: number;
    responseTime: number;
    throughput: number;
  };
  tags: string[];
  createdAt: string;
  isApproved: boolean;
  totalOrders: number;
  averageRating: number;
}

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  category: 'compute' | 'storage' | 'ai' | 'gas' | 'security' | 'network';
  requester: {
    id: string;
    name: string;
    reputation: number;
  };
  budget: {
    min: number;
    max: number;
    currency: 'USD' | 'ETH' | 'HDAG';
  };
  deadline: string;
  requirements: string[];
  tags: string[];
  createdAt: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  proposalCount: number;
}

const categoryIcons = {
  compute: Cpu,
  storage: Database,
  ai: Brain,
  gas: Fuel,
  security: Shield,
  network: Globe
};

const categoryColors = {
  compute: 'bg-blue-100 text-blue-800',
  storage: 'bg-green-100 text-green-800',
  ai: 'bg-purple-100 text-purple-800',
  gas: 'bg-orange-100 text-orange-800',
  security: 'bg-red-100 text-red-800',
  network: 'bg-indigo-100 text-indigo-800'
};

export default function ServiceMarketplace() {
  const [activeTab, setActiveTab] = useState('approved');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState('rating');
  const [showCreateServiceDialog, setShowCreateServiceDialog] = useState(false);
  const [showCreateRequestDialog, setShowCreateRequestDialog] = useState(false);
  const [showWalletDialog, setShowWalletDialog] = useState(false);
  const [showProposalDialog, setShowProposalDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const { toast } = useToast();

  // Check wallet connection and SBT status
  const { data: walletStatus } = useQuery({
    queryKey: ['/api/user/wallet-status'],
    queryFn: () => apiRequest('GET', '/api/user/wallet-status').then(res => res.json())
  });

  const isWalletConnected = walletStatus?.walletConnected || false;
  const hasSBT = walletStatus?.hasSBT || false;
  const canParticipate = isWalletConnected && hasSBT;

  // Fetch service offerings
  const { data: serviceOfferings = [], isLoading: loadingOfferings } = useQuery({
    queryKey: ['/api/marketplace/services', selectedCategory, sortBy, searchQuery],
    queryFn: () => apiRequest('GET', `/api/marketplace/services?category=${selectedCategory}&sort=${sortBy}&search=${searchQuery}`).then(res => res.json())
  });

  // Fetch service requests
  const { data: serviceRequests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['/api/marketplace/requests', selectedCategory, searchQuery],
    queryFn: () => apiRequest('GET', `/api/marketplace/requests?category=${selectedCategory}&search=${searchQuery}`).then(res => res.json())
  });

  // Create service offering mutation
  const createServiceMutation = useMutation({
    mutationFn: (serviceData: any) => apiRequest('POST', '/api/marketplace/services', serviceData),
    onSuccess: () => {
      toast({
        title: "Service Created",
        description: "Your service offering has been submitted for approval"
      });
      setShowCreateServiceDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Create service request mutation
  const createRequestMutation = useMutation({
    mutationFn: (requestData: any) => apiRequest('POST', '/api/marketplace/requests', requestData),
    onSuccess: () => {
      toast({
        title: "Request Created",
        description: "Your service request has been posted"
      });
      setShowCreateRequestDialog(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Submit proposal mutation
  const submitProposalMutation = useMutation({
    mutationFn: (proposalData: any) => apiRequest('POST', `/api/marketplace/proposals/${selectedRequest?.id}`, proposalData),
    onSuccess: () => {
      toast({
        title: "Proposal Submitted",
        description: "Your proposal has been submitted successfully"
      });
      setShowProposalDialog(false);
      setSelectedRequest(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handle wallet connection requirement
  const handleWalletRequiredAction = (action: string) => {
    if (!canParticipate) {
      setShowWalletDialog(true);
      return false;
    }
    return true;
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!handleWalletRequiredAction('create-service')) {
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);
    const serviceData = {
      title: formData.get('title'),
      description: formData.get('description'),
      category: formData.get('category'),
      pricing: {
        type: formData.get('pricingType'),
        amount: parseFloat(formData.get('amount') as string),
        currency: formData.get('currency'),
        unit: formData.get('unit')
      },
      requirements: (formData.get('requirements') as string)?.split('\n').filter(Boolean) || [],
      tags: (formData.get('tags') as string)?.split(',').map(tag => tag.trim()).filter(Boolean) || []
    };
    createServiceMutation.mutate(serviceData);
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!handleWalletRequiredAction('create-request')) {
      return;
    }

    const formData = new FormData(e.target as HTMLFormElement);
    const requestData = {
      title: formData.get('title'),
      description: formData.get('description'),
      category: formData.get('category'),
      budget: {
        min: parseFloat(formData.get('minBudget') as string),
        max: parseFloat(formData.get('maxBudget') as string),
        currency: formData.get('currency')
      },
      deadline: formData.get('deadline'),
      requirements: (formData.get('requirements') as string)?.split('\n').filter(Boolean) || [],
      tags: (formData.get('tags') as string)?.split(',').map(tag => tag.trim()).filter(Boolean) || []
    };
    createRequestMutation.mutate(requestData);
  };

  const handleSubmitProposal = (request: ServiceRequest) => {
    if (!handleWalletRequiredAction('submit-proposal')) {
      return;
    }
    setSelectedRequest(request);
    setShowProposalDialog(true);
  };

  const handleProposalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formData = new FormData(e.target as HTMLFormElement);
    const proposalData = {
      solution: formData.get('solution'),
      timeline: formData.get('timeline'),
      budget: parseFloat(formData.get('budget') as string),
      additionalInfo: formData.get('additionalInfo')
    };
    submitProposalMutation.mutate(proposalData);
  };

  const ServiceCard = ({ service }: { service: ServiceOffering }) => {
    const CategoryIcon = categoryIcons[service.category];
    
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <CategoryIcon className="h-5 w-5 text-muted-foreground" />
              <Badge className={categoryColors[service.category]}>
                {service.category}
              </Badge>
              {service.provider.verified && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{service.averageRating.toFixed(1)}</span>
            </div>
          </div>
          <CardTitle className="text-lg">{service.title}</CardTitle>
          <CardDescription>{service.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Provider</p>
                <p className="font-medium">{service.provider.name}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="font-bold text-lg">
                  {service.pricing.amount} {service.pricing.currency}
                  {service.pricing.unit && `/${service.pricing.unit}`}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Uptime</p>
                <p className="font-medium">{service.performanceMetrics.uptime}%</p>
              </div>
              <div>
                <p className="text-muted-foreground">Response</p>
                <p className="font-medium">{service.performanceMetrics.responseTime}ms</p>
              </div>
              <div>
                <p className="text-muted-foreground">Orders</p>
                <p className="font-medium">{service.totalOrders}</p>
              </div>
            </div>

            {service.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {service.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex space-x-2">
              <Button className="flex-1">
                <Zap className="h-4 w-4 mr-2" />
                Order Service
              </Button>
              <Button variant="outline">
                View Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const RequestCard = ({ request }: { request: ServiceRequest }) => {
    const CategoryIcon = categoryIcons[request.category];
    
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <CategoryIcon className="h-5 w-5 text-muted-foreground" />
              <Badge className={categoryColors[request.category]}>
                {request.category}
              </Badge>
              <Badge variant={request.status === 'open' ? 'default' : 'secondary'}>
                {request.status}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {request.proposalCount} proposals
            </div>
          </div>
          <CardTitle className="text-lg">{request.title}</CardTitle>
          <CardDescription>{request.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Budget</p>
                <p className="font-medium">
                  {request.budget.min} - {request.budget.max} {request.budget.currency}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Deadline</p>
                <p className="font-medium">
                  {new Date(request.deadline).toLocaleDateString()}
                </p>
              </div>
            </div>

            {request.requirements.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Requirements</p>
                <ul className="text-sm space-y-1">
                  {request.requirements.slice(0, 3).map((req, index) => (
                    <li key={index} className="flex items-center">
                      <CheckCircle className="h-3 w-3 mr-2 text-green-500" />
                      {req}
                    </li>
                  ))}
                  {request.requirements.length > 3 && (
                    <li className="text-muted-foreground">
                      +{request.requirements.length - 3} more requirements
                    </li>
                  )}
                </ul>
              </div>
            )}

            {request.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {request.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex space-x-2">
              <Button 
                className="flex-1"
                onClick={() => handleSubmitProposal(request)}
                disabled={request.status !== 'open'}
              >
                Submit Proposal
              </Button>
              <Button variant="outline">
                View Details
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="container max-w-7xl py-6 space-y-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Service Marketplace</h1>
            <p className="text-muted-foreground">
              Discover and offer decentralized services for compute, storage, AI processing, and more
            </p>
          </div>
          <MarketplaceExplainer />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="approved">Service Marketplace</TabsTrigger>
            <TabsTrigger value="requests">Service Requests</TabsTrigger>
            <TabsTrigger value="my-services">My Services</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="approved" className="space-y-6">
            <ExpandedServicesList />
          </TabsContent>

          <TabsContent value="browse" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="compute">Compute</SelectItem>
                  <SelectItem value="storage">Storage</SelectItem>
                  <SelectItem value="ai">AI Processing</SelectItem>
                  <SelectItem value="gas">Gas Optimization</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="network">Network</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="popular">Most Popular</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={showCreateServiceDialog} onOpenChange={setShowCreateServiceDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Offer Service
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Service Offering</DialogTitle>
                    <DialogDescription>
                      List your service in the marketplace for others to discover and purchase
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateService} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Service Title</Label>
                        <Input name="title" placeholder="e.g., High-Performance GPU Computing" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select name="category" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="compute">Compute</SelectItem>
                            <SelectItem value="storage">Storage</SelectItem>
                            <SelectItem value="ai">AI Processing</SelectItem>
                            <SelectItem value="gas">Gas Optimization</SelectItem>
                            <SelectItem value="security">Security</SelectItem>
                            <SelectItem value="network">Network</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea name="description" placeholder="Describe your service offering..." required />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="pricingType">Pricing Type</Label>
                        <Select name="pricingType" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed Price</SelectItem>
                            <SelectItem value="hourly">Per Hour</SelectItem>
                            <SelectItem value="usage">Per Usage</SelectItem>
                            <SelectItem value="subscription">Subscription</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="amount">Amount</Label>
                        <Input name="amount" type="number" step="0.01" placeholder="0.00" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select name="currency" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="ETH">ETH</SelectItem>
                            <SelectItem value="HDAG">HDAG</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="requirements">Requirements (one per line)</Label>
                      <Textarea name="requirements" placeholder="API access&#10;Minimum order quantity&#10;Technical specifications" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input name="tags" placeholder="gpu, machine learning, high-performance" />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setShowCreateServiceDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createServiceMutation.isPending}>
                        {createServiceMutation.isPending ? 'Creating...' : 'Create Service'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {loadingOfferings ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {serviceOfferings.map((service: ServiceOffering) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search requests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="compute">Compute</SelectItem>
                  <SelectItem value="storage">Storage</SelectItem>
                  <SelectItem value="ai">AI Processing</SelectItem>
                  <SelectItem value="gas">Gas Optimization</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="network">Network</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={showCreateRequestDialog} onOpenChange={setShowCreateRequestDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Post Request
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Service Request</DialogTitle>
                    <DialogDescription>
                      Post a request for services you need and receive proposals from providers
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateRequest} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Request Title</Label>
                        <Input name="title" placeholder="e.g., Need AI Model Training" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select name="category" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="compute">Compute</SelectItem>
                            <SelectItem value="storage">Storage</SelectItem>
                            <SelectItem value="ai">AI Processing</SelectItem>
                            <SelectItem value="gas">Gas Optimization</SelectItem>
                            <SelectItem value="security">Security</SelectItem>
                            <SelectItem value="network">Network</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea name="description" placeholder="Describe what you need..." required />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="minBudget">Min Budget</Label>
                        <Input name="minBudget" type="number" step="0.01" placeholder="0.00" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxBudget">Max Budget</Label>
                        <Input name="maxBudget" type="number" step="0.01" placeholder="0.00" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select name="currency" required>
                          <SelectTrigger>
                            <SelectValue placeholder="Currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="ETH">ETH</SelectItem>
                            <SelectItem value="HDAG">HDAG</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deadline">Deadline</Label>
                      <Input name="deadline" type="date" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="requirements">Requirements (one per line)</Label>
                      <Textarea name="requirements" placeholder="GPU with 16GB+ VRAM&#10;Experience with PyTorch&#10;Weekly progress updates" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tags">Tags (comma-separated)</Label>
                      <Input name="tags" placeholder="machine learning, training, pytorch" />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setShowCreateRequestDialog(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createRequestMutation.isPending}>
                        {createRequestMutation.isPending ? 'Creating...' : 'Create Request'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {loadingRequests ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {serviceRequests.map((request: ServiceRequest) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-services" className="space-y-6">
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Your Services</h3>
              <p className="text-muted-foreground mb-4">
                Manage your service offerings and track performance
              </p>
              <Button onClick={() => setShowCreateServiceDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Service
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Services</CardTitle>
                  <Cloud className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1,234</div>
                  <p className="text-xs text-muted-foreground">
                    +12% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">456</div>
                  <p className="text-xs text-muted-foreground">
                    +8% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Volume</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">$89.5K</div>
                  <p className="text-xs text-muted-foreground">
                    +23% from last month
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4.8</div>
                  <p className="text-xs text-muted-foreground">
                    +0.2 from last month
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Popular Categories</CardTitle>
                <CardDescription>Service distribution across categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(categoryIcons).map(([category, Icon]) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Icon className="h-4 w-4" />
                        <span className="capitalize">{category}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <Progress value={Math.random() * 100} className="w-32" />
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {Math.floor(Math.random() * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Wallet Authentication Requirements Dialog */}
        <Dialog open={showWalletDialog} onOpenChange={setShowWalletDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-500" />
                Web3 Authentication Required
              </DialogTitle>
              <DialogDescription>
                To participate in the Decentralized AI Marketplace, you need to complete the following steps:
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  isWalletConnected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {isWalletConnected ? '✓' : '1'}
                </div>
                <div>
                  <p className="font-medium">Connect Your Web3 Wallet</p>
                  <p className="text-sm text-muted-foreground">
                    Connect MetaMask or another Web3 wallet to authenticate your identity
                  </p>
                  {!isWalletConnected && (
                    <Button size="sm" className="mt-2">
                      Connect Wallet
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  hasSBT ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {hasSBT ? '✓' : '2'}
                </div>
                <div>
                  <p className="font-medium">Create Your Soulbound Token (SBT)</p>
                  <p className="text-sm text-muted-foreground">
                    Generate your identity token to establish reputation and trust in the marketplace
                  </p>
                  {isWalletConnected && !hasSBT && (
                    <Button size="sm" className="mt-2" variant="outline">
                      Create SBT
                    </Button>
                  )}
                </div>
              </div>

              {canParticipate && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-sm font-medium text-green-800">
                      You're ready to participate in the marketplace!
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowWalletDialog(false)}>
                Close
              </Button>
              {!canParticipate && (
                <Button>
                  Get Started
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Proposal Submission Dialog */}
        <Dialog open={showProposalDialog} onOpenChange={setShowProposalDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Submit Proposal</DialogTitle>
              <DialogDescription>
                Submit your proposal for: {selectedRequest?.title}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleProposalSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="solution">Solution Description *</Label>
                  <Textarea
                    id="solution"
                    name="solution"
                    placeholder="Describe your approach to solving this request..."
                    className="min-h-[120px]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timeline">Timeline (days) *</Label>
                    <Input
                      id="timeline"
                      name="timeline"
                      type="number"
                      placeholder="14"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="budget">Your Price ({selectedRequest?.budget.currency}) *</Label>
                    <Input
                      id="budget"
                      name="budget"
                      type="number"
                      step="0.01"
                      placeholder="1000"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="additionalInfo">Additional Information</Label>
                  <Textarea
                    id="additionalInfo"
                    name="additionalInfo"
                    placeholder="Any additional details, experience, or questions..."
                    className="min-h-[80px]"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowProposalDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitProposalMutation.isPending}>
                  {submitProposalMutation.isPending ? 'Submitting...' : 'Submit Proposal'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
  );
}