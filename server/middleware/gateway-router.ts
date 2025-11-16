/**
 * Smart Gateway Router for HyperDAG API Migration
 * Routes APIs to optimal gateways: Zuplo (AI/Web2) or Infura (Web3)
 */

import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { infuraService } from '../services/infura-service';

// Gateway configuration
const GATEWAY_CONFIG = {
  ZUPLO: {
    baseUrl: 'https://defuzzyai-main-0a6b719.d2.zuplo.dev',
    apiKey: process.env.ZUPLO_API_KEY || 'ai-symphony-master-key',
    timeout: 30000
  },
  INFURA: {
    baseUrl: 'https://mainnet.infura.io/v3/',
    projectId: process.env.INFURA_PROJECT_ID || 'your-infura-project-id',
    projectSecret: process.env.INFURA_PROJECT_SECRET || 'your-infura-secret',
    timeout: 30000
  }
};

// Route classification function
export function routeAPIRequest(endpoint: string): 'ZUPLO' | 'INFURA' | 'LOCAL' {
  console.log(`[Gateway Router] Analyzing endpoint: ${endpoint}`);
  
  // Web3 APIs → Infura Gateway
  if (endpoint.match(/\/(web3|ethereum|polygon|blockchain|ipfs|wallet|zkp|sbt|smart-contracts|transactions)\//)) {
    console.log(`[Gateway Router] → INFURA (Web3 service)`);
    return 'INFURA';
  }
  
  // AI/ML APIs → Zuplo Gateway
  if (endpoint.match(/\/(ai|chat|inference|prompt|anfis|voice)\//)) {
    console.log(`[Gateway Router] → ZUPLO (AI service)`);
    return 'ZUPLO';
  }
  
  // User/Auth/Data APIs → Zuplo Gateway (better analytics)
  if (endpoint.match(/\/(auth|user|purposes|grants|projects|hackathons|nonprofits)\//)) {
    console.log(`[Gateway Router] → ZUPLO (Data service with analytics)`);
    return 'ZUPLO';
  }
  
  // Keep complex integrated APIs local for now
  console.log(`[Gateway Router] → LOCAL (Integrated service)`);
  return 'LOCAL';
}

// Zuplo request handler
async function handleZuploRequest(req: Request, res: Response) {
  try {
    const endpoint = req.path.replace('/api/', '');
    
    // Map HyperDAG endpoints to Zuplo endpoints
    let zuploEndpoint = endpoint;
    
    // AI service mappings
    if (endpoint.startsWith('ai/') || endpoint.startsWith('chat/') || endpoint.startsWith('inference/')) {
      zuploEndpoint = `v1/${endpoint}`;
    }
    
    // Auth service mappings
    if (endpoint.startsWith('auth/')) {
      zuploEndpoint = `auth/${endpoint.substring(5)}`;
    }
    
    // Data service mappings
    if (endpoint.startsWith('grants') || endpoint.startsWith('projects')) {
      zuploEndpoint = `data/${endpoint}`;
    }
    
    const zuploUrl = `${GATEWAY_CONFIG.ZUPLO.baseUrl}/${zuploEndpoint}`;
    
    console.log(`[Zuplo] ${req.method} ${zuploUrl}`);
    
    const response = await axios({
      method: req.method.toLowerCase() as any,
      url: zuploUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': GATEWAY_CONFIG.ZUPLO.apiKey,
        'User-Agent': 'HyperDAG/1.0'
      },
      data: req.body,
      timeout: GATEWAY_CONFIG.ZUPLO.timeout
    });
    
    // Forward response
    res.status(response.status).json(response.data);
    
    console.log(`[Zuplo] ✅ ${response.status} - ${response.data?.success ? 'Success' : 'Response'}`);
    
  } catch (error: any) {
    console.error(`[Zuplo] ❌ Error:`, error.message);
    
    // Provide helpful error response
    if (error.response) {
      res.status(error.response.status).json({
        success: false,
        message: 'Gateway error',
        gateway: 'zuplo',
        details: error.response.data
      });
    } else {
      res.status(503).json({
        success: false,
        message: 'Gateway unavailable',
        gateway: 'zuplo'
      });
    }
  }
}

// Infura request handler using InfuraService
async function handleInfuraRequest(req: Request, res: Response) {
  try {
    const endpoint = req.path.replace('/api/', '');
    console.log(`[Infura Gateway] Processing: ${req.method} ${endpoint}`);
    
    // Route to appropriate Infura service method
    let result;
    
    if (endpoint.startsWith('web3/') || endpoint.startsWith('ethereum/')) {
      // Ethereum operations
      const method = req.body?.method || 'eth_blockNumber';
      const params = req.body?.params || [];
      const network = req.query?.network as string || 'mainnet';
      
      result = await infuraService.ethereumCall(method, params, network);
      
    } else if (endpoint.startsWith('polygon/')) {
      // Polygon operations (including zkEVM)
      const method = req.body?.method || 'eth_blockNumber';
      const params = req.body?.params || [];
      const network = req.query?.network as string || req.body?.network || 'zkevmCardona'; // Default to zkEVM Cardona testnet
      
      result = await infuraService.polygonCall(method, params, network);
      
    } else if (endpoint.startsWith('ipfs/')) {
      // IPFS operations
      const operation = endpoint.substring(5); // Remove 'ipfs/'
      
      if (req.method === 'POST' && operation === 'upload') {
        // File upload
        const data = req.body?.data || req.body;
        const filename = req.body?.filename;
        
        result = await infuraService.ipfsUpload(data, filename);
        
      } else if (req.method === 'GET' && operation.startsWith('retrieve/')) {
        // File retrieval
        const hash = operation.substring(9); // Remove 'retrieve/'
        result = await infuraService.ipfsRetrieve(hash);
        
      } else {
        result = {
          success: false,
          error: `Unsupported IPFS operation: ${operation}`,
          provider: 'infura-ipfs'
        };
      }
      
    } else if (endpoint.startsWith('smart-contracts/')) {
      // Smart contract operations
      const operation = endpoint.substring(16); // Remove 'smart-contracts/'
      
      if (operation === 'deploy') {
        const { bytecode, abi, constructorParams, network } = req.body;
        result = await infuraService.deployContract(bytecode, abi, constructorParams, network);
      } else {
        result = {
          success: false,
          error: `Unsupported contract operation: ${operation}`,
          provider: 'infura'
        };
      }
      
    } else if (endpoint.startsWith('transactions/')) {
      // Transaction operations
      const operation = endpoint.substring(13); // Remove 'transactions/'
      
      if (operation === 'send') {
        const { transaction, network } = req.body;
        result = await infuraService.sendTransaction(transaction, network);
      } else if (operation === 'receipt') {
        const { txHash, network } = req.body;
        result = await infuraService.getTransactionReceipt(txHash, network);
      } else {
        result = {
          success: false,
          error: `Unsupported transaction operation: ${operation}`,
          provider: 'infura'
        };
      }
      
    } else {
      // Generic Web3 operation
      const method = req.body?.method || 'eth_blockNumber';
      const params = req.body?.params || [];
      result = await infuraService.ethereumCall(method, params);
    }
    
    // Send response
    if (result.success) {
      res.json(result);
      console.log(`[Infura Gateway] ✅ ${endpoint} - Success`);
    } else {
      res.status(500).json(result);
      console.log(`[Infura Gateway] ❌ ${endpoint} - ${result.error}`);
    }
    
  } catch (error: any) {
    console.error(`[Infura Gateway] ❌ Unexpected error:`, error.message);
    
    res.status(503).json({
      success: false,
      message: 'Infura gateway error',
      gateway: 'infura',
      error: error.message
    });
  }
}

// Gateway routing middleware
export function gatewayRouter(req: Request, res: Response, next: NextFunction) {
  const route = routeAPIRequest(req.path);
  
  // Add routing info to request for logging
  (req as any).gatewayRoute = route;
  
  switch (route) {
    case 'ZUPLO':
      return handleZuploRequest(req, res);
    
    case 'INFURA':
      return handleInfuraRequest(req, res);
    
    case 'LOCAL':
    default:
      // Continue to local handlers
      next();
      break;
  }
}

// Gateway health check
export async function checkGatewayHealth() {
  const results = {
    zuplo: { status: 'unknown', responseTime: 0, services: [] },
    infura: { status: 'unknown', responseTime: 0, services: [] }
  };
  
  // Test Zuplo
  try {
    const start = Date.now();
    await axios.get(`${GATEWAY_CONFIG.ZUPLO.baseUrl}/health`, {
      headers: { 'X-API-Key': GATEWAY_CONFIG.ZUPLO.apiKey },
      timeout: 5000
    });
    results.zuplo = {
      status: 'healthy',
      responseTime: Date.now() - start,
      services: ['ai', 'auth', 'data']
    };
  } catch (error) {
    results.zuplo.status = 'unhealthy';
  }
  
  // Test Infura using InfuraService
  try {
    const start = Date.now();
    const infuraHealth = await infuraService.healthCheck();
    const healthyServices = Object.keys(infuraHealth.services).filter(key => (infuraHealth.services as any)[key]);
    results.infura = {
      status: infuraHealth.overall ? 'healthy' : 'partial',
      responseTime: Date.now() - start,
      services: healthyServices
    };
  } catch (error) {
    results.infura.status = 'unhealthy';
  }
  
  return results;
}

// Gateway usage statistics
export function getGatewayStats() {
  const infuraStatus = infuraService.getStatus();
  
  return {
    zuplo: {
      endpoints: ['ai', 'auth', 'user', 'data'],
      costSavings: '60-90%',
      features: ['ANFIS routing', 'Analytics', 'Rate limiting'],
      status: 'configured'
    },
    infura: {
      endpoints: ['web3', 'ipfs', 'blockchain'],
      costSavings: '60-80%', 
      features: ['Multi-chain', 'IPFS', 'Reliable infrastructure'],
      status: infuraStatus.configured ? 'configured' : 'pending-credentials',
      services: infuraStatus.services
    },
    migration: {
      status: 'active',
      totalCostSavings: '50%+',
      architecture: 'Hybrid Zuplo + Infura'
    }
  };
}