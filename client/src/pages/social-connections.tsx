import { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Shield, ShieldCheck, AlertTriangle, ExternalLink, Lock } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Separator } from '@/components/ui/separator';


// Social platform icons
import { 
  SiGoogle,
  SiDiscord, 
  SiGithub, 
  SiLinkedin, 
  SiYoutube,
  SiMedium,
  SiStackoverflow
} from 'react-icons/si';
import { FaTwitter } from 'react-icons/fa';

interface SocialConnection {
  provider: string;
  connected: boolean;
  verified: boolean;
  username?: string;
  followerCount?: number;
  disconnectSupported: boolean;
}

export default function SocialConnections() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('manage');
  const [visibleConnections, setVisibleConnections] = useState<number>(5);
  const [isIntersecting, setIsIntersecting] = useState<boolean>(false);
  const [pendingConnection, setPendingConnection] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  
  // Navigation helper with wouter
  const [_, navigate] = useLocation();
  
  // Query for social connections with optimized settings
  const { 
    data: connectionsData, 
    isLoading, 
    isError,
    error,
    refetch
  } = useQuery<{ success: boolean, data: { connections: Record<string, boolean>, socialStats: Record<string, any> } }>({
    queryKey: ['/api/social/connections'],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });
  
  // Default available platforms
  const availablePlatforms = ['twitter', 'github', 'linkedin', 'discord', 'youtube', 'google'];
  
  // Extract connections from response data and transform to array format
  const apiConnections = !connectionsData?.data?.connections ? {} :
    connectionsData.data.connections;
    
  // Create full connections array with all available platforms
  const connections = availablePlatforms.map(provider => {
    const connected = !!apiConnections[provider];
    return {
      provider,
      connected,
      verified: connected, // If connected, we assume it's verified
      disconnectSupported: true,
      username: connectionsData?.data?.socialStats?.[provider]?.username || undefined,
      followerCount: connectionsData?.data?.socialStats?.[provider]?.followerCount || undefined
    };
  });
  
  // Setup intersection observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
        }
      },
      { threshold: 0.1 }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current);
      }
      
      // Clean up polling interval on unmount
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    };
  }, [pollingInterval]);
  
  // Load more connections when user scrolls down
  useEffect(() => {
    if (isIntersecting && connections && visibleConnections < connections.length) {
      setTimeout(() => {
        setVisibleConnections(prev => Math.min(prev + 5, connections.length));
        setIsIntersecting(false);
      }, 300);
    }
  }, [isIntersecting, connections, visibleConnections]);
  
  // Poll for connection status changes
  const checkConnectionStatus = useCallback(async (provider: string) => {
    try {
      const response = await apiRequest('GET', `/api/social/status/${provider}`);
      const data = await response.json();
      
      if (data.success && data.data?.connected) {
        // Connection successful, stop polling
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
        
        setPendingConnection(null);
        refetch(); // Refresh the connections data
        
        toast({
          title: 'Connection Successful',
          description: `Successfully connected to ${getPlatformName(provider)}!`,
        });
      }
    } catch (error) {
      console.error('Error checking connection status:', error);
    }
  }, [pollingInterval, refetch, toast]);

  // Handle connect platform
  const connectPlatform = async (provider: string) => {
    try {
      // Use correct API endpoint format
      const response = await apiRequest('GET', `/api/social/connect/${provider}`);
      const data = await response.json();
      
      if (data.success && data.data?.authUrl) {
        // Using window.open for OAuth flow instead of changing the current page
        window.open(data.data.authUrl, '_blank', 'width=600,height=700');
        
        // Show toast to explain the popup
        toast({
          title: 'Connection Started',
          description: `Please complete authentication in the popup window for ${getPlatformName(provider)}.`,
        });
        
        // Start polling for connection status
        setPendingConnection(provider);
        
        // Clear any existing polling interval
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
        
        // Set up new polling interval to check connection status
        const interval = window.setInterval(() => {
          checkConnectionStatus(provider);
        }, 3000); // Check every 3 seconds
        
        setPollingInterval(interval);
        
        // Auto-stop polling after 2 minutes if not successful
        setTimeout(() => {
          if (pollingInterval) {
            clearInterval(pollingInterval);
            setPollingInterval(null);
            
            if (pendingConnection === provider) {
              setPendingConnection(null);
              toast({
                title: 'Connection Timeout',
                description: `Connection to ${getPlatformName(provider)} timed out. Please try again.`,
                variant: 'destructive',
              });
            }
          }
        }, 120000); // 2 minutes timeout
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to initiate connection. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error connecting platform:', error);
      toast({
        title: 'Connection Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };
  
  // Handle disconnect platform
  const disconnectPlatform = async (provider: string) => {
    try {
      // Use correct API endpoint format
      const response = await apiRequest('POST', '/api/social/disconnect', { provider });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Disconnected',
          description: `Your ${provider} account has been disconnected.`,
        });
        refetch();
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to disconnect account',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error disconnecting platform:', error);
      toast({
        title: 'Disconnection Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };
  
  // Handle generate proof
  const generateProof = async (provider: string) => {
    try {
      // Use correct API endpoint format
      const response = await apiRequest('POST', '/api/social/generate-proof', { provider });
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Proof Generated',
          description: `Zero-knowledge proof generated for your ${provider} account.`,
        });
        refetch();
      } else {
        toast({
          title: 'Error',
          description: data.message || 'Failed to generate proof',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error generating proof:', error);
      toast({
        title: 'Proof Generation Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };
  
  // Get platform-specific icon
  const getPlatformIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return <SiGoogle className="h-6 w-6 text-[#4285F4]" />;
      case 'twitter':
        return <FaTwitter className="h-6 w-6 text-[#1DA1F2]" />;
      case 'discord':
        return <SiDiscord className="h-6 w-6 text-[#5865F2]" />;
      case 'github':
        return <SiGithub className="h-6 w-6 text-slate-900 dark:text-white" />;
      case 'linkedin':
        return <SiLinkedin className="h-6 w-6 text-[#0A66C2]" />;
      case 'youtube':
        return <SiYoutube className="h-6 w-6 text-[#FF0000]" />;
      case 'medium':
        return <SiMedium className="h-6 w-6 text-slate-900 dark:text-white" />;
      case 'stackoverflow':
        return <SiStackoverflow className="h-6 w-6 text-[#F48024]" />;
      default:
        return <Shield className="h-6 w-6" />;
    }
  };
  
  // Get connection status badge
  const getConnectionStatusBadge = (connection: SocialConnection) => {
    if (connection.connected && connection.verified) {
      return <Badge className="ml-2 bg-green-500 text-white hover:bg-green-600">Verified</Badge>;
    }
    if (connection.connected) {
      return <Badge variant="outline" className="ml-2">Connected</Badge>;
    }
    return <Badge variant="secondary" className="ml-2">Not Connected</Badge>;
  };
  
  // Get formatted platform name
  const getPlatformName = (provider: string): string => {
    switch (provider) {
      case 'google':
        return 'Google';
      case 'twitter':
        return 'Twitter/X';
      case 'discord':
        return 'Discord';
      case 'github':
        return 'GitHub';
      case 'linkedin':
        return 'LinkedIn';
      case 'youtube':
        return 'YouTube';
      case 'medium':
        return 'Medium';
      case 'stackoverflow':
        return 'Stack Overflow';
      default:
        return provider.charAt(0).toUpperCase() + provider.slice(1);
    }
  };
  
  // Get connection action button
  const getConnectionActionButton = (connection: SocialConnection) => {
    if (connection.connected) {
      return (
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => disconnectPlatform(connection.provider)}
            className="w-full sm:w-auto"
          >
            Disconnect
          </Button>
          
          {connection.verified ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => generateProof(connection.provider)}
              className="w-full sm:w-auto flex items-center justify-center"
            >
              <Lock className="mr-1 h-3 w-3" />
              <span className="whitespace-nowrap">Generate ZKP</span>
            </Button>
          ) : (
            <Button 
              variant="default" 
              size="sm" 
              onClick={() => generateProof(connection.provider)}
              className="w-full sm:w-auto flex items-center justify-center"
            >
              <ShieldCheck className="mr-1 h-3 w-3" />
              Verify
            </Button>
          )}
        </div>
      );
    } else {
      return (
        <Button 
          variant="default" 
          size="sm" 
          onClick={() => connectPlatform(connection.provider)}
          className="w-full sm:w-auto"
        >
          Connect
        </Button>
      );
    }
  };
  
  if (!isAuthenticated) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 overflow-auto p-6">
          <div className="container max-w-6xl py-10">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Authentication Required</AlertTitle>
              <AlertDescription>
                You must be signed in to manage your social connections.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 overflow-auto p-6">
          <div className="container max-w-6xl py-10">
            <div className="flex flex-col items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p>Loading your social connections...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 overflow-auto p-6">
          <div className="container max-w-6xl py-10">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error Loading Connections</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : 'Failed to load your social connections. Please try again.'}
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout>
        <div className="container max-w-6xl py-6 md:py-10">
          {/* Back navigation */}
          <div className="mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 mb-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide">
                <path d="m12 19-7-7 7-7"/>
                <path d="M19 12H5"/>
              </svg>
              Back to Dashboard
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Social Connections</h1>
              <p className="text-muted-foreground mt-1">
                Connect, verify and manage your social media accounts with privacy protection
              </p>
            </div>
          </div>
          
          <Alert className="mb-6">
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Privacy Protected</AlertTitle>
            <AlertDescription>
              HyperDAG uses zero-knowledge proofs to verify your social accounts without revealing your identity. 
              Your connections are private and only you can see them.
            </AlertDescription>
          </Alert>
          
          <Tabs defaultValue="manage" value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6 w-full flex flex-wrap">
              <TabsTrigger value="manage" className="flex-1 text-sm sm:text-base py-2 px-2 sm:px-4">Manage</TabsTrigger>
              <TabsTrigger value="benefits" className="flex-1 text-sm sm:text-base py-2 px-2 sm:px-4">Benefits</TabsTrigger>
              <TabsTrigger value="privacy" className="flex-1 text-sm sm:text-base py-2 px-2 sm:px-4">Privacy</TabsTrigger>
            </TabsList>
            
            <TabsContent value="manage">
              <div className="grid grid-cols-1 gap-4">
                {connections.slice(0, visibleConnections).map((connection) => (
                  <Card key={connection.provider} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div className="flex items-center flex-wrap">
                          {getPlatformIcon(connection.provider)}
                          <CardTitle className="ml-2 text-lg truncate max-w-[150px] sm:max-w-none">
                            {getPlatformName(connection.provider)}
                          </CardTitle>
                          {getConnectionStatusBadge(connection)}
                        </div>
                        
                        {pendingConnection === connection.provider ? (
                          <div className="flex items-center">
                            <Loader2 className="animate-spin h-4 w-4 mr-2" />
                            <span className="text-sm">Connecting...</span>
                          </div>
                        ) : (
                          <div className="w-full sm:w-auto">
                            {getConnectionActionButton(connection)}
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      {connection.connected ? (
                        <div>
                          {connection.username && (
                            <p className="text-sm text-muted-foreground mb-1">
                              <span className="font-medium">Username:</span> {connection.username}
                            </p>
                          )}
                          {connection.followerCount !== undefined && (
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Followers:</span> {connection.followerCount.toLocaleString()}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground mt-2">
                            This account has been securely connected to your HyperDAG profile.
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Connect your {getPlatformName(connection.provider)} account to verify your reputation and unlock platform benefits.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {/* Loading indicator shown when more connections can be loaded */}
                {visibleConnections < connections.length && (
                  <div ref={loaderRef} className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="benefits">
              <Card>
                <CardHeader>
                  <CardTitle>Connection Benefits</CardTitle>
                  <CardDescription>
                    Enhancing your HyperDAG experience through verified social connections
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Verified Reputation</h3>
                    <p className="text-muted-foreground">
                      Connecting your social accounts allows HyperDAG to verify your online reputation and professional achievements
                      using zero-knowledge proofs, without exposing your personal information.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Enhanced Trust Signals</h3>
                    <p className="text-muted-foreground">
                      Verified connections boost your reputation score, making your profile more trustworthy to potential
                      collaborators and funding partners.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Access to Special Features</h3>
                    <p className="text-muted-foreground">
                      Unlock premium features such as AI-assisted networking, priority access to grant opportunities,
                      and advanced reputation analytics.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Seamless Professional Networking</h3>
                    <p className="text-muted-foreground">
                      Find and connect with professionals who share similar interests and expertise across multiple platforms,
                      all from a single, secure hub.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="privacy">
              <Card>
                <CardHeader>
                  <CardTitle>Privacy Protection</CardTitle>
                  <CardDescription>
                    How HyperDAG protects your identity while verifying your credentials
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Zero-Knowledge Proofs (ZKPs)</h3>
                    <p className="text-muted-foreground">
                      We use advanced cryptographic techniques called Zero-Knowledge Proofs to verify information about your 
                      social accounts without storing or revealing your actual account details. This means we can prove facts 
                      about your profiles (like follower count or account age) without storing your personal data.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Limited Access Tokens</h3>
                    <p className="text-muted-foreground">
                      When connecting social accounts, HyperDAG requests only the minimum necessary permissions. 
                      We never request permission to post on your behalf, access private messages, or view personal data 
                      beyond what's required for verification.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">On-Demand Verification</h3>
                    <p className="text-muted-foreground">
                      You control when and how your verification proofs are generated and shared. Generate new proofs only 
                      when needed for specific platform interactions, and revoke access at any time.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Best Practices</h3>
                    <p className="text-muted-foreground">
                      For maximum privacy, consider creating dedicated professional accounts for connection to HyperDAG, 
                      but remove any direct links to your actual social accounts.
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="pt-2">
                    <Button variant="outline" size="sm" className="flex items-center" onClick={() => window.open('/privacy-policy', '_blank')}>
                      Learn More About Our Privacy Policy
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
    </Layout>
  );
}