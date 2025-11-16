import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ZkpCredentialCard } from "@/components/reputation/ZkpCredentialCard";
import { ProofStatusCard } from "@/components/reputation/ProofStatus";
import { GenerateProofForm } from "@/components/reputation/GenerateProofForm";
import { ReputationBreakdown } from "@/components/reputation/ReputationBreakdown";
import { ReputationRecommendations } from "@/components/reputation/ReputationRecommendations";
import { PersonaReputationMetrics } from "@/components/reputation/PersonaReputationMetrics";
import { ReputationVisualizer } from "@/components/reputation/ReputationVisualizer";
import { ReputationCredentialDashboard } from "@/components/reputation/ReputationCredentialDashboard";
import { Shield, Lock, Award, Eye, ChartPie, Badge as BadgeIcon } from "lucide-react";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout/layout";

// Define type interfaces for our data
interface ReputationProfile {
  id: number;
  reputationScore: number;
  lastActivity?: string;
  [key: string]: any;
}

interface Credential {
  id: number;
  type: string;
  name: string;
  issuer?: string;
  issuedDate?: string;
  credential: string;
  isPublic: boolean;
  [key: string]: any;
}

interface Proof {
  id: string;
  type: string;
  status: 'pending' | 'verified' | 'invalid' | 'expired';
  createdAt: string;
  expiresAt?: string;
  publicInputs: {
    minScore?: number;
    maxScore?: number;
    attributes?: string[];
    [key: string]: any;
  };
  [key: string]: any;
}

interface ReputationActivity {
  type: string;
  points: number;
  count: number;
  description: string;
}

type TabValue = 'overview' | 'credentials' | 'proofs' | 'generate' | 'dashboard';

export default function ReputationPage() {
  const [activeTab, setActiveTab] = useState<TabValue>('overview');
  
  // Fetch user reputation profile
  const { data: profileData, isLoading: profileLoading } = useQuery<ReputationProfile>({
    queryKey: ['/api/reputation/profile'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Fetch user credentials
  const { data: credentials, isLoading: credentialsLoading } = useQuery<Credential[]>({
    queryKey: ['/api/reputation/credentials'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Fetch user ZK proofs
  const { data: proofs, isLoading: proofsLoading } = useQuery<Proof[]>({
    queryKey: ['/api/reputation/zkp/proofs'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Fetch reputation activities
  const { data: activities, isLoading: activitiesLoading } = useQuery<ReputationActivity[]>({
    queryKey: ['/api/reputation/activities'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const { toast } = useToast();

  // Create proof mutation
  const createProofMutation = useMutation({
    mutationFn: async ({ credentialId, attributes }: { credentialId: string, attributes: string[] }) => {
      const response = await apiRequest('POST', '/api/reputation/zkp/credential-proof', {
        userId: profileData?.id,
        credentialId,
        attributesToDisclose: attributes
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reputation/zkp/proofs'] });
      toast({
        title: "Proof Created",
        description: "Your credential proof has been created successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Proof Creation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Verify proof mutation
  const verifyProofMutation = useMutation({
    mutationFn: async (proofId: string) => {
      const response = await apiRequest('POST', '/api/reputation/zkp/verify/credential-proof', {
        proofId
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reputation/zkp/proofs'] });
      toast({
        title: "Proof Verified",
        description: "The proof has been verified successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleCreateProof = (credentialId: string, attributes: string[]) => {
    createProofMutation.mutate({ credentialId, attributes });
  };

  const handleVerifyProof = async (proofId: string) => {
    verifyProofMutation.mutate(proofId);
  };

  const handleProofGenerated = (proof: any) => {
    queryClient.invalidateQueries({ queryKey: ['/api/reputation/zkp/proofs'] });
    setActiveTab('proofs');
  };

  // Format breakdown data for ReputationVisualizer
  const formatBreakdownData = () => {
    // Safe defaults if activities are missing, null, or not an array
    if (!activities || !Array.isArray(activities) || activities.length === 0) {
      return [
        { category: "Platform Engagement", value: 25, color: "#4C1D95" },
        { category: "Project Creation", value: 10, color: "#1D4ED8" },
        { category: "Community Activity", value: 15, color: "#059669" }
      ];
    }
    
    const colorMap: { [key: string]: string } = {
      "CONTENT_CREATION": "#4C1D95", // purple
      "PROJECT_CONTRIBUTION": "#1D4ED8", // blue
      "GRANT_PARTICIPATION": "#059669", // green
      "COMMUNITY_ENGAGEMENT": "#B45309", // amber
      "GOVERNANCE": "#DC2626", // red
      "SKILL_VERIFICATION": "#2563EB", // blue
      "REFERRAL": "#7C3AED", // violet
      "HACKATHON": "#0891B2", // cyan
    };
    
    try {
      return activities.map(activity => {
        if (!activity || typeof activity !== 'object') {
          return { category: "Unknown", value: 0, color: "#6B7280" };
        }
        
        return {
          category: activity.type
            ? activity.type
                .split('_')
                .map(word => word.charAt(0) + word.slice(1).toLowerCase())
                .join(' ')
            : "Activity",
          value: activity.points || 0,
          color: colorMap[activity.type] || "#6B7280" // gray as default
        };
      });
    } catch (error) {
      console.error("Error formatting reputation data:", error);
      // Fallback to default data if mapping fails
      return [
        { category: "Platform Engagement", value: 25, color: "#4C1D95" },
        { category: "Project Creation", value: 10, color: "#1D4ED8" },
        { category: "Community Activity", value: 15, color: "#059669" }
      ];
    }
  };

  return (
    <Layout>
      <div className="container py-6 max-w-6xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Reputation ID (RepID)</h1>
              <p className="text-muted-foreground mt-1">
                Privacy-preserving reputation and credential management using zero-knowledge proofs
              </p>
            </div>
            {profileData && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-sm px-3 py-1 flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Rep Score: {profileData.reputationScore || 0}
                </Badge>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setActiveTab('generate')}
                  className="flex items-center"
                >
                  <Lock className="w-4 h-4 mr-1.5" />
                  Create ZK Proof
                </Button>
              </div>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
            <TabsList className="grid grid-cols-5 mb-8">
              <TabsTrigger value="overview" className="flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="flex items-center">
                <ChartPie className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Dashboard</span>
                <span className="sm:hidden">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger value="credentials" className="flex items-center">
                <Award className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Credentials</span>
                <span className="sm:hidden">Creds</span>
              </TabsTrigger>
              <TabsTrigger value="proofs" className="flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">ZK Proofs</span>
                <span className="sm:hidden">Proofs</span>
              </TabsTrigger>
              <TabsTrigger value="generate" className="flex items-center">
                <Lock className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Generate Proof</span>
                <span className="sm:hidden">Generate</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Privacy-Preserving Reputation System</AlertTitle>
                <AlertDescription>
                  The RepID system allows you to prove aspects of your reputation without revealing detailed personal information.
                  Use zero-knowledge proofs to selectively disclose only what you want others to see.
                </AlertDescription>
              </Alert>
          
              {profileData && !profileLoading && (
                <ReputationVisualizer 
                  userId={profileData.id}
                  reputationScore={profileData.reputationScore || 0}
                  credentialsCount={credentials?.length || 0}
                  activitiesCount={activities && Array.isArray(activities) ? activities.reduce((sum, act) => sum + act.count, 0) : 0}
                  verifiedProofsCount={proofs?.filter(p => p.status === 'verified').length || 0}
                  breakdown={formatBreakdownData()}
                />
              )}

              {profileData && (
                <div className="space-y-6 mt-6">
                  {/* Persona-specific reputation metrics */}
                  {profileData.id && (
                    <PersonaReputationMetrics userId={profileData.id} />
                  )}
                  
                  {/* Reputation breakdown & activity history */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {profileData.id && (
                      <ReputationBreakdown userId={profileData.id} />
                    )}
                    <ReputationRecommendations />
                  </div>
                  
                  {/* Action buttons */}
                  <div className="flex flex-wrap justify-center gap-4 mt-6">
                    <Button 
                      onClick={() => setActiveTab('credentials')} 
                      variant="outline"
                      className="flex items-center"
                    >
                      <BadgeIcon className="mr-2 h-4 w-4" />
                      View Credentials
                    </Button>
                    <Button 
                      onClick={() => setActiveTab('generate')}
                      className="flex items-center"
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Generate New Proof
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              {profileData && !profileLoading ? (
                <ReputationCredentialDashboard userId={profileData.id} />
              ) : (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
            </TabsContent>

            {/* Credentials Tab */}
            <TabsContent value="credentials">
              {credentialsLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : credentials && credentials.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {credentials.map((credential: any) => (
                    <ZkpCredentialCard 
                      key={credential.id} 
                      credential={credential}
                      onCreateProof={handleCreateProof}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Award className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">No Credentials Yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    You haven't earned any verifiable credentials yet. Participate in platform activities to earn them.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* Proofs Tab */}
            <TabsContent value="proofs">
              {proofsLoading ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : proofs && proofs.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {proofs.map((proof: any) => (
                    <ProofStatusCard 
                      key={proof.id} 
                      proof={proof}
                      onVerify={handleVerifyProof}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-10">
                  <Shield className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                  <h3 className="mt-4 text-lg font-medium">No Proofs Generated</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    You haven't generated any zero-knowledge proofs yet. Create one to share your reputation securely.
                  </p>
                  <Button className="mt-4" onClick={() => setActiveTab('generate')}>
                    Generate Your First Proof
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Generate Tab */}
            <TabsContent value="generate">
              {profileData ? (
                <div className="max-w-xl mx-auto">
                  <GenerateProofForm 
                    userId={profileData.id} 
                    maxReputation={profileData.reputationScore || 100}
                    onProofGenerated={handleProofGenerated}
                  />
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-sm text-muted-foreground">Loading your reputation data...</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
      </div>
    </Layout>
  );
}
