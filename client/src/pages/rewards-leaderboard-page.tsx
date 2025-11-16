import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Layout } from "@/components/layout/layout";
import BadgeDisplay from "@/components/ui/badge-display";
import UserAvatar from "@/components/ui/user-avatar";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Gift, Award, Coins, Loader2, AlertCircle, ArrowRight, TrendingUp, Trophy, Medal, Users, Search, Info } from "lucide-react";

export default function RewardsLeaderboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [pointsToConvert, setPointsToConvert] = useState(50);
  const [leaderboardTab, setLeaderboardTab] = useState("tokens");
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: userStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/user/stats"],
    enabled: !!user,
  });
  
  const { data: leaderboard, isLoading: isLoadingLeaderboard } = useQuery({
    queryKey: ["/api/leaderboard"],
    enabled: !!user,
  });
  
  const convertMutation = useMutation({
    mutationFn: async (points: number) => {
      const res = await apiRequest("POST", "/api/convert-points", { points });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "Points converted",
        description: `Successfully converted ${pointsToConvert} points to ${Math.floor(pointsToConvert / 50)} HDAG tokens`,
      });
    },
    onError: (error) => {
      toast({
        title: "Conversion failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });
  
  const handleConvertPoints = () => {
    if (!user) return;
    
    if (pointsToConvert < 50) {
      toast({
        title: "Minimum conversion required",
        description: "You need at least 50 points to convert to tokens",
        variant: "destructive",
      });
      return;
    }
    
    if (pointsToConvert > (user.points || 0)) {
      toast({
        title: "Not enough points",
        description: "You don't have enough points for this conversion",
        variant: "destructive",
      });
      return;
    }
    
    convertMutation.mutate(pointsToConvert);
  };
  
  if (!user) return null;
  
  const tokensToEarn = Math.floor(pointsToConvert / 50);
  
  const badgeDescriptions = {
    creator: "Create proposals and projects",
    networker: "Refer friends to the platform",
    backer: "Support and fund projects",
    innovator: "Contribute new ideas and solutions"
  };
  
  const upcomingBadges = [
    { name: "Contributor", description: "Participate actively in community discussions", points: 200 },
    { name: "Mentor", description: "Help new members get started", points: 500 },
    { name: "Visionary", description: "Successfully complete 5 projects", points: 1000 },
  ];
  
  // Filter leaderboard based on search query
  const filteredLeaderboard = leaderboard?.filter(entry => 
    entry.username.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Sort leaderboard based on active tab
  const sortedLeaderboard = filteredLeaderboard ? [...filteredLeaderboard].sort((a, b) => {
    if (leaderboardTab === "tokens") return b.tokens - a.tokens;
    if (leaderboardTab === "referrals") return b.referrals - a.referrals;
    if (leaderboardTab === "badges") return b.badges - a.badges;
    return 0;
  }) : [];
  
  // Find current user's rank
  const currentUserRank = sortedLeaderboard.findIndex(entry => entry.id === user.id) + 1;
  
  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto pb-20 md:pb-6">
        <h1 className="text-2xl font-bold mb-6">Rewards & Leaderboard</h1>
        
        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Award className="mr-2 h-5 w-5 text-primary" />
                Reputation Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{user.reputationScore || 0}</p>
              <p className="text-sm text-gray-500 mt-2">
                Your influence in the HyperDAG ecosystem
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Gift className="mr-2 h-5 w-5 text-secondary" />
                Points Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-secondary">{user.points || 0}</p>
              <p className="text-sm text-gray-500 mt-2">
                You earn points for each activity and badge
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Coins className="mr-2 h-5 w-5 text-accent" />
                Token Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-accent">{user.tokens || 0} HDAG</p>
              <p className="text-sm text-gray-500 mt-2">
                Tokens can be used for staking and governance
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-4 mb-2">
            <TabsTrigger value="overview" className="flex items-center">
              <Info className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="badges" className="flex items-center">
              <Award className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Badges</span>
            </TabsTrigger>
            <TabsTrigger value="points" className="flex items-center">
              <Gift className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Points</span>
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center">
              <Trophy className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Leaderboard</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab - Combines key elements from all sections */}
          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Your Rank Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Rank</CardTitle>
                  <CardDescription>Your position on the HyperDAG leaderboard</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-center">
                    <Trophy className="h-10 w-10 mr-4 text-yellow-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Current Rank</p>
                      <p className="text-3xl font-bold text-gray-800">
                        {isLoadingLeaderboard ? (
                          <Loader2 className="h-6 w-6 inline-block animate-spin" />
                        ) : (
                          `#${currentUserRank || 'N/A'}`
                        )}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">Tokens</p>
                      <p className="text-lg font-bold text-primary">{user.tokens || 0}</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">Reputation</p>
                      <p className="text-lg font-bold text-secondary">{user.reputationScore || 0}</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">Points</p>
                      <p className="text-lg font-bold text-accent">{user.points || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Reward Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Rewards System</CardTitle>
                  <CardDescription>Understanding the HyperDAG incentive structure</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <h4 className="font-medium flex items-center text-primary">
                        <Coins className="h-4 w-4 mr-2" />
                        HDAG Tokens
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">Cryptocurrency used for governance, staking, and transactions within the HyperDAG ecosystem. Earned through referrals and point conversion.</p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-md">
                      <h4 className="font-medium flex items-center text-accent">
                        <Award className="h-4 w-4 mr-2" />
                        Reputation Score
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">Measures your credibility and influence within the community. Increases with continued engagement and validation from peers.</p>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-md">
                      <h4 className="font-medium flex items-center text-secondary">
                        <Gift className="h-4 w-4 mr-2" />
                        Points
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">Earned through daily activities and achievements. Can be converted to HDAG tokens (50 points = 1 token).</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Top Contributors */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Top Contributors</CardTitle>
                  <CardDescription>This week's leaders in the HyperDAG community</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingLeaderboard ? (
                    <div className="h-20 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr>
                            <th className="text-left font-medium text-gray-500 px-4 py-2">Rank</th>
                            <th className="text-left font-medium text-gray-500 px-4 py-2">User</th>
                            <th className="text-right font-medium text-gray-500 px-4 py-2">Tokens</th>
                            <th className="text-right font-medium text-gray-500 px-4 py-2">Rep.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedLeaderboard.slice(0, 5).map((entry, index) => {
                            const isCurrentUser = entry.id === user.id;
                            
                            return (
                              <tr 
                                key={entry.id} 
                                className={`${
                                  isCurrentUser ? 'bg-primary bg-opacity-5' : index % 2 === 0 ? 'bg-gray-50' : ''
                                } ${
                                  index < 3 ? 'font-medium' : ''
                                }`}
                              >
                                <td className="px-4 py-2">
                                  <div className="flex items-center">
                                    {index === 0 && (
                                      <Trophy className="h-4 w-4 text-yellow-500 mr-1.5" />
                                    )}
                                    <span className={isCurrentUser ? "font-bold text-primary" : ""}>
                                      #{index + 1}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-2">
                                  <div className="flex items-center">
                                    <UserAvatar username={entry.username} size="sm" />
                                    <span className={`ml-2 ${isCurrentUser ? "font-bold text-primary" : ""}`}>
                                      {entry.username}
                                      {isCurrentUser && <span className="ml-1 text-xs">(You)</span>}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-2 text-right font-mono">
                                  {entry.tokens}
                                </td>
                                <td className="px-4 py-2 text-right font-mono">
                                  {entry.reputationScore || '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <div className="mt-4 text-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setActiveTab("leaderboard")}
                    >
                      View Full Leaderboard
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Badges Tab */}
          <TabsContent value="badges">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Current Badges */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Badges</CardTitle>
                  <CardDescription>
                    Badges you've earned for your contributions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingStats ? (
                    <div className="h-48 flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : !userStats?.badges || userStats.badges.length === 0 ? (
                    <div className="text-center py-12">
                      <Award className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-700 mb-2">No badges yet</h3>
                      <p className="text-gray-500 text-sm max-w-sm mx-auto">
                        Complete activities like creating projects, referring friends, or supporting initiatives to earn badges
                      </p>
                    </div>
                  ) : (
                    <>
                      <BadgeDisplay badges={userStats.badges} />
                      
                      <div className="mt-6 space-y-4">
                        {userStats.badges.map((badge) => (
                          <div key={badge} className="bg-gray-50 p-3 rounded-md">
                            <h4 className="font-medium text-gray-800">{badge.charAt(0).toUpperCase() + badge.slice(1)}</h4>
                            <p className="text-sm text-gray-600">{badgeDescriptions[badge.toLowerCase() as keyof typeof badgeDescriptions]}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              
              {/* Upcoming Badges */}
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Badges</CardTitle>
                  <CardDescription>
                    Badges you can earn next
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {upcomingBadges.map((badge, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">{badge.name}</h4>
                          <span className="text-sm text-gray-500">{badge.points} points needed</span>
                        </div>
                        <Progress value={(user.points || 0) / badge.points * 100} className="h-2" />
                        <p className="text-sm text-gray-600">{badge.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">Pro Tip</AlertTitle>
                    <AlertDescription className="text-blue-700 text-sm">
                      Engaging actively in the community helps you earn badges faster
                    </AlertDescription>
                  </Alert>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>
          
          {/* Points Tab */}
          <TabsContent value="points">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Points to Tokens */}
              <Card>
                <CardHeader>
                  <CardTitle>Convert Points to Tokens</CardTitle>
                  <CardDescription>
                    Turn your points into valuable HDAG tokens
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex flex-col items-center bg-gray-50 p-4 rounded-lg">
                      <div className="text-center mb-4">
                        <p className="text-sm text-gray-500">Current Points</p>
                        <p className="text-3xl font-bold text-secondary">{user.points || 0}</p>
                      </div>
                      
                      <div className="flex items-center w-full justify-center mb-4">
                        <div className="w-24 text-center">
                          <p className="text-lg font-bold">{pointsToConvert}</p>
                          <p className="text-xs text-gray-500">points</p>
                        </div>
                        
                        <ArrowRight className="mx-4 text-gray-400" />
                        
                        <div className="w-24 text-center">
                          <p className="text-lg font-bold">{tokensToEarn}</p>
                          <p className="text-xs text-gray-500">HDAG tokens</p>
                        </div>
                      </div>
                      
                      <div className="w-full mb-4">
                        <label htmlFor="points-slider" className="text-sm text-gray-500 mb-2 block">
                          Points to convert:
                        </label>
                        <input
                          id="points-slider"
                          type="range"
                          min="0"
                          max={user.points || 0}
                          step="50"
                          value={pointsToConvert}
                          onChange={(e) => setPointsToConvert(parseInt(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>0</span>
                          <span>{user.points || 0}</span>
                        </div>
                      </div>
                      
                      <Button 
                        onClick={handleConvertPoints}
                        disabled={
                          convertMutation.isPending || 
                          pointsToConvert < 50 || 
                          pointsToConvert > (user.points || 0)
                        }
                        className="w-full"
                      >
                        {convertMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Converting...
                          </>
                        ) : (
                          <>Convert Points</>
                        )}
                      </Button>
                    </div>
                    
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Exchange Rate</AlertTitle>
                      <AlertDescription>
                        50 points = 1 HDAG token
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>
              </Card>
              
              {/* Ways to Earn */}
              <Card>
                <CardHeader>
                  <CardTitle>Ways to Earn Rewards</CardTitle>
                  <CardDescription>
                    Complete these activities to earn points, tokens, and reputation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">Create a Project</p>
                          <p className="text-sm text-gray-500">Submit RFIs or RFPs</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-blue-700 block">+50 points</span>
                        <span className="text-xs text-gray-500">+2 reputation</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <div className="bg-purple-100 p-2 rounded-full mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-purple-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">Refer Friends</p>
                          <p className="text-sm text-gray-500">Each successful referral</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-purple-700 block">+25 points</span>
                        <span className="text-xs text-gray-500">+5 HDAG tokens</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <div className="bg-green-100 p-2 rounded-full mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">Daily Login</p>
                          <p className="text-sm text-gray-500">Maintain activity streak</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-green-700 block">+5 points</span>
                        <span className="text-xs text-gray-500">+0.2 reputation</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <div className="bg-red-100 p-2 rounded-full mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">Engage in Community</p>
                          <p className="text-sm text-gray-500">Comment on discussions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-red-700 block">+10 points</span>
                        <span className="text-xs text-gray-500">+1 reputation</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <div className="bg-amber-100 p-2 rounded-full mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">Weekly Streaks</p>
                          <p className="text-sm text-gray-500">Active for 7 consecutive days</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-semibold text-amber-700 block">+100 points</span>
                        <span className="text-xs text-gray-500">+2 HDAG tokens</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Referral Tiers */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Referral Reward Tiers</CardTitle>
                  <CardDescription>Invite others to join HyperDAG and earn escalating rewards</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-md bg-primary/5">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Tier 1: 1-5 referrals</h4>
                        <div className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded-full">Standard</div>
                      </div>
                      <ul className="text-sm space-y-1">
                        <li>• 5 HDAG tokens per referral</li>
                        <li>• 500 reputation points per referral</li>
                        <li>• Basic referral badge</li>
                      </ul>
                      <p className="text-xs text-primary font-semibold mt-3">Currently 5x bonus: 2,500 points per referral!</p>
                    </div>
                    
                    <div className="p-4 border rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Tier 2: 6-15 referrals</h4>
                        <div className="px-2 py-0.5 bg-secondary/20 text-secondary text-xs font-medium rounded-full">Advanced</div>
                      </div>
                      <ul className="text-sm space-y-1">
                        <li>• 7.5 HDAG tokens per referral</li>
                        <li>• 750 reputation points per referral</li>
                        <li>• Advanced referral badge</li>
                        <li>• Early access to new features</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 border rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-medium">Tier 3: 16+ referrals</h4>
                        <div className="px-2 py-0.5 bg-accent/20 text-accent text-xs font-medium rounded-full">Expert</div>
                      </div>
                      <ul className="text-sm space-y-1">
                        <li>• 10 HDAG tokens per referral</li>
                        <li>• 1,000 reputation points per referral</li>
                        <li>• Expert referral badge</li>
                        <li>• Access to governance votes</li>
                        <li>• Higher staking rewards</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <div className="space-y-6">
              {/* User Rank Card */}
              <Card className="bg-white border border-gray-200 shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="flex items-center mb-4 md:mb-0">
                      <Trophy className="h-10 w-10 mr-4 text-primary" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Your Current Rank</p>
                        <p className="text-3xl font-bold text-gray-800">
                          {isLoadingLeaderboard ? (
                            <Loader2 className="h-6 w-6 inline-block animate-spin" />
                          ) : (
                            `#${currentUserRank || 'N/A'}`
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 md:gap-8">
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">Tokens</p>
                        <p className="text-xl font-bold text-primary">{user.tokens || 0}</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">Reputation</p>
                        <p className="text-xl font-bold text-secondary">{user.reputationScore || 0}</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">Referrals</p>
                        <p className="text-xl font-bold text-accent">
                          {isLoadingLeaderboard ? (
                            <Loader2 className="h-4 w-4 inline-block animate-spin" />
                          ) : (
                            leaderboard?.find(e => e.id === user.id)?.referrals || 0
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Leaderboard Content */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col md:flex-row md:items-center justify-between">
                    <div>
                      <CardTitle>Top Contributors</CardTitle>
                      <CardDescription>
                        See who's leading the HyperDAG community
                      </CardDescription>
                    </div>
                    
                    <div className="mt-4 md:mt-0 relative max-w-xs">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Search users..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <Tabs defaultValue={leaderboardTab} onValueChange={setLeaderboardTab} className="space-y-4">
                    <TabsList className="grid grid-cols-3">
                      <TabsTrigger value="tokens" className="flex items-center">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Tokens</span>
                      </TabsTrigger>
                      <TabsTrigger value="referrals" className="flex items-center">
                        <Users className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Referrals</span>
                      </TabsTrigger>
                      <TabsTrigger value="badges" className="flex items-center">
                        <Medal className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Badges</span>
                      </TabsTrigger>
                    </TabsList>
                    
                    <LeaderboardTable
                      data={sortedLeaderboard}
                      isLoading={isLoadingLeaderboard}
                      valueKey={leaderboardTab as "tokens" | "referrals" | "badges"}
                      currentUserId={user.id}
                    />
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

interface LeaderboardTableProps {
  data: Array<{
    id: number;
    username: string;
    tokens: number;
    referrals: number;
    badges: number;
    reputationScore?: number;
  }>;
  isLoading: boolean;
  valueKey: "tokens" | "referrals" | "badges";
  currentUserId: number;
}

function LeaderboardTable({ data, isLoading, valueKey, currentUserId }: LeaderboardTableProps) {
  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-700 mb-2">No data found</h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          There are no users to display or your search returned no results
        </p>
      </div>
    );
  }
  
  // Get appropriate value label based on the active tab
  const getValueLabel = () => {
    switch (valueKey) {
      case "tokens": return "HDAG";
      case "referrals": return "Refs";
      case "badges": return "Badges";
      default: return "";
    }
  };
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left font-medium text-gray-500 px-4 py-3">Rank</th>
            <th className="text-left font-medium text-gray-500 px-4 py-3">User</th>
            <th className="text-right font-medium text-gray-500 px-4 py-3">{getValueLabel()}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry, index) => {
            const isCurrentUser = entry.id === currentUserId;
            
            return (
              <tr 
                key={entry.id} 
                className={`${
                  isCurrentUser ? 'bg-primary bg-opacity-5' : index % 2 === 0 ? 'bg-gray-50' : ''
                } ${
                  index < 3 ? 'font-medium' : ''
                }`}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    {index === 0 && (
                      <Trophy className="h-5 w-5 text-yellow-500 mr-1.5" />
                    )}
                    {index === 1 && (
                      <Trophy className="h-5 w-5 text-gray-400 mr-1.5" />
                    )}
                    {index === 2 && (
                      <Trophy className="h-5 w-5 text-amber-600 mr-1.5" />
                    )}
                    <span className={isCurrentUser ? "font-bold text-primary" : ""}>
                      #{index + 1}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <UserAvatar username={entry.username} size="sm" />
                    <span className={`ml-3 ${isCurrentUser ? "font-bold text-primary" : ""}`}>
                      {entry.username}
                      {isCurrentUser && <span className="ml-2 text-xs">(You)</span>}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className={`font-mono ${isCurrentUser ? "font-bold text-primary" : ""}`}>
                    {entry[valueKey]}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}