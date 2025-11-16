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
  Shield,
  Users,
  Trophy,
  MessageSquare,
  Zap,
  Star,
  Crown,
  Gift,
  ChevronRight,
  Verified,
  Bot,
  Coins,
  Target
} from 'lucide-react';

interface DiscordIntegration {
  connected: boolean;
  discordId?: string;
  username?: string;
  roles: string[];
  serverMemberships: DiscordServer[];
  reputation: {
    helpScore: number;
    badges: string[];
    tokens: number;
    level: number;
  };
}

interface DiscordServer {
  id: string;
  name: string;
  memberCount: number;
  specialChannels: string[];
}

interface ZKPCredential {
  id: string;
  type: 'expertise' | 'achievement' | 'contribution';
  title: string;
  verified: boolean;
  discordRole?: string;
  proof: string;
}

export default function DiscordShowcase() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFeature, setSelectedFeature] = useState('reputation');

  // Fetch Discord integration status
  const { data: discordData, isLoading } = useQuery<DiscordIntegration>({
    queryKey: ['/api/discord/integration'],
    enabled: !!user
  });

  // Fetch ZKP credentials
  const { data: credentials } = useQuery<ZKPCredential[]>({
    queryKey: ['/api/zkp/credentials'],
    enabled: !!user
  });

  // Connect Discord mutation
  const connectDiscord = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/auth/discord/connect');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    },
    onError: () => {
      toast({
        title: "Connection Failed",
        description: "Unable to connect to Discord. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Generate ZKP credential mutation
  const generateCredential = useMutation({
    mutationFn: async (type: string) => {
      const response = await apiRequest('POST', '/api/zkp/generate-credential', { type });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/zkp/credentials'] });
      toast({
        title: "Credential Generated!",
        description: "Your ZKP credential has been created and is ready to use.",
      });
    }
  });

  const features = [
    {
      id: 'reputation',
      title: 'Cross-Platform Reputation',
      icon: Shield,
      description: 'ZKP-verified skills unlock Discord roles automatically'
    },
    {
      id: 'matching',
      title: 'AI Team Matching',
      icon: Users,
      description: 'Get matched with developers and auto-join collaboration channels'
    },
    {
      id: 'rewards',
      title: 'Help-to-Earn System',
      icon: Coins,
      description: 'Earn tokens and reputation by helping others in Discord'
    },
    {
      id: 'grants',
      title: 'Grant Discovery',
      icon: Target,
      description: 'Receive personalized grant alerts and team formation'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <MessageSquare className="h-8 w-8 text-indigo-600" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Discord Integration Showcase
            </h1>
          </div>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the future of professional networking with ZKP-verified credentials, 
            AI-powered matching, and cross-platform reputation systems.
          </p>
        </div>

        {/* Connection Status */}
        <Card className="border-2 border-indigo-200 bg-white/70 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-indigo-600" />
              Discord Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!discordData?.connected ? (
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">Connect Your Discord Account</h3>
                  <p className="text-gray-600">Link your Discord to unlock ZKP-verified roles and AI-powered features</p>
                </div>
                <Button 
                  onClick={() => connectDiscord.mutate()}
                  disabled={connectDiscord.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {connectDiscord.isPending ? 'Connecting...' : 'Connect Discord'}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <Verified className="h-5 w-5 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-900">Connected as {discordData.username}</h3>
                    <p className="text-green-700">ZKP credentials active • Level {discordData.reputation.level}</p>
                  </div>
                  <div className="ml-auto flex gap-2">
                    <Badge variant="secondary">{discordData.reputation.tokens} tokens</Badge>
                    <Badge variant="outline">Help Score: {discordData.reputation.helpScore}</Badge>
                  </div>
                </div>

                {/* Server Memberships */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {discordData.serverMemberships.map((server) => (
                    <div key={server.id} className="p-3 border rounded-lg bg-white/50">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">{server.name}</h4>
                        <span className="text-sm text-gray-500">{server.memberCount} members</span>
                      </div>
                      <div className="flex gap-1 mt-2">
                        {server.specialChannels.map((channel) => (
                          <Badge key={channel} variant="outline" className="text-xs">
                            {channel}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Feature Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feature Navigation */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Integration Features</CardTitle>
              <CardDescription>Explore cutting-edge Discord capabilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <button
                    key={feature.id}
                    onClick={() => setSelectedFeature(feature.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                      selectedFeature === feature.id
                        ? 'bg-indigo-50 border-2 border-indigo-200'
                        : 'hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${
                        selectedFeature === feature.id ? 'text-indigo-600' : 'text-gray-500'
                      }`} />
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{feature.title}</h3>
                        <p className="text-xs text-gray-600 mt-1">{feature.description}</p>
                      </div>
                      <ChevronRight className={`h-4 w-4 transition-transform ${
                        selectedFeature === feature.id ? 'rotate-90' : ''
                      }`} />
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Feature Details */}
          <div className="lg:col-span-2">
            {selectedFeature === 'reputation' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-indigo-600" />
                    ZKP Cross-Platform Reputation
                  </CardTitle>
                  <CardDescription>
                    Zero-knowledge proof credentials that verify your expertise without revealing personal details
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* ZKP Credentials */}
                  <div className="space-y-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Verified className="h-4 w-4 text-green-600" />
                      Your ZKP Credentials
                    </h3>
                    <div className="grid gap-3">
                      {credentials?.map((credential) => (
                        <div key={credential.id} className="flex items-center justify-between p-3 border rounded-lg bg-white/70">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              credential.verified ? 'bg-green-500' : 'bg-yellow-500'
                            }`} />
                            <div>
                              <h4 className="font-medium">{credential.title}</h4>
                              <p className="text-sm text-gray-600 capitalize">{credential.type}</p>
                            </div>
                          </div>
                          {credential.discordRole && (
                            <Badge variant="secondary">@{credential.discordRole}</Badge>
                          )}
                        </div>
                      )) ?? (
                        <div className="text-center py-8 text-gray-500">
                          <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>No credentials generated yet</p>
                          <Button 
                            className="mt-3"
                            onClick={() => generateCredential.mutate('expertise')}
                            disabled={generateCredential.isPending}
                          >
                            Generate First Credential
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Discord Role Mapping */}
                  <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <h4 className="font-semibold text-indigo-900 mb-2">How It Works</h4>
                    <div className="space-y-2 text-sm text-indigo-800">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                        <span>Complete challenges and contribute to earn reputation</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                        <span>ZKP credentials are generated proving your skills</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                        <span>Discord roles automatically assigned based on verified expertise</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-indigo-600 rounded-full" />
                        <span>Access exclusive channels and opportunities</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedFeature === 'matching' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-600" />
                    AI-Powered Team Matching
                  </CardTitle>
                  <CardDescription>
                    Get matched with complementary developers and automatically join collaboration spaces
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg bg-white/70">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Bot className="h-4 w-4 text-blue-600" />
                        Smart Matching
                      </h3>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li>• AI analyzes your skills and project needs</li>
                        <li>• Finds developers with complementary expertise</li>
                        <li>• Creates Discord channels for matched teams</li>
                        <li>• Suggests collaboration opportunities</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 border rounded-lg bg-white/70">
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-600" />
                        Instant Collaboration
                      </h3>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li>• Voice channels for real-time discussions</li>
                        <li>• Shared workspaces for code collaboration</li>
                        <li>• Project planning and milestone tracking</li>
                        <li>• Resource sharing and knowledge exchange</li>
                      </ul>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                    <h4 className="font-semibold mb-3">Recent Matches</h4>
                    <div className="space-y-3">
                      {[
                        { name: "Alex (Frontend)", skills: "React, TypeScript", match: "92%" },
                        { name: "Maya (Blockchain)", skills: "Solidity, Web3", match: "88%" },
                        { name: "Jordan (AI/ML)", skills: "Python, TensorFlow", match: "85%" }
                      ].map((match, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                          <div>
                            <h5 className="font-medium">{match.name}</h5>
                            <p className="text-sm text-gray-600">{match.skills}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary">{match.match} match</Badge>
                            <Button size="sm" className="ml-2">Connect</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedFeature === 'rewards' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-indigo-600" />
                    Help-to-Earn Ecosystem
                  </CardTitle>
                  <CardDescription>
                    Earn tokens, reputation, and exclusive access by helping the community
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gradient-to-b from-yellow-50 to-orange-50 rounded-lg border">
                      <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                      <h3 className="font-semibold">Reputation Points</h3>
                      <p className="text-2xl font-bold text-yellow-600">1,247</p>
                      <p className="text-sm text-gray-600">Helping others solve problems</p>
                    </div>
                    
                    <div className="text-center p-4 bg-gradient-to-b from-green-50 to-emerald-50 rounded-lg border">
                      <Coins className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <h3 className="font-semibold">HDG Tokens</h3>
                      <p className="text-2xl font-bold text-green-600">534</p>
                      <p className="text-sm text-gray-600">Earned through contributions</p>
                    </div>
                    
                    <div className="text-center p-4 bg-gradient-to-b from-purple-50 to-indigo-50 rounded-lg border">
                      <Crown className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                      <h3 className="font-semibold">Expert Level</h3>
                      <p className="text-2xl font-bold text-purple-600">7</p>
                      <p className="text-sm text-gray-600">Unlock exclusive channels</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Earning Opportunities</h4>
                    <div className="grid gap-3">
                      {[
                        { action: "Answer technical questions", reward: "5-25 HDG + Rep", difficulty: "Easy" },
                        { action: "Code review and feedback", reward: "15-50 HDG + Rep", difficulty: "Medium" },
                        { action: "Mentor newcomers", reward: "25-100 HDG + Rep", difficulty: "Medium" },
                        { action: "Create educational content", reward: "50-200 HDG + Rep", difficulty: "Hard" }
                      ].map((opportunity, i) => (
                        <div key={i} className="flex items-center justify-between p-3 border rounded-lg bg-white/70">
                          <div>
                            <h5 className="font-medium">{opportunity.action}</h5>
                            <p className="text-sm text-gray-600">Difficulty: {opportunity.difficulty}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">{opportunity.reward}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedFeature === 'grants' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-indigo-600" />
                    Grant Discovery & Team Formation
                  </CardTitle>
                  <CardDescription>
                    AI-powered grant matching with automatic team assembly
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                    <h4 className="font-semibold text-indigo-900 mb-3">How Grant Discovery Works</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                          <span className="text-sm">AI analyzes your skills and interests</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                          <span className="text-sm">Scans 500+ grant databases daily</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                          <span className="text-sm">Finds complementary team members</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                          <span className="text-sm">Creates Discord collaboration space</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-semibold">Matched Opportunities</h4>
                    <div className="grid gap-4">
                      {[
                        {
                          title: "AI for Climate Change Solutions",
                          funder: "Green Tech Foundation",
                          amount: "$50,000",
                          deadline: "June 15, 2025",
                          match: "94%",
                          teamNeeds: ["AI/ML Engineer", "Climate Scientist", "Frontend Developer"]
                        },
                        {
                          title: "Decentralized Identity Platform",
                          funder: "Web3 Innovation Fund",
                          amount: "$75,000",
                          deadline: "July 1, 2025",
                          match: "89%",
                          teamNeeds: ["Blockchain Developer", "Security Expert", "UX Designer"]
                        }
                      ].map((grant, i) => (
                        <div key={i} className="p-4 border rounded-lg bg-white/70">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h5 className="font-semibold">{grant.title}</h5>
                              <p className="text-sm text-gray-600">{grant.funder} • {grant.amount}</p>
                            </div>
                            <Badge variant="secondary">{grant.match} match</Badge>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {grant.teamNeeds.map((need) => (
                              <Badge key={need} variant="outline" className="text-xs">{need}</Badge>
                            ))}
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Deadline: {grant.deadline}</span>
                            <Button size="sm">Join Team</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Call to Action */}
        {!discordData?.connected && (
          <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0">
            <CardContent className="text-center py-8">
              <h2 className="text-2xl font-bold mb-4">Ready to Transform Your Discord Experience?</h2>
              <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">
                Connect your Discord account to unlock ZKP-verified credentials, AI-powered team matching, 
                and the revolutionary help-to-earn ecosystem.
              </p>
              <Button 
                size="lg"
                variant="secondary"
                onClick={() => connectDiscord.mutate()}
                disabled={connectDiscord.isPending}
                className="bg-white text-indigo-600 hover:bg-gray-100"
              >
                {connectDiscord.isPending ? 'Connecting...' : 'Connect Discord Now'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}