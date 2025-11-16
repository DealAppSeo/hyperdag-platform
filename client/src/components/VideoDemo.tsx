import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  PlayCircle, 
  DollarSign, 
  Clock, 
  TrendingUp, 
  Video, 
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface VideoGenerationForm {
  businessName: string;
  platform: string;
  reviewText: string;
  rating: number;
}

interface GeneratedVideo {
  id: number;
  businessName: string;
  platform: string;
  rating: number;
  reviewText: string;
  videoUrl: string;
  thumbnailUrl: string;
  durationSeconds: number;
  status: string;
  provider: string;
  generationCost: number;
  createdAt: string;
}

const VideoDemo: React.FC = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<VideoGenerationForm>({
    businessName: 'TechCorp Solutions',
    platform: 'google',
    reviewText: 'Outstanding service! The team was professional, responsive, and delivered exactly what we needed. Highly recommend!',
    rating: 5
  });
  const [generatedVideo, setGeneratedVideo] = useState<GeneratedVideo | null>(null);

  // Fetch cost estimates
  const { data: costEstimates, isLoading: costLoading } = useQuery({
    queryKey: ['/api/video/cost-estimate'],
    queryFn: async () => {
      const response = await fetch('/api/video/cost-estimate');
      if (!response.ok) throw new Error('Failed to fetch cost estimates');
      return response.json();
    }
  });

  // Video generation mutation
  const generateVideoMutation = useMutation({
    mutationFn: async (data: VideoGenerationForm) => {
      const response = await fetch('/api/video/generate-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to generate video');
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedVideo(data.data);
      toast({
        title: "Video Generated Successfully!",
        description: `Created ${data.data.durationSeconds}s video for ${data.data.businessName}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleInputChange = (field: keyof VideoGenerationForm, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = () => {
    generateVideoMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
            Video Platform Demo
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Multi-provider video generation with cost optimization and social media automation
          </p>
        </div>

        {/* Cost Optimization Summary */}
        {costEstimates && (
          <Card className="mb-8 bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-400">
                <TrendingUp className="w-5 h-5" />
                Cost Optimization Summary
              </CardTitle>
              <CardDescription>
                Infrastructure savings vs traditional platforms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-500/10 p-4 rounded-lg border border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-green-400">Monthly Savings</span>
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    ${costEstimates.data.totalMonthlySavings}
                  </div>
                  <div className="text-sm text-gray-400">94% cost reduction</div>
                </div>
                
                <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-blue-400">Recommended Provider</span>
                  </div>
                  <div className="text-lg font-bold text-blue-400">
                    {costEstimates.data.recommended}
                  </div>
                  <div className="text-sm text-gray-400">$0.25/minute</div>
                </div>

                <div className="bg-purple-500/10 p-4 rounded-lg border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Video className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-purple-400">Infrastructure</span>
                  </div>
                  <div className="text-sm text-purple-400 space-y-1">
                    <div>Railway + Bunny.net</div>
                    <div>vs Vercel + Cloudinary</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5" />
                Video Generation Input
              </CardTitle>
              <CardDescription>
                Generate professional videos from review content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange('businessName', e.target.value)}
                  className="bg-gray-700/50 border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">Review Platform</Label>
                <Select 
                  value={formData.platform} 
                  onValueChange={(value) => handleInputChange('platform', value)}
                >
                  <SelectTrigger className="bg-gray-700/50 border-gray-600">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="google">Google Reviews</SelectItem>
                    <SelectItem value="yelp">Yelp</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="trustpilot">Trustpilot</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rating">Rating (1-5 stars)</Label>
                <Select 
                  value={formData.rating.toString()} 
                  onValueChange={(value) => handleInputChange('rating', parseInt(value))}
                >
                  <SelectTrigger className="bg-gray-700/50 border-gray-600">
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">⭐⭐⭐⭐⭐ (5 stars)</SelectItem>
                    <SelectItem value="4">⭐⭐⭐⭐ (4 stars)</SelectItem>
                    <SelectItem value="3">⭐⭐⭐ (3 stars)</SelectItem>
                    <SelectItem value="2">⭐⭐ (2 stars)</SelectItem>
                    <SelectItem value="1">⭐ (1 star)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewText">Review Content</Label>
                <Textarea
                  id="reviewText"
                  value={formData.reviewText}
                  onChange={(e) => handleInputChange('reviewText', e.target.value)}
                  className="bg-gray-700/50 border-gray-600 min-h-[100px]"
                  placeholder="Enter the review text to convert to video..."
                />
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={generateVideoMutation.isPending}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              >
                {generateVideoMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating Video...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <PlayCircle className="w-4 h-4" />
                    Generate Video
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Video Output */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlayCircle className="w-5 h-5" />
                Generated Video
              </CardTitle>
              <CardDescription>
                Video output and analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              {generatedVideo ? (
                <div className="space-y-4">
                  {/* Video Preview */}
                  <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-600">
                    <div className="aspect-video bg-gradient-to-br from-gray-700 to-gray-800 rounded-lg flex items-center justify-center mb-3">
                      <div className="text-center">
                        <PlayCircle className="w-16 h-16 text-blue-400 mx-auto mb-2" />
                        <p className="text-gray-400">Video Preview</p>
                        <p className="text-sm text-gray-500">{generatedVideo.durationSeconds}s duration</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {generatedVideo.status}
                        </Badge>
                        <Badge variant="outline" className="border-gray-600">
                          {generatedVideo.provider}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-400">
                        ${generatedVideo.generationCost.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Video Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Business:</span>
                      <div className="font-medium">{generatedVideo.businessName}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Platform:</span>
                      <div className="font-medium capitalize">{generatedVideo.platform}</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Rating:</span>
                      <div className="font-medium">{'⭐'.repeat(generatedVideo.rating)} ({generatedVideo.rating}/5)</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Duration:</span>
                      <div className="font-medium">{generatedVideo.durationSeconds}s</div>
                    </div>
                  </div>

                  {/* Review Content */}
                  <div>
                    <span className="text-gray-400 text-sm">Review Content:</span>
                    <div className="bg-gray-900/50 p-3 rounded border border-gray-600 mt-1">
                      <p className="text-sm italic">"{generatedVideo.reviewText}"</p>
                    </div>
                  </div>

                  {/* Social Media Distribution */}
                  <div className="border-t border-gray-600 pt-4">
                    <h4 className="font-medium mb-2">Social Media Distribution</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                        Instagram Ready
                      </Badge>
                      <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                        TikTok Format
                      </Badge>
                      <Badge variant="outline" className="border-red-500/50 text-red-400">
                        YouTube Shorts
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <div className="text-center">
                    <Video className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Generate a video to see the output</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Provider Comparison */}
        {costEstimates && (
          <Card className="mt-8 bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle>Video Generation Providers</CardTitle>
              <CardDescription>
                Cost and feature comparison for video generation services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {costEstimates.data.providers.map((provider, index) => (
                  <div 
                    key={provider.name}
                    className={`p-4 rounded-lg border ${
                      provider.name === costEstimates.data.recommended
                        ? 'border-green-500/50 bg-green-500/10'
                        : 'border-gray-600 bg-gray-700/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{provider.name}</h4>
                      {provider.name === costEstimates.data.recommended && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-2xl font-bold mb-2">
                      ${provider.costPerMinute.toFixed(2)}/min
                    </div>
                    
                    <div className="text-sm text-gray-400 mb-3">
                      {provider.quality} Quality
                    </div>
                    
                    <div className="space-y-1">
                      {provider.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-3 h-3 text-green-400" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VideoDemo;