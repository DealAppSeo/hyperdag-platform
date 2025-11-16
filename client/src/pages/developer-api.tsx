import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, KeyIcon, Eye, EyeOff, Copy, ExternalLink, FileCode, Shield, CheckCircle, AlertTriangle } from "lucide-react";
import { Layout } from "@/components/layout/layout";
import { MoonIcon, SunIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { formatDistanceToNow } from 'date-fns';

// API key creation form component
const ApiKeyForm = () => {
  const [name, setName] = useState("My API Key");
  const [scopes, setScopes] = useState<string[]>(["zkp:verify", "reputation:read"]);
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  
  const handleScopeChange = (scope: string, checked: boolean) => {
    if (checked) {
      setScopes([...scopes, scope]);
    } else {
      setScopes(scopes.filter(s => s !== scope));
    }
  };
  
  const generateKeyMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/developer/zkp/generate-api-key', {
        name,
        scopes
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "API Key Generated",
          description: "Your new API key has been created successfully.",
        });
        setNewApiKey(data.apiKey);
        queryClient.invalidateQueries({ queryKey: ['/api/developer/zkp/api-keys'] });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to generate API key",
          variant: "destructive",
        });
      }
      setLoading(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate API key",
        variant: "destructive",
      });
      setLoading(false);
    }
  });
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    if (scopes.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one scope for your API key",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    
    generateKeyMutation.mutate();
  };
  
  const copyApiKey = () => {
    if (newApiKey) {
      navigator.clipboard.writeText(newApiKey);
      toast({
        title: "Copied",
        description: "API key copied to clipboard",
      });
    }
  };
  
  return (
    <div className="space-y-6">
      {newApiKey ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">API Key Generated!</CardTitle>
            <CardDescription>
              Please copy your API key immediately. For security reasons, you won't be able to view it again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 bg-secondary p-3 rounded-md">
              <pre className="font-mono break-all overflow-x-auto">{newApiKey}</pre>
              <Button variant="ghost" size="icon" onClick={copyApiKey}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" onClick={() => setNewApiKey(null)} className="mt-2">
              Create Another Key
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Create New API Key</CardTitle>
              <CardDescription>
                API keys give third-party applications secure access to the HyperDAG ZKP verification system.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key-name">API Key Name</Label>
                <Input
                  id="api-key-name"
                  placeholder="My API Key"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  A descriptive name to help you identify this key later
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>API Key Scopes</Label>
                <div className="grid gap-3 border rounded-md p-3 md:p-4">
                  <div className="flex items-start md:items-center space-x-2">
                    <Checkbox 
                      id="zkp-verify" 
                      checked={scopes.includes("zkp:verify")} 
                      onCheckedChange={(checked) => handleScopeChange("zkp:verify", checked === true)}
                      className="mt-1 md:mt-0"
                    />
                    <div>
                      <Label htmlFor="zkp-verify" className="cursor-pointer">
                        Verify ZKP SBT credentials
                      </Label>
                      <p className="text-xs text-muted-foreground">zkp:verify</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start md:items-center space-x-2">
                    <Checkbox 
                      id="reputation-read" 
                      checked={scopes.includes("reputation:read")} 
                      onCheckedChange={(checked) => handleScopeChange("reputation:read", checked === true)}
                      className="mt-1 md:mt-0"
                    />
                    <div>
                      <Label htmlFor="reputation-read" className="cursor-pointer">
                        Read reputation information
                      </Label>
                      <p className="text-xs text-muted-foreground">reputation:read</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyIcon className="mr-2 h-4 w-4" />}
                Generate API Key
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}
    </div>
  );
};

// API key management component
const ApiKeyManagement = () => {
  const { toast } = useToast();
  
  const { data: apiKeys, isLoading, error } = useQuery({
    queryKey: ['/api/developer/zkp/api-keys'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/developer/zkp/api-keys');
      const data = await response.json();
      return data.success ? data.keys : [];
    }
  });
  
  const revokeKeyMutation = useMutation({
    mutationFn: async (keyId: number) => {
      const response = await apiRequest('POST', `/api/developer/zkp/revoke-api-key/${keyId}`);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "API Key Revoked",
          description: "The API key has been revoked successfully",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/developer/zkp/api-keys'] });
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to revoke API key",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke API key",
        variant: "destructive",
      });
    }
  });
  
  const handleRevokeKey = (keyId: number) => {
    if (confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
      revokeKeyMutation.mutate(keyId);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load API keys. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">Manage API Keys</CardTitle>
          <CardDescription className="text-sm md:text-base">
            Manage access for applications using your HyperDAG ZKP verification system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {apiKeys && apiKeys.length > 0 ? (
            <div className="overflow-x-auto">
              <Table className="min-w-full">
                <TableCaption>A list of your API keys.</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Name</TableHead>
                    <TableHead className="hidden md:table-cell">Scopes</TableHead>
                    <TableHead className="hidden sm:table-cell">Created</TableHead>
                    <TableHead className="hidden lg:table-cell">Last Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apiKeys.map((key: any) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">
                        <div>
                          {key.name}
                          <div className="md:hidden mt-1">
                            <Badge variant="outline" className="mr-1 text-xs">
                              {key.scopes.length} scope{key.scopes.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {key.scopes.map((scope: string) => (
                            <Badge key={scope} variant="outline" className="mr-1 mb-1">
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{formatDistanceToNow(new Date(key.createdAt), { addSuffix: true })}</TableCell>
                      <TableCell className="hidden lg:table-cell">{key.lastUsed ? formatDistanceToNow(new Date(key.lastUsed), { addSuffix: true }) : 'Never'}</TableCell>
                      <TableCell>
                        {key.active ? 
                          <Badge variant="outline" className="bg-green-200 text-green-800">Active</Badge> : 
                          <Badge variant="destructive">Revoked</Badge>
                        }
                      </TableCell>
                      <TableCell>
                        {key.active && (
                          <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={() => handleRevokeKey(key.id)}
                            disabled={revokeKeyMutation.isPending}
                          >
                            Revoke
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">You don't have any API keys yet.</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <ApiKeyForm />
    </div>
  );
};

// SDK Documentation component
const SdkDocumentation = () => {
  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-xl md:text-2xl">HyperDAG ZKP Verification SDK</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Integrate privacy-preserving Self-Sovereign ID verification into your applications
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-blue-500 text-blue-500 w-fit">
              v1.0 BETA
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Installation</h3>
            
            <div className="bg-secondary p-3 rounded-md">
              <div className="font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                npm install @hyperdag/zkp-sdk
              </div>
            </div>
            
            <p className="text-muted-foreground text-sm mt-2">
              Alternative installation methods:
            </p>
            
            <div className="bg-secondary p-3 rounded-md">
              <div className="font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                yarn add @hyperdag/zkp-sdk
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Quick Start</h3>
            
            <div className="bg-secondary p-3 rounded-md">
              <div className="font-mono text-xs sm:text-sm overflow-x-auto max-w-full">
<code className="whitespace-pre-wrap break-words">{`import { HyperDAGZkpClient } from '@hyperdag/zkp-sdk';

// Initialize client with your API key
const zkpClient = new HyperDAGZkpClient({
  apiKey: 'your-api-key',
  environment: 'production' // or 'development'
});

// Verify a ZKP credential
async function verifyCredential() {
  try {
    const result = await zkpClient.verifyCredential({
      proof: '...', // ZKP proof from user
      publicInputs: {...}, // Public inputs for verification
      type: 'reputation' // Credential type
    });
    
    if (result.verified) {
      console.log('Credential verified!');
      console.log('Score range:', result.data.scoreRange);
    } else {
      console.log('Verification failed:', result.message);
    }
  } catch (error) {
    console.error('Error verifying credential:', error);
  }
}`}</code>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Supported Credential Types</h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-base">
                    <div className="flex items-center">
                      <Shield className="mr-2 h-4 w-4 text-green-500" />
                      Reputation Score
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-muted-foreground">
                    Verifies a user's overall reputation score on HyperDAG without revealing the exact score.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="p-4">
                  <CardTitle className="text-base">
                    <div className="flex items-center">
                      <FileCode className="mr-2 h-4 w-4 text-blue-500" />
                      Developer Credential
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-muted-foreground">
                    Verifies a user's developer experience and contributions without revealing specific details.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Best Practices</AlertTitle>
            <AlertDescription>
              Always validate credentials server-side and never store proof data. The ZKP system is designed for one-time verifications.
            </AlertDescription>
          </Alert>
          
          <div className="flex items-center justify-center mt-6">
            <Button variant="outline" asChild>
              <a href="https://docs.hyperdag.org/zkp-integration" target="_blank" rel="noopener noreferrer">
                Full Documentation <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Developer API Page
const DeveloperApiPage = () => {
  const { user, isLoading } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);
  
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
    return null; // Will redirect to login
  }
  
  return (
    <Layout>
        <div className="container max-w-6xl py-6 md:py-10">
          <div className="mb-4 md:mb-8">
            <h1 className="scroll-m-20 text-3xl md:text-4xl font-extrabold tracking-tight lg:text-5xl mb-2">
              Developer Portal
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Integrate HyperDAG's Self-Sovereign ID and ZKP verification into your applications
            </p>
          </div>
          
          <Tabs defaultValue="api-keys" className="space-y-4 md:space-y-8">
            <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-grid">
              <TabsTrigger value="api-keys" className="text-sm md:text-base">API Keys</TabsTrigger>
              <TabsTrigger value="documentation" className="text-sm md:text-base">SDK Documentation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="api-keys" className="space-y-4 md:space-y-6">
              <ApiKeyManagement />
            </TabsContent>
            
            <TabsContent value="documentation" className="space-y-4 md:space-y-6">
              <SdkDocumentation />
            </TabsContent>
          </Tabs>
        </div>
    </Layout>
  );
};

export default DeveloperApiPage;