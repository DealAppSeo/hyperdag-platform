import React from 'react';
import { Users, Award, TrendingUp, Zap, Lock, CheckCircle } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/use-auth";
import { getUserReferralCount } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  count: number;
  reward: number;
  status: 'locked' | 'progress' | 'completed';
  action?: () => void;
}

export function ReferralMilestones() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  if (!user) return null;
  
  const referralCount = getUserReferralCount(user);
  
  // Share pre-formatted message
  const shareReferral = async () => {
    const baseUrl = window.location.origin;
    const referralUrl = `${baseUrl}/join?referrer=${user?.referralCode || ''}`;
    const message = `Join me on HyperDAG and we'll both earn HDAG tokens! HyperDAG is a Web3 platform that rewards contributions while protecting privacy.`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on HyperDAG',
          text: message,
          url: referralUrl,
        });
        toast({
          title: "Thanks for sharing!",
          description: "Keep spreading the word to earn more rewards",
        });
      } catch (error) {
        // User cancelled or share failed
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copy
      navigator.clipboard.writeText(`${message} ${referralUrl}`)
        .then(() => {
          toast({
            title: "Link copied!",
            description: "Share it with friends to earn rewards",
          });
        })
        .catch(() => {
          toast({
            title: "Failed to copy",
            description: "Please try again",
            variant: "destructive",
          });
        });
    }
  };
  
  // Define milestones
  const milestones: Milestone[] = [
    {
      id: 'first',
      title: 'First Steps',
      description: 'Invite your first friend',
      icon: <Users className="h-6 w-6 text-blue-500" />,
      count: 1,
      reward: 5,
      status: referralCount >= 1 ? 'completed' : 'progress',
      action: shareReferral
    },
    {
      id: 'network',
      title: 'Growing Network',
      description: 'Reach 5 successful invites',
      icon: <TrendingUp className="h-6 w-6 text-green-500" />,
      count: 5,
      reward: 30,
      status: referralCount >= 5 ? 'completed' : referralCount > 0 ? 'progress' : 'locked',
      action: shareReferral
    },
    {
      id: 'community',
      title: 'Community Builder',
      description: 'Reach 10 successful invites',
      icon: <Zap className="h-6 w-6 text-orange-500" />,
      count: 10,
      reward: 75,
      status: referralCount >= 10 ? 'completed' : referralCount >= 5 ? 'progress' : 'locked',
      action: shareReferral
    },
    {
      id: 'influencer',
      title: 'Hypernode Status',
      description: 'Reach 25 successful invites',
      icon: <Award className="h-6 w-6 text-purple-500" />,
      count: 25,
      reward: 200,
      status: referralCount >= 25 ? 'completed' : referralCount >= 10 ? 'progress' : 'locked',
      action: shareReferral
    },
  ];
  
  // Current milestone progress
  const getCurrentMilestone = () => {
    if (referralCount >= 25) return { current: 25, next: 25, progress: 100 };
    if (referralCount >= 10) return { current: referralCount, next: 25, progress: (referralCount - 10) / 15 * 100 };
    if (referralCount >= 5) return { current: referralCount, next: 10, progress: (referralCount - 5) / 5 * 100 };
    if (referralCount >= 1) return { current: referralCount, next: 5, progress: (referralCount - 1) / 4 * 100 };
    return { current: referralCount, next: 1, progress: referralCount * 100 };
  };
  
  const currentMilestone = getCurrentMilestone();
  
  return (
    <div className="space-y-6 p-1">
      {/* Overall progress */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-gray-800">Your Referral Progress</h3>
          <span className="text-sm font-medium text-primary">{referralCount} invited</span>
        </div>
        
        <Progress value={currentMilestone.progress} className="h-2" />
        
        <div className="mt-3 flex justify-between items-center text-sm text-gray-500">
          <span>{currentMilestone.current} / {currentMilestone.next}</span>
          <span>{referralCount >= 25 ? 'Hypernode Status Achieved!' : `${Math.floor(currentMilestone.progress)}% to next reward`}</span>
        </div>
      </div>
      
      {/* List of milestones */}
      <div className="space-y-4">
        {milestones.map((milestone) => (
          <div 
            key={milestone.id}
            className={`bg-white rounded-xl p-4 border-l-4 ${milestone.status === 'completed' ? 'border-green-500' : 
              milestone.status === 'progress' ? 'border-blue-500' : 'border-gray-300'}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="bg-gray-100 rounded-full p-2">{milestone.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">{milestone.title}</h3>
                    <p className="text-sm text-gray-500">{milestone.description}</p>
                  </div>
                </div>
                
                <div className="mt-3 text-sm font-medium">
                  {milestone.status === 'locked' && (
                    <span className="text-gray-500 flex items-center">
                      <Lock className="h-3 w-3 mr-1" /> Unlock by completing previous milestone
                    </span>
                  )}
                  {milestone.status === 'progress' && (
                    <span className="text-blue-500">
                      {referralCount} / {milestone.count} referrals
                    </span>
                  )}
                  {milestone.status === 'completed' && (
                    <span className="text-green-500 flex items-center">
                      <CheckCircle className="h-3 w-3 mr-1" /> Completed! {milestone.reward} HDAG earned
                    </span>
                  )}
                </div>
              </div>
              
              <div className="ml-4">
                {milestone.status !== 'locked' && (
                  <Button 
                    variant={milestone.status === 'completed' ? 'outline' : 'default'}
                    size="sm"
                    onClick={milestone.action}
                    disabled={false}
                  >
                    {milestone.status === 'completed' ? 'Invite More' : 'Share'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Total rewards earned */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 text-white">
        <h3 className="text-lg font-semibold mb-1">Total Rewards Earned</h3>
        <div className="flex justify-between items-center">
          <span className="text-2xl font-bold">
            {referralCount >= 25 ? 310 :
             referralCount >= 10 ? 110 :
             referralCount >= 5 ? 35 :
             referralCount >= 1 ? 5 : 0} HDAG
          </span>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={shareReferral}
          >
            Earn More
          </Button>
        </div>
      </div>
    </div>
  );
}
