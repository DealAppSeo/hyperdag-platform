import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, Info, ShieldAlert, Lock, Network, ArrowRight } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Layout } from "@/components/layout/layout";

// Types for security test results
interface SecurityTestResult {
  success: boolean;
  data?: {
    endpoint: string;
    tests: {
      testName: string;
      vulnerabilityFound: boolean;
      details: string;
      [key: string]: any;
    }[];
    vulnerabilitiesFound: number;
    overallSecure: boolean;
    recommendations: string;
  };
  error?: string;
}

const SecurityTestPage = () => {
  const { toast } = useToast();
  const [testUrl, setTestUrl] = useState("");
  const [activeTab, setActiveTab] = useState("sbt");
  const [verificationMethod, setVerificationMethod] = useState("signature");
  const [proofType, setProofType] = useState("reputation");
  const [useSsl, setUseSsl] = useState(true);
  const [includeToken, setIncludeToken] = useState(false);
  const [testResults, setTestResults] = useState<SecurityTestResult | null>(null);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setTestResults(null);
  };

  // SBT verification test mutation
  const sbtTestMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/security/test-sbt", {
        endpoint: testUrl,
        verificationMethod,
        useSsl
      });
      return await res.json();
    },
    onSuccess: (data: SecurityTestResult) => {
      setTestResults(data);
      if (data.success) {
        toast({
          title: "SBT Security Test Completed",
          description: `Found ${data.data?.vulnerabilitiesFound} vulnerabilities.`,
          variant: data.data?.overallSecure ? "default" : "destructive",
        });
      } else {
        toast({
          title: "Test Failed",
          description: data.error || "Unknown error",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Authentication flow test mutation
  const authTestMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/security/test-auth", {
        endpoint: testUrl,
        includeToken,
        useSsl
      });
      return await res.json();
    },
    onSuccess: (data: SecurityTestResult) => {
      setTestResults(data);
      if (data.success) {
        toast({
          title: "Auth Security Test Completed",
          description: `Found ${data.data?.vulnerabilitiesFound} vulnerabilities.`,
          variant: data.data?.overallSecure ? "default" : "destructive",
        });
      } else {
        toast({
          title: "Test Failed",
          description: data.error || "Unknown error",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // ZKP validation test mutation
  const zkpTestMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/security/test-zkp", {
        endpoint: testUrl,
        proofType,
        useSsl
      });
      return await res.json();
    },
    onSuccess: (data: SecurityTestResult) => {
      setTestResults(data);
      if (data.success) {
        toast({
          title: "ZKP Security Test Completed",
          description: `Found ${data.data?.vulnerabilitiesFound} vulnerabilities.`,
          variant: data.data?.overallSecure ? "default" : "destructive",
        });
      } else {
        toast({
          title: "Test Failed",
          description: data.error || "Unknown error",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Cross-platform integration test mutation
  const crossPlatformTestMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/security/test-cross-platform", {
        endpoint: testUrl,
        includeToken,
        useSsl
      });
      return await res.json();
    },
    onSuccess: (data: SecurityTestResult) => {
      setTestResults(data);
      if (data.success) {
        toast({
          title: "Cross-Platform Security Test Completed",
          description: `Found ${data.data?.vulnerabilitiesFound} vulnerabilities.`,
          variant: data.data?.overallSecure ? "default" : "destructive",
        });
      } else {
        toast({
          title: "Test Failed",
          description: data.error || "Unknown error",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const runSecurityTest = () => {
    if (!testUrl) {
      toast({
        title: "Missing URL",
        description: "Please provide an endpoint URL to test",
        variant: "destructive",
      });
      return;
    }

    setTestResults(null);
    
    switch(activeTab) {
      case "sbt":
        sbtTestMutation.mutate();
        break;
      case "auth":
        authTestMutation.mutate();
        break;
      case "zkp":
        zkpTestMutation.mutate();
        break;
      case "cross-platform":
        crossPlatformTestMutation.mutate();
        break;
    }
  };

  // Create a test result card component
  const SecurityTestResultCard = ({ test }: { test: { testName: string; vulnerabilityFound: boolean; details: string } }) => {
    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-sm font-medium">{test.testName}</CardTitle>
            {test.vulnerabilityFound ? (
              <Badge variant="destructive" className="ml-2">Vulnerable</Badge>
            ) : (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 ml-2">Secure</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground">{test.details}</p>
        </CardContent>
      </Card>
    );
  };
  
  // Loading test results skeleton
  const SecurityTestLoadingSkeleton = () => (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-20 w-full" />
      </CardContent>
    </Card>
  );
  
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <ShieldAlert className="h-6 w-6 mr-2 text-primary" />
          <h1 className="text-2xl font-bold">Security Testing API</h1>
        </div>
        
        <p className="text-muted-foreground mb-6">
          Test the security of your HyperDAG integration endpoints with real penetration testing. 
          These tests will attempt to exploit common security vulnerabilities in your implementation.
        </p>
      
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-5">
            <Card>
              <CardHeader>
                <CardTitle>Security Test Configuration</CardTitle>
                <CardDescription>
                  Configure your security test parameters
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                  <TabsList className="flex flex-wrap mb-6">
                    <TabsTrigger value="sbt" className="flex-grow text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2">
                      <Lock className="h-4 w-4 mr-1 hidden sm:inline" />
                      SBT
                    </TabsTrigger>
                    <TabsTrigger value="auth" className="flex-grow text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2">
                      <ShieldAlert className="h-4 w-4 mr-1 hidden sm:inline" />
                      Auth
                    </TabsTrigger>
                    <TabsTrigger value="zkp" className="flex-grow text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2">
                      <Lock className="h-4 w-4 mr-1 hidden sm:inline" />
                      ZKP
                    </TabsTrigger>
                    <TabsTrigger value="cross-platform" className="flex-grow text-xs sm:text-sm px-2 py-1.5 sm:px-3 sm:py-2">
                      <Network className="h-4 w-4 mr-1 hidden sm:inline" />
                      <span className="whitespace-nowrap">Cross-Platform</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="sbt">
                    <div className="space-y-4">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>SBT Verification Security Test</AlertTitle>
                        <AlertDescription>
                          Tests for vulnerabilities in Soulbound Token verification, including signature bypasses and data modification attacks.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-2">
                        <Label htmlFor="sbt-url">SBT Verification Endpoint URL</Label>
                        <Input 
                          id="sbt-url" 
                          placeholder="api.example.com/verify-sbt" 
                          value={testUrl}
                          onChange={(e) => setTestUrl(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="verification-method">Verification Method</Label>
                        <Select
                          value={verificationMethod}
                          onValueChange={setVerificationMethod}
                        >
                          <SelectTrigger id="verification-method">
                            <SelectValue placeholder="Select verification method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="signature">Digital Signature</SelectItem>
                            <SelectItem value="zkp">Zero-Knowledge Proof</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="ssl" 
                          checked={useSsl}
                          onCheckedChange={setUseSsl}
                        />
                        <Label htmlFor="ssl">Use HTTPS</Label>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="auth">
                    <div className="space-y-4">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Authentication Flow Security Test</AlertTitle>
                        <AlertDescription>
                          Tests for vulnerabilities in authentication flows, focusing on replay attacks and session validation.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-2">
                        <Label htmlFor="auth-url">Authentication Endpoint URL</Label>
                        <Input 
                          id="auth-url" 
                          placeholder="api.example.com/authenticate" 
                          value={testUrl}
                          onChange={(e) => setTestUrl(e.target.value)}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="token" 
                          checked={includeToken}
                          onCheckedChange={setIncludeToken}
                        />
                        <Label htmlFor="token">Include Auth Token in Tests</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="ssl-auth" 
                          checked={useSsl}
                          onCheckedChange={setUseSsl}
                        />
                        <Label htmlFor="ssl-auth">Use HTTPS</Label>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="zkp">
                    <div className="space-y-4">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>ZKP Validation Security Test</AlertTitle>
                        <AlertDescription>
                          Tests for vulnerabilities in Zero-Knowledge Proof validation, including proof forgery and validation bypasses.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-2">
                        <Label htmlFor="zkp-url">ZKP Validation Endpoint URL</Label>
                        <Input 
                          id="zkp-url" 
                          placeholder="api.example.com/validate-zkp" 
                          value={testUrl}
                          onChange={(e) => setTestUrl(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="proof-type">Proof Type</Label>
                        <Select
                          value={proofType}
                          onValueChange={setProofType}
                        >
                          <SelectTrigger id="proof-type">
                            <SelectValue placeholder="Select proof type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="reputation">Reputation Proof</SelectItem>
                            <SelectItem value="identity">Identity Proof</SelectItem>
                            <SelectItem value="custom">Custom ZKP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="ssl-zkp" 
                          checked={useSsl}
                          onCheckedChange={setUseSsl}
                        />
                        <Label htmlFor="ssl-zkp">Use HTTPS</Label>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="cross-platform">
                    <div className="space-y-4">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Cross-Platform Security Test</AlertTitle>
                        <AlertDescription>
                          Tests for vulnerabilities in cross-platform communication, including Man-in-the-Middle (MITM) attacks and transport security.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cross-url">Cross-Platform Endpoint URL</Label>
                        <Input 
                          id="cross-url" 
                          placeholder="api.example.com/platform-integration" 
                          value={testUrl}
                          onChange={(e) => setTestUrl(e.target.value)}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="include-credentials" 
                          checked={includeToken}
                          onCheckedChange={setIncludeToken}
                        />
                        <Label htmlFor="include-credentials">Include Credentials in Tests</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch 
                          id="ssl-cross" 
                          checked={useSsl}
                          onCheckedChange={setUseSsl}
                        />
                        <Label htmlFor="ssl-cross">Use HTTPS</Label>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={runSecurityTest} 
                  className="w-full" 
                  disabled={
                    sbtTestMutation.isPending || 
                    authTestMutation.isPending || 
                    zkpTestMutation.isPending || 
                    crossPlatformTestMutation.isPending
                  }
                >
                  {sbtTestMutation.isPending || 
                   authTestMutation.isPending || 
                   zkpTestMutation.isPending || 
                   crossPlatformTestMutation.isPending ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Running Security Test
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <ShieldAlert className="mr-2 h-5 w-5" />
                      Run Security Test
                    </div>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="md:col-span-7">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Security Test Results</CardTitle>
                <CardDescription>
                  Test results will appear here after running a security test
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow overflow-auto">
                {(sbtTestMutation.isPending || 
                  authTestMutation.isPending || 
                  zkpTestMutation.isPending || 
                  crossPlatformTestMutation.isPending) ? (
                  <div className="space-y-4">
                    <SecurityTestLoadingSkeleton />
                    <SecurityTestLoadingSkeleton />
                    <SecurityTestLoadingSkeleton />
                  </div>
                ) : testResults && testResults.success && testResults.data ? (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-sm font-medium">Endpoint: {testResults.data.endpoint}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Vulnerabilities Found: {testResults.data.vulnerabilitiesFound}
                        </p>
                      </div>
                      {testResults.data.overallSecure ? (
                        <div className="flex items-center">
                          <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                          <span className="text-sm font-medium text-green-700">Secure</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <AlertCircle className="h-6 w-6 text-red-500 mr-2" />
                          <span className="text-sm font-medium text-red-700">Vulnerable</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mb-6">
                      <h3 className="text-sm font-medium mb-2">Recommendations:</h3>
                      <Alert>
                        <AlertDescription className="text-xs">
                          {testResults.data.recommendations}
                        </AlertDescription>
                      </Alert>
                    </div>
                    
                    <h3 className="text-sm font-medium mb-2">Test Details:</h3>
                    <div className="space-y-3">
                      {testResults.data.tests.map((test, index) => (
                        <SecurityTestResultCard key={index} test={test} />
                      ))}
                    </div>
                  </div>
                ) : testResults ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Test Failed</AlertTitle>
                    <AlertDescription>
                      {testResults.error || "An error occurred during the security test"}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <ShieldAlert className="h-16 w-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Tests Run Yet</h3>
                    <p className="text-muted-foreground max-w-md">
                      Configure your security test parameters on the left and click "Run Security Test" to begin.
                    </p>
                    <div className="mt-6 flex flex-col items-center">
                      <h4 className="text-sm font-medium mb-2">Available Security Tests:</h4>
                      <ul className="text-sm text-muted-foreground">
                        <li className="flex items-center mb-2">
                          <ArrowRight className="h-4 w-4 mr-2" />
                          SBT Verification Security Testing
                        </li>
                        <li className="flex items-center mb-2">
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Authentication Flow Security Testing
                        </li>
                        <li className="flex items-center mb-2">
                          <ArrowRight className="h-4 w-4 mr-2" />
                          ZKP Validation Security Testing
                        </li>
                        <li className="flex items-center">
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Cross-Platform Integration Testing
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SecurityTestPage;