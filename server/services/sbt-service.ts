/**
 * Soulbound Token (SBT) Service - TEMPORARY DISABLED FOR SMART CONTRACT MIGRATION
 * 
 * This service will be replaced with the new ZKP RepID NFT smart contract system.
 * Current schema mismatches will be resolved when contracts are deployed.
 */

import crypto from 'crypto';
import { db } from '../db';
import { eq, and, or } from 'drizzle-orm';
import * as schema from '@shared/schema';
import { logger } from '../utils/logger';
import { polygonService } from './polygon-service';
import { ethers } from 'ethers';
// Importing the necessary ZKP functionality
import { createIdentityCommitment } from './zkp/zkp-service';

// Define the ReputationData interface directly here to avoid circular imports
export interface ReputationData {
  userId: number;
  totalPoints: number;
  contributionCount: number;
  averageRating: number;
  lastUpdated: Date;
  topCategory: string;
  categories: {
    [category: string]: number;
  };
}

// Helper functions to generate/verify reputation proofs (simulated for now)
async function generateReputationProof(data: ReputationData, threshold: number, category: string) {
  return {
    proof: 'simulated-proof-' + Math.random().toString(36).substring(2),
    publicInputs: {
      userId: data.userId,
      threshold,
      category,
      timestamp: Date.now()
    }
  };
}

async function verifyReputationProof(proof: any) {
  return true; // Simulated verification for now
}

// Interface for SBT metadata
export interface SBTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: {
    trait_type: string;
    value: string | number;
  }[];
  // Additional fields for ZKP
  commitmentHash: string;
  nullifierHash: string;
  issuedAt: number;
  expiresAt?: number;
}

// Interface for SBT identity credential
export interface SBTCredential {
  id: string;
  tokenId: string;
  userId?: number;
  organizationId?: number;
  network: string;
  contractAddress: string;
  metadata: SBTMetadata;
  soulboundTo: string; // Address or identity the token is bound to
  issuedAt: Date;
  expiresAt?: Date;
  revoked: boolean;
  proofId?: string; // Reference to a ZKP proof
  entityType: 'user' | 'organization'; // Type of entity this SBT is bound to
}

/**
 * Manages Zero-Knowledge Proof-based Soulbound Tokens (SBTs) for identity credentials
 */
export class SBTService {
  /**
   * Initialize the SBT service
   */
  constructor() {
    logger.info('[SBT] Soulbound Token service initialized');
  }

  /**
   * Create a ZKP-based Soulbound Token for a user
   * 
   * @param userId The user's ID
   * @param metadata Optional metadata to include in the SBT
   * @returns The SBT credential
   */
  async createSBT(userId: number, metadata?: Partial<SBTMetadata>): Promise<SBTCredential> {
    try {
      logger.info(`[SBT] Creating Soulbound Token for user ${userId}`);
      
      // Get user information
      const [user] = await db
        .select({
          username: schema.users.username,
          walletAddress: schema.users.walletAddress,
          connectedWallets: schema.users.connectedWallets,
          repIdCommitment: schema.users.repIdCommitment,
        })
        .from(schema.users)
        .where(eq(schema.users.id, userId));
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Generate a cryptographically secure token ID
      const tokenId = crypto.randomBytes(16).toString('hex');
      
      // Create identity and commitment if user doesn't have one
      let commitmentHash = user.repIdCommitment;
      let nullifierHash: string;
      
      if (!commitmentHash) {
        // Create a new commitment based on user ID and a secret
        const secret = crypto.randomBytes(32).toString('hex');
        const identityResult = createIdentityCommitment(userId, secret);
        commitmentHash = identityResult.commitment;
        nullifierHash = identityResult.nullifier;
          
        // Store the commitment hash for future use
        await db
          .update(schema.users)
          .set({ repIdCommitment: commitmentHash })
          .where(eq(schema.users.id, userId));
      } else {
        // Generate a consistent nullifier hash from the existing commitment
        nullifierHash = crypto.createHash('sha256')
          .update(`${commitmentHash}-${userId}-nullifier`)
          .digest('hex');
      }
      
      // Use the first connected wallet or generate a new one if none exists
      let soulboundTo = '';
      if (user.walletAddress) {
        soulboundTo = user.walletAddress;
      } else if (user.connectedWallets && Object.keys(user.connectedWallets).length > 0) {
        // Use the first available wallet
        soulboundTo = Object.values(user.connectedWallets)[0] as string;
      } else {
        // Create a deterministic address derived from the user's identity
        // This is NOT a real wallet, just an identifier
        const seed = crypto.createHash('sha256')
          .update(`${userId}-${user.username}-${commitmentHash}`)
          .digest('hex');
        soulboundTo = ethers.computeAddress(`0x${seed}`);
      }
      
      // Current timestamp in seconds
      const issuedAt = Math.floor(Date.now() / 1000);
      
      // Default expiration is one year from now (can be customized)
      const expiresAt = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
      
      // Generate SBT metadata with ZKP components
      const sbtMetadata: SBTMetadata = {
        name: metadata?.name || `HyperDAG Identity #${userId}`,
        description: metadata?.description || 
          `Zero-knowledge proof-based identity credential for ${user.username} on HyperDAG.`,
        image: metadata?.image || `https://api.hyperdag.org/api/identity/image/${tokenId}`,
        attributes: metadata?.attributes || [
          {
            trait_type: 'Type',
            value: 'Identity'
          },
          {
            trait_type: 'Platform',
            value: 'HyperDAG'
          },
          {
            trait_type: 'Issued',
            value: new Date(issuedAt * 1000).toISOString().split('T')[0]
          }
        ],
        commitmentHash,
        nullifierHash,
        issuedAt,
        expiresAt
      };
      
      // Create credential record in database
      // In a real implementation, this would also mint the SBT on-chain
      // Here we're just storing the data in our database for now
      const sbtId = crypto.randomUUID();
      
      // Create reputation proof to validate the credential
      const [reputationRecord] = await db
        .select()
        .from(schema.reputationActivities)
        .where(eq(schema.reputationActivities.userId, userId))
        .orderBy(schema.reputationActivities.timestamp);
      
      // Get user reputation score directly from the users table
      const [userWithScore] = await db
        .select({
          reputationScore: schema.users.reputationScore
        })
        .from(schema.users)
        .where(eq(schema.users.id, userId));
        
      const reputationScore = userWithScore?.reputationScore || 0;
      
      // Generate a proof for this token
      let proofId: string | undefined;
      if (reputationRecord) {
        const reputationData: ReputationData = {
          userId,
          totalPoints: reputationScore,
          contributionCount: 1,
          averageRating: 5,
          lastUpdated: new Date(),
          topCategory: 'general',
          categories: {
            general: reputationScore
          }
        };
        
        const proof = await generateReputationProof(reputationData, 0, 'general');
        // Store the proof ID - in our system, it's returned in the response
        proofId = proof ? crypto.randomUUID() : undefined;
      }
      
      // Store SBT in database
      // In production, we'd also create this token on-chain
      // For the MVP, we'll just simulate it
      
      // Mock contract address (in a real implementation, this would come from the blockchain)
      const mockContractAddress = '0x9A0A14D2731C2c48008229Fc5D977954c505A12e';
      
      const sbt: SBTCredential = {
        id: sbtId,
        tokenId,
        userId,
        network: 'polygon',
        contractAddress: mockContractAddress,
        metadata: sbtMetadata,
        soulboundTo,
        issuedAt: new Date(issuedAt * 1000),
        expiresAt: new Date(expiresAt * 1000),
        revoked: false,
        proofId
      };
      
      // In production, we would store this in a `soulbound_tokens` table
      // For now, we'll store it as a verified credential
      await db
        .insert(schema.verifiedCredentials)
        .values({
          userId,
          type: 'sbt_identity',
          name: sbtMetadata.name,
          issuer: 'HyperDAG',
          issuedDate: new Date(issuedAt * 1000),
          expiryDate: new Date(expiresAt * 1000),
          credential: sbt.tokenId, // The token ID is used as the credential
          revocationId: sbt.id, // The SBT ID is used for revocation
          isPublic: false,
          metadata: sbtMetadata // Store just the metadata, not the whole SBT
        });
      
      logger.info(`[SBT] Created Soulbound Token ${sbtId} for user ${userId}`);
      return sbt;
    } catch (error) {
      logger.error('[SBT] Error creating Soulbound Token', error);
      throw new Error(`Failed to create Soulbound Token: ${(error as Error).message}`);
    }
  }
  
  /**
   * Create a Soulbound Token for an organization (including non-profits)
   * 
   * @param organizationId The organization's ID
   * @param metadata Optional custom metadata for the SBT
   * @returns The created SBT credential or null if failed
   */
  async createOrganizationSBT(organizationId: number, metadata?: Partial<SBTMetadata>): Promise<SBTCredential | null> {
    try {
      // Fetch organization data
      const [organization] = await db
        .select()
        .from(schema.organizations)
        .where(eq(schema.organizations.id, organizationId));
      
      if (!organization) {
        logger.warn(`[SBT] Organization ${organizationId} not found`);
        throw new Error(`Organization ${organizationId} not found`);
      }
      
      // Generate a deterministic token ID based on the organization's identity
      const tokenIdSeed = crypto.createHash('sha256')
        .update(`${organizationId}-${organization.name}-${Date.now()}`)
        .digest('hex');
      const tokenId = tokenIdSeed.substring(0, 16);
      
      // Create ZKP identity commitment
      const secret = crypto.randomBytes(32).toString('hex');
      const identityResult = createIdentityCommitment(organizationId, secret);
      const commitmentHash = identityResult.commitment;
      const nullifierHash = identityResult.nullifier;
      
      // Set the SBT to be soulbound to the organization's wallet address if available
      let soulboundTo: string;
      if (organization.walletAddress) {
        soulboundTo = organization.walletAddress;
      } else {
        // Create a deterministic address derived from the organization's identity
        const seed = crypto.createHash('sha256')
          .update(`${organizationId}-${organization.name}-${commitmentHash}`)
          .digest('hex');
        soulboundTo = ethers.computeAddress(`0x${seed}`);
      }
      
      // Current timestamp in seconds
      const issuedAt = Math.floor(Date.now() / 1000);
      
      // Default expiration is two years from now for organizations (longer than individual users)
      const expiresAt = Math.floor(Date.now() / 1000) + 2 * 365 * 24 * 60 * 60;
      
      // Generate SBT metadata with ZKP components
      const sbtMetadata: SBTMetadata = {
        name: metadata?.name || `HyperDAG Organization: ${organization.name}`,
        description: metadata?.description || 
          `Zero-knowledge proof-based identity credential for ${organization.name} on HyperDAG.`,
        image: metadata?.image || organization.profileImageUrl || `https://api.hyperdag.org/api/org/image/${tokenId}`,
        attributes: metadata?.attributes || [
          {
            trait_type: 'Type',
            value: 'Organization'
          },
          {
            trait_type: 'Organization Type',
            value: organization.type
          },
          {
            trait_type: 'Verification Status',
            value: organization.verified ? 'Verified' : 'Pending'
          },
          {
            trait_type: 'Platform',
            value: 'HyperDAG'
          },
          {
            trait_type: 'Issued',
            value: new Date(issuedAt * 1000).toISOString().split('T')[0]
          }
        ],
        commitmentHash,
        nullifierHash,
        issuedAt,
        expiresAt
      };
      
      // Create SBT record
      const sbtId = crypto.randomUUID();
      
      // In a real implementation, we would also mint this token on-chain
      const mockContractAddress = '0x9A0A14D2731C2c48008229Fc5D977954c505A12e';
      
      const sbt: SBTCredential = {
        id: sbtId,
        tokenId,
        organizationId,
        network: 'polygon',
        contractAddress: mockContractAddress,
        metadata: sbtMetadata,
        soulboundTo,
        issuedAt: new Date(issuedAt * 1000),
        expiresAt: new Date(expiresAt * 1000),
        revoked: false,
        entityType: 'organization'
      };
      
      // Store in verified credentials table with type 'org_sbt_identity'
      await db
        .insert(schema.verifiedCredentials)
        .values({
          userId: null, // No user for organization SBTs
          type: 'org_sbt_identity',
          name: sbtMetadata.name,
          issuer: 'HyperDAG',
          issuedDate: new Date(issuedAt * 1000),
          expiryDate: new Date(expiresAt * 1000),
          credential: JSON.stringify(sbt),
          revocationId: sbtId,
          isPublic: true, // Organizations typically want their identity to be public
          metadata: sbtMetadata
        });
      
      // Update the organization record with the SBT ID
      await db
        .update(schema.organizations)
        .set({
          sbtId,
          updatedAt: new Date()
        })
        .where(eq(schema.organizations.id, organizationId));
      
      logger.info(`[SBT] Created Soulbound Token ${sbtId} for organization ${organizationId} (${organization.name})`);
      return sbt;
    } catch (error) {
      logger.error('[SBT] Error creating Organization Soulbound Token', error);
      throw new Error(`Failed to create Organization Soulbound Token: ${(error as Error).message}`);
    }
  }

  /**
   * Get a user's SBT by ID
   * 
   * @param sbtId The SBT's unique ID
   * @returns The SBT credential or null if not found
   */
  async getSBT(sbtId: string): Promise<SBTCredential | null> {
    try {
      // Find the SBT in the verified credentials table - check both user and organization SBTs
      const [credential] = await db
        .select()
        .from(schema.verifiedCredentials)
        .where(and(
          eq(schema.verifiedCredentials.revocationId, sbtId),
          // Look for both user SBTs and organization SBTs
          or(
            eq(schema.verifiedCredentials.type, 'sbt_identity'),
            eq(schema.verifiedCredentials.type, 'org_sbt_identity')
          )
        ));
      
      if (!credential) {
        return null;
      }
      
      // Parse the SBT data from the credential
      return JSON.parse(credential.credential) as SBTCredential;
    } catch (error) {
      logger.error('[SBT] Error getting Soulbound Token', error);
      return null;
    }
  }
  
  /**
   * Get metadata for an SBT by token ID
   * 
   * @param tokenId The token ID of the SBT
   * @returns The SBT metadata or null if not found
   */
  async getSBTMetadata(tokenId: string): Promise<SBTMetadata | null> {
    try {
      // Find the token in the verified credentials table
      const [credential] = await db
        .select()
        .from(schema.verifiedCredentials)
        .where(
          eq(schema.verifiedCredentials.credential, tokenId)
        );
      
      if (!credential) {
        logger.warn(`[SBT] Token with ID ${tokenId} not found`);
        return null;
      }
      
      // Return the metadata from the credential
      return credential.metadata as SBTMetadata;
    } catch (error) {
      logger.error(`[SBT] Error getting metadata for token ${tokenId}:`, error);
      return null;
    }
  }

  /**
   * Verify SBT ownership proof
   * 
   * @param tokenId The token ID to verify
   * @param proof The ownership proof provided
   * @returns Whether the proof is valid
   */
  async verifySBT(tokenId: string, proof: any): Promise<boolean> {
    try {
      // First check if the token exists
      const [credential] = await db
        .select()
        .from(schema.verifiedCredentials)
        .where(eq(schema.verifiedCredentials.credential, tokenId));
      
      if (!credential) {
        logger.warn(`[SBT] Token with ID ${tokenId} not found during verification`);
        return false;
      }
      
      // For the MVP, we'll use a simple verification
      // In a production system, this would verify a ZKP
      if (proof && typeof proof === 'object') {
        // Basic validation for now - just check if the proof has required fields
        if (proof.signature && proof.publicInputs) {
          logger.info(`[SBT] Token ${tokenId} ownership verified successfully`);
          return true;
        }
      }
      
      logger.warn(`[SBT] Invalid proof for token ${tokenId}`);
      return false;
    } catch (error) {
      logger.error(`[SBT] Error verifying token ${tokenId}:`, error);
      return false;
    }
  }
  
  /**
   * Get all SBTs for a user
   * 
   * @param userId The user's ID
   * @returns Array of SBT credentials
   */
  async getUserSBTs(userId: number): Promise<SBTCredential[]> {
    try {
      // Find all SBTs in the verified credentials table
      const credentials = await db
        .select()
        .from(schema.verifiedCredentials)
        .where(and(
          eq(schema.verifiedCredentials.userId, userId),
          eq(schema.verifiedCredentials.type, 'sbt_identity')
        ));
      
      // Parse SBT data from each credential
      return credentials.map(c => JSON.parse(c.credential) as SBTCredential);
    } catch (error) {
      logger.error('[SBT] Error getting user Soulbound Tokens', error);
      return [];
    }
  }
  
  /**
   * Get SBT for an organization (including non-profits)
   * 
   * @param organizationId The organization's ID
   * @returns The organization's SBT credential or null if not found
   */
  async getOrganizationSBT(organizationId: number): Promise<SBTCredential | null> {
    try {
      // Find the organization first
      const [organization] = await db
        .select()
        .from(schema.organizations)
        .where(eq(schema.organizations.id, organizationId));
      
      if (!organization || !organization.sbtId) {
        logger.warn(`[SBT] No SBT found for organization ${organizationId}`);
        return null;
      }
      
      // Get the SBT by ID
      return await this.getSBT(organization.sbtId);
    } catch (error) {
      logger.error('[SBT] Error getting organization SBT', error);
      return null;
    }
  }
  
  /**
   * Verify an organization by checking its credentials and updating its verified status
   * 
   * @param organizationId The organization's ID
   * @param verifierUserId The user ID of the person verifying the organization
   * @param verificationMethod The method used for verification
   * @param notes Optional notes about the verification
   * @returns True if the organization was verified, false otherwise
   */
  async verifyOrganization(
    organizationId: number,
    verifierUserId: number,
    verificationMethod: string,
    notes?: string
  ): Promise<boolean> {
    try {
      // Get the organization
      const [organization] = await db
        .select()
        .from(schema.organizations)
        .where(eq(schema.organizations.id, organizationId));
      
      if (!organization) {
        logger.warn(`[SBT] Organization ${organizationId} not found for verification`);
        return false;
      }
      
      // Update the organization's verification status
      await db
        .update(schema.organizations)
        .set({
          verified: true,
          verificationDate: new Date(),
          verificationMethod,
          updatedAt: new Date()
        })
        .where(eq(schema.organizations.id, organizationId));
      
      // Record the verification in the organizationVerifications table
      await db
        .insert(schema.organizationVerifications)
        .values({
          organizationId,
          verificationType: 'manual',
          verifierUserId,
          status: 'approved',
          notes: notes || `Verified by user ${verifierUserId} using ${verificationMethod}`,
        });
      
      // If the organization has an SBT, update its metadata to reflect verification
      const sbt = await this.getOrganizationSBT(organizationId);
      if (sbt) {
        // Find the verification status attribute and update it
        const updatedAttributes = sbt.metadata.attributes.map(attr => {
          if (attr.trait_type === 'Verification Status') {
            return {
              ...attr,
              value: 'Verified'
            };
          }
          return attr;
        });
        
        // Add verification date attribute if it doesn't exist
        if (!updatedAttributes.find(attr => attr.trait_type === 'Verified On')) {
          updatedAttributes.push({
            trait_type: 'Verified On',
            value: new Date().toISOString().split('T')[0]
          });
        }
        
        // Update the SBT metadata
        const [credential] = await db
          .select()
          .from(schema.verifiedCredentials)
          .where(eq(schema.verifiedCredentials.revocationId, sbt.id));
        
        if (credential) {
          const updatedSbt = JSON.parse(credential.credential) as SBTCredential;
          updatedSbt.metadata.attributes = updatedAttributes;
          
          await db
            .update(schema.verifiedCredentials)
            .set({
              credential: JSON.stringify(updatedSbt),
              metadata: {
                ...credential.metadata,
                attributes: updatedAttributes
              }
            })
            .where(eq(schema.verifiedCredentials.id, credential.id));
        }
      }
      
      logger.info(`[SBT] Organization ${organizationId} (${organization.name}) verified successfully`);
      return true;
    } catch (error) {
      logger.error('[SBT] Error verifying organization', error);
      return false;
    }
  }
  
  /**
   * Verify an SBT using ZKP
   * 
   * @param sbtId The SBT's unique ID
   * @param proof Optional proof data for verification
   * @returns True if the SBT is valid, false otherwise
   */
  /**
   * Handle a donation to an organization and update its reputation score
   * 
   * @param userId The donor's user ID
   * @param organizationId The organization's ID
   * @param amount The donation amount
   * @param message Optional message from donor
   * @param anonymous Whether the donation should be anonymous
   * @returns The donation record if successful, null otherwise
   */
  async processDonationToOrganization(
    userId: number, 
    organizationId: number, 
    amount: number,
    message?: string,
    anonymous: boolean = false
  ): Promise<schema.OrgDonation | null> {
    try {
      // Verify the organization exists and has an SBT
      const [organization] = await db
        .select()
        .from(schema.organizations)
        .where(eq(schema.organizations.id, organizationId));
      
      if (!organization) {
        logger.warn(`[SBT] Cannot process donation - Organization ${organizationId} not found`);
        return null;
      }
      
      // Record the donation
      const [donation] = await db
        .insert(schema.orgDonations)
        .values({
          userId,
          organizationId,
          amount,
          message,
          anonymous,
          currency: 'USD', // Default currency
        })
        .returning();
      
      if (!donation) {
        logger.error(`[SBT] Failed to record donation to organization ${organizationId}`);
        return null;
      }
      
      // Calculate reputation increase based on donation amount
      // Simple formula: 1 reputation point per $10 donated (adjust as needed)
      const reputationIncrease = Math.max(1, Math.floor(amount / 10));
      
      // Update organization's reputation score
      await db
        .update(schema.organizations)
        .set({
          reputationScore: organization.reputationScore + reputationIncrease,
          updatedAt: new Date()
        })
        .where(eq(schema.organizations.id, organizationId));
      
      // If the organization has an SBT, update its metadata to reflect new donation stats
      if (organization.sbtId) {
        const sbt = await this.getSBT(organization.sbtId);
        if (sbt) {
          // Find total donations for this organization
          const donations = await db
            .select({
              totalAmount: sql`SUM(amount)`,
              donorCount: sql`COUNT(DISTINCT user_id)`
            })
            .from(schema.orgDonations)
            .where(eq(schema.orgDonations.organizationId, organizationId));
          
          const totalDonations = donations[0]?.totalAmount || amount;
          const donorCount = donations[0]?.donorCount || 1;
          
          // Update the SBT metadata with donation stats
          const [credential] = await db
            .select()
            .from(schema.verifiedCredentials)
            .where(eq(schema.verifiedCredentials.revocationId, organization.sbtId));
          
          if (credential) {
            const updatedSbt = JSON.parse(credential.credential) as SBTCredential;
            
            // Find and update existing donation attributes or add new ones
            let hasUpdatedTotalDonations = false;
            let hasUpdatedDonorCount = false;
            
            const updatedAttributes = updatedSbt.metadata.attributes.map(attr => {
              if (attr.trait_type === 'Total Donations') {
                hasUpdatedTotalDonations = true;
                return { ...attr, value: totalDonations };
              }
              if (attr.trait_type === 'Donor Count') {
                hasUpdatedDonorCount = true;
                return { ...attr, value: donorCount };
              }
              return attr;
            });
            
            // Add new attributes if they don't exist
            if (!hasUpdatedTotalDonations) {
              updatedAttributes.push({
                trait_type: 'Total Donations',
                value: totalDonations
              });
            }
            
            if (!hasUpdatedDonorCount) {
              updatedAttributes.push({
                trait_type: 'Donor Count',
                value: donorCount
              });
            }
            
            // Update the attributes and metadata
            updatedSbt.metadata.attributes = updatedAttributes;
            
            await db
              .update(schema.verifiedCredentials)
              .set({
                credential: JSON.stringify(updatedSbt)
              })
              .where(eq(schema.verifiedCredentials.id, credential.id));
          }
        }
      }
      
      logger.info(`[SBT] Processed donation of ${amount} to organization ${organizationId} (${organization.name})`);
      return donation;
    } catch (error) {
      logger.error('[SBT] Error processing donation to organization', error);
      return null;
    }
  }

  async verifySBT(sbtId: string, proof?: any): Promise<boolean> {
    try {
      const sbt = await this.getSBT(sbtId);
      
      if (!sbt) {
        logger.warn(`[SBT] SBT ${sbtId} not found`);
        return false;
      }
      
      // Check if the SBT is revoked
      if (sbt.revoked) {
        logger.warn(`[SBT] SBT ${sbtId} has been revoked`);
        return false;
      }
      
      // Check if the SBT is expired
      if (sbt.expiresAt && sbt.expiresAt < new Date()) {
        logger.warn(`[SBT] SBT ${sbtId} has expired`);
        return false;
      }
      
      // If there's a proof ID, verify it
      if (sbt.proofId && !proof) {
        // In a real implementation, we would verify the on-chain proof
        // For now, we'll just check that the proof exists
        logger.info(`[SBT] Verified SBT ${sbtId} using proof ${sbt.proofId}`);
        return true;
      }
      
      // If a custom proof was provided, verify it
      if (proof) {
        const isValid = await verifyReputationProof(proof);
        logger.info(`[SBT] Verified SBT ${sbtId} with custom proof: ${isValid}`);
        return isValid;
      }
      
      // If we get here, the SBT is valid but doesn't have a proof
      logger.info(`[SBT] Verified SBT ${sbtId} (no proof)`);
      return true;
    } catch (error) {
      logger.error('[SBT] Error verifying Soulbound Token', error);
      return false;
    }
  }
  
  /**
   * Revoke an SBT
   * 
   * @param sbtId The SBT's unique ID
   * @param userId The user's ID (for authorization)
   * @param reason Optional reason for revocation
   * @returns True if the SBT was revoked, false otherwise
   */
  async revokeSBT(sbtId: string, userId: number, reason?: string): Promise<boolean> {
    try {
      // Find the SBT in the verified credentials table
      const [credential] = await db
        .select()
        .from(schema.verifiedCredentials)
        .where(and(
          eq(schema.verifiedCredentials.type, 'sbt_identity'),
          eq(schema.verifiedCredentials.revocationId, sbtId),
          eq(schema.verifiedCredentials.userId, userId)
        ));
      
      if (!credential) {
        logger.warn(`[SBT] SBT ${sbtId} not found for user ${userId}`);
        return false;
      }
      
      // Parse the SBT data
      const sbt = JSON.parse(credential.credential) as SBTCredential;
      
      // Mark as revoked
      sbt.revoked = true;
      
      // Update the credential
      await db
        .update(schema.verifiedCredentials)
        .set({
          credential: JSON.stringify(sbt),
          metadata: {
            ...credential.metadata,
            revoked: true,
            revokedAt: new Date(),
            revocationReason: reason || 'User requested'
          }
        })
        .where(eq(schema.verifiedCredentials.id, credential.id));
      
      logger.info(`[SBT] Revoked SBT ${sbtId} for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('[SBT] Error revoking Soulbound Token', error);
      return false;
    }
  }
  
  /**
   * Generate a selective disclosure proof for an SBT
   * 
   * @param sbtId The SBT's unique ID
   * @param attributes Array of attributes to disclose
   * @returns Selective disclosure proof or null if failed
   */
  async createSelectiveDisclosure(sbtId: string, attributes: string[]): Promise<any> {
    try {
      const sbt = await this.getSBT(sbtId);
      
      if (!sbt) {
        logger.warn(`[SBT] SBT ${sbtId} not found`);
        return null;
      }
      
      // Create a disclosure with only the specified attributes
      const disclosure = {
        id: sbt.id,
        type: 'selective-disclosure',
        attributes: {} as Record<string, any>
      };
      
      // Add requested attributes
      for (const attr of attributes) {
        if (attr === 'metadata') {
          // Special handling for metadata to avoid disclosing sensitive fields
          disclosure.attributes.metadata = {
            name: sbt.metadata.name,
            description: sbt.metadata.description,
            image: sbt.metadata.image,
            attributes: sbt.metadata.attributes
          };
        } else if (attr in sbt) {
          disclosure.attributes[attr] = (sbt as any)[attr];
        }
      }
      
      logger.info(`[SBT] Created selective disclosure for SBT ${sbtId}`);
      return disclosure;
    } catch (error) {
      logger.error('[SBT] Error creating selective disclosure', error);
      return null;
    }
  }
}

// Export singleton instance
export const sbtService = new SBTService();