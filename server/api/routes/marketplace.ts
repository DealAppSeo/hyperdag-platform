import { Router, Request, Response } from 'express';
import { requireAuth } from '../../middleware/auth-middleware';
import { storage } from '../../storage';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createServiceSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  category: z.enum(['compute', 'storage', 'ai', 'gas', 'security', 'network']),
  pricing: z.object({
    type: z.enum(['fixed', 'hourly', 'usage', 'subscription']),
    amount: z.number().positive(),
    currency: z.enum(['USD', 'ETH', 'HDAG']),
    unit: z.string().optional()
  }),
  requirements: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([])
});

const createRequestSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  category: z.enum(['compute', 'storage', 'ai', 'gas', 'security', 'network']),
  budget: z.object({
    min: z.number().positive(),
    max: z.number().positive(),
    currency: z.enum(['USD', 'ETH', 'HDAG'])
  }),
  deadline: z.string(),
  requirements: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([])
});

/**
 * Get all service offerings with filtering and sorting
 * GET /api/marketplace/services
 */
router.get('/services', async (req: Request, res: Response) => {
  try {
    const { category, sort, search } = req.query;
    
    // Mock data for now - replace with actual database queries
    const mockServices = [
      {
        id: 'service-1',
        title: 'High-Performance GPU Computing',
        description: 'Access to NVIDIA A100 GPUs for machine learning and scientific computing workloads.',
        category: 'compute',
        provider: {
          id: 'provider-1',
          name: 'CloudCompute Pro',
          reputation: 4.8,
          verified: true
        },
        pricing: {
          type: 'hourly',
          amount: 2.50,
          currency: 'USD',
          unit: 'hour'
        },
        requirements: ['API access required', 'Minimum 1 hour billing'],
        availability: 'high',
        performanceMetrics: {
          uptime: 99.9,
          responseTime: 150,
          throughput: 1000
        },
        tags: ['gpu', 'machine-learning', 'nvidia', 'a100'],
        createdAt: '2024-01-15T10:00:00Z',
        isApproved: true,
        totalOrders: 247,
        averageRating: 4.8
      },
      {
        id: 'service-2',
        title: 'Decentralized IPFS Storage',
        description: 'Secure, redundant storage across multiple IPFS nodes with guaranteed availability.',
        category: 'storage',
        provider: {
          id: 'provider-2',
          name: 'StorageNet',
          reputation: 4.6,
          verified: true
        },
        pricing: {
          type: 'usage',
          amount: 0.05,
          currency: 'USD',
          unit: 'GB/month'
        },
        requirements: ['IPFS compatible', 'Minimum 1GB storage'],
        availability: 'high',
        performanceMetrics: {
          uptime: 99.5,
          responseTime: 200,
          throughput: 500
        },
        tags: ['ipfs', 'storage', 'decentralized', 'backup'],
        createdAt: '2024-01-14T14:30:00Z',
        isApproved: true,
        totalOrders: 156,
        averageRating: 4.6
      },
      {
        id: 'service-3',
        title: 'AI Model Training Pipeline',
        description: 'End-to-end ML model training with AutoML capabilities and model optimization.',
        category: 'ai',
        provider: {
          id: 'provider-3',
          name: 'AI Solutions Inc',
          reputation: 4.9,
          verified: true
        },
        pricing: {
          type: 'fixed',
          amount: 500,
          currency: 'USD'
        },
        requirements: ['Dataset provided', 'Clear success metrics', 'Model validation requirements'],
        availability: 'medium',
        performanceMetrics: {
          uptime: 98.8,
          responseTime: 300,
          throughput: 200
        },
        tags: ['ai', 'machine-learning', 'automl', 'training'],
        createdAt: '2024-01-13T09:15:00Z',
        isApproved: true,
        totalOrders: 89,
        averageRating: 4.9
      },
      {
        id: 'service-4',
        title: 'Gas Optimization Service',
        description: 'Smart contract optimization to reduce gas costs by up to 40% while maintaining functionality.',
        category: 'gas',
        provider: {
          id: 'provider-4',
          name: 'GasOptimizer',
          reputation: 4.7,
          verified: true
        },
        pricing: {
          type: 'fixed',
          amount: 0.5,
          currency: 'ETH'
        },
        requirements: ['Smart contract source code', 'Test suite provided', 'Deployment on testnet first'],
        availability: 'high',
        performanceMetrics: {
          uptime: 99.2,
          responseTime: 180,
          throughput: 100
        },
        tags: ['gas-optimization', 'smart-contracts', 'ethereum', 'solidity'],
        createdAt: '2024-01-12T16:45:00Z',
        isApproved: true,
        totalOrders: 73,
        averageRating: 4.7
      },
      {
        id: 'service-5',
        title: 'Security Audit & Penetration Testing',
        description: 'Comprehensive security audit for smart contracts and dApps with detailed vulnerability reports.',
        category: 'security',
        provider: {
          id: 'provider-5',
          name: 'SecureChain Audits',
          reputation: 4.9,
          verified: true
        },
        pricing: {
          type: 'fixed',
          amount: 2000,
          currency: 'USD'
        },
        requirements: ['Complete codebase access', 'Documentation provided', 'Post-audit remediation support'],
        availability: 'medium',
        performanceMetrics: {
          uptime: 99.8,
          responseTime: 120,
          throughput: 50
        },
        tags: ['security', 'audit', 'smart-contracts', 'penetration-testing'],
        createdAt: '2024-01-11T11:20:00Z',
        isApproved: true,
        totalOrders: 42,
        averageRating: 4.9
      },
      {
        id: 'service-6',
        title: 'Cross-Chain Bridge Infrastructure',
        description: 'Reliable cross-chain transaction infrastructure supporting 15+ blockchain networks.',
        category: 'network',
        provider: {
          id: 'provider-6',
          name: 'BridgeWorks',
          reputation: 4.5,
          verified: true
        },
        pricing: {
          type: 'usage',
          amount: 0.01,
          currency: 'ETH',
          unit: 'transaction'
        },
        requirements: ['API integration', 'Minimum transaction volume', 'KYC compliance'],
        availability: 'high',
        performanceMetrics: {
          uptime: 99.3,
          responseTime: 250,
          throughput: 800
        },
        tags: ['cross-chain', 'bridge', 'interoperability', 'multi-chain'],
        createdAt: '2024-01-10T13:00:00Z',
        isApproved: true,
        totalOrders: 134,
        averageRating: 4.5
      }
    ];

    // Apply filters
    let filteredServices = mockServices;
    
    if (category && category !== 'all') {
      filteredServices = filteredServices.filter(service => service.category === category);
    }
    
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredServices = filteredServices.filter(service =>
        service.title.toLowerCase().includes(searchLower) ||
        service.description.toLowerCase().includes(searchLower) ||
        service.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply sorting
    switch (sort) {
      case 'rating':
        filteredServices.sort((a, b) => b.averageRating - a.averageRating);
        break;
      case 'price-low':
        filteredServices.sort((a, b) => a.pricing.amount - b.pricing.amount);
        break;
      case 'price-high':
        filteredServices.sort((a, b) => b.pricing.amount - a.pricing.amount);
        break;
      case 'recent':
        filteredServices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'popular':
        filteredServices.sort((a, b) => b.totalOrders - a.totalOrders);
        break;
      default:
        break;
    }
    
    res.json(filteredServices);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch services'
    });
  }
});

/**
 * Get all service requests with filtering
 * GET /api/marketplace/requests
 */
router.get('/requests', async (req: Request, res: Response) => {
  try {
    const { category, search } = req.query;
    
    // Mock data for now - replace with actual database queries
    const mockRequests = [
      {
        id: 'request-1',
        title: 'Need AI Model for Sentiment Analysis',
        description: 'Looking for a pre-trained sentiment analysis model that can handle financial news with 90%+ accuracy.',
        category: 'ai',
        requester: {
          id: 'user-1',
          name: 'FinTech Solutions',
          reputation: 4.6
        },
        budget: {
          min: 1000,
          max: 2500,
          currency: 'USD'
        },
        deadline: '2024-02-15T00:00:00Z',
        requirements: [
          'Model accuracy >90%',
          'Support for financial terminology',
          'API integration ready',
          'Training data validation'
        ],
        tags: ['sentiment-analysis', 'nlp', 'finance', 'api'],
        createdAt: '2024-01-15T08:30:00Z',
        status: 'open',
        proposalCount: 7
      },
      {
        id: 'request-2',
        title: 'Decentralized Storage for Medical Records',
        description: 'Secure, HIPAA-compliant storage solution for patient medical records with encryption.',
        category: 'storage',
        requester: {
          id: 'user-2',
          name: 'HealthCare Pro',
          reputation: 4.8
        },
        budget: {
          min: 5000,
          max: 10000,
          currency: 'USD'
        },
        deadline: '2024-03-01T00:00:00Z',
        requirements: [
          'HIPAA compliance',
          'End-to-end encryption',
          'Audit trail capabilities',
          'Disaster recovery plan'
        ],
        tags: ['healthcare', 'hipaa', 'encryption', 'compliance'],
        createdAt: '2024-01-14T15:45:00Z',
        status: 'open',
        proposalCount: 3
      },
      {
        id: 'request-3',
        title: 'High-Performance Computing for Simulation',
        description: 'Need access to HPC cluster for running molecular dynamics simulations.',
        category: 'compute',
        requester: {
          id: 'user-3',
          name: 'Research Institute',
          reputation: 4.9
        },
        budget: {
          min: 800,
          max: 1200,
          currency: 'USD'
        },
        deadline: '2024-02-28T00:00:00Z',
        requirements: [
          'Minimum 100 CPU cores',
          'InfiniBand networking',
          'CUDA support preferred',
          'Job scheduling system'
        ],
        tags: ['hpc', 'simulation', 'molecular-dynamics', 'research'],
        createdAt: '2024-01-13T12:15:00Z',
        status: 'open',
        proposalCount: 12
      },
      {
        id: 'request-4',
        title: 'Smart Contract Gas Optimization',
        description: 'Optimize existing DeFi protocol smart contracts to reduce gas costs while maintaining security.',
        category: 'gas',
        requester: {
          id: 'user-4',
          name: 'DeFi Protocol',
          reputation: 4.7
        },
        budget: {
          min: 2,
          max: 5,
          currency: 'ETH'
        },
        deadline: '2024-02-20T00:00:00Z',
        requirements: [
          'Solidity expertise',
          'Gas optimization experience',
          'Security audit included',
          'Testnet deployment first'
        ],
        tags: ['defi', 'gas-optimization', 'solidity', 'ethereum'],
        createdAt: '2024-01-12T09:00:00Z',
        status: 'open',
        proposalCount: 15
      },
      {
        id: 'request-5',
        title: 'Blockchain Security Assessment',
        description: 'Comprehensive security review of multi-chain DeFi protocol before mainnet launch.',
        category: 'security',
        requester: {
          id: 'user-5',
          name: 'Multi-Chain DeFi',
          reputation: 4.5
        },
        budget: {
          min: 8000,
          max: 15000,
          currency: 'USD'
        },
        deadline: '2024-03-15T00:00:00Z',
        requirements: [
          'Multi-chain protocol experience',
          'Formal verification preferred',
          'Detailed vulnerability report',
          'Remediation support included'
        ],
        tags: ['security', 'defi', 'multi-chain', 'audit'],
        createdAt: '2024-01-11T14:20:00Z',
        status: 'open',
        proposalCount: 5
      },
      {
        id: 'request-6',
        title: 'Cross-Chain Bridge Development',
        description: 'Build secure bridge between Ethereum and Polygon for ERC-20 token transfers.',
        category: 'network',
        requester: {
          id: 'user-6',
          name: 'Token Project',
          reputation: 4.4
        },
        budget: {
          min: 10000,
          max: 20000,
          currency: 'USD'
        },
        deadline: '2024-04-01T00:00:00Z',
        requirements: [
          'Cross-chain bridge experience',
          'Smart contract development',
          'Security best practices',
          'Post-launch support'
        ],
        tags: ['cross-chain', 'bridge', 'ethereum', 'polygon'],
        createdAt: '2024-01-10T10:30:00Z',
        status: 'open',
        proposalCount: 8
      }
    ];

    // Apply filters
    let filteredRequests = mockRequests;
    
    if (category && category !== 'all') {
      filteredRequests = filteredRequests.filter(request => request.category === category);
    }
    
    if (search) {
      const searchLower = (search as string).toLowerCase();
      filteredRequests = filteredRequests.filter(request =>
        request.title.toLowerCase().includes(searchLower) ||
        request.description.toLowerCase().includes(searchLower) ||
        request.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    
    // Sort by most recent
    filteredRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    res.json(filteredRequests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch requests'
    });
  }
});

/**
 * Create a new service offering
 * POST /api/marketplace/services
 */
router.post('/services', requireAuth, async (req: Request, res: Response) => {
  try {
    const validatedData = createServiceSchema.parse(req.body);
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Create service offering
    const serviceId = `service-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newService = {
      id: serviceId,
      ...validatedData,
      provider: {
        id: user.id.toString(),
        name: user.username,
        reputation: user.reputationScore || 0,
        verified: user.emailVerified || false
      },
      availability: 'medium' as const,
      performanceMetrics: {
        uptime: 0,
        responseTime: 0,
        throughput: 0
      },
      createdAt: new Date().toISOString(),
      isApproved: false, // Requires admin approval
      totalOrders: 0,
      averageRating: 0
    };

    // In a real implementation, store in database
    // await storage.createServiceOffering(newService);

    res.status(201).json({
      success: true,
      data: newService,
      message: 'Service offering created successfully and submitted for approval'
    });
  } catch (error) {
    console.error('Error creating service:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service data',
        errors: error.errors
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create service offering'
    });
  }
});

/**
 * Create a new service request
 * POST /api/marketplace/requests
 */
router.post('/requests', requireAuth, async (req: Request, res: Response) => {
  try {
    const validatedData = createRequestSchema.parse(req.body);
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Validate budget
    if (validatedData.budget.min > validatedData.budget.max) {
      return res.status(400).json({
        success: false,
        message: 'Minimum budget cannot be greater than maximum budget'
      });
    }

    // Create service request
    const requestId = `request-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newRequest = {
      id: requestId,
      ...validatedData,
      requester: {
        id: user.id.toString(),
        name: user.username,
        reputation: user.reputationScore || 0
      },
      createdAt: new Date().toISOString(),
      status: 'open' as const,
      proposalCount: 0
    };

    // In a real implementation, store in database
    // await storage.createServiceRequest(newRequest);

    res.status(201).json({
      success: true,
      data: newRequest,
      message: 'Service request created successfully'
    });
  } catch (error) {
    console.error('Error creating request:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: error.errors
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create service request'
    });
  }
});

/**
 * Get user's service offerings
 * GET /api/marketplace/my-services
 */
router.get('/my-services', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // In a real implementation, fetch from database
    // const userServices = await storage.getUserServices(user.id);
    
    const userServices: any[] = []; // Mock empty array for now
    
    res.json({
      success: true,
      data: userServices
    });
  } catch (error) {
    console.error('Error fetching user services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user services'
    });
  }
});

/**
 * Get marketplace analytics
 * GET /api/marketplace/analytics
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    // Mock analytics data
    const analytics = {
      totalServices: 1234,
      activeProviders: 456,
      totalVolume: 89500,
      averageRating: 4.8,
      categoryDistribution: {
        compute: 25,
        storage: 20,
        ai: 30,
        gas: 10,
        security: 10,
        network: 5
      },
      monthlyGrowth: {
        services: 12,
        providers: 8,
        volume: 23,
        rating: 0.2
      }
    };
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

export default router;