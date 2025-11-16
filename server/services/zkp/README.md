# HyperDAG Zero-Knowledge Proof (ZKP) System

This directory contains the implementation of HyperDAG's Zero-Knowledge Proof system. The system allows users to prove certain properties of their reputation without revealing the underlying data.

## Key Components

### 1. Reputation ZKP Service (`reputation-zkp-service.ts`)

The main service that provides ZKP functionality for the reputation system. It includes:

- **Proof Generation**: Creates cryptographic zero-knowledge proofs that verify a user's reputation properties
- **Proof Verification**: Verifies proofs submitted by users
- **Selective Disclosure**: Allows users to disclose only specific parts of their reputation
- **Reputation Commitments**: Enables privacy-preserving commitment to reputation scores
- **Credential Creation**: Generates verifiable credentials for reputation

### 2. Identity System

The ZKP system uses the following components for identity:

- **ZK Identity**: Uses `@zk-kit/identity` library to create cryptographic identities
- **Merkle Trees**: Uses `@zk-kit/incremental-merkle-tree` to create identity commitments
- **Nullifiers**: Prevents replay attacks by using one-time-use nullifiers

### 3. Circuit Implementation

For actual proof generation/verification, the system uses:

- **Circuit Files**: Located in `/circuits` directory
- **snarkjs**: For proof generation and verification
- **circomlib**: For cryptographic primitives like the Poseidon hash function

## How It Works

1. **Identity Creation**: A user's identity is created using three secret values:
   - Identity trapdoor
   - Identity nullifier
   - Identity secret

2. **Identity Commitment**: The identity is committed to a Merkle tree, enabling anonymous validation

3. **Proof Generation**: When a user wants to prove something about their reputation:
   - They generate a zero-knowledge proof using their identity and reputation data
   - The proof only reveals the specific information they want to share (e.g., "I have at least 100 reputation points")
   - The rest of the data remains private

4. **Proof Verification**: Anyone can verify the proof without learning the user's private data:
   - The verifier checks that the proof is valid cryptographically
   - They confirm that the identity commitment exists in the reputation Merkle tree
   - They verify that the claimed property is true (e.g., reputation ≥ threshold)

## Features

1. **Privacy-Preserving Reputation**:
   - Users can prove their reputation level without revealing exact scores
   - Different reputation aspects can be selectively disclosed

2. **Anonymous Authentication**:
   - Users can prove they're valid members of HyperDAG without revealing identity
   - Prevents sybil attacks while preserving privacy

3. **Verifiable Credentials**:
   - Users can obtain and share cryptographic credentials
   - Credentials can be verified by third parties

4. **Selective Disclosure**:
   - Users control exactly which parts of their data are shared
   - Minimizes data exposure while enabling verification

## Technical Implementation

The current implementation provides:

1. **Real Cryptographic ZKP**:
   - Uses actual cryptographic primitives (Poseidon hash, Merkle trees)
   - Implements the ZKP protocol using snarkjs and circomlib

2. **Fallback Simulation**:
   - When real circuit files aren't available, provides a compatible simulation
   - Maintains the correct interface structure for seamless integration

3. **Extensibility**:
   - Can be extended to support additional proof types
   - Modular design allows for future improvements

## Usage Examples

```typescript
// Generate a proof of reputation
const reputationData = {
  userId: 123,
  totalPoints: 500,
  contributionCount: 25,
  topCategory: "blockchain",
  averageRating: 4.8,
  lastUpdated: new Date()
};

// Prove the user has at least 300 reputation points in the "blockchain" category
const proof = await generateReputationProof(reputationData, 300, "blockchain");

// Verify the proof
const isValid = await verifyReputationProof(proof);
// isValid === true

// Create a selective disclosure of only certain reputation fields
const disclosure = createSelectiveDisclosure(reputationData, ["totalPoints", "topCategory"]);
// disclosure === { userId: 123, totalPoints: 500, topCategory: "blockchain" }
```

## Future Enhancements

1. **Additional Circuit Types**:
   - Reputation range proofs
   - Multi-category reputation proofs
   - Time-bound reputation proofs

2. **Performance Optimizations**:
   - Recursive proof composition
   - Batched proof verification
   - Optimized hash functions

3. **Integration With Other Systems**:
   - On-chain verification for blockchain applications
   - OAuth integration for third-party verification
   - Cross-platform credential verification