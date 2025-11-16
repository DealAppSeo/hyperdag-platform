import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "wouter";
import {
  ExternalLink,
  ArrowRight,
  Code,
  Check,
  Server,
  Globe,
  Shield,
  Puzzle
} from "lucide-react";

import integrationSdk from "@/sdk/hyperdag-integration";

export default function IntegrationDemoPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const runIntegrationTest = async () => {
    setIsLoading(true);
    
    try {
      // Use our integration SDK to run a cross-platform test
      const results = await integrationSdk.verifySBTAcrossPlatforms(
        "sbt-test-123", 
        ["huggingface", "lovable", "replit"]
      );
      
      setTestResults(results);
      
      toast({
        title: "Integration Test Complete",
        description: "SBT verification test across platforms was successful!",
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "An error occurred running the test",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Integration Demo</h1>
        <p className="text-gray-600 mb-6">
          Test and explore HyperDAG's integration capabilities with external platforms.
        </p>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="test">Run Test</TabsTrigger>
            <TabsTrigger value="code">Sample Code</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>HyperDAG Integration SDK</CardTitle>
                  <CardDescription>
                    Seamlessly integrate HyperDAG's core features with your platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">
                    Our integration SDK provides tools to verify Soulbound Tokens (SBTs), check reputation scores,
                    and enable cross-platform identity verification with privacy protection.
                  </p>
                  
                  <ul className="space-y-3">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>SBT Verification and Credential Management</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Dynamic Reputation Score Validation</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span>Zero-Knowledge Proof Integration</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button asChild variant="outline" className="mr-2">
                    <a href="https://github.com/topics/blockchain" target="_blank" rel="noopener noreferrer" className="flex items-center">
                      <span>GitHub Projects</span>
                      <ExternalLink className="h-4 w-4 ml-1" />
                    </a>
                  </Button>
                  <Button asChild>
                    <Link to="/developer/platform-compatibility" className="flex items-center">
                      <span>Compatibility Checker</span>
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 text-blue-600 mr-2" />
                      <CardTitle className="text-lg">Privacy-First Approach</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      All integrations use Zero-Knowledge Proofs to verify credentials without revealing sensitive user data.
                      Your platform can verify a user's reputation without accessing their identity.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center">
                      <Puzzle className="h-5 w-5 text-purple-600 mr-2" />
                      <CardTitle className="text-lg">Multiple Integration Options</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      Choose from API-based integration, SDK implementation, or widget embedding to suit your platform's needs.
                      Each approach provides the same core capabilities with different levels of customization.
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center">
                      <Globe className="h-5 w-5 text-green-600 mr-2" />
                      <CardTitle className="text-lg">Cross-Platform Compatibility</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">
                      Verified credentials work seamlessly across all supported platforms. A user's reputation and SBTs
                      can be verified regardless of where they were originally issued.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div className="mt-8 flex justify-center">
              <Link to="/developer/platform-compatibility">
                <Button size="lg" className="flex items-center">
                  <span>Check Your Platform's Compatibility</span>
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </TabsContent>
          
          <TabsContent value="test" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Run Integration Test</CardTitle>
                <CardDescription>
                  Test SBT verification across multiple platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-6">
                  This demo will test the verification of a sample Soulbound Token (SBT) across multiple platforms
                  using the HyperDAG Integration SDK. It demonstrates how a user's credentials can be verified
                  seamlessly across the ecosystem.
                </p>
                
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <Server className="h-5 w-5 mr-2 text-blue-600" />
                    Cross-Platform SBT Verification
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Click the button below to run a test that verifies a sample SBT across Hugging Face, Lovable, and Replit platforms.
                  </p>
                  
                  <Button 
                    onClick={runIntegrationTest}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Running test...
                      </span>
                    ) : (
                      "Run SBT Verification Test"
                    )}
                  </Button>
                </div>
                
                {testResults && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Test Results</h3>
                    <div className="bg-white border rounded-lg overflow-hidden">
                      {Object.entries(testResults).map(([platform, result]: [string, any]) => (
                        <div key={platform} className="border-b last:border-b-0">
                          <div className="p-4">
                            <div className="flex justify-between items-center mb-2">
                              <h4 className="font-medium capitalize">{platform}</h4>
                              <span className={`text-sm px-2 py-1 rounded-full ${
                                result.verified 
                                  ? "bg-green-100 text-green-800" 
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {result.verified ? "Verified" : "Failed"}
                              </span>
                            </div>
                            {result.verified && (
                              <p className="text-sm text-gray-600">
                                Verification timestamp: {result.metadata?.timestamp || "N/A"}
                              </p>
                            )}
                            {!result.verified && result.error && (
                              <p className="text-sm text-red-600">
                                Error: {result.error}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="text-blue-800 font-medium mb-2">Next Steps</h4>
                      <p className="text-blue-700 text-sm">
                        Now that you've verified the SBT works across platforms, you can:
                      </p>
                      <ul className="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
                        <li>Implement the SDK in your own platform</li>
                        <li>Try the integration with your real SBTs</li>
                        <li>Set up webhook notifications for real-time updates</li>
                      </ul>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("overview")}>
                  Back to Overview
                </Button>
                <Button asChild>
                  <Link to="/developer/platform-compatibility">
                    Check Platform Compatibility
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="code" className="pt-4">
            <Card>
              <CardHeader>
                <CardTitle>Integration Code Samples</CardTitle>
                <CardDescription>
                  Example code to implement HyperDAG integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                      <Code className="h-5 w-5 mr-2 text-blue-600" />
                      SDK Installation
                    </h3>
                    <div className="bg-gray-900 text-gray-100 rounded-md p-4 font-mono text-sm">
                      <pre>{`# Using npm
npm install @hyperdag/sdk

# Using yarn
yarn add @hyperdag/sdk`}</pre>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                      <Code className="h-5 w-5 mr-2 text-blue-600" />
                      Basic Integration Example
                    </h3>
                    <div className="bg-gray-900 text-gray-100 rounded-md p-4 font-mono text-sm overflow-auto">
                      <pre>{`import { HyperDAG } from '@hyperdag/sdk';

// Initialize the SDK with your API key
const hyperdag = new HyperDAG({
  apiKey: 'your-api-key',
  platform: 'your-platform-id'
});

// Verify a Soulbound Token (SBT)
async function verifySBT(sbtId) {
  try {
    const result = await hyperdag.sbt.verify(sbtId);
    if (result.verified) {
      console.log('SBT verified successfully!');
      console.log('Metadata:', result.metadata);
      return true;
    } else {
      console.error('SBT verification failed');
      return false;
    }
  } catch (error) {
    console.error('Error verifying SBT:', error);
    return false;
  }
}`}</pre>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                      <Code className="h-5 w-5 mr-2 text-blue-600" />
                      Reputation Score Verification
                    </h3>
                    <div className="bg-gray-900 text-gray-100 rounded-md p-4 font-mono text-sm overflow-auto">
                      <pre>{`// Check a user's reputation score
async function checkReputationScore(userId, category = 'general') {
  try {
    const result = await hyperdag.reputation.getScore(userId, {
      category,
      withProof: true // Include Zero-Knowledge Proof
    });
    
    console.log(\`Reputation score: \${result.score}/100\`);
    console.log(\`Verified: \${result.verified}\`);
    
    // Verify the ZK proof
    const proofValid = await hyperdag.zkp.verifyProof(result.proof);
    console.log(\`Proof validation: \${proofValid ? 'Success' : 'Failed'}\`);
    
    return result;
  } catch (error) {
    console.error('Error checking reputation:', error);
    return null;
  }
}`}</pre>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-2 flex items-center">
                      <Code className="h-5 w-5 mr-2 text-blue-600" />
                      Cross-Platform Integration
                    </h3>
                    <div className="bg-gray-900 text-gray-100 rounded-md p-4 font-mono text-sm overflow-auto">
                      <pre>{`// Check SBT verification across platforms
async function checkCrossPlatformVerification(sbtId, platforms = []) {
  try {
    const results = await hyperdag.sbt.verifyAcrossPlatforms(sbtId, platforms);
    
    // Log results for each platform
    for (const [platform, result] of Object.entries(results)) {
      console.log(\`\${platform}: \${result.verified ? 'Verified' : 'Failed'}\`);
      if (result.verified) {
        console.log(\`  Timestamp: \${result.metadata.timestamp}\`);
      } else if (result.error) {
        console.log(\`  Error: \${result.error}\`);
      }
    }
    
    return results;
  } catch (error) {
    console.error('Cross-platform verification error:', error);
    return {};
  }
}`}</pre>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab("overview")}>
                  Back to Overview
                </Button>
                <Button asChild>
                  <a href="https://github.com/topics/blockchain" target="_blank" rel="noopener noreferrer" className="flex items-center">
                    <span>Full Documentation</span>
                    <ExternalLink className="h-4 w-4 ml-1" />
                  </a>
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-blue-800 mb-2">Ready to Test Your Platform?</h2>
          <p className="text-blue-700 mb-4">
            Use our Platform Compatibility Checker to see how well your platform works with HyperDAG's
            integration tools and features.
          </p>
          <Link to="/developer/platform-compatibility">
            <Button size="lg" className="w-full md:w-auto">
              Check Platform Compatibility
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}