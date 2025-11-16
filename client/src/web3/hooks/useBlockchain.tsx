import { useQuery, useMutation } from '@tanstack/react-query';
import { useMetaMask } from './useMetaMask';
import * as BlockchainService from '../services/BlockchainService';
import { useToast } from '@/hooks/use-toast';
import { ethers } from 'ethers';

/**
 * Custom hook for interacting with the blockchain
 */
export function useBlockchain() {
  const { provider, signer, isConnected, address } = useMetaMask();
  const { toast } = useToast();
  
  // Check blockchain health
  const { data: isHealthy = false, refetch: refetchHealth } = useQuery({
    queryKey: ['/api/blockchain/health'],
    queryFn: () => BlockchainService.getBlockchainHealth(),
    staleTime: 60000, // 1 minute
  });
  
  // Get network metrics
  const { data: networkMetrics, refetch: refetchMetrics } = useQuery({
    queryKey: ['/api/v1/network/metrics'],
    queryFn: () => BlockchainService.getNetworkMetrics(),
    staleTime: 30000, // 30 seconds
    enabled: isHealthy,
  });
  
  // Get total projects
  const { data: totalProjects = 0, refetch: refetchTotalProjects } = useQuery({
    queryKey: ['/api/blockchain/projects'],
    queryFn: () => BlockchainService.getTotalProjects(),
    staleTime: 60000, // 1 minute
    enabled: isHealthy,
  });
  
  // Get token balance
  const { data: tokenBalance = '0', refetch: refetchTokenBalance } = useQuery({
    queryKey: ['/api/blockchain/tokens/balance', address],
    queryFn: () => address ? BlockchainService.getTokenBalance(address) : Promise.resolve('0'),
    staleTime: 60000, // 1 minute
    enabled: isHealthy && isConnected && !!address,
  });
  
  // Function to fetch project details
  const getProject = (projectId: number) => {
    return useQuery({
      queryKey: ['/api/blockchain/projects', projectId],
      queryFn: () => BlockchainService.getProject(projectId),
      staleTime: 60000, // 1 minute
      enabled: isHealthy && projectId > 0,
    });
  };
  
  // Function to fetch project team
  const getProjectTeam = (projectId: number) => {
    return useQuery({
      queryKey: ['/api/blockchain/projects', projectId, 'team'],
      queryFn: () => BlockchainService.getProjectTeam(projectId),
      staleTime: 60000, // 1 minute
      enabled: isHealthy && projectId > 0,
    });
  };
  
  // Function to fetch project proposals
  const getProjectProposals = (projectId: number) => {
    return useQuery({
      queryKey: ['/api/blockchain/projects', projectId, 'proposals'],
      queryFn: () => BlockchainService.getProjectProposals(projectId),
      staleTime: 60000, // 1 minute
      enabled: isHealthy && projectId > 0,
    });
  };
  
  // Function to fetch user's created projects
  const getUserProjects = () => {
    return useQuery({
      queryKey: ['/api/blockchain/users', address, 'projects'],
      queryFn: () => address ? BlockchainService.getUserProjects(address) : Promise.resolve([]),
      staleTime: 60000, // 1 minute
      enabled: isHealthy && isConnected && !!address,
    });
  };
  
  // Function to fetch user's joined projects
  const getUserJoinedProjects = () => {
    return useQuery({
      queryKey: ['/api/blockchain/users', address, 'joined'],
      queryFn: () => address ? BlockchainService.getUserJoinedProjects(address) : Promise.resolve([]),
      staleTime: 60000, // 1 minute
      enabled: isHealthy && isConnected && !!address,
    });
  };
  
  // Create Project Mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData: {
      title: string;
      description: string;
      categories: string[];
      requiredRoles: string[];
      fundingGoal: string;
      durationDays: number;
      projectType: 0 | 1;
    }) => {
      if (!provider || !signer) {
        throw new Error('Wallet not connected');
      }
      
      return BlockchainService.createProject(
        provider as ethers.JsonRpcProvider,
        signer as unknown as ethers.JsonRpcSigner,
        projectData
      );
    },
    onSuccess: (txHash) => {
      toast({
        title: 'Project Created',
        description: `Transaction submitted: ${txHash.slice(0, 10)}...`,
      });
      
      // Refetch total projects after success
      refetchTotalProjects();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Creating Project',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Fund Project Mutation
  const fundProjectMutation = useMutation({
    mutationFn: async ({ projectId, amount }: { projectId: number, amount: string }) => {
      if (!provider || !signer) {
        throw new Error('Wallet not connected');
      }
      
      return BlockchainService.fundProject(
        provider as ethers.JsonRpcProvider,
        signer as unknown as ethers.JsonRpcSigner,
        projectId,
        amount
      );
    },
    onSuccess: (txHash) => {
      toast({
        title: 'Project Funded',
        description: `Transaction submitted: ${txHash.slice(0, 10)}...`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Funding Project',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Join Team Mutation
  const joinTeamMutation = useMutation({
    mutationFn: async ({ projectId, role }: { projectId: number, role: string }) => {
      if (!provider || !signer) {
        throw new Error('Wallet not connected');
      }
      
      return BlockchainService.joinTeam(
        provider as ethers.JsonRpcProvider,
        signer as unknown as ethers.JsonRpcSigner,
        projectId,
        role
      );
    },
    onSuccess: (txHash) => {
      toast({
        title: 'Joined Team',
        description: `Transaction submitted: ${txHash.slice(0, 10)}...`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error Joining Team',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  // Refetch all blockchain data
  const refetchAll = () => {
    refetchHealth();
    refetchMetrics();
    refetchTotalProjects();
    refetchTokenBalance();
  };
  
  return {
    // Read-only data
    isHealthy,
    networkMetrics,
    totalProjects,
    tokenBalance,
    
    // Query functions
    getProject,
    getProjectTeam,
    getProjectProposals,
    getUserProjects,
    getUserJoinedProjects,
    
    // Mutations
    createProjectMutation,
    fundProjectMutation,
    joinTeamMutation,
    
    // Refetch functions
    refetchHealth,
    refetchMetrics,
    refetchTotalProjects,
    refetchTokenBalance,
    refetchAll,
  };
}
