import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardTitle, Card, CardContent } from "@/components/ui/card";
import { ReferralMilestones } from "@/components/sharing/referral-milestones";
import { AchievementCard } from "@/components/sharing/achievement-card";
import { Layout } from "@/components/layout/layout";
import { Award, Users, TrendingUp, Shield } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getUserReferralCount } from "@/lib/utils";

// Define sample achievements
const sampleAchievements = [
  {
    id: 'referral-starter',
    title: 'Network Starter',
    description: 'Successfully invited your first user',
    achievementType: 'referral' as const,
    points: 5,
    unlocked: true
  },
  {
    id: 'referral-networker',
    title: 'Active Networker',
    description: 'Invited 5 or more users to HyperDAG',
    achievementType: 'referral' as const,
    points: 30,
    unlocked: false
  },
  {
    id: 'zkp-verified',
    title: 'Identity Guardian',
    description: 'Set up Zero-Knowledge Proof verification',
    achievementType: 'verification' as const,
    points: 20,
    unlocked: true
  },
  {
    id: 'reputation-starter',
    title: 'Reputation Builder',
    description: 'Earned your first reputation points',
    achievementType: 'reputation' as const,
    points: 15,
    unlocked: false
  },
  {
    id: 'project-contributor',
    title: 'Project Contributor',
    description: 'Contributed to your first project',
    achievementType: 'contribution' as const,
    points: 25,
    unlocked: true
  },
];

export default function AchievementsPage() {
  const [activeTab, setActiveTab] = useState("milestones");
  const { user } = useAuth();
  
  // Determine which achievements are unlocked based on user data
  const getAchievements = () => {
    if (!user) return [];
    
    const referralCount = getUserReferralCount(user);
    
    return sampleAchievements.map(achievement => {
      // Update unlock status based on user data
      if (achievement.id === 'referral-networker' && referralCount >= 5) {
        return { ...achievement, unlocked: true };
      }
      
      if (achievement.id === 'referral-starter' && referralCount >= 1) {
        return { ...achievement, unlocked: true };
      }
      
      // These are placeholders for ZKP and Rep systems
      // Placeholder for ZKP verification status - in real app would use actual ZKP status
      if (achievement.id === 'zkp-verified') {
        // Default to true for demo purposes, or check an actual field in user if available
        return { ...achievement, unlocked: true };
      }
      
      if (achievement.id === 'reputation-starter' && (user.reputationScore || 0) > 0) {
        return { ...achievement, unlocked: true };
      }
      
      return achievement;
    });
  };
  
  const achievements = getAchievements();
  const unlockedAchievements = achievements.filter(a => a.unlocked);
  
  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Achievements & Rewards</h1>
          <div className="text-xl font-bold text-primary">
            {unlockedAchievements.reduce((sum, a) => sum + a.points, 0)} Points
          </div>
        </div>
        
        <Tabs defaultValue="milestones" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
          </TabsList>
          
          <TabsContent value="milestones">
            <ReferralMilestones />
          </TabsContent>
          
          <TabsContent value="achievements">
            <div className="space-y-8">
              {/* Summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Unlocked</p>
                      <CardTitle className="text-2xl">{unlockedAchievements.length}</CardTitle>
                    </div>
                    <Award className="h-8 w-8 text-primary opacity-70" />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Locked</p>
                      <CardTitle className="text-2xl">{achievements.length - unlockedAchievements.length}</CardTitle>
                    </div>
                    <Shield className="h-8 w-8 text-gray-400" />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Referrals</p>
                      <CardTitle className="text-2xl">{getUserReferralCount(user)}</CardTitle>
                    </div>
                    <Users className="h-8 w-8 text-blue-500 opacity-70" />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Reputation</p>
                      <CardTitle className="text-2xl">{user?.reputationScore || 0}</CardTitle>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500 opacity-70" />
                  </CardContent>
                </Card>
              </div>
              
              {/* Featured Achievement */}
              {unlockedAchievements.length > 0 && (
                <div className="my-8">
                  <h2 className="text-xl font-semibold mb-4">Featured Achievement</h2>
                  <AchievementCard 
                    title={unlockedAchievements[0].title}
                    description={unlockedAchievements[0].description}
                    achievementType={unlockedAchievements[0].achievementType}
                    points={unlockedAchievements[0].points}
                  />
                </div>
              )}
              
              {/* Achievement List */}
              <div>
                <h2 className="text-xl font-semibold mb-4">All Achievements</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement) => (
                    <Card 
                      key={achievement.id}
                      className={`border-l-4 ${achievement.unlocked ? 'border-green-500' : 'border-gray-300 opacity-70'}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-800">{achievement.title}</h3>
                            <p className="text-sm text-gray-500">{achievement.description}</p>
                            <div className="mt-2 flex items-center">
                              <span className="text-primary font-medium">{achievement.points} points</span>
                              <span className="mx-2 text-gray-300">•</span>
                              <span className={`text-xs font-medium ${achievement.unlocked ? 'text-green-500' : 'text-gray-500'}`}>
                                {achievement.unlocked ? 'UNLOCKED' : 'LOCKED'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="bg-gray-100 rounded-full p-2">
                              {achievement.achievementType === 'referral' && <Users className="h-5 w-5 text-blue-500" />}
                              {achievement.achievementType === 'verification' && <Shield className="h-5 w-5 text-purple-500" />}
                              {achievement.achievementType === 'reputation' && <TrendingUp className="h-5 w-5 text-green-500" />}
                              {achievement.achievementType === 'contribution' && <Award className="h-5 w-5 text-orange-500" />}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}