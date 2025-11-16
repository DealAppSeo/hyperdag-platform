import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Play, Code, BookOpen, Zap, Shield, Network } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EndpointDoc {
  method: string;
  path: string;
  description: string;
  category: string;
  parameters?: any;
  example: any;
  response: any;
}

const apiEndpoints: EndpointDoc[] = [
  {
    method: 'POST',
    path: '/api/web3-ai/anfis/query',
    description: 'Intelligent AI routing with ANFIS fuzzy logic provider selection',
    category: 'AI Services',
    parameters: {
      prompt: { type: 'string', required: true, description: 'The question or prompt to process' },
      context: { type: 'string', required: false, description: 'Additional context for the query' },
      provider: { type: 'enum', required: false, options: ['openai', 'anthropic', 'perplexity', 'cohere'] },
      priority: { type: 'enum', required: false, options: ['speed', 'accuracy', 'creativity', 'analysis'], default: 'accuracy' }
    },
    example: {
      prompt: "Analyze smart contract security vulnerabilities",
      priority: "accuracy"
    },
    response: {
      success: true,
      data: {
        answer: "Smart contract security analysis...",
        provider: "anthropic",
        confidence: 0.92,
        reasoning: "Selected for security analysis expertise"
      }
    }
  },
  {
    method: 'GET',
    path: '/api/web3-ai/providers',
    description: 'List available AI providers and their capabilities',
    category: 'AI Services',
    example: {},
    response: {
      success: true,
      data: [
        {
          id: 'openai',
          name: 'OpenAI GPT-4o',
          status: 'active',
          strengths: ['general', 'coding', 'analysis']
        }
      ]
    }
  },
  {
    method: 'POST',
    path: '/api/web3-ai/blockchain/deploy',
    description: 'Deploy smart contracts across multiple blockchain networks',
    category: 'Blockchain',
    parameters: {
      network: { type: 'enum', required: true, options: ['polygon', 'solana', 'iota', 'stellar'] },
      contract_type: { type: 'enum', required: true, options: ['token', 'nft', 'dao', 'defi'] },
      parameters: { type: 'object', required: true }
    },
    example: {
      network: "polygon",
      contract_type: "token",
      parameters: {
        name: "MyToken",
        symbol: "MTK",
        supply: 1000000
      }
    },
    response: {
      success: true,
      data: {
        transaction_hash: "0x...",
        contract_address: "0x...",
        network: "polygon",
        status: "confirmed"
      }
    }
  },
  {
    method: 'POST',
    path: '/api/web3-ai/zkp/prove',
    description: 'Generate zero-knowledge proofs for privacy-preserving verification',
    category: 'Zero-Knowledge',
    parameters: {
      circuit: { type: 'enum', required: true, options: ['identity', 'reputation', 'credential', 'membership'] },
      private_inputs: { type: 'object', required: true },
      public_inputs: { type: 'object', required: false }
    },
    example: {
      circuit: "identity",
      private_inputs: {
        secret: "user_private_key",
        age: 25
      },
      public_inputs: {
        min_age: 18
      }
    },
    response: {
      success: true,
      data: {
        proof_id: "zkp_abc123",
        proof: "0x...",
        verification_key: "vk_xyz789"
      }
    }
  },
  {
    method: 'GET',
    path: '/api/web3-ai/marketplace/services',
    description: 'Browse available developer services with pricing',
    category: 'Marketplace',
    example: {},
    response: {
      success: true,
      data: {
        services: [
          {
            id: 1,
            serviceName: "Fast AI Processing",
            serviceType: "ai",
            pricePerCall: "0.005",
            qualityRating: "4.8",
            developer: { username: "ai_expert" }
          }
        ],
        totalCount: 1,
        sortedBy: "price"
      }
    }
  },
  {
    method: 'POST',
    path: '/api/web3-ai/marketplace/register',
    description: 'Register a new service in the developer marketplace',
    category: 'Marketplace',
    example: {
      serviceName: "Custom AI Analysis",
      serviceType: "ai",
      description: "High-performance AI processing with custom models",
      pricePerCall: "0.002",
      priceModel: "per_call"
    },
    response: {
      success: true,
      data: {
        id: 2,
        serviceName: "Custom AI Analysis",
        isActive: true
      }
    }
  }
];

const categoryIcons: Record<string, React.ReactElement> = {
  'AI Services': <Zap className="h-4 w-4" />,
  'Blockchain': <Network className="h-4 w-4" />,
  'Zero-Knowledge': <Shield className="h-4 w-4" />,
  'Revenue': <Code className="h-4 w-4" />
};

const methodColors: Record<string, string> = {
  'GET': 'bg-green-100 text-green-800',
  'POST': 'bg-blue-100 text-blue-800',
  'PUT': 'bg-orange-100 text-orange-800',
  'DELETE': 'bg-red-100 text-red-800'
};

export default function GitHubStyleAPIDocs() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointDoc>(apiEndpoints[0]);
  const [testRequest, setTestRequest] = useState('{}');
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Code snippet copied successfully"
    });
  };

  const categories = Array.from(new Set(apiEndpoints.map(e => e.category)));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center">
            <BookOpen className="mr-3 h-8 w-8 text-blue-600" />
            HyperDAG API Documentation
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            GitHub-style unified API for AI, blockchain, and zero-knowledge services with revenue sharing
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-green-50">v1.0 Stable</Badge>
            <Badge variant="outline" className="bg-blue-50">OpenAPI 3.0</Badge>
            <Badge variant="outline" className="bg-purple-50">15% Revenue Share</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">API Reference</CardTitle>
                <CardDescription>
                  Browse endpoints by category
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="space-y-1">
                  {categories.map(category => (
                    <div key={category} className="p-3 border-b last:border-b-0">
                      <h3 className="font-medium flex items-center mb-2">
                        {categoryIcons[category] || <Code className="h-4 w-4" />}
                        <span className="ml-2">{category}</span>
                      </h3>
                      <div className="space-y-1 ml-6">
                        {apiEndpoints
                          .filter(endpoint => endpoint.category === category)
                          .map((endpoint, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedEndpoint(endpoint)}
                              className={`w-full text-left p-2 rounded text-sm hover:bg-gray-100 ${
                                selectedEndpoint.path === endpoint.path ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${methodColors[endpoint.method] || 'bg-gray-100 text-gray-800'}`}
                                >
                                  {endpoint.method}
                                </Badge>
                              </div>
                              <div className="mt-1 font-mono text-xs text-gray-600">
                                {endpoint.path}
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Start */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Quick Start</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">API Key</label>
                  <Input
                    placeholder="hd_sk_..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="text-xs text-gray-600">
                  Get your API key from the developer dashboard
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={methodColors[selectedEndpoint.method] || 'bg-gray-100 text-gray-800'}>
                        {selectedEndpoint.method}
                      </Badge>
                      <code className="text-lg font-mono">{selectedEndpoint.path}</code>
                    </div>
                    <CardDescription>{selectedEndpoint.description}</CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(selectedEndpoint.path)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="parameters" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="parameters">Parameters</TabsTrigger>
                    <TabsTrigger value="example">Example</TabsTrigger>
                    <TabsTrigger value="response">Response</TabsTrigger>
                    <TabsTrigger value="test">Test API</TabsTrigger>
                  </TabsList>

                  <TabsContent value="parameters" className="space-y-4">
                    <h3 className="font-medium">Request Parameters</h3>
                    {selectedEndpoint.parameters ? (
                      <div className="space-y-3">
                        {Object.entries(selectedEndpoint.parameters).map(([key, param]: [string, any]) => (
                          <div key={key} className="border rounded p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <code className="font-mono text-sm">{key}</code>
                              <Badge variant={param.required ? "destructive" : "secondary"} className="text-xs">
                                {param.required ? 'required' : 'optional'}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {param.type}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{param.description}</p>
                            {param.options && (
                              <div className="mt-2">
                                <span className="text-xs text-gray-500">Options: </span>
                                <code className="text-xs">{param.options.join(', ')}</code>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No parameters required</p>
                    )}
                  </TabsContent>

                  <TabsContent value="example">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Request Example</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify(selectedEndpoint.example, null, 2))}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                        <code>{JSON.stringify(selectedEndpoint.example, null, 2)}</code>
                      </pre>
                    </div>
                  </TabsContent>

                  <TabsContent value="response">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">Response Example</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(JSON.stringify(selectedEndpoint.response, null, 2))}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                        <code>{JSON.stringify(selectedEndpoint.response, null, 2)}</code>
                      </pre>
                    </div>
                  </TabsContent>

                  <TabsContent value="test" className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Test Request</h3>
                      <Textarea
                        placeholder="Enter JSON request body..."
                        value={testRequest}
                        onChange={(e) => setTestRequest(e.target.value)}
                        className="font-mono text-sm"
                        rows={8}
                      />
                    </div>
                    <Button className="w-full" disabled={!apiKey}>
                      <Play className="h-4 w-4 mr-2" />
                      Send Request
                    </Button>
                    {!apiKey && (
                      <p className="text-sm text-gray-500 text-center">
                        Enter your API key to test endpoints
                      </p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Authentication Info */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Authentication & Rate Limits</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded">
                    <div className="font-semibold text-blue-900">Standard</div>
                    <div className="text-2xl font-bold text-blue-700">100</div>
                    <div className="text-sm text-blue-600">requests/hour</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded">
                    <div className="font-semibold text-purple-900">Revenue Share</div>
                    <div className="text-2xl font-bold text-purple-700">15%</div>
                    <div className="text-sm text-purple-600">of API usage</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded">
                    <div className="font-semibold text-green-900">Min Payout</div>
                    <div className="text-2xl font-bold text-green-700">$50</div>
                    <div className="text-sm text-green-600">monthly minimum</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded">
                  <h4 className="font-medium mb-2">Authentication Header</h4>
                  <code className="text-sm bg-white p-2 rounded block">
                    Authorization: Bearer hd_sk_your_api_key_here
                  </code>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}