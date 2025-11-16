// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/**
 * @title HyperDAGToken
 * @dev ERC20 token for the HyperDAG ecosystem with vesting schedules, dynamic rewards,
 * and AI-controlled token emission based on platform activity
 */
contract HyperDAGToken is ERC20, ERC20Pausable, Ownable, ReentrancyGuard {
    using Math for uint256;
    
    // Vesting schedule
    struct VestingSchedule {
        uint256 totalAmount;
        uint256 releasedAmount;
        uint256 startTimestamp;
        uint256 durationDays;
        uint256 cliffDays;
        bool isActive;
    }
    
    // User reward state
    struct RewardState {
        uint256 pendingTokens;      // Tokens waiting to be vested
        uint256 referralCount;       // Number of successful referrals
        uint256 lastActivityTime;    // Last activity timestamp
        bool profileCompleted;       // Whether user completed profile with 2FA & wallet
        uint256 forfeited;           // Tokens forfeited due to conditions not met
    }
    
    // Activity tracker for reward adjustment
    struct ActivityTracker {
        uint256 totalUsers;           // Total registered users
        uint256 activeUsers;          // Active users (active in last 30 days)
        uint256 completedProfiles;    // Users with completed profiles
        uint256 totalReferrals;       // Total successful referrals
        uint256 lastAdjustmentTime;   // Last time rewards were adjusted
        uint256 tokensDistributed;    // Total tokens distributed as rewards
    }
    
    // Reward rates
    struct RewardRates {
        uint256 referralReward;      // Current tokens per referral (basis points of 1 token)
        uint256 profileReward;       // Reward for completing profile (basis points of 1 token)
        uint256 activityReward;      // Reward for regular activity (basis points of 1 token)
        uint256 contributionReward;  // Reward for ecosystem contributions (basis points of 1 token)
    }

    // Mapping of addresses to their vesting schedules
    mapping(address => VestingSchedule) private _vestingSchedules;
    
    // Mapping of addresses to their reward state
    mapping(address => RewardState) private _rewardStates;
    
    // Mapping of referrers to referees
    mapping(address => address[]) private _referrals;
    
    // Mapping of verified referrals (completed profiles)
    mapping(address => bool) private _verifiedReferrals;
    
    // Team and investor vesting pools
    address[] private _teamMembers;
    address[] private _investors;
    
    // Total token supply and allocation percentages
    uint256 public constant TOTAL_SUPPLY = 1000000000 * 10**18; // 1 billion tokens with 18 decimals
    uint256 public constant REWARD_PRECISION = 10000; // Basis points precision for reward calculations
    
    // Allocation percentages (in basis points, 100% = 10000)
    uint256 public constant TEAM_ALLOCATION = 1500; // 15%
    uint256 public constant INVESTOR_ALLOCATION = 2500; // 25%
    uint256 public constant ECOSYSTEM_ALLOCATION = 5000; // 50%
    uint256 public constant REWARD_ALLOCATION = 500; // 5%
    uint256 public constant RESERVE_ALLOCATION = 500; // 5%
    
    // Timelock periods
    uint256 public constant TEAM_VESTING_DURATION = 730 days; // 2 years
    uint256 public constant TEAM_CLIFF_PERIOD = 180 days; // 6 months
    uint256 public constant INVESTOR_VESTING_DURATION = 365 days; // 1 year
    uint256 public constant INVESTOR_CLIFF_PERIOD = 90 days; // 3 months
    uint256 public constant REWARD_VESTING_DURATION = 180 days; // 6 months
    uint256 public constant REWARD_EXPIRATION = 365 days; // 1 year until unclaimed rewards are forfeited
    
    // Treasury and reserve addresses
    address public ecosystemFundAddress;
    address public reserveAddress;
    address public rewardPoolAddress;
    
    // Activity tracker for dynamic reward adjustment
    ActivityTracker public activityTracker;
    
    // Current reward rates
    RewardRates public rewardRates;
    
    // Authorized reward distributors
    mapping(address => bool) public rewardDistributors;
    
    // Events
    event VestingScheduleCreated(address indexed beneficiary, uint256 amount, uint256 startTimestamp, uint256 durationDays, uint256 cliffDays);
    event TokensReleased(address indexed beneficiary, uint256 amount);
    event EcosystemFundAddressChanged(address indexed oldAddress, address indexed newAddress);
    event ReserveAddressChanged(address indexed oldAddress, address indexed newAddress);
    event ReferralRecorded(address indexed referrer, address indexed referee);
    event ReferralVerified(address indexed referee);
    event ReferralRewardIssued(address indexed referrer, uint256 amount);
    event RewardRatesAdjusted(uint256 referralReward, uint256 profileReward, uint256 activityReward, uint256 contributionReward);
    event TokensVested(address indexed beneficiary, uint256 amount);
    event TokensForfeited(address indexed user, uint256 amount, string reason);
    event RewardDistributorAdded(address indexed distributor);
    event RewardDistributorRemoved(address indexed distributor);

    /**
     * @dev Constructor
     * @param _ecosystemFundAddress Treasury fund address
     * @param _reserveAddress Reserve fund address
     * @param _rewardPoolAddress Address for the reward pool
     * @param _initialTeamMembers Initial team members addresses
     * @param _initialInvestors Initial investors addresses
     * @param _initialDistributors Initial reward distributors
     */
    constructor(
        address _ecosystemFundAddress,
        address _reserveAddress,
        address _rewardPoolAddress,
        address[] memory _initialTeamMembers,
        address[] memory _initialInvestors,
        address[] memory _initialDistributors
    ) ERC20("HyperDAG Token", "HDAG") Ownable(msg.sender) {
        require(_ecosystemFundAddress != address(0), "Ecosystem fund cannot be zero address");
        require(_reserveAddress != address(0), "Reserve address cannot be zero address");
        require(_rewardPoolAddress != address(0), "Reward pool cannot be zero address");
        
        ecosystemFundAddress = _ecosystemFundAddress;
        reserveAddress = _reserveAddress;
        rewardPoolAddress = _rewardPoolAddress;
        
        // Mint total supply
        _mint(address(this), TOTAL_SUPPLY);
        
        // Setup team vesting
        uint256 teamAllocation = (TOTAL_SUPPLY * TEAM_ALLOCATION) / 10000;
        uint256 teamMemberAllocation = teamAllocation / _initialTeamMembers.length;
        
        for (uint256 i = 0; i < _initialTeamMembers.length; i++) {
            _teamMembers.push(_initialTeamMembers[i]);
            _createVestingSchedule(
                _initialTeamMembers[i],
                teamMemberAllocation,
                block.timestamp,
                TEAM_VESTING_DURATION / 1 days,
                TEAM_CLIFF_PERIOD / 1 days,
                true
            );
        }
        
        // Setup investor vesting
        uint256 investorAllocation = (TOTAL_SUPPLY * INVESTOR_ALLOCATION) / 10000;
        uint256 investorAllocationPerAddress = investorAllocation / _initialInvestors.length;
        
        for (uint256 i = 0; i < _initialInvestors.length; i++) {
            _investors.push(_initialInvestors[i]);
            _createVestingSchedule(
                _initialInvestors[i],
                investorAllocationPerAddress,
                block.timestamp,
                INVESTOR_VESTING_DURATION / 1 days,
                INVESTOR_CLIFF_PERIOD / 1 days,
                true
            );
        }
        
        // Initialize reward pool and ecosystem fund
        uint256 ecosystemAllocation = (TOTAL_SUPPLY * ECOSYSTEM_ALLOCATION) / 10000;
        uint256 rewardAllocation = (TOTAL_SUPPLY * REWARD_ALLOCATION) / 10000;
        uint256 reserveAllocation = (TOTAL_SUPPLY * RESERVE_ALLOCATION) / 10000;
        
        _transfer(address(this), ecosystemFundAddress, ecosystemAllocation);
        _transfer(address(this), rewardPoolAddress, rewardAllocation);
        _transfer(address(this), reserveAddress, reserveAllocation);
        
        // Set up initial reward rates (can be adjusted later by AI)
        rewardRates = RewardRates({
            referralReward: 500 * REWARD_PRECISION / 100,  // 5 tokens per referral initially
            profileReward: 100 * REWARD_PRECISION / 100,   // 1 token for profile completion
            activityReward: 25 * REWARD_PRECISION / 100,   // 0.25 tokens for regular activity
            contributionReward: 300 * REWARD_PRECISION / 100 // 3 tokens for ecosystem contributions
        });
        
        // Initialize activity tracker
        activityTracker = ActivityTracker({
            totalUsers: 0,
            activeUsers: 0,
            completedProfiles: 0,
            totalReferrals: 0,
            lastAdjustmentTime: block.timestamp,
            tokensDistributed: 0
        });
        
        // Add initial reward distributors
        for (uint256 i = 0; i < _initialDistributors.length; i++) {
            rewardDistributors[_initialDistributors[i]] = true;
            emit RewardDistributorAdded(_initialDistributors[i]);
        }
        
        // Always add contract owner as a distributor
        if (!rewardDistributors[msg.sender]) {
            rewardDistributors[msg.sender] = true;
            emit RewardDistributorAdded(msg.sender);
        }
    }
    
    /**
     * @dev Create a vesting schedule for an address
     * @param beneficiary The address that will receive the tokens
     * @param amount Total amount of tokens to be vested
     * @param startTimestamp The timestamp when vesting starts
     * @param durationDays Duration of the vesting in days
     * @param cliffDays Cliff period in days
     * @param isActive Whether the vesting schedule is active
     */
    function _createVestingSchedule(
        address beneficiary,
        uint256 amount,
        uint256 startTimestamp,
        uint256 durationDays,
        uint256 cliffDays,
        bool isActive
    ) private {
        require(beneficiary != address(0), "Beneficiary cannot be zero address");
        require(amount > 0, "Amount must be greater than zero");
        require(durationDays > 0, "Duration must be greater than zero");
        
        _vestingSchedules[beneficiary] = VestingSchedule({
            totalAmount: amount,
            releasedAmount: 0,
            startTimestamp: startTimestamp,
            durationDays: durationDays,
            cliffDays: cliffDays,
            isActive: isActive
        });
        
        emit VestingScheduleCreated(beneficiary, amount, startTimestamp, durationDays, cliffDays);
    }
    
    // ====== REWARD DISTRIBUTION FUNCTIONS ======
    
    /**
     * @dev Add a reward distributor (only owner)
     * @param distributor Address to add as a distributor
     */
    function addRewardDistributor(address distributor) external onlyOwner {
        require(distributor != address(0), "Distributor cannot be zero address");
        require(!rewardDistributors[distributor], "Already a distributor");
        
        rewardDistributors[distributor] = true;
        emit RewardDistributorAdded(distributor);
    }
    
    /**
     * @dev Remove a reward distributor (only owner)
     * @param distributor Address to remove as a distributor
     */
    function removeRewardDistributor(address distributor) external onlyOwner {
        require(rewardDistributors[distributor], "Not a distributor");
        require(distributor != owner(), "Cannot remove owner as distributor");
        
        rewardDistributors[distributor] = false;
        emit RewardDistributorRemoved(distributor);
    }
    
    /**
     * @dev Record a referral relationship between two users
     * @param referrer The address of the referrer
     * @param referee The address of the referee
     */
    function recordReferral(address referrer, address referee) external {
        require(msg.sender == owner() || rewardDistributors[msg.sender], "Not authorized");
        require(referrer != address(0) && referee != address(0), "Addresses cannot be zero");
        require(referrer != referee, "Cannot refer yourself");
        
        // Store the referral relationship
        _referrals[referrer].push(referee);
        
        // Update activity tracker
        activityTracker.totalReferrals++;
        
        // Update referrer's referral count
        _rewardStates[referrer].referralCount++;
        _rewardStates[referrer].lastActivityTime = block.timestamp;
        
        emit ReferralRecorded(referrer, referee);
    }
    
    /**
     * @dev Verify a referral by marking the referee as having completed their profile
     * @param referee The address of the referee who completed their profile
     */
    function verifyReferral(address referee) external {
        require(msg.sender == owner() || rewardDistributors[msg.sender], "Not authorized");
        require(referee != address(0), "Address cannot be zero");
        require(!_verifiedReferrals[referee], "Referral already verified");
        
        _verifiedReferrals[referee] = true;
        _rewardStates[referee].profileCompleted = true;
        _rewardStates[referee].lastActivityTime = block.timestamp;
        
        // Update activity tracker
        activityTracker.completedProfiles++;
        
        emit ReferralVerified(referee);
    }
    
    /**
     * @dev Issue a reward for a successful referral
     * @param referrer The address of the referrer to reward
     * @param refereeCount The number of successful referrals to reward
     */
    function issueReferralReward(address referrer, uint256 refereeCount) external {
        require(msg.sender == owner() || rewardDistributors[msg.sender], "Not authorized");
        require(referrer != address(0), "Referrer cannot be zero address");
        require(refereeCount > 0, "Referee count must be greater than zero");
        
        // Calculate total tokens to reward based on current rate
        uint256 rewardPerReferral = rewardRates.referralReward;
        uint256 totalReward = (rewardPerReferral * refereeCount) / REWARD_PRECISION;
        
        // Create a vesting schedule for the reward
        uint256 currentRewards = _rewardStates[referrer].pendingTokens;
        _rewardStates[referrer].pendingTokens = currentRewards + totalReward;
        
        // Set up vesting for these tokens
        _createVestingSchedule(
            referrer,
            totalReward,
            block.timestamp,
            REWARD_VESTING_DURATION / 1 days,
            0, // No cliff for referral rewards
            true
        );
        
        // Update metrics
        activityTracker.tokensDistributed += totalReward;
        _rewardStates[referrer].lastActivityTime = block.timestamp;
        
        emit ReferralRewardIssued(referrer, totalReward);
    }
    
    /**
     * @dev Update the platform activity metrics and adjust reward rates if needed
     * @param totalUsers New total number of registered users
     * @param activeUsers New number of active users in the last 30 days
     */
    function updateActivityMetrics(uint256 totalUsers, uint256 activeUsers) external {
        require(msg.sender == owner() || rewardDistributors[msg.sender], "Not authorized");
        
        activityTracker.totalUsers = totalUsers;
        activityTracker.activeUsers = activeUsers;
        
        // Check if we need to adjust reward rates (not more often than once a week)
        if (block.timestamp >= activityTracker.lastAdjustmentTime + 7 days) {
            _adjustRewardRates();
        }
    }
    
    /**
     * @dev Dynamically adjust reward rates based on platform metrics
     * This is where the AI-driven reward adjustment happens
     */
    function _adjustRewardRates() private {
        // Calculate activity ratio (active users / total users)
        uint256 activityRatio = activityTracker.totalUsers > 0 
            ? (activityTracker.activeUsers * REWARD_PRECISION) / activityTracker.totalUsers 
            : 0;
        
        // Calculate completion ratio (completed profiles / total users)
        uint256 completionRatio = activityTracker.totalUsers > 0 
            ? (activityTracker.completedProfiles * REWARD_PRECISION) / activityTracker.totalUsers 
            : 0;
        
        // Calculate referral effectiveness (referrals / users)
        uint256 referralRatio = activityTracker.totalUsers > 0 
            ? (activityTracker.totalReferrals * REWARD_PRECISION) / activityTracker.totalUsers 
            : 0;
        
        // Get remaining reward tokens
        uint256 remainingRewards = IERC20(address(this)).balanceOf(rewardPoolAddress);
        uint256 totalDistributed = activityTracker.tokensDistributed;
        uint256 rewardUtilization = totalDistributed > 0 
            ? (totalDistributed * REWARD_PRECISION) / (totalDistributed + remainingRewards) 
            : 0;
        
        // Adjust referral reward rate:
        // - If referrals are very effective (high ratio), slightly decrease reward
        // - If referrals are not effective (low ratio), increase reward
        // - If rewards are being depleted too quickly, reduce
        uint256 newReferralReward = rewardRates.referralReward;
        
        if (referralRatio > 8000) { // More than 80% of users are referring others
            // Gradually reduce reward as it's working very well
            newReferralReward = newReferralReward * 95 / 100; // -5%
        } else if (referralRatio < 2000) { // Less than 20% of users are referring
            // Increase reward to incentivize more referrals
            newReferralReward = newReferralReward * 110 / 100; // +10%
        }
        
        // Prevent rewards from depleting too quickly
        if (rewardUtilization > 7000) { // Over 70% of rewards used
            // Reduce all rewards proportionally to consumption rate
            newReferralReward = newReferralReward * 90 / 100; // -10%
        }
        
        // Apply similar logic to other reward rates
        uint256 newProfileReward = rewardRates.profileReward;
        if (completionRatio > 8000) {
            newProfileReward = newProfileReward * 95 / 100;
        } else if (completionRatio < 3000) {
            newProfileReward = newProfileReward * 110 / 100;
        }
        
        uint256 newActivityReward = rewardRates.activityReward;
        if (activityRatio > 7000) {
            newActivityReward = newActivityReward * 95 / 100;
        } else if (activityRatio < 3000) {
            newActivityReward = newActivityReward * 110 / 100;
        }
        
        // Cap rewards at reasonable min/max values
        newReferralReward = Math.min(Math.max(newReferralReward, 200 * REWARD_PRECISION / 100), 1000 * REWARD_PRECISION / 100);
        newProfileReward = Math.min(Math.max(newProfileReward, 50 * REWARD_PRECISION / 100), 300 * REWARD_PRECISION / 100);
        newActivityReward = Math.min(Math.max(newActivityReward, 10 * REWARD_PRECISION / 100), 100 * REWARD_PRECISION / 100);
        
        // Update reward rates
        rewardRates.referralReward = newReferralReward;
        rewardRates.profileReward = newProfileReward;
        rewardRates.activityReward = newActivityReward;
        
        // Update last adjustment time
        activityTracker.lastAdjustmentTime = block.timestamp;
        
        emit RewardRatesAdjusted(
            rewardRates.referralReward,
            rewardRates.profileReward,
            rewardRates.activityReward,
            rewardRates.contributionReward
        );
    }
    
    /**
     * @dev Force a reward rate adjustment (only owner)
     */
    function forceRewardRateAdjustment() external onlyOwner {
        _adjustRewardRates();
    }
    
    /**
     * @dev Check for expired rewards and forfeit them if necessary
     * @param user The address to check for expired rewards
     */
    function processExpiredRewards(address user) external {
        require(msg.sender == owner() || rewardDistributors[msg.sender], "Not authorized");
        require(user != address(0), "User cannot be zero address");
        
        RewardState storage userRewards = _rewardStates[user];
        VestingSchedule storage vesting = _vestingSchedules[user];
        
        // Check if user has rewards pending but never completed profile
        if (!userRewards.profileCompleted && 
            userRewards.pendingTokens > 0 && 
            block.timestamp > userRewards.lastActivityTime + REWARD_EXPIRATION) {
            
            // Calculate unreleased tokens
            uint256 unreleasedTokens = vesting.totalAmount - vesting.releasedAmount;
            
            if (unreleasedTokens > 0 && vesting.isActive) {
                // Deactivate vesting schedule
                vesting.isActive = false;
                
                // Track forfeited tokens
                userRewards.forfeited += unreleasedTokens;
                
                // Return tokens to reward pool
                _transfer(address(this), rewardPoolAddress, unreleasedTokens);
                
                emit TokensForfeited(user, unreleasedTokens, "Profile completion requirement not met");
            }
        }
    }
    
    /**
     * @dev Get reward state for a user
     * @param user The address to get reward state for
     * @return pendingTokens Amount of tokens waiting to be vested
     * @return referralCount Number of successful referrals
     * @return lastActivityTime Last activity timestamp
     * @return profileCompleted Whether user completed profile
     * @return forfeited Tokens forfeited due to conditions not met
     */
    function getRewardState(address user) external view returns (
        uint256 pendingTokens,
        uint256 referralCount,
        uint256 lastActivityTime,
        bool profileCompleted,
        uint256 forfeited
    ) {
        RewardState memory state = _rewardStates[user];
        return (
            state.pendingTokens,
            state.referralCount,
            state.lastActivityTime,
            state.profileCompleted,
            state.forfeited
        );
    }
    
    /**
     * @dev Get current reward rates
     * @return referralReward Current tokens per referral (basis points of 1 token)
     * @return profileReward Reward for completing profile (basis points of 1 token)
     * @return activityReward Reward for regular activity (basis points of 1 token)
     * @return contributionReward Reward for ecosystem contributions (basis points of 1 token)
     */
    function getCurrentRewardRates() external view returns (
        uint256 referralReward,
        uint256 profileReward,
        uint256 activityReward,
        uint256 contributionReward
    ) {
        return (
            rewardRates.referralReward,
            rewardRates.profileReward,
            rewardRates.activityReward,
            rewardRates.contributionReward
        );
    }
    
    /**
     * @dev Release vested tokens for the caller
     */
    function releaseMyTokens() external nonReentrant {
        _releaseTokens(msg.sender);
    }
    
    /**
     * @dev Release vested tokens for a specified beneficiary (admin only)
     * @param beneficiary The address to release tokens for
     */
    function releaseTokensFor(address beneficiary) external onlyOwner nonReentrant {
        _releaseTokens(beneficiary);
    }
    
    /**
     * @dev Calculate and release vested tokens for a beneficiary
     * @param beneficiary The address to release tokens for
     */
    function _releaseTokens(address beneficiary) private {
        VestingSchedule storage schedule = _vestingSchedules[beneficiary];
        require(schedule.totalAmount > 0, "No vesting schedule found");
        require(schedule.isActive, "Vesting schedule is not active");
        
        uint256 vestedAmount = _getVestedAmount(beneficiary);
        uint256 releasableAmount = vestedAmount - schedule.releasedAmount;
        
        require(releasableAmount > 0, "No tokens available for release");
        
        schedule.releasedAmount += releasableAmount;
        _transfer(address(this), beneficiary, releasableAmount);
        
        // Update user's last activity time
        _rewardStates[beneficiary].lastActivityTime = block.timestamp;
        
        emit TokensReleased(beneficiary, releasableAmount);
        
        // If all tokens are released, mark the schedule as complete
        if (schedule.releasedAmount >= schedule.totalAmount) {
            emit TokensVested(beneficiary, schedule.totalAmount);
        }
    }
    
    /**
     * @dev Calculate the vested token amount for a beneficiary
     * @param beneficiary The address to calculate vested amount for
     * @return The vested token amount
     */
    function _getVestedAmount(address beneficiary) private view returns (uint256) {
        VestingSchedule storage schedule = _vestingSchedules[beneficiary];
        
        // If the schedule is not active, no tokens are vested
        if (!schedule.isActive) {
            return 0;
        }
        
        // If we're before the cliff period, no tokens are vested
        if (block.timestamp < schedule.startTimestamp + (schedule.cliffDays * 1 days)) {
            return 0;
        }
        
        // If we're after the vesting period, all tokens are vested
        if (block.timestamp >= schedule.startTimestamp + (schedule.durationDays * 1 days)) {
            return schedule.totalAmount;
        }
        
        // Linear vesting between cliff and end
        uint256 timeFromStart = block.timestamp - schedule.startTimestamp;
        uint256 vestedAmount = (schedule.totalAmount * timeFromStart) / (schedule.durationDays * 1 days);
        
        return vestedAmount;
    }
    
    /**
     * @dev Mark a user's profile as completed, enabling them to receive rewards
     * @param user The address of the user whose profile is completed
     */
    function markProfileCompleted(address user) external {
        require(msg.sender == owner() || rewardDistributors[msg.sender], "Not authorized");
        require(user != address(0), "User cannot be zero address");
        require(!_rewardStates[user].profileCompleted, "Profile already completed");
        
        _rewardStates[user].profileCompleted = true;
        _rewardStates[user].lastActivityTime = block.timestamp;
        
        // Update platform metrics
        activityTracker.completedProfiles++;
        
        // Issue profile completion reward
        uint256 rewardAmount = rewardRates.profileReward / REWARD_PRECISION;
        
        if (rewardAmount > 0) {
            // Create a vesting schedule with no cliff for the profile completion reward
            _createVestingSchedule(
                user,
                rewardAmount,
                block.timestamp,
                REWARD_VESTING_DURATION / 1 days,
                0, // No cliff
                true
            );
            
            // Update reward state
            _rewardStates[user].pendingTokens += rewardAmount;
            
            // Update platform metrics
            activityTracker.tokensDistributed += rewardAmount;
        }
    }
    
    /**
     * @dev Get the vesting information for an address
     * @param beneficiary The address to get vesting info for
     * @return totalAmount Total amount of tokens in the vesting schedule
     * @return releasedAmount Amount of tokens already released
     * @return vestedAmount Current vested amount (including released)
     * @return releasableAmount Amount of tokens that can be released now
     * @return startTimestamp Start timestamp of the vesting
     * @return durationDays Duration of the vesting in days
     * @return cliffDays Cliff period in days
     */
    function getVestingInfo(address beneficiary) external view returns (
        uint256 totalAmount,
        uint256 releasedAmount,
        uint256 vestedAmount,
        uint256 releasableAmount,
        uint256 startTimestamp,
        uint256 durationDays,
        uint256 cliffDays
    ) {
        VestingSchedule memory schedule = _vestingSchedules[beneficiary];
        uint256 vestedAmt = _getVestedAmount(beneficiary);
        
        return (
            schedule.totalAmount,
            schedule.releasedAmount,
            vestedAmt,
            vestedAmt - schedule.releasedAmount,
            schedule.startTimestamp,
            schedule.durationDays,
            schedule.cliffDays
        );
    }
    
    /**
     * @dev Change the ecosystem fund address (only owner)
     * @param newEcosystemFundAddress New ecosystem fund address
     */
    function setEcosystemFundAddress(address newEcosystemFundAddress) external onlyOwner {
        require(newEcosystemFundAddress != address(0), "New address cannot be zero");
        
        address oldAddress = ecosystemFundAddress;
        ecosystemFundAddress = newEcosystemFundAddress;
        
        emit EcosystemFundAddressChanged(oldAddress, newEcosystemFundAddress);
    }
    
    /**
     * @dev Change the reserve address (only owner)
     * @param newReserveAddress New reserve address
     */
    function setReserveAddress(address newReserveAddress) external onlyOwner {
        require(newReserveAddress != address(0), "New address cannot be zero");
        
        address oldAddress = reserveAddress;
        reserveAddress = newReserveAddress;
        
        emit ReserveAddressChanged(oldAddress, newReserveAddress);
    }
    
    /**
     * @dev Pause token transfers (only owner)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers (only owner)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Override required functions
    function _update(address from, address to, uint256 amount) internal override(ERC20, ERC20Pausable) {
        super._update(from, to, amount);
    }
}