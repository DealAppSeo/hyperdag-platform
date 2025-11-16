# HyperDAG Smart Contracts

This directory contains the smart contracts for the HyperDAG platform. These contracts form the foundation of the decentralized crowdfunding and project collaboration platform.

## Contracts

### HyperCrowd.sol

The main contract for the HyperDAG platform. It handles:

- Project creation and management
- Team formation
- Funding mechanism
- Proposal submission and approval process

### HDAGToken.sol

The ERC-20 token contract for the HDAG token. It includes:

- Token distribution mechanics
- Vesting schedules for team and investors
- Burning, pausing, and token management functions

## Deployment

These contracts are designed to be deployed on the Polygon zkEVM Cardona testnet. To deploy them, you'll need:

1. A wallet with testnet MATIC tokens
2. The contract addresses for token distribution (for HDAGToken deployment)

### Deployment Process

1. Deploy the HDAGToken contract first, specifying the following addresses:
   - Ecosystem fund address
   - Team fund address
   - Investors fund address
   - Reserve fund address

2. Deploy the HyperCrowd contract

3. The HyperCrowd contract will use the native token (MATIC) for transactions, but can be integrated with the HDAG token for staking and governance.

## Using with HyperDAG SDK

Once deployed, you can interact with these contracts using the HyperDAG SDK. The SDK provides a simple interface for:

- Creating and funding projects
- Joining teams
- Submitting and accepting proposals
- Managing token distributions

## Security Considerations

The contracts implement several security features:

- Access control using OpenZeppelin's Ownable pattern
- Checks for critical operations like fund transfers
- Event emission for all significant state changes

## Testing

Before deploying to the testnet, you can test these contracts using a local blockchain like Hardhat or Ganache. The tests should verify:

- Project creation and funding
- Team formation and member joining
- Proposal submission and acceptance
- Token distribution and vesting

## License

These contracts are licensed under the MIT License.

---

## RepIDNFT.sol - Soulbound Reputation Credentials

### Overview
Privacy-preserving Soulbound Token (SBT) for reputation credentials with Zero-Knowledge Proof (ZKP) support.

### Features
- **Soulbound Behavior**: Cannot be transferred or approved (properly overrides all ERC721 transfer functions)
- **ZKP Integration**: Stores proof hashes on-chain for privacy-preserving verification
- **Burn/Revocation**: Authorized parties can revoke credentials
- **Multi-dimensional Scores**: Tracks authenticity, contribution, and consistency separately

### Current Status
✅ Smart contract fully implemented with proper soulbound behavior  
✅ ZKP service uses real Fiat-Shamir heuristic proofs  
⚠️ API currently uses in-memory storage (MVP) - ready for blockchain integration  

### Production Upgrade Path
1. Deploy contract to Polygon Cardona zkEVM testnet
2. Replace in-memory Map with ethers.js contract calls in API
3. Persist full proof objects for external verification

See `/server/api/routes/repid.ts` for API endpoints and `/server/services/repid/zkp-repid-service.ts` for cryptographic proof generation.
