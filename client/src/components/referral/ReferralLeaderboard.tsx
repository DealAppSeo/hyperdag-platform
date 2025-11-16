import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Crown, TrendingUp, Users, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface LeaderboardEntry {
  rank: number;
  name: string;
  avatar?: string;
  referrals: number;
  earnings: number;
  level: string;
  isYou?: boolean;
  weeklyGrowth: number;
}

export function ReferralLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'alltime'>('monthly');
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - in real app this would come from API
  const mockLeaderboard: LeaderboardEntry[] = [
    {
      rank: 1,
      name: 'Alex Chen',
      referrals: 247,
      earnings: 12350,
      level: 'Legend',
      weeklyGrowth: 23
    },
    {
      rank: 2,
      name: 'Sarah Kim',
      referrals: 189,
      earnings: 9450,
      level: 'Evangelist',
      weeklyGrowth: 18
    },
    {
      rank: 3,
      name: 'Mike Johnson',
      referrals: 156,
      earnings: 7800,
      level: 'Evangelist',
      weeklyGrowth: 12
    },
    {
      rank: 4,
      name: 'You',
      referrals: 23,
      earnings: 1150,
      level: 'Ambassador',
      isYou: true,
      weeklyGrowth: 5
    },
    {
      rank: 5,
      name: 'Emma Davis',
      referrals: 89,
      earnings: 4450,
      level: 'Evangelist',
      weeklyGrowth: 8
    }
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setLeaderboard(mockLeaderboard);
      setIsLoading(false);
    }, 1000);
  }, [timeframe]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <div className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</div>;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Legend':
        return 'bg-purple-100 text-purple-800';
      case 'Evangelist':
        return 'bg-blue-100 text-blue-800';
      case 'Ambassador':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-muted-foreground mt-4">Loading leaderboard...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span>Referral Leaderboard</span>
            </CardTitle>
            <CardDescription>
              Top performers this month
            </CardDescription>
          </div>
          
          <div className="flex space-x-2">
            {(['weekly', 'monthly', 'alltime'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  timeframe === period
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {leaderboard.map((entry, index) => (
            <motion.div
              key={entry.rank}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center space-x-4 p-4 rounded-lg transition-all ${
                entry.isYou 
                  ? 'bg-blue-50 border-2 border-blue-200' 
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-center w-10">
                {getRankIcon(entry.rank)}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className={`font-semibold ${entry.isYou ? 'text-blue-700' : 'text-gray-900'}`}>
                    {entry.name}
                  </h4>
                  {entry.isYou && <Badge className="bg-blue-500">You</Badge>}
                  <Badge className={getLevelColor(entry.level)}>{entry.level}</Badge>
                </div>
                
                <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>{entry.referrals} referrals</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <DollarSign className="w-4 h-4" />
                    <span>${entry.earnings.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span>+{entry.weeklyGrowth} this week</span>
                  </div>
                </div>
              </div>
              
              {entry.rank <= 3 && (
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {entry.rank === 1 && '🏆 Champion'}
                    {entry.rank === 2 && '🥈 Runner-up'}
                    {entry.rank === 3 && '🥉 Third Place'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {entry.rank === 1 && 'Special rewards unlocked'}
                    {entry.rank === 2 && 'Premium features'}
                    {entry.rank === 3 && 'VIP support'}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
        
        {/* Your ranking if not in top 5 */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-center text-sm text-gray-600">
            <p>Compete with 2,847+ users worldwide</p>
            <p className="text-xs mt-1">Top 10 get exclusive benefits and early access to new features</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}