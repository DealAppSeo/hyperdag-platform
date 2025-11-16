import { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, ThumbsUp, ThumbsDown, MailOpen, CheckCircle2 } from 'lucide-react';

type GrantMatch = {
  id: number;
  rfpId: number;
  grantSourceId: number;
  matchScore: string;
  scoreValue?: number; 
  status: string;
  matchReason: string;
  potentialFunding: number | null;
  grantSource: {
    id: number;
    name: string;
    description: string;
    categories: string[];
    availableFunds: number | null;
    contactEmail: string | null;
    applicationUrl: string;
    applicationDeadline: string | null;
  };
  matchQuality?: string;
};

type GrantMatchFinderProps = {
  rfpId: number;
  rfpData: {
    id: number;
    title: string;
    description: string;
    category: string;
    skillsRequired: string[];
    fundingGoal: number;
  };
};

export function SimpleGrantMatchFinder({ rfpId, rfpData }: GrantMatchFinderProps) {
  const { toast } = useToast();
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Simple state management
  const [isSearching, setIsSearching] = useState(false);
  const [matches, setMatches] = useState<GrantMatch[]>([]);
  
  // Format match score as percentage
  const formatScore = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  // Helper to get appropriate status badge color
  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case 'applied': return 'secondary';
      case 'approved': return 'default'; 
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };
  
  // Get match quality badge
  const renderMatchQualityBadge = (match: GrantMatch) => {
    const score = match.scoreValue || parseFloat(match.matchScore);
    
    if (score > 0.8) {
      return (
        <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300">
          Top Match
        </Badge>
      );
    } else if (score > 0.7) {
      return (
        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300">
          Good Match
        </Badge>
      );
    } else if (score > 0.5) {
      return (
        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300">
          Moderate Match
        </Badge>
      );
    }
    
    return null;
  };

  // Simplified mutation to find new grant matches
  const findMatches = useMutation({
    mutationFn: async () => {
      console.log('Starting grant search...');
      setIsSearching(true);
      setMatches([]);
      
      try {
        const response = await apiRequest('POST', `/api/grant-matches/rfp/${rfpId}/find`, {});
        const data = await response.json();
        console.log('Search complete, data received:', data);
        return data;
      } catch (error) {
        console.error('Error finding matches:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      const receivedMatches = data.data || [];
      console.log(`Received ${receivedMatches.length} matches`);
      
      if (receivedMatches.length === 0) {
        setIsSearching(false);
        toast({
          title: 'No Matches Found',
          description: 'No matching grants were found for this project.',
          variant: 'default'
        });
        return;
      }

      // Process matches: add score as numeric value, limit to 12 
      const processedMatches = receivedMatches
        .slice(0, 12)
        .map((match: GrantMatch) => ({
          ...match,
          scoreValue: parseFloat(match.matchScore)
        }))
        .sort((a: GrantMatch, b: GrantMatch) => {
          const scoreA = a.scoreValue || parseFloat(a.matchScore);
          const scoreB = b.scoreValue || parseFloat(b.matchScore);
          return scoreB - scoreA;
        });
      
      setMatches(processedMatches);
      setIsSearching(false);
      
      // Scroll to results after they're loaded
      setTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
      
      toast({
        title: 'Grants Found',
        description: `Found ${processedMatches.length} potential grant matches for your project.`,
      });
    },
    onError: (error) => {
      console.error('Search error:', error);
      setIsSearching(false);
      toast({
        title: 'Error Finding Grants',
        description: 'There was a problem finding grant matches.',
        variant: 'destructive'
      });
    }
  });

  // Update match status
  const updateMatchStatus = useMutation({
    mutationFn: async ({ matchId, status }: { matchId: number, status: string }) => {
      const response = await apiRequest('PATCH', `/api/grant-matches/${matchId}/status`, { status });
      return response.json();
    },
    onSuccess: (data, variables) => {
      // Update match status locally
      setMatches(prevMatches => 
        prevMatches.map(match => 
          match.id === variables.matchId 
            ? { ...match, status: variables.status } 
            : match
        )
      );
      
      toast({
        title: 'Status Updated',
        description: 'Grant match status has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: 'Failed to update grant match status.',
        variant: 'destructive'
      });
    }
  });

  // Helper to get status action buttons
  const renderActionButtons = (match: GrantMatch) => {
    switch (match.status) {
      case 'suggested':
        return (
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              onClick={() => updateMatchStatus.mutate({ matchId: match.id, status: 'applied' })}
              disabled={updateMatchStatus.isPending}
            >
              <MailOpen className="h-4 w-4 mr-1" />
              Mark Applied
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => updateMatchStatus.mutate({ matchId: match.id, status: 'rejected' })}
              disabled={updateMatchStatus.isPending}
            >
              <ThumbsDown className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        );
      case 'applied':
        return (
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              onClick={() => updateMatchStatus.mutate({ matchId: match.id, status: 'approved' })}
              disabled={updateMatchStatus.isPending}
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              Mark Approved
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => updateMatchStatus.mutate({ matchId: match.id, status: 'rejected' })}
              disabled={updateMatchStatus.isPending}
            >
              <ThumbsDown className="h-4 w-4 mr-1" />
              Reject
            </Button>
          </div>
        );
      case 'approved':
        return (
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => updateMatchStatus.mutate({ matchId: match.id, status: 'suggested' })}
              disabled={updateMatchStatus.isPending}
            >
              Reset Status
            </Button>
          </div>
        );
      case 'rejected':
        return (
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => updateMatchStatus.mutate({ matchId: match.id, status: 'suggested' })}
              disabled={updateMatchStatus.isPending}
            >
              Reconsider
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Grant Match Finder</CardTitle>
          <CardDescription>
            Discover grants that match this RFP using our AI-powered grant matching technology
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">RFP Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" value={rfpData.title} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" value={rfpData.category} readOnly className="bg-muted" />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={rfpData.description} 
                    readOnly 
                    className="bg-muted h-24"
                  />
                </div>
                <div>
                  <Label htmlFor="funding-goal">Funding Goal</Label>
                  <Input 
                    id="funding-goal" 
                    value={`$${rfpData.fundingGoal.toLocaleString()}`} 
                    readOnly 
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="skills">Skills Required</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {rfpData.skillsRequired.map((skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button 
                onClick={() => findMatches.mutate()}
                disabled={isSearching || findMatches.isPending}
                className="relative overflow-hidden"
              >
                {(isSearching || findMatches.isPending) && 
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                }
                Find Matching Grants
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Our AI-powered algorithm will find grants that match your project's description.
              </p>
            </div>
          </div>

          <div ref={resultsRef} id="grant-match-results" className="mt-8">
            <h3 className="text-lg font-medium mb-4">Grant Matches</h3>
            
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-8 border rounded-lg bg-muted/50">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                <h3 className="font-medium">Searching for Grants</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Please wait while we find the best matches for your project...
                </p>
              </div>
            ) : matches.length > 0 ? (
              <div className="space-y-4">
                {matches.map((match) => (
                  <Card key={match.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <CardTitle className="text-lg">{match.grantSource.name}</CardTitle>
                          <div className="mt-1">
                            {renderMatchQualityBadge(match)}
                          </div>
                        </div>
                        <Badge variant={getStatusBadgeVariant(match.status)} className="capitalize">
                          {match.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Match Score</p>
                            <p className="font-medium">{formatScore(match.scoreValue || parseFloat(match.matchScore))}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Potential Funding</p>
                            <p className="font-medium">
                              {match.potentialFunding 
                                ? `$${match.potentialFunding.toLocaleString()}` 
                                : match.grantSource.availableFunds 
                                  ? `$${match.grantSource.availableFunds.toLocaleString()}` 
                                  : 'Variable'}
                            </p>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">AI Match Reason</p>
                          <p className="text-sm">{match.matchReason}</p>
                        </div>
                        
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Grant Categories</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {match.grantSource.categories.map((category) => (
                              <Badge key={category} variant="outline" className="text-xs">
                                {category}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2 pb-4 flex justify-between">
                      <div>
                        {match.grantSource.applicationUrl && (
                          <Button 
                            size="sm"
                            onClick={() => window.open(match.grantSource.applicationUrl, '_blank')}
                          >
                            Apply Now
                          </Button>
                        )}
                      </div>
                      
                      {renderActionButtons(match)}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border rounded-lg bg-muted/50">
                <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <h3 className="font-medium">No Matches Found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Click "Find Matching Grants" to begin searching for opportunities.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}