/**
 * Token Reward Service
 * 
 * This service handles the interaction with the HyperDAGToken smart contract
 * for reward distribution, referral tracking, and dynamic reward adjustment.
 */

import Web3 from "web3";
import { AbiItem } from "web3-utils";
import { Contract } from "web3-eth-contract";
import { storage } from "../storage";
import { ReputationActivity } from "@shared/schema";
import { config } from '../config';
import { logger } from '../utils/logger';

// Load the ABI for the token contract
const tokenAbi: AbiItem[] = require('../../contracts/artifacts/HyperDAGToken.json').abi;

export class TokenRewardService {
  private web3: Web3;
  private tokenContract: Contract;
  private rewardDistributors: Map<string, boolean>;
  private lastActivitySync: number;
  private isInitialized: boolean = false;
  
  constructor() {
    this.rewardDistributors = new Map();
    this.lastActivitySync = Date.now();
    
    // Initialize web3 and connect to the blockchain
    try {
      this.web3 = new Web3(config.WEB3_PROVIDER_URL);
      this.tokenContract = new this.web3.eth.Contract(
        tokenAbi,
        config.TOKEN_CONTRACT_ADDRESS
      );
      this.isInitialized = true;
      logger.info('TokenRewardService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize TokenRewardService', error);
      this.isInitialized = false;
    }
  }
  
  /**
   * Check if the service is properly initialized
   */
  public isReady(): boolean {
    return this.isInitialized;
  }
  
  /**
   * Record a referral between two users
   * @param referrerUserId The ID of the referrer
   * @param refereeUserId The ID of the referee
   */
  public async recordReferral(referrerUserId: number, refereeUserId: number): Promise<boolean> {
    if (!this.isInitialized) {
      logger.error('TokenRewardService not initialized');
      return false;
    }
    
    try {
      // Get users from database
      const referrer = await storage.getUser(referrerUserId);
      const referee = await storage.getUser(refereeUserId);
      
      if (!referrer || !referee) {
        logger.error(`User not found: referrer=${referrerUserId}, referee=${refereeUserId}`);
        return false;
      }
      
      if (!referrer.walletAddress || !referee.walletAddress) {
        logger.error(`Missing wallet address: referrer=${referrer.walletAddress}, referee=${referee.walletAddress}`);
        return false;
      }
      
      // Record the referral in the blockchain
      const adminAccount = this.web3.eth.accounts.privateKeyToAccount(config.ADMIN_PRIVATE_KEY);
      this.web3.eth.accounts.wallet.add(adminAccount);
      
      const gasEstimate = await this.tokenContract.methods
        .recordReferral(referrer.walletAddress, referee.walletAddress)
        .estimateGas({ from: adminAccount.address });
      
      const result = await this.tokenContract.methods
        .recordReferral(referrer.walletAddress, referee.walletAddress)
        .send({
          from: adminAccount.address,
          gas: Math.round(gasEstimate * 1.2) // Add 20% buffer
        });
      
      logger.info(`Referral recorded on blockchain: ${result.transactionHash}`);
      
      // Also record in our database for analytics
      await storage.createReferral({
        referrerId: referrerUserId,
        refereeId: refereeUserId,
        createdAt: new Date(),
        status: 'recorded',
        rewardAmount: null
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to record referral', error);
      return false;
    }
  }
  
  /**
   * Verify a referral when a user completes their profile
   * @param userId The ID of the user who completed their profile
   */
  public async verifyReferral(userId: number): Promise<boolean> {
    if (!this.isInitialized) {
      logger.error('TokenRewardService not initialized');
      return false;
    }
    
    try {
      // Get user from database
      const user = await storage.getUser(userId);
      
      if (!user) {
        logger.error(`User not found: ${userId}`);
        return false;
      }
      
      if (!user.walletAddress) {
        logger.error(`Missing wallet address for user: ${userId}`);
        return false;
      }
      
      // Mark the referral as verified on the blockchain
      const adminAccount = this.web3.eth.accounts.privateKeyToAccount(config.ADMIN_PRIVATE_KEY);
      this.web3.eth.accounts.wallet.add(adminAccount);
      
      const gasEstimate = await this.tokenContract.methods
        .verifyReferral(user.walletAddress)
        .estimateGas({ from: adminAccount.address });
      
      const result = await this.tokenContract.methods
        .verifyReferral(user.walletAddress)
        .send({
          from: adminAccount.address,
          gas: Math.round(gasEstimate * 1.2) // Add 20% buffer
        });
      
      logger.info(`Referral verified on blockchain: ${result.transactionHash}`);
      
      // Also mark as verified in our database
      const referrals = await storage.getReferralsByUserId(userId);
      for (const referral of referrals) {
        if (referral.status === 'recorded') {
          await storage.updateReferralStatus(referral.id, 'verified');
        }
      }
      
      // Update the user profile completion status
      const profileCompletion = {
        hasWallet: true,
        hasVerifiedEmail: !!user.emailVerified,
        has2fa: !!user.twoFactorEnabled,
        completedOnboarding: true
      };
      
      await storage.updateUser(userId, { profileCompletion });
      
      // Mark profile as completed on the blockchain
      const markProfileResult = await this.tokenContract.methods
        .markProfileCompleted(user.walletAddress)
        .send({
          from: adminAccount.address,
          gas: Math.round(gasEstimate * 1.2) // Add 20% buffer
        });
      
      logger.info(`Profile marked as completed on blockchain: ${markProfileResult.transactionHash}`);
      
      return true;
    } catch (error) {
      logger.error('Failed to verify referral', error);
      return false;
    }
  }
  
  /**
   * Issue rewards for successful referrals
   * @param referrerId The ID of the referrer to reward
   */
  public async issueReferralRewards(referrerId: number): Promise<boolean> {
    if (!this.isInitialized) {
      logger.error('TokenRewardService not initialized');
      return false;
    }
    
    try {
      // Get user from database
      const referrer = await storage.getUser(referrerId);
      
      if (!referrer) {
        logger.error(`User not found: ${referrerId}`);
        return false;
      }
      
      if (!referrer.walletAddress) {
        logger.error(`Missing wallet address for user: ${referrerId}`);
        return false;
      }
      
      // Get verified referrals for this user
      const referrals = await storage.getReferralsByUserId(referrerId);
      const verifiedReferrals = referrals.filter(r => r.status === 'verified' && !r.rewardIssued);
      
      if (verifiedReferrals.length === 0) {
        logger.info(`No new verified referrals found for user: ${referrerId}`);
        return false;
      }
      
      // Issue rewards on the blockchain
      const adminAccount = this.web3.eth.accounts.privateKeyToAccount(config.ADMIN_PRIVATE_KEY);
      this.web3.eth.accounts.wallet.add(adminAccount);
      
      const gasEstimate = await this.tokenContract.methods
        .issueReferralReward(referrer.walletAddress, verifiedReferrals.length)
        .estimateGas({ from: adminAccount.address });
      
      const result = await this.tokenContract.methods
        .issueReferralReward(referrer.walletAddress, verifiedReferrals.length)
        .send({
          from: adminAccount.address,
          gas: Math.round(gasEstimate * 1.2) // Add 20% buffer
        });
      
      logger.info(`Referral rewards issued on blockchain: ${result.transactionHash}`);
      
      // Mark rewards as issued in the database
      for (const referral of verifiedReferrals) {
        await storage.updateReferralStatus(referral.id, 'rewarded');
      }
      
      // Create a reputation activity for the reward
      await storage.createReputationActivity({
        userId: referrerId,
        type: 'referral_reward',
        points: verifiedReferrals.length * 25, // Base points per referral
        data: {
          referralCount: verifiedReferrals.length,
          transactionHash: result.transactionHash
        },
        timestamp: new Date()
      });
      
      return true;
    } catch (error) {
      logger.error('Failed to issue referral rewards', error);
      return false;
    }
  }
  
  /**
   * Sync platform activity metrics with the token contract
   * This enables AI-driven reward adjustment
   */
  public async syncActivityMetrics(): Promise<boolean> {
    if (!this.isInitialized) {
      logger.error('TokenRewardService not initialized');
      return false;
    }
    
    // Only sync at most once per hour
    const now = Date.now();
    if (now - this.lastActivitySync < 3600000) {
      return false;
    }
    
    try {
      // Get platform metrics from the database
      const totalUsers = await storage.getUserCount();
      
      // Get active users (users who have had activity in the last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const activeUsers = await storage.getActiveUserCount(thirtyDaysAgo);
      
      // Update metrics on the blockchain
      const adminAccount = this.web3.eth.accounts.privateKeyToAccount(config.ADMIN_PRIVATE_KEY);
      this.web3.eth.accounts.wallet.add(adminAccount);
      
      const gasEstimate = await this.tokenContract.methods
        .updateActivityMetrics(totalUsers, activeUsers)
        .estimateGas({ from: adminAccount.address });
      
      const result = await this.tokenContract.methods
        .updateActivityMetrics(totalUsers, activeUsers)
        .send({
          from: adminAccount.address,
          gas: Math.round(gasEstimate * 1.2) // Add 20% buffer
        });
      
      logger.info(`Activity metrics synced with blockchain: ${result.transactionHash}`);
      
      // Update the last sync time
      this.lastActivitySync = now;
      
      return true;
    } catch (error) {
      logger.error('Failed to sync activity metrics', error);
      return false;
    }
  }
  
  /**
   * Process expired rewards for users who haven't completed profiles
   * @param userId The ID of the user to check
   */
  public async processExpiredRewards(userId: number): Promise<boolean> {
    if (!this.isInitialized) {
      logger.error('TokenRewardService not initialized');
      return false;
    }
    
    try {
      // Get user from database
      const user = await storage.getUser(userId);
      
      if (!user) {
        logger.error(`User not found: ${userId}`);
        return false;
      }
      
      if (!user.walletAddress) {
        // No wallet means no on-chain rewards
        return false;
      }
      
      // Process expired rewards on the blockchain
      const adminAccount = this.web3.eth.accounts.privateKeyToAccount(config.ADMIN_PRIVATE_KEY);
      this.web3.eth.accounts.wallet.add(adminAccount);
      
      const gasEstimate = await this.tokenContract.methods
        .processExpiredRewards(user.walletAddress)
        .estimateGas({ from: adminAccount.address });
      
      const result = await this.tokenContract.methods
        .processExpiredRewards(user.walletAddress)
        .send({
          from: adminAccount.address,
          gas: Math.round(gasEstimate * 1.2) // Add 20% buffer
        });
      
      logger.info(`Expired rewards processed on blockchain: ${result.transactionHash}`);
      
      return true;
    } catch (error) {
      logger.error('Failed to process expired rewards', error);
      return false;
    }
  }
  
  /**
   * Get the current reward rates from the contract
   */
  public async getCurrentRewardRates(): Promise<{
    referralReward: number,
    profileReward: number,
    activityReward: number,
    contributionReward: number
  }> {
    if (!this.isInitialized) {
      logger.error('TokenRewardService not initialized');
      return {
        referralReward: 0,
        profileReward: 0,
        activityReward: 0,
        contributionReward: 0
      };
    }
    
    try {
      const rates = await this.tokenContract.methods.getCurrentRewardRates().call();
      
      return {
        referralReward: parseInt(rates.referralReward) / 10000,
        profileReward: parseInt(rates.profileReward) / 10000,
        activityReward: parseInt(rates.activityReward) / 10000,
        contributionReward: parseInt(rates.contributionReward) / 10000
      };
    } catch (error) {
      logger.error('Failed to get current reward rates', error);
      return {
        referralReward: 0,
        profileReward: 0,
        activityReward: 0,
        contributionReward: 0
      };
    }
  }
  
  /**
   * Get the reward state for a specific user
   * @param userId The ID of the user to check
   */
  public async getUserRewardState(userId: number): Promise<{
    pendingTokens: number,
    referralCount: number,
    lastActivityTime: Date,
    profileCompleted: boolean,
    forfeited: number
  } | null> {
    if (!this.isInitialized) {
      logger.error('TokenRewardService not initialized');
      return null;
    }
    
    try {
      const user = await storage.getUser(userId);
      
      if (!user || !user.walletAddress) {
        return null;
      }
      
      const state = await this.tokenContract.methods.getRewardState(user.walletAddress).call();
      
      return {
        pendingTokens: this.web3.utils.fromWei(state.pendingTokens, 'ether'),
        referralCount: parseInt(state.referralCount),
        lastActivityTime: new Date(parseInt(state.lastActivityTime) * 1000),
        profileCompleted: state.profileCompleted,
        forfeited: this.web3.utils.fromWei(state.forfeited, 'ether')
      };
    } catch (error) {
      logger.error(`Failed to get reward state for user ${userId}`, error);
      return null;
    }
  }
}

// Create a singleton instance
export const tokenRewardService = new TokenRewardService();