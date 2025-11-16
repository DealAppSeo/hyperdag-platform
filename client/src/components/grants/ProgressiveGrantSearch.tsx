import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, Search, Sparkles } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from '@/lib/queryClient';

export function ProgressiveGrantSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [revealedGrants, setRevealedGrants] = useState<any[]>([]);
  const [showSpinner, setShowSpinner] = useState(false);
  
  // Fetch all grants but don't display them immediately
  const { data, isLoading } = useQuery({
    queryKey: ['/api/enhanced-grant-search', searchQuery],
    queryFn: async () => {
      // Use the AI-enhanced grant matching service
      const response = await apiRequest('POST', `/api/enhanced-grant-search`, {
        query: searchQuery,
        useAI: true,
        enhancementLevel: 'detailed'
      });
      const result = await response.json();
      return result.success ? result.data : [];
    },
    enabled: searchQuery.length > 0
  });
  
  // Ensure we have an array to work with
  const allGrants = data || [];
  
  // Function to start the progressive reveal with specific timing requirements
  const startProgressiveReveal = () => {
    setIsSearching(true);
    setRevealedGrants([]);
    setShowSpinner(true);
    
    // Scroll to the top of the results
    setTimeout(() => {
      window.scrollTo({
        top: document.getElementById('search-results-area')?.offsetTop || 0,
        behavior: 'smooth'
      });
    }, 100);
    
    // Staggered reveal of grants - following specific timing pattern
    const revealNextBatch = (currentIndex: number, batchSize: number, nextDelay: number) => {
      if (currentIndex >= allGrants.length) {
        setShowSpinner(false);
        return;
      }
      
      // Get the next batch to reveal
      const endIndex = Math.min(currentIndex + batchSize, allGrants.length);
      const nextBatch = allGrants.slice(currentIndex, endIndex);
      
      // Add the next batch with specified delay
      setTimeout(() => {
        setRevealedGrants(prev => [...prev, ...nextBatch]);
        setShowSpinner(endIndex < allGrants.length); // Only keep spinner if more results coming
        
        // If we have more grants to reveal, continue with the specified timing pattern
        if (endIndex < allGrants.length) {
          // Determine next batch size and delay based on progress
          let nextBatchSize = 0;
          let delay = 0;
          
          if (currentIndex === 0) {
            // After first item, show 2 more after 2 seconds
            nextBatchSize = 2;
            delay = 2000;
          } else if (currentIndex < 3) {
            // After 3 items, show 1 more after 1 second
            nextBatchSize = 1;
            delay = 1000;
          } else {
            // Then show 2 per second after that
            nextBatchSize = 2;
            delay = 1000;
          }
          
          setTimeout(() => revealNextBatch(endIndex, nextBatchSize, delay), nextDelay);
        } else {
          // No more grants to reveal
          setTimeout(() => setShowSpinner(false), 100);
        }
      }, nextDelay);
    };
    
    // Start with first result after 1 second
    setTimeout(() => revealNextBatch(0, 1, 1000), 1000);
  };
  
  // Reset when search query changes
  useEffect(() => {
    if (searchQuery.length > 0) {
      setIsSearching(false);
      setRevealedGrants([]);
    }
  }, [searchQuery]);
  
  // Get match percentage based on search relevance
  const getMatchPercentage = (grant: any) => {
    // In a real implementation, this would be calculated by the backend
    // based on AI matching, user profile, and search query
    const baseScore = grant.matchScore ? 
      parseFloat(grant.matchScore) * 100 : 
      (50 + Math.floor(Math.random() * 45));
    
    // If name or description contains search terms, boost score
    if (searchQuery && 
       (grant.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        grant.description.toLowerCase().includes(searchQuery.toLowerCase()))) {
      return Math.min(baseScore + 20, 98);
    }
    
    return Math.min(Math.max(0, baseScore), 100);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Input
          placeholder="Search for grants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button 
          onClick={startProgressiveReveal}
          disabled={searchQuery.length === 0 || isLoading || isSearching}
        >
          <Search className="mr-2 h-4 w-4" />
          Find Grants
        </Button>
      </div>
      
      {/* Results area */}
      <div id="search-results-area" className="space-y-4">
        {/* Loading state with anticipation */}
        {showSpinner && (
          <div className="flex flex-col items-center justify-center py-6">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
            <p className="text-muted-foreground animate-pulse">
              Searching for your perfect grant match...
            </p>
          </div>
        )}
        
        {/* Results revealed progressively */}
        {revealedGrants.map((grant, index) => {
          const matchPercentage = getMatchPercentage(grant);
          let matchColor = 'bg-red-500';
          
          if (matchPercentage >= 90) matchColor = 'bg-green-500';
          else if (matchPercentage >= 75) matchColor = 'bg-emerald-500';
          else if (matchPercentage >= 60) matchColor = 'bg-amber-500';
          else if (matchPercentage >= 40) matchColor = 'bg-orange-500';
          
          return (
            <div
              key={grant.id}
              className="transition-all duration-500 ease-in-out"
              style={{
                animation: `fadeSlideIn 0.5s ease-out ${index * 0.1}s both`
              }}
            >
              <Card className="overflow-hidden">
                <div className="flex items-stretch">
                  <div className={`w-2 ${matchColor}`} />
                  <CardContent className="flex-1 p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{grant.name}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {grant.description}
                        </p>
                        
                        <div className="flex gap-2 mt-2">
                          {grant.categories?.map((category: string, i: number) => (
                            <span key={i} className="text-xs bg-muted px-2 py-1 rounded-full">
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <div className={`text-white font-medium rounded-full h-10 w-10 flex items-center justify-center ${matchColor}`}>
                          {Math.round(matchPercentage)}%
                        </div>
                        
                        {matchPercentage >= 85 && (
                          <div className="flex items-center text-xs text-amber-500 mt-1">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Top Match
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </div>
          );
        })}
        
        {/* Show a hint if nothing is revealed yet but search was initiated */}
        {isSearching && revealedGrants.length === 0 && !showSpinner && (
          <p className="text-center text-muted-foreground py-4">
            Finding the best matches for you...
          </p>
        )}
      </div>
      

    </div>
  );
}