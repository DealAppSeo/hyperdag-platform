import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2, Check, Copy, Key, ShieldCheck, Database, Cpu, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import hyperDAGClient from '@/lib/hyperdag-client';
import boltHyperDAGBridge from '@/lib/bolt-hyperdag-bridge';

// API Key interface
interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string | null;
  permissions: string[];
  active: boolean;
}

export default function ApiKeysPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  
  const [isLoading, setIsLoading] = useState(true);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [bridgeStatus, setBridgeStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [serviceStatuses, setServiceStatuses] = useState({
    storage: false,
    privacy: false,
    ai: false,
    tokenization: false
  });
  
  // Load API keys on component mount
  useEffect(() => {
    if (!user) {
      setLocation('/auth');
      return;
    }
    
    fetchApiKeys();
    checkBridgeStatus();
  }, [user, setLocation]);
  
  // Fetch API keys from HyperDAG
  const fetchApiKeys = async () => {
    setIsLoading(true);
    try {
      const keys = await hyperDAGClient.getApiKeys();
      setApiKeys(keys);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      toast({
        title: 'Error fetching API keys',
        description: 'Could not retrieve your API keys. Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Check the status of the HyperDAG bridge
  const checkBridgeStatus = async () => {
    setBridgeStatus('connecting');
    try {
      // Check if the bridge is initialized
      if (!boltHyperDAGBridge.isInitialized()) {
        const initialized = await boltHyperDAGBridge.initialize();
        if (!initialized) {
          setBridgeStatus('error');
          return;
        }
      }
      
      // Check service availability
      const health = await hyperDAGClient.checkHealth();
      setServiceStatuses({
        storage: health.services.storage.available,
        privacy: health.services.privacy.available,
        ai: health.services.ai.available,
        tokenization: health.services.tokenization.available
      });
      
      setBridgeStatus('connected');
    } catch (error) {
      console.error('Failed to check bridge status:', error);
      setBridgeStatus('error');
    }
  };
  
  // Create a new API key
  const handleCreateKey = async () => {
    if (!newKeyName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please provide a name for your API key.',
        variant: 'destructive'
      });
      return;
    }
    
    setCreatingKey(true);
    try {
      const apiKey = await hyperDAGClient.generateApiKey(newKeyName, [
        'storage',
        'privacy',
        'ai',
        'tokenization'
      ]);
      
      if (apiKey) {
        setNewlyCreatedKey(apiKey);
        await fetchApiKeys();
        toast({
          title: 'API key created',
          description: 'Your new API key has been created successfully.',
          variant: 'default'
        });
      } else {
        throw new Error('Failed to generate API key');
      }
    } catch (error) {
      console.error('Failed to create API key:', error);
      toast({
        title: 'Error creating API key',
        description: 'Could not create a new API key. Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setCreatingKey(false);
      setShowCreateForm(false);
      setNewKeyName('');
    }
  };
  
  // Copy API key to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast({
          title: 'Copied to clipboard',
          description: 'The API key has been copied to your clipboard.',
          variant: 'default'
        });
      },
      (err) => {
        console.error('Failed to copy to clipboard:', err);
        toast({
          title: 'Copy failed',
          description: 'Failed to copy the API key to your clipboard.',
          variant: 'destructive'
        });
      }
    );
  };
  
  // Handle service toggle
  const handleServiceToggle = async (service: keyof typeof serviceStatuses, enabled: boolean) => {
    try {
      // Update bridge configuration
      await boltHyperDAGBridge.initialize({
        enabledServices: {
          ...serviceStatuses,
          [service]: enabled
        }
      });
      
      // Update local state
      setServiceStatuses(prev => ({
        ...prev,
        [service]: enabled
      }));
      
      toast({
        title: `${service.charAt(0).toUpperCase() + service.slice(1)} service ${enabled ? 'enabled' : 'disabled'}`,
        description: `The ${service} service has been ${enabled ? 'enabled' : 'disabled'} successfully.`,
        variant: 'default'
      });
    } catch (error) {
      console.error(`Failed to ${enabled ? 'enable' : 'disable'} ${service} service:`, error);
      toast({
        title: 'Service update failed',
        description: `Could not ${enabled ? 'enable' : 'disable'} the ${service} service. Please try again.`,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">HyperDAG Integration</h1>
          <p className="text-muted-foreground mt-2">
            Manage your HyperDAG API keys and integration settings
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              bridgeStatus === 'connected' ? 'bg-green-500' : 
              bridgeStatus === 'connecting' ? 'bg-yellow-500' : 
              bridgeStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
            }`}></div>
            <span className="text-sm">
              {bridgeStatus === 'connected' ? 'Connected to HyperDAG' : 
               bridgeStatus === 'connecting' ? 'Connecting...' : 
               bridgeStatus === 'error' ? 'Connection error' : 'Not connected'}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={checkBridgeStatus} disabled={bridgeStatus === 'connecting'}>
            {bridgeStatus === 'connecting' ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="keys" className="w-full">
        <TabsList className="w-full flex flex-wrap">
          <TabsTrigger value="keys" className="flex-1 text-sm sm:text-base py-2 px-2 sm:px-4">API Keys</TabsTrigger>
          <TabsTrigger value="services" className="flex-1 text-sm sm:text-base py-2 px-2 sm:px-4">Services</TabsTrigger>
          <TabsTrigger value="setup" className="flex-1 text-sm sm:text-base py-2 px-2 sm:px-4">Setup Guide</TabsTrigger>
        </TabsList>
        
        {/* API Keys Tab */}
        <TabsContent value="keys" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your API Keys</CardTitle>
              <CardDescription>
                Manage your HyperDAG API keys for integrating with Bolt
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : apiKeys.length > 0 ? (
                <div className="space-y-4">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{key.name}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Created: {new Date(key.createdAt).toLocaleDateString()}
                            {key.lastUsed && ` • Last used: ${new Date(key.lastUsed).toLocaleDateString()}`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(key.key)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-2 mt-2">
                          {key.permissions.map((perm) => (
                            <span 
                              key={perm} 
                              className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs"
                            >
                              {perm}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No API keys found</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't created any API keys yet.
                  </p>
                </div>
              )}
              
              {newlyCreatedKey && (
                <Alert className="mt-4 bg-green-50 border-green-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <AlertTitle className="text-green-800">Key created successfully</AlertTitle>
                      <AlertDescription className="mt-2 text-green-700">
                        <div className="font-mono bg-green-100 p-2 rounded border border-green-300 text-sm break-all">
                          {newlyCreatedKey}
                        </div>
                        <p className="mt-2 text-sm">
                          Make sure to copy this key now. For security reasons, you won't be able to see it again.
                        </p>
                      </AlertDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(newlyCreatedKey)}
                      className="ml-2"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </Alert>
              )}
              
              {showCreateForm ? (
                <div className="mt-6 border rounded-lg p-4">
                  <h3 className="font-medium mb-3">Create New API Key</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="keyName">API Key Name</Label>
                      <Input
                        id="keyName"
                        placeholder="e.g., Bolt Integration"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        disabled={creatingKey}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCreateKey}
                        disabled={creatingKey || !newKeyName.trim()}
                      >
                        {creatingKey && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        Create Key
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewKeyName('');
                        }}
                        disabled={creatingKey}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6">
                  <Button
                    onClick={() => setShowCreateForm(true)}
                    disabled={isLoading}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Create New API Key
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>HyperDAG Services</CardTitle>
              <CardDescription>
                Enable or disable HyperDAG services for your Bolt integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center">
                      <Database className="h-5 w-5 mr-2 text-primary" />
                      <Label className="text-base">Decentralized Storage</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Store data on IPFS and W3 decentralized networks
                    </p>
                  </div>
                  <Switch
                    checked={serviceStatuses.storage}
                    onCheckedChange={(checked) => handleServiceToggle('storage', checked)}
                    disabled={bridgeStatus !== 'connected'}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center">
                      <ShieldCheck className="h-5 w-5 mr-2 text-primary" />
                      <Label className="text-base">Zero-Knowledge Privacy</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enable ZKP for private data and actions
                    </p>
                  </div>
                  <Switch
                    checked={serviceStatuses.privacy}
                    onCheckedChange={(checked) => handleServiceToggle('privacy', checked)}
                    disabled={bridgeStatus !== 'connected'}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center">
                      <Cpu className="h-5 w-5 mr-2 text-primary" />
                      <Label className="text-base">AI Insights</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Generate AI-powered insights and recommendations
                    </p>
                  </div>
                  <Switch
                    checked={serviceStatuses.ai}
                    onCheckedChange={(checked) => handleServiceToggle('ai', checked)}
                    disabled={bridgeStatus !== 'connected'}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center">
                      <Key className="h-5 w-5 mr-2 text-primary" />
                      <Label className="text-base">Tokenization</Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Mint Soulbound Tokens (SBTs) for achievements
                    </p>
                  </div>
                  <Switch
                    checked={serviceStatuses.tokenization}
                    onCheckedChange={(checked) => handleServiceToggle('tokenization', checked)}
                    disabled={bridgeStatus !== 'connected'}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Setup Guide Tab */}
        <TabsContent value="setup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Setup Guide</CardTitle>
              <CardDescription>
                Follow these steps to integrate Bolt with HyperDAG
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="relative pl-8 pb-6 border-l border-neutral-200">
                  <div className="absolute left-[-8px] top-0 bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center">
                    1
                  </div>
                  <h3 className="text-lg font-medium mb-2">Generate an API Key</h3>
                  <p className="text-muted-foreground mb-4">
                    Create a new API key in the "API Keys" tab. This key will be used by Bolt to authenticate with HyperDAG services.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCreateForm(true);
                      document.querySelector('[data-value="keys"]')?.dispatchEvent(
                        new MouseEvent('click', { bubbles: true })
                      );
                    }}
                  >
                    Create API Key
                  </Button>
                </div>
                
                <div className="relative pl-8 pb-6 border-l border-neutral-200">
                  <div className="absolute left-[-8px] top-0 bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center">
                    2
                  </div>
                  <h3 className="text-lg font-medium mb-2">Configure Environment</h3>
                  <p className="text-muted-foreground mb-2">
                    Add your API key to the <code className="px-1 py-0.5 bg-muted rounded">BOLT_HYPERDAG_API_KEY</code> environment variable.
                  </p>
                  <div className="bg-muted p-3 rounded-md font-mono text-sm mb-4">
                    <code>BOLT_HYPERDAG_API_KEY=your_api_key_here</code>
                  </div>
                  <Alert variant="destructive" className="bg-red-50 border-red-200">
                    <AlertTitle className="text-red-800">Important Security Notice</AlertTitle>
                    <AlertDescription className="text-red-700">
                      Never commit your API key to version control or share it publicly. 
                      Always use environment variables or secrets management for API keys.
                    </AlertDescription>
                  </Alert>
                </div>
                
                <div className="relative pl-8 pb-6 border-l border-neutral-200">
                  <div className="absolute left-[-8px] top-0 bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center">
                    3
                  </div>
                  <h3 className="text-lg font-medium mb-2">Enable Services</h3>
                  <p className="text-muted-foreground mb-4">
                    In the "Services" tab, enable the HyperDAG services you want to use with Bolt. 
                    You can always change these settings later.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      document.querySelector('[data-value="services"]')?.dispatchEvent(
                        new MouseEvent('click', { bubbles: true })
                      );
                    }}
                  >
                    Configure Services
                  </Button>
                </div>
                
                <div className="relative pl-8">
                  <div className="absolute left-[-8px] top-0 bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center">
                    <Check className="h-4 w-4" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Test the Integration</h3>
                  <p className="text-muted-foreground">
                    Your Bolt app will now be able to use HyperDAG services for storage, privacy, 
                    AI insights, and tokenization. Check the connection status at the top of this page.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button 
                className="w-full"
                onClick={checkBridgeStatus}
                disabled={bridgeStatus === 'connecting'}
              >
                {bridgeStatus === 'connecting' ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Test Connection
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}