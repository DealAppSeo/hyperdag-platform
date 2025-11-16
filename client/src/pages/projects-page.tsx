import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Layout } from '@/components/layout/layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Filter, SlidersHorizontal, Users, Calendar, Tags, ArrowUpRight } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

export default function ProjectsPage() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState('all');
  const [activeTab, setActiveTab] = React.useState('active');
  
  // Fetch projects data
  const { data: projects = [], isLoading: projectsLoading, error: projectsError } = useQuery({
    queryKey: ['/api/projects'],
  });
  
  // Filter function
  const filteredProjects = React.useMemo(() => {
    // Ensure projects is always an array and handle potential server errors
    if (projectsError) {
      return [];
    }
    
    // Make sure we're working with an array
    const items = Array.isArray(projects) ? projects : [];
    
    return items.filter((project: any) => {
      // Handle potential null/undefined properties safely
      const projectTitle = project?.title || '';
      const projectDescription = project?.description || '';
      
      const matchesSearch = searchQuery === '' || 
        projectTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        projectDescription.toLowerCase().includes(searchQuery.toLowerCase());
        
      const matchesCategory = filterCategory === 'all' || 
        (project.categories && Array.isArray(project.categories) && 
         project.categories.some((cat: string) => cat.toLowerCase() === filterCategory.toLowerCase()));
      
      // Default all projects to active since we don't have a status field
      const matchesStatus = activeTab === 'all' ? true : 
        (activeTab === 'active' ? true : false);
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [projects, searchQuery, filterCategory, activeTab, projectsError]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-gray-500 mt-1">
              Browse and manage projects within the HyperDAG ecosystem
            </p>
          </div>
          
          <Button onClick={() => navigate('/projects/create')}>
            <Plus className="mr-2 h-4 w-4" /> Create Project
          </Button>
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
          <TabsList className="w-full flex flex-wrap mb-6">
            <TabsTrigger value="active" className="flex-1 text-sm sm:text-base py-2 px-2 sm:px-4">Active</TabsTrigger>
            <TabsTrigger value="completed" className="flex-1 text-sm sm:text-base py-2 px-2 sm:px-4">Completed</TabsTrigger>
            <TabsTrigger value="all" className="flex-1 text-sm sm:text-base py-2 px-2 sm:px-4">All Projects</TabsTrigger>
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
                {/* Would render all projects here */}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}