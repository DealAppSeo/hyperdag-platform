import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Share2, 
  Copy, 
  Twitter, 
  Linkedin, 
  Gift, 
  Users, 
  Star, 
  TrendingUp,
  Award,
  Zap,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface ReferralData {
  code: string;
  totalReferrals: number;
  monthlyReferrals: number;
  totalEarned: number;
  monthlyEarned: number;
  rank: string;
  nextRankRequirement: number;
  referralUrl: string;
}

interface ReferralReward {
  level: string;
  referralsNeeded: number;
  reward: string;
  repidBonus: number;
  description: string;
  icon: string;
}

export function ReferralSystem({ userId }: { userId: string }) {
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const referralRewards: ReferralReward[] = [
    {
      level: 'Starter',
      referralsNeeded: 1,
      reward: '$50 credits',
      repidBonus: 100,
      description: 'Your first referral',
      icon: '🌟'
    },
    {
      level: 'Ambassador',
      referralsNeeded: 5,
      reward: '$300 credits + VIP support',
      repidBonus: 500,
      description: 'Unlock premium features',
      icon: '🚀'
    },
    {
      level: 'Evangelist',
      referralsNeeded: 15,
      reward: '$1,000 credits + Custom dashboard',
      repidBonus: 1500,
      description: 'Enterprise-level benefits',
      icon: '👑'
    },
    {
      level: 'Legend',
      referralsNeeded: 50,
      reward: '$5,000 credits + Revenue share',
      repidBonus: 5000,
      description: 'Lifetime partnership program',
      icon: '💎'
    }
  ];

  useEffect(() => {
    fetchReferralData();
  }, [userId]);

  const fetchReferralData = async () => {
    try {
      const response = await fetch(`/api/referrals/data/${userId}`);
      const data = await response.json();
      setReferralData(data);
    } catch (error) {
      console.error('Failed to fetch referral data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyReferralLink = async () => {
    if (!referralData) return;
    
    try {
      await navigator.clipboard.writeText(referralData.referralUrl);
      setCopied(true);
      toast({
        title: "Referral link copied! 🎉",
        description: "Share it with friends to start earning rewards"
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive"
      });
    }
  };

  const shareOnTwitter = () => {
    if (!referralData) return;
    const text = `I'm saving 79% on AI costs with HyperDAG! Join me and get $2,400 in free credits: ${referralData.referralUrl}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    if (!referralData) return;
    const text = `I've been using HyperDAG to cut my AI development costs by 79%. They're offering $2,400 in free credits for new users. Check it out: ${referralData.referralUrl}`;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralData.referralUrl)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!referralData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Unable to load referral data. Please try again later.</p>
        </CardContent>
      </Card>
    );
  }

  const currentLevel = referralRewards.find(level => referralData.totalReferrals >= level.referralsNeeded) || referralRewards[0];
  const nextLevel = referralRewards.find(level => referralData.totalReferrals < level.referralsNeeded);
  const progressToNext = nextLevel ? (referralData.totalReferrals / nextLevel.referralsNeeded) * 100 : 100;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{referralData.totalReferrals}</div>
            <div className="text-sm text-muted-foreground">Total Referrals</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">${referralData.totalEarned}</div>
            <div className="text-sm text-muted-foreground">Total Earned</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{currentLevel.level}</div>
            <div className="text-sm text-muted-foreground">Current Rank</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">{referralData.monthlyReferrals}</div>
            <div className="text-sm text-muted-foreground">This Month</div>
          </CardContent>
        </Card>
      </div>

      {/* Share Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Share2 className="w-5 h-5" />
            <span>Share Your Referral Link</span>
          </CardTitle>
          <CardDescription>
            Earn ${currentLevel.reward} for each friend who joins using your link
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={referralData.referralUrl}
              readOnly
              className="flex-1"
            />
            <Button onClick={copyReferralLink} variant="outline">
              {copied ? (
                <>
                  <Zap className="w-4 h-4 mr-2 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={shareOnTwitter} className="flex-1 bg-blue-500 hover:bg-blue-600">
              <Twitter className="w-4 h-4 mr-2" />
              Share on Twitter
            </Button>
            <Button onClick={shareOnLinkedIn} className="flex-1 bg-blue-700 hover:bg-blue-800">
              <Linkedin className="w-4 h-4 mr-2" />
              Share on LinkedIn
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Progress to Next Level */}
      {nextLevel && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Progress to {nextLevel.level}</span>
              <Badge variant="outline">{nextLevel.icon}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>{referralData.totalReferrals} referrals</span>
                <span>{nextLevel.referralsNeeded} needed</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <motion.div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNext}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                {nextLevel.referralsNeeded - referralData.totalReferrals} more referrals to unlock {nextLevel.reward}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reward Levels */}
      <Card>
        <CardHeader>
          <CardTitle>Referral Rewards Program</CardTitle>
          <CardDescription>
            Unlock bigger rewards as you refer more friends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {referralRewards.map((level, index) => {
              const isUnlocked = referralData.totalReferrals >= level.referralsNeeded;
              const isCurrent = level.level === currentLevel.level;
              
              return (
                <motion.div
                  key={level.level}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center space-x-4 p-4 rounded-lg border transition-all ${
                    isUnlocked 
                      ? 'bg-green-50 border-green-200' 
                      : isCurrent 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="text-2xl">{level.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold">{level.level}</h4>
                      {isUnlocked && <Badge className="bg-green-500">Unlocked</Badge>}
                      {isCurrent && !isUnlocked && <Badge className="bg-blue-500">Current</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">{level.description}</p>
                    <p className="text-sm font-medium">{level.referralsNeeded} referrals → {level.reward}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-purple-600">
                      +{level.repidBonus} RepID
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Share Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Share Messages</CardTitle>
          <CardDescription>
            Copy these proven messages that convert 3x better
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              "I cut my AI costs by 79% with HyperDAG. You can too - they're giving $2,400 credits to new users!",
              "Found a way to slash AI API bills dramatically. HyperDAG saved me $11K last month. Free credits available:",
              "If you're spending crazy money on OpenAI/Anthropic, check out HyperDAG. 79% savings + $2,400 free credits:"
            ].map((message, index) => (
              <div key={index} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 text-sm">{message}</div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`${message} ${referralData.referralUrl}`);
                    toast({ title: "Message copied!", description: "Ready to share" });
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}