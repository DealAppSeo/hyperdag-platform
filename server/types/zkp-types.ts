/**
 * Types for the Zero-Knowledge Proof System
 * 
 * This file defines the common types used across the ZKP implementation
 * including the circuit types, proof structures, and verification results.
 */

/**
 * Enum for the different types of ZK circuits
 */
export enum CircuitType {
  IDENTITY = 'IDENTITY',        // For identity-related proofs (nullifiers, commitments)
  REPUTATION = 'REPUTATION',    // For reputation verification and calculation
  CREDENTIAL = 'CREDENTIAL',    // For credential verification without revealing data
  VOTE = 'VOTE',                // For anonymous voting mechanisms
  CUSTOM = 'CUSTOM'             // For user-defined custom circuits
}

/**
 * Interface for a ZK circuit
 */
export interface ZKCircuit {
  id: string;                          // Unique identifier or name for the circuit
  type: CircuitType;                   // Type of circuit
  privateInputs: Record<string, any>;  // Private inputs not revealed in the proof
  publicInputs: Record<string, any>;   // Public inputs/outputs visible in the proof
  verificationKey?: string;            // Optional verification key
}

/**
 * Interface for a generated proof
 */
export interface ZKProof {
  id: string;                          // Unique identifier for the proof
  circuitId: string;                   // ID of the circuit used to generate this proof
  proof: string;                       // The actual proof data (serialized)
  publicInputs: Record<string, any>;   // Public inputs/outputs
  provider: string;                    // Provider that generated this proof
  userId?: number;                     // Optional user ID this proof is for
  createdAt: Date;                     // When the proof was created
  expiresAt?: Date;                    // Optional expiration date
  verificationResult?: boolean;        // Optional cached verification result
  metadata?: Record<string, any>;      // Optional additional metadata
}

/**
 * Interface for an identity commitment
 */
export interface ZKIdentityCommitment {
  userId: number;                      // User this commitment belongs to
  commitment: string;                  // Commitment value
  nullifier: string;                   // Nullifier to prevent double-spending
  provider: string;                    // Provider that generated this commitment
  createdAt: Date;                     // When the commitment was created
  isRevoked: boolean;                  // Whether this commitment has been revoked
}

/**
 * Interface for verification results
 */
export interface ZKVerificationResult {
  valid: boolean;                     // Whether the proof is valid
  provider: string;                   // Provider that performed verification
  verificationTime: number;           // Time taken for verification in ms
  timestamp: Date;                    // When verification was performed
}

/**
 * Interface for a supported ZK provider
 */
export interface ZKProvider {
  id: string;                         // Unique identifier for the provider
  name: string;                       // Human-readable name
  status: 'available' | 'unavailable' | 'degraded'; // Current status
  priority: number;                   // Priority (lower = higher priority)
  supportedCircuitTypes: CircuitType[];  // Circuit types this provider supports
  lastStatusCheck: Date;              // Last time status was checked
}