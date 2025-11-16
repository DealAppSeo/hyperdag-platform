import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Key, Book, Code, Lightbulb, Trash2 } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Navigation } from '@/components/Navigation';

interface ApiKey {
  id: number;
  keyName: string;
  keyPreview: string;
  permissions: string[];
  isActive: boolean;
  usageCount: number;
  lastUsed: string | null;
  createdAt: string;
  expiresAt: string | null;
}

export default function DevHub() {
  const [keyName, setKeyName] = useState('');
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: keysData, isLoading } = useQuery<{ success: boolean; keys: ApiKey[] }>({
    queryKey: ['/api/devhub/keys'],
  });

  const createKeyMutation = useMutation({
    mutationFn: (name: string) =>
      apiRequest('/api/devhub/keys', {
        method: 'POST',
        body: JSON.stringify({ keyName: name, permissions: ['read', 'write'] }),
      }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/devhub/keys'] });
      setNewApiKey(data.key.apiKey);
      setKeyName('');
      toast({
        title: 'API Key Created',
        description: 'Save your key now - you won\'t see it again!',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create API key',
        variant: 'destructive',
      });
    },
  });

  const deleteKeyMutation = useMutation({
    mutationFn: (keyId: number) =>
      apiRequest(`/api/devhub/keys/${keyId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/devhub/keys'] });
      toast({
        title: 'API Key Deleted',
        description: 'The API key has been removed',
      });
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied!',
      description: 'API key copied to clipboard',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Developer Hub</h1>
          <p className="text-muted-foreground">
            Manage your API keys, access SDKs, and integrate HyperDAG into your applications
          </p>
        </div>

        <Tabs defaultValue="api-keys" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="api-keys" data-testid="tab-api-keys">
              <Key className="w-4 h-4 mr-2" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="sdks" data-testid="tab-sdks">
              <Code className="w-4 h-4 mr-2" />
              SDKs
            </TabsTrigger>
            <TabsTrigger value="guides" data-testid="tab-guides">
              <Book className="w-4 h-4 mr-2" />
              Guides
            </TabsTrigger>
            <TabsTrigger value="use-cases" data-testid="tab-use-cases">
              <Lightbulb className="w-4 h-4 mr-2" />
              Use Cases
            </TabsTrigger>
          </TabsList>

          <TabsContent value="api-keys" className="space-y-6">
            {newApiKey && (
              <Card className="border-green-500">
                <CardHeader>
                  <CardTitle className="text-green-600">🎉 API Key Created!</CardTitle>
                  <CardDescription>
                    Copy this key now - you won't be able to see it again
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input value={newApiKey} readOnly className="font-mono" data-testid="input-new-api-key" />
                    <Button onClick={() => copyToClipboard(newApiKey)} data-testid="button-copy-new-key">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-4"
                    onClick={() => setNewApiKey(null)}
                    data-testid="button-dismiss-new-key"
                  >
                    I've saved it
                  </Button>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Create New API Key</CardTitle>
                <CardDescription>
                  Generate a new API key to authenticate your requests
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="keyName">Key Name</Label>
                    <Input
                      id="keyName"
                      placeholder="My App Production Key"
                      value={keyName}
                      onChange={(e) => setKeyName(e.target.value)}
                      data-testid="input-key-name"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => createKeyMutation.mutate(keyName)}
                      disabled={!keyName || createKeyMutation.isPending}
                      data-testid="button-create-key"
                    >
                      {createKeyMutation.isPending ? 'Creating...' : 'Create Key'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your API Keys</CardTitle>
                <CardDescription>Manage your existing API keys</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-muted-foreground">Loading keys...</p>
                ) : keysData?.keys?.length === 0 ? (
                  <p className="text-muted-foreground">No API keys yet. Create one above!</p>
                ) : (
                  <div className="space-y-4">
                    {keysData?.keys?.map((key) => (
                      <div
                        key={key.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                        data-testid={`api-key-${key.id}`}
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold">{key.keyName}</h4>
                          <p className="text-sm text-muted-foreground font-mono">{key.keyPreview}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Created: {new Date(key.createdAt).toLocaleDateString()} • Used: {key.usageCount} times
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteKeyMutation.mutate(key.id)}
                          data-testid={`button-delete-${key.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sdks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>SDK Downloads</CardTitle>
                <CardDescription>Download SDKs for your preferred language</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">JavaScript / TypeScript</h4>
                  <pre className="text-sm bg-secondary p-2 rounded mb-2">
                    npm install @hyperdag/sdk
                  </pre>
                  <Button variant="outline" size="sm">Download SDK</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Python</h4>
                  <pre className="text-sm bg-secondary p-2 rounded mb-2">
                    pip install hyperdag-sdk
                  </pre>
                  <Button variant="outline" size="sm">Download SDK</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Go</h4>
                  <pre className="text-sm bg-secondary p-2 rounded mb-2">
                    go get github.com/hyperdag/sdk-go
                  </pre>
                  <Button variant="outline" size="sm">Download SDK</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Rust</h4>
                  <pre className="text-sm bg-secondary p-2 rounded mb-2">
                    cargo add hyperdag-sdk
                  </pre>
                  <Button variant="outline" size="sm">Download SDK</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guides" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Start Guides</CardTitle>
                <CardDescription>Get up and running in minutes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-1">Authentication</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Learn how to authenticate API requests with your API key
                  </p>
                  <pre className="text-xs bg-secondary p-3 rounded overflow-x-auto">
{`const response = await fetch('https://api.hyperdag.io/v1/repid/verify', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});`}
                  </pre>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-1">Create RepID Credential</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Generate a privacy-preserving reputation credential
                  </p>
                  <pre className="text-xs bg-secondary p-3 rounded overflow-x-auto">
{`const credential = await client.repid.create({
  address: '0x...',
  ratings: {
    technical: 4.5,
    social: 4.0
  }
});`}
                  </pre>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold mb-1">Verify with ZKP</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Verify credentials without revealing identity
                  </p>
                  <pre className="text-xs bg-secondary p-3 rounded overflow-x-auto">
{`const verified = await client.zkp.verify({
  proof: credential.proof,
  threshold: 4.0
});`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="use-cases" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Use Cases & Examples</CardTitle>
                <CardDescription>Real-world applications of HyperDAG</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    Community Reputation
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Track volunteer contributions and reputation scores in faith communities without exposing personal data
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    AI Agent Verification
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Validate AI assistant performance with Scripture-aligned metrics and ZKP privacy
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    Sybil-Resistant Governance
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Implement weighted voting based on reputation without revealing voter identity
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    Content Moderation
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Filter content based on creator reputation while maintaining privacy
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
