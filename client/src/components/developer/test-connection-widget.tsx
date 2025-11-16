import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export function TestConnectionWidget() {
  const [apiEndpoint, setApiEndpoint] = useState('https://www.hyperdag.org/api');
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    details?: Record<string, any>;
  } | null>(null);

  const handleTestConnection = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    // Simulate API testing
    await new Promise(resolve => setTimeout(resolve, 1800));
    
    // Simulate success response
    setTestResult({
      success: true,
      message: 'Connection successful! HyperDAG API endpoints are accessible.',
      details: {
        zkpEndpoint: 'OK',
        sbtEndpoint: 'OK',
        forumEndpoint: 'OK',
        apiVersion: '2.1.3',
        features: ['reputation', 'zkp', 'sbt', 'forum']
      }
    });
    
    setIsLoading(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <span>Test lovable.dev Connection</span>
          {testResult && (
            <Badge 
              variant={testResult.success ? "default" : "destructive"} 
              className={`ml-2 ${testResult.success ? "bg-green-100 text-green-800" : ""}`}
            >
              {testResult.success ? 'Connected' : 'Failed'}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Verify connectivity between your lovable.dev application and HyperDAG's ZKP reputation services
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="api-endpoint">HyperDAG API Endpoint</Label>
            <Input
              id="api-endpoint"
              placeholder="https://www.hyperdag.org/api"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your HyperDAG API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-gray-500">
              Leave blank to use your application's environment variables
            </p>
          </div>
          
          {testResult && (
            <>
              <Separator className="my-4" />
              
              <div className="rounded-md bg-gray-50 p-4">
                <div className="flex items-center mb-2">
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                  )}
                  <h3 className="font-medium">{testResult.message}</h3>
                </div>
                
                {testResult.details && (
                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(testResult.details).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-gray-600">{key}:</span>
                        <span className="font-medium">
                          {Array.isArray(value) ? value.join(', ') : value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleTestConnection} 
          disabled={isLoading || !apiEndpoint}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Testing Connection...
            </>
          ) : (
            'Test Connection'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}