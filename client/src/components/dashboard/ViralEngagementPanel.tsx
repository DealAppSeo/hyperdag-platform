import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from 'wouter';
import { ArrowRight, Award, Share, Users, Shield, Sparkles, Twitter, Linkedin, Mail } from "lucide-react";
import SharingIncentive from '../onboarding/SharingIncentive';
import TransformationCard from '../onboarding/TransformationCard';

// Import utility functions instead of recreating them here
import { calculateProfileCompletion, getRewardMultiplier, getUserMilestone } from "@/utils/referrals";

const ViralEngagementPanel: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('transform');
  const [location, navigate] = useLocation();
  
  // Calculate the profile completion
  const profileCompletion = calculateProfileCompletion(user);
  
  // Define milestones with unlockable features and rewards
  const milestones = [
    {
      id: "profile_25",
      completion: 25,
      title: "Profile Pioneer",
      unlocks: ["Basic Profile Page", "Personalized Dashboard"],
      badge: "Newcomer",
      achieved: profileCompletion >= 25
    },
    {
      id: "profile_50",
      completion: 50,
      title: "Identity Established",
      unlocks: ["Grant Matching", "Project Visibility"],
      badge: "Identity Verified",
      achieved: profileCompletion >= 50
    },
    {
      id: "profile_75",
      completion: 75,
      title: "Credential Verified",
      unlocks: ["Team Formation", "Enhanced Privacy Controls"],
      badge: "Verified Contributor",
      achieved: profileCompletion >= 75
    },
    {
      id: "profile_100",
      completion: 100,
      title: "Identity Mastery",
      unlocks: ["Full ZKP Privacy", "Maximum Reputation Rewards"],
      badge: "Privacy Master",
      achieved: profileCompletion >= 100
    }
  ];
  
  // Get the next milestone to achieve
  const nextMilestone = milestones.find(m => !m.achieved) || milestones[milestones.length - 1];
  
  // Fetch user's referral stats to show social proof
  const { data: referralStats } = useQuery({
    queryKey: ['/api/user/referrals'],
    refetchOnWindowFocus: false,
    enabled: !!user
  });
  
  // Safely access referral stats with fallbacks
  const totalReferrals = referralStats && 
    typeof referralStats === 'object' && 
    'totalReferrals' in referralStats ? 
    (referralStats as any).totalReferrals : 0;
  
  // Determine which panel to show based on completion
  // - Below 75%: Focus on transformation journey (outcome-focused)
  // - 75% and above: Focus on sharing (viral loop)
  useEffect(() => {
    if (profileCompletion >= 75) {
      setActiveTab('share');
    } else {
      setActiveTab('transform');
    }
  }, [profileCompletion]);
  
  // Early adopter rewards multiplier (scarcity/urgency principle)
  const rewardsMultiplier = 5;
  
  return (
    <Card className="border-primary/20 mb-6">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Your HyperDAG Journey</CardTitle>
          {profileCompletion >= 50 && (
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/10">
              <Sparkles className="h-3 w-3 mr-1" />
              <span>{rewardsMultiplier}x Rewards Active</span>
            </Badge>
          )}
        </div>
        <CardDescription>
          {profileCompletion < 75 
            ? "Complete your transformation and unlock exclusive features" 
            : "Share your success and earn maximum rewards"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 rounded-none border-b">
            <TabsTrigger value="transform" className="rounded-none data-[state=active]:bg-primary/5">
              Transformation
            </TabsTrigger>
            <TabsTrigger value="share" className="rounded-none data-[state=active]:bg-primary/5">
              Share & Earn
            </TabsTrigger>
          </TabsList>
          
          <div className="p-6">
            <TabsContent value="transform" className="m-0">
              <TransformationCard 
                profileCompletion={profileCompletion} 
                user={user} 
              />
            </TabsContent>
            
            <TabsContent value="share" className="m-0">
              <SharingIncentive 
                referralCode={user?.referralCode} 
                milestone={profileCompletion >= 100 ? 'profile_completed' : undefined}
              />
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
      
      <CardFooter className="border-t p-4 flex flex-wrap gap-3 justify-between">
        <div className="text-sm text-muted-foreground flex items-center">
          {totalReferrals > 0 ? (
            <>
              <Users className="h-4 w-4 mr-1" />
              <span>
                <span className="font-medium">{totalReferrals}</span> people joined through your referrals
              </span>
            </>
          ) : (
            <>
              <Award className="h-4 w-4 mr-1" />
              <span>Earn <span className="font-medium">{500 * rewardsMultiplier}</span> points for each successful referral</span>
            </>
          )}
        </div>
        
        <Button
          variant={profileCompletion < 75 ? "default" : "outline"}
          size="sm"
          onClick={() => {
            if (profileCompletion < 75) {
              navigate('/profile/edit');
            } else {
              setActiveTab(activeTab === 'transform' ? 'share' : 'transform');
            }
          }}
        >
          {profileCompletion < 75 ? (
            <>
              Complete Your Profile
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          ) : (
            activeTab === 'transform' ? (
              <>
                Share Your Journey
                <Share className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                View Your Progress
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ViralEngagementPanel;