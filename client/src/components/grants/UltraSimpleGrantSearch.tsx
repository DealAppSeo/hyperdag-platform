import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

// Super basic type
type GrantMatch = {
  id: number;
  grantSource: {
    name: string;
    categories: string[];
    applicationUrl: string;
  };
  matchScore: string;
  potentialFunding: number;
};

type UltraSimpleGrantSearchProps = {
  rfpId: number;
};

export function UltraSimpleGrantSearch({ rfpId }: UltraSimpleGrantSearchProps) {
  const { toast } = useToast();
  const [matches, setMatches] = useState<GrantMatch[]>([]);
  const [loading, setLoading] = useState(false);

  // Extra simple search function
  const findGrants = useMutation({
    mutationFn: async () => {
      setLoading(true);
      
      try {
        console.log('Running ultra simple grant search');
        
        // Use the simple endpoint that always returns results
        const response = await apiRequest('POST', '/api/simple-grant-search', { rfpId });
        const result = await response.json();
        console.log('Search result:', result);
        
        return result;
      } catch (error) {
        console.error('Search error:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    onSuccess: (data) => {
      const matches = data.data || [];
      setMatches(matches);
      
      if (matches.length > 0) {
        toast({
          title: 'Grants Found',
          description: `Found ${matches.length} matching grants`,
        });
      } else {
        toast({
          title: 'No Results',
          description: 'No matching grants found',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Search Failed',
        description: 'Could not complete the search',
        variant: 'destructive'
      });
    }
  });

  return (
    <div>
      <Button 
        onClick={() => findGrants.mutate()}
        disabled={loading || findGrants.isPending}
      >
        {(loading || findGrants.isPending) && 
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        }
        Find Grants
      </Button>
      
      {matches.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-medium">Results:</h3>
          
          {matches.map((match) => (
            <Card key={match.id}>
              <CardHeader>
                <CardTitle>{match.grantSource.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-4">
                  <div>
                    <p className="text-sm font-medium">Match Score:</p>
                    <p>{Math.round(parseFloat(match.matchScore) * 100)}%</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Funding:</p>
                    <p>${match.potentialFunding?.toLocaleString() || 'Variable'}</p>
                  </div>
                </div>
                
                {match.grantSource.categories && (
                  <div>
                    <p className="text-sm font-medium mb-1">Categories:</p>
                    <div className="flex flex-wrap gap-1">
                      {match.grantSource.categories.map((category, i) => (
                        <Badge key={i} variant="outline">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <Button 
                  className="mt-4"
                  size="sm"
                  onClick={() => window.open(match.grantSource.applicationUrl, '_blank')}
                >
                  Apply Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}