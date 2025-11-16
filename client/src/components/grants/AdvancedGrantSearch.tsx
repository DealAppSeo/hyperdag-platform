import { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Search, Sparkles, BrainCircuit, ShieldCheck, ListFilter } from 'lucide-react';
import { BlockchainGrantVerifier } from './BlockchainGrantVerifier';

// Types
type GrantMatch = {
  id: number;
  grantSource: {
    id: number;
    name: string;
    categories: string[];
    availableFunds: number | null;
    applicationUrl: string;
    description: string;
  };
  matchScore: string;
  matchReason: string;
  potentialFunding: number | null;
};

type RFP = {
  id: number;
  title: string;
  description: string;
  categories: string[];
  fundingGoal: number | null;
};

type SearchParams = {
  threshold: number;
  matchType: 'semantic' | 'rule-based' | 'hybrid';
  enhancementLevel: 'basic' | 'detailed' | 'comprehensive';
};

type AdvancedGrantSearchProps = {
  rfp: RFP;
};

export function AdvancedGrantSearch({ rfp }: AdvancedGrantSearchProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('ai');
  const [searchParams, setSearchParams] = useState<SearchParams>({
    threshold: 0.5,
    matchType: 'hybrid',
    enhancementLevel: 'detailed'
  });
  const [searching, setSearching] = useState(false);
  const [searchComplete, setSearchComplete] = useState(false);
  const [matches, setMatches] = useState<GrantMatch[]>([]);
  const [visibleCount, setVisibleCount] = useState(0);
  
  // Clean up timeouts when component unmounts
  const timeoutRefs = useRef<number[]>([]);
  
  // Clear all timeouts
  const clearAllTimeouts = () => {
    timeoutRefs.current.forEach(id => window.clearTimeout(id));
    timeoutRefs.current = [];
  };
  
  useEffect(() => {
    return () => clearAllTimeouts();
  }, []);
  
  // AI-powered grant matching
  const findAIMatches = useMutation({
    mutationFn: async () => {
      try {
        setSearching(true);
        setSearchComplete(false);
        setMatches([]);
        
        // Clear previous timeouts
        clearAllTimeouts();
        
        console.log('Finding AI matches for RFP:', rfp.id);
        console.log('Search params:', searchParams);
        
        // Call the enhanced grant search endpoint with AI capabilities
        const response = await apiRequest('POST', `/api/enhanced-grant-search`, {
          rfpId: rfp.id,
          threshold: searchParams.threshold,
          matchType: searchParams.matchType,
          enhancementLevel: searchParams.enhancementLevel,
          useAI: true
        });
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.message || 'Failed to find AI matches');
        }
        
        return result.data as GrantMatch[];
      } catch (error) {
        console.error('Error finding AI matches:', error);
        throw error;
      } finally {
        setSearching(false);
        setSearchComplete(true);
      }
    },
    onSuccess: (data) => {
      const matches = data || [];
      
      if (matches.length > 0) {
        // Progressive reveal of matches
        const revealMatches = (index: number) => {
          if (index >= matches.length) return;
          
          const timeoutId = window.setTimeout(() => {
            setVisibleCount(prev => prev + 1);
            
            // Recursive call for next match
            revealMatches(index + 1);
          }, 300); // Reveal each match with a 300ms delay
          
          timeoutRefs.current.push(timeoutId);
        };
        
        // Start revealing after a short delay
        const initialDelayId = window.setTimeout(() => {
          revealMatches(0);
        }, 500);
        
        timeoutRefs.current.push(initialDelayId);
        
        // Store the matches
        setMatches(matches);
        
        toast({
          title: 'AI Search Results',
          description: `Found ${matches.length} potential grants using AI`,
        });
      } else {
        toast({
          title: 'No Results',
          description: 'No matching grants found',
        });
      }
    },
    onError: (error: any) => {
      console.error('AI search failed:', error);
      toast({
        title: 'AI Search Failed',
        description: error.message || 'Could not complete the search',
        variant: 'destructive'
      });
    }
  });
  
  // Format match percentage for display
  const formatMatchPercentage = (score: string) => {
    const percentage = Math.round(parseFloat(score) * 100);
    return `${percentage}%`;
  };
  
  // Get match quality class based on score
  const getMatchQualityClass = (score: string) => {
    const percentage = parseFloat(score) * 100;
    
    if (percentage >= 85) return 'bg-green-500';
    if (percentage >= 70) return 'bg-emerald-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  // Determine if a match is highly relevant
  const isHighlyRelevant = (score: string) => {
    return parseFloat(score) >= 0.85;
  };
  
  // Format currency for display
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Funding amount not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Update search parameters
  const updateSearchParam = (key: keyof SearchParams, value: any) => {
    setSearchParams(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Get filtered matches based on visible count
  const visibleMatches = matches.slice(0, visibleCount);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BrainCircuit className="h-5 w-5 mr-2 text-primary" />
            Advanced Grant Matching
          </CardTitle>
          <CardDescription>
            Use AI and blockchain to find and verify the best grant opportunities for "{rfp.title}"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="ai">
                <Sparkles className="h-4 w-4 mr-2" />
                AI-Powered Search
              </TabsTrigger>
              <TabsTrigger value="blockchain">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Blockchain Verification
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="ai" className="pt-6 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Match Type</label>
                    <Select
                      value={searchParams.matchType}
                      onValueChange={(value: any) => updateSearchParam('matchType', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select match type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rule-based">Rule-Based</SelectItem>
                        <SelectItem value="semantic">Semantic (AI)</SelectItem>
                        <SelectItem value="hybrid">Hybrid (Recommended)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Enhancement Level</label>
                    <Select
                      value={searchParams.enhancementLevel}
                      onValueChange={(value: any) => updateSearchParam('enhancementLevel', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select enhancement level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="detailed">Detailed (Recommended)</SelectItem>
                        <SelectItem value="comprehensive">Comprehensive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Match Threshold ({searchParams.threshold * 100}%)</label>
                    <input 
                      type="range" 
                      min="0.3" 
                      max="0.9" 
                      step="0.1"
                      value={searchParams.threshold}
                      onChange={(e) => updateSearchParam('threshold', parseFloat(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button 
                    onClick={() => findAIMatches.mutate()}
                    disabled={searching || findAIMatches.isPending}
                  >
                    {(searching || findAIMatches.isPending) && 
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    }
                    Find AI-Enhanced Matches
                  </Button>
                </div>
              </div>
              
              {/* Search results */}
              {searchComplete && (
                <div className="space-y-4 mt-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Results</h3>
                    <Badge variant="outline">
                      {visibleMatches.length} / {matches.length} Matches
                    </Badge>
                  </div>
                  
                  {matches.length === 0 ? (
                    <div className="text-center p-6 border border-dashed rounded-md">
                      <p className="text-muted-foreground">No matching grants found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {visibleMatches.map((match, index) => {
                        const matchColor = getMatchQualityClass(match.matchScore);
                        
                        return (
                          <div
                            key={match.id}
                            className="transition-all duration-500 ease-in-out transform"
                            style={{
                              animation: `fadeSlideIn 0.5s ease-out ${index * 0.1}s both`
                            }}
                          >
                            <Card className="overflow-hidden">
                              <div className="flex items-stretch">
                                <div className={`w-2 ${matchColor}`} />
                                <CardContent className="flex-1 p-4">
                                  <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                      <h3 className="font-medium">{match.grantSource.name}</h3>
                                      <p className="text-sm text-muted-foreground line-clamp-2">
                                        {match.grantSource.description}
                                      </p>
                                      
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {match.grantSource.categories?.map((category: string, i: number) => (
                                          <Badge key={i} variant="outline">
                                            {category}
                                          </Badge>
                                        ))}
                                      </div>
                                      
                                      <div className="mt-3 text-sm">
                                        <p className="font-medium">Match Reason:</p>
                                        <p className="text-muted-foreground">{match.matchReason}</p>
                                      </div>
                                    </div>
                                    
                                    <div className="flex flex-col items-end">
                                      <div className={`text-white font-medium rounded-full h-12 w-12 flex items-center justify-center ${matchColor}`}>
                                        {formatMatchPercentage(match.matchScore)}
                                      </div>
                                      
                                      {isHighlyRelevant(match.matchScore) && (
                                        <div className="flex items-center text-xs text-amber-500 mt-1">
                                          <Sparkles className="h-3 w-3 mr-1" />
                                          Top Match
                                        </div>
                                      )}
                                      
                                      <p className="text-sm font-medium mt-2">
                                        {formatCurrency(match.potentialFunding)}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="mt-4 flex justify-end">
                                    <Button 
                                      size="sm"
                                      variant="outline"
                                      onClick={() => window.open(match.grantSource.applicationUrl, '_blank')}
                                    >
                                      Apply Now
                                    </Button>
                                  </div>
                                </CardContent>
                              </div>
                            </Card>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="blockchain" className="pt-6">
              <BlockchainGrantVerifier rfpId={rfp.id} rfpData={rfp} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeSlideIn {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `
      }} />
    </div>
  );
}