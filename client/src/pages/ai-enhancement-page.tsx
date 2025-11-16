import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { queryClient } from '@/lib/queryClient';
import {
  AlertCircle,
  CheckCircle,
  Code,
  FileCode,
  Shield,
  Zap,
  Brain,
  Users,
  Cpu,
  Loader2,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  ArrowDownToLine,
  Fingerprint,
  LucideIcon
} from 'lucide-react';

// Define schemas for the different forms
const codeAnalysisSchema = z.object({
  code: z.string().min(10, 'Code snippet must be at least 10 characters'),
  language: z.string().min(1, 'Programming language is required'),
});

const securityScanSchema = z.object({
  codebase: z.array(
    z.object({
      fileName: z.string().min(1, 'File name is required'),
      content: z.string().min(1, 'File content is required'),
    })
  ).min(1, 'At least one file is required'),
});

const architectureImprovementSchema = z.object({
  currentArchitecture: z.string().min(50, 'Please provide a detailed description of the current architecture'),
  includePerformanceMetrics: z.boolean().default(false),
  customMetrics: z.string().optional(),
});

const collaborationSchema = z.object({
  taskDescription: z.string().min(20, 'Please provide a detailed task description'),
  agentSpecialities: z.array(z.string()).min(1, 'At least one agent speciality is required'),
});

const personalizedAssistanceSchema = z.object({
  query: z.string().min(5, 'Please enter your question'),
  knowledgeLevel: z.enum(['beginner', 'intermediate', 'expert']).default('intermediate'),
});

// Interface for AI agent status
interface AIAgentStatus {
  isInitialized: boolean;
  capabilities: {
    codeAnalysis: boolean;
    securityScanning: boolean;
    interAgentCommunication: boolean;
    userInteraction: boolean;
    systemOptimization: boolean;
  };
  primaryProvider: 'anthropic' | 'openai' | 'none';
}

// Component for AI Enhancement Page
const AIEnhancementPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('code-analysis');
  const [codeFiles, setCodeFiles] = useState<Array<{ fileName: string; content: string }>>([
    { fileName: '', content: '' },
  ]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>(['code']);

  // Query to fetch AI agent system status
  const {
    data: agentStatus,
    isLoading: isStatusLoading,
    isError: isStatusError,
    refetch: refetchStatus,
  } = useQuery({
    queryKey: ['/api/advanced-ai/status'],
    refetchOnWindowFocus: false,
  });

  // Form setup for code analysis
  const codeAnalysisForm = useForm<z.infer<typeof codeAnalysisSchema>>({
    resolver: zodResolver(codeAnalysisSchema),
    defaultValues: {
      code: '',
      language: 'typescript',
    },
  });

  // Form setup for security scan
  const securityScanForm = useForm<z.infer<typeof securityScanSchema>>({
    resolver: zodResolver(securityScanSchema),
    defaultValues: {
      codebase: [{ fileName: '', content: '' }],
    },
  });

  // Form setup for architecture improvement
  const architectureForm = useForm<z.infer<typeof architectureImprovementSchema>>({
    resolver: zodResolver(architectureImprovementSchema),
    defaultValues: {
      currentArchitecture: '',
      includePerformanceMetrics: false,
      customMetrics: '',
    },
  });

  // Form setup for agent collaboration
  const collaborationForm = useForm<z.infer<typeof collaborationSchema>>({
    resolver: zodResolver(collaborationSchema),
    defaultValues: {
      taskDescription: '',
      agentSpecialities: ['code'],
    },
  });

  // Form setup for personalized assistance
  const assistanceForm = useForm<z.infer<typeof personalizedAssistanceSchema>>({
    resolver: zodResolver(personalizedAssistanceSchema),
    defaultValues: {
      query: '',
      knowledgeLevel: 'intermediate',
    },
  });

  // Mutation for code analysis
  const codeAnalysisMutation = useMutation({
    mutationFn: async (data: z.infer<typeof codeAnalysisSchema>) => {
      const response = await fetch('/api/advanced-ai/analyze-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to analyze code');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Code Analysis Complete',
        description: 'The AI has successfully analyzed your code.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Analysis Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation for security scan
  const securityScanMutation = useMutation({
    mutationFn: async (data: z.infer<typeof securityScanSchema>) => {
      const response = await fetch('/api/advanced-ai/security-scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to scan security');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Security Scan Complete',
        description: `Found ${data.data.vulnerabilities?.length || 0} potential issues.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Security Scan Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation for architecture improvement
  const architectureMutation = useMutation({
    mutationFn: async (data: z.infer<typeof architectureImprovementSchema>) => {
      // Prepare performance metrics if included
      const performanceMetrics = data.includePerformanceMetrics
        ? data.customMetrics
          ? JSON.parse(data.customMetrics)
          : { 
              responseTime: { avg: 150, p95: 300, p99: 450 },
              errorRate: 0.02,
              throughput: 1000,
              resourceUtilization: { cpu: 0.65, memory: 0.72 }
            }
        : {};
      
      const payload = {
        currentArchitecture: data.currentArchitecture,
        performanceMetrics,
      };
      
      const response = await fetch('/api/advanced-ai/architecture-improvement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate architecture improvements');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Architecture Plan Generated',
        description: 'The AI has generated an architecture improvement plan.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Architecture Planning Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation for agent collaboration
  const collaborationMutation = useMutation({
    mutationFn: async (data: z.infer<typeof collaborationSchema>) => {
      const response = await fetch('/api/advanced-ai/collaborate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskDescription: data.taskDescription,
          agentSpecialities: data.agentSpecialities,
          context: {}, // Optional context could be added here
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to collaborate on task');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'AI Collaboration Complete',
        description: `${data.data.contributingAgents?.length || 0} AI agents contributed to the solution.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Collaboration Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Mutation for personalized assistance
  const assistanceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof personalizedAssistanceSchema>) => {
      const response = await fetch('/api/advanced-ai/personalized-assistance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: data.query,
          userHistory: {
            pastInteractions: [],
            knowledgeLevel: data.knowledgeLevel,
            preferences: {},
          },
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate personalized assistance');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'AI Response Generated',
        description: 'The AI has answered your question.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'AI Response Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Handle adding/removing code files for security scan
  const addCodeFile = () => {
    setCodeFiles([...codeFiles, { fileName: '', content: '' }]);
  };

  const removeCodeFile = (index: number) => {
    const updatedFiles = [...codeFiles];
    updatedFiles.splice(index, 1);
    setCodeFiles(updatedFiles);
  };

  const updateCodeFile = (index: number, field: 'fileName' | 'content', value: string) => {
    const updatedFiles = [...codeFiles];
    updatedFiles[index][field] = value;
    setCodeFiles(updatedFiles);
  };

  // Form submit handlers
  const onCodeAnalysisSubmit = (data: z.infer<typeof codeAnalysisSchema>) => {
    codeAnalysisMutation.mutate(data);
  };

  const onSecurityScanSubmit = () => {
    // Filter out empty files
    const validFiles = codeFiles.filter(file => file.fileName && file.content);
    
    if (validFiles.length === 0) {
      toast({
        title: 'Invalid Input',
        description: 'Please add at least one file with content to scan',
        variant: 'destructive',
      });
      return;
    }
    
    securityScanMutation.mutate({ codebase: validFiles });
  };

  const onArchitectureSubmit = (data: z.infer<typeof architectureImprovementSchema>) => {
    architectureMutation.mutate(data);
  };

  const onCollaborationSubmit = () => {
    if (selectedAgents.length === 0) {
      toast({
        title: 'Invalid Selection',
        description: 'Please select at least one agent speciality',
        variant: 'destructive',
      });
      return;
    }
    
    collaborationMutation.mutate({
      taskDescription: collaborationForm.getValues('taskDescription'),
      agentSpecialities: selectedAgents,
    });
  };

  const onAssistanceSubmit = (data: z.infer<typeof personalizedAssistanceSchema>) => {
    assistanceMutation.mutate(data);
  };

  // Helper function to get capability status badge
  const getCapabilityBadge = (isEnabled: boolean) => {
    return isEnabled ? (
      <Badge variant="default" className="bg-green-500">
        <CheckCircle className="h-3 w-3 mr-1" /> Enabled
      </Badge>
    ) : (
      <Badge variant="outline" className="text-gray-500">
        <AlertCircle className="h-3 w-3 mr-1" /> Disabled
      </Badge>
    );
  };

  // Loading state
  if (isStatusLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (isStatusError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <AlertTriangle className="h-5 w-5 mr-2" />
              AI Enhancement System Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              The AI enhancement system is currently unavailable. This might be due to missing API keys or a service
              disruption.
            </p>
            <Button
              onClick={() => refetchStatus()}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract status data
  const status: AIAgentStatus = agentStatus?.data || {
    isInitialized: false,
    capabilities: {
      codeAnalysis: false,
      securityScanning: false,
      interAgentCommunication: false,
      userInteraction: false,
      systemOptimization: false,
    },
    primaryProvider: 'none',
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI Enhancement System</h1>
        <p className="text-gray-600 mb-4">
          Leverage advanced AI agents to enhance code quality, security, and system architecture
        </p>

        {/* Status Card */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Brain className="h-5 w-5 mr-2 text-primary" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Initialization</h3>
                <div className="flex items-center">
                  {status.isInitialized ? (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" /> Initialized
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-red-300 text-red-700">
                      <AlertCircle className="h-3 w-3 mr-1" /> Not Initialized
                    </Badge>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Primary Provider</h3>
                <Badge
                  variant={status.primaryProvider !== 'none' ? 'default' : 'outline'}
                  className={status.primaryProvider === 'anthropic' ? 'bg-blue-500' : status.primaryProvider === 'openai' ? 'bg-green-600' : ''}
                >
                  {status.primaryProvider === 'anthropic' ? 'Anthropic Claude' : 
                   status.primaryProvider === 'openai' ? 'OpenAI GPT-4o' : 'None'}
                </Badge>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Capabilities</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <div className="flex items-center justify-between p-2 border rounded-md">
                  <span className="flex items-center">
                    <Code className="h-4 w-4 mr-1 text-blue-500" />
                    <span className="text-sm">Code Analysis</span>
                  </span>
                  {getCapabilityBadge(status.capabilities.codeAnalysis)}
                </div>
                
                <div className="flex items-center justify-between p-2 border rounded-md">
                  <span className="flex items-center">
                    <Shield className="h-4 w-4 mr-1 text-red-500" />
                    <span className="text-sm">Security Scanning</span>
                  </span>
                  {getCapabilityBadge(status.capabilities.securityScanning)}
                </div>
                
                <div className="flex items-center justify-between p-2 border rounded-md">
                  <span className="flex items-center">
                    <Users className="h-4 w-4 mr-1 text-purple-500" />
                    <span className="text-sm">Agent Collaboration</span>
                  </span>
                  {getCapabilityBadge(status.capabilities.interAgentCommunication)}
                </div>
                
                <div className="flex items-center justify-between p-2 border rounded-md">
                  <span className="flex items-center">
                    <Fingerprint className="h-4 w-4 mr-1 text-green-500" />
                    <span className="text-sm">User Interaction</span>
                  </span>
                  {getCapabilityBadge(status.capabilities.userInteraction)}
                </div>
                
                <div className="flex items-center justify-between p-2 border rounded-md">
                  <span className="flex items-center">
                    <Cpu className="h-4 w-4 mr-1 text-orange-500" />
                    <span className="text-sm">System Optimization</span>
                  </span>
                  {getCapabilityBadge(status.capabilities.systemOptimization)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          <TabsTrigger value="code-analysis" disabled={!status.capabilities.codeAnalysis}>
            <Code className="h-4 w-4 mr-2 inline" />
            <span className="hidden sm:inline">Code Analysis</span>
          </TabsTrigger>
          <TabsTrigger value="security-scan" disabled={!status.capabilities.securityScanning}>
            <Shield className="h-4 w-4 mr-2 inline" />
            <span className="hidden sm:inline">Security Scan</span>
          </TabsTrigger>
          <TabsTrigger value="architecture" disabled={!status.capabilities.systemOptimization}>
            <Cpu className="h-4 w-4 mr-2 inline" />
            <span className="hidden sm:inline">Architecture</span>
          </TabsTrigger>
          <TabsTrigger value="collaboration" disabled={!status.capabilities.interAgentCommunication}>
            <Users className="h-4 w-4 mr-2 inline" />
            <span className="hidden sm:inline">AI Collaboration</span>
          </TabsTrigger>
          <TabsTrigger value="assistance" disabled={!status.capabilities.userInteraction}>
            <Fingerprint className="h-4 w-4 mr-2 inline" />
            <span className="hidden sm:inline">AI Assistant</span>
          </TabsTrigger>
        </TabsList>

        {/* Code Analysis Tab */}
        <TabsContent value="code-analysis">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="h-5 w-5 mr-2 text-blue-500" />
                Code Analysis
              </CardTitle>
              <CardDescription>
                Analyze code for quality issues, security vulnerabilities, and performance improvements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...codeAnalysisForm}>
                <form
                  onSubmit={codeAnalysisForm.handleSubmit(onCodeAnalysisSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={codeAnalysisForm.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Programming Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="typescript">TypeScript</SelectItem>
                            <SelectItem value="javascript">JavaScript</SelectItem>
                            <SelectItem value="python">Python</SelectItem>
                            <SelectItem value="rust">Rust</SelectItem>
                            <SelectItem value="go">Go</SelectItem>
                            <SelectItem value="solidity">Solidity</SelectItem>
                            <SelectItem value="java">Java</SelectItem>
                            <SelectItem value="c++">C++</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={codeAnalysisForm.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code Snippet</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Paste your code here..."
                            className="font-mono h-64"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Paste the code you want to analyze for quality and security issues
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full md:w-auto"
                    disabled={codeAnalysisMutation.isPending}
                  >
                    {codeAnalysisMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Analyze Code
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              {/* Analysis Results */}
              {codeAnalysisMutation.isSuccess && codeAnalysisMutation.data?.data && (
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4">Analysis Results</h3>
                  
                  <div className="mb-6">
                    <div className="flex items-center mb-2">
                      <h4 className="font-medium">Quality Assessment:</h4>
                      <Badge
                        className={`ml-2 ${
                          codeAnalysisMutation.data.data.quality === 'high'
                            ? 'bg-green-500'
                            : codeAnalysisMutation.data.data.quality === 'medium'
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                        }`}
                      >
                        {codeAnalysisMutation.data.data.quality.charAt(0).toUpperCase() +
                          codeAnalysisMutation.data.data.quality.slice(1)}
                      </Badge>
                    </div>
                  </div>
                  
                  <Accordion type="multiple" className="w-full">
                    <AccordionItem value="suggestions">
                      <AccordionTrigger className="text-blue-600">
                        <div className="flex items-center">
                          <Code className="h-4 w-4 mr-2" />
                          Code Quality Suggestions ({codeAnalysisMutation.data.data.suggestions.length})
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {codeAnalysisMutation.data.data.suggestions.map((suggestion: string, index: number) => (
                            <li key={index} className="p-2 bg-blue-50 rounded-md">
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="security">
                      <AccordionTrigger className="text-red-600">
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 mr-2" />
                          Security Issues ({codeAnalysisMutation.data.data.securityIssues.length})
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {codeAnalysisMutation.data.data.securityIssues.map((issue: string, index: number) => (
                            <li key={index} className="p-2 bg-red-50 rounded-md">
                              {issue}
                            </li>
                          ))}
                          {codeAnalysisMutation.data.data.securityIssues.length === 0 && (
                            <li className="p-2 bg-green-50 rounded-md text-green-700">
                              No security issues detected.
                            </li>
                          )}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="performance">
                      <AccordionTrigger className="text-green-600">
                        <div className="flex items-center">
                          <Zap className="h-4 w-4 mr-2" />
                          Performance Improvements ({codeAnalysisMutation.data.data.performanceImprovements.length})
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {codeAnalysisMutation.data.data.performanceImprovements.map(
                            (improvement: string, index: number) => (
                              <li key={index} className="p-2 bg-green-50 rounded-md">
                                {improvement}
                              </li>
                            )
                          )}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Scan Tab */}
        <TabsContent value="security-scan">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-red-500" />
                Security Scanner
              </CardTitle>
              <CardDescription>
                Scan multiple files for security vulnerabilities and receive detailed reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-4">
                  {codeFiles.map((file, index) => (
                    <div key={index} className="p-4 border rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium">File {index + 1}</h3>
                        {index > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeCodeFile(index)}
                            className="h-8 text-red-500 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">File Name</label>
                          <Input
                            value={file.fileName}
                            onChange={(e) => updateCodeFile(index, 'fileName', e.target.value)}
                            placeholder="e.g., server.js"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">File Content</label>
                          <Textarea
                            value={file.content}
                            onChange={(e) => updateCodeFile(index, 'content', e.target.value)}
                            placeholder="Paste your code here..."
                            className="font-mono h-32"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button variant="outline" onClick={addCodeFile} className="w-full">
                    + Add Another File
                  </Button>
                </div>

                <Button
                  onClick={onSecurityScanSubmit}
                  className="w-full md:w-auto"
                  disabled={securityScanMutation.isPending}
                >
                  {securityScanMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <Shield className="mr-2 h-4 w-4" />
                      Run Security Scan
                    </>
                  )}
                </Button>
              </div>

              {/* Security Scan Results */}
              {securityScanMutation.isSuccess && securityScanMutation.data?.data && (
                <div className="mt-8 pt-6 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Security Scan Results</h3>
                    <Badge
                      className={`${
                        securityScanMutation.data.data.overallRisk === 'low'
                          ? 'bg-green-500'
                          : securityScanMutation.data.data.overallRisk === 'medium'
                          ? 'bg-yellow-500'
                          : securityScanMutation.data.data.overallRisk === 'high'
                          ? 'bg-orange-500'
                          : 'bg-red-500'
                      }`}
                    >
                      Overall Risk: {securityScanMutation.data.data.overallRisk.toUpperCase()}
                    </Badge>
                  </div>

                  {securityScanMutation.data.data.vulnerabilities.length === 0 ? (
                    <div className="p-4 bg-green-50 rounded-md text-green-700 flex items-center">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      No vulnerabilities detected! Your code appears to be secure.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {securityScanMutation.data.data.vulnerabilities.map((vuln: any, index: number) => (
                        <div
                          key={index}
                          className={`p-4 rounded-md ${
                            vuln.severity === 'low'
                              ? 'bg-green-50'
                              : vuln.severity === 'medium'
                              ? 'bg-yellow-50'
                              : vuln.severity === 'high'
                              ? 'bg-orange-50'
                              : 'bg-red-50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{vuln.fileName}</h4>
                            <Badge
                              className={`${
                                vuln.severity === 'low'
                                  ? 'bg-green-500'
                                  : vuln.severity === 'medium'
                                  ? 'bg-yellow-500'
                                  : vuln.severity === 'high'
                                  ? 'bg-orange-500'
                                  : 'bg-red-500'
                              }`}
                            >
                              {vuln.severity.toUpperCase()}
                            </Badge>
                          </div>
                          {vuln.lineNumber && (
                            <p className="text-sm text-gray-600 mb-2">Line: {vuln.lineNumber}</p>
                          )}
                          <p className="mb-2 font-medium">{vuln.description}</p>
                          <div className="bg-white p-2 rounded border">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Suggestion:</span> {vuln.suggestion}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Architecture Tab */}
        <TabsContent value="architecture">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Cpu className="h-5 w-5 mr-2 text-orange-500" />
                Architecture Improvement
              </CardTitle>
              <CardDescription>
                Analyze your current architecture and receive AI-generated improvement suggestions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...architectureForm}>
                <form
                  onSubmit={architectureForm.handleSubmit(onArchitectureSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={architectureForm.control}
                    name="currentArchitecture"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Architecture Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe your current architecture, components, interactions, and technologies..."
                            className="h-48"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a detailed description of your current system architecture for analysis
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={architectureForm.control}
                    name="includePerformanceMetrics"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            className="form-checkbox h-4 w-4 text-primary rounded"
                            checked={field.value}
                            onChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Include Performance Metrics</FormLabel>
                          <FormDescription>
                            Add sample performance metrics to enhance analysis
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />

                  {architectureForm.watch('includePerformanceMetrics') && (
                    <FormField
                      control={architectureForm.control}
                      name="customMetrics"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom Performance Metrics (JSON)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder='{"responseTime": {"avg": 150, "p95": 300}, "errorRate": 0.02...}'
                              className="font-mono h-24"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Optional: Provide custom metrics as JSON (leave empty for defaults)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Button
                    type="submit"
                    className="w-full md:w-auto"
                    disabled={architectureMutation.isPending}
                  >
                    {architectureMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Cpu className="mr-2 h-4 w-4" />
                        Generate Improvements
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              {/* Architecture Improvement Results */}
              {architectureMutation.isSuccess && architectureMutation.data?.data && (
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4">Architecture Improvement Plan</h3>
                  
                  <Accordion type="multiple" className="w-full">
                    <AccordionItem value="short-term">
                      <AccordionTrigger className="text-green-600">
                        <div className="flex items-center">
                          <Zap className="h-4 w-4 mr-2" />
                          Short-Term Improvements ({architectureMutation.data.data.shortTermImprovements.length})
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {architectureMutation.data.data.shortTermImprovements.map(
                            (improvement: string, index: number) => (
                              <li key={index} className="p-2 bg-green-50 rounded-md">
                                {improvement}
                              </li>
                            )
                          )}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="long-term">
                      <AccordionTrigger className="text-blue-600">
                        <div className="flex items-center">
                          <ArrowRight className="h-4 w-4 mr-2" />
                          Long-Term Improvements ({architectureMutation.data.data.longTermImprovements.length})
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {architectureMutation.data.data.longTermImprovements.map(
                            (improvement: string, index: number) => (
                              <li key={index} className="p-2 bg-blue-50 rounded-md">
                                {improvement}
                              </li>
                            )
                          )}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="tech-debt">
                      <AccordionTrigger className="text-red-600">
                        <div className="flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Technical Debt Items ({architectureMutation.data.data.technicalDebtItems.length})
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-2">
                          {architectureMutation.data.data.technicalDebtItems.map(
                            (item: string, index: number) => (
                              <li key={index} className="p-2 bg-red-50 rounded-md">
                                {item}
                              </li>
                            )
                          )}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    
                    {architectureMutation.data.data.architectureDiagram && (
                      <AccordionItem value="diagram">
                        <AccordionTrigger className="text-purple-600">
                          <div className="flex items-center">
                            <FileCode className="h-4 w-4 mr-2" />
                            Architecture Diagram
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="p-4 bg-gray-100 rounded-md overflow-x-auto">
                            <pre className="text-xs whitespace-pre">{architectureMutation.data.data.architectureDiagram}</pre>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>

                  <div className="mt-4">
                    <Button onClick={() => navigator.clipboard.writeText(JSON.stringify(architectureMutation.data.data, null, 2))} variant="outline">
                      <ArrowDownToLine className="h-4 w-4 mr-2" />
                      Export as JSON
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Collaboration Tab */}
        <TabsContent value="collaboration">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-purple-500" />
                AI Agent Collaboration
              </CardTitle>
              <CardDescription>
                Harness the power of multiple specialized AI agents working together to solve complex problems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...collaborationForm}>
                <form
                  onSubmit={collaborationForm.handleSubmit(onCollaborationSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={collaborationForm.control}
                    name="taskDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Describe the task or problem you need help with..."
                            className="h-36"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a detailed description of the task for the AI agents to collaborate on
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div>
                    <label className="block text-sm font-medium mb-2">Agent Specialities</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { id: 'code', label: 'Code', icon: Code },
                        { id: 'security', label: 'Security', icon: Shield },
                        { id: 'performance', label: 'Performance', icon: Zap },
                        { id: 'architecture', label: 'Architecture', icon: Cpu },
                        { id: 'database', label: 'Database', icon: Brain },
                        { id: 'ux', label: 'UX/UI', icon: Users },
                        { id: 'testing', label: 'Testing', icon: FileCode },
                        { id: 'deployment', label: 'Deployment', icon: ArrowRight },
                      ].map((agent) => {
                        const Icon = agent.icon;
                        const isSelected = selectedAgents.includes(agent.id);
                        return (
                          <Button
                            key={agent.id}
                            type="button"
                            variant={isSelected ? 'default' : 'outline'}
                            className={`justify-start ${isSelected ? 'bg-primary text-white' : ''}`}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedAgents(selectedAgents.filter((id) => id !== agent.id));
                              } else {
                                setSelectedAgents([...selectedAgents, agent.id]);
                              }
                            }}
                          >
                            <Icon className="h-4 w-4 mr-2" />
                            {agent.label}
                          </Button>
                        );
                      })}
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      Select the specialized agents that should collaborate on this task
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full md:w-auto"
                    disabled={collaborationMutation.isPending}
                  >
                    {collaborationMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Collaborating...
                      </>
                    ) : (
                      <>
                        <Users className="mr-2 h-4 w-4" />
                        Start Collaboration
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              {/* Collaboration Results */}
              {collaborationMutation.isSuccess && collaborationMutation.data?.data && (
                <div className="mt-8 pt-6 border-t">
                  <div className="flex flex-wrap items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Collaboration Results</h3>
                    <div className="flex items-center mt-2 sm:mt-0">
                      <span className="text-sm text-gray-600 mr-2">Confidence:</span>
                      <Progress
                        value={collaborationMutation.data.data.confidenceScore * 100}
                        className="w-24 h-2"
                      />
                      <span className="ml-2 text-sm font-medium">
                        {Math.round(collaborationMutation.data.data.confidenceScore * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 mb-2">Contributing Agents:</h4>
                    <div className="flex flex-wrap gap-2">
                      {collaborationMutation.data.data.contributingAgents.map((agent: string, index: number) => (
                        <Badge key={index} variant="outline" className="bg-purple-50 border-purple-200">
                          {agent}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Accordion type="multiple" className="w-full">
                    <AccordionItem value="solution">
                      <AccordionTrigger className="text-purple-600">
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Solution
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="p-4 bg-purple-50 rounded-md whitespace-pre-wrap">
                          {collaborationMutation.data.data.solution}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="reasoning">
                      <AccordionTrigger className="text-blue-600">
                        <div className="flex items-center">
                          <Brain className="h-4 w-4 mr-2" />
                          Reasoning Process
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="p-4 bg-blue-50 rounded-md whitespace-pre-wrap">
                          {collaborationMutation.data.data.reasoningProcess}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Personalized Assistance Tab */}
        <TabsContent value="assistance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Fingerprint className="h-5 w-5 mr-2 text-green-500" />
                AI Assistant
              </CardTitle>
              <CardDescription>
                Get personalized help from an AI assistant that adapts to your knowledge level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...assistanceForm}>
                <form
                  onSubmit={assistanceForm.handleSubmit(onAssistanceSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={assistanceForm.control}
                    name="knowledgeLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Knowledge Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your knowledge level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner (Simple explanations with minimal jargon)</SelectItem>
                            <SelectItem value="intermediate">Intermediate (Balanced technical detail)</SelectItem>
                            <SelectItem value="expert">Expert (Technical, in-depth explanations)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Choose your blockchain/Web3 knowledge level to customize the response
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={assistanceForm.control}
                    name="query"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Question</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="What would you like to know about HyperDAG or blockchain technologies?"
                            className="h-36"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Ask any question about HyperDAG, Web3, or blockchain technologies
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full md:w-auto"
                    disabled={assistanceMutation.isPending}
                  >
                    {assistanceMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Response...
                      </>
                    ) : (
                      <>
                        <Fingerprint className="mr-2 h-4 w-4" />
                        Get Personalized Help
                      </>
                    )}
                  </Button>
                </form>
              </Form>

              {/* AI Response */}
              {assistanceMutation.isSuccess && assistanceMutation.data?.data && (
                <div className="mt-8 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4">AI Response</h3>
                  
                  <div className="p-4 bg-green-50 rounded-md mb-6 whitespace-pre-wrap">
                    {assistanceMutation.data.data.response}
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-700 mb-2">Suggested Next Steps:</h4>
                    <ul className="space-y-2">
                      {assistanceMutation.data.data.suggestedNextSteps.map((step: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <ArrowRight className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Relevant Resources:</h4>
                    <ul className="space-y-2">
                      {assistanceMutation.data.data.relevantResources.map((resource: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <FileCode className="h-4 w-4 text-blue-500 mr-2 mt-1 flex-shrink-0" />
                          <span>{resource}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIEnhancementPage;