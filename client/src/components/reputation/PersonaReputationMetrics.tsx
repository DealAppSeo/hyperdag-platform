import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Code, Palette, Share, AlertCircle } from "lucide-react";

interface PersonaReputation {
  persona: string;
  score: number;
  level: number;
  nextLevelThreshold: number;
  activities: {
    type: string;
    count: number;
    points: number;
  }[];
}

interface PersonaReputationData {
  developer: PersonaReputation;
  designer: PersonaReputation;
  influencer: PersonaReputation;
  overall: {
    score: number;
    level: number;
    nextLevelThreshold: number;
    primaryPersona: string;
  };
}

export function PersonaReputationMetrics({ userId }: { userId: number }) {
  const { data, isLoading, error } = useQuery<PersonaReputationData>({
    queryKey: [`/api/reputation/persona-metrics/${userId}`],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Persona Reputation Metrics
          </CardTitle>
          <CardDescription>
            Your reputation across different personas
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
            <Users className="mr-2 h-5 w-5" />
            Persona Reputation Metrics
          </CardTitle>
          <CardDescription>
            Your reputation across different personas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load reputation metrics. Please try again later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const getPersonaIcon = (persona: string) => {
    switch (persona.toLowerCase()) {
      case 'developer':
        return <Code className="h-5 w-5 text-blue-600" />;
      case 'designer':
        return <Palette className="h-5 w-5 text-orange-500" />;
      case 'influencer':
        return <Share className="h-5 w-5 text-green-600" />;
      default:
        return <Users className="h-5 w-5 text-primary" />;
    }
  };

  const getPersonaColor = (persona: string) => {
    switch (persona.toLowerCase()) {
      case 'developer':
        return 'text-blue-600';
      case 'designer':
        return 'text-orange-500';
      case 'influencer':
        return 'text-green-600';
      default:
        return 'text-primary';
    }
  };

  const getProgressColor = (persona: string) => {
    switch (persona.toLowerCase()) {
      case 'developer':
        return 'bg-blue-600';
      case 'designer':
        return 'bg-orange-500';
      case 'influencer':
        return 'bg-green-600';
      default:
        return 'bg-primary';
    }
  };
  
  const getBadgeBgColor = (persona: string) => {
    switch (persona.toLowerCase()) {
      case 'developer':
        return 'bg-blue-100';
      case 'designer':
        return 'bg-orange-100';
      case 'influencer':
        return 'bg-green-100';
      default:
        return 'bg-gray-100';
    }
  };
  
  const getBadgeTextColor = (persona: string) => {
    switch (persona.toLowerCase()) {
      case 'developer':
        return 'text-blue-800';
      case 'designer':
        return 'text-orange-800';
      case 'influencer':
        return 'text-green-800';
      default:
        return 'text-gray-800';
    }
  };

  const personas = ['developer', 'designer', 'influencer'] as const;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Persona Reputation Metrics
        </CardTitle>
        <CardDescription>
          Your reputation across different personas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Primary Persona Indicator */}
          <div className={`${getBadgeBgColor(data.overall.primaryPersona)} p-4 rounded-lg border-2 ${data.overall.primaryPersona === 'developer' ? 'border-blue-300' : data.overall.primaryPersona === 'designer' ? 'border-orange-300' : 'border-green-300'}`}>
            <div className="flex items-center mb-2">
              {getPersonaIcon(data.overall.primaryPersona)}
              <span className={`ml-2 font-semibold ${getPersonaColor(data.overall.primaryPersona)}`}>
                Primary Persona: {data.overall.primaryPersona.charAt(0).toUpperCase() + data.overall.primaryPersona.slice(1)}
              </span>
            </div>
            <p className={`text-sm ${getBadgeTextColor(data.overall.primaryPersona)}`}>
              Your primary persona affects the types of projects and grants recommended to you
            </p>
          </div>
          
          {/* Persona Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {personas.map((persona) => (
              <div key={persona} className={`border-2 ${persona === 'developer' ? 'border-blue-200' : persona === 'designer' ? 'border-orange-200' : 'border-green-200'} rounded-lg p-4 hover:shadow-md transition-shadow duration-200`}>
                <div className="flex items-center mb-3">
                  {getPersonaIcon(persona)}
                  <span className={`ml-2 font-semibold ${getPersonaColor(persona)}`}>
                    {persona.charAt(0).toUpperCase() + persona.slice(1)}
                  </span>
                </div>
                
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Level {data[persona].level}</span>
                    <span>Level {data[persona].level + 1}</span>
                  </div>
                  <div className="relative">
                    <Progress 
                      value={(data[persona].score / data[persona].nextLevelThreshold) * 100} 
                      className={`h-2 ${getProgressColor(persona)}`}
                    />
                  </div>
                  <div className="text-xs text-center mt-1 text-gray-500">
                    {data[persona].score} / {data[persona].nextLevelThreshold} points
                  </div>
                </div>
                
                <div className="space-y-2">
                  {data[persona].activities.slice(0, 3).map((activity, i) => (
                    <TooltipProvider key={i}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex justify-between items-center text-xs p-1 bg-gray-50 rounded">
                            <span className="truncate">{activity.type.replace(/_/g, ' ')}</span>
                            <Badge variant="outline" className={`ml-2 ${getBadgeBgColor(persona)} ${getBadgeTextColor(persona)} border-0`}>
                              +{activity.points}
                            </Badge>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{activity.count} activities of this type</p>
                          <p>Total points: {activity.points}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  {data[persona].activities.length > 3 && (
                    <div className="text-xs text-center text-gray-500">
                      +{data[persona].activities.length - 3} more activities
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
