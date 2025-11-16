import { type User } from '@shared/schema';
import { storage } from '../storage';
import Moralis from 'moralis';
import { db } from '../db';
import { verifiedCredentials } from '@shared/schema';

interface IdentityMetadata {
  name?: string;
  description?: string;
  image?: string;
  externalUrl?: string;
  attributes?: {
    trait_type: string;
    value: string | number | boolean;
  }[];
}

export interface CredentialData {
  [key: string]: string | number | boolean | null;
}

export interface AddCredentialParams {
  tokenId: number;
  credentialType: string;
  credentialData: CredentialData;
}

export interface CreateProofParams {
  tokenId: number;
  credentialType: string;
  publicInput: Record<string, any>;
  privateInput: Record<string, any>;
}

export interface VerifyProofParams {
  tokenId: number;
  credentialType: string;
  proof: any;
}

export class IdentityService {
  private circuits: Map<string, any> = new Map();
  
  constructor() {
    // Initialize ZK circuits
    this.initializeCircuits();
    console.log('[identity-service] ZK identity service initialized');
  }

  private initializeCircuits() {
    // Mock circuits initialization - in production would load actual circuits
    const mockCircuits = ['reputation', 'age', 'education', 'employment', 'kyc'];
    mockCircuits.forEach(circuit => {
      this.circuits.set(circuit, {
        name: circuit,
        prove: async (publicInput: any, privateInput: any) => {
          // In a real implementation, this would use the actual ZK proving system
          return {
            proof: {
              pi_a: ['0x1234...', '0x5678...', '0x9abc...'],
              pi_b: [['0xdef0...', '0x1234...'], ['0x5678...', '0x9abc...']],
              pi_c: ['0xdef0...', '0x1234...'],
              publicSignals: Object.values(publicInput)
            },
            publicInput
          };
        },
        verify: async (proof: any, publicSignals: any) => {
          // In a real implementation, this would verify the ZK proof
          return true;
        }
      });
    });
    console.log(`[identity-service] Initialized ${mockCircuits.length} ZK circuits`);
  }

  // Check if user has an identity token
  async getIdentityStatus(userId: number): Promise<{hasIdentity: boolean, tokenId?: number}> {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Check if user has wallet address
      if (!user.walletAddress) {
        return { hasIdentity: false };
      }
      
      // Check for SBT - in a real implementation, would query the blockchain
      // Mock implementation for now
      const tokenId = await this.getIdentityTokenForWallet(user.walletAddress);
      return {
        hasIdentity: tokenId !== null,
        tokenId: tokenId !== null ? tokenId : undefined
      };
    } catch (error) {
      console.error('[identity-service] Error getting identity status:', error);
      return { hasIdentity: false };
    }
  }

  // Create a new identity token (SBT)
  async createIdentity(userId: number, metadata: IdentityMetadata): Promise<{success: boolean, tokenId?: number}> {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      if (!user.walletAddress) {
        throw new Error('User has no wallet address');
      }
      
      // Check if user already has identity
      const { hasIdentity, tokenId } = await this.getIdentityStatus(userId);
      if (hasIdentity && tokenId) {
        return { success: true, tokenId };
      }
      
      // In a real implementation, would mint the SBT on the blockchain
      // Mock implementation for now
      const newTokenId = Math.floor(1000000 + Math.random() * 9000000);
      
      // Store in database
      await this.storeIdentityToken(userId, user.walletAddress, newTokenId, metadata);
      
      console.log(`[identity-service] Created identity token ${newTokenId} for user ${userId}`);
      return { success: true, tokenId: newTokenId };
    } catch (error) {
      console.error('[identity-service] Error creating identity:', error);
      return { success: false };
    }
  }

  // Add a credential to an identity
  async addCredential(userId: number, params: AddCredentialParams): Promise<{success: boolean}> {
    try {
      const { tokenId, credentialType, credentialData } = params;
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Verify the token belongs to the user
      const { hasIdentity, tokenId: userTokenId } = await this.getIdentityStatus(userId);
      if (!hasIdentity || userTokenId !== tokenId) {
        throw new Error('Invalid token ID');
      }
      
      // Generate commitment for the credential (hash of the data)
      const commitment = this.generateCommitment(credentialData);
      
      // Store in database
      await this.storeCredential(userId, tokenId, credentialType, credentialData, commitment);
      
      console.log(`[identity-service] Added ${credentialType} credential to token ${tokenId}`);
      return { success: true };
    } catch (error) {
      console.error('[identity-service] Error adding credential:', error);
      return { success: false };
    }
  }

  // Create a zero-knowledge proof
  async createProof(userId: number, params: CreateProofParams): Promise<{success: boolean, proof: any}> {
    try {
      const { tokenId, credentialType, publicInput, privateInput } = params;
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Verify the token belongs to the user
      const { hasIdentity, tokenId: userTokenId } = await this.getIdentityStatus(userId);
      if (!hasIdentity || userTokenId !== tokenId) {
        throw new Error('Invalid token ID');
      }
      
      // Check if circuit exists
      if (!this.circuits.has(credentialType)) {
        throw new Error(`Circuit for ${credentialType} not found`);
      }
      
      // Get credential from database
      const credential = await this.getCredential(userId, tokenId, credentialType);
      if (!credential) {
        throw new Error('Credential not found');
      }
      
      // Merge privateInput with actual credential data for proving
      const fullPrivateInput = {
        ...privateInput,
        credential: credential.data
      };
      
      // Generate proof
      const circuit = this.circuits.get(credentialType);
      const { proof } = await circuit.prove(publicInput, fullPrivateInput);
      
      console.log(`[identity-service] Created ${credentialType} proof for token ${tokenId}`);
      return { success: true, proof };
    } catch (error) {
      console.error('[identity-service] Error creating proof:', error);
      return { success: false, proof: null };
    }
  }

  // Verify a zero-knowledge proof
  async verifyProof(params: VerifyProofParams): Promise<{success: boolean, verified: boolean}> {
    try {
      const { tokenId, credentialType, proof } = params;
      
      // Check if circuit exists
      if (!this.circuits.has(credentialType)) {
        throw new Error(`Circuit for ${credentialType} not found`);
      }
      
      // Verify proof
      const circuit = this.circuits.get(credentialType);
      const publicSignals = proof.publicSignals || [];
      const verified = await circuit.verify(proof, publicSignals);
      
      console.log(`[identity-service] Verified ${credentialType} proof for token ${tokenId}: ${verified}`);
      return { success: true, verified };
    } catch (error) {
      console.error('[identity-service] Error verifying proof:', error);
      return { success: false, verified: false };
    }
  }

  // Helper to get identity token for a wallet
  private async getIdentityTokenForWallet(walletAddress: string): Promise<number | null> {
    try {
      // In a real implementation, would query the blockchain
      // For now, check our local database
      const result = await db.query.verifiedCredentials.findFirst({
        where: (vc, { eq }) => eq(vc.walletAddress, walletAddress.toLowerCase()),
        columns: {
          tokenId: true
        }
      });
      
      return result?.tokenId || null;
    } catch (error) {
      console.error('[identity-service] Error getting identity token for wallet:', error);
      return null;
    }
  }

  // Helper to store identity token in database
  private async storeIdentityToken(userId: number, walletAddress: string, tokenId: number, metadata: IdentityMetadata): Promise<void> {
    // Would store in the database and/or blockchain
    try {
      await db.insert(verifiedCredentials).values({
        userId,
        walletAddress: walletAddress.toLowerCase(),
        tokenId,
        credentialType: 'identity',
        data: JSON.stringify(metadata),
        commitment: this.generateCommitment(metadata),
        issuedAt: new Date()
      });
    } catch (error) {
      console.error('[identity-service] Error storing identity token:', error);
      throw error;
    }
  }

  // Helper to store a credential in database
  private async storeCredential(userId: number, tokenId: number, credentialType: string, data: CredentialData, commitment: string): Promise<void> {
    try {
      await db.insert(verifiedCredentials).values({
        userId,
        tokenId,
        credentialType,
        data: JSON.stringify(data),
        commitment,
        issuedAt: new Date()
      });
    } catch (error) {
      console.error('[identity-service] Error storing credential:', error);
      throw error;
    }
  }

  // Helper to get a credential from database
  private async getCredential(userId: number, tokenId: number, credentialType: string): Promise<{data: CredentialData, commitment: string} | null> {
    try {
      const result = await db.query.verifiedCredentials.findFirst({
        where: (vc, { and, eq }) => and(
          eq(vc.userId, userId),
          eq(vc.tokenId, tokenId),
          eq(vc.credentialType, credentialType)
        )
      });
      
      if (!result) {
        return null;
      }
      
      return {
        data: JSON.parse(result.data),
        commitment: result.commitment
      };
    } catch (error) {
      console.error('[identity-service] Error getting credential:', error);
      return null;
    }
  }

  // Helper to generate a commitment (hash) for credential data
  private generateCommitment(data: any): string {
    // In a real implementation, would use a cryptographic hash function
    // For mock purposes, just stringify and encode
    const stringified = JSON.stringify(data);
    return Buffer.from(stringified).toString('base64');
  }

  // Query Moralis for NFT ownership (not used in mock implementation but would be in production)
  private async queryMoralisForNFTs(walletAddress: string, contractAddress: string): Promise<any[]> {
    try {
      const chain = '0x89'; // Polygon Mainnet
      
      const response = await Moralis.EvmApi.nft.getWalletNFTs({
        address: walletAddress,
        chain,
      });
      
      // Filter for our SBT contract
      return response.result.filter(nft => 
        nft.tokenAddress.toLowerCase() === contractAddress.toLowerCase()
      );
    } catch (error) {
      console.error('[identity-service] Error querying Moralis for NFTs:', error);
      return [];
    }
  }
}

export const identityService = new IdentityService();