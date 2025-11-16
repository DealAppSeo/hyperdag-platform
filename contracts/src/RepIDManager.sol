// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "./RepIDNFT.sol";
import "./ZKPVerifier.sol";

/**
 * RepIDManager - Upgradeable proxy for RepID scoring logic and ANFIS integration
 * 
 * Manages the business logic for RepID evolution, decay calculations,
 * and integration with the ANFIS oracle system from HyperDAG
 */
contract RepIDManager is Initializable, AccessControlUpgradeable, ReentrancyGuardUpgradeable, PausableUpgradeable {
    bytes32 public constant ANFIS_ORACLE_ROLE = keccak256("ANFIS_ORACLE_ROLE");
    bytes32 public constant UPDATER_ROLE = keccak256("UPDATER_ROLE");
    
    // Contract references
    RepIDNFT public repIDNFT;
    ZKPVerifier public zkpVerifier;
    
    // Scoring parameters
    struct ScoringConfig {
        uint256 baseDecayRate; // Basis points (10000 = 100%)
        uint256 activityBonus; // Bonus for active users (basis points)
        uint256 maxDailyIncrease; // Maximum score increase per day
        uint256 inactivityPenalty; // Penalty for inactive users (basis points)
        uint256 governanceWeight; // Weight for governance activities
        uint256 communityWeight; // Weight for community activities
        uint256 technicalWeight; // Weight for technical activities
    }
    
    ScoringConfig public scoringConfig;
    
    // Activity tracking
    mapping(address => uint256) public lastActivity;
    mapping(address => uint256) public dailyScoreIncrease;
    mapping(address => uint256) public lastScoreReset;
    mapping(string => uint256) public contributionWeights; // Custom contribution type weights
    
    // Events
    event ScoringConfigUpdated(ScoringConfig newConfig);
    event ContributionProcessed(address indexed user, string contributionType, uint256 scoreIncrease, uint256 timestamp);
    event InactivityPenaltyApplied(address indexed user, uint256 penaltyAmount, uint256 timestamp);
    event ContributionWeightUpdated(string contributionType, uint256 weight);
    
    function initialize(
        address _repIDNFT,
        address _zkpVerifier,
        address _anfisOracle
    ) public initializer {
        __AccessControl_init();
        __ReentrancyGuard_init();
        __Pausable_init();
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ANFIS_ORACLE_ROLE, _anfisOracle);
        _grantRole(UPDATER_ROLE, msg.sender);
        
        repIDNFT = RepIDNFT(_repIDNFT);
        zkpVerifier = ZKPVerifier(_zkpVerifier);
        
        // Initialize scoring configuration
        scoringConfig = ScoringConfig({
            baseDecayRate: 9500, // 5% decay per month
            activityBonus: 500, // 5% bonus for active users
            maxDailyIncrease: 10, // Max 10 points per day
            inactivityPenalty: 200, // 2% penalty for 30+ days inactive
            governanceWeight: 1500, // 15% weight for governance
            communityWeight: 1000, // 10% weight for community
            technicalWeight: 1200 // 12% weight for technical
        });
        
        // Initialize contribution weights
        contributionWeights["code_contribution"] = 1500; // 15%
        contributionWeights["governance_vote"] = 1000; // 10%
        contributionWeights["community_help"] = 800; // 8%
        contributionWeights["mentorship"] = 1200; // 12%
        contributionWeights["content_creation"] = 600; // 6%
        contributionWeights["bug_report"] = 400; // 4%
        contributionWeights["faith_tech_contribution"] = 1300; // 13% (mission-aligned)
    }
    
    /**
     * Process a contribution and update RepID scores
     * Called by ANFIS oracle when user activity is detected
     */
    function processContribution(
        address user,
        string memory contributionType,
        uint256 contributionValue, // Normalized 1-100
        uint256 impactScore, // ANFIS-calculated impact (1-100)
        bytes32 proofHash
    ) external onlyRole(ANFIS_ORACLE_ROLE) nonReentrant whenNotPaused {
        require(contributionWeights[contributionType] > 0, "Invalid contribution type");
        require(contributionValue > 0 && contributionValue <= 100, "Invalid contribution value");
        require(impactScore > 0 && impactScore <= 100, "Invalid impact score");
        
        uint256 tokenId = repIDNFT.userToTokenId(user);
        require(tokenId > 0, "User does not have RepID");
        
        // Calculate score increase based on contribution type and impact
        uint256 baseIncrease = (contributionValue * contributionWeights[contributionType]) / 10000;
        uint256 impactMultiplier = (impactScore * 100) / 100; // Convert to basis points
        uint256 finalIncrease = (baseIncrease * impactMultiplier) / 10000;
        
        // Apply daily limits
        _checkDailyLimits(user, finalIncrease);
        
        // Determine score distribution based on contribution type
        (uint256 govIncrease, uint256 commIncrease, uint256 techIncrease) = _distributeScore(contributionType, finalIncrease);
        
        // Update RepID with calculated increases
        repIDNFT.updateRepID(tokenId, govIncrease, commIncrease, techIncrease, impactMultiplier + 10000, "");
        
        // Track activity
        lastActivity[user] = block.timestamp;
        
        emit ContributionProcessed(user, contributionType, finalIncrease, block.timestamp);
    }
    
    /**
     * Apply inactivity penalties for users who haven't been active
     * Called by automated cron job or manual trigger
     */
    function applyInactivityPenalties(address[] calldata users) external onlyRole(UPDATER_ROLE) {
        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            uint256 tokenId = repIDNFT.userToTokenId(user);
            
            if (tokenId > 0 && _isInactive(user)) {
                uint256 penaltyAmount = _calculateInactivityPenalty(user);
                
                if (penaltyAmount > 0) {
                    // Apply penalty as negative score update
                    repIDNFT.updateRepID(tokenId, 0, 0, 0, 10000 - penaltyAmount, "");
                    
                    emit InactivityPenaltyApplied(user, penaltyAmount, block.timestamp);
                }
            }
        }
    }
    
    /**
     * Batch process multiple contributions for gas efficiency
     */
    function batchProcessContributions(
        address[] calldata users,
        string[] calldata contributionTypes,
        uint256[] calldata contributionValues,
        uint256[] calldata impactScores
    ) external onlyRole(ANFIS_ORACLE_ROLE) nonReentrant whenNotPaused {
        require(users.length == contributionTypes.length, "Array length mismatch");
        require(users.length == contributionValues.length, "Array length mismatch");
        require(users.length == impactScores.length, "Array length mismatch");
        require(users.length <= 100, "Batch too large");
        
        for (uint256 i = 0; i < users.length; i++) {
            processContribution(users[i], contributionTypes[i], contributionValues[i], impactScores[i], keccak256("batch"));
        }
    }
    
    /**
     * Create new RepID for user upon first contribution
     * Called when user makes their first verified contribution
     */
    function createInitialRepID(
        address user,
        string memory contributionType,
        uint256 contributionValue,
        uint256 impactScore,
        string memory metadataURI
    ) external onlyRole(ANFIS_ORACLE_ROLE) nonReentrant whenNotPaused {
        require(repIDNFT.userToTokenId(user) == 0, "User already has RepID");
        
        // Calculate initial scores
        uint256 baseScore = (contributionValue * contributionWeights[contributionType]) / 10000;
        (uint256 govScore, uint256 commScore, uint256 techScore) = _distributeScore(contributionType, baseScore);
        
        // Generate ZKP commitment for the new RepID
        bytes32 zkpCommitment = keccak256(abi.encodePacked(user, contributionType, block.timestamp));
        
        // Mint initial RepID
        repIDNFT.mintRepID(user, govScore, commScore, techScore, metadataURI, zkpCommitment);
        
        // Track initial activity
        lastActivity[user] = block.timestamp;
        lastScoreReset[user] = block.timestamp;
        
        emit ContributionProcessed(user, contributionType, baseScore, block.timestamp);
    }
    
    /**
     * Calculate how score increases should be distributed across categories
     */
    function _distributeScore(
        string memory contributionType,
        uint256 totalIncrease
    ) private view returns (uint256 govIncrease, uint256 commIncrease, uint256 techIncrease) {
        bytes32 typeHash = keccak256(abi.encodePacked(contributionType));
        
        // Governance-focused contributions
        if (typeHash == keccak256("governance_vote") || typeHash == keccak256("dao_proposal")) {
            govIncrease = (totalIncrease * 70) / 100;
            commIncrease = (totalIncrease * 20) / 100;
            techIncrease = (totalIncrease * 10) / 100;
        }
        // Technical contributions
        else if (typeHash == keccak256("code_contribution") || typeHash == keccak256("bug_report")) {
            techIncrease = (totalIncrease * 70) / 100;
            govIncrease = (totalIncrease * 15) / 100;
            commIncrease = (totalIncrease * 15) / 100;
        }
        // Community contributions
        else if (typeHash == keccak256("community_help") || typeHash == keccak256("mentorship")) {
            commIncrease = (totalIncrease * 70) / 100;
            govIncrease = (totalIncrease * 15) / 100;
            techIncrease = (totalIncrease * 15) / 100;
        }
        // Faith-tech gets balanced distribution with community bonus
        else if (typeHash == keccak256("faith_tech_contribution")) {
            commIncrease = (totalIncrease * 40) / 100;
            techIncrease = (totalIncrease * 35) / 100;
            govIncrease = (totalIncrease * 25) / 100;
        }
        // Default balanced distribution
        else {
            govIncrease = (totalIncrease * 35) / 100;
            commIncrease = (totalIncrease * 35) / 100;
            techIncrease = (totalIncrease * 30) / 100;
        }
    }
    
    /**
     * Check and enforce daily scoring limits
     */
    function _checkDailyLimits(address user, uint256 scoreIncrease) private {
        if (block.timestamp > lastScoreReset[user] + 1 days) {
            dailyScoreIncrease[user] = 0;
            lastScoreReset[user] = block.timestamp;
        }
        
        require(
            dailyScoreIncrease[user] + scoreIncrease <= scoringConfig.maxDailyIncrease,
            "Daily score increase limit exceeded"
        );
        
        dailyScoreIncrease[user] += scoreIncrease;
    }
    
    /**
     * Check if user is inactive (no activity for 30+ days)
     */
    function _isInactive(address user) private view returns (bool) {
        return block.timestamp > lastActivity[user] + 30 days;
    }
    
    /**
     * Calculate inactivity penalty amount
     */
    function _calculateInactivityPenalty(address user) private view returns (uint256) {
        uint256 timeSinceActivity = block.timestamp - lastActivity[user];
        uint256 penaltyPeriods = timeSinceActivity / 30 days;
        
        if (penaltyPeriods == 0) return 0;
        
        // Progressive penalty: 2% first month, 4% second month, etc. (max 10%)
        uint256 penaltyRate = penaltyPeriods * scoringConfig.inactivityPenalty;
        if (penaltyRate > 1000) penaltyRate = 1000; // Cap at 10%
        
        return penaltyRate;
    }
    
    /**
     * Admin functions to update scoring configuration
     */
    function updateScoringConfig(ScoringConfig memory newConfig) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newConfig.baseDecayRate <= 10000, "Invalid decay rate");
        require(newConfig.activityBonus <= 2000, "Activity bonus too high");
        require(newConfig.maxDailyIncrease <= 50, "Daily increase too high");
        
        scoringConfig = newConfig;
        emit ScoringConfigUpdated(newConfig);
    }
    
    /**
     * Update contribution type weights
     */
    function updateContributionWeight(
        string memory contributionType,
        uint256 weight
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(weight <= 2000, "Weight too high"); // Max 20%
        contributionWeights[contributionType] = weight;
        emit ContributionWeightUpdated(contributionType, weight);
    }
    
    /**
     * Emergency pause functionality
     */
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
    
    /**
     * Upgrade functions (UUPS pattern)
     */
    function updateContracts(address newRepIDNFT, address newZKPVerifier) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (newRepIDNFT != address(0)) {
            repIDNFT = RepIDNFT(newRepIDNFT);
        }
        if (newZKPVerifier != address(0)) {
            zkpVerifier = ZKPVerifier(newZKPVerifier);
        }
    }
    
    /**
     * Get user activity stats
     */
    function getUserActivityStats(address user) external view returns (
        uint256 lastActivityTime,
        uint256 todayScoreIncrease,
        uint256 remainingDailyAllowance,
        bool isActive
    ) {
        lastActivityTime = lastActivity[user];
        todayScoreIncrease = dailyScoreIncrease[user];
        remainingDailyAllowance = scoringConfig.maxDailyIncrease > dailyScoreIncrease[user] 
            ? scoringConfig.maxDailyIncrease - dailyScoreIncrease[user] 
            : 0;
        isActive = !_isInactive(user);
    }
}