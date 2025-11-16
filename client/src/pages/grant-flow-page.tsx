import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Plus, Search, Filter, SlidersHorizontal, ArrowUp, MessageCircle, Eye, ThumbsUp, FileText, Lightbulb } from 'lucide-react';


import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { ThumbsUpWithPurposeHub } from '@/components/common/ThumbsUpWithPurposeHub';

export default function GrantFlowPage() {
  const [activeTab, setActiveTab] = React.useState('rfi');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState('all');
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Query for RFIs
  const { 
    data: rfis = [], 
    isLoading: rfisLoading,
    error: rfisError 
  } = useQuery({
    queryKey: ['/api/grant-flow/rfis'],
    enabled: activeTab === 'rfi'
  });

  // Query for RFPs
  const { 
    data: rfps = [], 
    isLoading: rfpsLoading,
    error: rfpsError 
  } = useQuery({
    queryKey: ['/api/grant-flow/rfps'],
    enabled: activeTab === 'rfp'
  });

  // Filter function
  const filteredItems = React.useMemo(() => {
    // Ensure items is always an array
    const items = activeTab === 'rfi' ? (Array.isArray(rfis) ? rfis : []) : (Array.isArray(rfps) ? rfps : []);
    
    return items.filter((item: any) => {
      const matchesSearch = searchQuery === '' || 
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [activeTab, rfis, rfps, searchQuery, filterCategory]);

  // Handle vote
  const handleVote = (id: number) => {
    toast({
      title: 'Vote Registered',
      description: 'Your vote has been counted!'
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 mb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">GrantFlow</h1>
            <p className="text-gray-500 mt-1">
              Submit ideas, find proposals, and collaborate on projects with community backing
            </p>
          </div>
          
          <Button onClick={() => navigate('/grant-flow/submit-rfi')}>
            <Plus className="mr-2 h-4 w-4" /> Submit Idea
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              className="pl-10"
              placeholder="Search ideas and proposals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                {filterCategory === 'all' ? 'All Categories' : filterCategory}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilterCategory('all')}>All Categories</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterCategory('web3')}>Web3/Blockchain</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterCategory('ai')}>AI/Machine Learning</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterCategory('privacy')}>Privacy/Security</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterCategory('infrastructure')}>Infrastructure</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterCategory('community')}>Community</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterCategory('integration')}>Integration</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterCategory('other')}>Other</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" /> Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Most Recent</DropdownMenuItem>
              <DropdownMenuItem>Most Votes</DropdownMenuItem>
              <DropdownMenuItem>Most Comments</DropdownMenuItem>
              <DropdownMenuItem>Most Active</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Tabs defaultValue="rfi" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="rfi">Requests for Ideas</TabsTrigger>
            <TabsTrigger value="rfp">Requests for Proposals</TabsTrigger>
          </TabsList>

          <TabsContent value="rfi">
            {rfisLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="h-[320px]">
                    <CardHeader className="pb-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                      <div className="flex gap-2 mt-4">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-10 w-full" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : rfisError ? (
              <div className="text-center py-8">
                <p className="text-red-500">Error loading ideas. Please try again later.</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <h3 className="text-lg font-medium">No ideas found</h3>
                <p className="text-gray-500 mt-2 mb-6">Be the first to submit an idea for the community</p>
                <Button onClick={() => navigate('/grant-flow/submit-rfi')}>
                  <Plus className="mr-2 h-4 w-4" /> Submit Idea
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((rfi: any) => (
                  <Card key={rfi.id} className="h-full flex flex-col hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{rfi.title}</CardTitle>
                        <Badge variant="outline" className="capitalize">{rfi.category}</Badge>
                      </div>
                      <CardDescription className="text-sm truncate">
                        Submitted by {rfi.username} • {new Date(rfi.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm line-clamp-3 mb-3">{rfi.description}</p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {rfi.tags && rfi.tags.split(',').map((tag: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">{tag.trim()}</Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-4">
                      <div className="flex gap-4">
                        <ThumbsUpWithPurposeHub
                          item={{
                            id: rfi.id,
                            title: rfi.title,
                            description: rfi.description,
                            category: rfi.impactArea
                          }}
                          sourceType="rfi"
                          onThumbsUp={() => handleVote(rfi.id)}
                          size="sm"
                          variant="ghost"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
                        >
                          <MessageCircle className="h-4 w-4" />
                          {rfi.comments || 0}
                        </Button>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/grant-flow/rfi/${rfi.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rfp">
            {rfpsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="h-[320px]">
                    <CardHeader className="pb-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4" />
                      <div className="flex gap-2 mt-4">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Skeleton className="h-10 w-full" />
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : rfpsError ? (
              <div className="text-center py-8">
                <p className="text-red-500">Error loading proposals. Please try again later.</p>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <h3 className="text-lg font-medium">No active proposals found</h3>
                <p className="text-gray-500 mt-2 mb-6">Popular ideas get converted to RFPs by community sponsors</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((rfp: any) => (
                  <Card key={rfp.id} className="h-full flex flex-col hover:shadow-md transition-shadow border-t-4 border-t-blue-500">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{rfp.title}</CardTitle>
                        <Badge className="capitalize bg-blue-100 text-blue-800 hover:bg-blue-200">
                          {rfp.status || 'Open'}
                        </Badge>
                      </div>
                      <CardDescription className="text-sm flex items-center gap-2">
                        <span>Funding: ${rfp.budget?.toLocaleString() || 'TBD'}</span>
                        <span>•</span>
                        <span>Deadline: {rfp.deadline ? new Date(rfp.deadline).toLocaleDateString() : 'TBD'}</span>
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                      <p className="text-sm line-clamp-3 mb-3">{rfp.description}</p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {rfp.tags && rfp.tags.split(',').map((tag: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">{tag.trim()}</Badge>
                        ))}
                      </div>
                      {rfp.grantMatches && rfp.grantMatches.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm font-medium mb-2">Grant Matches:</p>
                          <div className="flex flex-wrap gap-2">
                            {rfp.grantMatches.map((match: any, i: number) => (
                              <Badge key={i} variant="outline" className="bg-green-50">
                                {match.grantSourceName}: ${match.amount?.toLocaleString()}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="flex justify-between border-t pt-4">
                      <div className="flex gap-4">
                        <span className="text-sm text-gray-500">
                          {rfp.applications || 0} Applications
                        </span>
                      </div>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={() => navigate(`/grant-flow/rfp/${rfp.id}`)}
                      >
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
    </div>
  );
}