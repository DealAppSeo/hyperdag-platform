import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Brain, Zap, Target, BarChart3, Sparkles, Clock, TrendingUp } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface ANFISResponse {
  response: string;
  provider: string;
  confidence: number;
  reasoning: string;
  responseTime: number;
}

interface QuestionCharacteristics {
  complexity: number;
  creativityRequired: number;
  technicalDepth: number;
  speedRequired: number;
  analysisIntensive: number;
  questionType: string;
}

interface RoutingAnalysis {
  characteristics: QuestionCharacteristics;
  routing: {
    provider: string;
    confidence: number;
    reasoning: string;
  };
}

interface ProviderStats {
  [key: string]: {
    name: string;
    available: boolean;
    avgResponseTime: number;
    avgQuality: number;
    currentLoad: number;
    totalRequests: number;
  };
}

export default function AnfisAiDashboard() {
  const [question, setQuestion] = useState('');
  const [testResults, setTestResults] = useState<ANFISResponse | null>(null);
  const queryClient = useQueryClient();

  // Fetch provider information
  const { data: providers } = useQuery({
    queryKey: ['/api/anfis/providers'],
    enabled: true
  });

  // Fetch routing statistics (NO POLLING - manual refresh via button)
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['/api/anfis/stats'],
    enabled: true,
    refetchInterval: false
  });

  // Process AI query mutation
  const processMutation = useMutation({
    mutationFn: async (data: { question: string; context?: any }) => {
      return apiRequest('/api/anfis/query', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      setTestResults(data.data);
      queryClient.invalidateQueries({ queryKey: ['/api/anfis/stats'] });
    }
  });

  // Analyze question characteristics
  const analyzeMutation = useMutation({
    mutationFn: async (question: string) => {
      return apiRequest(`/api/anfis/analyze?question=${encodeURIComponent(question)}`);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    processMutation.mutate({ question });
  };

  const handleAnalyze = async () => {
    if (!question.trim()) return;
    analyzeMutation.mutate(question);
  };

  const predefinedQuestions = [
    {
      category: 'Technical',
      question: 'How do I implement a merkle tree verification algorithm in TypeScript?',
      description: 'Complex technical question requiring code generation'
    },
    {
      category: 'Creative',
      question: 'Design an innovative blockchain-based voting system for nonprofits',
      description: 'Creative problem requiring innovative thinking'
    },
    {
      category: 'Analytical',
      question: 'Compare the advantages and disadvantages of different consensus mechanisms',
      description: 'Analysis-intensive question requiring detailed evaluation'
    },
    {
      category: 'Factual',
      question: 'What are the current interest rates for Web3 development grants?',
      description: 'Factual question requiring up-to-date information'
    }
  ];

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProviderBadgeColor = (provider: string) => {
    switch (provider) {
      case 'openai': return 'bg-blue-100 text-blue-800';
      case 'anthropic': return 'bg-purple-100 text-purple-800';
      case 'perplexity': return 'bg-green-100 text-green-800';
      case 'asi1': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Brain className="h-8 w-8 text-purple-600" />
          ANFIS AI Fuzzy Logic Router
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Intelligent AI request routing using Adaptive Neuro-Fuzzy Inference System (ANFIS) 
          to automatically select the optimal AI provider based on question characteristics.
        </p>
      </div>

      <Tabs defaultValue="test" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="test">AI Query Test</TabsTrigger>
          <TabsTrigger value="analysis">Question Analysis</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="stats">Performance Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Test ANFIS Routing
              </CardTitle>
              <CardDescription>
                Ask any question and see how ANFIS intelligently routes it to the best AI provider
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Textarea
                    placeholder="Enter your question here..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" disabled={processMutation.isPending || !question.trim()}>
                    {processMutation.isPending ? 'Processing...' : 'Process with ANFIS'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleAnalyze}>
                    Analyze Only
                  </Button>
                </div>
              </form>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {predefinedQuestions.map((item, index) => (
                  <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => setQuestion(item.question)}>
                    <CardContent className="p-4">
                      <Badge variant="outline" className="mb-2">{item.category}</Badge>
                      <p className="text-sm font-medium mb-1">{item.question}</p>
                      <p className="text-xs text-gray-600">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {testResults && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      ANFIS Routing Result
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium">Selected Provider</p>
                        <Badge className={getProviderBadgeColor(testResults.provider)}>
                          {testResults.provider.toUpperCase()}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Confidence</p>
                        <p className={`text-lg font-bold ${getConfidenceColor(testResults.confidence)}`}>
                          {(testResults.confidence * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Response Time</p>
                        <p className="text-lg font-bold text-blue-600">
                          {testResults.responseTime}ms
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">ANFIS Reasoning</p>
                      <Alert>
                        <Sparkles className="h-4 w-4" />
                        <AlertDescription>{testResults.reasoning}</AlertDescription>
                      </Alert>
                    </div>

                    <div>
                      <p className="text-sm font-medium mb-2">AI Response</p>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{testResults.response}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {analyzeMutation.data && (
                <Card>
                  <CardHeader>
                    <CardTitle>Question Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AnalysisDisplay analysis={analyzeMutation.data.data} />
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Question Characteristic Analysis
              </CardTitle>
              <CardDescription>
                Analyze how ANFIS evaluates question characteristics without processing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  placeholder="Enter a question to analyze..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
                <Button className="mt-2" onClick={handleAnalyze} disabled={!question.trim()}>
                  Analyze Question
                </Button>
              </div>

              {analyzeMutation.data && (
                <AnalysisDisplay analysis={analyzeMutation.data.data} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="space-y-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {providers?.data && Object.entries(providers.data).map(([key, provider]: [string, any]) => (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {provider.name}
                    <Badge variant={provider.available ? "default" : "secondary"}>
                      {provider.available ? "Available" : "Unavailable"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Strengths:</p>
                    <div className="flex flex-wrap gap-1">
                      {provider.strengths?.map((strength: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {strength.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          {stats?.data && (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(stats.data as ProviderStats).map(([key, providerStats]) => (
                <Card key={key}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      {providerStats.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Avg Response Time</span>
                      <span className="font-medium">{providerStats.avgResponseTime.toFixed(0)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Quality Score</span>
                      <span className="font-medium">{(providerStats.avgQuality * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Current Load</span>
                      <span className="font-medium">{(providerStats.currentLoad * 100).toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Requests</span>
                      <span className="font-medium">{providerStats.totalRequests}</span>
                    </div>
                    <div>
                      <p className="text-sm mb-1">Load</p>
                      <Progress value={providerStats.currentLoad * 100} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AnalysisDisplay({ analysis }: { analysis: RoutingAnalysis }) {
  const characteristics = analysis.characteristics;
  const routing = analysis.routing;

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium mb-3">Question Characteristics</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm mb-1">Complexity</p>
            <Progress value={characteristics.complexity * 100} />
            <span className="text-xs text-gray-600">{(characteristics.complexity * 100).toFixed(1)}%</span>
          </div>
          <div>
            <p className="text-sm mb-1">Creativity Required</p>
            <Progress value={characteristics.creativityRequired * 100} />
            <span className="text-xs text-gray-600">{(characteristics.creativityRequired * 100).toFixed(1)}%</span>
          </div>
          <div>
            <p className="text-sm mb-1">Technical Depth</p>
            <Progress value={characteristics.technicalDepth * 100} />
            <span className="text-xs text-gray-600">{(characteristics.technicalDepth * 100).toFixed(1)}%</span>
          </div>
          <div>
            <p className="text-sm mb-1">Speed Required</p>
            <Progress value={characteristics.speedRequired * 100} />
            <span className="text-xs text-gray-600">{(characteristics.speedRequired * 100).toFixed(1)}%</span>
          </div>
          <div>
            <p className="text-sm mb-1">Analysis Intensive</p>
            <Progress value={characteristics.analysisIntensive * 100} />
            <span className="text-xs text-gray-600">{(characteristics.analysisIntensive * 100).toFixed(1)}%</span>
          </div>
          <div>
            <p className="text-sm mb-1">Question Type</p>
            <Badge variant="outline">{characteristics.questionType}</Badge>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-medium mb-3">ANFIS Routing Decision</h4>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm">Recommended Provider</p>
            <Badge className="mt-1">{routing.provider.toUpperCase()}</Badge>
          </div>
          <div>
            <p className="text-sm">Confidence</p>
            <p className="text-lg font-bold text-green-600">
              {(routing.confidence * 100).toFixed(1)}%
            </p>
          </div>
          <div className="md:col-span-1">
            <p className="text-sm mb-1">Reasoning</p>
            <p className="text-xs text-gray-600">{routing.reasoning}</p>
          </div>
        </div>
      </div>
    </div>
  );
}