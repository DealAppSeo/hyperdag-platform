import express from 'express';
import { requireAuth } from '../../middleware/auth-middleware';

const router = express.Router();

// Market Maker Orders storage (in production, this would be in database)
const marketMakerOrders = [
  {
    id: 'order-1',
    serviceType: 'chatgpt',
    orderType: 'buy',
    triggerPrice: 0.002,
    targetPrice: 0.0018,
    quantity: 100000,
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'order-2',
    serviceType: 'ethereum-gas',
    orderType: 'sell',
    triggerPrice: 25,
    targetPrice: 30,
    quantity: 5,
    status: 'filled',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    filledAt: new Date().toISOString(),
    filledPrice: 28.5,
  }
];

// Mock data for demonstration - in production, this would connect to real service APIs
const mockServiceAllocations = [
  // AI Chat Services
  {
    id: 'chatgpt-1',
    name: 'ChatGPT API',
    type: 'chatgpt',
    description: 'OpenAI GPT-4 API allocation',
    allocated_units: 1000000,
    used_units: 650000,
    available_units: 350000,
    unit_type: 'tokens',
    usage_percentage: 65,
    sharing_enabled: true,
    share_percentage: 70,
    min_price: 0.002,
    priority: 'high',
    hourly_rate: 12.50,
    referral_program: { available: false, commission: 0 }
  },
  {
    id: 'anthropic-1',
    name: 'Anthropic Claude',
    type: 'anthropic',
    description: 'Claude Sonnet API allocation',
    allocated_units: 500000,
    used_units: 310000,
    available_units: 190000,
    unit_type: 'tokens',
    usage_percentage: 62,
    sharing_enabled: true,
    share_percentage: 60,
    min_price: 0.003,
    priority: 'high',
    hourly_rate: 15.75,
    referral_program: { available: false, commission: 0 }
  },
  {
    id: 'perplexity-1',
    name: 'Perplexity API',
    type: 'perplexity',
    description: 'Real-time search and AI responses',
    allocated_units: 250000,
    used_units: 125000,
    available_units: 125000,
    unit_type: 'queries',
    usage_percentage: 50,
    sharing_enabled: true,
    share_percentage: 75,
    min_price: 0.004,
    priority: 'medium',
    hourly_rate: 18.25,
    referral_program: { available: false, commission: 0 }
  },
  {
    id: 'grok-1',
    name: 'Grok API',
    type: 'grok',
    description: 'xAI Grok model access',
    allocated_units: 300000,
    used_units: 180000,
    available_units: 120000,
    unit_type: 'tokens',
    usage_percentage: 60,
    sharing_enabled: true,
    share_percentage: 65,
    min_price: 0.0035,
    priority: 'medium',
    hourly_rate: 16.50,
    referral_program: { available: false, commission: 0 }
  },
  
  // AI Compute Services
  {
    id: 'huggingface-1',
    name: 'Hugging Face',
    type: 'huggingface',
    description: 'AI model hosting and inference',
    allocated_units: 500,
    used_units: 320,
    available_units: 180,
    unit_type: 'hours',
    usage_percentage: 64,
    sharing_enabled: true,
    share_percentage: 80,
    min_price: 0.25,
    priority: 'high',
    hourly_rate: 8.75,
    referral_program: { available: false, commission: 0 }
  },
  {
    id: 'replit-1',
    name: 'Replit',
    type: 'replit',
    description: 'Cloud development environment',
    allocated_units: 200,
    used_units: 150,
    available_units: 50,
    unit_type: 'hours',
    usage_percentage: 75,
    sharing_enabled: true,
    share_percentage: 60,
    min_price: 0.50,
    priority: 'medium',
    hourly_rate: 12.00,
    referral_program: { available: true, commission: 25 }
  },
  {
    id: 'runpod-1',
    name: 'RunPod',
    type: 'runpod',
    description: 'GPU cloud for AI workloads',
    allocated_units: 100,
    used_units: 45,
    available_units: 55,
    unit_type: 'hours',
    usage_percentage: 45,
    sharing_enabled: true,
    share_percentage: 85,
    min_price: 1.20,
    priority: 'high',
    hourly_rate: 25.50,
    referral_program: { available: true, commission: 15 }
  },
  
  // Web3 Services
  {
    id: 'graph-protocol-1',
    name: 'The Graph Protocol',
    type: 'graph-protocol',
    description: 'Indexing and query services',
    allocated_units: 10000,
    used_units: 4500,
    available_units: 5500,
    unit_type: 'queries',
    usage_percentage: 45,
    sharing_enabled: true,
    share_percentage: 80,
    min_price: 0.001,
    priority: 'medium',
    hourly_rate: 8.25,
    referral_program: { available: false, commission: 0 }
  },
  {
    id: 'moralis-1',
    name: 'Moralis',
    type: 'moralis',
    description: 'Web3 development platform and APIs',
    allocated_units: 50000,
    used_units: 18000,
    available_units: 32000,
    unit_type: 'requests',
    usage_percentage: 36,
    sharing_enabled: true,
    share_percentage: 75,
    min_price: 0.002,
    priority: 'medium',
    hourly_rate: 14.50,
    referral_program: { available: true, commission: 20 }
  },
  {
    id: 'alchemy-1',
    name: 'Alchemy',
    type: 'alchemy',
    description: 'Blockchain infrastructure and APIs',
    allocated_units: 100000,
    used_units: 42000,
    available_units: 58000,
    unit_type: 'requests',
    usage_percentage: 42,
    sharing_enabled: true,
    share_percentage: 70,
    min_price: 0.0015,
    priority: 'high',
    hourly_rate: 16.75,
    referral_program: { available: true, commission: 30 }
  },
  {
    id: 'thirdweb-1',
    name: 'Thirdweb',
    type: 'thirdweb',
    description: 'Smart contract development platform',
    allocated_units: 1000,
    used_units: 380,
    available_units: 620,
    unit_type: 'deployments',
    usage_percentage: 38,
    sharing_enabled: true,
    share_percentage: 65,
    min_price: 2.50,
    priority: 'medium',
    hourly_rate: 22.00,
    referral_program: { available: false, commission: 0 }
  },
  {
    id: 'infura-1',
    name: 'Infura',
    type: 'infura',
    description: 'Ethereum and IPFS infrastructure',
    allocated_units: 500000,
    used_units: 275000,
    available_units: 225000,
    unit_type: 'requests',
    usage_percentage: 55,
    sharing_enabled: true,
    share_percentage: 80,
    min_price: 0.0008,
    priority: 'high',
    hourly_rate: 18.25,
    referral_program: { available: true, commission: 25 }
  },
  
  // Infrastructure Services
  {
    id: 'bacalhau-1',
    name: 'Bacalhau Compute',
    type: 'bacalhau',
    description: 'Distributed compute resources',
    allocated_units: 100,
    used_units: 88,
    available_units: 12,
    unit_type: 'hours',
    usage_percentage: 88,
    sharing_enabled: false,
    share_percentage: 0,
    min_price: 0.50,
    priority: 'medium',
    hourly_rate: 0.00,
    referral_program: { available: false, commission: 0 }
  },
  {
    id: 'akash-1',
    name: 'Akash Network',
    type: 'akash',
    description: 'Decentralized cloud computing',
    allocated_units: 200,
    used_units: 95,
    available_units: 105,
    unit_type: 'hours',
    usage_percentage: 47.5,
    sharing_enabled: true,
    share_percentage: 85,
    min_price: 0.35,
    priority: 'high',
    hourly_rate: 14.75,
    referral_program: { available: false, commission: 0 }
  },
  {
    id: 'vercel-1',
    name: 'Vercel',
    type: 'vercel',
    description: 'Frontend deployment platform',
    allocated_units: 50,
    used_units: 28,
    available_units: 22,
    unit_type: 'deployments',
    usage_percentage: 56,
    sharing_enabled: true,
    share_percentage: 70,
    min_price: 5.00,
    priority: 'medium',
    hourly_rate: 35.00,
    referral_program: { available: true, commission: 35 }
  },
  {
    id: 'netlify-1',
    name: 'Netlify',
    type: 'netlify',
    description: 'Web development platform',
    allocated_units: 75,
    used_units: 45,
    available_units: 30,
    unit_type: 'deployments',
    usage_percentage: 60,
    sharing_enabled: true,
    share_percentage: 75,
    min_price: 4.50,
    priority: 'medium',
    hourly_rate: 28.50,
    referral_program: { available: true, commission: 30 }
  },
  {
    id: 'cloudflare-1',
    name: 'Cloudflare',
    type: 'cloudflare',
    description: 'CDN and security services',
    allocated_units: 1000000,
    used_units: 650000,
    available_units: 350000,
    unit_type: 'requests',
    usage_percentage: 65,
    sharing_enabled: true,
    share_percentage: 80,
    min_price: 0.0001,
    priority: 'high',
    hourly_rate: 12.25,
    referral_program: { available: true, commission: 20 }
  },
  {
    id: 'arweave-1',
    name: 'Arweave',
    type: 'arweave',
    description: 'Permanent data storage',
    allocated_units: 1000,
    used_units: 420,
    available_units: 580,
    unit_type: 'GB',
    usage_percentage: 42,
    sharing_enabled: true,
    share_percentage: 90,
    min_price: 0.15,
    priority: 'medium',
    hourly_rate: 8.90,
    referral_program: { available: false, commission: 0 }
  }
];

// Market demand data for supply/demand analytics
const mockMarketDemand = [
  {
    service_type: 'chatgpt',
    demand_status: 'high',
    supply_shortage: true,
    premium_multiplier: 1.3,
    current_supply: 85,
    current_demand: 120
  },
  {
    service_type: 'graph-protocol',
    demand_status: 'critical',
    supply_shortage: true,
    premium_multiplier: 1.6,
    current_supply: 45,
    current_demand: 95
  },
  {
    service_type: 'vercel',
    demand_status: 'balanced',
    supply_shortage: false,
    premium_multiplier: 1.0,
    current_supply: 78,
    current_demand: 72
  },
  {
    service_type: 'anthropic',
    demand_status: 'high',
    supply_shortage: true,
    premium_multiplier: 1.4,
    current_supply: 60,
    current_demand: 88
  },
  {
    service_type: 'bacalhau',
    demand_status: 'critical',
    supply_shortage: true,
    premium_multiplier: 1.8,
    current_supply: 25,
    current_demand: 70
  }
];

const mockArbitrageOpportunities = [
  {
    id: 'arb-1',
    serviceType: 'ChatGPT API Tokens',
    buyPrice: 0.0018,
    sellPrice: 0.0025,
    profit: 0.0007,
    profitMargin: 38.9,
    volume: 50000,
    risk: 'low',
    timeframe: '2-4 hours'
  },
  {
    id: 'arb-2',
    serviceType: 'Ethereum Gas',
    buyPrice: 1450.00,
    sellPrice: 1520.00,
    profit: 70.00,
    profitMargin: 4.8,
    volume: 0.1,
    risk: 'medium',
    timeframe: '30 minutes'
  },
  {
    id: 'arb-3',
    serviceType: 'Graph Protocol Queries',
    buyPrice: 0.0008,
    sellPrice: 0.0012,
    profit: 0.0004,
    profitMargin: 50.0,
    volume: 25000,
    risk: 'low',
    timeframe: '1-2 hours'
  },
  {
    id: 'arb-4',
    serviceType: 'Polygon Gas',
    buyPrice: 0.82,
    sellPrice: 0.89,
    profit: 0.07,
    profitMargin: 8.5,
    volume: 500,
    risk: 'medium',
    timeframe: '15 minutes'
  }
];

const mockAutomationSettings = {
  global_enabled: true,
  auto_arbitrage_enabled: true,
  max_risk_level: 'medium',
  min_profit_margin: 5.0,
  notification_preferences: {
    email: true,
    sms: false,
    push: true
  }
};

// Get user's service allocations
router.get('/allocations', requireAuth, async (req, res) => {
  try {
    // In production, this would fetch real data from connected services
    res.json(mockServiceAllocations);
  } catch (error) {
    console.error('Error fetching service allocations:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch service allocations' 
    });
  }
});

// Get current arbitrage opportunities
router.get('/arbitrage-opportunities', requireAuth, async (req, res) => {
  try {
    // In production, this would analyze real market data across services
    res.json(mockArbitrageOpportunities);
  } catch (error) {
    console.error('Error fetching arbitrage opportunities:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch arbitrage opportunities' 
    });
  }
});

// Get market demand data for supply/demand analytics
router.get('/market-demand', requireAuth, async (req, res) => {
  try {
    // In production, this would fetch real-time supply/demand data from service APIs
    res.json(mockMarketDemand);
  } catch (error) {
    console.error('Error fetching market demand data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch market demand data' 
    });
  }
});

// Get automation settings
router.get('/automation-settings', requireAuth, async (req, res) => {
  try {
    // In production, this would fetch user's saved settings from database
    res.json(mockAutomationSettings);
  } catch (error) {
    console.error('Error fetching automation settings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch automation settings' 
    });
  }
});

// Update automation settings
router.post('/update-automation', requireAuth, async (req, res) => {
  try {
    const { 
      service_id, 
      sharing_enabled, 
      share_percentage, 
      min_price, 
      priority,
      global_enabled 
    } = req.body;

    // In production, this would update the database and configure service APIs
    console.log('Updating automation settings:', {
      userId: req.user?.id,
      service_id,
      sharing_enabled,
      share_percentage,
      min_price,
      priority,
      global_enabled
    });

    // Simulate API calls to configure resource sharing
    if (service_id) {
      console.log(`Configuring service ${service_id} for user ${req.user?.id}`);
    }

    res.json({ 
      success: true, 
      message: 'Automation settings updated successfully' 
    });
  } catch (error) {
    console.error('Error updating automation settings:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update automation settings' 
    });
  }
});

// Execute arbitrage opportunity
router.post('/execute-arbitrage', requireAuth, async (req, res) => {
  try {
    const { opportunityId } = req.body;

    if (!opportunityId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Opportunity ID is required' 
      });
    }

    // In production, this would execute the actual arbitrage transaction
    console.log('Executing arbitrage opportunity:', {
      userId: req.user?.id,
      opportunityId,
      timestamp: new Date().toISOString()
    });

    // Simulate arbitrage execution
    const opportunity = mockArbitrageOpportunities.find(op => op.id === opportunityId);
    if (!opportunity) {
      return res.status(404).json({ 
        success: false, 
        message: 'Arbitrage opportunity not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Arbitrage opportunity executed successfully',
      data: {
        opportunityId,
        estimatedProfit: opportunity.profit,
        status: 'executing'
      }
    });
  } catch (error) {
    console.error('Error executing arbitrage:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to execute arbitrage opportunity' 
    });
  }
});

// Get resource sharing analytics
router.get('/analytics', requireAuth, async (req, res) => {
  try {
    const analytics = {
      totalEarnings: 127.43,
      activeShares: 8,
      arbitrageProfit: 43.21,
      successRate: 94.2,
      recentTransactions: [
        {
          id: 'tx-1',
          type: 'resource_share',
          service: 'ChatGPT API',
          amount: 12.50,
          timestamp: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'tx-2',
          type: 'arbitrage',
          service: 'Ethereum Gas',
          amount: 15.75,
          timestamp: new Date(Date.now() - 7200000).toISOString()
        }
      ],
      utilizationBreakdown: {
        'ChatGPT': 75,
        'Anthropic': 62,
        'Bacalhau': 88,
        'Graph Protocol': 45
      },
      earningsBreakdown: {
        'Resource Sharing': 84.32,
        'Arbitrage Trading': 43.21,
        'Gas Optimization': 23.15,
        'Service Reselling': 12.08
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

// Real-time price monitoring endpoint
router.get('/price-monitor', requireAuth, async (req, res) => {
  try {
    const priceData = {
      services: [
        {
          name: 'ChatGPT API',
          currentPrice: 0.002,
          marketPrice: 0.0025,
          spread: 25.0,
          trend: 'up'
        },
        {
          name: 'Ethereum Gas',
          currentPrice: 1450.00,
          marketPrice: 1520.00,
          spread: 4.8,
          trend: 'up'
        },
        {
          name: 'Polygon Gas',
          currentPrice: 0.82,
          marketPrice: 0.89,
          spread: 8.5,
          trend: 'stable'
        }
      ],
      lastUpdated: new Date().toISOString()
    };

    res.json({ 
      success: true, 
      data: priceData 
    });
  } catch (error) {
    console.error('Error fetching price monitor data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch price data' 
    });
  }
});

// Market Maker Orders endpoints
router.get('/market-maker-orders', requireAuth, async (req, res) => {
  try {
    // In production, this would fetch user's orders from database
    res.json(marketMakerOrders);
  } catch (error) {
    console.error('Error fetching market maker orders:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch market maker orders' 
    });
  }
});

router.post('/market-maker-orders', requireAuth, async (req, res) => {
  try {
    const { serviceType, orderType, triggerPrice, targetPrice, quantity, stopLoss, takeProfit } = req.body;
    
    // Validate required fields
    if (!serviceType || !orderType || !triggerPrice || !targetPrice || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Create new order
    const newOrder = {
      id: `order-${Date.now()}`,
      serviceType,
      orderType,
      triggerPrice: parseFloat(triggerPrice),
      targetPrice: parseFloat(targetPrice),
      quantity: parseInt(quantity),
      status: 'active',
      createdAt: new Date().toISOString(),
      ...(stopLoss && { stopLoss: parseFloat(stopLoss) }),
      ...(takeProfit && { takeProfit: parseFloat(takeProfit) })
    };

    // In production, this would be saved to database
    marketMakerOrders.push(newOrder);

    res.json({
      success: true,
      data: newOrder,
      message: 'Market maker order created successfully'
    });
  } catch (error) {
    console.error('Error creating market maker order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create market maker order' 
    });
  }
});

router.delete('/market-maker-orders/:orderId', requireAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const orderIndex = marketMakerOrders.findIndex(order => order.id === orderId);
    if (orderIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const order = marketMakerOrders[orderIndex];
    if (order.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel non-active order'
      });
    }

    // Mark order as cancelled
    order.status = 'cancelled';

    res.json({
      success: true,
      message: 'Order cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling market maker order:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cancel market maker order' 
    });
  }
});

export default router;