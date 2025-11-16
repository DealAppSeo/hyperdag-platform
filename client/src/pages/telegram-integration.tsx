import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageSquare, 
  Bell, 
  Users, 
  Zap,
  Info,
  ExternalLink, 
  CheckCircle, 
  AlertCircle,
  Send,
  Settings,
  Bot,
  ArrowLeft,
  Home,
  Brain,
  Target,
  Sparkles,
  Cog
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function TelegramIntegration() {
  const { toast } = useToast();
  const [connectForm, setConnectForm] = useState({
    telegramId: '',
    username: '',
    firstName: ''
  });
  const [privacyMode, setPrivacyMode] = useState(true);

  // Fetch Telegram integration status
  const { data: status, isLoading } = useQuery({
    queryKey: ['/api/telegram/status'],
    retry: false
  });

  // Fetch ZKP Telegram status
  const { data: zkpStatus, isLoading: zkpLoading } = useQuery({
    queryKey: ['/api/telegram/zkp/status'],
    retry: false
  });

  // Connect Telegram account mutation
  const connectMutation = useMutation({
    mutationFn: async (telegramData: any) => {
      const endpoint = privacyMode ? '/api/telegram/zkp/link-anonymous' : '/api/telegram/connect';
      const res = await apiRequest('POST', endpoint, { telegramData });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/status'] });
      queryClient.invalidateQueries({ queryKey: ['/api/telegram/zkp/status'] });
      toast({
        title: privacyMode ? "Anonymous Connection Created" : "Telegram Connected",
        description: privacyMode 
          ? "Your account is now linked anonymously using zero-knowledge proofs!"
          : "Your Telegram account has been successfully connected!"
      });
    },
    onError: () => {
      toast({
        title: "Connection Failed",
        description: "Failed to connect your Telegram account. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Send demo notification mutation
  const demoNotificationMutation = useMutation({
    mutationFn: async (type: string) => {
      const endpoint = privacyMode ? '/api/telegram/zkp/demo-notification' : '/api/telegram/send-demo-notification';
      const res = await apiRequest('POST', endpoint, { type });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: privacyMode ? "ZKP Demo Created" : "Demo Notification Created",
        description: data.data?.message || "Demo notification sent successfully!"
      });
    },
    onError: () => {
      toast({
        title: "Demo Failed",
        description: "Failed to send demo notification.",
        variant: "destructive"
      });
    }
  });

  const handleConnect = () => {
    if (!connectForm.telegramId || !connectForm.firstName) {
      toast({
        title: "Missing Information",
        description: "Please provide at least your Telegram ID and first name.",
        variant: "destructive"
      });
      return;
    }

    connectMutation.mutate({
      id: parseInt(connectForm.telegramId),
      username: connectForm.username,
      first_name: connectForm.firstName
    });
  };

  const handleDemoNotification = (type: string) => {
    demoNotificationMutation.mutate(type);
  };

  // Interactive message mutation
  const interactiveMessageMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/telegram/send-interactive', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Interactive message sent",
        description: "Message with action buttons delivered securely"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send interactive message",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Create project group mutation
  const createGroupMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/telegram/create-project-group', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Project group created",
        description: "Secure group created with invite link"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create group",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleInteractiveMessage = () => {
    const interactiveOptions = [
      { text: "Apply for Grant", callback_data: "grant_apply:web3_grant_2025" },
      { text: "Join Project", callback_data: "project_join:hyperdag_core" },
      { text: "Dismiss", callback_data: "notification_dismiss:demo_msg" }
    ];

    interactiveMessageMutation.mutate({
      message: "New Web3 grant opportunity matches your skills! Choose an action:",
      type: "grant_opportunity",
      interactiveOptions
    });
  };

  const handleCreateProjectGroup = () => {
    createGroupMutation.mutate({
      projectId: 1,
      memberIds: [1, 2, 3] // Demo member IDs
    });
  };

  // Phase 3: AI-enhanced features
  const aiTeamMatchingMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/telegram/ai/team-matching', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "AI Team Matching Complete",
        description: `Found ${data.candidates?.length || 0} potential team members`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Team matching failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const aiWorkflowMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/telegram/ai/automate-workflow', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Workflow Automated",
        description: `${data.workflowType} workflow configured successfully`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Workflow automation failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const aiGrantMatchingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/telegram/ai/grant-matching');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Grant Matching Complete",
        description: `Found ${data.matches?.length || 0} matching opportunities`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Grant matching failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const aiSmartNotificationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/telegram/ai/smart-notification', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Smart Notification Sent",
        description: "AI-generated personalized notification delivered"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Smart notification failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleAITeamMatching = () => {
    aiTeamMatchingMutation.mutate({
      projectId: 1,
      requiredSkills: ['react', 'web3', 'ai', 'blockchain']
    });
  };

  const handleAIWorkflowAutomation = (workflowType: string) => {
    aiWorkflowMutation.mutate({
      projectId: 1,
      workflowType
    });
  };

  const handleAIGrantMatching = () => {
    aiGrantMatchingMutation.mutate();
  };

  const handleSmartNotification = () => {
    aiSmartNotificationMutation.mutate({
      context: {
        type: 'grant_opportunity',
        priority: 'high',
        userInterests: ['web3', 'ai', 'blockchain']
      }
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const integrationStatus = status; // status contains {connected: boolean, botInfo?: object}

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold">Telegram Integration</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Connect your Telegram account to receive real-time notifications about grants, projects, and collaborations directly in your chat.
          </p>
        </div>

        {/* Privacy Mode Toggle */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <CardTitle>Privacy Settings</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={privacyMode ? "default" : "secondary"}>
                  {privacyMode ? "ZKP Mode" : "Standard Mode"}
                </Badge>
              </div>
            </div>
            <CardDescription>
              Choose between standard integration or maximum privacy with zero-knowledge proofs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="privacy-mode"
                checked={privacyMode}
                onChange={(e) => setPrivacyMode(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="privacy-mode">
                Enable Zero-Knowledge Privacy Mode (Recommended)
              </Label>
            </div>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">
                {privacyMode ? "🔒 Maximum Privacy Mode" : "📱 Standard Mode"}
              </h4>
              <p className="text-sm text-muted-foreground">
                {privacyMode 
                  ? "Your Telegram account will be linked anonymously using zero-knowledge commitments. Your identity remains completely private while still enabling all notification features."
                  : "Standard Telegram integration with direct account linking. Your Telegram username may be stored for notification purposes."
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                <CardTitle>Integration Status</CardTitle>
              </div>
              <Badge variant={integrationStatus?.connected ? "default" : "secondary"}>
                {integrationStatus?.connected ? "Live" : "Demo Mode"}
              </Badge>
            </div>
            <CardDescription>
              {privacyMode ? zkpStatus?.data?.description : integrationStatus?.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {integrationStatus?.connected ? (
              <Alert className="mb-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Bot "{integrationStatus.botInfo?.username}" is connected and ready to send notifications.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Currently running in demo mode. Provide a Telegram bot token to enable live notifications.
                </AlertDescription>
              </Alert>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">
                  {privacyMode ? "ZKP Features" : "Available Features"}
                </h4>
                <ul className="space-y-1 text-sm">
                  {(privacyMode ? zkpStatus?.data?.zkpFeatures : integrationStatus?.features)?.map((feature: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">
                  {privacyMode ? "Privacy Benefits" : "Bot Commands"}
                </h4>
                <ul className="space-y-1 text-sm">
                  {privacyMode ? [
                    "Complete identity protection",
                    "Anonymous collaboration matching", 
                    "Encrypted notification channels",
                    "Zero-knowledge reputation proofs"
                  ].map((benefit: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-blue-500" />
                      {benefit}
                    </li>
                  )) : integrationStatus?.commands?.map((command: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="text-muted-foreground">{command}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Connect Your Account
            </CardTitle>
            <CardDescription>
              Link your Telegram account to start receiving notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ID Discovery Instructions */}
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Find Your Telegram ID</AlertTitle>
              <AlertDescription>
                <div className="space-y-2 mt-2">
                  <p>To get your numerical Telegram ID:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Open Telegram and search for <code className="bg-muted px-1 rounded">@userinfobot</code></li>
                    <li>Start a chat and send any message</li>
                    <li>Copy the "Id" number from the bot's reply</li>
                  </ol>
                  <div className="mt-3 p-2 bg-muted rounded text-xs">
                    <strong>Alternative bots:</strong> @chatidbot or @myidbot
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => window.open('https://t.me/userinfobot', '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open @userinfobot
                  </Button>
                </div>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="telegramId">Telegram ID (numerical)</Label>
                <Input
                  id="telegramId"
                  type="number"
                  placeholder="e.g., 123456789"
                  value={connectForm.telegramId}
                  onChange={(e) => setConnectForm(prev => ({ ...prev, telegramId: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the numerical ID from @userinfobot, not your username
                </p>
              </div>
              <div>
                <Label htmlFor="username">Username (optional)</Label>
                <Input
                  id="username"
                  placeholder="@username"
                  value={connectForm.username}
                  onChange={(e) => setConnectForm(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="Your first name"
                value={connectForm.firstName}
                onChange={(e) => setConnectForm(prev => ({ ...prev, firstName: e.target.value }))}
              />
            </div>
            
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                To find your Telegram ID, message @userinfobot on Telegram or check your account settings.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={handleConnect}
              disabled={connectMutation.isPending}
              className="w-full"
            >
              {connectMutation.isPending ? "Connecting..." : "Connect Telegram Account"}
            </Button>
          </CardContent>
        </Card>

        {/* Demo Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Test Notifications
            </CardTitle>
            <CardDescription>
              Try out different notification types to see how they work
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                onClick={() => handleDemoNotification('grant_match')}
                disabled={demoNotificationMutation.isPending}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <Bell className="h-5 w-5" />
                <span className="text-sm">Grant Match</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleDemoNotification('project_update')}
                disabled={demoNotificationMutation.isPending}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <Users className="h-5 w-5" />
                <span className="text-sm">Project Update</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleDemoNotification('referral_alert')}
                disabled={demoNotificationMutation.isPending}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <Users className="h-5 w-5" />
                <span className="text-sm">Referral Alert</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleDemoNotification('token_reward')}
                disabled={demoNotificationMutation.isPending}
                className="flex flex-col items-center gap-2 h-auto py-4"
              >
                <Zap className="h-5 w-5" />
                <span className="text-sm">Token Reward</span>
              </Button>
            </div>
            
            <Separator className="my-6" />
            
            {/* Phase 2: Interactive Features */}
            <div className="space-y-4">
              <h4 className="font-medium">Interactive Features</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  onClick={handleInteractiveMessage}
                  disabled={interactiveMessageMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  {interactiveMessageMutation.isPending ? "Sending..." : "Send Interactive Message"}
                </Button>
                
                <Button
                  onClick={handleCreateProjectGroup}
                  disabled={createGroupMutation.isPending}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  {createGroupMutation.isPending ? "Creating..." : "Create Project Group"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Interactive messages include action buttons. Project groups are secure chat spaces for team collaboration.
              </p>
            </div>
            
            <Separator className="my-6" />
            
            {/* Phase 3: AI-Enhanced Features */}
            <div className="space-y-4">
              <h4 className="font-medium">AI-Enhanced Automation</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  onClick={handleAITeamMatching}
                  disabled={aiTeamMatchingMutation.isPending}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Brain className="h-4 w-4" />
                  {aiTeamMatchingMutation.isPending ? "Matching..." : "AI Team Matching"}
                </Button>
                
                <Button
                  onClick={handleAIGrantMatching}
                  disabled={aiGrantMatchingMutation.isPending}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Target className="h-4 w-4" />
                  {aiGrantMatchingMutation.isPending ? "Analyzing..." : "AI Grant Matching"}
                </Button>
                
                <Button
                  onClick={handleSmartNotification}
                  disabled={aiSmartNotificationMutation.isPending}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Sparkles className="h-4 w-4" />
                  {aiSmartNotificationMutation.isPending ? "Generating..." : "Smart Notification"}
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      disabled={aiWorkflowMutation.isPending}
                      className="flex items-center gap-2"
                    >
                      <Cog className="h-4 w-4" />
                      {aiWorkflowMutation.isPending ? "Automating..." : "Workflow Automation"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleAIWorkflowAutomation('grant_application')}>
                      Grant Application
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAIWorkflowAutomation('team_onboarding')}>
                      Team Onboarding
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAIWorkflowAutomation('milestone_tracking')}>
                      Milestone Tracking
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAIWorkflowAutomation('funding_distribution')}>
                      Funding Distribution
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-sm text-muted-foreground">
                AI-powered automation for team formation, grant discovery, and workflow management with privacy-preserving features.
              </p>
            </div>
            
            <Separator className="my-6" />
            
            <div className="space-y-4">
              <h4 className="font-medium">Next Steps</h4>
              <ul className="space-y-2 text-sm">
                {integrationStatus?.connected ? [
                  "Start a chat with your bot to verify connection",
                  "Test notification features using the demo buttons above",
                  "Explore ZKP privacy features for anonymous collaboration",
                  "Set up AI-powered team matching workflows",
                  "Configure grant notification preferences"
                ].map((step: string, index: number) => (
                  <li key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    {step}
                  </li>
                )) : [
                  "Add a valid Telegram bot token to enable live notifications",
                  "Create a bot using @BotFather on Telegram",
                  "Copy the bot token to your environment variables",
                  "Restart the application to connect your bot"
                ].map((step: string, index: number) => (
                  <li key={index} className="flex items-center gap-2">
                    <AlertCircle className="h-3 w-3 text-orange-500" />
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}