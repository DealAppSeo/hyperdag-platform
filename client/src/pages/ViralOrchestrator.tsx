import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  TrendingUp, Share2, Target, BarChart3, Zap, Users, 
  Globe, Clock, Heart, MessageCircle, Repeat, Eye 
} from 'lucide-react';

interface ViralContent {
  id: string;
  platform: string;
  content: string;
  viralCoefficient: number;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
    views: number;
  };
  status: 'draft' | 'scheduled' | 'published' | 'viral';
  scheduledTime?: string;
  cost: number;
}

export default function ViralOrchestrator() {
  const [content, setContent] = useState<ViralContent[]>([]);
  const [viralScore, setViralScore] = useState(85);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [totalReach, setTotalReach] = useState(42000);
  const { toast } = useToast();

  // Simulate real-time viral metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setViralScore(prev => Math.min(100, prev + Math.random() * 2));
      setTotalReach(prev => prev + Math.floor(Math.random() * 500));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const optimizeViralContent = async (platform: string, contentType: string) => {
    setIsOptimizing(true);
    
    try {
      const optimization = await fetch('/api/viral/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          contentType,
          existingSystems: ['video-automation', 'podcast-generation', 'landing-pages'],
          goldenRatioTiming: true,
          fibonacciDistribution: true,
          anfisRouting: true
        })
      }).then(r => r.json());

      const newContent: ViralContent = {
        id: Date.now().toString(),
        platform,
        content: optimization.optimizedContent,
        viralCoefficient: optimization.viralCoefficient,
        engagement: {
          likes: Math.floor(Math.random() * 1000),
          shares: Math.floor(Math.random() * 500),
          comments: Math.floor(Math.random() * 200),
          views: Math.floor(Math.random() * 10000)
        },
        status: 'draft',
        cost: optimization.cost || 0.01
      };

      setContent(prev => [newContent, ...prev]);
      
      toast({
        title: "Viral Content Optimized!",
        description: `${platform} content ready with ${optimization.viralCoefficient}x viral coefficient`,
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

  const scheduleContent = async (contentId: string, scheduledTime: string) => {
    try {
      await fetch('/api/viral/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId, scheduledTime, fibonacciTiming: true })
      });

      setContent(prev => prev.map(c => 
        c.id === contentId 
          ? { ...c, status: 'scheduled', scheduledTime }
          : c
      ));

      toast({
        title: "Content Scheduled",
        description: "Optimized for golden ratio engagement timing",
      });
    } catch (error) {
      toast({
        title: "Scheduling failed",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Vial Orchestrator</h1>
          <p className="text-muted-foreground">Viral Content Amplification & Distribution Optimization</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="text-green-600">
            Budget: $0.00/$5.00 Used
          </Badge>
          <Badge variant="default" className="bg-purple-600">
            Viral Score: {viralScore.toFixed(1)}%
          </Badge>
        </div>
      </div>

      {/* Real-time Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Reach</p>
                <p className="text-2xl font-bold text-blue-600">{totalReach.toLocaleString()}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Viral Coefficient</p>
                <p className="text-2xl font-bold text-purple-600">2.4x</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Engagement Rate</p>
                <p className="text-2xl font-bold text-green-600">12.8%</p>
              </div>
              <Heart className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Platforms</p>
                <p className="text-2xl font-bold text-orange-600">8</p>
              </div>
              <Globe className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="optimize" className="space-y-6">
        <TabsList>
          <TabsTrigger value="optimize">Content Optimization</TabsTrigger>
          <TabsTrigger value="schedule">Scheduling</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="amplification">Amplification</TabsTrigger>
        </TabsList>

        <TabsContent value="optimize">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Viral Content Optimization Engine
              </CardTitle>
              <CardDescription>
                AI-powered content optimization using natural mathematics and ANFIS routing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Platform</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twitter">Twitter/X</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="reddit">Reddit</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content Type</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Content type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="product-launch">Product Launch</SelectItem>
                      <SelectItem value="thought-leadership">Thought Leadership</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="behind-scenes">Behind the Scenes</SelectItem>
                      <SelectItem value="user-story">User Story</SelectItem>
                      <SelectItem value="industry-news">Industry News</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Optimization Level</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Viral intensity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="subtle">Subtle (1.2x viral coefficient)</SelectItem>
                      <SelectItem value="moderate">Moderate (2.0x viral coefficient)</SelectItem>
                      <SelectItem value="aggressive">Aggressive (3.5x viral coefficient)</SelectItem>
                      <SelectItem value="maximum">Maximum (5.0x viral coefficient)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Content Brief</label>
                <Textarea 
                  placeholder="Describe what you want to promote: HyperDAG launch, deFuzzyAI features, podcast episodes, etc."
                  rows={3}
                />
              </div>

              {isOptimizing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Optimizing viral content...</span>
                    <span>Processing with ANFIS routing</span>
                  </div>
                  <Progress value={75} />
                </div>
              )}

              <Button 
                onClick={() => optimizeViralContent('twitter', 'product-launch')}
                disabled={isOptimizing}
                className="w-full"
              >
                {isOptimizing ? (
                  <>
                    <Zap className="mr-2 h-4 w-4 animate-pulse" />
                    Optimizing with Golden Ratio...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Generate Viral Content
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule">
          <div className="grid gap-4">
            {content.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No content optimized yet</p>
                </CardContent>
              </Card>
            ) : (
              content.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{item.platform}</Badge>
                          <Badge variant={item.status === 'viral' ? 'default' : 'outline'}>
                            {item.status}
                          </Badge>
                          <Badge variant="outline">
                            {item.viralCoefficient}x viral coefficient
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{item.content}</p>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            <span>{item.engagement.likes}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Repeat className="h-4 w-4" />
                            <span>{item.engagement.shares}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4" />
                            <span>{item.engagement.comments}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4" />
                            <span>{item.engagement.views}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => scheduleContent(item.id, new Date(Date.now() + 3600000).toISOString())}
                          >
                            <Clock className="h-4 w-4 mr-2" />
                            Schedule
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Viral Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Organic Reach</span>
                    <span className="font-semibold">+127%</span>
                  </div>
                  <Progress value={85} />
                  
                  <div className="flex justify-between items-center">
                    <span>Engagement Rate</span>
                    <span className="font-semibold">+89%</span>
                  </div>
                  <Progress value={72} />
                  
                  <div className="flex justify-between items-center">
                    <span>Share Velocity</span>
                    <span className="font-semibold">+156%</span>
                  </div>
                  <Progress value={93} />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Platform Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Twitter', 'LinkedIn', 'YouTube', 'TikTok', 'Instagram'].map((platform, index) => (
                    <div key={platform} className="flex justify-between items-center">
                      <span>{platform}</span>
                      <div className="flex items-center gap-2">
                        <Progress value={[45, 32, 28, 25, 20][index]} className="w-24" />
                        <span className="text-sm text-muted-foreground">
                          {[45, 32, 28, 25, 20][index]}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="amplification">
          <Card>
            <CardHeader>
              <CardTitle>Cross-Platform Amplification</CardTitle>
              <CardDescription>
                Automated content distribution across all Trinity Symphony platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold">Video Content</h4>
                  <p className="text-sm text-muted-foreground">
                    Promote video automation system across YouTube, TikTok, and Instagram
                  </p>
                  <Button size="sm" className="w-full">
                    <Share2 className="mr-2 h-4 w-4" />
                    Amplify Videos
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold">Landing Pages</h4>
                  <p className="text-sm text-muted-foreground">
                    Drive traffic to deFuzzyAI, HyperDAG, and MelchizedekAI landing pages
                  </p>
                  <Button size="sm" className="w-full">
                    <Target className="mr-2 h-4 w-4" />
                    Drive Traffic
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold">Podcast Episodes</h4>
                  <p className="text-sm text-muted-foreground">
                    Promote podcast content across Spotify, Apple Podcasts, and social media
                  </p>
                  <Button size="sm" className="w-full">
                    <Users className="mr-2 h-4 w-4" />
                    Amplify Podcasts
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