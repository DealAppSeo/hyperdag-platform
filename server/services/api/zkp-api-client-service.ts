/**
 * ZKP API Client Service
 * 
 * Provides a public API interface for developers to integrate with the HyperDAG
 * ZKP reputation system. This service enables third-party verification of
 * reputation credentials without revealing personal identifiable information.
 */

import { logger } from '../../utils/logger';
import * as redundantZKPService from '../redundancy/zkp/redundant-zkp-service';
import * as reputationZKPService from '../zkp/reputation-zkp-service';
import * as repIdService from '../reputation/rep-id-service';
import { db } from '../../db';
import { users, reputationActivities, verifiedCredentials } from '@shared/schema';
import { eq, and, gte, desc, sql } from 'drizzle-orm';
import { randomBytes } from 'crypto';

// Types for the API client
export interface ZKPVerificationRequest {
  proof: string;
  publicInputs: any;
  category?: string;
  minScore?: number;
}

export interface CredentialVerificationRequest {
  credentialId: string;
  proof: string;
  challenge?: string;
}

export interface ZKPRepIDResult {
  success: boolean;
  isVerified: boolean;
  repId?: string; // Non-identifiable reputation ID
  score?: number; // The score only if successful verification
  categories?: string[]; // Reputation categories if requested and verified
  message?: string;
  error?: any;
}

// Generate a non-identifiable RepID that's consistent for a user but doesn't reveal identity
export async function generateNonIdentifiableRepId(userId: number): Promise<string> {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        repIdCommitment: true
      }
    });

    // If user has an existing commitment, use that as basis for the ID
    if (user?.repIdCommitment) {
      // Use only the first 8 bytes of the hash, convert to Base64 for readability
      // This makes it non-identifiable but consistent for the user
      return `rep_${Buffer.from(user.repIdCommitment.slice(0, 16), 'hex').toString('base64')}`;
    }
    
    // If no commitment exists, create a random ID
    // (This will change with every call until a commitment is set)
    const randomId = randomBytes(12).toString('base64');
    return `rep_${randomId}`;
  } catch (error) {
    logger.error('[zkp-api-client] Error generating non-identifiable RepID:', error);
    // Return a random ID in case of error to not leak any info
    return `rep_${randomBytes(12).toString('base64')}`;
  }
}

/**
 * Verify a user's reputation with zero-knowledge proof
 * 
 * @param data The verification request data
 * @returns Verification result with non-identifiable RepID
 */
export async function verifyReputationWithZKP(data: ZKPVerificationRequest): Promise<ZKPRepIDResult> {
  try {
    if (!data.proof || !data.publicInputs) {
      return {
        success: false,
        isVerified: false,
        message: 'Missing proof or public inputs'
      };
    }

    // Verify the zero-knowledge proof
    const verification = await redundantZKPService.verifyProof(
      'reputation',
      data.proof,
      data.publicInputs
    );

    if (!verification.success || !verification.isValid) {
      return {
        success: false,
        isVerified: false,
        message: 'Invalid proof',
        error: verification.error
      };
    }

    // Extract user ID from the verified public inputs
    // The format depends on your ZKP implementation
    const userId = parseInt(data.publicInputs.userId || '0');
    
    if (!userId) {
      return {
        success: true,
        isVerified: true,
        message: 'Proof verified but user ID not found in public inputs'
      };
    }

    // Get reputation information
    const repResult = await repIdService.getUserReputation(userId);
    
    if (!repResult.success) {
      return {
        success: true,
        isVerified: true,
        message: 'Proof verified but reputation data not found'
      };
    }

    // Check if the score meets minimum requirements if specified
    if (data.minScore && repResult.data.score < data.minScore) {
      return {
        success: true,
        isVerified: false,
        message: `Reputation score below minimum requirement: ${repResult.data.score} < ${data.minScore}`
      };
    }

    // Filter by category if specified
    let categories = repResult.data.categories || [];
    if (data.category && !categories.includes(data.category)) {
      return {
        success: true,
        isVerified: false,
        message: `User does not have reputation in the ${data.category} category`
      };
    }

    // Generate non-identifiable RepID for the user
    const repId = await generateNonIdentifiableRepId(userId);

    // Return success with the non-identifiable RepID and verified information
    return {
      success: true,
      isVerified: true,
      repId,
      score: repResult.data.score,
      categories: repResult.data.categories,
      message: 'Reputation verified successfully'
    };
  } catch (error) {
    logger.error('[zkp-api-client] Error verifying reputation with ZKP:', error);
    return {
      success: false,
      isVerified: false,
      message: 'Error verifying reputation',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Verify a specific credential with zero-knowledge proof
 * 
 * @param data Credential verification request
 * @returns Verification result
 */
export async function verifyCredential(data: CredentialVerificationRequest): Promise<ZKPRepIDResult> {
  try {
    if (!data.credentialId || !data.proof) {
      return {
        success: false,
        isVerified: false,
        message: 'Missing credential ID or proof'
      };
    }

    // Fetch the credential to verify
    const credential = await db.query.verifiedCredentials.findFirst({
      where: eq(verifiedCredentials.id, data.credentialId)
    });

    if (!credential) {
      return {
        success: false,
        isVerified: false,
        message: 'Credential not found'
      };
    }

    // Verify the credential proof
    const verification = await reputationZKPService.verifyCredentialProof(
      data.proof,
      credential.commitment,
      data.challenge || '' // Optional challenge for additional security
    );

    if (!verification.success) {
      return {
        success: false,
        isVerified: false,
        message: 'Invalid credential proof',
        error: verification.error
      };
    }

    // Generate non-identifiable RepID for the user
    const repId = await generateNonIdentifiableRepId(credential.userId);

    // Return success with non-identifiable information
    return {
      success: true,
      isVerified: true,
      repId,
      categories: [credential.type], // Return the credential type as a category
      message: 'Credential verified successfully'
    };
  } catch (error) {
    logger.error('[zkp-api-client] Error verifying credential:', error);
    return {
      success: false,
      isVerified: false,
      message: 'Error verifying credential',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Get anonymized reputation statistics for a given category
 * Used by developers to understand reputation distribution without compromising privacy
 * 
 * @param category The reputation category
 * @returns Statistics about the reputation category
 */
export async function getAnonymizedRepStats(category: string): Promise<{
  success: boolean;
  data?: {
    category: string;
    userCount: number;
    averageScore: number;
    distribution: {
      range: string;
      count: number;
      percentage: number;
    }[];
  };
  message?: string;
  error?: any;
}> {
  try {
    // Query reputation statistics while preserving privacy
    const categoryActivities = await db.query.reputationActivities.findMany({
      where: eq(reputationActivities.type, category),
      columns: {
        points: true
      }
    });

    if (!categoryActivities.length) {
      return {
        success: true,
        data: {
          category,
          userCount: 0,
          averageScore: 0,
          distribution: []
        },
        message: 'No data available for this category'
      };
    }

    // Calculate basic statistics
    const totalPoints = categoryActivities.reduce((sum, act) => sum + act.points, 0);
    const averageScore = totalPoints / categoryActivities.length;

    // Get unique user count with this reputation type (anonymized)
    const userCountResult = await db.execute(
      sql`SELECT COUNT(DISTINCT "userId") AS "userCount" FROM "reputation_activities" WHERE "type" = ${category}`
    );
    const userCount = parseInt(userCountResult.rows[0]?.userCount || '0');

    // Create distribution ranges
    const ranges = [
      { min: 0, max: 10, label: '0-10', count: 0 },
      { min: 11, max: 25, label: '11-25', count: 0 },
      { min: 26, max: 50, label: '26-50', count: 0 },
      { min: 51, max: 100, label: '51-100', count: 0 },
      { min: 101, max: Number.MAX_SAFE_INTEGER, label: '101+', count: 0 }
    ];

    // Count activities in each range
    categoryActivities.forEach(act => {
      const range = ranges.find(r => act.points >= r.min && act.points <= r.max);
      if (range) range.count++;
    });

    // Calculate percentages
    const distribution = ranges.map(range => ({
      range: range.label,
      count: range.count,
      percentage: Math.round((range.count / categoryActivities.length) * 100) / 100
    }));

    return {
      success: true,
      data: {
        category,
        userCount,
        averageScore: Math.round(averageScore * 100) / 100,
        distribution
      }
    };
  } catch (error) {
    logger.error('[zkp-api-client] Error getting anonymized reputation stats:', error);
    return {
      success: false,
      message: 'Error retrieving reputation statistics',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}