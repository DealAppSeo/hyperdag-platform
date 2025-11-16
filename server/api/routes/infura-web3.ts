/**
 * Infura Web3 API Routes for HyperDAG
 * Direct access to Infura services through dedicated routes
 */

import { Router } from 'express';
import { infuraService } from '../../services/infura-service';

const router = Router();

// Ethereum operations
router.post('/ethereum/:operation', async (req, res) => {
  try {
    const { operation } = req.params;
    const { method, params, network } = req.body;
    
    console.log(`[Infura Web3] Ethereum ${operation}:`, method);
    
    const result = await infuraService.ethereumCall(
      method || 'eth_blockNumber', 
      params || [], 
      network || 'mainnet'
    );
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      service: 'infura-ethereum'
    });
  }
});

// Polygon operations
router.post('/polygon/:operation', async (req, res) => {
  try {
    const { operation } = req.params;
    const { method, params } = req.body;
    
    console.log(`[Infura Web3] Polygon ${operation}:`, method);
    
    const result = await infuraService.polygonCall(
      method || 'eth_blockNumber', 
      params || []
    );
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      service: 'infura-polygon'
    });
  }
});

// IPFS operations
router.post('/ipfs/upload', async (req, res) => {
  try {
    const { data, filename } = req.body;
    
    console.log(`[Infura Web3] IPFS upload:`, filename || 'unnamed');
    
    const result = await infuraService.ipfsUpload(data, filename);
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      service: 'infura-ipfs'
    });
  }
});

router.get('/ipfs/retrieve/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    
    console.log(`[Infura Web3] IPFS retrieve:`, hash);
    
    const result = await infuraService.ipfsRetrieve(hash);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(404).json(result);
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      service: 'infura-ipfs'
    });
  }
});

// Smart contract operations
router.post('/contracts/deploy', async (req, res) => {
  try {
    const { bytecode, abi, constructorParams, network } = req.body;
    
    console.log(`[Infura Web3] Contract deployment on:`, network || 'mainnet');
    
    const result = await infuraService.deployContract(
      bytecode, 
      abi, 
      constructorParams, 
      network
    );
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      service: 'infura-contracts'
    });
  }
});

// Transaction operations
router.post('/transactions/send', async (req, res) => {
  try {
    const { transaction, network } = req.body;
    
    console.log(`[Infura Web3] Send transaction on:`, network || 'mainnet');
    
    const result = await infuraService.sendTransaction(transaction, network);
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      service: 'infura-transactions'
    });
  }
});

router.get('/transactions/receipt/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;
    const { network } = req.query;
    
    console.log(`[Infura Web3] Get receipt:`, txHash.substring(0, 10) + '...');
    
    const result = await infuraService.getTransactionReceipt(
      txHash, 
      network as string || 'mainnet'
    );
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      service: 'infura-transactions'
    });
  }
});

// Health and status endpoints
router.get('/health', async (req, res) => {
  try {
    const health = await infuraService.healthCheck();
    res.json(health);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      service: 'infura-health'
    });
  }
});

router.get('/status', (req, res) => {
  try {
    const status = infuraService.getStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
      service: 'infura-status'
    });
  }
});

export default router;