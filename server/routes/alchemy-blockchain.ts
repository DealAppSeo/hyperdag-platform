/**
 * Alchemy Blockchain API Routes
 * 
 * RESTful API endpoints for Alchemy blockchain infrastructure service
 * Provides access to Web3 provider, transaction monitoring, NFT APIs, and enhanced features
 */

import { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { 
  getAlchemyService, 
  initializeAlchemyService, 
  createAlchemyService,
  type TransactionRequest,
  type WebhookConfig 
} from '../services/blockchain/alchemy-service.js';

const router = Router();

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later" }
});

const transactionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 transactions per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many transaction requests, please try again later" }
});

// Validation schemas
const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');
const txHashSchema = z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash');
const networkSchema = z.enum(['mainnet', 'sepolia', 'polygon', 'polygon-mumbai', 'arbitrum', 'arbitrum-sepolia', 'optimism', 'optimism-sepolia']);

const transactionRequestSchema = z.object({
  to: addressSchema,
  value: z.string().optional(),
  data: z.string().optional(),
  gasLimit: z.string().optional(),
  gasPrice: z.string().optional(),
  maxFeePerGas: z.string().optional(),
  maxPriorityFeePerGas: z.string().optional(),
  nonce: z.number().optional()
});

/**
 * GET /api/alchemy/status
 * Get service status and statistics
 */
router.get('/status', generalLimiter, async (req: Request, res: Response) => {
  try {
    const service = getAlchemyService();
    const stats = await service.getStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('[Alchemy API] Status check failed:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get service status'
    });
  }
});

/**
 * POST /api/alchemy/initialize
 * Initialize or update Alchemy service configuration
 */
router.post('/initialize', generalLimiter, async (req: Request, res: Response) => {
  try {
    const { apiKey, network, connectionName } = req.body;
    
    if (!apiKey || !network) {
      return res.status(400).json({
        success: false,
        message: 'API key and network are required'
      });
    }

    const networkValidation = networkSchema.safeParse(network);
    if (!networkValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid network specified',
        validNetworks: ['mainnet', 'sepolia', 'polygon', 'polygon-mumbai', 'arbitrum', 'arbitrum-sepolia', 'optimism', 'optimism-sepolia']
      });
    }

    const service = initializeAlchemyService({
      apiKey,
      network,
      connectionName
    });

    const stats = await service.getStats();
    
    res.json({
      success: true,
      message: 'Alchemy service initialized successfully',
      data: stats
    });
  } catch (error) {
    console.error('[Alchemy API] Initialization failed:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to initialize service'
    });
  }
});

/**
 * GET /api/alchemy/network
 * Get network information
 */
router.get('/network', generalLimiter, async (req: Request, res: Response) => {
  try {
    const service = getAlchemyService();
    const networkInfo = await service.getNetworkInfo();
    const blockNumber = await service.getBlockNumber();
    
    res.json({
      success: true,
      data: {
        ...networkInfo,
        currentBlock: blockNumber
      }
    });
  } catch (error) {
    console.error('[Alchemy API] Network info failed:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get network information'
    });
  }
});

/**
 * POST /api/alchemy/switch-network
 * Switch to a different network
 */
router.post('/switch-network', generalLimiter, async (req: Request, res: Response) => {
  try {
    const { network } = req.body;
    
    const networkValidation = networkSchema.safeParse(network);
    if (!networkValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid network specified'
      });
    }

    const service = getAlchemyService();
    await service.switchNetwork(network);
    
    const networkInfo = await service.getNetworkInfo();
    
    res.json({
      success: true,
      message: `Switched to ${network} network`,
      data: networkInfo
    });
  } catch (error) {
    console.error('[Alchemy API] Network switch failed:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to switch network'
    });
  }
});

/**
 * GET /api/alchemy/balance/:address
 * Get account balance
 */
router.get('/balance/:address', generalLimiter, async (req: Request, res: Response) => {
  try {
    const addressValidation = addressSchema.safeParse(req.params.address);
    if (!addressValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Ethereum address'
      });
    }

    const service = getAlchemyService();
    const balance = await service.getBalance(req.params.address);
    
    res.json({
      success: true,
      data: balance
    });
  } catch (error) {
    console.error('[Alchemy API] Balance check failed:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get balance'
    });
  }
});

/**
 * GET /api/alchemy/transaction/:hash
 * Get transaction details
 */
router.get('/transaction/:hash', generalLimiter, async (req: Request, res: Response) => {
  try {
    const hashValidation = txHashSchema.safeParse(req.params.hash);
    if (!hashValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction hash'
      });
    }

    const service = getAlchemyService();
    const transaction = await service.getTransaction(req.params.hash);
    
    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('[Alchemy API] Transaction fetch failed:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get transaction'
    });
  }
});

/**
 * GET /api/alchemy/receipt/:hash
 * Get transaction receipt
 */
router.get('/receipt/:hash', generalLimiter, async (req: Request, res: Response) => {
  try {
    const hashValidation = txHashSchema.safeParse(req.params.hash);
    if (!hashValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction hash'
      });
    }

    const service = getAlchemyService();
    const receipt = await service.getTransactionReceipt(req.params.hash);
    
    res.json({
      success: true,
      data: receipt
    });
  } catch (error) {
    console.error('[Alchemy API] Receipt fetch failed:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get transaction receipt'
    });
  }
});

/**
 * POST /api/alchemy/send-transaction
 * Send a transaction
 */
router.post('/send-transaction', transactionLimiter, async (req: Request, res: Response) => {
  try {
    const { privateKey, transaction } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({
        success: false,
        message: 'Private key is required'
      });
    }

    const txValidation = transactionRequestSchema.safeParse(transaction);
    if (!txValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction data',
        errors: txValidation.error.errors
      });
    }

    const service = getAlchemyService();
    const result = await service.sendTransaction(privateKey, transaction);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[Alchemy API] Transaction send failed:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to send transaction'
    });
  }
});

/**
 * POST /api/alchemy/estimate-gas
 * Estimate gas for a transaction
 */
router.post('/estimate-gas', generalLimiter, async (req: Request, res: Response) => {
  try {
    const { to, value, data, from } = req.body;
    
    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Destination address is required'
      });
    }

    const addressValidation = addressSchema.safeParse(to);
    if (!addressValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid destination address'
      });
    }

    const service = getAlchemyService();
    const gasEstimate = await service.estimateGas({ to, value, data, from });
    
    res.json({
      success: true,
      data: {
        gasEstimate
      }
    });
  } catch (error) {
    console.error('[Alchemy API] Gas estimation failed:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to estimate gas'
    });
  }
});

/**
 * GET /api/alchemy/gas-price
 * Get current gas price
 */
router.get('/gas-price', generalLimiter, async (req: Request, res: Response) => {
  try {
    const service = getAlchemyService();
    const gasPrice = await service.getGasPrice();
    
    res.json({
      success: true,
      data: gasPrice
    });
  } catch (error) {
    console.error('[Alchemy API] Gas price fetch failed:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get gas price'
    });
  }
});

// NFT API Endpoints

/**
 * GET /api/alchemy/nfts/:owner
 * Get NFTs owned by an address
 */
router.get('/nfts/:owner', generalLimiter, async (req: Request, res: Response) => {
  try {
    const addressValidation = addressSchema.safeParse(req.params.owner);
    if (!addressValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid owner address'
      });
    }

    const { 
      contractAddresses, 
      excludeFilters, 
      includeFilters, 
      pageKey, 
      pageSize 
    } = req.query;

    const options: any = {};
    if (contractAddresses) options.contractAddresses = (contractAddresses as string).split(',');
    if (excludeFilters) options.excludeFilters = (excludeFilters as string).split(',');
    if (includeFilters) options.includeFilters = (includeFilters as string).split(',');
    if (pageKey) options.pageKey = pageKey as string;
    if (pageSize) options.pageSize = parseInt(pageSize as string);

    const service = getAlchemyService();
    const nfts = await service.getNFTsForOwner(req.params.owner, options);
    
    res.json({
      success: true,
      data: nfts
    });
  } catch (error) {
    console.error('[Alchemy API] NFTs fetch failed:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get NFTs'
    });
  }
});

/**
 * GET /api/alchemy/nft/:contract/:tokenId
 * Get NFT metadata
 */
router.get('/nft/:contract/:tokenId', generalLimiter, async (req: Request, res: Response) => {
  try {
    const addressValidation = addressSchema.safeParse(req.params.contract);
    if (!addressValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contract address'
      });
    }

    const { tokenId } = req.params;
    const refreshCache = req.query.refresh === 'true';

    const service = getAlchemyService();
    const nft = await service.getNFTMetadata(req.params.contract, tokenId, refreshCache);
    
    res.json({
      success: true,
      data: nft
    });
  } catch (error) {
    console.error('[Alchemy API] NFT metadata fetch failed:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get NFT metadata'
    });
  }
});

/**
 * GET /api/alchemy/collection/:contract
 * Get NFT collection metadata
 */
router.get('/collection/:contract', generalLimiter, async (req: Request, res: Response) => {
  try {
    const addressValidation = addressSchema.safeParse(req.params.contract);
    if (!addressValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contract address'
      });
    }

    const service = getAlchemyService();
    const collection = await service.getCollectionMetadata(req.params.contract);
    
    res.json({
      success: true,
      data: collection
    });
  } catch (error) {
    console.error('[Alchemy API] Collection metadata fetch failed:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get collection metadata'
    });
  }
});

/**
 * GET /api/alchemy/is-nft/:contract
 * Check if contract is an NFT
 */
router.get('/is-nft/:contract', generalLimiter, async (req: Request, res: Response) => {
  try {
    const addressValidation = addressSchema.safeParse(req.params.contract);
    if (!addressValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contract address'
      });
    }

    const service = getAlchemyService();
    const isNft = await service.isNftContract(req.params.contract);
    
    res.json({
      success: true,
      data: {
        isNft
      }
    });
  } catch (error) {
    console.error('[Alchemy API] NFT contract check failed:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to check NFT contract'
    });
  }
});

// Enhanced API Endpoints

/**
 * GET /api/alchemy/transactions/:address
 * Get address transaction history
 */
router.get('/transactions/:address', generalLimiter, async (req: Request, res: Response) => {
  try {
    const addressValidation = addressSchema.safeParse(req.params.address);
    if (!addressValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address'
      });
    }

    const { 
      fromBlock, 
      toBlock, 
      category, 
      withMetadata, 
      excludeZeroValue, 
      maxCount, 
      pageKey 
    } = req.query;

    const options: any = {};
    if (fromBlock) options.fromBlock = parseInt(fromBlock as string);
    if (toBlock) options.toBlock = parseInt(toBlock as string);
    if (category) options.category = (category as string).split(',');
    if (withMetadata) options.withMetadata = withMetadata === 'true';
    if (excludeZeroValue) options.excludeZeroValue = excludeZeroValue === 'true';
    if (maxCount) options.maxCount = parseInt(maxCount as string);
    if (pageKey) options.pageKey = pageKey as string;

    const service = getAlchemyService();
    const transactions = await service.getAddressTransactions(req.params.address, options);
    
    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('[Alchemy API] Address transactions fetch failed:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get address transactions'
    });
  }
});

/**
 * GET /api/alchemy/token-balances/:address
 * Get token balances for an address
 */
router.get('/token-balances/:address', generalLimiter, async (req: Request, res: Response) => {
  try {
    const addressValidation = addressSchema.safeParse(req.params.address);
    if (!addressValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid address'
      });
    }

    const { contractAddresses } = req.query;
    const contracts = contractAddresses ? (contractAddresses as string).split(',') : undefined;

    const service = getAlchemyService();
    const balances = await service.getTokenBalances(req.params.address, contracts);
    
    res.json({
      success: true,
      data: balances
    });
  } catch (error) {
    console.error('[Alchemy API] Token balances fetch failed:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get token balances'
    });
  }
});

/**
 * GET /api/alchemy/token-metadata/:contract
 * Get token metadata
 */
router.get('/token-metadata/:contract', generalLimiter, async (req: Request, res: Response) => {
  try {
    const addressValidation = addressSchema.safeParse(req.params.contract);
    if (!addressValidation.success) {
      return res.status(400).json({
        success: false,
        message: 'Invalid contract address'
      });
    }

    const service = getAlchemyService();
    const metadata = await service.getTokenMetadata(req.params.contract);
    
    res.json({
      success: true,
      data: metadata
    });
  } catch (error) {
    console.error('[Alchemy API] Token metadata fetch failed:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to get token metadata'
    });
  }
});

/**
 * POST /api/alchemy/create-light-account
 * Create a smart wallet (light account)
 */
router.post('/create-light-account', transactionLimiter, async (req: Request, res: Response) => {
  try {
    const { privateKey } = req.body;
    
    if (!privateKey) {
      return res.status(400).json({
        success: false,
        message: 'Private key is required'
      });
    }

    const service = getAlchemyService();
    const lightAccount = await service.createLightAccount(privateKey);
    
    res.json({
      success: true,
      data: {
        address: await lightAccount.getAddress(),
        entryPointAddress: await lightAccount.getEntryPointAddress(),
        factoryAddress: await lightAccount.getFactoryAddress()
      }
    });
  } catch (error) {
    console.error('[Alchemy API] Light account creation failed:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create light account'
    });
  }
});

export default router;