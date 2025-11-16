import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { Shield, Info, Award, Lock, CheckCircle, AlertCircle, HelpCircle } from "lucide-react";

interface ReputationVisualizerProps {
  userId: number;
  reputationScore: number;
  credentialsCount: number;
  activitiesCount: number;
  verifiedProofsCount: number;
  maxScore?: number;
  breakdown?: {
    category: string;
    value: number;
    color: string;
  }[];
}

export function ReputationVisualizer({
  userId,
  reputationScore,
  credentialsCount,
  activitiesCount,
  verifiedProofsCount,
  maxScore = 1000,
  breakdown = []
}: ReputationVisualizerProps) {
  const [animation, setAnimation] = useState<boolean>(false);
  
  // Calculate reputation levels
  const level = Math.floor(reputationScore / 100) + 1;
  const nextLevelThreshold = level * 100;
  const levelProgress = ((reputationScore % 100) / 100) * 100;
  
  // Determine reputation tier based on score
  const getTierDetails = (score: number) => {
    if (score >= 800) {
      return { 
        name: "Elite", 
        color: "text-purple-600",
        bgColor: "bg-purple-100",
        borderColor: "border-purple-300" 
      };
    } else if (score >= 500) {
      return { 
        name: "Advanced", 
        color: "text-blue-600",
        bgColor: "bg-blue-100",
        borderColor: "border-blue-300" 
      };
    } else if (score >= 300) {
      return { 
        name: "Established", 
        color: "text-green-600",
        bgColor: "bg-green-100",
        borderColor: "border-green-300" 
      };
    } else if (score >= 100) {
      return { 
        name: "Developing", 
        color: "text-yellow-600",
        bgColor: "bg-yellow-100",
        borderColor: "border-yellow-300" 
      };
    } else {
      return { 
        name: "Beginner", 
        color: "text-gray-600",
        bgColor: "bg-gray-100",
        borderColor: "border-gray-300" 
      };
    }
  };
  
  const tier = getTierDetails(reputationScore);
  
  // Start progress bar animation after component mounts
  useEffect(() => {
    const timer = setTimeout(() => setAnimation(true), 300);
    return () => clearTimeout(timer);
  }, []);
  
  // Format data for the chart
  const chartData = breakdown.length > 0 
    ? breakdown 
    : [
        { category: "Credentials", value: credentialsCount * 20, color: "#4C1D95" },
        { category: "Activities", value: activitiesCount * 10, color: "#1D4ED8" },
        { category: "Verified Proofs", value: verifiedProofsCount * 30, color: "#059669" }
      ];

  // Calculate trust score as a percentage of max reputation
  const trustScore = Math.min(Math.round((reputationScore / maxScore) * 100), 100);
  
  // Calculate reputation utilization (how much of reputation is being effectively used)
  const reputationUtilization = Math.min(Math.round((verifiedProofsCount * 100) / Math.max(reputationScore / 50, 1)), 100);
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Reputation Visualizer
        </CardTitle>
        <CardDescription>
          Your reputation score and credential verification status
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main RepID Score and Level */}
        <div className={`flex items-center justify-between p-4 rounded-md ${tier.bgColor} ${tier.borderColor} border-2`}>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={`text-xl font-semibold ${tier.color}`}>{tier.name} Tier</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <p>Your reputation tier determines access to features and opportunities within the HyperDAG ecosystem.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex items-center gap-2 mt-1 mb-3">
              <span className="text-sm text-muted-foreground">Level {level}</span>
              <Badge variant="outline" className="text-xs">
                {reputationScore} points
              </Badge>
            </div>
            <div className="space-y-1 w-full max-w-xs">
              <div className="flex justify-between text-xs">
                <span>Current Level {level}</span>
                <span>Level {level + 1}</span>
              </div>
              <Progress 
                value={animation ? levelProgress : 0} 
                className="h-2 transition-all duration-1000 ease-out" 
              />
              <div className="text-xs text-right text-muted-foreground">
                {Math.round(levelProgress)}% to next level
              </div>
            </div>
          </div>
          <div className="hidden sm:flex flex-col items-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 ${tier.borderColor}`}>
              <span className={`text-2xl font-bold ${tier.color}`}>{reputationScore}</span>
            </div>
            <span className="mt-2 text-sm font-medium">RepID Score</span>
          </div>
        </div>
        
        {/* Trust and Utilization Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Trust Score</span>
              </div>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                {trustScore}%
              </Badge>
            </div>
            <Progress 
              value={animation ? trustScore : 0} 
              className="h-2 bg-gray-100 transition-all duration-1000 ease-out" 
            />
            <p className="text-xs text-muted-foreground">
              Based on your reputation relative to community maximum
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <Lock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Reputation Utilization</span>
              </div>
              <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                {reputationUtilization}%
              </Badge>
            </div>
            <Progress 
              value={animation ? reputationUtilization : 0} 
              className="h-2 bg-gray-100 transition-all duration-1000 ease-out" 
            />
            <p className="text-xs text-muted-foreground">
              How effectively you're using your reputation with ZK proofs
            </p>
          </div>
        </div>
        
        {/* Reputation Breakdown */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-4">Reputation Breakdown</h4>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 10,
                  left: 0,
                  bottom: 10,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis tickCount={5} tick={{ fontSize: 12 }} />
                <RechartsTooltip 
                  formatter={(value: number, name: string) => [
                    `${value} points`, 'Value'
                  ]}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Credential Status */}
        <div className="grid grid-cols-3 gap-2 text-center pt-4 border-t">
          <div className="p-2 rounded-md bg-gray-50">
            <Award className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <div className="text-lg font-semibold">{credentialsCount}</div>
            <div className="text-xs text-muted-foreground">Credentials</div>
          </div>
          <div className="p-2 rounded-md bg-gray-50">
            <Shield className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <div className="text-lg font-semibold">{verifiedProofsCount}</div>
            <div className="text-xs text-muted-foreground">ZK Proofs</div>
          </div>
          <div className="p-2 rounded-md bg-gray-50">
            <CheckCircle className="h-5 w-5 mx-auto mb-1 text-purple-600" />
            <div className="text-lg font-semibold">{activitiesCount}</div>
            <div className="text-xs text-muted-foreground">Activities</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}