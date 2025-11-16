import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileDown } from 'lucide-react';

export function LovableDevResponse() {
  const handleDownloadGuide = () => {
    // Create a link to download the guide
    const link = document.createElement('a');
    link.href = '/docs/lovable-dev-integration-guide.md';
    link.download = 'hyperdag-integration-guide.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">HyperDAG Integration For lovable.dev</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-700 mb-4">
            Thank you for your interest in integrating with HyperDAG's ZKP reputation system! We've prepared a comprehensive guide and code samples to help you implement the connection testing widget and other required components.
          </p>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 my-4">
            <h3 className="font-medium text-blue-800 mb-2">Integration Package Contents</h3>
            <ul className="list-disc pl-5 space-y-1 text-blue-800">
              <li>Connection testing widget implementation</li>
              <li>Configuration settings for API endpoints</li>
              <li>Backend integration code samples</li>
              <li>Frontend SDK integration examples</li>
              <li>Webhook handler implementation</li>
              <li>Troubleshooting guide</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleDownloadGuide} className="w-full">
            <FileDown className="mr-2 h-4 w-4" />
            Download Integration Guide
          </Button>
        </CardFooter>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Implementation Steps Overview</h2>
        <Tabs defaultValue="setup" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="setup">Initial Setup</TabsTrigger>
            <TabsTrigger value="widget">Connection Widget</TabsTrigger>
            <TabsTrigger value="keys">API Keys</TabsTrigger>
          </TabsList>
          
          <TabsContent value="setup">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-2">1. Install Dependencies</h3>
                <div className="bg-gray-100 p-3 rounded text-xs font-mono mb-4">
                  npm install @hyperdag/sdk @hyperdag/react
                </div>
                
                <h3 className="font-medium mb-2">2. Import the SDK</h3>
                <div className="bg-gray-100 p-3 rounded text-xs font-mono mb-4">
                  import {'{HyperDAG}'} from '@hyperdag/sdk';<br />
                  import {'{useHyperDAG}'} from '@hyperdag/react';
                </div>
                
                <h3 className="font-medium mb-2">3. Initialize the SDK</h3>
                <div className="bg-gray-100 p-3 rounded text-xs font-mono">
                  const hyperdag = new HyperDAG(&#123;<br />
                  &nbsp;&nbsp;apiKey: import.meta.env.VITE_HYPERDAG_API_KEY,<br />
                  &nbsp;&nbsp;environment: 'production'<br />
                  &#125;);
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="widget">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-2">Connection Testing Widget</h3>
                <p className="text-sm mb-3">
                  The connection testing widget allows lovable.dev to verify connectivity with HyperDAG API endpoints. 
                  The complete implementation is included in the guide.
                </p>
                
                <h3 className="font-medium mb-2">Key Features</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>Tests authentication endpoints</li>
                  <li>Verifies ZKP generation and verification services</li>
                  <li>Checks forum API connectivity</li>
                  <li>Validates SBT verification services</li>
                  <li>Provides detailed diagnostics for troubleshooting</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="keys">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-2">API Key Registration</h3>
                <p className="text-sm mb-3">
                  To obtain HyperDAG API keys for lovable.dev integration:
                </p>
                
                <ol className="list-decimal pl-5 space-y-1 text-sm">
                  <li>Contact <span className="font-medium">dev-support@hyperdag.org</span> with subject "lovable.dev Integration"</li>
                  <li>Mention you're implementing the HyperVerse-BuzzFeed forum integration</li>
                  <li>Request development API keys with forum, ZKP, and SBT permissions</li>
                  <li>You'll receive both API key and webhook secret via secure channel</li>
                </ol>
                
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 my-4 text-sm">
                  <p className="font-medium text-yellow-800">Important Security Note</p>
                  <p className="text-yellow-800">Never expose your API keys in client-side code. Use environment variables for server-side integration.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="bg-green-50 border border-green-100 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-green-800">Ready to Help</h3>
        <p className="text-green-700">
          Our team is available to assist with any questions during your implementation process. 
          The detailed guide includes complete code examples, troubleshooting tips, and configuration 
          instructions to ensure a smooth integration.
        </p>
      </div>
    </div>
  );
}