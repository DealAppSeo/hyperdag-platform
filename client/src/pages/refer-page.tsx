import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

import ReferralQRCode from "@/components/referral/qr-code";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Copy,
  Share2,
  Users,
  Award,
  CheckCircle,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Define types for our API responses
interface ReferralStats {
  level1: number;
  level2: number;
  level3: number;
  rewards: number;
}

interface UserStatsResponse {
  user: {
    id: number;
    username: string;
    tokens: number;
    points: number;
    referralCode: string;
    [key: string]: any;
  };
  referralStats: ReferralStats;
}

interface QRCodeData {
  qrCodeUrl: string;
  referralCode: string;
}

interface QRCodeResponse {
  success: boolean;
  data: QRCodeData;
}

export default function ReferPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("share");
  
  const { data: userStats, isLoading: isLoadingStats } = useQuery<UserStatsResponse>({
    queryKey: ["/api/user/stats"],
    enabled: !!user,
  });
  
  const { data: referralResponse, isLoading: isLoadingReferral } = useQuery<QRCodeResponse>({
    queryKey: ["/api/referral/qr"],
    enabled: !!user,
  });
  
  // Extract the actual data from the API response
  const referralData = referralResponse?.success ? referralResponse.data : null;
  
  const handleCopyReferralCode = () => {
    if (referralData?.referralCode) {
      navigator.clipboard.writeText(referralData.referralCode);
      toast({
        title: "Referral code copied",
        description: "The code has been copied to your clipboard",
      });
    }
  };
  
  const handleShareReferral = () => {
    if (navigator.share && referralData?.referralCode) {
      navigator.share({
        title: 'Join HyperDAG',
        text: `Use my referral code ${referralData.referralCode} to join HyperDAG and earn rewards!`,
        url: `${window.location.origin}/auth?ref=${referralData.referralCode}`,
      }).catch((error) => {
        console.log('Error sharing:', error);
      });
    } else {
      handleCopyReferralCode();
    }
  };
  
  const referralLevels = [
    { count: 3, reward: 15, badge: "Networker", completed: (userStats?.referralStats?.level1 || 0) >= 3 },
    { count: 10, reward: 50, badge: "Connector", completed: (userStats?.referralStats?.level1 || 0) >= 10 },
    { count: 25, reward: 150, badge: "Ambassador", completed: (userStats?.referralStats?.level1 || 0) >= 25 },
  ];
  
  if (!user) return null;
  
  return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto pb-20 md:pb-6">
        <h1 className="text-2xl font-bold mb-6">Refer Friends</h1>
        
        <div className="grid md:grid-cols-3 gap-6 mb-6">
          {/* Stats Cards */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Users className="mr-2 h-5 w-5 text-primary" />
                Total Referrals
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
                    {(userStats?.referralStats?.level1 || 0) + 
                     (userStats?.referralStats?.level2 || 0) + 
                     (userStats?.referralStats?.level3 || 0)}
                  </p>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <p className="text-gray-500 text-xs">Level 1</p>
                      <p className="font-semibold">{userStats?.referralStats?.level1 || 0}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <p className="text-gray-500 text-xs">Level 2</p>
                      <p className="font-semibold">{userStats?.referralStats?.level2 || 0}</p>
                    </div>
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <p className="text-gray-500 text-xs">Level 3</p>
                      <p className="font-semibold">{userStats?.referralStats?.level3 || 0}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                <Award className="mr-2 h-5 w-5 text-secondary" />
                Rewards Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="h-16 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-secondary" />
                </div>
              ) : (
                <>
                  <p className="text-3xl font-bold text-secondary">
                    {userStats?.referralStats?.rewards || 0} <span className="text-lg">HDAG</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-3">
                    You earn rewards for each successful referral:
                  </p>
                  <div className="text-xs text-gray-600 mt-1 space-y-1">
                    <p>• Level 1: 5 HDAG per referral</p>
                    <p>• Level 2: 2 HDAG per referral</p>
                    <p>• Level 3: 1 HDAG per referral</p>
                    <p>• Non-Profit Referral: 10 HDAG (you and the nonprofit each receive 10 tokens)</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-accent" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <ol className="space-y-2 list-decimal list-inside">
                <li>Share your unique referral code with friends</li>
                <li>When they sign up, you both earn rewards</li>
                <li>You also earn from their referrals (up to 3 levels)</li>
                <li>Reach milestones to earn badges and bonuses</li>
              </ol>
              <p className="mt-3 text-gray-600">Each successful referral increases your influence in the HyperDAG ecosystem.</p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="share">Share & Earn</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
          </TabsList>
          
          <TabsContent value="share">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Referral QR Code Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Your Referral Code</CardTitle>
                  <CardDescription>
                    Share this code with friends to earn rewards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingReferral ? (
                    <div className="flex flex-col items-center p-6">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                      <p className="mt-4 text-gray-600">Generating your unique QR code...</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-center mb-4">
                        <div className="bg-gray-100 p-2 rounded-md flex items-center">
                          <span className="font-mono text-lg font-bold text-primary mx-2">
                            {referralData?.referralCode}
                          </span>
                          <Button variant="ghost" size="sm" onClick={handleCopyReferralCode}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <ReferralQRCode />
                      <div className="mt-4 flex justify-center">
                        <Button onClick={handleShareReferral} className="flex items-center">
                          <Share2 className="mr-2 h-4 w-4" />
                          Share Referral Link
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
              
              {/* Referral Tips Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Tips for Successful Referrals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-md">
                      <h3 className="font-semibold text-blue-700 mb-2">Personalize Your Invitation</h3>
                      <p className="text-sm text-blue-600">
                        Explain why you think HyperDAG would be valuable to the person you're inviting. Personal messages have 3x higher conversion rates.
                      </p>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-md">
                      <h3 className="font-semibold text-purple-700 mb-2">Target Interested Communities</h3>
                      <p className="text-sm text-purple-600">
                        Share with communities interested in blockchain, decentralization, or collaborative projects.
                      </p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-md">
                      <h3 className="font-semibold text-green-700 mb-2">Highlight Social Impact</h3>
                      <p className="text-sm text-green-600">
                        Emphasize how HyperDAG redirects 95-98% of profits to users and dedicates 10% to global impact initiatives.
                      </p>
                    </div>
                    
                    <div className="bg-yellow-50 p-4 rounded-md">
                      <h3 className="font-semibold text-yellow-700 mb-2">Multi-Channel Approach</h3>
                      <p className="text-sm text-yellow-600">
                        Share your code across different platforms: social media, messaging apps, email, and in-person.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="milestones">
            <Card>
              <CardHeader>
                <CardTitle>Referral Milestones</CardTitle>
                <CardDescription>
                  Earn badges and bonus rewards by reaching these milestones
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="h-64 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {referralLevels.map((level, index) => {
                      const progress = Math.min(100, ((userStats?.referralStats?.level1 || 0) / level.count) * 100);
                      
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center">
                              {level.completed ? (
                                <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                              ) : (
                                <div className="h-5 w-5 rounded-full border-2 border-gray-300 mr-2" />
                              )}
                              <h3 className={`font-semibold ${level.completed ? 'text-green-700' : 'text-gray-700'}`}>
                                {level.badge} Badge
                              </h3>
                            </div>
                            <div className="text-right">
                              <span className="font-mono text-sm">
                                {userStats?.referralStats?.level1 || 0}/{level.count} referrals
                              </span>
                            </div>
                          </div>
                          
                          <Progress value={progress} className="h-2" />
                          
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>Reward: {level.reward} HDAG bonus</span>
                            {level.completed ? (
                              <span className="text-green-600">Completed!</span>
                            ) : (
                              <span>{level.count - (userStats?.referralStats?.level1 || 0)} more to go</span>
                            )}
                          </div>
                          
                          {index < referralLevels.length - 1 && (
                            <div className="border-b border-gray-200 my-4" />
                          )}
                        </div>
                      );
                    })}
                    
                    <div className="p-4 bg-gray-50 rounded-lg text-center border border-gray-100">
                      <p className="text-primary font-medium">
                        Keep referring to unlock higher tiers with even bigger rewards!
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}
