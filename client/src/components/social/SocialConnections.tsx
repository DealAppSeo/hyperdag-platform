import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, Check, X, AlertCircle, ExternalLink, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { FaGoogle, FaTwitter, FaDiscord, FaGithub, FaLinkedin, FaYoutube, FaMedium } from 'react-icons/fa';
import { SiStackoverflow } from 'react-icons/si';

// Types for social media platforms
type SocialPlatform = 'google' | 'twitter' | 'discord' | 'github' | 'linkedin' | 'youtube' | 'medium' | 'stackoverflow';

// Interface for social connection data
interface SocialConnection {
  provider: SocialPlatform;
  connected: boolean;
  verified: boolean;
  username?: string;
  followerCount?: number;
  disconnectSupported?: boolean;
}

export default function SocialConnections() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState<SocialPlatform | null>(null);

  // Fetch social connections data
  const { data: connections, isLoading, error } = useQuery({
    queryKey: ['/api/v1/social/connections'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/v1/social/connections');
      if (!response.ok) {
        throw new Error('Failed to fetch social connections');
      }
      return response.json();
    }
  });

  // Connect social account mutation
  const connectMutation = useMutation({
    mutationFn: async (provider: SocialPlatform) => {
      const response = await apiRequest('POST', '/api/v1/social/connect', { provider });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to initiate connection');
      }
      return response.json();
    },
    onSuccess: (data) => {
      // Redirect to OAuth provider
      window.location.href = data.authUrl;
    },
    onError: (error: Error) => {
      toast({
        title: 'Connection Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // Disconnect social account mutation
  const disconnectMutation = useMutation({
    mutationFn: async (provider: SocialPlatform) => {
      const response = await apiRequest('POST', '/api/v1/social/disconnect', { provider });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to disconnect account');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/social/connections'] });
      toast({
        title: 'Account Disconnected',
        description: 'Social media account has been disconnected successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Disconnection Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Generate Zero-Knowledge Proof mutation
  const generateZkProofMutation = useMutation({
    mutationFn: async (provider: SocialPlatform) => {
      setIsVerifying(provider);
      const response = await apiRequest('POST', '/api/v1/social/generate-proof', { provider });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate proof');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/v1/social/connections'] });
      toast({
        title: 'Proof Generated',
        description: 'Zero-knowledge proof has been generated successfully',
      });
      setIsVerifying(null);
    },
    onError: (error: Error) => {
      toast({
        title: 'Proof Generation Failed',
        description: error.message,
        variant: 'destructive',
      });
      setIsVerifying(null);
    }
  });

  // Handle connect button click
  const handleConnect = (provider: SocialPlatform) => {
    connectMutation.mutate(provider);
  };

  // Handle disconnect button click
  const handleUnlink = (provider: SocialPlatform) => {
    disconnectMutation.mutate(provider);
  };
  
  // Handle verify button click
  const handleVerify = (provider: SocialPlatform) => {
    generateZkProofMutation.mutate(provider);
  };

  // Helper to get provider display name
  const getProviderName = (provider: SocialPlatform): string => {
    switch (provider) {
      case 'google': return 'Google';
      case 'twitter': return 'Twitter';
      case 'discord': return 'Discord';
      case 'github': return 'GitHub';
      case 'linkedin': return 'LinkedIn';
      case 'youtube': return 'YouTube';
      case 'medium': return 'Medium';
      case 'stackoverflow': return 'Stack Overflow';
      default: return provider;
    }
  };

  // Helper to get provider icon
  const getProviderIcon = (provider: SocialPlatform) => {
    switch (provider) {
      case 'google': return <FaGoogle className="h-5 w-5" />;
      case 'twitter': return <FaTwitter className="h-5 w-5" />;
      case 'discord': return <FaDiscord className="h-5 w-5" />;
      case 'github': return <FaGithub className="h-5 w-5" />;
      case 'linkedin': return <FaLinkedin className="h-5 w-5" />;
      case 'youtube': return <FaYoutube className="h-5 w-5" />;
      case 'medium': return <FaMedium className="h-5 w-5" />;
      case 'stackoverflow': return <SiStackoverflow className="h-5 w-5" />;
      default: return <ExternalLink className="h-5 w-5" />;
    }
  };

  // Prepare the display data
  const socialPlatforms: SocialPlatform[] = [
    'google', 'twitter', 'discord', 'github', 
    'linkedin', 'youtube', 'medium', 'stackoverflow'
  ];
  
  // Initial mock data while API is being implemented
  const mockConnections: SocialConnection[] = [
    { provider: 'google', connected: false, verified: false },
    { provider: 'twitter', connected: false, verified: false },
    { provider: 'discord', connected: false, verified: false },
    { provider: 'github', connected: false, verified: false },
    { provider: 'linkedin', connected: false, verified: false },
    { provider: 'youtube', connected: false, verified: false },
    { provider: 'medium', connected: false, verified: false },
    { provider: 'stackoverflow', connected: false, verified: false },
  ];

  const connectionsData = connections || mockConnections;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading social connections...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 text-red-700 flex items-start">
        <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold">Error loading social connections</h3>
          <p>{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {socialPlatforms.map(platform => {
          const connection = connectionsData.find((c: SocialConnection) => c.provider === platform) || { 
            provider: platform, 
            connected: false, 
            verified: false 
          };
          
          return (
            <div key={platform} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center space-x-3">
                  <div className="bg-gray-100 p-2 rounded-md text-gray-700">
                    {getProviderIcon(platform)}
                  </div>
                  <h3 className="font-medium">{getProviderName(platform)}</h3>
                </div>
                
                <div>
                  {connection.verified ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Check className="h-3 w-3 mr-1" /> Verified
                    </Badge>
                  ) : connection.connected ? (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                      Not Connected
                    </Badge>
                  )}
                </div>
              </div>
              
              {connection.connected && (
                <div className="mb-3 text-sm">
                  {connection.username && (
                    <p className="text-gray-700">
                      Username: <span className="font-medium">{connection.username}</span>
                    </p>
                  )}
                  {connection.followerCount !== undefined && (
                    <p className="text-gray-700">
                      Followers: <span className="font-medium">{connection.followerCount.toLocaleString()}</span>
                    </p>
                  )}
                </div>
              )}
              
              <div className="flex space-x-2 mt-4">
                {!connection.connected ? (
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full flex items-center justify-center"
                    onClick={() => handleConnect(platform)}
                    disabled={connectMutation.isPending}
                  >
                    {connectMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Connecting...</>
                    ) : (
                      <>Connect</>
                    )}
                  </Button>
                ) : (
                  <>
                    {!connection.verified && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center justify-center"
                        onClick={() => handleVerify(platform)}
                        disabled={isVerifying === platform}
                      >
                        {isVerifying === platform ? (
                          <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Verifying...</>
                        ) : (
                          <><Lock className="h-4 w-4 mr-1" /> Generate ZKP</>
                        )}
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center justify-center"
                      onClick={() => handleUnlink(platform)}
                      disabled={disconnectMutation.isPending}
                    >
                      {disconnectMutation.isPending ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Unlinking...</>
                      ) : (
                        <><X className="h-4 w-4 mr-1" /> Unlink</>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="text-sm text-gray-500 mt-6 border-t pt-4">
        <p className="flex items-center mb-1">
          <Lock className="h-4 w-4 mr-1 inline" /> 
          Your connections are protected with zero-knowledge proofs
        </p>
        <p>
          When you connect an account, a ZKP is generated to verify ownership without linking your identity.
        </p>
      </div>
    </div>
  );
}