import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, AlertCircle, Tag, Users, Calendar, DollarSign } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { GrantMatchBlockchainVerificationCard } from './GrantMatchBlockchainVerificationCard';
import { useToast } from '@/hooks/use-toast';

interface RfpDetailsWithBlockchainVerificationProps {
  rfpId: number;
}

export function RfpDetailsWithBlockchainVerification({ rfpId }: RfpDetailsWithBlockchainVerificationProps) {
  const { toast } = useToast();
  
  // Fetch RFP details
  const { 
    data: rfp, 
    isLoading: isLoadingRfp, 
    error: rfpError 
  } = useQuery({
    queryKey: [`/api/rfps/${rfpId}`],
    enabled: !!rfpId,
  });

  // Fetch grant matches for this RFP
  const { 
    data: grantMatches, 
    isLoading: isLoadingMatches, 
    error: matchesError 
  } = useQuery({
    queryKey: [`/api/grants/matches/rfp/${rfpId}`],
    enabled: !!rfpId,
  });

  // Format currency display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date display
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoadingRfp || isLoadingMatches) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Loading RFP details...</p>
      </div>
    );
  }

  if (rfpError || matchesError) {
    const errorMessage = rfpError 
      ? 'Error loading RFP details' 
      : 'Error loading grant matches';
    
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {errorMessage}. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!rfp) {
    return (
      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>RFP Not Found</AlertTitle>
        <AlertDescription>
          The requested RFP could not be found.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* RFP Details Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{rfp.title}</CardTitle>
              <CardDescription>
                Created on {formatDate(rfp.createdAt)}
              </CardDescription>
            </div>
            <Badge variant="outline">{rfp.type}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">
                {rfp.description}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {rfp.fundingGoal && (
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Funding Goal</p>
                    <p className="font-medium">{formatCurrency(rfp.fundingGoal)}</p>
                  </div>
                </div>
              )}
              
              {rfp.durationDays && (
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Duration</p>
                    <p className="font-medium">{rfp.durationDays} days</p>
                  </div>
                </div>
              )}
              
              {rfp.teamRoles && rfp.teamRoles.length > 0 && (
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Team Roles</p>
                    <p className="font-medium">{rfp.teamRoles.length} roles needed</p>
                  </div>
                </div>
              )}
            </div>
            
            {rfp.categories && rfp.categories.length > 0 && (
              <div>
                <div className="flex items-center mb-2">
                  <Tag className="h-4 w-4 mr-2 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Categories</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {rfp.categories.map((category) => (
                    <Badge key={category} variant="secondary">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Grant Matches Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Grant Matches</h2>
        
        {/* Blockchain Verification Card */}
        <GrantMatchBlockchainVerificationCard
          rfpId={rfpId}
          rfpTitle={rfp.title}
          grantMatches={grantMatches || []}
        />
        
        {/* Grant Matches List */}
        {grantMatches && grantMatches.length > 0 ? (
          <div className="space-y-4">
            {grantMatches.map((match) => (
              <Card key={match.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{match.grantSource.name}</CardTitle>
                    <Badge>{match.status}</Badge>
                  </div>
                  <CardDescription>
                    <a 
                      href={match.grantSource.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {match.grantSource.website}
                    </a>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Match Score</p>
                      <p className="font-medium">{match.matchScore}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Relevance</p>
                      <p className="font-medium">{match.relevanceScore}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Funding Potential</p>
                      <p className="font-medium">{match.fundingPotential}</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {match.grantSource.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-6">
              <div className="text-center">
                <p className="text-muted-foreground">No grant matches found for this RFP.</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}