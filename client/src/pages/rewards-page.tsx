import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Layout } from "@/components/layout/layout";
import BadgeDisplay from "@/components/ui/badge-display";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Gift, Award, Coins, Loader2, AlertCircle, ArrowRight } from "lucide-react";

export default function RewardsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("badges");
  const [pointsToConvert, setPointsToConvert] = useState(50);
  
  const { data: userStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/user/stats"],
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
  
  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-7xl mx-auto pb-20 md:pb-6">
        <h1 className="text-2xl font-bold mb-6">Rewards & Achievements</h1>
        
        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Award className="mr-2 h-5 w-5 text-primary" />
                Badges Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="h-16 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold text-primary">
                    {userStats?.badges?.length || 0}/{Object.keys(badgeDescriptions).length}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Each badge represents a unique achievement
                  </p>
                </>
              )}
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
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="badges">Badges</TabsTrigger>
            <TabsTrigger value="points">Points & Tokens</TabsTrigger>
          </TabsList>
          
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
              
              {/* Points Earning */}
              <Card>
                <CardHeader>
                  <CardTitle>Ways to Earn Points</CardTitle>
                  <CardDescription>
                    Complete these activities to earn more points
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
                      <span className="font-semibold text-blue-700">+50 points</span>
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
                      <span className="font-semibold text-purple-700">+25 points</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <div className="bg-green-100 p-2 rounded-full mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">Daily Login</p>
                          <p className="text-sm text-gray-500">Log in each day</p>
                        </div>
                      </div>
                      <span className="font-semibold text-green-700">+5 points</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <div className="bg-amber-100 p-2 rounded-full mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">Complete Profile</p>
                          <p className="text-sm text-gray-500">Fill all profile fields</p>
                        </div>
                      </div>
                      <span className="font-semibold text-amber-700">+20 points</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                      <div className="flex items-center">
                        <div className="bg-rose-100 p-2 rounded-full mr-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-rose-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">Earn a Badge</p>
                          <p className="text-sm text-gray-500">Each new badge earned</p>
                        </div>
                      </div>
                      <span className="font-semibold text-rose-700">+100 points</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
