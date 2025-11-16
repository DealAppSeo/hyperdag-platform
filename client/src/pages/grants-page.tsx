import { useQuery } from "@tanstack/react-query";
import GrantCard from "@/components/grants/GrantCard";
import { useCallback, useEffect, useRef, useMemo, useState } from "react";
import { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Loader2, Search, ExternalLink, ArrowUp, Users, FileText, UserPlus, CheckCircle, Circle, 
  BrainCircuit, PenLine, MessageSquare, DollarSign, Code, Calendar, ArrowDownAZ, ArrowUpDown } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import MinimalNavbar from "@/components/layout/minimal-navbar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Link } from "wouter";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import ThumbsUpWithPurposeHub from "@/components/common/ThumbsUpWithPurposeHub";

// Define our base grant source type
type GrantSource = {
  id: number;
  name: string;
  website: string;
  description: string;
  categories: string[];
  availableFunds: number | null;
  applicationUrl: string;
  contactEmail: string | null;
  applicationDeadline: string | null;
  isActive: boolean;
};

// Enhanced grant source with quality score and tier
type EnhancedGrantSource = GrantSource & {
  qualityScore: number;
  tier: 'excellent' | 'good' | 'moderate' | 'basic';
};

export default function GrantsPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [filterByMission, setFilterByMission] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGrants, setSelectedGrants] = useState<number[]>([]);
  const [showRfiModal, setShowRfiModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [generatedRfis, setGeneratedRfis] = useState<{id: number, title: string}[]>([]);
  
  // Sorting state
  type SortOption = 'match' | 'funding' | 'deadline' | 'none';
  const [sortOption, setSortOption] = useState<SortOption>('none');
  
  // Store a reference to active timeouts so we can clear them if needed
  const timeoutRefs = useRef<number[]>([]);
  
  // Navigation items for the slide-out menu
  const navItems = [
    { href: "/", label: "Dashboard" },
    { href: "/grant-flow", label: "Projects & RFPs" },
    { href: "/grants", label: "Grant Search" },
    { href: "/grant-ranking", label: "Grant Ranking" },
    { href: "/visualizations", label: "Ethereal Visualization" },
    { href: "/identity", label: "Identity" },
    { href: "/reputation", label: "Reputation" },
    { href: "/ai-assistant", label: "AI Assistant" },
    { href: "/profile", label: "Settings" },
  ];

  // Fetch all grant sources
  const { data: grantSources, isLoading } = useQuery<{ success: boolean; data: GrantSource[] }>({ 
    queryKey: ["/api/grant-sources"],
  });
  
  // Fetch RFIs to track which grants already have RFIs
  const { data: rfis } = useQuery<any[]>({ 
    queryKey: ["/api/grant-flow/rfis"],
  });
  
  // Update generated RFIs when rfis data changes
  useEffect(() => {
    if (rfis) {
      setGeneratedRfis(rfis.map(rfi => ({ id: rfi.id, title: rfi.title })));
    }
  }, [rfis]);

  // Clear any existing timeouts to prevent unexpected behavior
  const clearAllTimeouts = () => {
    timeoutRefs.current.forEach(id => window.clearTimeout(id));
    timeoutRefs.current = [];
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    
    // Always clear previous selections
    setSelectedGrants([]);
    
    // Important: Clear any existing timeouts to prevent race conditions
    clearAllTimeouts();
    
    // Show searching spinner briefly for visual feedback
    setIsSearching(true);
    
    // Set search as performed immediately - no artificial delays
    setSearchPerformed(true);
    
    // Set visible count to show all results immediately
    setVisibleCount(1000); // Large number to show all grants
    
    // Hide spinner after minimal delay for UI feedback
    setTimeout(() => {
      setIsSearching(false);
    }, 200);
  };

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  // Extract all unique categories from grant sources
  const allCategories = useMemo(() => {
    if (!grantSources?.data) return [];
    
    // Get all categories from all grant sources
    const allCats = grantSources.data.flatMap(grant => grant.categories);
    
    // Deduplicate and sort the categories
    const uniqueCategories: Record<string, boolean> = {};
    allCats.forEach(cat => {
      uniqueCategories[cat] = true;
    });
    
    // Convert to array, remove 'Gender Equality', add 'Christian' if not present
    return Object.keys(uniqueCategories)
      .filter(cat => cat !== 'Gender Equality')
      .concat(['Christian']) // Add 'Christian' category
      .filter((value, index, self) => self.indexOf(value) === index) // Keep unique values
      .sort();
  }, [grantSources?.data]);

  // Helper function to check if a grant aligns with HyperDAG's mission 
  const isMissionAligned = (grant: GrantSource): boolean => {
    const missionKeywords = [
      'underserved', 'marginalized', 'disenfranchised', 'vulnerable', 
      'disadvantaged', 'inclusion', 'accessibility', 'equity', 'opportunity', 
      'equality', 'developing regions', 'global south', 'rural', 'poverty', 
      'underrepresented', 'community', 'sustainable', 'social impact', 
      'education', 'healthcare', 'financial inclusion', 'identity', 'privacy'
    ];
    
    // Check categories for social impact terms
    const hasSocialImpactCategory = grant.categories.some(cat => 
      ['Social Impact', 'Financial Inclusion', 'Education', 'Healthcare',
       'Privacy', 'Identity', 'Developing Regions', 'Digital Inclusion',
       'Accessibility'].includes(cat));
    
    // Check description for mission-aligned keywords
    const descriptionMatch = missionKeywords.some(keyword =>
      grant.description.toLowerCase().includes(keyword.toLowerCase()));
    
    return hasSocialImpactCategory || descriptionMatch;
  };

  // Capture the search parameters at the moment when search was performed
  const [activeSearchTerm, setActiveSearchTerm] = useState("");
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [activeMissionFilter, setActiveMissionFilter] = useState(false);
  
  // Update the active search parameters when Search button is clicked
  useEffect(() => {
    if (searchPerformed) {
      setActiveSearchTerm(searchTerm);
      setActiveCategories([...selectedCategories]);
      setActiveMissionFilter(filterByMission);
    }
  }, [searchPerformed, searchTerm, selectedCategories, filterByMission]);
  
  // Process and filter grants based on search criteria
  const processedGrants = useMemo<EnhancedGrantSource[]>(() => {
    if (!searchPerformed || !grantSources?.data) {
      return []; // Return empty array if no search performed yet (enforces clean empty state)
    }
    
    // First, process and filter the grants
    let filtered = grantSources.data
      // Process the grants to update their categories - remove 'Gender Equality' and ensure 'Christian' is visible
      .map(grant => ({
        ...grant,
        categories: grant.categories.filter(cat => cat !== 'Gender Equality'),
        // Calculate a quality score for distribution (using mission alignment as a proxy)
        qualityScore: isMissionAligned(grant) ? 
          (grant.availableFunds ? 0.8 + (grant.availableFunds / 1000000) : 0.7) : 
          (grant.availableFunds ? 0.4 + (grant.availableFunds / 2000000) : 0.3),
        tier: 'basic' as 'excellent' | 'good' | 'moderate' | 'basic'
      }))
      // Now filter the processed grants - IMPORTANT: using the active search parameters, not the current state
      .filter(grant => {
        // Filter by search term (name, description, categories)
        const searchMatch = activeSearchTerm === "" || 
          grant.name.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
          grant.description.toLowerCase().includes(activeSearchTerm.toLowerCase()) ||
          grant.categories.some(cat => cat.toLowerCase().includes(activeSearchTerm.toLowerCase()));
        
        // Filter by selected categories
        const categoryMatch = activeCategories.length === 0 || 
          activeCategories.some(cat => grant.categories.includes(cat));

        // Filter by HyperDAG mission alignment
        const missionMatch = !activeMissionFilter || isMissionAligned(grant);
        
        return searchMatch && categoryMatch && missionMatch;
      });
    
    // Apply sorting based on selected option
    if (sortOption === 'match') {
      // Sort by match percentage (qualityScore) - highest first
      filtered = filtered.sort((a, b) => b.qualityScore - a.qualityScore);
    } 
    else if (sortOption === 'funding') {
      // Sort by funding amount - highest first
      filtered = filtered.sort((a, b) => {
        // Handle null values by treating them as 0
        const aFunding = a.availableFunds || 0;
        const bFunding = b.availableFunds || 0;
        return bFunding - aFunding;
      });
    }
    else if (sortOption === 'deadline') {
      // Sort by application deadline - soonest first (excluding null dates)
      filtered = filtered.sort((a, b) => {
        // If both have deadlines, compare them
        if (a.applicationDeadline && b.applicationDeadline) {
          return new Date(a.applicationDeadline).getTime() - new Date(b.applicationDeadline).getTime();
        }
        // If only a has a deadline, it comes first
        if (a.applicationDeadline) return -1;
        // If only b has a deadline, it comes first
        if (b.applicationDeadline) return 1;
        // If neither has a deadline, maintain original order based on quality
        return b.qualityScore - a.qualityScore;
      });
    }
    else {
      // Default sort by quality score (match %)
      filtered = filtered.sort((a, b) => b.qualityScore - a.qualityScore);
    }
    
    // Add tier information based on sorted results
    return filtered.map((grant, index) => ({
      ...grant,
      tier: index < 3 ? 'excellent' : 
            index < 6 ? 'good' : 
            index < 9 ? 'moderate' : 'basic'
    }));
  }, [searchPerformed, grantSources?.data, activeSearchTerm, activeCategories, activeMissionFilter, sortOption]);
  
  // Staggered display of grants - revealing them gradually
  const [visibleCount, setVisibleCount] = useState(0);
  const filteredGrants = useMemo(() => {
    // Only show as many grants as the current visibleCount allows
    return processedGrants.slice(0, visibleCount);
  }, [processedGrants, visibleCount]);
  
  // Reset and animate the grants when search is performed
  useEffect(() => {
    // Clean up any existing timeouts
    clearAllTimeouts();
    
    // Always show all grants immediately when search completes
    if (searchPerformed && processedGrants.length > 0) {
      // Show all grants immediately
      setVisibleCount(processedGrants.length);
    }
    
    // Clean up timeouts when component unmounts
    return () => {
      clearAllTimeouts();
    };
  }, [searchPerformed, processedGrants.length]);

  // Handler for when an RFI is created from a grant
  const handleRfiCreated = useCallback((rfiId: number) => {
    // Add to the list of generated RFIs
    setGeneratedRfis(prev => [...prev, { id: rfiId, title: `RFI #${rfiId}` }]);
    
    toast({
      title: "RFI Created",
      description: "Your RFI has been created successfully."
    });
    
    // Refresh the RFIs data
    queryClient.invalidateQueries({ queryKey: ["/api/grant-flow/rfis"] });
  }, [toast]);
  
  // Format currency for display
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Funding amount not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Minimal Navigation Bar */}
      <MinimalNavbar 
        title="Grant Search" 
        showBack={false}
        showMenu={true}
        onMenuToggle={() => setNavOpen(true)}
        className="z-50 sticky top-0"
      />
      
      {/* Slide-out Navigation Menu */}
      <Sheet open={navOpen} onOpenChange={setNavOpen}>
        <SheetContent side="left" className="w-[280px] sm:w-[350px]">
          <div className="py-6">
            <h2 className="text-lg font-semibold mb-6 px-4">HyperDAG Navigation</h2>
            <nav className="space-y-1">
              {navItems.map(item => (
                <Link 
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-md ${item.href === '/grants' ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
                  onClick={() => setNavOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </SheetContent>
      </Sheet>
      
      <div className="w-full max-w-7xl mx-auto px-4 py-8 flex-1">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Grant Search</h1>
              <p className="text-muted-foreground mt-2">
                Discover funding opportunities that align with HyperDAG's mission of helping underserved communities
              </p>
            </div>
            <div className="mt-4 md:mt-0">
              <Button variant="outline" asChild>
                <Link href="/grant-ranking">
                  <ArrowUp className="h-4 w-4 mr-2" />
                  Ranked Grants & Auto-RFI
                </Link>
              </Button>
            </div>
          </div>
          
          {/* How It Works Section */}
          <Card className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-blue-600" />
                How Grant Search Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full w-6 h-6 flex items-center justify-center font-semibold text-xs flex-shrink-0 mt-0.5">1</div>
                  <div>
                    <h4 className="font-medium mb-1">Search & Filter</h4>
                    <p className="text-muted-foreground">Use keywords and categories to find grants matching your project needs. Filter by mission alignment for social impact focus.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full w-6 h-6 flex items-center justify-center font-semibold text-xs flex-shrink-0 mt-0.5">2</div>
                  <div>
                    <h4 className="font-medium mb-1">Show Support</h4>
                    <p className="text-muted-foreground">Click "I Believe In This" to show support for grants. Add promising opportunities to your Purpose Hub for tracking.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full w-6 h-6 flex items-center justify-center font-semibold text-xs flex-shrink-0 mt-0.5">3</div>
                  <div>
                    <h4 className="font-medium mb-1">Take Action</h4>
                    <p className="text-muted-foreground">Convert grants to RFIs, find team members, or apply directly. Use sorting to prioritize by funding amount or deadlines.</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Section */}
        <div className="grid gap-6 mb-8 grid-cols-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Search and Filter</CardTitle>
              <CardDescription>
                Find grants that match your project's needs and align with HyperDAG's ethos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex flex-col space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search grants..."
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button type="submit">Search</Button>
                </div>
                
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <input 
                      type="checkbox" 
                      id="mission-aligned" 
                      checked={filterByMission}
                      onChange={() => setFilterByMission(!filterByMission)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="mission-aligned" className="text-sm font-medium">
                      Show only grants aligned with HyperDAG's mission
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Categories:</h3>
                  <div className="flex flex-wrap gap-2">
                    {allCategories.map((category) => (
                      <Badge 
                        key={category} 
                        variant={selectedCategories.includes(category) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleCategory(category)}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold">Search Results</h2>
            
            {searchPerformed && filteredGrants.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-1 h-8">
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Sort by:</span>
                    <span>
                      {sortOption === 'match' && 'Match %'}
                      {sortOption === 'funding' && 'Funding'}
                      {sortOption === 'deadline' && 'Deadline'}
                      {sortOption === 'none' && 'Default'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[180px]">
                  <DropdownMenuItem 
                    onClick={() => setSortOption('match')}
                    className={sortOption === 'match' ? 'bg-muted font-medium' : ''}
                  >
                    <ArrowDownAZ className="mr-2 h-4 w-4" />
                    <span>By Match %</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortOption('funding')}
                    className={sortOption === 'funding' ? 'bg-muted font-medium' : ''}
                  >
                    <DollarSign className="mr-2 h-4 w-4" />
                    <span>By Funding Amount</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortOption('deadline')}
                    className={sortOption === 'deadline' ? 'bg-muted font-medium' : ''}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>By Deadline</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortOption('none')}
                    className={sortOption === 'none' ? 'bg-muted font-medium' : ''}
                  >
                    <ArrowUpDown className="mr-2 h-4 w-4" />
                    <span>Default</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          
          {selectedGrants.length > 0 && (
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setShowTeamModal(true)}
              >
                <Users className="h-4 w-4 mr-2" />
                Find Team
              </Button>
              <Button 
                onClick={() => setShowRfiModal(true)}
              >
                <FileText className="h-4 w-4 mr-2" />
                Match to RFIs/RFPs
              </Button>
            </div>
          )}
        </div>
        
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            <div className="col-span-full flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading grants...</span>
            </div>
          ) : isSearching ? (
            <div className="col-span-full flex flex-col justify-center items-center py-16">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <h3 className="text-lg font-medium mb-2">Searching for the most relevant grants</h3>
              <p className="text-muted-foreground">Finding opportunities that match your criteria...</p>
            </div>
          ) : !searchPerformed && !filteredGrants.length ? (
            <div className="col-span-full p-12 text-center bg-muted/30 rounded-lg border border-dashed">
              <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Search for Grants</h3>
              <p className="text-muted-foreground max-w-md mx-auto">Use the search and filters above to find grants that match your project goals and values.</p>
            </div>
          ) : filteredGrants.length > 0 ? (
            filteredGrants.map((grant, index) => {
              // Determine if this is one of the prioritized grants (first 3)
              const isPrioritized = index < 3;
              
              // Add animation delay classes for staggered appearance
              return (
                <div 
                  key={grant.id}
                  className="transition-all duration-500 transform opacity-0 animate-fadeIn" 
                  style={{
                    animationDelay: `${index * 300}ms`,
                    animationFillMode: 'forwards'
                  }}
                >
                  <GrantCard 
                    grant={{
                      id: grant.id,
                      name: grant.name,
                      description: grant.description,
                      availableFunds: grant.availableFunds,
                      applicationDeadline: grant.applicationDeadline,
                      website: grant.website,
                      applicationUrl: grant.applicationUrl,
                      contactEmail: grant.contactEmail || undefined, // Convert null to undefined
                      categories: grant.categories,
                      eligibilityCriteria: []
                    }}
                    isPrioritized={isPrioritized}
                    isSelected={selectedGrants.includes(grant.id)}
                    onSelectionChange={(selected) => {
                      if (selected) {
                        setSelectedGrants([...selectedGrants, grant.id]);
                      } else {
                        setSelectedGrants(selectedGrants.filter(id => id !== grant.id));
                      }
                    }}
                    onRfiCreated={handleRfiCreated}
                    convertedRfis={generatedRfis}
                  />
                </div>
              );
            })
          ) : (
            <div className="col-span-full p-8 text-center">
              <p className="text-muted-foreground">No matching grant sources found. Try adjusting your filters.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* RFI/RFP Matching Modal */}
      <Dialog open={showRfiModal} onOpenChange={setShowRfiModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Match to RFIs/RFPs</DialogTitle>
            <DialogDescription>
              Find existing requests or create a new one for your selected grants.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="existing">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="existing">Existing RFIs/RFPs</TabsTrigger>
              <TabsTrigger value="create">Create New</TabsTrigger>
            </TabsList>
            
            <TabsContent value="existing" className="space-y-4 pt-4">
              <div className="max-h-[300px] overflow-y-auto space-y-3">
                {Array.from({length: 5}).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <div className="flex items-center p-4">
                      <div className="flex-1">
                        <h4 className="font-medium">RFI: Decentralized Identity Solution</h4>
                        <p className="text-sm text-muted-foreground">Seeking a privacy-preserving solution for identity management...</p>
                        <div className="flex items-center mt-2">
                          <Badge variant="outline" className="mr-1">Identity</Badge>
                          <Badge variant="outline" className="mr-1">Privacy</Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">Match</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="create" className="space-y-4 pt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="rfi-title">Title</Label>
                  <Input id="rfi-title" placeholder="Enter a clear and descriptive title" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rfi-description">Description</Label>
                  <Textarea id="rfi-description" placeholder="Describe what you're looking for..." />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rfi-category">Category</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="identity">Identity</SelectItem>
                      <SelectItem value="privacy">Privacy</SelectItem>
                      <SelectItem value="financial">Financial Inclusion</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="rfi-funding">Estimated Funding Needed</Label>
                  <Input id="rfi-funding" placeholder="e.g. $50,000" />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRfiModal(false)}>Cancel</Button>
                <Button>Create RFI</Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
      
      {/* Find Team Modal */}
      <Dialog open={showTeamModal} onOpenChange={setShowTeamModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Find Team Members</DialogTitle>
            <DialogDescription>
              Discover potential collaborators for your project based on skills and reputation.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="ai-match">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ai-match">AI Matching</TabsTrigger>
              <TabsTrigger value="manual">Browse</TabsTrigger>
            </TabsList>
            
            <TabsContent value="ai-match" className="pt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Skills Needed</Label>
                  <Button variant="outline" size="sm">Detect from Grants</Button>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {['Smart Contracts', 'UI/UX Design', 'Backend', 'Privacy Tech'].map(skill => (
                    <Badge key={skill} variant="secondary" className="px-3 py-1">
                      {skill} <span className="ml-1 cursor-pointer">×</span>
                    </Badge>
                  ))}
                </div>
                
                <Button className="w-full">
                  <BrainCircuit className="mr-2 h-4 w-4" />
                  Find Team with AI
                </Button>
                
                <div className="border rounded-lg p-2 mt-4">
                  <div className="text-xs text-muted-foreground mb-2">Recommended Team</div>
                  <div className="space-y-3">
                    {[
                      { name: 'Alex Chen', role: 'Smart Contract Developer', rep: 92 },
                      { name: 'Maya Patel', role: 'UI/UX Designer', rep: 88 },
                      { name: 'Raj Kumar', role: 'Backend Developer', rep: 85 }
                    ].map(member => (
                      <div key={member.name} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback>{member.name[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium">{member.name}</div>
                            <div className="text-xs text-muted-foreground">{member.role}</div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs mr-2">Rep: {member.rep}</span>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="manual" className="pt-4">
              <Input placeholder="Search for developers, designers, and other professionals..." className="mb-4" />
              
              <div className="max-h-[300px] overflow-y-auto space-y-3">
                {[
                  { name: 'Sarah Johnson', skills: ['Smart Contracts', 'Solidity', 'Zero-Knowledge Proofs'], rep: 95 },
                  { name: 'David Lee', skills: ['Frontend', 'React', 'UI/UX'], rep: 89 },
                  { name: 'Fatima Ahmed', skills: ['Backend', 'Node.js', 'API Design'], rep: 87 },
                  { name: 'Carlos Mendez', skills: ['GraphQL', 'Database Design', 'System Architecture'], rep: 91 },
                  { name: 'Nina Chen', skills: ['Web3', 'DeFi', 'Token Economics'], rep: 88 }
                ].map(profile => (
                  <div key={profile.name} className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback>{profile.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{profile.name}</div>
                        <div className="flex mt-1">
                          {profile.skills.slice(0, 2).map(skill => (
                            <Badge key={skill} variant="outline" className="mr-1 text-xs">{skill}</Badge>
                          ))}
                          {profile.skills.length > 2 && (
                            <Badge variant="outline" className="text-xs">+{profile.skills.length - 2}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium">
                        Rep: {profile.rep}
                      </div>
                      <Button size="sm">Invite</Button>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}