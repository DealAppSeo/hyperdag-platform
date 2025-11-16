import { useAuth } from "@/hooks/use-auth";
import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Code, Copy, FileText, Fingerprint, KeyRound, Lock, Server, Shield, Table, User } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function ZkpDashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  
  const { data: zkpStats } = useQuery({
    queryKey: ["/api/developer/zkp/stats"],
    enabled: !!user,
  });
  
  const { data: verifications } = useQuery({
    queryKey: ["/api/developer/zkp/verifications"],
    enabled: !!user,
  });
  
  const handleGenerateKey = async () => {
    try {
      const response = await fetch("/api/developer/zkp/generate-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user?.id }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setApiKey(data.apiKey);
        toast({
          title: "API Key Generated",
          description: "Your ZKP API key has been generated successfully.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate API key. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleCopyKey = () => {
    if (apiKey) {
      navigator.clipboard.writeText(apiKey);
      toast({
        title: "Copied!",
        description: "API key copied to clipboard.",
      });
    }
  };
  
  // Mock stats until API is ready
  const stats = zkpStats || {
    totalProofs: 56,
    verifiedCredentials: 12,
    activeCircuits: 4,
    recentVerifications: 23,
  };
  
  // Mock verifications
  const recentVerifications = verifications?.slice(0, 5) || [
    { id: 1, userId: "user123", type: "identity", status: "verified", timestamp: "2025-05-19T14:32:00Z" },
    { id: 2, userId: "user456", type: "reputation", status: "pending", timestamp: "2025-05-18T09:15:00Z" },
    { id: 3, userId: "user789", type: "credentials", status: "verified", timestamp: "2025-05-17T16:45:00Z" },
  ];
  
  return (
    <AppLayout 
      title="ZKP Integration" 
      description="Integrate zero-knowledge proofs into your applications"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="bg-primary/5 border-b border-primary/10 pb-3">
            <CardTitle className="flex items-center text-lg">
              <Shield className="h-5 w-5 mr-2 text-primary" />
              Total ZK Proofs
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{stats.totalProofs}</div>
            <p className="text-sm text-muted-foreground">Proofs generated</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="bg-primary/5 border-b border-primary/10 pb-3">
            <CardTitle className="flex items-center text-lg">
              <Fingerprint className="h-5 w-5 mr-2 text-primary" />
              Verified Credentials
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{stats.verifiedCredentials}</div>
            <p className="text-sm text-muted-foreground">Active verifiable credentials</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="bg-primary/5 border-b border-primary/10 pb-3">
            <CardTitle className="flex items-center text-lg">
              <Table className="h-5 w-5 mr-2 text-primary" />
              Active Circuits
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="text-3xl font-bold">{stats.activeCircuits}</div>
            <p className="text-sm text-muted-foreground">Deployed ZK circuits</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="api" className="w-full">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="api">API Access</TabsTrigger>
              <TabsTrigger value="sdk">SDKs</TabsTrigger>
              <TabsTrigger value="docs">Documentation</TabsTrigger>
            </TabsList>
            
            <TabsContent value="api" className="border rounded-lg p-4 mt-4">
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">ZKP API Access</h3>
                <p className="text-muted-foreground mb-4">
                  Generate an API key to access HyperDAG's ZKP services and integrate them into your applications.
                </p>
                
                {apiKey ? (
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-2">
                      <label className="text-sm font-medium">Your API Key:</label>
                      <div className="flex">
                        <div className="bg-secondary/10 border border-secondary/20 rounded-l-md px-3 py-2 flex-1 font-mono text-sm">
                          {apiKey.substring(0, 6)}...{apiKey.substring(apiKey.length - 6)}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-l-none"
                          onClick={handleCopyKey}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        This key can only be viewed once. Store it securely.
                      </p>
                    </div>
                    
                    <Alert variant="warning">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Important</AlertTitle>
                      <AlertDescription>
                        Keep this API key secure. Do not share it or commit it to version control.
                      </AlertDescription>
                    </Alert>
                    
                    <Button variant="outline" onClick={() => setApiKey("")}>Generate New Key</Button>
                  </div>
                ) : (
                  <Button onClick={handleGenerateKey}>
                    <KeyRound className="h-4 w-4 mr-2" />
                    Generate API Key
                  </Button>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">API Endpoints</h3>
                <div className="space-y-3">
                  <div className="bg-secondary/5 p-3 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-medium">Identity Verification</div>
                      <Badge variant="outline">POST</Badge>
                    </div>
                    <div className="font-mono text-sm text-muted-foreground">/api/v1/zkp/verify-identity</div>
                  </div>
                  
                  <div className="bg-secondary/5 p-3 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-medium">Reputation Proof</div>
                      <Badge variant="outline">POST</Badge>
                    </div>
                    <div className="font-mono text-sm text-muted-foreground">/api/v1/zkp/reputation-proof</div>
                  </div>
                  
                  <div className="bg-secondary/5 p-3 rounded-md">
                    <div className="flex justify-between items-center mb-1">
                      <div className="font-medium">Verify Credential</div>
                      <Badge variant="outline">POST</Badge>
                    </div>
                    <div className="font-mono text-sm text-muted-foreground">/api/v1/zkp/verify-credential</div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="sdk" className="border rounded-lg p-4 mt-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Integration SDKs</h3>
                  <p className="text-muted-foreground mb-4">
                    Use our official SDKs to integrate ZKP functionality into your applications.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">JavaScript SDK</CardTitle>
                        <CardDescription>For web and Node.js applications</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="bg-secondary/5 p-2 rounded-md font-mono text-xs">
                          npm install @hyperdag/zkp-sdk
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" size="sm" className="w-full">
                          <FileText className="h-4 w-4 mr-2" />
                          Documentation
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Python SDK</CardTitle>
                        <CardDescription>For Python applications and data science</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="bg-secondary/5 p-2 rounded-md font-mono text-xs">
                          pip install hyperdag-zkp
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" size="sm" className="w-full">
                          <FileText className="h-4 w-4 mr-2" />
                          Documentation
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Code Samples</h3>
                  
                  <div className="bg-secondary/5 p-3 rounded-md mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium">JavaScript Example</div>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="font-mono text-sm overflow-x-auto text-muted-foreground">
                      <pre>{`import { HyperdagZKP } from '@hyperdag/zkp-sdk';

// Initialize the SDK with your API key
const zkp = new HyperdagZKP({ apiKey: 'your-api-key' });

// Generate a proof of reputation
async function generateReputationProof(userId) {
  try {
    const proof = await zkp.generateProof({
      type: 'reputation',
      userId: userId,
      thresholdScore: 50 // Prove reputation score > 50
    });
    
    return proof;
  } catch (error) {
    console.error('Error generating proof:', error);
  }
}`}</pre>
                    </div>
                  </div>
                  
                  <div className="bg-secondary/5 p-3 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-medium">Python Example</div>
                      <Button variant="ghost" size="sm" className="h-8 px-2">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <div className="font-mono text-sm overflow-x-auto text-muted-foreground">
                      <pre>{`from hyperdag_zkp import HyperdagZKP

# Initialize the SDK with your API key
zkp = HyperdagZKP(api_key='your-api-key')

# Verify a credential
def verify_credential(credential_id, issuer_id):
    try:
        verification = zkp.verify_credential(
            credential_id=credential_id,
            issuer_id=issuer_id
        )
        
        return verification
    except Exception as e:
        print(f"Error verifying credential: {e}")
        return None`}</pre>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="docs" className="border rounded-lg p-4 mt-4">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">ZKP Documentation</h3>
                  <p className="text-muted-foreground mb-4">
                    Learn how to integrate HyperDAG's ZKP services into your applications.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    <Card className="bg-primary/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center">
                          <Code className="h-4 w-4 mr-2 text-primary" />
                          Getting Started
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-muted-foreground">
                          Introduction to ZKP and first steps to integration
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button variant="ghost" size="sm" className="w-full">
                          Read Guide
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    <Card className="bg-primary/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center">
                          <FileText className="h-4 w-4 mr-2 text-primary" />
                          API Reference
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-muted-foreground">
                          Complete API documentation and endpoints
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button variant="ghost" size="sm" className="w-full">
                          View Reference
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    <Card className="bg-primary/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center">
                          <Server className="h-4 w-4 mr-2 text-primary" />
                          Circuit Examples
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="text-sm text-muted-foreground">
                          Sample circuits and implementation guides
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button variant="ghost" size="sm" className="w-full">
                          Explore Examples
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2">Tutorials</h3>
                  
                  <ul className="space-y-3">
                    <li>
                      <Link href="/docs/zkp/identity-verification" className="flex items-center text-primary hover:underline">
                        <FileText className="h-4 w-4 mr-2" />
                        Building an Identity Verification System
                      </Link>
                    </li>
                    <li>
                      <Link href="/docs/zkp/reputation-proof" className="flex items-center text-primary hover:underline">
                        <FileText className="h-4 w-4 mr-2" />
                        Creating Reputation Proofs for Your Application
                      </Link>
                    </li>
                    <li>
                      <Link href="/docs/zkp/credentials" className="flex items-center text-primary hover:underline">
                        <FileText className="h-4 w-4 mr-2" />
                        Implementing Verifiable Credentials
                      </Link>
                    </li>
                    <li>
                      <Link href="/docs/zkp/best-practices" className="flex items-center text-primary hover:underline">
                        <FileText className="h-4 w-4 mr-2" />
                        ZKP Security Best Practices
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2 text-primary" />
                Test ZKP Integration
              </CardTitle>
              <CardDescription>
                Try out ZKP verification functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <Button asChild className="md:flex-1">
                  <Link href="/developer/zkp/identity-test">
                    Test Identity Verification
                  </Link>
                </Button>
                <Button asChild variant="outline" className="md:flex-1">
                  <Link href="/developer/zkp/reputation-test">
                    Test Reputation Proof
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="h-5 w-5 mr-2 text-primary" />
                Recent Verifications
              </CardTitle>
              <CardDescription>
                Latest ZKP verification activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentVerifications.map((verification) => (
                  <div key={verification.id} className="border-b pb-3 last:border-b-0 last:pb-0">
                    <div className="flex justify-between mb-1">
                      <div className="font-medium">{verification.type.charAt(0).toUpperCase() + verification.type.slice(1)} Verification</div>
                      <Badge variant={verification.status === "verified" ? "success" : "outline"}>
                        {verification.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      User ID: {verification.userId}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(verification.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                View All Activity
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary" />
                ZKP Circuit Status
              </CardTitle>
              <CardDescription>
                Current status of deployed circuits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <div className="text-sm">Identity Circuit</div>
                  <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                    Active
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <div className="text-sm">Reputation Circuit</div>
                  <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                    Active
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <div className="text-sm">Credential Circuit</div>
                  <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                    Active
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <div className="text-sm">Profile Proof Circuit</div>
                  <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                    Active
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}