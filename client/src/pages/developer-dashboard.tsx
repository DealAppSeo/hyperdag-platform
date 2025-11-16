import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
// Removed Layout import - using main app Layout
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BookOpen, Code, Download, ExternalLink, FileCode, FilePlus, FileText, Key, Lock, Package, Server, Terminal } from 'lucide-react';
import { ApiIntegrationManager } from '@/components/developer/api-integration-manager';

// Using environment variable for developer dashboard access
// The actual check happens on the server side

export default function DeveloperDashboard() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('sdks');
  const [, setLocation] = useLocation();

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const response = await fetch('/api/developer/auth-status');
        const data = await response.json();
        
        if (data.success && data.authenticated) {
          setIsAuthenticated(true);
        } else {
          // Fall back to local storage for existing users
          const devDashboardAuthed = localStorage.getItem('dev_dashboard_auth');
          if (devDashboardAuthed === 'true') {
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        // Fall back to local storage
        const devDashboardAuthed = localStorage.getItem('dev_dashboard_auth');
        if (devDashboardAuthed === 'true') {
          setIsAuthenticated(true);
        }
      }
    };
    
    checkAuthStatus();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/developer/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
        credentials: 'include'
      });
      
      if (response.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('dev_dashboard_auth', 'true');
        setError('');
      } else {
        const data = await response.json();
        setError(data.message || 'Invalid password. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Authentication failed. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/developer/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    // Always clean up local state, even if server request fails
    setIsAuthenticated(false);
    localStorage.removeItem('dev_dashboard_auth');
    setPassword('');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <Lock className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-center">Developer Portal</CardTitle>
            <CardDescription className="text-center">
              Enter the password to access development resources.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter dashboard password"
                  />
                </div>
                {error && (
                  <div className="text-sm text-red-500">
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full">
                  Access Dashboard
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-gray-500">
            Authorized developers only. Contact the team for access.
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">HyperDAG Developer Dashboard</h1>
          <p className="text-gray-500 mt-2">Resources, SDKs, and documentation for developers</p>
        </div>

        <Alert className="mb-8">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Developer Preview</AlertTitle>
          <AlertDescription>
            These APIs and SDKs are in active development. Features may change without notice.
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-5">
            <TabsTrigger value="sdks" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>SDKs & Downloads</span>
            </TabsTrigger>
            <TabsTrigger value="apis" className="flex items-center gap-2">
              <Server className="h-4 w-4" />
              <span>APIs</span>
            </TabsTrigger>
            <TabsTrigger value="ai-tools" className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <path d="M12 2a8 8 0 0 0-8 8c0 5.2 7 12 8 12s8-6.8 8-12a8 8 0 0 0-8-8Z"></path>
                <path d="M16 8h-4V4"></path>
                <path d="M8 12h10"></path>
              </svg>
              <span>AI Tools</span>
            </TabsTrigger>
            <TabsTrigger value="docs" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span>Dev Docs</span>
            </TabsTrigger>
            <TabsTrigger value="examples" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              <span>Examples</span>
            </TabsTrigger>
          </TabsList>

          {/* SDKs Tab */}
          <TabsContent value="sdks" className="space-y-6">
            <div className="mb-6">
              <Alert>
                <Download className="h-4 w-4" />
                <AlertDescription>
                  Complete SDK downloads with SBT (human identity), CBT (nonprofit transparency), DBT (AI/robot identity) integration and ZKP verification.
                </AlertDescription>
              </Alert>
              <div className="mt-4 flex justify-center">
                <Button 
                  size="lg" 
                  onClick={() => setLocation('/developer/sdk-downloads')}
                  className="flex items-center gap-2"
                >
                  <Download className="h-5 w-5" />
                  Go to SDK Downloads Page
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* JavaScript/TypeScript SDK */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCode className="h-5 w-5 text-yellow-400" />
                    JavaScript/TypeScript SDK
                  </CardTitle>
                  <CardDescription>
                    Client library for HyperDAG integration in web applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Badge variant="secondary">v0.3.2-alpha</Badge>
                      <Badge variant="outline" className="ml-2">Node.js</Badge>
                      <Badge variant="outline" className="ml-2">Browser</Badge>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">
                      <code>npm install @hyperdag/sdk</code>
                    </div>
                    <div className="text-sm">
                      <p>Key features:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>DAG Node Management</li>
                        <li>Transaction Creation</li>
                        <li>Wallet Integration</li>
                        <li>Reputation Systems</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => setLocation('/developer/sdk-downloads')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download SDK
                  </Button>
                </CardFooter>
              </Card>

              {/* Python SDK */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCode className="h-5 w-5 text-blue-400" />
                    Python SDK
                  </CardTitle>
                  <CardDescription>
                    Python client for data analysis and backend integration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Badge variant="secondary">v0.2.8-alpha</Badge>
                      <Badge variant="outline" className="ml-2">Python 3.8+</Badge>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">
                      <code>pip install hyperdag-sdk</code>
                    </div>
                    <div className="text-sm">
                      <p>Key features:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>Data Processing</li>
                        <li>AI Integration</li>
                        <li>Bacalhau Compute Jobs</li>
                        <li>Zero-Knowledge Proofs</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => setLocation('/developer/sdk-downloads')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download SDK
                  </Button>
                </CardFooter>
              </Card>

              {/* Mobile SDK */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCode className="h-5 w-5 text-green-400" />
                    Mobile SDK
                  </CardTitle>
                  <CardDescription>
                    Native integration for iOS and Android applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Badge variant="secondary">v0.1.5-alpha</Badge>
                      <Badge variant="outline" className="ml-2">iOS</Badge>
                      <Badge variant="outline" className="ml-2">Android</Badge>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">
                      <code># iOS via CocoaPods</code><br />
                      <code>pod 'HyperDAGSDK'</code><br />
                      <code># Android via Gradle</code><br />
                      <code>implementation 'com.hyperdag:sdk:0.1.5'</code>
                    </div>
                    <div className="text-sm">
                      <p>Key features:</p>
                      <ul className="list-disc pl-5 mt-1 space-y-1">
                        <li>Mobile Wallet Integration</li>
                        <li>Biometric Authentication</li>
                        <li>Offline Transaction Support</li>
                        <li>Push Notifications</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    onClick={() => setLocation('/developer/sdk-downloads')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download SDK
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          {/* APIs Tab */}
          <TabsContent value="apis" className="space-y-6">
            <div className="space-y-6">
              {/* API Keys Card */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5 text-primary" />
                    API Keys
                  </CardTitle>
                  <CardDescription>
                    Manage your API keys for HyperDAG services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">
                    Create, view, and manage API keys to authenticate your applications with HyperDAG services.
                    These keys are required to access resources like storage, identity, and AI services.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={() => setLocation('/developer/api-keys')}
                    className="w-full flex items-center gap-2"
                  >
                    <Key className="h-4 w-4" />
                    Manage API Keys
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Import API Integration Manager component */}
              <ApiIntegrationManager />
            </div>
          </TabsContent>

          {/* AI Tools Tab */}
          <TabsContent value="ai-tools" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
                      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
                      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
                    </svg>
                    AI Workflow
                  </CardTitle>
                  <CardDescription>
                    Code analysis and AI assistance with provider redundancy
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Badge variant="secondary">v0.2.1-beta</Badge>
                      <Badge variant="outline" className="ml-2">OpenAI</Badge>
                      <Badge variant="outline" className="ml-2">Anthropic</Badge>
                    </div>
                    <p className="text-sm">
                      AI-powered code analysis and assistance with automatic provider redundancy. 
                      Analyze code for security vulnerabilities and performance issues or get personalized 
                      answers to your technical questions.
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => setLocation('/ai-workflow')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14"></path>
                      <path d="m12 5 7 7-7 7"></path>
                    </svg>
                    Try AI Workflow
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                      <circle cx="12" cy="12" r="10"></circle>
                      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
                      <path d="M12 18V6"></path>
                    </svg>
                    AI Grant Matching
                  </CardTitle>
                  <CardDescription>
                    Match your project with relevant grant opportunities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Badge variant="secondary">v0.1.4-alpha</Badge>
                      <Badge variant="outline" className="ml-2">Perplexity</Badge>
                    </div>
                    <p className="text-sm">
                      AI-powered grant matching tool that analyzes your project details and 
                      matches them with relevant grant opportunities from our database of Web3 
                      and AI funding sources.
                    </p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => setLocation('/grant-matching')}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14"></path>
                      <path d="m12 5 7 7-7 7"></path>
                    </svg>
                    Find Grants
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          {/* Documentation Tab */}
          <TabsContent value="docs" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Getting Started
                  </CardTitle>
                  <CardDescription>
                    Introduction to HyperDAG and core concepts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="text-sm">
                      <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Introduction to HyperDAG
                      </a>
                    </li>
                    <li className="text-sm">
                      <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Core Concepts and Architecture
                      </a>
                    </li>
                    <li className="text-sm">
                      <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Setting Up Your Environment
                      </a>
                    </li>
                    <li className="text-sm">
                      <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        First Steps with HyperDAG
                      </a>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="outline">
                    <BookOpen className="mr-2 h-4 w-4" />
                    View Documentation
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Technical Guides
                  </CardTitle>
                  <CardDescription>
                    In-depth technical documentation and tutorials
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="text-sm">
                      <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Hybrid DAG/Blockchain Architecture
                      </a>
                    </li>
                    <li className="text-sm">
                      <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Working with Distributed Compute
                      </a>
                    </li>
                    <li className="text-sm">
                      <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Implementing Zero-Knowledge Proofs
                      </a>
                    </li>
                    <li className="text-sm">
                      <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        RepID: Reputation System Integration
                      </a>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="outline">
                    <BookOpen className="mr-2 h-4 w-4" />
                    View Guides
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Reference
                  </CardTitle>
                  <CardDescription>
                    API references, SDK documentation, and specifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    <li className="text-sm">
                      <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        JavaScript SDK Reference
                      </a>
                    </li>
                    <li className="text-sm">
                      <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        Python SDK Reference
                      </a>
                    </li>
                    <li className="text-sm">
                      <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        REST API Specification
                      </a>
                    </li>
                    <li className="text-sm">
                      <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        GraphQL Schema Documentation
                      </a>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="outline">
                    <BookOpen className="mr-2 h-4 w-4" />
                    View Reference
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <div className="mt-8">
              <Card>
                <CardHeader>
                  <CardTitle>White Papers and Technical Reports</CardTitle>
                  <CardDescription>Academic and technical documentation about HyperDAG's architecture</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        HyperDAG Technical White Paper
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">Comprehensive overview of the HyperDAG architecture and technical specifications</p>
                      <Button variant="ghost" size="sm" className="mt-2">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                    </div>

                    <div className="border rounded p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Hybrid DAG/Blockchain Consensus Model
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">Technical details on HyperDAG's novel consensus mechanism and validation protocols</p>
                      <Button variant="ghost" size="sm" className="mt-2">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                    </div>

                    <div className="border rounded p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        RepID: Decentralized Reputation System
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">Academic paper on HyperDAG's reputation scoring algorithms and privacy features</p>
                      <Button variant="ghost" size="sm" className="mt-2">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                    </div>

                    <div className="border rounded p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        HyperCrowd: Decentralized Funding Protocol
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">Technical specification of the crowdfunding and grant matching mechanisms</p>
                      <Button variant="ghost" size="sm" className="mt-2">
                        <Download className="mr-2 h-4 w-4" />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Examples Tab */}
          <TabsContent value="examples" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-primary" />
                    JavaScript/TypeScript Examples
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <h4 className="font-medium">Basic Node Creation</h4>
                      <p className="text-sm text-gray-500 mt-1">Creating and connecting DAG nodes</p>
                      <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm mt-2">
                        <pre>{`import { HyperDAG } from '@hyperdag/sdk';

const client = new HyperDAG('your-api-key');
const node = await client.nodes.create({ data: {...} });
console.log(node.id);`}</pre>
                      </div>
                    </div>

                    <div className="border rounded p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <h4 className="font-medium">Web3 Wallet Integration</h4>
                      <p className="text-sm text-gray-500 mt-1">Connecting with MetaMask wallet</p>
                      <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm mt-2">
                        <pre>{`import { HyperDAG } from '@hyperdag/sdk';

const client = new HyperDAG();
await client.connect.wallet('metamask');
const account = client.wallet.address;
// Sign transaction with wallet
const tx = await client.transaction.create(...);
const result = await tx.sign();`}</pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="outline">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View All JavaScript Examples
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5 text-primary" />
                    Python Examples
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border rounded p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <h4 className="font-medium">AI Integration</h4>
                      <p className="text-sm text-gray-500 mt-1">Using HyperDAG with machine learning models</p>
                      <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm mt-2">
                        <pre>{`from hyperdag import Client
import pandas as pd

# Initialize client
client = Client(api_key="your-api-key")

# Load data from HyperDAG
data = client.data.get("dataset-id")
df = pd.DataFrame(data)

# Process and store results
results = model.predict(df)
client.data.store(results, metadata={...})`}</pre>
                      </div>
                    </div>

                    <div className="border rounded p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <h4 className="font-medium">Bacalhau Compute Job</h4>
                      <p className="text-sm text-gray-500 mt-1">Running distributed computation tasks</p>
                      <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm mt-2">
                        <pre>{`from hyperdag import Client

# Initialize client
client = Client(api_key="your-api-key")

# Define compute job
job = client.compute.create_job(
    image="python:3.9",
    command=["python", "-c", "..."],
    inputs=[{"name": "data", "source": "ipfs://..."}]
)

# Wait for results
results = client.compute.get_results(job.id)`}</pre>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full" variant="outline">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View All Python Examples
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Complete Example Projects</CardTitle>
                <CardDescription>Fully functional applications built with HyperDAG</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <h4 className="font-medium">Decentralized Collaboration App</h4>
                    <p className="text-sm text-gray-500 mt-1">Web application for team collaboration using RepID</p>
                    <div className="flex mt-2 space-x-2">
                      <Badge variant="outline">JavaScript</Badge>
                      <Badge variant="outline">React</Badge>
                      <Badge variant="outline">HyperDAG SDK</Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="mt-2">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Repository
                    </Button>
                  </div>

                  <div className="border rounded p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <h4 className="font-medium">AI Data Analysis Pipeline</h4>
                    <p className="text-sm text-gray-500 mt-1">ML pipeline using HyperDAG for data storage and Bacalhau for compute</p>
                    <div className="flex mt-2 space-x-2">
                      <Badge variant="outline">Python</Badge>
                      <Badge variant="outline">TensorFlow</Badge>
                      <Badge variant="outline">Bacalhau</Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="mt-2">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Repository
                    </Button>
                  </div>

                  <div className="border rounded p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <h4 className="font-medium">Mobile Wallet App</h4>
                    <p className="text-sm text-gray-500 mt-1">Cross-platform mobile wallet for HyperDAG transactions</p>
                    <div className="flex mt-2 space-x-2">
                      <Badge variant="outline">React Native</Badge>
                      <Badge variant="outline">Mobile SDK</Badge>
                      <Badge variant="outline">Biometrics</Badge>
                    </div>
                    <Button variant="ghost" size="sm" className="mt-2">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Repository
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}
