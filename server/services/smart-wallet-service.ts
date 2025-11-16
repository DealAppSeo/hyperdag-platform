/**
 * Smart Wallet Service for Gasless Training Environment
 * 
 * Provides gasless transaction capabilities using Alchemy's Account Abstraction
 * Designed for onboarding new users to Web3 without gas friction
 */

import { getAlchemyService } from './blockchain/alchemy-service.js';
import { logger } from '../utils/logger.js';
import { ethers } from 'ethers';

export interface SmartWalletConfig {
  email?: string;
  socialLogin?: boolean;
  testMode?: boolean;
}

export interface GaslessTransaction {
  to: string;
  data?: string;
  value?: string;
}

export interface TrainingStep {
  id: string;
  title: string;
  description: string;
  action: 'create_wallet' | 'mint_nft' | 'verify_identity' | 'transfer_token';
  gasless: boolean;
  completed: boolean;
}

export class SmartWalletService {
  private alchemyService;
  private trainingSessions = new Map<string, TrainingSession>();

  constructor() {
    this.alchemyService = getAlchemyService();
  }

  /**
   * Create a gasless smart wallet for training
   */
  async createTrainingWallet(config: SmartWalletConfig) {
    try {
      // Generate a random private key for training wallet
      const randomWallet = ethers.Wallet.createRandom();
      const privateKey = randomWallet.privateKey;
      
      // Create light account using Alchemy AA
      const smartAccount = await this.alchemyService.createLightAccount(privateKey);
      const address = await smartAccount.getAddress();

      logger.info(`[SmartWallet] Created training wallet: ${address}`);

      return {
        address,
        smartAccount,
        privateKey: config.testMode ? privateKey : undefined, // Only return for testing
        isGasless: true,
        networkInfo: await this.alchemyService.getNetworkInfo()
      };
    } catch (error) {
      logger.error('[SmartWallet] Failed to create training wallet:', error);
      throw new Error('Failed to create training wallet');
    }
  }

  /**
   * Execute a gasless transaction for training
   */
  async executeGaslessTransaction(
    smartAccount: any,
    transaction: GaslessTransaction
  ) {
    try {
      // Use Alchemy's Account Abstraction for gasless transactions
      const userOp = await smartAccount.sendUserOperation({
        target: transaction.to,
        data: transaction.data || '0x',
        value: BigInt(transaction.value || '0')
      });

      // Wait for transaction to be mined
      const txHash = await smartAccount.waitForUserOperationTransaction(userOp.hash);
      
      logger.info(`[SmartWallet] Gasless transaction executed: ${txHash}`);

      return {
        userOpHash: userOp.hash,
        transactionHash: txHash,
        gasless: true,
        success: true
      };
    } catch (error) {
      logger.error('[SmartWallet] Failed to execute gasless transaction:', error);
      throw new Error('Failed to execute gasless transaction');
    }
  }

  /**
   * Create a training session for a user
   */
  createTrainingSession(userId: string): string {
    const sessionId = `training_${userId}_${Date.now()}`;
    
    const trainingSteps: TrainingStep[] = [
      {
        id: 'step1',
        title: 'Create Your Smart Wallet',
        description: 'Learn how to create a smart wallet without any gas fees or complexity',
        action: 'create_wallet',
        gasless: true,
        completed: false
      },
      {
        id: 'step2',
        title: 'Mint Your First ZKP RepID NFT',
        description: 'Create your reputation identity NFT with zero-knowledge proofs',
        action: 'mint_nft',
        gasless: true,
        completed: false
      },
      {
        id: 'step3',
        title: 'Verify Your Identity',
        description: 'Experience secure 4-Factor Authentication with biometric verification',
        action: 'verify_identity',
        gasless: true,
        completed: false
      },
      {
        id: 'step4',
        title: 'Transfer Tokens Gaslessly',
        description: 'Send transactions without worrying about gas fees or wallet funding',
        action: 'transfer_token',
        gasless: true,
        completed: false
      }
    ];

    const session: TrainingSession = {
      id: sessionId,
      userId,
      steps: trainingSteps,
      currentStep: 0,
      startedAt: new Date(),
      walletAddress: null,
      smartAccount: null,
      completed: false
    };

    this.trainingSessions.set(sessionId, session);
    return sessionId;
  }

  /**
   * Get training session progress
   */
  getTrainingSession(sessionId: string): TrainingSession | null {
    return this.trainingSessions.get(sessionId) || null;
  }

  /**
   * Complete a training step
   */
  async completeTrainingStep(
    sessionId: string,
    stepId: string,
    transactionData?: any
  ) {
    const session = this.trainingSessions.get(sessionId);
    if (!session) {
      throw new Error('Training session not found');
    }

    const step = session.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error('Training step not found');
    }

    step.completed = true;
    
    // Move to next step
    if (session.currentStep < session.steps.length - 1) {
      session.currentStep++;
    } else {
      session.completed = true;
      session.completedAt = new Date();
    }

    this.trainingSessions.set(sessionId, session);

    logger.info(`[SmartWallet] Training step completed: ${stepId} for session ${sessionId}`);

    return {
      stepCompleted: step,
      nextStep: session.steps[session.currentStep] || null,
      sessionCompleted: session.completed,
      progress: (session.steps.filter(s => s.completed).length / session.steps.length) * 100
    };
  }

  /**
   * Get gasless transaction estimate
   */
  async getGaslessEstimate(transaction: GaslessTransaction) {
    try {
      // Simulate the transaction to get cost savings
      const regularGasEstimate = await this.alchemyService.estimateGas({
        to: transaction.to,
        data: transaction.data,
        value: transaction.value
      });

      const gasPrice = await this.alchemyService.getGasPrice();
      const estimatedCostWei = BigInt(regularGasEstimate) * BigInt(gasPrice.gasPrice);
      const estimatedCostEth = ethers.formatEther(estimatedCostWei);

      return {
        regularGasCost: estimatedCostEth,
        gaslessCost: '0.00',
        savings: estimatedCostEth,
        gasUsed: regularGasEstimate,
        sponsored: true
      };
    } catch (error) {
      logger.error('[SmartWallet] Failed to get gasless estimate:', error);
      return {
        regularGasCost: '0.001',
        gaslessCost: '0.00',
        savings: '0.001',
        gasUsed: '21000',
        sponsored: true
      };
    }
  }

  /**
   * Get training statistics
   */
  getTrainingStats() {
    const sessions = Array.from(this.trainingSessions.values());
    const completedSessions = sessions.filter(s => s.completed);
    const totalSteps = sessions.reduce((acc, s) => acc + s.steps.length, 0);
    const completedSteps = sessions.reduce((acc, s) => acc + s.steps.filter(step => step.completed).length, 0);

    return {
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      completionRate: sessions.length > 0 ? (completedSessions.length / sessions.length) * 100 : 0,
      totalSteps,
      completedSteps,
      stepCompletionRate: totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0,
      averageTimeToComplete: completedSessions.length > 0 
        ? completedSessions.reduce((acc, s) => {
            const duration = s.completedAt!.getTime() - s.startedAt.getTime();
            return acc + duration;
          }, 0) / completedSessions.length / 1000 / 60 // minutes
        : 0
    };
  }
}

export interface TrainingSession {
  id: string;
  userId: string;
  steps: TrainingStep[];
  currentStep: number;
  startedAt: Date;
  completedAt?: Date;
  walletAddress: string | null;
  smartAccount: any | null;
  completed: boolean;
}

// Singleton instance
let smartWalletService: SmartWalletService | null = null;

export function getSmartWalletService(): SmartWalletService {
  if (!smartWalletService) {
    smartWalletService = new SmartWalletService();
  }
  return smartWalletService;
}