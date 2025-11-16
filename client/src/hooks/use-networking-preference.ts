import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export function useNetworkingPreference() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [openToNetworking, setOpenToNetworking] = useState(user?.openToNetworking || false);

  // Sync with user data when it changes
  useEffect(() => {
    if (user?.openToNetworking !== undefined && user.openToNetworking !== null) {
      setOpenToNetworking(user.openToNetworking);
    }
  }, [user?.openToNetworking]);

  // Update networking preference mutation
  const updateNetworkingMutation = useMutation({
    mutationFn: async (openToNetworking: boolean) => {
      return await apiRequest("PATCH", "/api/user/networking-preference", { openToNetworking });
    },
    onSuccess: () => {
      // Update the user cache to reflect the change immediately
      queryClient.invalidateQueries({ queryKey: ["/api/user/networking-preference"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/networking-preference"] });
      toast({
        title: "Networking preference updated",
        description: "Your networking settings have been saved successfully.",
      });
    },
    onError: () => {
      // Reset the toggle if the API call fails
      setOpenToNetworking(user?.openToNetworking || false);
      toast({
        title: "Error",
        description: "Failed to update networking preference. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle networking toggle change
  const handleNetworkingToggle = (checked: boolean) => {
    setOpenToNetworking(checked);
    updateNetworkingMutation.mutate(checked);
  };

  return {
    openToNetworking,
    setOpenToNetworking,
    handleNetworkingToggle,
    isUpdating: updateNetworkingMutation.isPending,
  };
}