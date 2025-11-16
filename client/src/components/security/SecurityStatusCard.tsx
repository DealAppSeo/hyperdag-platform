import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface SecurityAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  securityFlags: string[];
  blockedActions: string[];
  requiresReview: boolean;
  recommendations: string[];
}

export function SecurityStatusCard() {
  const [refreshing, setRefreshing] = useState(false);

  const { data: security, isLoading, refetch } = useQuery<{
    success: boolean;
    data: SecurityAssessment;
  }>({
    queryKey: ['/api/security/assessment'],
    refetchInterval: false // ❌ NO POLLING - use manual refresh button
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low': return <CheckCircle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'critical': return <XCircle className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Status
          </CardTitle>
          <CardDescription>Loading security assessment...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!security?.success || !security.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Status
          </CardTitle>
          <CardDescription>Unable to load security assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { riskLevel, confidence, securityFlags, blockedActions, requiresReview, recommendations } = security.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Security Status
          <Button
            onClick={handleRefresh}
            variant="ghost"
            size="sm"
            disabled={refreshing}
            className="ml-auto"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <CardDescription>
          Account security assessment and anti-gaming protection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Level */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Risk Level</span>
          <Badge className={`${getRiskColor(riskLevel)} flex items-center gap-1`}>
            {getRiskIcon(riskLevel)}
            {riskLevel.toUpperCase()}
          </Badge>
        </div>

        {/* Confidence Score */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Confidence</span>
          <span className="text-sm text-muted-foreground">
            {Math.round(confidence * 100)}%
          </span>
        </div>

        {/* Security Flags */}
        {securityFlags.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Security Flags</span>
            <div className="space-y-1">
              {securityFlags.map((flag, index) => (
                <Alert key={index} className="py-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">{flag}</AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Blocked Actions */}
        {blockedActions.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Restricted Actions</span>
            <div className="flex flex-wrap gap-1">
              {blockedActions.map((action, index) => (
                <Badge key={index} variant="destructive" className="text-xs">
                  {action.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Manual Review Required */}
        {requiresReview && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              Your account requires manual security review. Please contact support for assistance.
            </AlertDescription>
          </Alert>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Recommendations</span>
            <div className="space-y-1">
              {recommendations.map((rec, index) => (
                <div key={index} className="text-xs text-muted-foreground p-2 bg-blue-50 rounded border border-blue-200">
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Good Standing Message */}
        {riskLevel === 'low' && securityFlags.length === 0 && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Your account security looks good! You have full access to all platform features.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}