import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle2, Copy, ExternalLink, FileCode2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function LovableDevPage() {
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [apiResult, setApiResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  // Function to copy code to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "You can now paste this code into your project.",
    });
  };
  
  // Mock function to simulate API call for verification
  const verifyUser = async () => {
    setLoading(true);
    try {
      // In a real implementation, this would call your actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
      
      // Mock response
      setApiResult({
        success: true,
        data: {
          verified: true,
          username,
          reputationScore: 85,
          sbts: [
            { name: 'Developer', category: 'Skills', issuedAt: '2025-03-15' },
            { name: 'Community Contributor', category: 'Participation', issuedAt: '2025-04-22' }
          ]
        }
      });
      
      toast({
        title: "Verification successful",
        description: `The user ${username} has been verified on HyperDAG.`,
      });
    } catch (error) {
      setApiResult({
        success: false,
        error: "Failed to verify user."
      });
      
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: "Could not verify the user on HyperDAG.",
      });
    } finally {
      setLoading(false);
    }
  };

  const sidebarCode = `// HyperDAG Sidebar Component for Lovable.dev Forum Integration
import React from 'react';

// Define types for navigation items with optional badge
const NavItem = ({ href, icon, text, badge, isActive }) => {
  // Get badge color based on variant
  const getBadgeColor = (variant) => {
    switch (variant) {
      case 'blue': return 'bg-blue-100 text-blue-800';
      case 'green': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Determine if the link is external (to hyperdag.org)
  const isExternalLink = href.includes('hyperdag.org');
  
  return (
    <li className="mb-1">
      <a 
        href={href}
        target={isExternalLink ? "_blank" : undefined}
        rel={isExternalLink ? "noopener noreferrer" : undefined}
        className={\`block px-4 py-2 rounded-md font-medium \${
          isActive 
            ? 'text-white bg-primary' 
            : 'text-gray-700 hover:bg-gray-100'
        }\`}
      >
        <div className="flex items-center">
          {/* Icon rendering code... */}
          <div className="flex items-center">
            {text}
            {badge && (
              <span className={\`ml-2 text-xs px-1.5 py-0.5 rounded-md \${getBadgeColor(badge.variant)}\`}>
                {badge.text}
              </span>
            )}
          </div>
          {isExternalLink && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          )}
        </div>
      </a>
    </li>
  );
};

export default function HyperDAGSidebar({ currentPath }) {
  return null;
}`;

  const verifyUserCode = `// Verify if a user has a valid HyperDAG account
async function verifyHyperDAGUser(username) {
  try {
    const response = await fetch('https://api.hyperdag.org/api/external/verify-user', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username })
    });
    
    const data = await response.json();
    return data.verified;
  } catch (error) {
    console.error('Error verifying user:', error);
    return false;
  }
}`;

  const checkSBTCode = `// Verify if a user owns specific Soulbound Tokens
async function checkSBTOwnership(username, tokenType) {
  try {
    const response = await fetch('https://api.hyperdag.org/api/external/verify-sbt', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, tokenType })
    });
    
    const data = await response.json();
    return data.hasToken;
  } catch (error) {
    console.error('Error checking SBT ownership:', error);
    return false;
  }
}`;

  const getReputationCode = `// Get a user's reputation score
async function getUserReputation(username) {
  try {
    const response = await fetch('https://api.hyperdag.org/api/external/reputation', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_API_KEY',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username })
    });
    
    const data = await response.json();
    return data.reputationScore;
  } catch (error) {
    console.error('Error getting reputation:', error);
    return 0;
  }
}`;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">Lovable.dev Integration</h1>
      <p className="text-gray-600 mb-6">Tools and resources for integrating HyperDAG with Lovable.dev forums.</p>
      
      <Tabs defaultValue="sidebar">
        <TabsList className="mb-6">
          <TabsTrigger value="sidebar">Sidebar Integration</TabsTrigger>
          <TabsTrigger value="api">API Integration</TabsTrigger>
          <TabsTrigger value="testing">Testing Tools</TabsTrigger>
        </TabsList>
        
        {/* Sidebar Integration Tab */}
        <TabsContent value="sidebar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sidebar Component</CardTitle>
                <CardDescription>
                  Easy-to-integrate sidebar component for your Lovable.dev forum.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm text-gray-600 mb-2">This component provides a consistent navigation experience with the main HyperDAG platform.</p>
                  <ul className="mb-4 text-sm space-y-1">
                    <li className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      Opens HyperDAG links in new tabs
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      Uses Tailwind CSS for styling
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                      React-based component
                    </li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => window.open('https://hyperverse-buzz-feed.lovable.app/', '_blank')}>
                  View Demo
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
                <Button onClick={() => copyToClipboard(sidebarCode)}>
                  Copy Code
                  <Copy className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Implementation Guide</CardTitle>
                <CardDescription>
                  Step-by-step instructions for adding the sidebar to your forum.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>Copy the <code className="bg-gray-100 px-1 py-0.5 rounded">hyperdag-sidebar.jsx</code> component to your project</li>
                  <li>Make sure your project includes Tailwind CSS</li>
                  <li>Import the component in your layout:
                    <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-x-auto">
                      {`import HyperDAGSidebar from './path/to/hyperdag-sidebar';`}
                    </pre>
                  </li>
                  <li>Add it to your layout:
                    <pre className="bg-gray-100 p-2 rounded mt-1 text-xs overflow-x-auto">
                      {`<div className="flex min-h-screen">
  <HyperDAGSidebar currentPath={window.location.pathname} />
  <main className="flex-1">{children}</main>
</div>`}
                    </pre>
                  </li>
                  <li>Set your primary color to <code className="bg-gray-100 px-1 py-0.5 rounded">#4F46E5</code> in your Tailwind config</li>
                </ol>
              </CardContent>
              <CardFooter>
                <a 
                  href="/components/lovable-integration/integration-guide.md" 
                  target="_blank" 
                  className="text-primary hover:underline flex items-center"
                >
                  View full integration guide
                  <ExternalLink className="ml-1 h-4 w-4" />
                </a>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
        
        {/* API Integration Tab */}
        <TabsContent value="api">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Verification</CardTitle>
                <CardDescription>
                  Verify if a user has a valid HyperDAG account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <p className="text-sm text-gray-600">Check if a username exists on HyperDAG and get basic profile information.</p>
                </div>
                <div className="bg-gray-900 text-gray-100 p-3 rounded-md text-xs overflow-x-auto">
                  <pre>{verifyUserCode}</pre>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(verifyUserCode)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Code
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>SBT Verification</CardTitle>
                <CardDescription>
                  Check if a user owns specific Soulbound Tokens.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <p className="text-sm text-gray-600">Verify token ownership to enable exclusive features based on credentials.</p>
                </div>
                <div className="bg-gray-900 text-gray-100 p-3 rounded-md text-xs overflow-x-auto">
                  <pre>{checkSBTCode}</pre>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(checkSBTCode)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Code
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Reputation Score</CardTitle>
                <CardDescription>
                  Get a user's reputation score from HyperDAG.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <p className="text-sm text-gray-600">Retrieve reputation score to display trust indicators on user profiles.</p>
                </div>
                <div className="bg-gray-900 text-gray-100 p-3 rounded-md text-xs overflow-x-auto">
                  <pre>{getReputationCode}</pre>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(getReputationCode)}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Code
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Getting API Access</CardTitle>
                <CardDescription>
                  Follow these steps to get your API key for HyperDAG integration.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-md">
                  <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                    <li>Contact <a href="mailto:api@hyperdag.org" className="text-primary hover:underline">api@hyperdag.org</a> with the subject "Lovable.dev API Access"</li>
                    <li>Provide your forum's domain name and a brief description of your integration plans</li>
                    <li>We'll review your request and provide an API key within 1-2 business days</li>
                    <li>Include the API key in all requests using the Authorization header</li>
                    <li>Rate limits are set to 100 requests per minute per API key</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Testing Tools Tab */}
        <TabsContent value="testing">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>User Verification Test</CardTitle>
                <CardDescription>
                  Test the HyperDAG user verification API.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">HyperDAG Username</Label>
                    <Input 
                      id="username" 
                      placeholder="Enter a username to verify" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                  
                  {apiResult && (
                    <div className="mt-4">
                      {apiResult.success ? (
                        <Alert className="bg-green-50 border-green-200">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertTitle className="text-green-800">Verification Successful</AlertTitle>
                          <AlertDescription className="text-green-700">
                            <div className="mt-2">
                              <p><strong>Username:</strong> {apiResult.data.username}</p>
                              <p><strong>Reputation Score:</strong> {apiResult.data.reputationScore}</p>
                              
                              <div className="mt-2">
                                <p className="font-medium">Soulbound Tokens:</p>
                                <div className="flex flex-wrap gap-2 mt-1">
                                  {apiResult.data.sbts.map((sbt: any, index: number) => (
                                    <Badge key={index} variant="outline" className="bg-blue-50 text-blue-800 border-blue-200">
                                      {sbt.name}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Verification Failed</AlertTitle>
                          <AlertDescription>
                            {apiResult.error}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={verifyUser} disabled={!username || loading}>
                  {loading ? "Verifying..." : "Verify User"}
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Implementation Examples</CardTitle>
                <CardDescription>
                  Real-world examples of HyperDAG integration.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm font-semibold mb-2 flex items-center">
                      <FileCode2 className="h-4 w-4 mr-1" />
                      Display Reputation Badge
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">Add a reputation badge to user profiles in your forum:</p>
                    <div className="bg-gray-900 text-gray-100 p-3 rounded-md text-xs overflow-x-auto">
                      <pre>{`// In your user profile component
async function UserProfile({ username }) {
  const reputation = await getUserReputation(username);
  
  let badgeColor = "gray";
  if (reputation > 80) badgeColor = "green";
  else if (reputation > 50) badgeColor = "blue";
  else if (reputation > 30) badgeColor = "yellow";
  
  return (
    <div className="profile">
      <h2>{username}</h2>
      <span className={\`badge \${badgeColor}\`}>
        Reputation: {reputation}
      </span>
    </div>
  );
}`}</pre>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h3 className="text-sm font-semibold mb-2 flex items-center">
                      <FileCode2 className="h-4 w-4 mr-1" />
                      Enable Feature Based on SBT
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">Gate access to features based on SBT ownership:</p>
                    <div className="bg-gray-900 text-gray-100 p-3 rounded-md text-xs overflow-x-auto">
                      <pre>{`// In your forum post component
async function ForumPost({ username, postId }) {
  // Check if user has Moderator SBT
  const hasModerationPrivileges = await checkSBTOwnership(
    username, 
    'Moderator'
  );
  
  return (
    <div className="post">
      {/* Post content */}
      
      {hasModerationPrivileges && (
        <div className="mod-controls">
          <button>Pin Post</button>
          <button>Mark as Solution</button>
        </div>
      )}
    </div>
  );
}`}</pre>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}