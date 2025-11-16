import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, ThumbsUp, ThumbsDown, MailOpen, Clock, CheckCircle2 } from 'lucide-react';

type GrantMatch = {
  id: number;
  rfpId: number;
  grantSourceId: number;
  matchScore: string;
  scoreValue?: number; // AI score as a number for easier use in UI
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
  matchQuality?: string; // UI enhancement: excellent, good, moderate
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

export function GrantMatchFinder({ rfpId, rfpData }: GrantMatchFinderProps) {
  const { toast } = useToast();
  
  // Reference to the results container for scrolling
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Separate states for UI display and search status
  const [isSearching, setIsSearching] = useState(false);
  const [visibleMatches, setVisibleMatches] = useState<GrantMatch[]>([]);
  const [stagingMatches, setStagingMatches] = useState<GrantMatch[]>([]);
  const [isStaggering, setIsStaggering] = useState(false);
  const [isSearchComplete, setIsSearchComplete] = useState(false);
  const [isSorting, setIsSorting] = useState(false);
  const [searchCount, setSearchCount] = useState(0);
  const [displayError, setDisplayError] = useState<string | null>(null);
  
  // Timeouts reference for proper cleanup
  const timeoutsRef = useRef<number[]>([]);
  
  // Clear all timeouts to prevent memory leaks
  const clearAllTimeouts = () => {
    timeoutsRef.current.forEach(id => window.clearTimeout(id));
    timeoutsRef.current = [];
  };
  
  // Add a timeout with auto-cleanup registration
  const addTimeout = (callback: () => void, delay: number) => {
    const id = window.setTimeout(() => {
      callback();
      // Remove this timeout from the ref array once executed
      timeoutsRef.current = timeoutsRef.current.filter(t => t !== id);
    }, delay);
    timeoutsRef.current.push(id);
    return id;
  };
  
  // Cleanup timeouts on component unmount
  useEffect(() => {
    return () => clearAllTimeouts();
  }, []);
  
  // Query to get existing grant matches for this RFP, but don't auto-load them
  const { data: matchesData, isLoading: isLoadingMatches, refetch: refetchMatches } = useQuery<{success: boolean, data: GrantMatch[]}>({ 
    queryKey: [`/api/grant-matches/rfp/${rfpId}`],
    enabled: false, // Disable auto-loading of matches, user must click the search button
    initialData: { success: true, data: [] } // Start with empty data instead of undefined
  });

  // Effect to track search count in localStorage
  useEffect(() => {
    if (searchCount > 0) {
      // Get current count from localStorage
      const currentCount = localStorage.getItem('grantSearchCount') || '0';
      const newCount = parseInt(currentCount) + 1;
      localStorage.setItem('grantSearchCount', newCount.toString());
      
      // Store count for this user in the backend
      const trackSearch = async () => {
        try {
          await apiRequest('POST', '/api/analytics/track-grant-search', { count: newCount });
        } catch (error) {
          console.error('Failed to track search analytics', error);
        }
      };
      trackSearch();
    }
  }, [searchCount]);

  // Completely rewritten effect to handle staggered display with exact timing pattern
  useEffect(() => {
    // Only run this effect when staggering is active and we have matches to display
    if (!isStaggering || stagingMatches.length === 0) return;
    
    // Clear any existing timeouts to avoid conflicts
    clearAllTimeouts();
    
    // If this is the start of staggering, ensure we're scrolled to the results
    if (visibleMatches.length === 0) {
      addTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
      
      // Show first result after 1 second
      addTimeout(() => {
        setVisibleMatches([stagingMatches[0]]);
        setStagingMatches(stagingMatches.slice(1));
        
        console.log("🔍 Displayed first match");
      }, 1000);
      
      return; // Exit this iteration, next one will handle further matches
    }
    
    // If we have exactly 1 visible match, add 2 more after 2 seconds
    if (visibleMatches.length === 1 && stagingMatches.length > 0) {
      const nextBatchSize = Math.min(2, stagingMatches.length);
      const nextBatch = stagingMatches.slice(0, nextBatchSize);
      
      addTimeout(() => {
        setVisibleMatches(prev => [...prev, ...nextBatch]);
        setStagingMatches(stagingMatches.slice(nextBatchSize));
        
        console.log(`🔍 Displayed 2 more matches (now showing ${visibleMatches.length + nextBatchSize})`);
      }, 2000);
      
      return;
    }
    
    // If we have exactly 3 visible matches, add 1 more after 1 second
    if (visibleMatches.length === 3 && stagingMatches.length > 0) {
      addTimeout(() => {
        setVisibleMatches(prev => [...prev, stagingMatches[0]]);
        setStagingMatches(stagingMatches.slice(1));
        
        console.log(`🔍 Displayed 1 more match (now showing ${visibleMatches.length + 1})`);
      }, 1000);
      
      return;
    }
    
    // For all other cases, add 2 per second
    if (visibleMatches.length >= 4 && stagingMatches.length > 0) {
      const nextBatchSize = Math.min(2, stagingMatches.length);
      const nextBatch = stagingMatches.slice(0, nextBatchSize);
      
      addTimeout(() => {
        setVisibleMatches(prev => [...prev, ...nextBatch]);
        setStagingMatches(stagingMatches.slice(nextBatchSize));
        
        console.log(`🔍 Displayed ${nextBatchSize} more matches (now showing ${visibleMatches.length + nextBatchSize})`);
      }, 1000);
      
      return;
    }
    
    // If we have no more matches to display, finish the search
    if (stagingMatches.length === 0) {
      setIsStaggering(false);
      setIsSearchComplete(true);
      
      // Start sorting animation
      addTimeout(() => {
        setIsSorting(true);
        
        // Complete sorting after 1 second
        addTimeout(() => {
          setIsSorting(false);
          setIsSearching(false);
          
          console.log("✅ Search complete, sorting finished");
        }, 1000);
      }, 500);
    }
  }, [isStaggering, stagingMatches, visibleMatches.length]);

  // Handle sorting of matches for display
  const getSortedMatches = () => {
    if (!isSearchComplete || isSorting) return visibleMatches;
    
    // Sort by score after completion
    return [...visibleMatches].sort((a, b) => {
      const scoreA = a.scoreValue || parseFloat(a.matchScore);
      const scoreB = b.scoreValue || parseFloat(b.matchScore);
      return scoreB - scoreA;
    });
  };
  
  // Mutation to find new grant matches
  const findMatches = useMutation({
    mutationFn: async () => {
      // Reset all state
      setIsSearching(true);
      setIsSearchComplete(false);
      setVisibleMatches([]);
      setStagingMatches([]);
      setSearchCount(prev => prev + 1);
      setDisplayError(null);
      
      // Scroll to the results section when search begins
      addTimeout(() => {
        if (resultsRef.current) {
          resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
      
      try {
        const response = await apiRequest('POST', `/api/grant-matches/rfp/${rfpId}/find`, {});
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error finding matches:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      const matches = data.data || [];
      
      if (matches.length === 0) {
        setIsSearching(false);
        toast({
          title: 'No Matches Found',
          description: 'No matching grants were found for this project. Try modifying your project description or requirements.',
          variant: 'default'
        });
        return;
      }
      
      // Limit to 12 matches and add match quality labels
      const processedMatches = matches.slice(0, 12).map((match: GrantMatch, index: number) => {
        // Calculate match quality based on score or index
        const score = match.scoreValue || parseFloat(match.matchScore);
        let matchQuality = '';
        
        if (index < 3 || score > 0.8) {
          matchQuality = 'excellent';
        } else if (index < 6 || score > 0.7) {
          matchQuality = 'good';
        } else if (index < 9 || score > 0.5) {
          matchQuality = 'moderate';
        }
        
        return {
          ...match,
          matchQuality
        };
      });
      
      // Sort matches by score for the best sequential display
      const sortedMatches = [...processedMatches].sort((a, b) => {
        const scoreA = a.scoreValue || parseFloat(a.matchScore);
        const scoreB = b.scoreValue || parseFloat(b.matchScore);
        return scoreB - scoreA; // Sort in descending order
      });
      
      console.log(`✅ Found ${sortedMatches.length} matches, beginning staggered display`);
      
      // Begin staggered display - ensure this happens even on first search
      setStagingMatches(sortedMatches);
      
      // Immediately start the staggering process
      setIsStaggering(true);
      
      toast({
        title: 'Searching for Grants',
        description: 'Our AI is scanning through potential grant opportunities for your project...',
      });
    },
    onError: (error) => {
      setDisplayError('Failed to find matching grants. Please try again.');
      setIsSearching(false);
      toast({
        title: 'Error Finding Grants',
        description: 'There was a problem finding grant matches.',
        variant: 'destructive'
      });
    }
  });

  // Mutation to update match status
  const updateMatchStatus = useMutation({
    mutationFn: async ({ matchId, status }: { matchId: number, status: string }) => {
      const response = await apiRequest('PATCH', `/api/grant-matches/${matchId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      refetchMatches();
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

  // Helper to get appropriate status badge color
  const getStatusBadgeVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (status) {
      case 'applied': return 'secondary';
      case 'approved': return 'default'; // Use default instead of success to match the Badge variants
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  };

  // Format match score as percentage
  const formatScore = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

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
              >
                {(isSearching || findMatches.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Find Matching Grants
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Our AI-powered algorithm will find grants that match your project's description and align with HyperDAG's mission.
              </p>
            </div>
          </div>

          <div ref={resultsRef} id="grant-match-results" className="mt-8">
            <h3 className="text-lg font-medium mb-4">Grant Matches</h3>
            
            {isSearching ? (
              <div className="relative">
                {/* Search status header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                    <span className="font-medium">
                      {isStaggering 
                        ? `Discovered ${visibleMatches.length} potential grant matches...` 
                        : isSorting 
                          ? "Sorting grants by relevance..." 
                          : "Searching for matching grants..."}
                    </span>
                  </div>
                  
                  {visibleMatches.length > 0 && isStaggering && (
                    <Badge variant="outline" className="animate-pulse bg-muted/50">
                      <Clock className="h-3 w-3 mr-1" />
                      Searching...
                    </Badge>
                  )}
                  
                  {isSearchComplete && isSorting && (
                    <Badge variant="outline" className="bg-muted/50">
                      <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                      Search Complete
                    </Badge>
                  )}
                </div>
                
                {/* Staggered grant matches display */}
                <div className="space-y-4">
                  {getSortedMatches().map((match, index) => (
                    <Card 
                      key={match.id} 
                      className={`overflow-hidden transition-all duration-300 ${
                        isSorting ? 'opacity-70' : 'opacity-100'
                      }`}
                      style={{
                        transform: isSorting ? `translateY(${(index * 20) - ((match.scoreValue || parseFloat(match.matchScore)) * 100)}px)` : 'none',
                        transition: 'transform 0.8s ease-in-out'
                      }}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <CardTitle className="text-lg">{match.grantSource.name}</CardTitle>
                            {match.matchQuality && (
                              <div className="mt-1">
                                {match.matchQuality === 'excellent' && (
                                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-300">
                                    Top Match
                                  </Badge>
                                )}
                                {match.matchQuality === 'good' && (
                                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300">
                                    Good Match
                                  </Badge>
                                )}
                                {match.matchQuality === 'moderate' && (
                                  <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300">
                                    Moderate Match
                                  </Badge>
                                )}
                              </div>
                            )}
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
              </div>
            ) : searchCount === 0 ? (
              <div className="text-center py-8 border rounded-lg bg-muted/50">
                <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <h3 className="font-medium">Discover Your Perfect Grant Match</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Click "Find Matching Grants" to begin searching for opportunities tailored to your project.
                </p>
              </div>
            ) : (
              <div className="text-center py-8 border rounded-lg bg-muted/50">
                <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <h3 className="font-medium">No Matching Grants Found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your RFP details to improve matching, or explore our grant database manually.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}