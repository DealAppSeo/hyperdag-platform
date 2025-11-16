/**
 * Discord Integration Component for HyperDAG
 * 
 * Provides Discord authentication and community features
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Users, 
  Megaphone, 
  Coins, 
  UserPlus, 
  Settings,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';

interface DiscordStats {
  memberCount: number;
  onlineCount: number;
  projectChannels: number;
  activeProjects: number;
}

export default function DiscordIntegration() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [discordStats, setDiscordStats] = useState<DiscordStats | null>(null);

  const isDiscordConnected = user?.discordVerified || false;
  const discordUsername = user?.discordUsername;

  useEffect(() => {
    fetchDiscordStats();
  }, []);

  const fetchDiscordStats = async () => {
    try {
      const response = await apiRequest('GET', '/api/discord/stats');
      const data = await response.json();
      setDiscordStats(data);
    } catch (error) {
      console.error('Failed to fetch Discord stats:', error);
    }
  };

  const handleConnectDiscord = async () => {
    setIsConnecting(true);
    try {
      const response = await apiRequest('GET', '/api/auth/discord/auth');
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('No auth URL received');
      }
    } catch (error) {
      toast({
        title: 'Discord Connection Failed',
        description: 'Unable to connect to Discord. Please try again later.',
        variant: 'destructive'
      });
      setIsConnecting(false);
    }
  };

  const handleDisconnectDiscord = async () => {
    setIsDisconnecting(true);
    try {
      await apiRequest('POST', '/api/auth/discord/disconnect');
      
      toast({
        title: 'Discord Disconnected',
        description: 'Your Discord account has been disconnected successfully.',
      });
      
      // Refresh page to update user state
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Disconnect Failed',
        description: 'Unable to disconnect Discord. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  const joinDiscordServer = () => {
    window.open('https://discord.gg/hyperdag', '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Connection Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageCircle className="h-6 w-6 text-indigo-600" />
              <div>
                <CardTitle>Discord Integration</CardTitle>
                <CardDescription>
                  Connect with the HyperDAG community and get real-time collaboration opportunities
                </CardDescription>
              </div>
            </div>
            {isDiscordConnected && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isDiscordConnected ? (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Discord connected as <strong>{discordUsername}</strong>. 
                  You'll receive AI-powered team matching notifications and project updates!
                </AlertDescription>
              </Alert>
              
              <div className="flex space-x-3">
                <Button onClick={joinDiscordServer} className="flex-1">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Discord Server
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDisconnectDiscord}
                  disabled={isDisconnecting}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Connect Discord to unlock AI-powered team matching, instant project notifications, 
                  and exclusive community features.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={handleConnectDiscord} 
                disabled={isConnecting}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                {isConnecting ? 'Connecting...' : 'Connect Discord'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Community Stats */}
      {discordStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Community Stats</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">{discordStats.memberCount}</div>
                <div className="text-sm text-gray-500">Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{discordStats.onlineCount}</div>
                <div className="text-sm text-gray-500">Online</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{discordStats.projectChannels}</div>
                <div className="text-sm text-gray-500">Project Channels</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{discordStats.activeProjects}</div>
                <div className="text-sm text-gray-500">Active Projects</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Discord Features */}
      <Card>
        <CardHeader>
          <CardTitle>Discord Community Features</CardTitle>
          <CardDescription>
            What you get when you join the HyperDAG Discord community
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <Megaphone className="h-5 w-5 text-blue-500 mt-1" />
              <div>
                <h4 className="font-medium">Project Announcements</h4>
                <p className="text-sm text-gray-600">
                  Get notified instantly when new projects need your skills
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Coins className="h-5 w-5 text-yellow-500 mt-1" />
              <div>
                <h4 className="font-medium">Grant Alerts</h4>
                <p className="text-sm text-gray-600">
                  Discover funding opportunities matched to your interests
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <UserPlus className="h-5 w-5 text-green-500 mt-1" />
              <div>
                <h4 className="font-medium">AI Team Matching</h4>
                <p className="text-sm text-gray-600">
                  Receive DMs when our AI finds perfect collaboration partners
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <Users className="h-5 w-5 text-purple-500 mt-1" />
              <div>
                <h4 className="font-medium">Developer Networking</h4>
                <p className="text-sm text-gray-600">
                  Connect with like-minded builders in dedicated channels
                </p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
            <h4 className="font-medium text-indigo-900 mb-2">Available Bot Commands</h4>
            <div className="space-y-1 text-sm">
              <div><code className="bg-white px-2 py-1 rounded">!hyperdag profile</code> - Link your HyperDAG profile</div>
              <div><code className="bg-white px-2 py-1 rounded">!hyperdag projects</code> - Browse active projects</div>
              <div><code className="bg-white px-2 py-1 rounded">!hyperdag grants</code> - Discover funding opportunities</div>
              <div><code className="bg-white px-2 py-1 rounded">!hyperdag match</code> - Get AI team matching info</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      {!isDiscordConnected && (
        <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-bold">Ready to Join the Community?</h3>
              <p className="text-indigo-100">
                Connect Discord to unlock AI-powered collaboration and never miss an opportunity again.
              </p>
              <Button 
                onClick={handleConnectDiscord} 
                disabled={isConnecting}
                className="bg-white text-indigo-600 hover:bg-gray-100"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                {isConnecting ? 'Connecting...' : 'Connect Discord Now'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}