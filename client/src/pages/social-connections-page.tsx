/**
 * Social Connections Management Page
 * 
 * Central hub for managing all social media integrations
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  MessageCircle, 
  Users, 
  HelpCircle,
  Twitter,
  Linkedin,
  CheckCircle,
  AlertCircle,
  Settings,
  TrendingUp,
  Award,
  Bell,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { Layout } from '@/components/layout/layout';

interface SocialPlatform {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  connected: boolean;
  username?: string;
  reputation?: number;
  lastSync?: string;
  benefits: string[];
  comingSoon?: boolean;
}

interface SocialStats {
  totalScore: number;
  connectedPlatforms: number;
  verifiedPlatforms: string[];
  reputationBonus: number;
}

export default function SocialConnectionsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [platforms, setPlatforms] = useState<SocialPlatform[]>([]);
  const [socialStats, setSocialStats] = useState<SocialStats | null>(null);
  const [notificationSettings, setNotificationSettings] = useState({
    teamMatches: true,
    projectUpdates: true,
    grantOpportunities: true,
    communityActivity: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSocialConnections();
    loadSocialStats();
  }, []);

  const loadSocialConnections = async () => {
    try {
      // Load current connection status
      const mockPlatforms: SocialPlatform[] = [
        {
          id: 'telegram',
          name: 'Telegram',
          description: 'Connect with the Web3 community via Telegram',
          icon: MessageCircle,
          color: 'bg-blue-500',
          connected: user?.telegramVerified || false,
          username: user?.telegramUsername,
          benefits: [
            'Instant notifications for team matches',
            'Direct project collaboration',
            'Community announcements',
            'Real-time developer networking'
          ]
        },
        {
          id: 'slack',
          name: 'Slack',
          description: 'Professional team collaboration and networking',
          icon: Users,
          color: 'bg-purple-600',
          connected: false, // Add Slack connection status when available
          benefits: [
            'Team workspace integration',
            'Project collaboration tools',
            'Professional networking',
            'Automated notifications'
          ]
        },
        {
          id: 'discord',
          name: 'Discord',
          description: 'Join the HyperDAG community for real-time collaboration',
          icon: MessageCircle,
          color: 'bg-indigo-500',
          connected: user?.discordVerified || false,
          username: user?.discordUsername,
          benefits: [
            'AI-powered team matching notifications',
            'Instant project announcements',
            'Direct developer networking',
            'Exclusive community events'
          ],
          comingSoon: true
        },
        {
          id: 'github',
          name: 'GitHub',
          description: 'Verify coding expertise and showcase your repositories',
          icon: HelpCircle,
          color: 'bg-gray-800',
          connected: user?.githubVerified || false,
          username: user?.githubIdHash ? 'Connected' : undefined,
          benefits: [
            'Repository verification',
            'Coding skill assessment',
            'Project portfolio showcase',
            'Developer credibility scoring'
          ],
          comingSoon: true
        },
        {
          id: 'reddit',
          name: 'Reddit',
          description: 'Share projects and discover opportunities in developer communities',
          icon: Users,
          color: 'bg-orange-500',
          connected: false,
          benefits: [
            'Auto-post projects to relevant subreddits',
            'Karma-based reputation verification',
            'Community engagement tracking',
            'Developer discussion insights'
          ],
          comingSoon: true
        },
        {
          id: 'stackoverflow',
          name: 'Stack Overflow',
          description: 'Verify technical expertise and find coding partners',
          icon: HelpCircle,
          color: 'bg-orange-600',
          connected: false,
          benefits: [
            'Reputation score integration',
            'Technical skill verification',
            'Q&A contribution tracking',
            'Expert developer matching'
          ],
          comingSoon: true
        },
        {
          id: 'twitter',
          name: 'X (Twitter)',
          description: 'Share achievements and connect with the Web3 community',
          icon: Twitter,
          color: 'bg-black',
          connected: false,
          benefits: [
            'Auto-announce project milestones',
            'Grant opportunity sharing',
            'Developer network expansion',
            'Industry trend insights'
          ],
          comingSoon: true
        },
        {
          id: 'linkedin',
          name: 'LinkedIn',
          description: 'Professional networking and career opportunities',
          icon: Linkedin,
          color: 'bg-blue-600',
          connected: false,
          benefits: [
            'Professional profile verification',
            'Career opportunity matching',
            'Industry connection tracking',
            'Business development leads'
          ],
          comingSoon: true
        }
      ];

      setPlatforms(mockPlatforms);
    } catch (error) {
      console.error('Failed to load social connections:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSocialStats = async () => {
    try {
      const stats: SocialStats = {
        totalScore: 75,
        connectedPlatforms: platforms.filter(p => p.connected).length,
        verifiedPlatforms: ['discord'],
        reputationBonus: 15
      };
      setSocialStats(stats);
    } catch (error) {
      console.error('Failed to load social stats:', error);
    }
  };

  const handleConnect = async (platformId: string) => {
    const platform = platforms.find(p => p.id === platformId);
    
    // Check if platform is marked as coming soon
    if (platform?.comingSoon) {
      toast({
        title: 'Coming Soon',
        description: `${platform.name} integration is being configured. OAuth redirect URLs need to be updated for this environment.`,
      });
      return;
    }

    if (platformId === 'telegram') {
      try {
        const response = await apiRequest('GET', '/api/auth/telegram/auth');
        const data = await response.json();
        
        if (data.authUrl) {
          // Open in new window for better UX
          window.open(data.authUrl, '_blank', 'width=500,height=600');
        }
      } catch (error) {
        toast({
          title: 'Connection Failed',
          description: 'Unable to connect to Telegram. Please try again later.',
          variant: 'destructive'
        });
      }
    } else if (platformId === 'slack') {
      try {
        const response = await apiRequest('GET', '/api/auth/slack/auth');
        const data = await response.json();
        
        if (data.authUrl) {
          // Open in new window for better UX
          window.open(data.authUrl, '_blank', 'width=500,height=600');
        }
      } catch (error) {
        toast({
          title: 'Connection Failed',
          description: 'Unable to connect to Slack. Please try again later.',
          variant: 'destructive'
        });
      }
    } else {
      toast({
        title: 'Coming Soon',
        description: `${platform?.name || 'This'} integration is coming soon!`,
      });
    }
  };

  const handleDisconnect = async (platformId: string) => {
    if (platformId === 'discord') {
      try {
        await apiRequest('POST', '/api/auth/discord/disconnect');
        toast({
          title: 'Disconnected',
          description: 'Discord has been disconnected successfully.',
        });
        window.location.reload();
      } catch (error) {
        toast({
          title: 'Disconnect Failed',
          description: 'Unable to disconnect. Please try again.',
          variant: 'destructive'
        });
      }
    }
  };

  const connectedCount = platforms.filter(p => p.connected).length;
  const totalPlatforms = platforms.length;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Social Connections</h1>
          <p className="text-gray-600">
            Connect your social accounts to unlock AI-powered networking and enhanced reputation scoring
          </p>
        </div>

        {/* Social Stats Overview */}
        {socialStats && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span>Social Presence Score</span>
              </CardTitle>
              <CardDescription>
                Your combined social media reputation and community engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{socialStats.totalScore}</div>
                  <div className="text-sm text-gray-500">Overall Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{connectedCount}/{totalPlatforms}</div>
                  <div className="text-sm text-gray-500">Connected</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{socialStats.verifiedPlatforms.length}</div>
                  <div className="text-sm text-gray-500">Verified</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600">+{socialStats.reputationBonus}</div>
                  <div className="text-sm text-gray-500">Reputation Bonus</div>
                </div>
              </div>
              
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span>Connection Progress</span>
                  <span>{connectedCount}/{totalPlatforms} platforms</span>
                </div>
                <Progress value={(connectedCount / totalPlatforms) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Platform Connections */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {platforms.map((platform) => (
            <Card key={platform.id} className="relative overflow-hidden">
              {platform.comingSoon && (
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${platform.color} text-white`}>
                      <platform.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{platform.name}</CardTitle>
                      <CardDescription>{platform.description}</CardDescription>
                    </div>
                  </div>
                  
                  {platform.connected ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Not Connected
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {platform.connected && platform.username && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Connected as <strong>{platform.username}</strong>
                    </AlertDescription>
                  </Alert>
                )}
                
                <div>
                  <h4 className="font-medium mb-2">Benefits:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {platform.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-center">
                        <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex space-x-2">
                  {platform.connected ? (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDisconnect(platform.id)}
                        className="flex-1"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Disconnect
                      </Button>
                      <Button size="sm" onClick={() => window.open('#', '_blank')}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Profile
                      </Button>
                    </>
                  ) : (
                    <Button 
                      onClick={() => handleConnect(platform.id)} 
                      disabled={platform.comingSoon}
                      className="w-full"
                      variant={platform.comingSoon ? "outline" : "default"}
                    >
                      {platform.comingSoon ? (
                        <>
                          <Bell className="h-4 w-4 mr-2" />
                          Notify Me
                        </>
                      ) : (
                        <>
                          <platform.icon className="h-4 w-4 mr-2" />
                          Connect {platform.name}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="h-5 w-5" />
              <span>Notification Preferences</span>
            </CardTitle>
            <CardDescription>
              Choose how you want to receive updates across your connected platforms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Team Match Notifications</div>
                <div className="text-sm text-gray-500">Get notified when AI finds perfect collaboration partners</div>
              </div>
              <Switch 
                checked={notificationSettings.teamMatches}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, teamMatches: checked }))
                }
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Project Updates</div>
                <div className="text-sm text-gray-500">Receive updates on projects you're involved in</div>
              </div>
              <Switch 
                checked={notificationSettings.projectUpdates}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, projectUpdates: checked }))
                }
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Grant Opportunities</div>
                <div className="text-sm text-gray-500">Be the first to know about relevant funding opportunities</div>
              </div>
              <Switch 
                checked={notificationSettings.grantOpportunities}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, grantOpportunities: checked }))
                }
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Community Activity</div>
                <div className="text-sm text-gray-500">General community updates and announcements</div>
              </div>
              <Switch 
                checked={notificationSettings.communityActivity}
                onCheckedChange={(checked) => 
                  setNotificationSettings(prev => ({ ...prev, communityActivity: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}