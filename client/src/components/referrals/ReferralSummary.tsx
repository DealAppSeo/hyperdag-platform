import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle, Users, Medal } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from 'wouter';

interface ReferralSummaryProps {
  className?: string;
  compact?: boolean;
}

export function ReferralSummary({ className, compact = false }: ReferralSummaryProps) {
  // Fetch referral statistics
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/referral/counts'],
  });

  if (isLoading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className={compact ? 'py-3' : 'py-6'}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-primary mr-2" />
              <span className="font-medium">Referrals</span>
            </div>
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-6 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.success) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className={compact ? 'py-3' : 'py-6'}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-primary mr-2" />
              <span className="font-medium">Referrals</span>
            </div>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground">Unable to load data</p>
        </CardContent>
      </Card>
    );
  }

  const { totalReferrals, validatedReferrals, totalRewards } = data.data;
  const validationRate = totalReferrals > 0 
    ? Math.round((validatedReferrals / totalReferrals) * 100)
    : 0;

  return (
    <Card className={`w-full ${className} hover:shadow-md transition-shadow duration-200`}>
      <Link href="/referrals">
        <CardContent className={`${compact ? 'py-3' : 'py-6'} cursor-pointer`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-primary mr-2" />
              <span className="font-medium">Referral Stats</span>
            </div>
            {compact && (
              <span className="text-xs text-muted-foreground">View details</span>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Total Referrals</p>
              <p className="text-2xl font-bold">{totalReferrals}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Validated</p>
              <p className="text-2xl font-bold">{validatedReferrals}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Validation Rate</span>
              <span className="text-xs font-medium">{validationRate}%</span>
            </div>
            <Progress value={validationRate} className="h-1.5" />
          </div>
          
          {!compact && (
            <div className="mt-4 pt-4 border-t flex items-center">
              <Medal className="h-4 w-4 text-primary mr-2" />
              <span className="text-sm">Total Rewards: <strong>{totalRewards} HDAG</strong></span>
            </div>
          )}
        </CardContent>
      </Link>
    </Card>
  );
}