import React from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
// Removed AppLayout import to fix duplicate navigation
import { 
  ArrowRight, 
  Lightbulb, 
  FileSearch, 
  Briefcase, 
  Handshake, 
  Plus, 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Users, 
  Calendar, 
  Tags, 
  ArrowUpRight,
  ThumbsUp,
  Heart
} from "lucide-react";

export default function GrantFlowPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = React.useState("overview");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [filterCategory, setFilterCategory] = React.useState("all");
  const [activeTab, setActiveTab] = React.useState("active");
  
  // State for thumbs up confirmation dialog
  const [confirmationDialog, setConfirmationDialog] = React.useState<{
    open: boolean;
    item: any;
    type: 'rfi' | 'rfp' | 'grant' | null;
  }>({ open: false, item: null, type: null });
  
  // Track liked items (thumbs up given)
  const [likedItems, setLikedItems] = React.useState<Set<string>>(new Set());

  // Mutation for saving to Purpose Hub
  const saveToPurposeHubMutation = useMutation({
    mutationFn: async (data: { sourceType: string; sourceId: string; sourceName: string }) => {
      const response = await fetch('/api/purposes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Saved to Purpose Hub!",
        description: "You can find this in your Purpose Hub.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/purposes/saved'] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save to Purpose Hub. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle thumbs up click - first step
  const handleThumbsUp = (item: any, type: 'rfi' | 'rfp' | 'grant') => {
    const itemKey = `${type}-${item.id}`;
    
    if (likedItems.has(itemKey)) {
      // Already liked, just show confirmation for saving
      setConfirmationDialog({ open: true, item, type });
    } else {
      // First time liking - add to liked items and show confirmation
      setLikedItems(prev => new Set([...prev, itemKey]));
      setConfirmationDialog({ open: true, item, type });
      
      toast({
        title: "Thank you for supporting this cause!",
        description: "Your thumbs up helps build community support.",
      });
    }
  };

  // Handle save to Purpose Hub - second step
  const handleSaveToPurposeHub = () => {
    const { item, type } = confirmationDialog;
    if (!item || !type) return;

    const sourceType = type.toUpperCase();
    const sourceId = item.id?.toString() || '';
    const sourceName = item.title || item.name || '';

    saveToPurposeHubMutation.mutate({
      sourceType,
      sourceId,
      sourceName,
    });

    setConfirmationDialog({ open: false, item: null, type: null });
  };

  // Close confirmation dialog
  const closeConfirmationDialog = () => {
    setConfirmationDialog({ open: false, item: null, type: null });
  };
  
  // Fetch projects data with better error handling
  const { data: projects = [], isLoading: projectsLoading, error: projectsError } = useQuery({
    queryKey: ['/api/projects'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Filter function for projects
  const filteredProjects = React.useMemo(() => {
    // Ensure projects is always an array
    const items = Array.isArray(projects) ? projects : [];
    
    return items.filter((project: any) => {
      const matchesSearch = searchQuery === '' || 
        project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesCategory = filterCategory === 'all' || 
        (project.categories && Array.isArray(project.categories) && 
         project.categories.some((cat: string) => cat.toLowerCase() === filterCategory.toLowerCase()));
      
      // Default all projects to active since we don't have a status field
      const matchesStatus = activeTab === 'all' ? true : 
        (activeTab === 'active' ? true : false);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [projects, searchQuery, filterCategory, activeTab]);

  if (!user) {
    return null;
  }

  // Show loading state for better UX
  if (projectsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">GrantFlow Ecosystem</h1>
          <p className="mt-2 text-gray-600">The complete journey from idea to funded project with AI assistance at every step</p>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">GrantFlow Ecosystem</h1>
        <p className="mt-2 text-gray-600">The complete journey from idea to funded project with AI assistance at every step</p>
      </div>
        {/* Main section tabs */}
        <Tabs defaultValue="overview" value={activeSection} onValueChange={setActiveSection} className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects & RFPs</TabsTrigger>
            <TabsTrigger value="grants">Grant Search</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <Card className="mb-8 border-primary/20">
              <CardHeader>
                <CardTitle className="text-2xl">Understanding the HyperDAG Grant Process</CardTitle>
                <CardDescription>
                  AI agents work together with the community to align interests in building AI and Web3 solutions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="mb-4">
                  HyperDAG's grant ecosystem is designed to streamline the journey from initial idea to funded project. Our 
                  AI agents analyze market trends, expertise networks, existing grants and funding availability to help you identify 
                  funding even before you start testing the market or building your MVP. The HyperCrowd portion of our ecosystem 
                  helps match developers, designers, influencers, investors and growth hackers to build the ideal dream team to get 
                  projects from idea to product faster and more efficiently than ever before!
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                  <div className="flex flex-col items-center text-center p-4 bg-secondary/30 rounded-lg">
                    <div className="bg-primary/10 p-3 rounded-full mb-2">
                      <Lightbulb className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium mb-1">1. Request for Information</h3>
                    <p className="text-sm text-muted-foreground">Initial ideas and community input gathering</p>
                  </div>
                  
                  <div className="flex flex-col items-center text-center p-4 bg-secondary/30 rounded-lg">
                    <div className="bg-primary/10 p-3 rounded-full mb-2">
                      <FileSearch className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium mb-1">2. Request for Proposals</h3>
                    <p className="text-sm text-muted-foreground">Formal project specifications and team formation</p>
                  </div>
                  
                  <div className="flex flex-col items-center text-center p-4 bg-secondary/30 rounded-lg">
                    <div className="bg-primary/10 p-3 rounded-full mb-2">
                      <Briefcase className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium mb-1">3. Grant Search</h3>
                    <p className="text-sm text-muted-foreground">Finding external funding opportunities</p>
                  </div>
                  
                  <div className="flex flex-col items-center text-center p-4 bg-secondary/30 rounded-lg">
                    <div className="bg-primary/10 p-3 rounded-full mb-2">
                      <Handshake className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-medium mb-1">4. Grant Matching</h3>
                    <p className="text-sm text-muted-foreground">AI-powered alignment between teams and funders</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>Projects & RFPs</CardTitle>
                  <CardDescription>
                    Create and manage project proposals or find RFPs that match your skills
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Browse existing projects, submit RFIs, respond to RFPs, or start your own project. Our AI will help match you with the right teams and opportunities.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => setActiveSection("projects")} className="w-full">
                    <span className="flex items-center justify-center">
                      Explore Projects & RFPs
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  </Button>
                </CardFooter>
              </Card>
              
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>Grant Search</CardTitle>
                  <CardDescription>
                    Find external grants that align with your project goals
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Access our extensive database of AI and Web3 grants with a real time search for new grants. Our AI system will analyze the grants, your projects and nonprofits to make synergistic recommendations. Then take it a step further to make team building suggestions as well.
                  </p>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => setActiveSection("grants")} className="w-full">
                    <span className="flex items-center justify-center">
                      Search Grants
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </span>
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>How Our AI Agents Help</CardTitle>
                <CardDescription>
                  AI-powered tools to streamline the grant process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <div className="bg-primary/10 p-1.5 rounded-full mr-2 mt-0.5">
                      <Lightbulb className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-medium">Opportunity Finder:</span> Analyzes your skills and interests to recommend relevant RFPs
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-primary/10 p-1.5 rounded-full mr-2 mt-0.5">
                      <Lightbulb className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-medium">Team Builder:</span> Identifies potential collaborators with complementary skills
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-primary/10 p-1.5 rounded-full mr-2 mt-0.5">
                      <Lightbulb className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-medium">Grant Matcher:</span> Connects your project with relevant funding sources
                    </div>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-primary/10 p-1.5 rounded-full mr-2 mt-0.5">
                      <Lightbulb className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-medium">Proposal Assistant:</span> Helps craft compelling grant applications
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Projects Tab - Integrated from Projects Page */}
          <TabsContent value="projects">
            <div className="mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold">Community Ideas & Development Requests</h1>
                  <p className="text-gray-500 mt-1">
                    From community ideas to funded Web3/AI solutions through grant matching
                  </p>
                </div>
                
                <Button onClick={() => navigate('/grant-flow/submit-rfi')}>
                  <Plus className="mr-2 h-4 w-4" /> Submit Idea
                </Button>
              </div>

              {/* Clear explanation of Ideas vs RFPs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                      💡 Ideas (Community Voting)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-blue-700 mb-3">
                      Submit concepts you'd like to see built. Community votes thumbs up/down to validate worthiness.
                    </p>
                    <ul className="text-xs text-blue-600 space-y-1">
                      <li>• Share problem & potential solution</li>
                      <li>• Get community feedback & votes</li>
                      <li>• Popular ideas become RFPs</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-green-200 bg-green-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-green-800 flex items-center gap-2">
                      🏗️ RFPs (Development Requests)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-green-700 mb-3">
                      Validated concepts seeking development teams. Submit proposals with costs, timelines & experience.
                    </p>
                    <ul className="text-xs text-green-600 space-y-1">
                      <li>• Teams compete with proposals</li>
                      <li>• Include costs & timelines</li>
                      <li>• GrantFlow matches funding sources</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    className="pl-10"
                    placeholder="Search projects..."
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
                    <DropdownMenuItem>Most Members</DropdownMenuItem>
                    <DropdownMenuItem>Most Activity</DropdownMenuItem>
                    <DropdownMenuItem>Highest Funded</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="active">Active Projects</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="all">All Projects</TabsTrigger>
                </TabsList>

                <TabsContent value="active">
                  {projectsLoading ? (
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
                  ) : projectsError ? (
                    <div className="text-center py-8">
                      <p className="text-red-500">Error loading projects. Please try again later.</p>
                    </div>
                  ) : filteredProjects.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg">
                      <h3 className="text-lg font-medium">No active projects found</h3>
                      <p className="text-gray-500 mt-2 mb-6">Create a new project or browse other categories</p>
                      <Button onClick={() => navigate('/projects/create')}>
                        <Plus className="mr-2 h-4 w-4" /> Create Project
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredProjects.map((project: any) => (
                        <Card key={project.id} className="h-full flex flex-col hover:shadow-md transition-shadow">
                          <CardHeader className="pb-4">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">{project.title}</CardTitle>
                              {project.categories && project.categories.length > 0 && (
                                <Badge variant="outline" className="capitalize">{project.categories[0]}</Badge>
                              )}
                            </div>
                            <CardDescription className="text-sm truncate">
                              Created by {project.creator?.username || 'Anonymous'} • {new Date(project.createdAt).toLocaleDateString()}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex-grow">
                            <p className="text-sm line-clamp-3 mb-3">{project.description}</p>
                            
                            <div className="flex flex-col gap-2 mt-4">
                              {project.teamRoles && Array.isArray(project.teamRoles) && (
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Users className="h-4 w-4" />
                                <span>{project.teamRoles.length} Roles Needed</span>
                              </div>
                            )}
                              
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Calendar className="h-4 w-4" />
                                <span>Started: {new Date(project.createdAt).toLocaleDateString()}</span>
                              </div>
                              
                              {project.categories && Array.isArray(project.categories) && project.categories.length > 0 && (
                                <div className="flex items-start gap-2 text-sm text-gray-500">
                                  <Tags className="h-4 w-4 mt-0.5" />
                                  <div className="flex flex-wrap gap-1">
                                    {project.categories.map((category: string, i: number) => (
                                      <Badge key={i} variant="secondary" className="text-xs">{category}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter className="border-t pt-4">
                            <Button 
                              variant="outline" 
                              className="w-full gap-1"
                              onClick={() => navigate(`/projects/${project.id}`)}
                            >
                              View Project <ArrowUpRight className="h-4 w-4" />
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="completed">
                  {filteredProjects.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg">
                      <h3 className="text-lg font-medium">No completed projects found</h3>
                      <p className="text-gray-500 mt-2">Projects appear here when they're marked complete</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Would render completed projects here */}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="all">
                  {filteredProjects.length === 0 ? (
                    <div className="text-center py-12 border rounded-lg">
                      <h3 className="text-lg font-medium">No projects found</h3>
                      <p className="text-gray-500 mt-2 mb-6">Try adjusting your filters or create a new project</p>
                      <Button onClick={() => navigate('/projects/create')}>
                        <Plus className="mr-2 h-4 w-4" /> Create Project
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredProjects.map((project: any) => (
                        <Card key={project.id} className="h-full flex flex-col hover:shadow-md transition-shadow">
                          <CardHeader className="pb-4">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">{project.title}</CardTitle>
                              {project.categories && project.categories.length > 0 && (
                                <Badge variant="outline" className="capitalize">{project.categories[0]}</Badge>
                              )}
                            </div>
                            <CardDescription className="text-sm truncate">
                              Created by {project.creator?.username || 'Anonymous'} • {new Date(project.createdAt).toLocaleDateString()}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="flex-grow">
                            <p className="text-sm line-clamp-3 mb-3">{project.description}</p>
                            
                            <div className="flex flex-col gap-2 mt-4">
                              {project.teamRoles && Array.isArray(project.teamRoles) && (
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Users className="h-4 w-4" />
                                <span>{project.teamRoles.length} Roles Needed</span>
                              </div>
                            )}
                              
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <Calendar className="h-4 w-4" />
                                <span>Started: {new Date(project.createdAt).toLocaleDateString()}</span>
                              </div>
                              
                              {project.categories && Array.isArray(project.categories) && project.categories.length > 0 && (
                                <div className="flex items-start gap-2 text-sm text-gray-500">
                                  <Tags className="h-4 w-4 mt-0.5" />
                                  <div className="flex flex-wrap gap-1">
                                    {project.categories.map((category: string, i: number) => (
                                      <Badge key={i} variant="secondary" className="text-xs">{category}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter className="border-t pt-4">
                            <Button 
                              variant="outline" 
                              className="w-full gap-1"
                              onClick={() => navigate(`/projects/${project.id}`)}
                            >
                              View Project <ArrowUpRight className="h-4 w-4" />
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </TabsContent>

          {/* Grants Tab */}
          <TabsContent value="grants">
            <div className="mb-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-bold">Grant Search</h1>
                  <p className="text-gray-500 mt-1">
                    Find external grants that align with your project goals
                  </p>
                </div>
              </div>

              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Find the Perfect Grant</CardTitle>
                  <CardDescription>
                    Our AI will analyze your project and match it with relevant grant opportunities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-2">Select your project</label>
                      <select className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary">
                        <option>Select a project</option>
                        {filteredProjects.map((project: any) => (
                          <option key={project.id} value={project.id}>{project.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Grant amount</label>
                      <select className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary">
                        <option>Any amount</option>
                        <option>$5,000 - $25,000</option>
                        <option>$25,000 - $100,000</option>
                        <option>$100,000+</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Categories</label>
                      <select className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary">
                        <option>All Categories</option>
                        <option>Web3/Blockchain</option>
                        <option>AI/Machine Learning</option>
                        <option>Privacy/Security</option>
                        <option>Infrastructure</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Target regions</label>
                      <select className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary">
                        <option>Worldwide</option>
                        <option>North America</option>
                        <option>Europe</option>
                        <option>Asia Pacific</option>
                        <option>Africa</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Deadline</label>
                      <select className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary">
                        <option>Any time</option>
                        <option>Next 30 days</option>
                        <option>Next quarter</option>
                        <option>This year</option>
                      </select>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      // Show a success message first
                      toast({
                        title: "Grant Search Activated",
                        description: "Redirecting to grant search page...",
                      });
                      
                      // Then redirect to the grants page with a slight delay
                      setTimeout(() => {
                        navigate("/grants");
                      }, 500);
                    }}
                  >
                    <span className="flex items-center justify-center">
                      Find Matching Grants
                      <FileSearch className="ml-2 h-4 w-4" />
                    </span>
                  </Button>
                </CardFooter>
              </Card>

              <div id="grant-results" className="text-center py-12 border rounded-lg">
                <FileSearch className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium">Start Your Grant Search</h3>
                <p className="text-gray-500 mt-2 mb-6">Complete the form above to find grants matching your criteria</p>
                <p className="text-sm text-blue-500 mt-2">
                  <Link href="/projects/7" className="flex items-center justify-center hover:underline">
                    View example project with active grant matches
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
    </div>
  );
}