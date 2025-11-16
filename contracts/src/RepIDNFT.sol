// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * RepIDNFT - Soulbound ERC-721 NFTs for HyperDAG Reputation IDs
 * 
 * Key Features:
 * - Non-transferable (soulbound) reputation NFTs
 * - Hierarchical scoring (governance/community/technical)
 * - Activity-based minting (no pre-mining)
 * - Time-decay and multiplicative boosts
 * - ANFIS oracle integration for dynamic updates
 * - Gas-optimized batch operations
 */
contract RepIDNFT is ERC721, AccessControl, ReentrancyGuard, Pausable {
    bytes32 public constant ANFIS_ORACLE_ROLE = keccak256("ANFIS_ORACLE_ROLE");
    bytes32 public constant ZKP_VERIFIER_ROLE = keccak256("ZKP_VERIFIER_ROLE");
    
    struct RepIDData {
        // Hierarchical reputation scores (0-100)
        uint256 governanceScore;
        uint256 communityScore;
        uint256 technicalScore;
        
        // Dynamic evolution tracking
        uint256 lastUpdate;
        uint256 activityCount;
        uint256 decayMultiplier; // Basis points (10000 = 100%)
        
        // Metadata and verification
        string metadataURI; // IPFS link for extended metadata
        bytes32 zkpCommitment; // Zero-knowledge proof commitment
        
        // Custom developer fields
        mapping(string => uint256) customScores;
        mapping(string => string) customMetadata;
    }
    
    // Storage
    mapping(uint256 => RepIDData) public repIDs;
    mapping(address => uint256) public userToTokenId;
    mapping(string => bool) public supportedCustomFields;
    
    uint256 private _tokenIdCounter = 1;
    uint256 public constant DECAY_PERIOD = 30 days;
    uint256 public constant DEFAULT_DECAY_RATE = 9500; // 95% (5% decay per period)
    
    // Events
    event RepIDMinted(address indexed to, uint256 indexed tokenId, uint256 timestamp);
    event RepIDUpdated(uint256 indexed tokenId, uint256 newTotalScore, uint256 timestamp);
    event DecayApplied(uint256 indexed tokenId, uint256 decayMultiplier, uint256 timestamp);
    event CustomFieldAdded(string fieldName, bool enabled);
    
    constructor() ERC721("HyperDAG RepID", "REPID") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        
        // Initialize supported custom fields
        supportedCustomFields["faithTech"] = true;
        supportedCustomFields["defi"] = true;
        supportedCustomFields["socialImpact"] = true;
    }
    
    /**
     * Activity-based minting - Called by ANFIS oracle on user contribution
     * No pre-minting, users earn RepIDs through verified actions
     */
    function mintRepID(
        address to,
        uint256 governanceScore,
        uint256 communityScore,
        uint256 technicalScore,
        string memory metadataURI,
        bytes32 zkpCommitment
    ) external onlyRole(ANFIS_ORACLE_ROLE) nonReentrant whenNotPaused {
        require(to != address(0), "Cannot mint to zero address");
        require(userToTokenId[to] == 0, "User already has RepID");
        require(governanceScore <= 100 && communityScore <= 100 && technicalScore <= 100, "Scores must be <= 100");
        
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        
        RepIDData storage repID = repIDs[tokenId];
        repID.governanceScore = governanceScore;
        repID.communityScore = communityScore;
        repID.technicalScore = technicalScore;
        repID.lastUpdate = block.timestamp;
        repID.activityCount = 1;
        repID.decayMultiplier = 10000; // 100% (no decay initially)
        repID.metadataURI = metadataURI;
        repID.zkpCommitment = zkpCommitment;
        
        userToTokenId[to] = tokenId;
        
        emit RepIDMinted(to, tokenId, block.timestamp);
    }
    
    /**
     * Dynamic RepID evolution with decay and multiplicative boosts
     * Called by ANFIS oracle based on ongoing user activity
     */
    function updateRepID(
        uint256 tokenId,
        uint256 governanceDelta,
        uint256 communityDelta,
        uint256 technicalDelta,
        uint256 impactMultiplier, // Basis points (10000 = 100%)
        string memory newMetadataURI
    ) external onlyRole(ANFIS_ORACLE_ROLE) whenNotPaused {
        require(_exists(tokenId), "RepID does not exist");
        
        RepIDData storage repID = repIDs[tokenId];
        
        // Apply time-based decay if needed
        _applyDecay(tokenId);
        
        // Update scores with multiplicative boosts
        repID.governanceScore = _applyBoost(repID.governanceScore + governanceDelta, impactMultiplier);
        repID.communityScore = _applyBoost(repID.communityScore + communityDelta, impactMultiplier);
        repID.technicalScore = _applyBoost(repID.technicalScore + technicalDelta, impactMultiplier);
        
        // Ensure scores don't exceed 100
        repID.governanceScore = repID.governanceScore > 100 ? 100 : repID.governanceScore;
        repID.communityScore = repID.communityScore > 100 ? 100 : repID.communityScore;
        repID.technicalScore = repID.technicalScore > 100 ? 100 : repID.technicalScore;
        
        repID.lastUpdate = block.timestamp;
        repID.activityCount += 1;
        
        if (bytes(newMetadataURI).length > 0) {
            repID.metadataURI = newMetadataURI;
        }
        
        uint256 totalScore = repID.governanceScore + repID.communityScore + repID.technicalScore;
        emit RepIDUpdated(tokenId, totalScore, block.timestamp);
    }
    
    /**
     * Batch update multiple RepIDs for gas efficiency
     */
    function batchUpdateRepIDs(
        uint256[] calldata tokenIds,
        uint256[] calldata governanceDeltas,
        uint256[] calldata communityDeltas,
        uint256[] calldata technicalDeltas,
        uint256 impactMultiplier
    ) external onlyRole(ANFIS_ORACLE_ROLE) whenNotPaused {
        require(tokenIds.length == governanceDeltas.length, "Array length mismatch");
        require(tokenIds.length == communityDeltas.length, "Array length mismatch");
        require(tokenIds.length == technicalDeltas.length, "Array length mismatch");
        require(tokenIds.length <= 100, "Batch too large");
        
        for (uint256 i = 0; i < tokenIds.length; i++) {
            updateRepID(tokenIds[i], governanceDeltas[i], communityDeltas[i], technicalDeltas[i], impactMultiplier, "");
        }
    }
    
    /**
     * Apply time-based decay to RepID scores
     */
    function _applyDecay(uint256 tokenId) private {
        RepIDData storage repID = repIDs[tokenId];
        uint256 timeSinceUpdate = block.timestamp - repID.lastUpdate;
        
        if (timeSinceUpdate >= DECAY_PERIOD) {
            uint256 decayPeriods = timeSinceUpdate / DECAY_PERIOD;
            uint256 decayFactor = DEFAULT_DECAY_RATE;
            
            // Apply compound decay
            for (uint256 i = 0; i < decayPeriods && i < 12; i++) { // Cap at 12 periods (1 year)
                repID.governanceScore = (repID.governanceScore * decayFactor) / 10000;
                repID.communityScore = (repID.communityScore * decayFactor) / 10000;
                repID.technicalScore = (repID.technicalScore * decayFactor) / 10000;
            }
            
            repID.decayMultiplier = decayFactor;
            emit DecayApplied(tokenId, decayFactor, block.timestamp);
        }
    }
    
    /**
     * Apply multiplicative boost to score
     */
    function _applyBoost(uint256 score, uint256 multiplier) private pure returns (uint256) {
        return (score * multiplier) / 10000;
    }
    
    /**
     * ZKP verification for reputation claims
     * Returns true if RepID meets the specified threshold without revealing exact scores
     */
    function verifyRepIDThreshold(
        uint256 tokenId,
        uint256 threshold,
        bytes32 proofHash
    ) external view returns (bool) {
        require(_exists(tokenId), "RepID does not exist");
        
        RepIDData storage repID = repIDs[tokenId];
        uint256 totalScore = repID.governanceScore + repID.communityScore + repID.technicalScore;
        
        // In production, this would verify the ZKP proof
        // For MVP, we use a simple threshold check with proof hash validation
        bytes32 expectedHash = keccak256(abi.encodePacked(tokenId, threshold, totalScore));
        require(expectedHash == proofHash, "Invalid proof");
        
        return totalScore >= threshold;
    }
    
    /**
     * Get RepID data for external apps (public scores only)
     */
    function getRepIDData(uint256 tokenId) external view returns (
        uint256 governanceScore,
        uint256 communityScore,
        uint256 technicalScore,
        uint256 lastUpdate,
        uint256 activityCount,
        string memory metadataURI
    ) {
        require(_exists(tokenId), "RepID does not exist");
        
        RepIDData storage repID = repIDs[tokenId];
        return (
            repID.governanceScore,
            repID.communityScore,
            repID.technicalScore,
            repID.lastUpdate,
            repID.activityCount,
            repID.metadataURI
        );
    }
    
    /**
     * Developer customization - Add custom scoring field
     */
    function addCustomField(string memory fieldName) external onlyRole(DEFAULT_ADMIN_ROLE) {
        supportedCustomFields[fieldName] = true;
        emit CustomFieldAdded(fieldName, true);
    }
    
    /**
     * Set custom score for developer-defined fields
     */
    function setCustomScore(
        uint256 tokenId,
        string memory fieldName,
        uint256 score
    ) external onlyRole(ANFIS_ORACLE_ROLE) {
        require(_exists(tokenId), "RepID does not exist");
        require(supportedCustomFields[fieldName], "Custom field not supported");
        require(score <= 100, "Custom score must be <= 100");
        
        repIDs[tokenId].customScores[fieldName] = score;
    }
    
    /**
     * Override transfer functions to make tokens soulbound (non-transferable)
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override {
        require(from == address(0) || to == address(0), "RepIDs are soulbound and cannot be transferred");
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
    
    /**
     * Admin functions
     */
    function pause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() public onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    // Required override
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}