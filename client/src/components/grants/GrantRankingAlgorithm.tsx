import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';

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

type RankedGrant = GrantSource & {
  score: number;
  deadlineDaysLeft: number | null;
  reasons: string[];
};

type RfiData = {
  title: string;
  description: string;
  category: string;
  problem: string;
  impact: string;
  submitterId?: number;
};

export function useGrantRanking() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [rankedGrants, setRankedGrants] = useState<RankedGrant[]>([]);
  const [isGeneratingRfi, setIsGeneratingRfi] = useState(false);
  const [generatedRfis, setGeneratedRfis] = useState<{id: number, title: string}[]>([]);

  // Fetch all grant sources
  const { data: grantSources, isLoading, refetch } = useQuery<{ success: boolean; data: GrantSource[] }>({ 
    queryKey: ["/api/grant-sources"],
  });

  // Calculate days left until deadline
  const calculateDaysLeft = (deadline: string | null): number | null => {
    if (!deadline) return null;
    
    const deadlineDate = new Date(deadline);
    const today = new Date();
    
    // Clear time portion for accurate day calculation
    deadlineDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };

  // Score calculation algorithm for ranking grants
  const calculateGrantScore = (grant: GrantSource): { score: number; reasons: string[] } => {
    let score = 0;
    const reasons: string[] = [];
    
    // Deadline factor (higher score for closer deadlines but not expired)
    const daysLeft = calculateDaysLeft(grant.applicationDeadline);
    if (daysLeft !== null) {
      if (daysLeft < 0) {
        // Past deadline
        score -= 100; // Heavily penalize expired grants
        reasons.push("Expired deadline");
      } else if (daysLeft <= 7) {
        // Urgent - deadline within a week
        score += 30;
        reasons.push("Urgent: deadline within 7 days");
      } else if (daysLeft <= 30) {
        // Near deadline - within a month
        score += 20;
        reasons.push("Near deadline: within 30 days");
      } else if (daysLeft <= 90) {
        // Upcoming - within 3 months
        score += 10;
        reasons.push("Upcoming deadline: within 90 days");
      }
    }
    
    // Funding amount factor
    if (grant.availableFunds) {
      if (grant.availableFunds >= 100000) {
        score += 25;
        reasons.push("Large funding amount available");
      } else if (grant.availableFunds >= 50000) {
        score += 15;
        reasons.push("Significant funding amount available");
      } else if (grant.availableFunds >= 10000) {
        score += 10;
        reasons.push("Good funding amount available");
      }
    }
    
    // Categories alignment with HyperDAG's ethos
    const ethosCategories = [
      'Social Impact', 'Financial Inclusion', 'Education', 'Healthcare',
      'Privacy', 'Identity', 'Developing Regions', 'Digital Inclusion',
      'Accessibility', 'Christian', 'AI-Web3', 'Web3', 'DAO', 'DeSci'
    ];
    
    const matchingCategories = grant.categories.filter(category =>
      ethosCategories.includes(category)
    );
    
    if (matchingCategories.length > 0) {
      score += matchingCategories.length * 5;
      reasons.push(`Aligned with ${matchingCategories.length} HyperDAG priority categories`);
    }
    
    // Description contains mission-aligned terms
    const missionKeywords = [
      'underserved', 'marginalized', 'disenfranchised', 'vulnerable', 
      'disadvantaged', 'inclusion', 'accessibility', 'equity', 'opportunity', 
      'equality', 'developing regions', 'global south', 'rural', 'poverty', 
      'underrepresented', 'community', 'sustainable', 'social impact', 
      'education', 'healthcare', 'financial inclusion', 'identity', 'privacy'
    ];
    
    const descriptionLower = grant.description.toLowerCase();
    const matchingKeywords = missionKeywords.filter(keyword => 
      descriptionLower.includes(keyword.toLowerCase())
    );
    
    if (matchingKeywords.length > 0) {
      score += matchingKeywords.length * 2;
      reasons.push(`Contains ${matchingKeywords.length} mission-aligned keywords`);
    }
    
    // Application process completeness
    if (grant.applicationUrl && grant.contactEmail) {
      score += 10;
      reasons.push("Complete application information");
    } else if (grant.applicationUrl) {
      score += 5;
      reasons.push("Application URL available");
    }
    
    return { score, reasons };
  };

  // Rank the grants based on the scoring algorithm
  useEffect(() => {
    if (grantSources?.data) {
      const ranked = grantSources.data
        // Filter out inactive grants
        .filter(grant => grant.isActive)
        // Calculate score and add reasons for each grant
        .map(grant => {
          const { score, reasons } = calculateGrantScore(grant);
          return {
            ...grant,
            score,
            reasons,
            deadlineDaysLeft: calculateDaysLeft(grant.applicationDeadline),
          };
        })
        // Sort by score (descending) and then by deadline (ascending)
        .sort((a, b) => {
          // First by score (higher is better)
          if (b.score !== a.score) return b.score - a.score;
          
          // Then by deadline (sooner is better, but null deadlines go last)
          if (a.deadlineDaysLeft === null && b.deadlineDaysLeft === null) return 0;
          if (a.deadlineDaysLeft === null) return 1;
          if (b.deadlineDaysLeft === null) return -1;
          return a.deadlineDaysLeft - b.deadlineDaysLeft;
        });
      
      setRankedGrants(ranked);
    }
  }, [grantSources?.data]);

  // State for the Similar RFI Modal
  const [isSimilarRfiModalOpen, setIsSimilarRfiModalOpen] = useState(false);
  const [similarRfis, setSimilarRfis] = useState<any[]>([]);
  const [currentRfiData, setCurrentRfiData] = useState<RfiData | null>(null);
  const [currentGrant, setCurrentGrant] = useState<RankedGrant | null>(null);

  // Generate RFI for a selected grant
  const generateRfi = async (grant: RankedGrant) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to create RFIs",
        variant: "destructive"
      });
      return;
    }

    try {
      // Generate RFI content based on the grant
      const rfiData: RfiData = {
        title: `${grant.name} Funding Opportunity`,
        category: grant.categories?.length > 0 ? grant.categories[0] : "Web3",
        description: `Exploring the funding opportunity from ${grant.name} with potential funding of ${grant.availableFunds ? `$${grant.availableFunds.toLocaleString()}` : 'an unspecified amount'}.${ grant.applicationDeadline ? ` Application deadline: ${format(new Date(grant.applicationDeadline), 'PPP')}.` : '' }\n\nGrant Description: ${grant.description}`,
        problem: `This RFI aims to identify how HyperDAG can leverage this grant opportunity to advance our mission of helping underserved communities through Web3 and AI technologies. We need to determine what specific proposal would best align with both our capabilities and the grant requirements.`,
        impact: `Successfully securing this grant would provide resources to develop solutions that empower marginalized communities through decentralized technology. This would advance HyperDAG's mission of creating opportunities for the "last, lost, and least" while building our reputation as an effective grant recipient in the ${grant.categories?.join(', ')} space.`,
        submitterId: user.id
      };

      setIsGeneratingRfi(true);
      
      // First, check for similar RFIs
      const checkResponse = await apiRequest("POST", "/api/grant-flow/rfis/check-similar", { 
        title: rfiData.title,
        grantSourceId: grant.id
      });
      
      const checkResult = await checkResponse.json();
      
      if (checkResponse.ok && checkResult.hasSimilar && checkResult.similarRfis.length > 0) {
        // Store the current RFI data and grant for later use
        setCurrentRfiData(rfiData);
        setCurrentGrant(grant);
        setSimilarRfis(checkResult.similarRfis);
        setIsSimilarRfiModalOpen(true);
        setIsGeneratingRfi(false);
        return null;
      }
      
      // If no similar RFIs, proceed with creation
      return await submitRfiDirectly(rfiData, grant);
    } catch (error) {
      console.error("Error creating RFI:", error);
      toast({
        title: "Error Creating RFI",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
      setIsGeneratingRfi(false);
      return null;
    }
  };
  
  // Submit RFI directly without checking for similar RFIs
  const submitRfiDirectly = async (rfiData: RfiData, grant: RankedGrant) => {
    try {
      // First, get CSRF token
      const csrfResponse = await fetch('/api/csrf-token');
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrfToken;
      
      // Send the RFI data to the server with CSRF token
      const response = await apiRequest("POST", "/api/grant-flow/rfis", rfiData, {
        headers: {
          'CSRF-Token': csrfToken
        }
      });
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "RFI Created Successfully",
          description: `Your RFI for ${grant.name} has been created.`,
        });
        
        // Add to the list of generated RFIs
        setGeneratedRfis(prev => [...prev, { id: result.id, title: result.title }]);
        
        // Refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/grant-flow/rfis"] });
        
        return result;
      } else {
        throw new Error(result.message || "Failed to create RFI");
      }
    } catch (error) {
      console.error("Error submitting RFI:", error);
      toast({
        title: "Error Creating RFI",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGeneratingRfi(false);
    }
  };
  
  // Handle joining an existing RFI
  const handleJoinExisting = async (rfiId: number) => {
    if (!currentGrant) return;
    
    setIsSimilarRfiModalOpen(false);
    
    toast({
      title: "Joining Existing RFI",
      description: `You have chosen to join an existing RFI.`,
    });
    
    // Here we would add the user as a collaborator to the existing RFI
    // This functionality would need to be implemented on the backend
    // For now, we'll just close the modal
  };
  
  // Handle submitting a new RFI anyway with potential invitations
  const handleSubmitAnyway = async (newTitle: string, invitations: any[]) => {
    if (!currentRfiData || !currentGrant) return;
    
    setIsSimilarRfiModalOpen(false);
    setIsGeneratingRfi(true);
    
    try {
      // First, get CSRF token
      const csrfResponse = await fetch('/api/csrf-token');
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrfToken;
      
      // Create a new RFI with the updated title and invitations
      const updatedRfiData = { ...currentRfiData, title: newTitle };
      
      // Send the RFI data with invitations to the server
      const response = await apiRequest("POST", "/api/grant-flow/rfis", {
        ...updatedRfiData,
        invitations
      }, {
        headers: {
          'CSRF-Token': csrfToken
        }
      });
      
      const result = await response.json();
      
      if (response.ok) {
        toast({
          title: "RFI Created Successfully",
          description: `Your RFI for ${currentGrant.name} has been created with ${invitations.length} invitations.`,
        });
        
        // Add to the list of generated RFIs
        setGeneratedRfis(prev => [...prev, { id: result.id, title: result.title }]);
        
        // Refresh data
        queryClient.invalidateQueries({ queryKey: ["/api/grant-flow/rfis"] });
      } else {
        throw new Error(result.message || "Failed to create RFI");
      }
    } catch (error) {
      console.error("Error creating RFI with invitations:", error);
      toast({
        title: "Error Creating RFI",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingRfi(false);
    }
  };

  // Generate RFIs for the top three opportunities
  const generateTopRfis = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to create RFIs",
        variant: "destructive"
      });
      return;
    }

    if (rankedGrants.length === 0) {
      toast({
        title: "No Grants Available",
        description: "There are no ranked grants to generate RFIs from",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingRfi(true);
    const results = [];
    const topGrants = rankedGrants.slice(0, 3);

    try {
      // Process each top grant sequentially
      for (const grant of topGrants) {
        const result = await generateRfi(grant);
        if (result) results.push(result);
      }

      if (results.length > 0) {
        toast({
          title: "RFIs Created Successfully",
          description: `Created ${results.length} RFIs for top grant opportunities.`,
        });
      } else {
        toast({
          title: "No RFIs Created",
          description: "Failed to create any RFIs. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error creating multiple RFIs:", error);
      toast({
        title: "Error Creating RFIs",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingRfi(false);
    }

    return results;
  };

  return {
    rankedGrants,
    isLoading,
    isGeneratingRfi,
    generatedRfis,
    generateRfi,
    generateTopRfis,
    refetchGrants: refetch,
    // Add modal state and handlers for similar RFI functionality
    isSimilarRfiModalOpen,
    setIsSimilarRfiModalOpen,
    similarRfis,
    handleJoinExisting,
    handleSubmitAnyway,
    currentRfiData,
    currentGrant
  };
}
