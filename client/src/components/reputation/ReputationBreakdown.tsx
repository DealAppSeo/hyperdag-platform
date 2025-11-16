import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info, Award, Trophy } from "lucide-react";

interface ReputationActivity {
  type: string;
  points: number;
  count: number;
  description: string;
}

interface BreakdownData {
  activities: ReputationActivity[];
  totalPoints: number;
}

export function ReputationBreakdown({ userId }: { userId: number }) {
  const { data, isLoading, error } = useQuery<ReputationActivity[]>({
    queryKey: [`/api/reputation/breakdown/${userId}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="mr-2 h-5 w-5" />
            Reputation Breakdown
          </CardTitle>
          <CardDescription>
            How you've earned your reputation points
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="mr-2 h-5 w-5" />
            Reputation Breakdown
          </CardTitle>
          <CardDescription>
            How you've earned your reputation points
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-6 text-center">
            <Info className="h-12 w-12 text-muted-foreground opacity-50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Unable to load reputation data. Please try again later.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate total points for percentage
  const totalPoints = data.reduce((sum, activity) => sum + activity.points, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Trophy className="mr-2 h-5 w-5" />
          Reputation Breakdown
        </CardTitle>
        <CardDescription>
          How you've earned your reputation points
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="text-center py-4">
            <Award className="mx-auto h-10 w-10 text-muted-foreground opacity-50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No reputation activities yet. Participate in the community to start earning points!
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {data.map((activity, idx) => {
              const percentage = Math.round((activity.points / totalPoints) * 100);
              
              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium">{activity.type}</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 ml-1.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">{activity.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {activity.count} {activity.count === 1 ? 'activity' : 'activities'}
                      </Badge>
                      <span className="text-sm font-semibold">{activity.points} points</span>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">{percentage}%</p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}