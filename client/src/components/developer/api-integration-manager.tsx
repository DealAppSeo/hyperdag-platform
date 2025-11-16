import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { InfoIcon, DownloadIcon, CodeIcon, BracesIcon, Server, Database, MessageSquare, Lock, Key, Cloud, Zap, Brain, Code, Download, Copy, TerminalSquare, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Type definitions for API services
interface ApiService {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'ai' | 'web3' | 'blockchain' | 'privacy' | 'compute' | 'messaging';
  status: 'active' | 'beta' | 'coming_soon';
  documentation: string;
  enabled: boolean;
  requiresKey: boolean;
}

interface ApiCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: React.ReactNode;
}

const apiCategories: ApiCategory[] = [
  {
    id: 'ai',
    name: 'AI Services',
    description: 'Artificial Intelligence and machine learning capabilities',
    color: 'bg-purple-500',
    icon: <Brain className="h-4 w-4" />
  },
  {
    id: 'web3',
    name: 'Web3 Services',
    description: 'Decentralized web and blockchain integrations',
    color: 'bg-blue-500',
    icon: <BracesIcon className="h-4 w-4" />
  },
  {
    id: 'blockchain',
    name: 'Blockchain',
    description: 'Native blockchain services and capabilities',
    color: 'bg-green-500',
    icon: <Database className="h-4 w-4" />
  },
  {
    id: 'privacy',
    name: 'Privacy & Identity',
    description: 'Zero-Knowledge Proofs and privacy-preserving tools',
    color: 'bg-red-500',
    icon: <Lock className="h-4 w-4" />
  },
  {
    id: 'compute',
    name: 'Distributed Compute',
    description: 'Decentralized computing resources',
    color: 'bg-yellow-500',
    icon: <Server className="h-4 w-4" />
  },
  {
    id: 'messaging',
    name: 'Messaging',
    description: 'Communication channels and notification services',
    color: 'bg-teal-500',
    icon: <MessageSquare className="h-4 w-4" />
  }
];

// List of available API services
const apiServices: ApiService[] = [
  {
    id: 'openai',
    name: 'OpenAI Integration',
    description: 'Connect to OpenAI services for AI capabilities including text generation and embedding',
    icon: <Brain className="h-5 w-5 text-green-500" />,
    category: 'ai',
    status: 'active',
    documentation: 'https://hyperdag.io/docs/api/openai',
    enabled: false,
    requiresKey: true
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Access Anthropic Claude models for advanced conversational AI and content generation',
    icon: <Brain className="h-5 w-5 text-purple-500" />,
    category: 'ai',
    status: 'beta',
    documentation: 'https://hyperdag.io/docs/api/anthropic',
    enabled: false,
    requiresKey: true
  },
  {
    id: 'perplexity',
    name: 'Perplexity API',
    description: 'Leverage Perplexity for online AI search and knowledge capabilities',
    icon: <Brain className="h-5 w-5 text-blue-500" />,
    category: 'ai',
    status: 'coming_soon',
    documentation: 'https://hyperdag.io/docs/api/perplexity',
    enabled: false,
    requiresKey: true
  },
  {
    id: 'moralis',
    name: 'Moralis',
    description: 'Web3 API suite for blockchain data, authentication, and token information',
    icon: <Database className="h-5 w-5 text-blue-500" />,
    category: 'web3',
    status: 'active',
    documentation: 'https://hyperdag.io/docs/api/moralis',
    enabled: false,
    requiresKey: true
  },
  {
    id: 'polygon-cdk',
    name: 'Polygon CDK',
    description: 'Build custom Layer 2 blockchains on Ethereum with Polygon CDK',
    icon: <Database className="h-5 w-5 text-purple-500" />,
    category: 'blockchain',
    status: 'beta',
    documentation: 'https://hyperdag.io/docs/api/polygon-cdk',
    enabled: false,
    requiresKey: false
  },
  {
    id: 'bacalhau',
    name: 'Bacalhau Compute',
    description: 'Decentralized compute framework for running containerized jobs',
    icon: <Server className="h-5 w-5 text-yellow-500" />,
    category: 'compute',
    status: 'beta',
    documentation: 'https://hyperdag.io/docs/api/bacalhau',
    enabled: false,
    requiresKey: true
  },
  {
    id: 'zkp',
    name: 'Zero-Knowledge Proofs',
    description: 'Create and verify zero-knowledge proofs for privacy-preserving applications',
    icon: <Lock className="h-5 w-5 text-red-500" />,
    category: 'privacy',
    status: 'active',
    documentation: 'https://hyperdag.io/docs/api/zkp',
    enabled: false,
    requiresKey: false
  },
  {
    id: 'rep-id',
    name: 'RepID System',
    description: 'Reputation identity system with granular attribute verification',
    icon: <Key className="h-5 w-5 text-amber-500" />,
    category: 'privacy',
    status: 'active',
    documentation: 'https://hyperdag.io/docs/api/rep-id',
    enabled: false,
    requiresKey: false
  },
  {
    id: 'sms-service',
    name: 'SMS Service',
    description: 'Send SMS messages via Twilio integration',
    icon: <MessageSquare className="h-5 w-5 text-teal-500" />,
    category: 'messaging',
    status: 'active',
    documentation: 'https://hyperdag.io/docs/api/sms',
    enabled: false,
    requiresKey: true
  },
  {
    id: 'telegram-bot',
    name: 'Telegram Bot API',
    description: 'Create and manage Telegram bots for user interactions',
    icon: <MessageSquare className="h-5 w-5 text-blue-500" />,
    category: 'messaging',
    status: 'active',
    documentation: 'https://hyperdag.io/docs/api/telegram',
    enabled: false,
    requiresKey: true
  },
  {
    id: 'email-service',
    name: 'Email Service',
    description: 'Send transactional and marketing emails via SendGrid',
    icon: <MessageSquare className="h-5 w-5 text-green-500" />,
    category: 'messaging',
    status: 'active',
    documentation: 'https://hyperdag.io/docs/api/email',
    enabled: false,
    requiresKey: true
  }
];

export function ApiIntegrationManager() {
  const { toast } = useToast();
  const [services, setServices] = useState<ApiService[]>(apiServices);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('available');
  const [sdkFormat, setSdkFormat] = useState<string>('npm');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState<boolean>(false);
  const [currentApiService, setCurrentApiService] = useState<ApiService | null>(null);
  const [apiKey, setApiKey] = useState<string>('');

  // Filter services based on category and search query
  const filteredServices = services.filter(service => {
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'available' ? !service.enabled : service.enabled;
    
    return matchesCategory && matchesSearch && matchesTab;
  });

  // Handle toggling a service on/off
  const toggleService = (serviceId: string) => {
    const service = services.find(s => s.id === serviceId);
    
    if (service?.requiresKey && !service.enabled) {
      // If service requires an API key and is being enabled, show the dialog
      setCurrentApiService(service);
      setShowApiKeyDialog(true);
      return;
    }
    
    setServices(prev => 
      prev.map(service => 
        service.id === serviceId 
          ? { ...service, enabled: !service.enabled } 
          : service
      )
    );

    toast({
      title: `API ${service?.enabled ? 'Disabled' : 'Enabled'}`,
      description: `${service?.name} has been ${service?.enabled ? 'disabled' : 'enabled'} for your project.`,
      variant: service?.enabled ? 'default' : 'default',
    });
  };

  // Handle adding service to selection
  const toggleServiceSelection = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  // Submit API key
  const handleApiKeySubmit = () => {
    if (!currentApiService || !apiKey.trim()) return;
    
    // In a real app, you would send this to the server
    console.log(`API Key submitted for ${currentApiService.name}:`, apiKey);
    
    // Enable the service
    setServices(prev => 
      prev.map(service => 
        service.id === currentApiService.id 
          ? { ...service, enabled: true } 
          : service
      )
    );
    
    toast({
      title: 'API Key Added',
      description: `${currentApiService.name} has been enabled with your API key.`,
      variant: 'default',
    });
    
    // Reset state
    setShowApiKeyDialog(false);
    setCurrentApiService(null);
    setApiKey('');
  };

  // Generate SDK code
  const generateSdkCode = () => {
    if (selectedServices.length === 0) return '';
    
    const selectedServiceObjects = services.filter(service => selectedServices.includes(service.id));
    
    if (sdkFormat === 'npm') {
      return `npm install @hyperdag/sdk @hyperdag/api-${selectedServiceObjects.map(s => s.id).join(' @hyperdag/api-')}`;
    } else if (sdkFormat === 'yarn') {
      return `yarn add @hyperdag/sdk @hyperdag/api-${selectedServiceObjects.map(s => s.id).join(' @hyperdag/api-')}`;
    } else if (sdkFormat === 'pnpm') {
      return `pnpm add @hyperdag/sdk @hyperdag/api-${selectedServiceObjects.map(s => s.id).join(' @hyperdag/api-')}`;
    } else {
      // JavaScript usage example
      return `// Import the HyperDAG SDK
import HyperDAG from '@hyperdag/sdk';
${selectedServiceObjects.map(s => `import ${s.id.charAt(0).toUpperCase() + s.id.slice(1).replace(/-/g, '')} from '@hyperdag/api-${s.id}';`).join('\n')}

// Initialize the SDK
const hyperdag = new HyperDAG({
  apiKey: 'YOUR_HYPERDAG_API_KEY',
  services: [
${selectedServiceObjects.map(s => `    new ${s.id.charAt(0).toUpperCase() + s.id.slice(1).replace(/-/g, '')}({
      ${s.requiresKey ? `apiKey: 'YOUR_${s.id.toUpperCase()}_API_KEY',` : ''}
    }),`).join('\n')}
  ]
});

// Now you can use the services
// Example usage:
// const result = await hyperdag.services.${selectedServiceObjects[0]?.id}.someMethod();`;
    }
  };

  // Copy SDK code to clipboard
  const copySdkCode = () => {
    const code = generateSdkCode();
    navigator.clipboard.writeText(code);
    
    toast({
      title: 'Copied to Clipboard',
      description: 'The SDK installation code has been copied to your clipboard.',
      variant: 'default',
    });
  };

  // Download SDK package
  const downloadSdk = () => {
    if (selectedServices.length === 0) return;
    
    toast({
      title: 'Download Started',
      description: 'Your custom SDK package is being prepared for download.',
      variant: 'default',
    });
    
    // Create a query string with selected services
    const servicesParam = selectedServices.join(',');
    const downloadUrl = `/api/developer/sdk/download?services=${servicesParam}`;
    
    // Create a hidden link and click it to trigger the download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `hyperdag-sdk-${selectedServices.join('-')}.js`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Download Complete',
      description: 'Your custom SDK package has been downloaded.',
      variant: 'default',
    });
  };

  return (
    <div className="space-y-6">
      {/* API Services Selection */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">API Integration</h2>
            <p className="text-muted-foreground">Configure the APIs and services for your application</p>
          </div>
          
          {/* Search Input */}
          <div className="relative w-64">
            <Input
              type="text"
              placeholder="Search APIs..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-2 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Tabs and Filters */}
        <div className="flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
            <TabsList>
              <TabsTrigger value="available" className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <span>Available APIs</span>
              </TabsTrigger>
              <TabsTrigger value="enabled" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>Enabled APIs</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="flex gap-2">
            {apiCategories.map(category => (
              <Badge 
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(selectedCategory === category.id ? 'all' : category.id)}
              >
                <span className="flex items-center gap-1">
                  {category.icon}
                  {category.name}
                </span>
              </Badge>
            ))}
            {selectedCategory !== 'all' && (
              <Badge 
                variant="outline"
                className="cursor-pointer"
                onClick={() => setSelectedCategory('all')}
              >
                Clear Filter
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {/* Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map(service => (
          <Card key={service.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  {service.icon}
                  <CardTitle>{service.name}</CardTitle>
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Badge variant={service.status === 'active' ? 'default' : service.status === 'beta' ? 'secondary' : 'outline'}>
                          {service.status === 'active' ? 'Active' : service.status === 'beta' ? 'Beta' : 'Coming Soon'}
                        </Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{service.status === 'active' ? 'Ready for production use' : 
                          service.status === 'beta' ? 'Available for testing' : 
                          'Will be available soon'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CardDescription>{service.description}</CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Checkbox 
                    id={`select-${service.id}`} 
                    checked={selectedServices.includes(service.id)}
                    onCheckedChange={() => toggleServiceSelection(service.id)}
                    disabled={service.status === 'coming_soon'}
                  />
                  <Label htmlFor={`select-${service.id}`}>Add to SDK</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => window.open(service.documentation, '_blank')}
                        >
                          <InfoIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View documentation</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <div className="flex items-center space-x-2">
                    <Label htmlFor={`activate-${service.id}`} className="text-sm">
                      {service.enabled ? 'Enabled' : 'Disabled'}
                    </Label>
                    <Switch
                      id={`activate-${service.id}`}
                      checked={service.enabled}
                      onCheckedChange={() => toggleService(service.id)}
                      disabled={service.status === 'coming_soon'}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <Separator />
            <CardFooter className="pt-3">
              <div className="text-xs text-muted-foreground w-full flex justify-between">
                <span>Category: {apiCategories.find(c => c.id === service.category)?.name}</span>
                {service.requiresKey && (
                  <span className="flex items-center gap-1">
                    <Key className="h-3 w-3" />
                    Requires API Key
                  </span>
                )}
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {/* SDK Generation */}
      {selectedServices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CodeIcon className="h-5 w-5 text-primary" />
              SDK Integration
            </CardTitle>
            <CardDescription>
              Generate code snippets or download a custom SDK with your selected APIs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>Selected Services</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedServices([])}
                    disabled={selectedServices.length === 0}
                  >
                    Clear All
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedServices.map(serviceId => {
                    const service = services.find(s => s.id === serviceId);
                    return (
                      <Badge key={serviceId} variant="secondary" className="flex items-center gap-1">
                        {service?.icon}
                        {service?.name}
                        <button
                          onClick={() => toggleServiceSelection(serviceId)}
                          className="ml-1 rounded-full w-4 h-4 inline-flex items-center justify-center text-xs hover:bg-gray-200 dark:hover:bg-gray-700"
                        >
                          ×
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <div className="mb-2">
                  <Label>Installation Format</Label>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant={sdkFormat === 'npm' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setSdkFormat('npm')}
                  >
                    npm
                  </Button>
                  <Button 
                    variant={sdkFormat === 'yarn' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setSdkFormat('yarn')}
                  >
                    yarn
                  </Button>
                  <Button 
                    variant={sdkFormat === 'pnpm' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setSdkFormat('pnpm')}
                  >
                    pnpm
                  </Button>
                  <Button 
                    variant={sdkFormat === 'js' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setSdkFormat('js')}
                  >
                    JavaScript
                  </Button>
                </div>
              </div>
              
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>Code Snippet</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={copySdkCode}
                    disabled={selectedServices.length === 0}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Code
                  </Button>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md overflow-auto max-h-[200px]">
                  <pre className="text-sm font-mono">
                    {generateSdkCode() || 'Select at least one API to generate code'}
                  </pre>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <div className="flex justify-between w-full">
              <Button variant="outline" onClick={downloadSdk} disabled={selectedServices.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Download Custom SDK
              </Button>
              <Button variant="default" onClick={() => window.open('https://hyperdag.io/docs/sdk', '_blank')}>
                <BookOpen className="mr-2 h-4 w-4" />
                SDK Documentation
              </Button>
            </div>
            
            <div className="w-full">
              <Label className="mb-2 block">Download Language-Specific SDKs</Label>
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => {
                    window.location.href = '/api/developer/sdk/download/javascript';
                  }}
                >
                  <Download className="mr-1 h-3 w-3" />
                  JavaScript
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => {
                    window.location.href = '/api/developer/sdk/download/typescript';
                  }}
                >
                  <Download className="mr-1 h-3 w-3" />
                  TypeScript
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => {
                    window.location.href = '/api/developer/sdk/download/python';
                  }}
                >
                  <Download className="mr-1 h-3 w-3" />
                  Python
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => {
                    window.location.href = '/api/developer/sdk/download/go';
                  }}
                >
                  <Download className="mr-1 h-3 w-3" />
                  Go
                </Button>
              </div>
            </div>
          </CardFooter>
        </Card>
      )}
      
      {/* API Key Dialog */}
      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Required</DialogTitle>
            <DialogDescription>
              {currentApiService?.name} requires an API key to function. Please enter your API key below.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                placeholder={`Enter your ${currentApiService?.name} API key`}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>Don't have an API key?</p>
              <a
                href={`https://hyperdag.io/docs/api/${currentApiService?.id}/get-started`}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                Learn how to get an API key for {currentApiService?.name}
              </a>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApiKeyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleApiKeySubmit} disabled={!apiKey.trim()}>
              Add API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
