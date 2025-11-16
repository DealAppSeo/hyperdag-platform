import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Very simplified GrantMatch type with only essential fields
type GrantMatch = {
  id: number;
  grantSource: {
    name: string;
    categories: string[];
    availableFunds: number | null;
    applicationUrl: string;
  };
  matchScore: string;
  potentialFunding: number | null;
};

type GrantMatchFinderProps = {
  rfpId: number;
  rfpData: {
    title: string;
  };
};

// Ultra-basic grant match finder with minimal UI and no fancy features
export function BasicGrantMatchFinder({ rfpId, rfpData }: GrantMatchFinderProps) {
  const { toast } = useToast();
  const [matches, setMatches] = useState<GrantMatch[]>([]);
  const [loading, setLoading] = useState(false);

  // Basic search function - no staggered loading, just simple direct results
  const findGrantMatches = useMutation({
    mutationFn: async () => {
      console.log('Starting grant search...');
      
      const response = await fetch('/api/simple-grant-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfpId: rfpId })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Grant search successful:', result);
      
      if (!result.success) {
        throw new Error(result.message || 'Grant search failed');
      }
      
      return result;
    },
    onSuccess: (data) => {
      console.log('Grant search successful:', data);
      const matches = data.data || [];
      setMatches(matches);
      
      if (matches.length > 0) {
        toast({
          title: 'Grant Search Complete',
          description: `Found ${matches.length} real grant opportunities`,
        });
      } else {
        toast({
          title: 'No Grants Found',
          description: 'No matching grants available at this time.',
        });
      }
    },
    onError: (error: any) => {
      console.error('Grant search error:', error);
      const errorMessage = error?.message || 'Unable to search grants. Please try again.';
      toast({
        title: 'Search Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Grant Search</CardTitle>
          <CardDescription>
            Find grants that match "{rfpData.title}"
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Button 
              onClick={() => findGrantMatches.mutate()}
              disabled={loading || findGrantMatches.isPending}
            >
              {(loading || findGrantMatches.isPending) && 
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              }
              Search Grants
            </Button>
          </div>
          
          {matches.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-lg font-medium">Results:</h3>
              
              {matches.map((match) => (
                <Card key={match.id}>
                  <CardHeader>
                    <CardTitle>{match.grantSource.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium">Match Score:</p>
                        <p>{Math.round(parseFloat(match.matchScore) * 100)}%</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Funding:</p>
                        <p>${(match.potentialFunding || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <p className="text-sm font-medium">Categories:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {match.grantSource.categories.map((category, i) => (
                          <Badge key={i} variant="outline">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      size="sm"
                      onClick={() => window.open(match.grantSource.applicationUrl, '_blank')}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}