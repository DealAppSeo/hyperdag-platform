import { Router, Request, Response, NextFunction } from 'express';
import { moralisService } from '../../services/moralis-service';
import { formatResponse, sendSuccess, sendError } from '../../utils/api-response';
import { asyncHandler, authErrorHandler, createApiError, ApiError } from '../../utils/error-handler';

export const moralisRouter = Router();

// Middleware to check if user is authenticated
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return sendError(res, 'Authentication required to access blockchain data', 'UNAUTHORIZED', 401);
  }
  next();
};

// Get wallet balance
moralisRouter.get('/balance/:address', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { address } = req.params;
  const { chain = 'eth' } = req.query;
  
  try {
    // Validate the address format
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new ApiError('Invalid wallet address format', 400, 'INVALID_ADDRESS');
    }
    
    const balance = await moralisService.getNativeBalance(address, chain as string);
    return { balance };
  } catch (error: any) {
    // If it's already an ApiError, just rethrow it
    if (error.status || error.statusCode) throw error;
    
    // Otherwise create a new standardized error
    console.error('Error fetching wallet balance:', error);
    throw new ApiError(
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
    // Validate the address format
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new ApiError('Invalid wallet address format', 400, 'INVALID_ADDRESS');
    }
    
    const tokens = await moralisService.getTokenBalances(address, chain as string);
    sendSuccess(res, { tokens });
  } catch (error: any) {
    // If it's already an ApiError, just rethrow it
    if (error.status || error.statusCode) throw error;
    
    // Otherwise create a new standardized error
    console.error('Error fetching token balances:', error);
    throw new ApiError(
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
    // Validate the address format
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new ApiError('Invalid wallet address format', 400, 'INVALID_ADDRESS');
    }
    
    const nfts = await moralisService.getNFTs(address, chain as string);
    sendSuccess(res, { nfts });
  } catch (error: any) {
    // If it's already an ApiError, just rethrow it
    if (error.status || error.statusCode) throw error;
    
    // Otherwise create a new standardized error
    console.error('Error fetching NFTs:', error);
    throw new ApiError(
      error.message || 'Failed to fetch NFTs', 
      500, 
      'BLOCKCHAIN_ERROR'
    );
  }
}));

// Get transaction history
moralisRouter.get('/transactions/:address', requireAuth, asyncHandler(async (req, res) => {
  const { address } = req.params;
  const { chain = 'eth' } = req.query;
  
  try {
    const transactions = await moralisService.getTransactionHistory(address, chain as string);
    sendSuccess(res, { transactions });
  } catch (error: any) {
    console.error('Error fetching transaction history:', error);
    sendError(res, 'Failed to fetch transaction history', 'BLOCKCHAIN_ERROR', 500);
  }
}));

// Get token transfers
moralisRouter.get('/token-transfers/:address', requireAuth, asyncHandler(async (req, res) => {
  const { address } = req.params;
  const { chain = 'eth' } = req.query;
  
  try {
    const transfers = await moralisService.getTokenTransfers(address, chain as string);
    sendSuccess(res, { transfers });
  } catch (error: any) {
    console.error('Error fetching token transfers:', error);
    sendError(res, 'Failed to fetch token transfers', 'BLOCKCHAIN_ERROR', 500);
  }
}));

// Get token price
moralisRouter.get('/token-price/:address', requireAuth, asyncHandler(async (req, res) => {
  const { address } = req.params;
  const { chain = 'eth' } = req.query;
  
  try {
    const price = await moralisService.getTokenPrice(address, chain as string);
    sendSuccess(res, { price });
  } catch (error: any) {
    console.error('Error fetching token price:', error);
    sendError(res, 'Failed to fetch token price', 'BLOCKCHAIN_ERROR', 500);
  }
}));

// Resolve ENS domain
moralisRouter.get('/resolve-ens/:domain', requireAuth, asyncHandler(async (req, res) => {
  const { domain } = req.params;
  
  try {
    const address = await moralisService.resolveENS(domain);
    sendSuccess(res, { address });
  } catch (error: any) {
    console.error('Error resolving ENS domain:', error);
    sendError(res, 'Failed to resolve ENS domain', 'BLOCKCHAIN_ERROR', 500);
  }
}));

// Resolve address to ENS
moralisRouter.get('/resolve-address/:address', requireAuth, asyncHandler(async (req, res) => {
  const { address } = req.params;
  
  try {
    const domain = await moralisService.resolveAddress(address);
    sendSuccess(res, { domain });
  } catch (error: any) {
    console.error('Error resolving address to ENS:', error);
    sendError(res, 'Failed to resolve address to ENS', 'BLOCKCHAIN_ERROR', 500);
  }
}));

// Get contract ABI
moralisRouter.get('/contract-abi/:address', requireAuth, asyncHandler(async (req, res) => {
  const { address } = req.params;
  const { chain = 'eth' } = req.query;
  
  try {
    const abi = await moralisService.getContractABI(address, chain as string);
    sendSuccess(res, { abi });
  } catch (error: any) {
    console.error('Error fetching contract ABI:', error);
    sendError(res, 'Failed to fetch contract ABI', 'BLOCKCHAIN_ERROR', 500);
  }
}));

// Get multi-chain balances
moralisRouter.get('/multi-chain-balances/:address', requireAuth, asyncHandler(async (req, res) => {
  const { address } = req.params;
  const chains = req.query.chains ? (req.query.chains as string).split(',') : ['eth', 'polygon', 'bsc'];
  
  try {
    const balances = await moralisService.getMultiChainBalances(address, chains);
    sendSuccess(res, { balances });
  } catch (error: any) {
    console.error('Error fetching multi-chain balances:', error);
    sendError(res, 'Failed to fetch multi-chain balances', 'BLOCKCHAIN_ERROR', 500);
  }
}));

// Get NFT metadata
moralisRouter.get('/nft-metadata/:address/:tokenId', requireAuth, asyncHandler(async (req, res) => {
  const { address, tokenId } = req.params;
  const { chain = 'eth' } = req.query;
  
  try {
    const metadata = await moralisService.getNFTMetadata(address, tokenId, chain as string);
    sendSuccess(res, { metadata });
  } catch (error: any) {
    console.error('Error fetching NFT metadata:', error);
    sendError(res, 'Failed to fetch NFT metadata', 'BLOCKCHAIN_ERROR', 500);
  }
}));

// Get block by timestamp
moralisRouter.get('/block-by-timestamp/:timestamp', requireAuth, asyncHandler(async (req, res) => {
  const timestamp = parseInt(req.params.timestamp);
  const { chain = 'eth' } = req.query;
  
  try {
    const block = await moralisService.getBlockByTimestamp(timestamp, chain as string);
    sendSuccess(res, { block });
  } catch (error: any) {
    console.error('Error fetching block by timestamp:', error);
    sendError(res, 'Failed to fetch block by timestamp', 'BLOCKCHAIN_ERROR', 500);
  }
}));

// Run contract function
moralisRouter.post('/run-contract-function', requireAuth, asyncHandler(async (req, res) => {
  const { address, functionName, abi, params, chain = 'eth' } = req.body;
  
  try {
    if (!address || !functionName || !abi) {
      return sendError(res, 'Missing required parameters', 'BAD_REQUEST', 400);
    }
    
    const result = await moralisService.runContractFunction({
      address,
      functionName,
      abi,
      params,
      chain,
    });
    
    sendSuccess(res, { result });
  } catch (error: any) {
    console.error('Error running contract function:', error);
    sendError(res, 'Failed to run contract function', 'BLOCKCHAIN_ERROR', 500);
  }
}));
