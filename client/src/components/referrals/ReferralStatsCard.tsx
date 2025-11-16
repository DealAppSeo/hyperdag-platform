import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  CircularProgressbarWithChildren,
  buildStyles
} from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Loader2, Users, Medal, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ReferralStatsProps {
  className?: string;
}

export function ReferralStatsCard({ className }: ReferralStatsProps) {
  // Fetch referral statistics
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/referral/stats'],
  });

  if (isLoading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle>Referral Stats</CardTitle>
          <CardDescription>Loading your referral metrics...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pt-6 pb-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.success) {
    return (
      <Card className={`w-full ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle>Referral Stats</CardTitle>
          <CardDescription>Unable to load referral metrics</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center items-center gap-2 text-destructive pt-6 pb-8">
          <AlertCircle className="h-5 w-5" />
          <span>Please try again later</span>
        </CardContent>
      </Card>
    );
  }

  const stats = data.data || {};
  const validationRate = (stats.totalReferrals || 0) > 0 
    ? Math.round(((stats.validatedReferrals || 0) / (stats.totalReferrals || 0)) * 100) 
    : 0;

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle>Referral Stats</CardTitle>
        <CardDescription>Track your network growth and rewards</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {/* Left column - circular progress */}
          <div className="flex flex-col items-center">
            <div className="w-40 h-40">
              <CircularProgressbarWithChildren
                value={validationRate}
                strokeWidth={8}
                styles={buildStyles({
                  pathColor: 'var(--primary)',
                  trailColor: 'var(--secondary)',
                  strokeLinecap: 'round'
                })}
              >
                <div className="flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-bold">{validationRate}%</span>
                  <span className="text-xs text-muted-foreground max-w-[90px]">Validation Rate</span>
                </div>
              </CircularProgressbarWithChildren>
            </div>
            <div className="mt-4 text-sm text-center">
              <p className="font-medium">
                {stats.validatedReferrals} of {stats.totalReferrals} referrals validated
              </p>
              {stats.pendingValidation > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.pendingValidation} pending validation
                </p>
              )}
            </div>
          </div>
          
          {/* Right column - statistics */}
          <div className="space-y-4">
            <div className="border rounded-lg p-3">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-primary mr-2" />
                <span className="font-medium">Total Referrals</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="ml-1">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Total number of users who signed up using your referral code
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-2xl font-bold mt-2">{stats.totalReferrals}</p>
              <div className="text-xs text-muted-foreground mt-1">
                <span className="inline-block mr-4">
                  Level 1: {stats.level1Count}
                </span>
                <span className="inline-block mr-4">
                  Level 2: {stats.level2Count}
                </span>
                <span className="inline-block">
                  Level 3: {stats.level3Count}
                </span>
              </div>
            </div>
            
            <div className="border rounded-lg p-3">
              <div className="flex items-center">
                <Medal className="h-5 w-5 text-primary mr-2" />
                <span className="font-medium">Rewards Earned</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="ml-1">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Rewards are earned when your referrals complete their profile and validate their account
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-2xl font-bold mt-2">{stats.potentialRewards} HDAG</p>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.rewardedReferrals} referrals rewarded
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}