import React, { useState, useRef, useEffect } from 'react';
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
  Mic, Play, Pause, Download, Share2, Radio, Clock, 
  Users, Brain, Zap, BarChart3, Volume2 
} from 'lucide-react';

interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  duration: number;
  status: 'generating' | 'ready' | 'published';
  audioUrl?: string;
  script?: string;
  topics: string[];
  speakers: string[];
  cost: number;
}

export default function PodcastGeneration() {
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  // Trinity Symphony Podcast Generation
  const generatePodcast = async (formData: any) => {
    setIsGenerating(true);
    setProgress(0);

    try {
      // Phase 1: Content Research & Topic Selection
      setProgress(15);
      const research = await fetch('/api/podcast/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: formData.topic,
          duration: formData.duration,
          style: formData.style,
          audience: formData.audience
        })
      }).then(r => r.json());

      // Phase 2: Script Generation with Golden Ratio Structure
      setProgress(30);
      const script = await fetch('/api/podcast/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          research: research,
          speakers: formData.speakers,
          goldenRatioStructure: true,
          fibonacciSegments: true
        })
      }).then(r => r.json());

      // Phase 3: Voice Synthesis with Natural Timing
      setProgress(50);
      const voices = await fetch('/api/podcast/voices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          script: script,
          speakers: formData.speakers,
          emotions: 'natural',
          pacing: 'conversational'
        })
      }).then(r => r.json());

      // Phase 4: Audio Assembly with Music & Effects
      setProgress(70);
      const audio = await fetch('/api/podcast/assemble', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voices: voices,
          backgroundMusic: formData.music,
          effects: 'subtle',
          transitions: 'fibonacci-fade'
        })
      }).then(r => r.json());

      // Phase 5: Distribution Preparation
      setProgress(90);
      const distribution = await fetch('/api/podcast/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audio: audio,
          metadata: {
            title: formData.title || `AI Symphony Episode ${episodes.length + 1}`,
            description: script.summary,
            tags: research.topics
          },
          platforms: ['spotify', 'apple', 'google', 'rss']
        })
      }).then(r => r.json());

      setProgress(100);

      const newEpisode: PodcastEpisode = {
        id: Date.now().toString(),
        title: formData.title || `Trinity Symphony Episode ${episodes.length + 1}`,
        description: script.summary || 'Generated podcast episode',
        duration: audio.duration || formData.duration * 60,
        status: 'ready',
        audioUrl: audio.url,
        script: script.fullText,
        topics: research.topics || [formData.topic],
        speakers: formData.speakers || ['AI Host'],
        cost: (research.cost || 0) + (script.cost || 0) + (voices.cost || 0) + (audio.cost || 0)
      };

      setEpisodes(prev => [newEpisode, ...prev]);
      
      toast({
        title: "Podcast Generated Successfully!",
        description: `${newEpisode.title} ready for distribution`,
      });

    } catch (error) {
      toast({
        title: "Podcast Generation Failed",
        description: "Check API blockers in progress log",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const handlePlayPause = (episodeId: string, audioUrl?: string) => {
    if (!audioUrl) return;
    
    if (currentlyPlaying === episodeId) {
      audioRef.current?.pause();
      setCurrentlyPlaying(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setCurrentlyPlaying(episodeId);
      }
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Trinity Symphony Podcast Studio</h1>
          <p className="text-muted-foreground">Self-Generating AI Podcast System</p>
        </div>
        <Badge variant="outline" className="text-green-600">
          Budget: $0.00/$5.00 Used
        </Badge>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList>
          <TabsTrigger value="create">Create Episode</TabsTrigger>
          <TabsTrigger value="episodes">Episodes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5" />
                Golden Ratio Podcast Creator
              </CardTitle>
              <CardDescription>
                Automated podcast generation with natural mathematics and ANFIS routing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Episode Title</label>
                  <Input 
                    placeholder="Auto-generated if left blank"
                    id="title"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Main Topic</label>
                  <Input 
                    placeholder="What should this episode discuss?"
                    id="topic"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Episode Description</label>
                <Textarea 
                  placeholder="Brief description of the episode content and goals..."
                  rows={3}
                  id="description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration (minutes)</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Length" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="10">10 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Style</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conversational">Conversational</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="storytelling">Storytelling</SelectItem>
                      <SelectItem value="news">News Update</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Speakers</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Voices" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="single">Single Host</SelectItem>
                      <SelectItem value="duo">Two Hosts</SelectItem>
                      <SelectItem value="panel">Panel Discussion</SelectItem>
                      <SelectItem value="interview">Host + Guest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Background Music</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Music" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ambient">Ambient</SelectItem>
                      <SelectItem value="upbeat">Upbeat</SelectItem>
                      <SelectItem value="classical">Classical</SelectItem>
                      <SelectItem value="none">No Music</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Generating your podcast...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                  <div className="text-xs text-muted-foreground">
                    {progress < 15 && "Researching content and topics..."}
                    {progress >= 15 && progress < 30 && "Generating script with golden ratio structure..."}
                    {progress >= 30 && progress < 50 && "Creating natural voice synthesis..."}
                    {progress >= 50 && progress < 70 && "Assembling audio with music and effects..."}
                    {progress >= 70 && progress < 90 && "Preparing for distribution..."}
                    {progress >= 90 && "Finalizing episode..."}
                  </div>
                </div>
              )}

              <Button 
                onClick={() => generatePodcast({
                  title: (document.getElementById('title') as HTMLInputElement)?.value,
                  topic: (document.getElementById('topic') as HTMLInputElement)?.value || 'AI and Technology',
                  description: (document.getElementById('description') as HTMLTextAreaElement)?.value,
                  duration: 15,
                  style: 'conversational',
                  speakers: ['single'],
                  music: 'ambient'
                })}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Radio className="mr-2 h-4 w-4 animate-pulse" />
                    Generating Podcast...
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-4 w-4" />
                    Generate Episode
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="episodes">
          <div className="grid gap-4">
            {episodes.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No episodes created yet</p>
                </CardContent>
              </Card>
            ) : (
              episodes.map((episode) => (
                <Card key={episode.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{episode.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{episode.description}</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {episode.topics.map((topic, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{Math.round(episode.duration / 60)} min</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{episode.speakers.join(', ')}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap className="h-4 w-4" />
                            <span>${episode.cost.toFixed(3)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={episode.status === 'ready' ? 'default' : 'secondary'}>
                          {episode.status}
                        </Badge>
                        {episode.status === 'ready' && episode.audioUrl && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePlayPause(episode.id, episode.audioUrl)}
                            >
                              {currentlyPlaying === episode.id ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Total Episodes</CardTitle>
                <CardDescription>Generated this session</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{episodes.length}</div>
                <p className="text-xs text-muted-foreground">Ready for distribution</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Production Cost</CardTitle>
                <CardDescription>Average per episode</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${episodes.length > 0 ? (episodes.reduce((sum, e) => sum + e.cost, 0) / episodes.length).toFixed(3) : '0.000'}
                </div>
                <p className="text-xs text-muted-foreground">Target: &lt;$0.50/episode</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Total Duration</CardTitle>
                <CardDescription>Content generated</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(episodes.reduce((sum, e) => sum + e.duration, 0) / 60)} min
                </div>
                <p className="text-xs text-muted-foreground">Natural mathematics timing</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle>Podcast Distribution</CardTitle>
              <CardDescription>Automated publishing to major platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Spotify', 'Apple Podcasts', 'Google Podcasts', 'RSS Feed'].map((platform) => (
                  <div key={platform} className="text-center p-4 border rounded-lg">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Volume2 className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="font-medium">{platform}</div>
                    <div className="text-sm text-muted-foreground">Ready</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Hidden audio element for playback */}
      <audio 
        ref={audioRef} 
        onEnded={() => setCurrentlyPlaying(null)}
        className="hidden"
      />
    </div>
  );
}