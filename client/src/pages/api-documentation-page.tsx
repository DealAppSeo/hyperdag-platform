import { useState } from "react";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ChevronLeft, KeyIcon, Loader2, AlertTriangle, Code, GitBranch, Globe, Lock, Shield, Box, Database, Cpu, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDistanceToNow } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Layout } from "@/components/layout/layout";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
      const response = await apiRequest('/api/developer/zkp/generate-api-key', {
        method: 'POST',
        body: JSON.stringify({ name, scopes })
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
      const response = await apiRequest('/api/developer/zkp/api-keys');
      const data = await response.json();
      return data.success ? data.keys : [];
    }
  });
  
  const revokeKeyMutation = useMutation({
    mutationFn: async (keyId: number) => {
      const response = await apiRequest(`/api/developer/zkp/revoke-api-key/${keyId}`, {
        method: 'POST',
        body: JSON.stringify({})
      });
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

// API Documentation component
const ApiDocumentation = () => {
  const [activeEndpoint, setActiveEndpoint] = useState<string | null>("zkp-verify");
  
  return (
    <div className="space-y-4 md:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl md:text-2xl">API Reference</CardTitle>
          <CardDescription className="text-sm md:text-base">
            Comprehensive documentation for all HyperDAG API endpoints
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid md:grid-cols-12 border-t">
            <div className="col-span-12 md:col-span-4 lg:col-span-3 border-r">
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Zero-Knowledge Proofs</h3>
                  <div className="space-y-1">
                    <a 
                      href="#zkp-verify" 
                      className={`block px-3 py-2 text-sm rounded-md ${activeEndpoint === 'zkp-verify' ? 'bg-secondary font-medium' : 'hover:bg-secondary/50'}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveEndpoint('zkp-verify');
                      }}
                    >
                      ZKP Verification
                    </a>
                    <a 
                      href="#zkp-generate" 
                      className={`block px-3 py-2 text-sm rounded-md ${activeEndpoint === 'zkp-generate' ? 'bg-secondary font-medium' : 'hover:bg-secondary/50'}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveEndpoint('zkp-generate');
                      }}
                    >
                      Generate ZKP Proof
                    </a>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Reputation & Identity</h3>
                  <div className="space-y-1">
                    <a 
                      href="#reputation-get" 
                      className={`block px-3 py-2 text-sm rounded-md ${activeEndpoint === 'reputation-get' ? 'bg-secondary font-medium' : 'hover:bg-secondary/50'}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveEndpoint('reputation-get');
                      }}
                    >
                      Get Reputation
                    </a>
                    <a 
                      href="#sbt-verify" 
                      className={`block px-3 py-2 text-sm rounded-md ${activeEndpoint === 'sbt-verify' ? 'bg-secondary font-medium' : 'hover:bg-secondary/50'}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveEndpoint('sbt-verify');
                      }}
                    >
                      Verify SBT
                    </a>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Decentralized Storage</h3>
                  <div className="space-y-1">
                    <a 
                      href="#ipfs-store" 
                      className={`block px-3 py-2 text-sm rounded-md ${activeEndpoint === 'ipfs-store' ? 'bg-secondary font-medium' : 'hover:bg-secondary/50'}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveEndpoint('ipfs-store');
                      }}
                    >
                      Store Data
                    </a>
                    <a 
                      href="#ipfs-retrieve" 
                      className={`block px-3 py-2 text-sm rounded-md ${activeEndpoint === 'ipfs-retrieve' ? 'bg-secondary font-medium' : 'hover:bg-secondary/50'}`}
                      onClick={(e) => {
                        e.preventDefault();
                        setActiveEndpoint('ipfs-retrieve');
                      }}
                    >
                      Retrieve Data
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="col-span-12 md:col-span-8 lg:col-span-9 p-4">
              {activeEndpoint === 'zkp-verify' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">ZKP Verification</h2>
                    <Badge variant="outline" className="bg-green-100 text-green-800">POST</Badge>
                  </div>
                  
                  <div className="font-mono text-sm bg-secondary p-3 rounded-md">
                    https://api.hyperdag.org/v1/zkp/verify
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Description</h3>
                    <p className="text-muted-foreground">
                      Verifies a zero-knowledge proof against a given statement without revealing the underlying data.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Request Body</h3>
                    <div className="bg-secondary p-3 rounded-md">
                      <div className="font-mono text-sm">
{`{
  "proof": "string", // The ZKP proof to verify
  "publicInputs": {
    // Public inputs for verification 
    "threshold": "number",
    "merkleRoot": "string" 
  },
  "type": "string" // Credential type (e.g., "reputation", "identity")
}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Response</h3>
                    <div className="bg-secondary p-3 rounded-md">
                      <div className="font-mono text-sm">
{`{
  "success": true,
  "verified": true,
  "data": {
    "scoreRange": "500-600",
    "timestamp": 1715347853
  }
}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Requires an API key with the <code>zkp:verify</code> scope.
                    </p>
                  </div>
                </div>
              )}
              
              {activeEndpoint === 'zkp-generate' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Generate ZKP Proof</h2>
                    <Badge variant="outline" className="bg-green-100 text-green-800">POST</Badge>
                  </div>
                  
                  <div className="font-mono text-sm bg-secondary p-3 rounded-md">
                    https://api.hyperdag.org/v1/zkp/generate
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Description</h3>
                    <p className="text-muted-foreground">
                      Generates a zero-knowledge proof for a credential that can be verified without revealing the underlying data.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Request Body</h3>
                    <div className="bg-secondary p-3 rounded-md">
                      <div className="font-mono text-sm">
{`{
  "credential": {
    // Credential data to generate proof for
    "score": 550,
    "hash": "string",
    "issuerId": "string" 
  },
  "type": "string" // Credential type (e.g., "reputation", "identity")
}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Response</h3>
                    <div className="bg-secondary p-3 rounded-md">
                      <div className="font-mono text-sm">
{`{
  "success": true,
  "proof": "string",
  "publicInputs": {
    "threshold": 500,
    "merkleRoot": "string" 
  }
}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Requires user authentication. This endpoint is typically called client-side with the user's credentials.
                    </p>
                  </div>
                </div>
              )}
              
              {activeEndpoint === 'reputation-get' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Get Reputation</h2>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">GET</Badge>
                  </div>
                  
                  <div className="font-mono text-sm bg-secondary p-3 rounded-md">
                    https://api.hyperdag.org/v1/reputation/:userId
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Description</h3>
                    <p className="text-muted-foreground">
                      Retrieves reputation information for a user, including their SBT token details and verification status.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Path Parameters</h3>
                    <div className="bg-secondary p-3 rounded-md">
                      <div className="font-mono text-sm">
{`{
  "userId": "string" // User ID or address
}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Response</h3>
                    <div className="bg-secondary p-3 rounded-md">
                      <div className="font-mono text-sm">
{`{
  "success": true,
  "data": {
    "reputation": {
      "score": 750,
      "level": "Advanced",
      "verifications": ["email", "phone", "github", "telegram"],
      "sbt": {
        "tokenId": "string",
        "issueDate": 1715347853,
        "chain": "polygon"
      }
    }
  }
}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Requires an API key with the <code>reputation:read</code> scope.
                    </p>
                  </div>
                </div>
              )}
              
              {activeEndpoint === 'sbt-verify' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Verify SBT</h2>
                    <Badge variant="outline" className="bg-green-100 text-green-800">POST</Badge>
                  </div>
                  
                  <div className="font-mono text-sm bg-secondary p-3 rounded-md">
                    https://api.hyperdag.org/v1/sbt/verify
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Description</h3>
                    <p className="text-muted-foreground">
                      Verifies the authenticity and validity of a Soulbound Token (SBT) on the blockchain.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Request Body</h3>
                    <div className="bg-secondary p-3 rounded-md">
                      <div className="font-mono text-sm">
{`{
  "tokenId": "string", // SBT token ID
  "address": "string", // Owner address
  "chain": "string" // Blockchain network (e.g., "polygon", "ethereum")
}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Response</h3>
                    <div className="bg-secondary p-3 rounded-md">
                      <div className="font-mono text-sm">
{`{
  "success": true,
  "valid": true,
  "data": {
    "issuer": "HyperDAG Identity Authority",
    "issueDate": 1715347853,
    "expiryDate": 1746883853,
    "attributes": {
      "verificationLevel": "4FA",
      "type": "IdentitySBT"
    }
  }
}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Requires an API key with the <code>sbt:verify</code> scope.
                    </p>
                  </div>
                </div>
              )}
              
              {activeEndpoint === 'ipfs-store' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Store Data</h2>
                    <Badge variant="outline" className="bg-green-100 text-green-800">POST</Badge>
                  </div>
                  
                  <div className="font-mono text-sm bg-secondary p-3 rounded-md">
                    https://api.hyperdag.org/v1/storage/store
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Description</h3>
                    <p className="text-muted-foreground">
                      Stores data on IPFS with optional encryption and persistence guarantees.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Request Body</h3>
                    <div className="bg-secondary p-3 rounded-md">
                      <div className="font-mono text-sm">
{`{
  "data": "string", // Base64-encoded data to store
  "metadata": {
    "name": "string",
    "description": "string",
    "contentType": "string"
  },
  "options": {
    "encrypt": true, // Whether to encrypt the data
    "replicate": true, // Whether to ensure multiple replications
    "pinningService": "string" // Optional pinning service to use
  }
}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Response</h3>
                    <div className="bg-secondary p-3 rounded-md">
                      <div className="font-mono text-sm">
{`{
  "success": true,
  "cid": "string", // Content identifier (IPFS hash)
  "url": "string", // IPFS gateway URL
  "encryptionKey": "string" // Only returned if data was encrypted
}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Requires an API key with the <code>storage:write</code> scope.
                    </p>
                  </div>
                </div>
              )}
              
              {activeEndpoint === 'ipfs-retrieve' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Retrieve Data</h2>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800">GET</Badge>
                  </div>
                  
                  <div className="font-mono text-sm bg-secondary p-3 rounded-md">
                    https://api.hyperdag.org/v1/storage/:cid
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Description</h3>
                    <p className="text-muted-foreground">
                      Retrieves data from IPFS by its Content Identifier (CID), with optional decryption.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Path Parameters</h3>
                    <div className="bg-secondary p-3 rounded-md">
                      <div className="font-mono text-sm">
{`{
  "cid": "string" // Content identifier (IPFS hash)
}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Query Parameters</h3>
                    <div className="bg-secondary p-3 rounded-md">
                      <div className="font-mono text-sm">
{`{
  "decryptionKey": "string" // Optional, for encrypted data
}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Response</h3>
                    <div className="bg-secondary p-3 rounded-md">
                      <div className="font-mono text-sm">
{`{
  "success": true,
  "data": "string", // Base64-encoded data
  "metadata": {
    "name": "string",
    "description": "string",
    "contentType": "string",
    "size": 12345
  }
}`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Requires an API key with the <code>storage:read</code> scope.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
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
              <CardTitle className="text-xl md:text-2xl">HyperDAG SDK Documentation</CardTitle>
              <CardDescription className="text-sm md:text-base">
                Client libraries for integrating HyperDAG features into your applications
              </CardDescription>
            </div>
            <Badge variant="outline" className="border-blue-500 text-blue-500 w-fit">
              v1.0.0
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="divide-y">
          {/* JavaScript SDK */}
          <div className="space-y-4 pb-6">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-yellow-500" />
              <h3 className="text-lg font-semibold">JavaScript / TypeScript</h3>
            </div>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Installation</h4>
                <div className="bg-secondary p-3 rounded-md">
                  <div className="font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                    npm install @hyperdag/sdk
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Usage Example</h4>
                <div className="bg-secondary p-3 rounded-md">
                  <div className="font-mono text-xs sm:text-sm overflow-x-auto max-w-full">
<code className="whitespace-pre-wrap break-words">{`import { HyperDAG } from '@hyperdag/sdk';

// Initialize with your API key
const hyperdag = new HyperDAG({
  apiKey: 'your-api-key',
  environment: 'production' // or 'development'
});

// Verify a ZKP credential
async function verifyCredential() {
  try {
    const result = await hyperdag.zkp.verifyCredential({
      proof: '...', // ZKP proof from user
      publicInputs: {...}, // Public inputs for verification
      type: 'reputation' // Credential type
    });
    
    if (result.verified) {
      console.log('Credential verified!');
      console.log('Score range:', result.data.scoreRange);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Store data on IPFS
async function storeData() {
  const result = await hyperdag.storage.store({
    data: 'base64data...',
    metadata: {
      name: 'Example file',
      contentType: 'application/json'
    },
    options: {
      encrypt: true
    }
  });
  
  console.log('Stored at:', result.url);
  console.log('CID:', result.cid);
}`}</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Python SDK */}
          <div className="space-y-4 py-6">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold">Python</h3>
            </div>
            
            <div className="grid gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">Installation</h4>
                <div className="bg-secondary p-3 rounded-md">
                  <div className="font-mono text-sm overflow-x-auto whitespace-pre-wrap">
                    pip install hyperdag-sdk
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Usage Example</h4>
                <div className="bg-secondary p-3 rounded-md">
                  <div className="font-mono text-xs sm:text-sm overflow-x-auto max-w-full">
<code className="whitespace-pre-wrap break-words">{`from hyperdag import HyperDAG

# Initialize with your API key
hyperdag = HyperDAG(
    api_key='your-api-key',
    environment='production'  # or 'development'
)

# Verify SBT credentials
def verify_sbt():
    result = hyperdag.sbt.verify(
        token_id='abc123',
        address='0x123...',
        chain='polygon'
    )
    
    if result['valid']:
        print('SBT is valid!')
        print(f"Issued by: {result['data']['issuer']}")
        print(f"Verification level: {result['data']['attributes']['verificationLevel']}")
    else:
        print('SBT verification failed')

# Get reputation data
def get_reputation(user_id):
    reputation = hyperdag.reputation.get(user_id)
    print(f"Reputation score: {reputation['data']['reputation']['score']}")
    print(f"Level: {reputation['data']['reputation']['level']}")
    print(f"Verifications: {', '.join(reputation['data']['reputation']['verifications'])}")`}</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Other SDKs */}
          <div className="space-y-4 pt-6">
            <div className="flex items-center gap-2">
              <GitBranch className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Additional SDKs</h3>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-100 text-red-800 rounded-full flex items-center justify-center text-xs font-bold">
                      Go
                    </div>
                    Go SDK
                  </CardTitle>
                  <CardDescription>Coming Soon</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Our Go SDK is currently in development. Join the waitlist to get early access.
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-100 text-purple-800 rounded-full flex items-center justify-center text-xs font-bold">
                      C#
                    </div>
                    .NET SDK
                  </CardTitle>
                  <CardDescription>Coming Soon</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Our .NET SDK is currently in development. Join the waitlist to get early access.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Integration Options component
const IntegrationOptions = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Integration Options</CardTitle>
        <CardDescription>
          Connect HyperDAG's features with your existing infrastructure
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Backplane.dev Integration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Backplane.dev Integration</h3>
            <Badge variant="outline" className="bg-green-100 text-green-800">Recommended</Badge>
          </div>
          <p className="text-muted-foreground">
            Backplane.dev provides a comprehensive API gateway and management solution that seamlessly integrates with HyperDAG's features.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Unified API Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage all HyperDAG APIs through a single interface, with integrated authentication, rate limiting, and monitoring.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Multi-cloud Deployment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Deploy your HyperDAG-powered applications across multiple cloud providers for improved reliability and performance.
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="mt-4">
            <h4 className="text-base font-medium mb-2">Integration Steps</h4>
            <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
              <li>Create a Backplane.dev account at <a href="https://backplane.dev" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">backplane.dev</a></li>
              <li>Create a new API gateway and add HyperDAG as a service</li>
              <li>Configure authentication using your HyperDAG API keys</li>
              <li>Generate client SDKs for your preferred language</li>
              <li>Deploy your integrated applications</li>
            </ol>
          </div>
        </div>
        
        {/* GitHub Integration */}
        <div className="space-y-4 pt-6 border-t">
          <h3 className="text-lg font-semibold">GitHub Integration</h3>
          <p className="text-muted-foreground">
            Integrate HyperDAG's APIs directly into your GitHub repositories and workflows.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">GitHub Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Use HyperDAG's ZKP verification and decentralized storage in your CI/CD workflows with custom GitHub Actions.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Automated SDK Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Keep your client libraries up-to-date with automated dependency updates via Dependabot.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* HyperDAG Feature Integrations */}
        <div className="space-y-4 pt-6 border-t">
          <h3 className="text-lg font-semibold">Available HyperDAG Features</h3>
          <p className="text-muted-foreground">
            Integrate these powerful HyperDAG features into your applications via our APIs:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">ZKP Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Privacy-preserving credential verification with zero-knowledge proofs.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Self-Sovereign ID</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  User-controlled digital identity with SBT-based reputation system.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">4FA Authentication</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Four-factor authentication for enhanced security and verification.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Decentralized Storage</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  IPFS-based persistent storage with redundancy and encryption.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">HyperCrowd Matching</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  AI-powered team matching and collaboration tools for projects.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">GrantFlow</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Grant discovery and application management for Web3 and AI projects.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function ApiDocumentationPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-4 flex items-center">
        <Link href="/developer" className="mr-4">
          <Button variant="ghost" size="icon">
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">API Documentation & Keys</h1>
      </div>
      
      <p className="text-lg text-muted-foreground mb-6">
        Integrate privacy-preserving, AI-enhanced Web3 technologies into your applications
      </p>
      
      <Tabs defaultValue="api-keys" className="space-y-4 md:space-y-8">
        <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-4">
          <TabsTrigger value="api-keys" className="text-sm md:text-base">API Keys</TabsTrigger>
          <TabsTrigger value="api-docs" className="text-sm md:text-base">API Documentation</TabsTrigger>
          <TabsTrigger value="sdk-docs" className="text-sm md:text-base">SDK Documentation</TabsTrigger>
          <TabsTrigger value="integration" className="text-sm md:text-base">Integration Options</TabsTrigger>
        </TabsList>
        
        <TabsContent value="api-keys" className="space-y-4 md:space-y-6">
          <ApiKeyManagement />
        </TabsContent>
        
        <TabsContent value="api-docs" className="space-y-4 md:space-y-6">
          <ApiDocumentation />
        </TabsContent>
        
        <TabsContent value="sdk-docs" className="space-y-4 md:space-y-6">
          <SdkDocumentation />
        </TabsContent>
        
        <TabsContent value="integration" className="space-y-4 md:space-y-6">
          <IntegrationOptions />
        </TabsContent>
      </Tabs>
    </div>
  );
}