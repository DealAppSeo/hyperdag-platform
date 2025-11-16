import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, AlertCircle, CheckCircle, TerminalIcon, KeyIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ApiTestingPage() {
  const [apiKey, setApiKey] = useState("");
  const [endpoint, setEndpoint] = useState("/api/external/status");
  const [method, setMethod] = useState("GET");
  const [requestBody, setRequestBody] = useState("");
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
  };

  const handleEndpointSelect = (value: string) => {
    setEndpoint(value);
    if (value === "/api/external/status" || value === "/api/external/verify-key") {
      setMethod("GET");
      setRequestBody("");
    } else if (value === "/api/external/sbt/metadata/:tokenId") {
      setMethod("GET");
      setRequestBody(JSON.stringify({ tokenId: "123" }));
    } else {
      setMethod("POST");
      if (value === "/api/external/zkp/verify-reputation") {
        setRequestBody(JSON.stringify({
          proof: "zk-proof-sample-data",
          threshold: 10
        }, null, 2));
      } else if (value === "/api/external/sbt/verify-ownership") {
        setRequestBody(JSON.stringify({
          tokenId: "123",
          proof: "sbt-ownership-proof-sample"
        }, null, 2));
      }
    }
  };

  const handleMethodChange = (value: string) => {
    setMethod(value);
  };

  const handleRequestBodyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRequestBody(e.target.value);
  };

  const sendRequest = async () => {
    setIsLoading(true);
    setError("");
    setResponse(null);

    try {
      let url = endpoint;
      let body = undefined;

      // Handle token ID parameter in URL
      if (endpoint === "/api/external/sbt/metadata/:tokenId") {
        try {
          const reqData = JSON.parse(requestBody);
          url = `/api/external/sbt/metadata/${reqData.tokenId}`;
        } catch (parseError) {
          setError("Invalid JSON in request body");
          setIsLoading(false);
          return;
        }
      } else if (method === "POST") {
        try {
          body = JSON.parse(requestBody);
        } catch (parseError) {
          setError("Invalid JSON in request body");
          setIsLoading(false);
          return;
        }
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }

      const fetchOptions: RequestInit = {
        method,
        headers,
        ...(body && { body: JSON.stringify(body) })
      };

      const response = await fetch(url, fetchOptions);
      const data = await response.json();
      
      setResponse({
        status: response.status,
        data
      });
    } catch (error) {
      console.error('API request error:', error);
      setError(error.message || 'Failed to make API request');
    } finally {
      setIsLoading(false);
    }
  };

  const prettifyJson = (json: any) => {
    try {
      return JSON.stringify(json, null, 2);
    } catch (e) {
      return json;
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-2">HyperDAG API Testing Console</h1>
      <p className="text-muted-foreground mb-6">
        Use this console to test the HyperDAG API endpoints for ZKP and SBT verification.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <KeyIcon size={18} />
                API Key
              </CardTitle>
              <CardDescription>
                Enter your API key to authenticate requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Enter your API key"
                value={apiKey}
                onChange={handleApiKeyChange}
              />
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TerminalIcon size={18} />
                Request
              </CardTitle>
              <CardDescription>
                Configure your API request
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="endpoint">Endpoint</Label>
                <Select
                  value={endpoint}
                  onValueChange={handleEndpointSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an endpoint" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="/api/external/status">
                      GET /api/external/status
                    </SelectItem>
                    <SelectItem value="/api/external/verify-key">
                      GET /api/external/verify-key
                    </SelectItem>
                    <SelectItem value="/api/external/zkp/verify-reputation">
                      POST /api/external/zkp/verify-reputation
                    </SelectItem>
                    <SelectItem value="/api/external/sbt/metadata/:tokenId">
                      GET /api/external/sbt/metadata/:tokenId
                    </SelectItem>
                    <SelectItem value="/api/external/sbt/verify-ownership">
                      POST /api/external/sbt/verify-ownership
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="method">Method</Label>
                <Select
                  value={method}
                  onValueChange={handleMethodChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(method === "POST" || endpoint === "/api/external/sbt/metadata/:tokenId") && (
                <div className="space-y-2">
                  <Label htmlFor="requestBody">Request Body</Label>
                  <Textarea
                    rows={6}
                    placeholder="Enter request JSON"
                    value={requestBody}
                    onChange={handleRequestBodyChange}
                    className="font-mono text-sm"
                  />
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                onClick={sendRequest} 
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? "Sending..." : "Send Request"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <InfoIcon size={18} />
                Response
              </CardTitle>
              <CardDescription>
                API response will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {response && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={response.status < 400 ? "outline" : "destructive"}>
                      Status: {response.status}
                    </Badge>
                    {response.status < 400 && (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        <span className="text-sm">Success</span>
                      </div>
                    )}
                  </div>
                  <div className="rounded-md bg-muted p-4 overflow-auto">
                    <pre className="text-sm font-mono whitespace-pre text-wrap">
                      {prettifyJson(response.data)}
                    </pre>
                  </div>
                </div>
              )}

              {!response && !error && (
                <div className="flex flex-col items-center justify-center h-60 text-muted-foreground">
                  <InfoIcon className="h-12 w-12 mb-2 opacity-20" />
                  <p>Send a request to see the response</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}