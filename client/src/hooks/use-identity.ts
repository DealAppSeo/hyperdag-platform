import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

interface ZkpIdentity {
  id: string;
  commitment: string;
  publicKey: string;
  created: Date;
}

interface IdentityStatus {
  hasIdentity: boolean;
  identityDetails: ZkpIdentity | null;
}

export function useIdentity() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoadingIdentity, setIsLoadingIdentity] = useState(true);
  const [isGeneratingZkpIdentity, setIsGeneratingZkpIdentity] = useState(false);
  const [zkpIdentity, setZkpIdentity] = useState<ZkpIdentity | null>(null);
  const [hasZkpIdentity, setHasZkpIdentity] = useState(false);
  const [identityError, setIdentityError] = useState<string | null>(null);

  // Fetch the user's ZKP identity status
  const fetchZkpIdentityStatus = async () => {
    try {
      // Only attempt to fetch identity if user is authenticated
      if (!user) {
        setHasZkpIdentity(false);
        setZkpIdentity(null);
        setIsLoadingIdentity(false);
        return;
      }
      
      setIsLoadingIdentity(true);
      setIdentityError(null);

      // Use direct fetch with proper headers
      const response = await fetch('/api/v1/identity-zkp/status', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include'
      });
      
      // Check if response is OK
      if (!response.ok) {
        // For non-JSON responses or server errors, handle gracefully
        if (response.status === 401) {
          // Not authenticated
          setHasZkpIdentity(false);
          setZkpIdentity(null);
          return;
        }
        
        if (response.headers.get('content-type')?.includes('text/html')) {
          // Likely a server error page, don't try to parse as JSON
          setIdentityError('Server responded with HTML, not JSON');
          return;
        }
      }
      
      // Try to get the response as text first to debug any issues
      const text = await response.text();
      if (!text || text.trim() === '') {
        // Empty response
        setIdentityError('Empty response from server');
        return;
      }
      
      let data;
      try {
        // Try parsing the response as JSON
        data = JSON.parse(text);
      } catch (parseError) {
        // Silence the console error in production
        if (import.meta.env.VITE_NODE_ENV !== 'production') {
          console.error('Failed to parse response as JSON:', text.substring(0, 100) + '...');
        }
        setIdentityError('Invalid response format');
        return;
      }

      if (!data.success) {
        setIdentityError(data.error?.message || 'Failed to fetch identity status');
        return;
      }

      const status = data.data as IdentityStatus;
      setHasZkpIdentity(status.hasIdentity);
      setZkpIdentity(status.identityDetails);
    } catch (error) {
      // Only log in development
      if (import.meta.env.VITE_NODE_ENV !== 'production') {
        console.error('Error fetching ZKP identity status:', error);
      }
      setIdentityError('Failed to connect to identity service');
    } finally {
      setIsLoadingIdentity(false);
    }
  };

  // Generate a new ZKP identity for the user
  const generateZkpIdentity = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to generate a ZKP identity.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGeneratingZkpIdentity(true);
      setIdentityError(null);

      // Use direct fetch with proper headers
      const response = await fetch('/api/v1/identity-zkp/create', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      const text = await response.text();
      let data;
      
      try {
        // Try parsing the response as JSON
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', text.substring(0, 100) + '...');
        throw new Error('Invalid JSON response from server');
      }

      if (!data.success) {
        setIdentityError(data.error?.message || 'Failed to generate identity');
        toast({
          title: "Identity Generation Failed",
          description: data.error?.message || "There was an error generating your ZKP identity.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Identity Generated",
        description: "Your ZKP identity has been successfully created.",
      });

      // Refresh the identity status
      await fetchZkpIdentityStatus();
    } catch (error) {
      console.error('Error generating ZKP identity:', error);
      setIdentityError('Failed to connect to identity service');
      toast({
        title: "Identity Generation Failed",
        description: "There was an error connecting to the identity service.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingZkpIdentity(false);
    }
  };

  // Fetch the identity status when the component mounts or when user changes
  useEffect(() => {
    fetchZkpIdentityStatus();
  }, [user?.id]);

  return {
    zkpIdentity,
    hasZkpIdentity,
    isLoadingIdentity,
    isGeneratingZkpIdentity,
    identityError,
    generateZkpIdentity,
    refreshIdentityStatus: fetchZkpIdentityStatus,
  };
}
