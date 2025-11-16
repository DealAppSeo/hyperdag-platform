import { Router, Request, Response, NextFunction } from 'express';
import { moralisService } from '../../services/moralis-service';
import { formatResponse, sendSuccess, sendError } from '../../utils/api-response';
import { asyncHandler, authErrorHandler, createApiError } from '../../utils/error-handler';

export const moralisRouter = Router();

// Middleware to check if user is authenticated
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    throw authErrorHandler('Authentication required to access blockchain data');
  }
  next();
};

// Helper function to validate blockchain address
const validateAddress = (address: string) => {
  if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw createApiError('Invalid wallet address format', 400, 'INVALID_ADDRESS');
  }
};

// Get wallet balance
moralisRouter.get('/balance/:address', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  const { chain = 'eth' } = req.query;
  
  try {
    validateAddress(address);
    const balance = await moralisService.getNativeBalance(address, chain as string);
    sendSuccess(res, { balance });
  } catch (error: any) {
    if (error.status || error.statusCode) throw error;
    console.error('Error fetching wallet balance:', error);
    throw createApiError(
      error.message || 'Failed to fetch wallet balance', 
      500, 
      'BLOCKCHAIN_ERROR'
    );
  }
}));

// Get token balances
moralisRouter.get('/tokens/:address', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  const { chain = 'eth' } = req.query;
  
  try {
    validateAddress(address);
    const tokens = await moralisService.getTokenBalances(address, chain as string);
    sendSuccess(res, { tokens });
  } catch (error: any) {
    if (error.status || error.statusCode) throw error;
    console.error('Error fetching token balances:', error);
    throw createApiError(
      error.message || 'Failed to fetch token balances', 
      500, 
      'BLOCKCHAIN_ERROR'
    );
  }
}));

// Get NFTs
moralisRouter.get('/nfts/:address', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  const { chain = 'eth' } = req.query;
  
  try {
    validateAddress(address);
    const nfts = await moralisService.getNFTs(address, chain as string);
    sendSuccess(res, { nfts });
  } catch (error: any) {
    if (error.status || error.statusCode) throw error;
    console.error('Error fetching NFTs:', error);
    throw createApiError(
      error.message || 'Failed to fetch NFTs', 
      500, 
      'BLOCKCHAIN_ERROR'
    );
  }
}));

// Get transaction history
moralisRouter.get('/transactions/:address', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  const { chain = 'eth' } = req.query;
  
  try {
    validateAddress(address);
    const transactions = await moralisService.getTransactionHistory(address, chain as string);
    sendSuccess(res, { transactions });
  } catch (error: any) {
    if (error.status || error.statusCode) throw error;
    console.error('Error fetching transaction history:', error);
    throw createApiError(
      error.message || 'Failed to fetch transaction history', 
      500, 
      'BLOCKCHAIN_ERROR'
    );
  }
}));

// Get token transfers
moralisRouter.get('/token-transfers/:address', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  const { chain = 'eth' } = req.query;
  
  try {
    validateAddress(address);
    const transfers = await moralisService.getTokenTransfers(address, chain as string);
    sendSuccess(res, { transfers });
  } catch (error: any) {
    if (error.status || error.statusCode) throw error;
    console.error('Error fetching token transfers:', error);
    throw createApiError(
      error.message || 'Failed to fetch token transfers', 
      500, 
      'BLOCKCHAIN_ERROR'
    );
  }
}));

// Get token price
moralisRouter.get('/token-price/:address', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  const { chain = 'eth' } = req.query;
  
  try {
    validateAddress(address);
    const price = await moralisService.getTokenPrice(address, chain as string);
    sendSuccess(res, { price });
  } catch (error: any) {
    if (error.status || error.statusCode) throw error;
    console.error('Error fetching token price:', error);
    throw createApiError(
      error.message || 'Failed to fetch token price', 
      500, 
      'BLOCKCHAIN_ERROR'
    );
  }
}));

// Resolve ENS domain
moralisRouter.get('/resolve-ens/:domain', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { domain } = req.params;
  
  try {
    if (!domain) {
      throw createApiError('Invalid ENS domain', 400, 'INVALID_DOMAIN');
    }
    
    const address = await moralisService.resolveENS(domain);
    sendSuccess(res, { address });
  } catch (error: any) {
    if (error.status || error.statusCode) throw error;
    console.error('Error resolving ENS domain:', error);
    throw createApiError(
      error.message || 'Failed to resolve ENS domain', 
      500, 
      'BLOCKCHAIN_ERROR'
    );
  }
}));

// Resolve address to ENS
moralisRouter.get('/resolve-address/:address', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  
  try {
    validateAddress(address);
    const domain = await moralisService.resolveAddress(address);
    sendSuccess(res, { domain });
  } catch (error: any) {
    if (error.status || error.statusCode) throw error;
    console.error('Error resolving address to ENS:', error);
    throw createApiError(
      error.message || 'Failed to resolve address to ENS', 
      500, 
      'BLOCKCHAIN_ERROR'
    );
  }
}));

// Get contract ABI
moralisRouter.get('/contract-abi/:address', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  const { chain = 'eth' } = req.query;
  
  try {
    validateAddress(address);
    const abi = await moralisService.getContractABI(address, chain as string);
    sendSuccess(res, { abi });
  } catch (error: any) {
    if (error.status || error.statusCode) throw error;
    console.error('Error fetching contract ABI:', error);
    throw createApiError(
      error.message || 'Failed to fetch contract ABI', 
      500, 
      'BLOCKCHAIN_ERROR'
    );
  }
}));

// Get multi-chain balances
moralisRouter.get('/multi-chain-balances/:address', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  const chains = req.query.chains ? (req.query.chains as string).split(',') : ['eth', 'polygon', 'bsc'];
  
  try {
    validateAddress(address);
    const balances = await moralisService.getMultiChainBalances(address, chains);
    sendSuccess(res, { balances });
  } catch (error: any) {
    if (error.status || error.statusCode) throw error;
    console.error('Error fetching multi-chain balances:', error);
    throw createApiError(
      error.message || 'Failed to fetch multi-chain balances', 
      500, 
      'BLOCKCHAIN_ERROR'
    );
  }
}));

// Get NFT metadata
moralisRouter.get('/nft-metadata/:address/:tokenId', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { address, tokenId } = req.params;
  const { chain = 'eth' } = req.query;
  
  try {
    validateAddress(address);
    if (!tokenId) {
      throw createApiError('Invalid token ID', 400, 'INVALID_TOKEN_ID');
    }
    
    const metadata = await moralisService.getNFTMetadata(address, tokenId, chain as string);
    sendSuccess(res, { metadata });
  } catch (error: any) {
    if (error.status || error.statusCode) throw error;
    console.error('Error fetching NFT metadata:', error);
    throw createApiError(
      error.message || 'Failed to fetch NFT metadata', 
      500, 
      'BLOCKCHAIN_ERROR'
    );
  }
}));

// Get block by timestamp
moralisRouter.get('/block-by-timestamp/:timestamp', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const timestamp = parseInt(req.params.timestamp);
  const { chain = 'eth' } = req.query;
  
  try {
    if (isNaN(timestamp)) {
      throw createApiError('Invalid timestamp format', 400, 'INVALID_TIMESTAMP');
    }
    
    const block = await moralisService.getBlockByTimestamp(timestamp, chain as string);
    sendSuccess(res, { block });
  } catch (error: any) {
    if (error.status || error.statusCode) throw error;
    console.error('Error fetching block by timestamp:', error);
    throw createApiError(
      error.message || 'Failed to fetch block by timestamp', 
      500, 
      'BLOCKCHAIN_ERROR'
    );
  }
}));

// Run contract function
moralisRouter.post('/run-contract-function', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { address, functionName, abi, params, chain = 'eth' } = req.body;
  
  try {
    // Validate inputs
    if (!address || !functionName || !abi) {
      throw createApiError('Missing required parameters', 400, 'MISSING_PARAMETERS');
    }
    
    validateAddress(address);
    
    const result = await moralisService.runContractFunction({
      address,
      functionName,
      abi,
      params,
      chain,
    });
    
    sendSuccess(res, { result });
  } catch (error: any) {
    if (error.status || error.statusCode) throw error;
    console.error('Error running contract function:', error);
    throw createApiError(
      error.message || 'Failed to run contract function', 
      500, 
      'BLOCKCHAIN_ERROR'
    );
  }
}));
