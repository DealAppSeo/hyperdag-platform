import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/use-auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import {
  Upload,
  FileText,
  Image,
  Video,
  Music,
  Code,
  Share2,
  Download,
  Edit,
  Sparkles,
  Users,
  Trophy,
  Zap,
  Palette,
  Camera,
  Mic,
  Play,
  Plus
} from 'lucide-react';

interface ContentAsset {
  id: string;
  type: 'image' | 'video' | 'audio' | 'document' | 'code';
  title: string;
  size: string;
  uploadDate: string;
  status: 'processing' | 'ready' | 'failed';
  tags: string[];
  projectId?: string;
  collaborators: string[];
}

interface CreatorProject {
  id: string;
  title: string;
  description: string;
  type: 'dapp' | 'content' | 'mixed';
  assets: ContentAsset[];
  collaborators: number;
  status: 'draft' | 'in-progress' | 'published';
  earnings: number;
}

export default function CreatorStudio() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch creator assets
  const { data: assets, isLoading: assetsLoading } = useQuery<ContentAsset[]>({
    queryKey: ['/api/creator/assets'],
    enabled: !!user
  });

  // Fetch creator projects
  const { data: projects } = useQuery<CreatorProject[]>({
    queryKey: ['/api/creator/projects'],
    enabled: !!user
  });

  // Upload asset mutation
  const uploadAsset = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiRequest('POST', '/api/creator/upload', formData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/creator/assets'] });
      toast({
        title: "Upload Successful!",
        description: "Your content has been uploaded and is being processed.",
      });
    }
  });

  // AI Enhancement mutation
  const enhanceContent = useMutation({
    mutationFn: async (assetId: string) => {
      const response = await apiRequest('POST', '/api/creator/ai-enhance', { assetId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "AI Enhancement Started!",
        description: "Your content is being enhanced with AI tools.",
      });
    }
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadAsset.mutate(file);
    }
  };

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'image': return Image;
      case 'video': return Video;
      case 'audio': return Music;
      case 'document': return FileText;
      case 'code': return Code;
      default: return FileText;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Palette className="h-8 w-8 text-purple-600" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              HyperCreate Studio
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            AI-powered Web3 UGC platform where developers and creators collaborate to build the future of digital content.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white/70 backdrop-blur-sm border-purple-200">
            <CardContent className="p-6 text-center">
              <Upload className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Total Assets</h3>
              <p className="text-2xl font-bold text-purple-600">{assets?.length || 0}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/70 backdrop-blur-sm border-blue-200">
            <CardContent className="p-6 text-center">
              <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Collaborations</h3>
              <p className="text-2xl font-bold text-blue-600">
                {projects?.reduce((acc, p) => acc + p.collaborators, 0) || 0}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/70 backdrop-blur-sm border-green-200">
            <CardContent className="p-6 text-center">
              <Trophy className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">Earnings</h3>
              <p className="text-2xl font-bold text-green-600">
                ${projects?.reduce((acc, p) => acc + p.earnings, 0).toFixed(2) || '0.00'}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/70 backdrop-blur-sm border-orange-200">
            <CardContent className="p-6 text-center">
              <Sparkles className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-900">AI Enhanced</h3>
              <p className="text-2xl font-bold text-orange-600">
                {assets?.filter(a => a.status === 'ready').length || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-white/70 backdrop-blur-sm">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="assets" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Assets
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="collaborate" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Collaborate
            </TabsTrigger>
            <TabsTrigger value="tools" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              AI Tools
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5 text-purple-600" />
                    Quick Upload
                  </CardTitle>
                  <CardDescription>
                    Upload your content and let AI enhance it automatically
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-purple-200 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">Drag & drop your files here</p>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload">
                      <Button className="cursor-pointer">
                        Choose Files
                      </Button>
                    </label>
                  </div>
                  {uploadAsset.isPending && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Uploading...</p>
                      <Progress value={uploadProgress} className="w-full" />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white/70 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5 text-blue-600" />
                    Featured Tools
                  </CardTitle>
                  <CardDescription>
                    AI-powered content creation and enhancement tools
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: 'AI Image Upscaling', icon: Image, description: 'Enhance image quality up to 4K' },
                    { name: 'Video Compression', icon: Video, description: 'Optimize videos for web delivery' },
                    { name: 'Audio Enhancement', icon: Mic, description: 'Noise reduction and clarity boost' },
                    { name: 'Document Conversion', icon: FileText, description: 'Convert between formats seamlessly' }
                  ].map((tool, i) => {
                    const Icon = tool.icon;
                    return (
                      <div key={i} className="flex items-center gap-3 p-3 border rounded-lg bg-white/50">
                        <Icon className="h-5 w-5 text-gray-600" />
                        <div className="flex-1">
                          <h4 className="font-medium">{tool.name}</h4>
                          <p className="text-sm text-gray-600">{tool.description}</p>
                        </div>
                        <Button size="sm" variant="outline">Try</Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Assets Tab */}
          <TabsContent value="assets" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Your Content Assets</h2>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Upload New Asset
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets?.map((asset) => {
                const Icon = getAssetIcon(asset.type);
                return (
                  <Card key={asset.id} className="bg-white/70 backdrop-blur-sm hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <Icon className="h-6 w-6 text-gray-600" />
                        <Badge variant={asset.status === 'ready' ? 'default' : 'secondary'}>
                          {asset.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{asset.title}</CardTitle>
                      <CardDescription className="text-sm">
                        {asset.size} • {asset.uploadDate}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex flex-wrap gap-1">
                        {asset.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Share2 className="h-3 w-3 mr-1" />
                          Share
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => enhanceContent.mutate(asset.id)}
                          disabled={enhanceContent.isPending}
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          Enhance
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              }) ?? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <Upload className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No assets yet</h3>
                  <p>Upload your first content asset to get started</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Creator Projects</h2>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </div>

            <div className="grid gap-6">
              {projects?.map((project) => (
                <Card key={project.id} className="bg-white/70 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {project.title}
                          <Badge variant="outline" className="capitalize">
                            {project.type}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {project.description}
                        </CardDescription>
                      </div>
                      <Badge variant={project.status === 'published' ? 'default' : 'secondary'}>
                        {project.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{project.assets.length}</p>
                        <p className="text-sm text-gray-600">Assets</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{project.collaborators}</p>
                        <p className="text-sm text-gray-600">Collaborators</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-purple-600">${project.earnings}</p>
                        <p className="text-sm text-gray-600">Earnings</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Project
                      </Button>
                      <Button variant="outline" className="flex-1">
                        <Users className="h-4 w-4 mr-2" />
                        Manage Team
                      </Button>
                      <Button className="flex-1">
                        <Share2 className="h-4 w-4 mr-2" />
                        Publish
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )) ?? (
                <div className="text-center py-12 text-gray-500">
                  <Code className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No projects yet</h3>
                  <p>Create your first project to start collaborating</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Collaboration Tab */}
          <TabsContent value="collaborate" className="space-y-6">
            <Card className="bg-gradient-to-r from-purple-500 to-blue-600 text-white border-0">
              <CardContent className="p-8 text-center">
                <Users className="h-16 w-16 mx-auto mb-4 opacity-90" />
                <h2 className="text-2xl font-bold mb-4">Find Your Creative Partners</h2>
                <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
                  Connect with developers, designers, and creators who share your vision. 
                  Our AI matching system finds perfect collaborators for your projects.
                </p>
                <Button size="lg" variant="secondary" className="bg-white text-purple-600 hover:bg-gray-100">
                  Discover Collaborators
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Tools Tab */}
          <TabsContent value="tools" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  name: 'Smart Compression',
                  description: 'Reduce file sizes without quality loss',
                  icon: Download,
                  category: 'Optimization'
                },
                {
                  name: 'Format Converter',
                  description: 'Convert between any media formats',
                  icon: Zap,
                  category: 'Conversion'
                },
                {
                  name: 'AI Upscaler',
                  description: 'Enhance image and video quality',
                  icon: Sparkles,
                  category: 'Enhancement'
                },
                {
                  name: 'Content Generator',
                  description: 'Generate content with AI assistance',
                  icon: Edit,
                  category: 'Creation'
                }
              ].map((tool, i) => {
                const Icon = tool.icon;
                return (
                  <Card key={i} className="bg-white/70 backdrop-blur-sm hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Icon className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{tool.name}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {tool.category}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">{tool.description}</p>
                      <Button className="w-full">Try Tool</Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}