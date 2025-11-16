import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, Code, Shield, Zap, CheckCircle, AlertTriangle, ArrowLeft, Home } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Layout } from '@/components/layout/layout';

interface CodeAnalysisResult {
  success: boolean;
  result: {
    success: boolean;
    timestamp?: string;
    security?: {
      vulnerabilities: Array<{
        severity: "critical" | "high" | "medium" | "low";
        description: string;
        location?: string;
        remediation?: string;
      }>;
      overallRisk: "critical" | "high" | "medium" | "low";
      summary: string;
    };
    performance?: {
      issues: Array<{
        type: string;
        description: string;
        impact: "critical" | "high" | "medium" | "low";
        suggestion: string;
      }>;
      overallScore: number;
      recommendations: string[];
    };
    error?: string;
  };
  error?: string;
}

interface AssistanceResult {
  success: boolean;
  result: string;
  error?: string;
}

const AIWorkflowPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [query, setQuery] = useState('');
  const [userLevel, setUserLevel] = useState<'beginner' | 'intermediate' | 'expert'>('intermediate');

  const codeAnalysisMutation = useMutation({
    mutationFn: async (data: { code: string; language: string }) => {
      const response = await apiRequest('POST', '/api/ai-workflow/code-analysis', data);
      return response.json() as Promise<CodeAnalysisResult>;
    },
    onSuccess: () => {
      toast({
        title: "Analysis Complete",
        description: "Your code has been analyzed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const assistanceMutation = useMutation({
    mutationFn: async (data: { query: string; userLevel: string }) => {
      const response = await apiRequest('POST', '/api/ai-workflow/assistance', data);
      return response.json() as Promise<AssistanceResult>;
    },
    onSuccess: () => {
      toast({
        title: "Response Generated",
        description: "Your question has been answered.",
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate assistance. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCodeAnalysis = () => {
    if (!code.trim()) {
      toast({
        title: "Missing Code",
        description: "Please enter some code to analyze.",
        variant: "destructive",
      });
      return;
    }

    codeAnalysisMutation.mutate({ code, language });
  };

  const handleAssistanceRequest = () => {
    if (!query.trim()) {
      toast({
        title: "Missing Query",
        description: "Please enter a question.",
        variant: "destructive",
      });
      return;
    }

    assistanceMutation.mutate({ query, userLevel });
  };

  // Helper function to get color based on severity/impact
  const getSeverityColor = (level: "critical" | "high" | "medium" | "low") => {
    switch (level) {
      case "critical": return "text-red-600 bg-red-100 border-red-200";
      case "high": return "text-orange-600 bg-orange-100 border-orange-200";
      case "medium": return "text-yellow-600 bg-yellow-100 border-yellow-200";
      case "low": return "text-green-600 bg-green-100 border-green-200";
      default: return "text-slate-600 bg-slate-100 border-slate-200";
    }
  };

  const renderSecurityReport = () => {
    const report = codeAnalysisMutation.data?.result?.security;
    
    if (!report) return null;
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" /> Security Analysis
          </h3>
          <div className={`px-2 py-1 rounded-full text-sm font-medium ${getSeverityColor(report.overallRisk)}`}>
            {report.overallRisk.toUpperCase()} Risk
          </div>
        </div>
        
        <Alert>
          <AlertTitle>Summary</AlertTitle>
          <AlertDescription>{report.summary}</AlertDescription>
        </Alert>
        
        {report.vulnerabilities.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-medium">Vulnerabilities Found</h4>
            {report.vulnerabilities.map((vuln, i) => (
              <Card key={i} className={`border-l-4 ${getSeverityColor(vuln.severity)}`}>
                <CardHeader className="py-3">
                  <CardTitle className="text-base flex justify-between">
                    <span>{vuln.severity.toUpperCase()}</span>
                    {vuln.location && <span className="text-sm text-muted-foreground">{vuln.location}</span>}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <p>{vuln.description}</p>
                </CardContent>
                {vuln.remediation && (
                  <CardFooter className="py-2 bg-slate-50">
                    <div>
                      <span className="font-medium">Remediation: </span>
                      {vuln.remediation}
                    </div>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center p-4 text-green-600 bg-green-50 rounded-md">
            <CheckCircle className="mr-2 h-5 w-5" />
            <p>No security vulnerabilities detected!</p>
          </div>
        )}
      </div>
    );
  };

  const renderPerformanceReport = () => {
    const report = codeAnalysisMutation.data?.result?.performance;
    
    if (!report) return null;
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Zap className="h-5 w-5" /> Performance Analysis
          </h3>
          <div className="px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-600">
            Score: {report.overallScore}/100
          </div>
        </div>
        
        {report.issues.length > 0 ? (
          <div className="space-y-3">
            <h4 className="font-medium">Performance Issues</h4>
            {report.issues.map((issue, i) => (
              <Card key={i} className={`border-l-4 ${getSeverityColor(issue.impact)}`}>
                <CardHeader className="py-3">
                  <CardTitle className="text-base">{issue.type}</CardTitle>
                </CardHeader>
                <CardContent className="py-2">
                  <p>{issue.description}</p>
                </CardContent>
                <CardFooter className="py-2 bg-slate-50">
                  <div>
                    <span className="font-medium">Suggestion: </span>
                    {issue.suggestion}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center p-4 text-green-600 bg-green-50 rounded-md">
            <CheckCircle className="mr-2 h-5 w-5" />
            <p>No performance issues detected!</p>
          </div>
        )}
        
        {report.recommendations.length > 0 && (
          <div>
            <h4 className="font-medium">Recommendations</h4>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              {report.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderErrorMessage = () => {
    const error = codeAnalysisMutation.data?.error || codeAnalysisMutation.data?.result?.error;
    
    if (!error) return null;
    
    return (
      <Alert variant="destructive">
        <AlertTitle className="flex items-center">
          <AlertTriangle className="h-4 w-4 mr-2" />
          Analysis Error
        </AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 max-w-6xl">
      
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">AI Workflow</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Redundant AI system that automatically switches between providers for reliability.
            </p>
          </div>

          <Tabs defaultValue="code-analysis">
            <TabsList className="grid grid-cols-2 w-full max-w-[350px]">
              <TabsTrigger value="code-analysis">Code Analysis</TabsTrigger>
              <TabsTrigger value="personal-assistance">Ask AI</TabsTrigger>
            </TabsList>

            <TabsContent value="code-analysis" className="mt-6 space-y-6">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Code Analysis</CardTitle>
                  <CardDescription className="text-xs">
                    Analyze for security vulnerabilities and performance issues
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="flex space-x-2">
                    <Select value={language} onValueChange={(value) => setLanguage(value)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="javascript">JavaScript</SelectItem>
                        <SelectItem value="typescript">TypeScript</SelectItem>
                        <SelectItem value="python">Python</SelectItem>
                        <SelectItem value="rust">Rust</SelectItem>
                        <SelectItem value="go">Go</SelectItem>
                        <SelectItem value="java">Java</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Textarea 
                    placeholder="Paste your code here..." 
                    className="min-h-[200px] text-sm font-mono"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    onClick={handleCodeAnalysis} 
                    disabled={codeAnalysisMutation.isPending}
                    className="ml-auto"
                    size="sm"
                  >
                    {codeAnalysisMutation.isPending && (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    )}
                    Analyze
                  </Button>
                </CardFooter>
              </Card>

              {codeAnalysisMutation.isPending ? (
                <div className="flex flex-col items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                  <p className="text-sm">Analyzing code...</p>
                </div>
              ) : codeAnalysisMutation.isSuccess && (
                <div className="space-y-4">
                  {renderErrorMessage()}
                  
                  {codeAnalysisMutation.data?.result?.security && (
                    <Card className="overflow-hidden">
                      <CardContent className="pt-4 px-4">
                        {renderSecurityReport()}
                      </CardContent>
                    </Card>
                  )}
                  
                  {codeAnalysisMutation.data?.result?.performance && (
                    <Card className="overflow-hidden">
                      <CardContent className="pt-4 px-4">
                        {renderPerformanceReport()}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="personal-assistance" className="mt-6 space-y-6">
              <Card>
                <CardHeader className="py-4">
                  <CardTitle className="text-lg">Ask AI</CardTitle>
                  <CardDescription className="text-xs">
                    Get help with Web3, blockchain, or programming
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <Select value={userLevel} onValueChange={(value: any) => setUserLevel(value)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Experience" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="expert">Expert</SelectItem>
                    </SelectContent>
                  </Select>

                  <Textarea 
                    placeholder="What would you like to know?" 
                    className="min-h-[150px] text-sm"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </CardContent>
                <CardFooter className="pt-0">
                  <Button 
                    onClick={handleAssistanceRequest} 
                    disabled={assistanceMutation.isPending}
                    className="ml-auto"
                    size="sm"
                  >
                    {assistanceMutation.isPending && (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    )}
                    Submit
                  </Button>
                </CardFooter>
              </Card>

              {assistanceMutation.isPending ? (
                <div className="flex flex-col items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                  <p className="text-sm">Generating response...</p>
                </div>
              ) : assistanceMutation.isSuccess && assistanceMutation.data?.result && (
                <Card className="overflow-hidden">
                  <CardContent className="pt-4 px-4">
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      {assistanceMutation.data.result}
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {assistanceMutation.isError && (
                <Alert variant="destructive" className="p-3">
                  <AlertTitle className="flex items-center text-sm">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Error
                  </AlertTitle>
                  <AlertDescription className="text-xs">
                    {assistanceMutation.error?.message || "Failed to generate response. Please try again."}
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default AIWorkflowPage;