import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, ExternalLink, Shield, Fingerprint, Key, Users, Code, CheckCircle, AlertTriangle, Download } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Sidebar from "@/components/layout/sidebar";

interface SDKFeature {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  enabled: boolean;
  dependencies?: string[];
  pricing: 'free' | 'premium';
  usage: {
    monthly: number;
    limit: number;
  };
}

interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  parameters: any[];
  response: any;
}

const SDK_FEATURES: SDKFeature[] = [
  {
    id: 'sbt',
    name: 'Soulbound Tokens (SBT)',
    description: 'Non-transferable reputation tokens that represent verified achievements and identity',
    icon: <Shield className="h-5 w-5" />,
    category: 'Identity & Reputation',
    enabled: false,
    pricing: 'free',
    usage: { monthly: 0, limit: 1000 }
  },
  {
    id: '4fa-pol',
    name: '4-Factor Authentication + POL',
    description: 'Advanced 4-factor authentication with Proof of Life biometric verification',
    icon: <Fingerprint className="h-5 w-5" />,
    category: 'Security & Authentication',
    enabled: false,
    dependencies: ['biometric-verification'],
    pricing: 'premium',
    usage: { monthly: 0, limit: 500 }
  },
  {
    id: 'zkp-verification',
    name: 'Zero-Knowledge Proofs',
    description: 'Privacy-preserving verification and authentication using ZK proofs',
    icon: <Key className="h-5 w-5" />,
    category: 'Privacy & Verification',
    enabled: false,
    pricing: 'free',
    usage: { monthly: 0, limit: 2000 }
  },
  {
    id: 'reputation-scoring',
    name: 'Cross-Chain Reputation',
    description: 'Aggregate and track reputation scores across multiple blockchain networks',
    icon: <Users className="h-5 w-5" />,
    category: 'Identity & Reputation',
    enabled: false,
    dependencies: ['sbt'],
    pricing: 'free',
    usage: { monthly: 0, limit: 5000 }
  },
  {
    id: 'biometric-verification',
    name: 'Biometric Verification',
    description: 'Secure biometric authentication and liveness detection',
    icon: <Fingerprint className="h-5 w-5" />,
    category: 'Security & Authentication',
    enabled: false,
    pricing: 'premium',
    usage: { monthly: 0, limit: 200 }
  },
  {
    id: 'hybrid-dag-storage',
    name: 'Hybrid DAG Storage',
    description: 'High-performance distributed storage with 2.4M TPS capacity',
    icon: <Code className="h-5 w-5" />,
    category: 'Infrastructure',
    enabled: false,
    pricing: 'premium',
    usage: { monthly: 0, limit: 10000 }
  }
];

export default function DeveloperSDKIntegration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [appName, setAppName] = useState("");
  const [appDescription, setAppDescription] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [sdkConfig, setSdkConfig] = useState<any>(null);

  // Fetch current SDK configuration
  const { data: currentConfig, isLoading } = useQuery({
    queryKey: ['/api/developer/sdk-config'],
    enabled: !!user
  });

  // Generate SDK configuration
  const generateConfigMutation = useMutation({
    mutationFn: async (features: string[]) => {
      const response = await apiRequest('POST', '/api/developer/sdk/generate-config', {
        appName,
        appDescription,
        features,
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: (data) => {
      setSdkConfig(data);
      setApiKey(data.apiKey);
      toast({
        title: "SDK Configuration Generated",
        description: "Your HyperDAG SDK is ready for integration"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/developer/sdk-config'] });
    },
    onError: (error: any) => {
      toast({
        title: "Configuration Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Toggle feature selection
  const toggleFeature = (featureId: string) => {
    const feature = SDK_FEATURES.find(f => f.id === featureId);
    if (!feature) return;

    if (selectedFeatures.includes(featureId)) {
      // Remove feature and its dependents
      const newSelection = selectedFeatures.filter(id => {
        const f = SDK_FEATURES.find(sf => sf.id === id);
        return f?.dependencies?.includes(featureId) ? false : id !== featureId;
      });
      setSelectedFeatures(newSelection);
    } else {
      // Add feature and its dependencies
      const newSelection = [...selectedFeatures, featureId];
      if (feature.dependencies) {
        feature.dependencies.forEach(dep => {
          if (!newSelection.includes(dep)) {
            newSelection.push(dep);
          }
        });
      }
      setSelectedFeatures(newSelection);
    }
  };

  const generateSDKCode = () => {
    if (!sdkConfig) return "";

    return `// HyperDAG SDK Integration
import { HyperDAG } from '@hyperdag/sdk';

const hyperdag = new HyperDAG({
  apiKey: '${apiKey}',
  environment: 'production',
  features: [${selectedFeatures.map(f => `'${f}'`).join(', ')}]
});

// Initialize your selected features
${selectedFeatures.includes('sbt') ? `
// Soulbound Tokens (SBT)
const sbtService = hyperdag.sbt;

// Mint a new SBT
async function mintReputationToken(userId, achievements) {
  const result = await sbtService.mint({
    recipient: userId,
    tokenType: 'reputation',
    metadata: {
      achievements,
      timestamp: Date.now(),
      issuer: 'your-app'
    }
  });
  return result;
}

// Verify SBT ownership
async function verifySBT(tokenId) {
  return await sbtService.verify(tokenId);
}
` : ''}
${selectedFeatures.includes('4fa-pol') ? `
// 4-Factor Authentication + Proof of Life
const authService = hyperdag.auth;

// Initialize 4FA + POL
async function setupAdvancedAuth(userId) {
  const result = await authService.setup4FAPOL({
    userId,
    factors: ['password', 'biometric', 'device', 'behavioral'],
    proofOfLife: {
      enabled: true,
      livenessDetection: true,
      biometricTemplate: true
    }
  });
  return result;
}

// Authenticate with 4FA + POL
async function authenticate(userId, factors) {
  return await authService.authenticate({
    userId,
    factors,
    requireProofOfLife: true
  });
}
` : ''}
${selectedFeatures.includes('zkp-verification') ? `
// Zero-Knowledge Proofs
const zkpService = hyperdag.zkp;

// Generate ZK proof
async function generateProof(privateData, publicCriteria) {
  return await zkpService.generateProof({
    data: privateData,
    criteria: publicCriteria,
    circuit: 'identity-verification'
  });
}

// Verify ZK proof
async function verifyProof(proof, publicInputs) {
  return await zkpService.verifyProof(proof, publicInputs);
}
` : ''}
${selectedFeatures.includes('reputation-scoring') ? `
// Cross-Chain Reputation
const reputationService = hyperdag.reputation;

// Get aggregated reputation score
async function getReputationScore(userId) {
  return await reputationService.getScore({
    userId,
    networks: ['ethereum', 'polygon', 'solana', 'hyperdag'],
    includeHistory: true
  });
}

// Update reputation
async function updateReputation(userId, action, value) {
  return await reputationService.update({
    userId,
    action,
    value,
    source: 'your-app'
  });
}
` : ''}

// Error handling
hyperdag.on('error', (error) => {
  console.error('HyperDAG SDK Error:', error);
});

export default hyperdag;`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Code has been copied to your clipboard"
    });
  };

  const categories = Array.from(new Set(SDK_FEATURES.map(f => f.category)));

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="flex-1 p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">HyperDAG SDK Integration</h1>
          <p className="text-muted-foreground">
            Enable powerful Web3 and AI features in your application with simple click-to-integrate functionality
          </p>
        </div>

        <Tabs defaultValue="features" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="configuration">Configuration</TabsTrigger>
            <TabsTrigger value="integration">Integration</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Available SDK Features</CardTitle>
                <CardDescription>
                  Select the features you want to integrate into your application. Dependencies will be automatically included.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {categories.map(category => (
                  <div key={category} className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">{category}</h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {SDK_FEATURES.filter(f => f.category === category).map(feature => (
                        <Card 
                          key={feature.id} 
                          className={`cursor-pointer transition-all ${
                            selectedFeatures.includes(feature.id) 
                              ? 'ring-2 ring-primary bg-primary/5' 
                              : 'hover:shadow-md'
                          }`}
                          onClick={() => toggleFeature(feature.id)}
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-2">
                                {feature.icon}
                                <CardTitle className="text-base">{feature.name}</CardTitle>
                              </div>
                              <div className="flex flex-col items-end space-y-1">
                                <Badge variant={feature.pricing === 'free' ? 'secondary' : 'default'}>
                                  {feature.pricing}
                                </Badge>
                                {selectedFeatures.includes(feature.id) && (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                              {feature.description}
                            </p>
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>{feature.usage.monthly}/{feature.usage.limit} monthly</span>
                              {feature.dependencies && (
                                <span>Requires: {feature.dependencies.join(', ')}</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="configuration" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Application Configuration</CardTitle>
                <CardDescription>
                  Configure your application details to generate your HyperDAG SDK integration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="appName">Application Name</Label>
                    <Input
                      id="appName"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      placeholder="My Web3 App"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="selectedCount">Selected Features</Label>
                    <Input
                      id="selectedCount"
                      value={`${selectedFeatures.length} features selected`}
                      readOnly
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="appDescription">Application Description</Label>
                  <Textarea
                    id="appDescription"
                    value={appDescription}
                    onChange={(e) => setAppDescription(e.target.value)}
                    placeholder="Describe your application and how it will use HyperDAG features..."
                    rows={3}
                  />
                </div>

                {selectedFeatures.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected Features</Label>
                    <div className="flex flex-wrap gap-2">
                      {selectedFeatures.map(featureId => {
                        const feature = SDK_FEATURES.find(f => f.id === featureId);
                        return feature ? (
                          <Badge key={featureId} variant="secondary">
                            {feature.name}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}

                <Button 
                  onClick={() => generateConfigMutation.mutate(selectedFeatures)}
                  disabled={selectedFeatures.length === 0 || !appName || generateConfigMutation.isPending}
                  className="w-full"
                >
                  {generateConfigMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Configuration...
                    </>
                  ) : (
                    'Generate SDK Configuration'
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integration" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SDK Integration Code</CardTitle>
                <CardDescription>
                  Copy this code into your application to integrate HyperDAG features
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sdkConfig ? (
                  <div className="space-y-4">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Your SDK configuration is ready! Copy the code below to integrate HyperDAG into your application.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>API Key</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(apiKey)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                      <Input value={apiKey} readOnly />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Integration Code</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generateSDKCode())}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Code
                        </Button>
                      </div>
                      <div className="bg-muted p-4 rounded-lg overflow-auto">
                        <pre className="text-sm">
                          <code>{generateSDKCode()}</code>
                        </pre>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" asChild>
                        <a href="#" download="hyperdag-sdk-config.json">
                          <Download className="h-4 w-4 mr-2" />
                          Download Config
                        </a>
                      </Button>
                      <Button variant="outline" asChild>
                        <a href="https://docs.hyperdag.org/sdk" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Documentation
                        </a>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Please configure your application in the Configuration tab to generate integration code.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documentation" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Integration Documentation</CardTitle>
                <CardDescription>
                  Comprehensive guides for integrating HyperDAG features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Quick Start Guide</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        Get started with HyperDAG SDK in 5 minutes
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://docs.hyperdag.org/quickstart" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Guide
                        </a>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">API Reference</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        Complete API documentation and examples
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://docs.hyperdag.org/api" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View API Docs
                        </a>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">SDK Examples</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        Real-world implementation examples
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://github.com/hyperdag/examples" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Examples
                        </a>
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Support</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        Get help with your integration
                      </p>
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://discord.gg/hyperdag" target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Join Discord
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}