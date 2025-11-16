/**
 * Unified Infrastructure API Routes
 * 
 * Complete infrastructure services unified under consistent RESTful endpoints:
 * - Alchemy: Blockchain infrastructure (Web3 provider, NFTs, transactions)  
 * - Infura: Web3 gateway (multi-network blockchain access, IPFS)
 * - Pinata: IPFS pinning service (file storage, pin management)
 * - Twilio: Communication service (SMS, voice, phone numbers)
 * 
 * Features:
 * - Consistent error handling and response formatting
 * - Request validation with Zod schemas
 * - Rate limiting per service category
 * - Service health monitoring and failover
 * - Usage analytics and cost tracking
 */

import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import multer from 'multer';
import { 
  getAlchemyService, 
  initializeAlchemyService, 
  createAlchemyService,
  type TransactionRequest as AlchemyTransactionRequest,
  type WebhookConfig 
} from '../services/blockchain/alchemy-service.js';
import { 
  getInfuraService, 
  initializeInfuraService,
  createInfuraServiceForNetwork
} from '../services/blockchain/infura-service.js';
import { PinataService } from '../services/storage/pinata-service.js';
import { 
  getTwilioService, 
  initializeTwilioService,
  type SMSMessage,
  type VoiceCall 
} from '../services/twilio-service.js';

const router = Router();

// Configure multer for file uploads (Pinata)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit for IPFS uploads
  }
});

// ================= RATE LIMITING =================

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Rate limit exceeded" }
});

const blockchainLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute  
  max: 60, // 60 blockchain requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Blockchain rate limit exceeded" }
});

const storageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 storage requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Storage rate limit exceeded" }
});

const communicationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 communication requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Communication rate limit exceeded" }
});

// ================= VALIDATION SCHEMAS =================

const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');
const txHashSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash');
const networkSchema = z.enum(['mainnet', 'sepolia', 'polygon', 'polygon-mumbai', 'arbitrum', 'arbitrum-sepolia', 'optimism', 'optimism-sepolia']);
const phoneSchema = z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format');

const initBlockchainSchema = z.object({
  provider: z.enum(['alchemy', 'infura']),
  apiKey: z.string().min(1),
  network: networkSchema,
  projectId: z.string().optional()
});

const transactionSchema = z.object({
  to: addressSchema,
  value: z.string().optional(),
  data: z.string().optional(),
  gasLimit: z.string().optional(),
  gasPrice: z.string().optional(),
  privateKey: z.string().optional()
});

const smsSchema = z.object({
  to: phoneSchema,
  body: z.string().min(1).max(1600),
  from: phoneSchema.optional(),
  mediaUrl: z.array(z.string().url()).optional()
});

const voiceCallSchema = z.object({
  to: phoneSchema,
  from: phoneSchema.optional(),
  twiml: z.string().optional(),
  url: z.string().url().optional()
});

const pinataUploadSchema = z.object({
  name: z.string().optional(),
  keyvalues: z.record(z.union([z.string(), z.number()])).optional()
});

// ================= HELPER FUNCTIONS =================

function standardResponse<T>(success: boolean, data: T | null, message?: string, error?: any) {
  return {
    success,
    data,
    message,
    error: error ? { code: error.code || 'UNKNOWN_ERROR', message: error.message } : undefined,
    timestamp: new Date().toISOString()
  };
}

function handleServiceError(error: any, serviceName: string) {
  console.error(`[Infrastructure API] ${serviceName} error:`, error);
  return {
    code: error.code || `${serviceName.toUpperCase()}_ERROR`,
    message: error.message || `${serviceName} service error`
  };
}

// ================= GENERAL ENDPOINTS =================

/**
 * GET /api/infrastructure/status
 * Get status of all infrastructure services
 */
router.get('/status', generalLimiter, async (req: Request, res: Response) => {
  try {
    const status = {
      alchemy: { available: false, initialized: false },
      infura: { available: false, initialized: false },
      pinata: { available: false, initialized: false },
      twilio: { available: false, initialized: false }
    };

    // Check Alchemy - Don't initialize, just check if API key is available
    status.alchemy = {
      available: !!process.env.ALCHEMY_API_KEY,
      initialized: false,
      requiresConfig: !process.env.ALCHEMY_API_KEY,
      note: 'Use POST /api/infrastructure/blockchain/initialize to configure'
    };

    // Check Infura - Don't initialize, just check if API key is available
    status.infura = {
      available: !!process.env.INFURA_PROJECT_ID,
      initialized: false,
      requiresConfig: !process.env.INFURA_PROJECT_ID,
      note: 'Use POST /api/infrastructure/blockchain/initialize to configure'
    };

    // Check Pinata - Don't initialize, just check if API keys are available
    status.pinata = {
      available: !!(process.env.PINATA_API_KEY && process.env.PINATA_SECRET_API_KEY),
      initialized: false,
      requiresConfig: !(process.env.PINATA_API_KEY && process.env.PINATA_SECRET_API_KEY),
      note: 'Pinata can be used directly with proper API keys'
    };

    // Check Twilio - Don't initialize, just check if credentials are available
    status.twilio = {
      available: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
      initialized: false,
      requiresConfig: !(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
      note: 'Use POST /api/infrastructure/communication/initialize to configure'
    };

    res.json(standardResponse(true, status));
  } catch (error) {
    res.status(500).json(standardResponse(false, null, 'Failed to get infrastructure status', error));
  }
});

// ================= BLOCKCHAIN ENDPOINTS =================

/**
 * POST /api/infrastructure/blockchain/initialize
 * Initialize blockchain service (Alchemy or Infura)
 */
router.post('/blockchain/initialize', blockchainLimiter, async (req: Request, res: Response) => {
  try {
    const validation = initBlockchainSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(standardResponse(false, null, 'Invalid request data', validation.error));
    }

    const { provider, apiKey, network, projectId } = validation.data;

    let service: any;
    let stats: any;

    if (provider === 'alchemy') {
      service = initializeAlchemyService({ apiKey, network });
      stats = await service.getStats();
    } else if (provider === 'infura') {
      service = initializeInfuraService({ apiKey, network, projectId });
      stats = await service.getStats();
    }

    res.json(standardResponse(true, {
      provider,
      network,
      initialized: true,
      stats
    }, `${provider} service initialized successfully`));
  } catch (error) {
    res.status(500).json(standardResponse(false, null, 'Failed to initialize blockchain service', handleServiceError(error, 'blockchain')));
  }
});

/**
 * GET /api/infrastructure/blockchain/network
 * Get current network information
 */
router.get('/blockchain/network', blockchainLimiter, async (req: Request, res: Response) => {
  try {
    const { provider = 'alchemy' } = req.query;

    let networkInfo: any;

    try {
      if (provider === 'alchemy') {
        const service = getAlchemyService();
        if (service) {
          networkInfo = await service.getNetworkInfo();
          networkInfo.currentBlock = await service.getBlockNumber();
        } else {
          return res.status(400).json(standardResponse(false, null, 'Alchemy service not initialized'));
        }
      } else if (provider === 'infura') {
        const service = getInfuraService();
        if (service) {
          networkInfo = await service.getNetworkInfo();
          networkInfo.currentBlock = await service.getBlockNumber();
        } else {
          return res.status(400).json(standardResponse(false, null, 'Infura service not initialized'));
        }
      }
    } catch (serviceError) {
      return res.status(500).json(standardResponse(false, null, `${provider} service error`, serviceError));
    }

    res.json(standardResponse(true, networkInfo));
  } catch (error) {
    res.status(500).json(standardResponse(false, null, 'Failed to get network info', handleServiceError(error, 'blockchain')));
  }
});

/**
 * GET /api/infrastructure/blockchain/balance/:address
 * Get account balance
 */
router.get('/blockchain/balance/:address', blockchainLimiter, async (req: Request, res: Response) => {
  try {
    const addressValidation = addressSchema.safeParse(req.params.address);
    if (!addressValidation.success) {
      return res.status(400).json(standardResponse(false, null, 'Invalid Ethereum address'));
    }

    const { provider = 'alchemy' } = req.query;

    let balance: any;

    try {
      if (provider === 'alchemy') {
        const service = getAlchemyService();
        if (service) {
          balance = await service.getBalance(req.params.address);
        } else {
          return res.status(400).json(standardResponse(false, null, 'Alchemy service not initialized'));
        }
      } else if (provider === 'infura') {
        const service = getInfuraService();
        if (service) {
          balance = await service.getBalance(req.params.address);
        } else {
          return res.status(400).json(standardResponse(false, null, 'Infura service not initialized'));
        }
      }
    } catch (serviceError) {
      return res.status(500).json(standardResponse(false, null, `${provider} balance check failed`, serviceError));
    }

    res.json(standardResponse(true, balance));
  } catch (error) {
    res.status(500).json(standardResponse(false, null, 'Failed to get balance', handleServiceError(error, 'blockchain')));
  }
});

/**
 * GET /api/infrastructure/blockchain/transaction/:hash
 * Get transaction details
 */
router.get('/blockchain/transaction/:hash', blockchainLimiter, async (req: Request, res: Response) => {
  try {
    const hashValidation = txHashSchema.safeParse(req.params.hash);
    if (!hashValidation.success) {
      return res.status(400).json(standardResponse(false, null, 'Invalid transaction hash'));
    }

    const { provider = 'alchemy' } = req.query;

    let transaction: any;

    if (provider === 'alchemy') {
      const service = getAlchemyService();
      transaction = await service.getTransaction(req.params.hash);
    } else if (provider === 'infura') {
      const service = getInfuraService();
      transaction = await service.getTransaction(req.params.hash);
    }

    res.json(standardResponse(true, transaction));
  } catch (error) {
    res.status(500).json(standardResponse(false, null, 'Failed to get transaction', handleServiceError(error, 'blockchain')));
  }
});

/**
 * POST /api/infrastructure/blockchain/send-transaction
 * Send a transaction
 */
router.post('/blockchain/send-transaction', blockchainLimiter, async (req: Request, res: Response) => {
  try {
    const validation = transactionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(standardResponse(false, null, 'Invalid transaction data', validation.error));
    }

    const { provider = 'alchemy' } = req.query;
    const { privateKey, ...transaction } = validation.data;

    if (!privateKey) {
      return res.status(400).json(standardResponse(false, null, 'Private key is required'));
    }

    let result: any;

    if (provider === 'alchemy') {
      const service = getAlchemyService();
      result = await service.sendTransaction(privateKey, transaction);
    } else if (provider === 'infura') {
      const service = getInfuraService();
      result = await service.sendTransaction(privateKey, transaction);
    }

    res.json(standardResponse(true, result, 'Transaction sent successfully'));
  } catch (error) {
    res.status(500).json(standardResponse(false, null, 'Failed to send transaction', handleServiceError(error, 'blockchain')));
  }
});

/**
 * GET /api/infrastructure/blockchain/nfts/:owner
 * Get NFTs owned by an address (Alchemy only)
 */
router.get('/blockchain/nfts/:owner', blockchainLimiter, async (req: Request, res: Response) => {
  try {
    const addressValidation = addressSchema.safeParse(req.params.owner);
    if (!addressValidation.success) {
      return res.status(400).json(standardResponse(false, null, 'Invalid owner address'));
    }

    const service = getAlchemyService();
    const nfts = await service.getNFTsForOwner(req.params.owner);

    res.json(standardResponse(true, nfts));
  } catch (error) {
    res.status(500).json(standardResponse(false, null, 'Failed to get NFTs', handleServiceError(error, 'alchemy')));
  }
});

// ================= STORAGE ENDPOINTS =================

/**
 * POST /api/infrastructure/storage/upload
 * Upload file to IPFS via Pinata
 */
router.post('/storage/upload', storageLimiter, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const pinataService = new PinataService();
    
    if (!req.file) {
      return res.status(400).json(standardResponse(false, null, 'No file provided'));
    }

    const metadata = req.body.metadata ? JSON.parse(req.body.metadata) : {};
    
    const validation = pinataUploadSchema.safeParse(metadata);
    if (!validation.success) {
      return res.status(400).json(standardResponse(false, null, 'Invalid metadata', validation.error));
    }

    const result = await pinataService.uploadFile(req.file, {
      pinataMetadata: {
        name: validation.data.name || req.file.originalname,
        keyvalues: validation.data.keyvalues
      }
    });

    res.json(standardResponse(true, result, 'File uploaded successfully'));
  } catch (error) {
    res.status(500).json(standardResponse(false, null, 'Failed to upload file', handleServiceError(error, 'pinata')));
  }
});

/**
 * POST /api/infrastructure/storage/pin-json
 * Pin JSON data to IPFS
 */
router.post('/storage/pin-json', storageLimiter, async (req: Request, res: Response) => {
  try {
    const { data, metadata = {} } = req.body;
    
    if (!data) {
      return res.status(400).json(standardResponse(false, null, 'No JSON data provided'));
    }

    const validation = pinataUploadSchema.safeParse(metadata);
    if (!validation.success) {
      return res.status(400).json(standardResponse(false, null, 'Invalid metadata', validation.error));
    }

    const pinataService = new PinataService();
    const result = await pinataService.uploadJSON(data, {
      pinataMetadata: {
        name: validation.data.name || 'JSON Data',
        keyvalues: validation.data.keyvalues
      }
    });

    res.json(standardResponse(true, result, 'JSON pinned successfully'));
  } catch (error) {
    res.status(500).json(standardResponse(false, null, 'Failed to pin JSON', handleServiceError(error, 'pinata')));
  }
});

/**
 * GET /api/infrastructure/storage/pins
 * List pinned files
 */
router.get('/storage/pins', storageLimiter, async (req: Request, res: Response) => {
  try {
    const pinataService = new PinataService();
    const { limit = 10, offset = 0 } = req.query;
    
    const pins = await pinataService.getPinList({
      pageLimit: Math.min(parseInt(limit as string), 100),
      pageOffset: parseInt(offset as string)
    });

    res.json(standardResponse(true, pins));
  } catch (error) {
    res.status(500).json(standardResponse(false, null, 'Failed to get pins', handleServiceError(error, 'pinata')));
  }
});

/**
 * DELETE /api/infrastructure/storage/unpin/:hash
 * Unpin file from IPFS
 */
router.delete('/storage/unpin/:hash', storageLimiter, async (req: Request, res: Response) => {
  try {
    const { hash } = req.params;
    
    const pinataService = new PinataService();
    await pinataService.unpinByHash(hash);

    res.json(standardResponse(true, null, 'File unpinned successfully'));
  } catch (error) {
    res.status(500).json(standardResponse(false, null, 'Failed to unpin file', handleServiceError(error, 'pinata')));
  }
});

// ================= COMMUNICATION ENDPOINTS =================

/**
 * POST /api/infrastructure/communication/initialize
 * Initialize Twilio service
 */
router.post('/communication/initialize', communicationLimiter, async (req: Request, res: Response) => {
  try {
    const { accountSid, authToken, phoneNumber } = req.body;
    
    if (!accountSid || !authToken || !phoneNumber) {
      return res.status(400).json(standardResponse(false, null, 'Account SID, auth token, and phone number are required'));
    }

    const service = initializeTwilioService({ accountSid, authToken, phoneNumber });
    const stats = await service.getStats();

    res.json(standardResponse(true, {
      initialized: true,
      stats
    }, 'Twilio service initialized successfully'));
  } catch (error) {
    res.status(500).json(standardResponse(false, null, 'Failed to initialize Twilio service', handleServiceError(error, 'twilio')));
  }
});

/**
 * POST /api/infrastructure/communication/send-sms
 * Send SMS message
 */
router.post('/communication/send-sms', communicationLimiter, async (req: Request, res: Response) => {
  try {
    const validation = smsSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(standardResponse(false, null, 'Invalid SMS data', validation.error));
    }

    const service = getTwilioService();
    const result = await service.sendSMS(validation.data);

    res.json(standardResponse(true, result, 'SMS sent successfully'));
  } catch (error) {
    res.status(500).json(standardResponse(false, null, 'Failed to send SMS', handleServiceError(error, 'twilio')));
  }
});

/**
 * POST /api/infrastructure/communication/make-call
 * Make voice call
 */
router.post('/communication/make-call', communicationLimiter, async (req: Request, res: Response) => {
  try {
    const validation = voiceCallSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json(standardResponse(false, null, 'Invalid call data', validation.error));
    }

    const service = getTwilioService();
    const result = await service.makeCall(validation.data);

    res.json(standardResponse(true, result, 'Call initiated successfully'));
  } catch (error) {
    res.status(500).json(standardResponse(false, null, 'Failed to make call', handleServiceError(error, 'twilio')));
  }
});

/**
 * GET /api/infrastructure/communication/messages
 * Get message history
 */
router.get('/communication/messages', communicationLimiter, async (req: Request, res: Response) => {
  try {
    const { limit = 20, from, to } = req.query;
    
    const service = getTwilioService();
    const messages = await service.getMessageHistory({
      limit: Math.min(parseInt(limit as string), 100),
      from: from as string,
      to: to as string
    });

    res.json(standardResponse(true, messages));
  } catch (error) {
    res.status(500).json(standardResponse(false, null, 'Failed to get messages', handleServiceError(error, 'twilio')));
  }
});

/**
 * GET /api/infrastructure/communication/calls
 * Get call history
 */
router.get('/communication/calls', communicationLimiter, async (req: Request, res: Response) => {
  try {
    const { limit = 20, from, to } = req.query;
    
    const service = getTwilioService();
    const calls = await service.getCallHistory({
      limit: Math.min(parseInt(limit as string), 100),
      from: from as string,
      to: to as string
    });

    res.json(standardResponse(true, calls));
  } catch (error) {
    res.status(500).json(standardResponse(false, null, 'Failed to get calls', handleServiceError(error, 'twilio')));
  }
});

/**
 * GET /api/infrastructure/analytics
 * Get infrastructure usage analytics
 */
router.get('/analytics', generalLimiter, async (req: Request, res: Response) => {
  try {
    const analytics = {
      timestamp: new Date().toISOString(),
      services: {
        alchemy: { requestCount: 0, errorCount: 0, avgResponseTime: 0 },
        infura: { requestCount: 0, errorCount: 0, avgResponseTime: 0 },
        pinata: { requestCount: 0, errorCount: 0, avgResponseTime: 0 },
        twilio: { requestCount: 0, errorCount: 0, avgResponseTime: 0 }
      },
      totalRequests: 0,
      totalErrors: 0,
      uptime: process.uptime()
    };

    // Try to get stats from each service
    try {
      const alchemyService = getAlchemyService();
      const alchemyStats = await alchemyService.getStats();
      analytics.services.alchemy = {
        requestCount: alchemyStats.requestCount || 0,
        errorCount: alchemyStats.errorCount || 0,
        avgResponseTime: alchemyStats.avgResponseTime || 0
      };
    } catch (error) {
      // Service not initialized
    }

    try {
      const infuraService = getInfuraService();
      const infuraStats = await infuraService.getStats();
      analytics.services.infura = {
        requestCount: infuraStats.requestCount || 0,
        errorCount: infuraStats.errorCount || 0,
        avgResponseTime: infuraStats.avgResponseTime || 0
      };
    } catch (error) {
      // Service not initialized
    }

    try {
      const pinataService = new PinataService();
      const pinataStats = await pinataService.getStats();
      analytics.services.pinata = {
        requestCount: pinataStats.totalUploads || 0,
        errorCount: pinataStats.errors || 0,
        avgResponseTime: pinataStats.avgUploadTime || 0
      };
    } catch (error) {
      // Service not initialized
    }

    try {
      const twilioService = getTwilioService();
      const twilioStats = await twilioService.getStats();
      analytics.services.twilio = {
        requestCount: twilioStats.totalMessages + twilioStats.totalCalls || 0,
        errorCount: twilioStats.errors || 0,
        avgResponseTime: twilioStats.avgResponseTime || 0
      };
    } catch (error) {
      // Service not initialized
    }

    // Calculate totals
    analytics.totalRequests = Object.values(analytics.services).reduce((sum, service) => sum + service.requestCount, 0);
    analytics.totalErrors = Object.values(analytics.services).reduce((sum, service) => sum + service.errorCount, 0);

    res.json(standardResponse(true, analytics));
  } catch (error) {
    res.status(500).json(standardResponse(false, null, 'Failed to get analytics', error));
  }
});

export default router;