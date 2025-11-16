import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Bot, 
  Plus, 
  Settings, 
  MessageSquare, 
  Users, 
  Zap,
  CheckCircle, 
  AlertCircle,
  Send,
  Edit,
  Trash2,
  Play,
  Pause
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface TelegramBot {
  id: number;
  name: string;
  username: string;
  description: string;
  projectId?: number;
  isActive: boolean;
  messageCount: number;
  userCount: number;
  createdAt: string;
  features: string[];
}

export default function BotManagement() {
  const { toast } = useToast();
  const [newBotForm, setNewBotForm] = useState({
    name: '',
    description: '',
    projectId: '',
    features: [] as string[]
  });

  // Fetch existing bots
  const { data: bots, isLoading, error } = useQuery({
    queryKey: ['/api/telegram/bots'],
    enabled: true
  });

  // Create new bot mutation
  const createBotMutation = useMutation({
    mutationFn: async (botData: any) => {
      const response = await apiRequest('POST', '/api/telegram/bots/create', botData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bot Created Successfully",
        description: "Your Telegram bot is now active and ready to use"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/bots'] });
      setNewBotForm({ name: '', description: '', projectId: '', features: [] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create bot",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Toggle bot status mutation
  const toggleBotMutation = useMutation({
    mutationFn: async ({ botId, isActive }: { botId: number; isActive: boolean }) => {
      const response = await apiRequest('PATCH', `/api/telegram/bots/${botId}/toggle`, { isActive });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/bots'] });
    }
  });

  // Delete bot mutation
  const deleteBotMutation = useMutation({
    mutationFn: async (botId: number) => {
      const response = await apiRequest('DELETE', `/api/telegram/bots/${botId}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Bot Deleted",
        description: "The bot has been successfully removed"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/bots'] });
    }
  });

  const handleCreateBot = () => {
    if (!newBotForm.name || !newBotForm.description) {
      toast({
        title: "Missing Information",
        description: "Please provide both name and description for the bot",
        variant: "destructive"
      });
      return;
    }

    createBotMutation.mutate(newBotForm);
  };

  const handleFeatureToggle = (feature: string) => {
    setNewBotForm(prev => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter(f => f !== feature)
        : [...prev.features, feature]
    }));
  };

  const availableFeatures = [
    { id: 'ai_matching', label: 'AI Team Matching', description: 'Intelligent team formation' },
    { id: 'grant_alerts', label: 'Grant Alerts', description: 'Automated grant notifications' },
    { id: 'project_updates', label: 'Project Updates', description: 'Real-time project notifications' },
    { id: 'smart_notifications', label: 'Smart Notifications', description: 'AI-powered personalized messages' },
    { id: 'group_management', label: 'Group Management', description: 'Automated group creation and management' },
    { id: 'workflow_automation', label: 'Workflow Automation', description: 'Automated project workflows' }
  ];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Telegram Bot Management</h1>
          <p className="text-muted-foreground mt-2">
            Create and manage AI-powered Telegram bots for your projects
          </p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Bot className="h-4 w-4" />
          {bots?.data?.length || 0} Active Bots
        </Badge>
      </div>

      {/* Create New Bot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Bot
          </CardTitle>
          <CardDescription>
            Set up a new Telegram bot with AI-enhanced features for your project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="botName">Bot Name</Label>
              <Input
                id="botName"
                placeholder="e.g., ProjectHelper Bot"
                value={newBotForm.name}
                onChange={(e) => setNewBotForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="projectId">Project (Optional)</Label>
              <Select
                value={newBotForm.projectId}
                onValueChange={(value) => setNewBotForm(prev => ({ ...prev, projectId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Web3 Innovation Project</SelectItem>
                  <SelectItem value="2">AI Research Initiative</SelectItem>
                  <SelectItem value="3">Blockchain Development</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="botDescription">Description</Label>
            <Textarea
              id="botDescription"
              placeholder="Describe what this bot will do..."
              value={newBotForm.description}
              onChange={(e) => setNewBotForm(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div>
            <Label>Bot Features</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {availableFeatures.map((feature) => (
                <div key={feature.id} className="flex items-center space-x-2 p-3 border rounded-lg">
                  <Switch
                    checked={newBotForm.features.includes(feature.id)}
                    onCheckedChange={() => handleFeatureToggle(feature.id)}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">{feature.label}</div>
                    <div className="text-xs text-muted-foreground">{feature.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleCreateBot}
            disabled={createBotMutation.isPending}
            className="w-full"
          >
            {createBotMutation.isPending ? "Creating..." : "Create Bot"}
          </Button>
        </CardContent>
      </Card>

      {/* Existing Bots */}
      {bots?.data?.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Your Bots</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.data.map((bot: TelegramBot) => (
              <Card key={bot.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      {bot.name}
                    </CardTitle>
                    <Badge variant={bot.isActive ? "default" : "secondary"}>
                      {bot.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <CardDescription>@{bot.username}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{bot.description}</p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {bot.messageCount} messages
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {bot.userCount} users
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {bot.features.map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs">
                        {availableFeatures.find(f => f.id === feature)?.label || feature}
                      </Badge>
                    ))}
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleBotMutation.mutate({ 
                          botId: bot.id, 
                          isActive: !bot.isActive 
                        })}
                        disabled={toggleBotMutation.isPending}
                      >
                        {bot.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteBotMutation.mutate(bot.id)}
                      disabled={deleteBotMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Bot Setup Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Bot Setup Instructions</CardTitle>
          <CardDescription>
            Follow these steps to get your bots running
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">1</div>
              <div>
                <p className="font-medium">Create Bot with BotFather</p>
                <p className="text-sm text-muted-foreground">Message @BotFather on Telegram and use /newbot to create your bot</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">2</div>
              <div>
                <p className="font-medium">Configure Bot Token</p>
                <p className="text-sm text-muted-foreground">Add your bot token to the environment secrets for authentication</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">3</div>
              <div>
                <p className="font-medium">Create Bot in HyperDAG</p>
                <p className="text-sm text-muted-foreground">Use the form above to create and configure your bot with AI features</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">4</div>
              <div>
                <p className="font-medium">Test and Deploy</p>
                <p className="text-sm text-muted-foreground">Your bot will automatically start responding with AI-powered features</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}