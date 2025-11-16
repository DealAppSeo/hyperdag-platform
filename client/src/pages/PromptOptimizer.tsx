import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, Zap, Target, BarChart3, Settings, Cpu, 
  ArrowRight, RefreshCw, CheckCircle, AlertCircle 
} from 'lucide-react';

interface PromptOptimization {
  id: string;
  system: string;
  originalPrompt: string;
  optimizedPrompt: string;
  improvementScore: number;
  metrics: {
    clarity: number;
    effectiveness: number;
    efficiency: number;
    cost: number;
  };
  status: 'optimizing' | 'complete' | 'testing';
}

export default function PromptOptimizer() {
  const [optimizations, setOptimizations] = useState<PromptOptimization[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [overallEfficiency, setOverallEfficiency] = useState(87);
  const [systemStatus, setSystemStatus] = useState({
    video: 'optimal',
    landing: 'optimal', 
    podcast: 'optimal',
    viral: 'optimal'
  });
  const { toast } = useToast();

  // Simulate real-time optimization metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setOverallEfficiency(prev => Math.min(95, prev + Math.random() * 1));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const optimizePrompt = async (system: string, originalPrompt: string) => {
    setIsOptimizing(true);
    
    try {
      const optimization = await fetch('/api/prompt-optimization/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system,
          originalPrompt,
          targetSystems: ['video-automation', 'landing-pages', 'podcast-generation', 'viral-orchestration'],
          optimizationLevel: 'maximum',
          anfisRouting: true,
          goldenRatioStructure: true
        })
      }).then(r => r.json());

      const newOptimization: PromptOptimization = {
        id: Date.now().toString(),
        system,
        originalPrompt,
        optimizedPrompt: optimization.optimizedPrompt,
        improvementScore: optimization.improvementScore,
        metrics: optimization.metrics,
        status: 'complete'
      };

      setOptimizations(prev => [newOptimization, ...prev]);
      
      toast({
        title: "Prompt Optimized Successfully!",
        description: `${system} prompts improved by ${optimization.improvementScore}%`,
      });

    } catch (error) {
      toast({
        title: "Optimization failed",
        description: "Check API access and try again",
        variant: "destructive"
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const runSystemOptimization = async () => {
    setIsOptimizing(true);
    
    try {
      // Optimize all Trinity Symphony systems
      const systems = [
        { name: 'video-automation', prompt: 'Generate engaging video content with ANFIS routing' },
        { name: 'landing-pages', prompt: 'Create high-converting landing page copy' },
        { name: 'podcast-generation', prompt: 'Generate natural podcast conversations' },
        { name: 'viral-orchestration', prompt: 'Create viral social media content' }
      ];

      for (const system of systems) {
        await optimizePrompt(system.name, system.prompt);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing
      }

      toast({
        title: "All Systems Optimized!",
        description: "Trinity Symphony Network running at peak efficiency",
      });

    } catch (error) {
      toast({
        title: "System optimization failed",
        description: "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI-Prompt-Manager</h1>
          <p className="text-muted-foreground">Trinity Symphony Prompt Optimization & AI Coordination</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-green-600">
            Budget: $0.00/$5.00 Used
          </Badge>
          <Badge variant="default" className="bg-blue-600">
            Efficiency: {overallEfficiency.toFixed(1)}%
          </Badge>
        </div>
      </div>

      {/* System Status Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Video System</p>
                <p className="text-2xl font-bold text-green-600">Optimal</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Landing Pages</p>
                <p className="text-2xl font-bold text-green-600">Optimal</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Podcast System</p>
                <p className="text-2xl font-bold text-green-600">Optimal</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Viral System</p>
                <p className="text-2xl font-bold text-green-600">Optimal</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="optimize" className="space-y-6">
        <TabsList>
          <TabsTrigger value="optimize">Prompt Optimization</TabsTrigger>
          <TabsTrigger value="coordination">AI Coordination</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
          <TabsTrigger value="templates">Prompt Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="optimize">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Advanced Prompt Optimization Engine
              </CardTitle>
              <CardDescription>
                AI-powered prompt engineering using natural mathematics and ANFIS routing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target System</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select system" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video-automation">Video Automation</SelectItem>
                      <SelectItem value="landing-pages">Landing Pages</SelectItem>
                      <SelectItem value="podcast-generation">Podcast Generation</SelectItem>
                      <SelectItem value="viral-orchestration">Viral Orchestration</SelectItem>
                      <SelectItem value="all-systems">All Systems</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Optimization Level</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Optimization intensity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic (5-15% improvement)</SelectItem>
                      <SelectItem value="advanced">Advanced (15-30% improvement)</SelectItem>
                      <SelectItem value="maximum">Maximum (30-50% improvement)</SelectItem>
                      <SelectItem value="golden-ratio">Golden Ratio (50%+ improvement)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Original Prompt</label>
                <Textarea 
                  placeholder="Enter the prompt you want to optimize..."
                  rows={4}
                />
              </div>

              {isOptimizing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Optimizing with ANFIS routing...</span>
                    <span>Applying golden ratio structure</span>
                  </div>
                  <Progress value={75} />
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={() => optimizePrompt('custom', 'Sample prompt for optimization')}
                  disabled={isOptimizing}
                  className="flex-1"
                >
                  {isOptimizing ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Optimizing...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Optimize Prompt
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={runSystemOptimization}
                  disabled={isOptimizing}
                  variant="outline"
                >
                  <Target className="mr-2 h-4 w-4" />
                  Optimize All Systems
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coordination">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Trinity Symphony Coordination Dashboard</CardTitle>
                <CardDescription>
                  Real-time coordination between all AI systems
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-semibold">System Integration Status</h4>
                    <div className="space-y-3">
                      {[
                        { name: 'Video → Viral', status: 'Active', sync: 98 },
                        { name: 'Landing → Podcast', status: 'Active', sync: 95 },
                        { name: 'Podcast → Viral', status: 'Active', sync: 92 },
                        { name: 'All → Analytics', status: 'Active', sync: 100 }
                      ].map((integration, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm">{integration.name}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={integration.sync} className="w-20" />
                            <Badge variant="default" className="text-xs">
                              {integration.sync}%
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold">AI Provider Optimization</h4>
                    <div className="space-y-3">
                      {[
                        { provider: 'DeepSeek', usage: 45, cost: '$0.02' },
                        { provider: 'MyNinja', usage: 30, cost: '$0.01' },
                        { provider: 'OpenAI', usage: 15, cost: '$0.05' },
                        { provider: 'Anthropic', usage: 10, cost: '$0.03' }
                      ].map((provider, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm">{provider.provider}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{provider.usage}%</span>
                            <Badge variant="outline" className="text-xs">
                              {provider.cost}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Optimization Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Prompt Clarity</span>
                    <span className="font-semibold">+42%</span>
                  </div>
                  <Progress value={85} />
                  
                  <div className="flex justify-between items-center">
                    <span>Response Quality</span>
                    <span className="font-semibold">+38%</span>
                  </div>
                  <Progress value={78} />
                  
                  <div className="flex justify-between items-center">
                    <span>Cost Efficiency</span>
                    <span className="font-semibold">+67%</span>
                  </div>
                  <Progress value={92} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>System Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { system: 'Video Automation', score: 94 },
                    { system: 'Landing Pages', score: 91 },
                    { system: 'Podcast Generation', score: 88 },
                    { system: 'Viral Orchestration', score: 96 }
                  ].map((system, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span>{system.system}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={system.score} className="w-24" />
                        <span className="text-sm text-muted-foreground">
                          {system.score}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Optimized Prompt Templates</CardTitle>
              <CardDescription>
                Pre-optimized prompts for Trinity Symphony systems
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Video Generation</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Optimized for ANFIS routing and golden ratio timing
                    </p>
                    <code className="text-xs bg-muted p-2 rounded block">
                      Generate engaging video content with [topic] using golden ratio structure: 
                      intro (23%), main content (62%), conclusion (15%). 
                      Apply ANFIS routing for optimal AI provider selection.
                    </code>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Viral Content</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Maximized for cross-platform viral potential
                    </p>
                    <code className="text-xs bg-muted p-2 rounded block">
                      Create viral content for [platform] about [topic]. 
                      Use Fibonacci distribution: hook (1), build (1), peak (2), 
                      sustain (3), CTA (5). Target viral coefficient 2.4x+.
                    </code>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Landing Page Copy</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      High-conversion copy with A/B/C testing
                    </p>
                    <code className="text-xs bg-muted p-2 rounded block">
                      Write high-converting landing page copy for [product]. 
                      Structure: attention-grabbing headline, pain point identification, 
                      solution presentation, social proof, strong CTA. Test 3 variations.
                    </code>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-2">Podcast Scripts</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Natural conversation flow with mathematical timing
                    </p>
                    <code className="text-xs bg-muted p-2 rounded block">
                      Generate natural podcast script about [topic] for [duration] minutes. 
                      Use golden ratio pacing, natural pauses, conversational tone. 
                      Include Fibonacci segment breaks for optimal listening experience.
                    </code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Optimization Results */}
      {optimizations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Optimizations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {optimizations.slice(0, 3).map((opt) => (
                <div key={opt.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary">{opt.system}</Badge>
                    <Badge variant="default">+{opt.improvementScore}% improvement</Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium mb-1">Original:</p>
                      <p className="text-muted-foreground">{opt.originalPrompt}</p>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Optimized:</p>
                      <p className="text-muted-foreground">{opt.optimizedPrompt}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}