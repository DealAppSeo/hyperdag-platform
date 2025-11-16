// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title HyperCrowd
 * @dev Contract for managing decentralized projects, funding, and team formation
 */
contract HyperCrowd is Ownable, ReentrancyGuard {
    using Strings for uint256;
    
    enum ProjectType { RFI, RFP }
    
    struct Project {
        uint256 id;
        address creator;
        string title;
        string description;
        string[] categories;
        string[] requiredRoles;
        uint256 fundingGoal;
        uint256 currentFunding;
        uint256 durationDays;
        uint256 createdAt;
        uint256 completedAt;
        bool isActive;
        bool isFunded;
        ProjectType projectType;
    }
    
    struct TeamMember {
        address memberAddress;
        string role;
        uint256 reputationScore;
        uint256 joinedAt;
        bool isActive;
    }
    
    struct Proposal {
        uint256 id;
        uint256 projectId;
        address proposer;
        string description;
        uint256 amount;
        uint256 createdAt;
        bool isAccepted;
    }
    
    // Project management
    uint256 private _nextProjectId = 1;
    uint256 private _nextProposalId = 1;
    uint256 private _nextGrantId = 1;
    mapping(uint256 => Project) private _projects;
    mapping(uint256 => TeamMember[]) private _projectTeams;
    mapping(uint256 => Proposal[]) private _projectProposals;
    
    // Grant matching
    struct Grant {
        uint256 id;
        string name;
        string description;
        uint256 availableFunds;
        address provider;
        bool isActive;
        string[] categories;
        uint256 createdAt;
    }
    
    struct GrantMatch {
        uint256 grantId;
        uint256 projectId;
        uint256 amount;
        uint256 matchScore; // 0-10000 (basis points)
        bool isApproved;
        bool isClaimed;
        uint256 claimedAt;
    }
    
    mapping(uint256 => Grant) private _grants;
    mapping(uint256 => GrantMatch[]) private _projectGrantMatches;
    mapping(address => uint256[]) private _providerGrants;
    
    // User management
    mapping(address => uint256[]) private _userProjects;
    mapping(address => uint256[]) private _userJoinedProjects;
    
    // Fee settings
    uint256 public platformFeePercentage = 500; // 5% (in basis points, 10000 = 100%)
    address public treasuryAddress;
    
    // Events
    event ProjectCreated(uint256 indexed projectId, address indexed creator, string title, uint256 fundingGoal, uint256 durationDays, ProjectType projectType);
    event ProjectFunded(uint256 indexed projectId, address indexed funder, uint256 amount);
    event ProjectCompleted(uint256 indexed projectId, uint256 totalFunding);
    event TeamMemberJoined(uint256 indexed projectId, address indexed member, string role);
    event ProposalSubmitted(uint256 indexed projectId, uint256 indexed proposalId, address indexed proposer, uint256 amount);
    event ProposalAccepted(uint256 indexed projectId, uint256 indexed proposalId, address indexed proposer);
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryAddressUpdated(address oldAddress, address newAddress);
    
    // Grant matching events
    event GrantCreated(uint256 indexed grantId, address indexed provider, string name, uint256 availableFunds);
    event GrantMatchCreated(uint256 indexed grantId, uint256 indexed projectId, uint256 amount, uint256 matchScore);
    event GrantMatchApproved(uint256 indexed grantId, uint256 indexed projectId, uint256 amount);
    event GrantMatchClaimed(uint256 indexed grantId, uint256 indexed projectId, uint256 amount, address recipient);
    
    /**
     * @dev Constructor
     * @param _treasuryAddress The treasury address for platform fees
     */
    constructor(address _treasuryAddress) Ownable(msg.sender) {
        treasuryAddress = _treasuryAddress;
    }
    
    /**
     * @dev Create a new project
     * @param title Project title
     * @param description Project description
     * @param categories Project categories
     * @param requiredRoles Required team roles for the project
     * @param fundingGoal Funding goal in wei
     * @param durationDays Project duration in days
     * @param projectType Project type (RFI or RFP)
     * @return The ID of the created project
     */
    function createProject(
        string memory title,
        string memory description,
        string[] memory categories,
        string[] memory requiredRoles,
        uint256 fundingGoal,
        uint256 durationDays,
        ProjectType projectType
    ) external returns (uint256) {
        require(bytes(title).length > 0, "Title cannot be empty");
        require(fundingGoal > 0, "Funding goal must be greater than zero");
        require(durationDays > 0, "Duration must be greater than zero");
        
        uint256 projectId = _nextProjectId++;
        
        _projects[projectId] = Project({
            id: projectId,
            creator: msg.sender,
            title: title,
            description: description,
            categories: categories,
            requiredRoles: requiredRoles,
            fundingGoal: fundingGoal,
            currentFunding: 0,
            durationDays: durationDays,
            createdAt: block.timestamp,
            completedAt: 0,
            isActive: true,
            isFunded: false,
            projectType: projectType
        });
        
        _userProjects[msg.sender].push(projectId);
        
        emit ProjectCreated(projectId, msg.sender, title, fundingGoal, durationDays, projectType);
        
        return projectId;
    }
    
    /**
     * @dev Fund a project
     * @param projectId The ID of the project to fund
     */
    function fundProject(uint256 projectId) external payable nonReentrant {
        Project storage project = _projects[projectId];
        require(project.id > 0, "Project does not exist");
        require(project.isActive, "Project is not active");
        require(!project.isFunded, "Project is already fully funded");
        
        uint256 amount = msg.value;
        require(amount > 0, "Amount must be greater than zero");
        
        // Calculate platform fee
        uint256 platformFee = (amount * platformFeePercentage) / 10000;
        uint256 fundingAmount = amount - platformFee;
        
        // Update project funding
        project.currentFunding += fundingAmount;
        
        // Check if project is now fully funded
        if (project.currentFunding >= project.fundingGoal) {
            project.isFunded = true;
            project.completedAt = block.timestamp;
            emit ProjectCompleted(projectId, project.currentFunding);
        }
        
        // Transfer platform fee to treasury
        (bool feeSuccess, ) = treasuryAddress.call{value: platformFee}("");
        require(feeSuccess, "Platform fee transfer failed");
        
        emit ProjectFunded(projectId, msg.sender, fundingAmount);
    }
    
    /**
     * @dev Join a project team
     * @param projectId The ID of the project to join
     * @param role The role to join as
     */
    function joinTeam(uint256 projectId, string memory role) external {
        Project storage project = _projects[projectId];
        require(project.id > 0, "Project does not exist");
        require(project.isActive, "Project is not active");
        require(bytes(role).length > 0, "Role cannot be empty");
        
        // Check if the role is required for the project
        bool isRoleRequired = false;
        for (uint256 i = 0; i < project.requiredRoles.length; i++) {
            if (keccak256(bytes(project.requiredRoles[i])) == keccak256(bytes(role))) {
                isRoleRequired = true;
                break;
            }
        }
        require(isRoleRequired, "Role is not required for this project");
        
        // Check if the user is already on the team
        TeamMember[] storage teamMembers = _projectTeams[projectId];
        for (uint256 i = 0; i < teamMembers.length; i++) {
            require(teamMembers[i].memberAddress != msg.sender, "Already a team member");
        }
        
        // Add the user to the team
        _projectTeams[projectId].push(TeamMember({
            memberAddress: msg.sender,
            role: role,
            reputationScore: 0, // Will be updated by reputation system
            joinedAt: block.timestamp,
            isActive: true
        }));
        
        _userJoinedProjects[msg.sender].push(projectId);
        
        emit TeamMemberJoined(projectId, msg.sender, role);
    }
    
    /**
     * @dev Submit a proposal for a project
     * @param projectId The ID of the project
     * @param description Proposal description
     * @param amount Requested amount in wei
     * @return The ID of the created proposal
     */
    function submitProposal(
        uint256 projectId,
        string memory description,
        uint256 amount
    ) external returns (uint256) {
        Project storage project = _projects[projectId];
        require(project.id > 0, "Project does not exist");
        require(project.isActive, "Project is not active");
        require(project.isFunded, "Project is not funded yet");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(amount > 0 && amount <= project.currentFunding, "Invalid amount");
        
        // Check if the user is a team member
        bool isTeamMember = false;
        TeamMember[] storage teamMembers = _projectTeams[projectId];
        for (uint256 i = 0; i < teamMembers.length; i++) {
            if (teamMembers[i].memberAddress == msg.sender && teamMembers[i].isActive) {
                isTeamMember = true;
                break;
            }
        }
        require(isTeamMember, "Only team members can submit proposals");
        
        uint256 proposalId = _nextProposalId++;
        
        _projectProposals[projectId].push(Proposal({
            id: proposalId,
            projectId: projectId,
            proposer: msg.sender,
            description: description,
            amount: amount,
            createdAt: block.timestamp,
            isAccepted: false
        }));
        
        emit ProposalSubmitted(projectId, proposalId, msg.sender, amount);
        
        return proposalId;
    }
    
    /**
     * @dev Accept a proposal
     * @param projectId The ID of the project
     * @param proposalId The ID of the proposal
     */
    function acceptProposal(uint256 projectId, uint256 proposalId) external nonReentrant {
        Project storage project = _projects[projectId];
        require(project.id > 0, "Project does not exist");
        require(project.isActive, "Project is not active");
        require(project.isFunded, "Project is not funded yet");
        require(msg.sender == project.creator, "Only project creator can accept proposals");
        
        // Find the proposal
        Proposal[] storage proposals = _projectProposals[projectId];
        
        uint256 proposalIndex = type(uint256).max;
        for (uint256 i = 0; i < proposals.length; i++) {
            if (proposals[i].id == proposalId) {
                proposalIndex = i;
                break;
            }
        }
        
        require(proposalIndex != type(uint256).max, "Proposal not found");
        require(!proposals[proposalIndex].isAccepted, "Proposal already accepted");
        
        Proposal storage proposal = proposals[proposalIndex];
        require(proposal.amount <= project.currentFunding, "Insufficient project funds");
        
        // Mark the proposal as accepted
        proposal.isAccepted = true;
        
        // Transfer funds to the proposer
        (bool success, ) = proposal.proposer.call{value: proposal.amount}("");
        require(success, "Transfer to proposer failed");
        
        // Update project funding
        project.currentFunding -= proposal.amount;
        
        emit ProposalAccepted(projectId, proposalId, proposal.proposer);
    }
    
    // Getter functions
    
    /**
     * @dev Get project details
     * @param projectId The ID of the project
     * @return Project details
     */
    function getProject(uint256 projectId) external view returns (Project memory) {
        require(_projects[projectId].id > 0, "Project does not exist");
        return _projects[projectId];
    }
    
    /**
     * @dev Get the total number of projects
     * @return Total number of projects
     */
    function getTotalProjects() external view returns (uint256) {
        return _nextProjectId - 1;
    }
    
    /**
     * @dev Get the team members for a project
     * @param projectId The ID of the project
     * @return Array of team members
     */
    function getProjectTeam(uint256 projectId) external view returns (TeamMember[] memory) {
        require(_projects[projectId].id > 0, "Project does not exist");
        return _projectTeams[projectId];
    }
    
    /**
     * @dev Get the proposals for a project
     * @param projectId The ID of the project
     * @return Array of proposals
     */
    function getProjectProposals(uint256 projectId) external view returns (Proposal[] memory) {
        require(_projects[projectId].id > 0, "Project does not exist");
        return _projectProposals[projectId];
    }
    
    /**
     * @dev Get the projects created by a user
     * @param userAddress The address of the user
     * @return Array of project IDs
     */
    function getUserProjects(address userAddress) external view returns (uint256[] memory) {
        return _userProjects[userAddress];
    }
    
    /**
     * @dev Get the projects joined by a user
     * @param userAddress The address of the user
     * @return Array of project IDs
     */
    function getUserJoinedProjects(address userAddress) external view returns (uint256[] memory) {
        return _userJoinedProjects[userAddress];
    }
    
    // Grant management functions
    
    /**
     * @dev Create a new grant
     * @param name Grant name
     * @param description Grant description
     * @param categories Grant categories
     * @return The ID of the created grant
     */
    function createGrant(
        string memory name,
        string memory description,
        string[] memory categories
    ) external payable returns (uint256) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(description).length > 0, "Description cannot be empty");
        require(msg.value > 0, "Must provide funding");
        
        uint256 grantId = _nextGrantId++;
        
        _grants[grantId] = Grant({
            id: grantId,
            name: name,
            description: description,
            availableFunds: msg.value,
            provider: msg.sender,
            isActive: true,
            categories: categories,
            createdAt: block.timestamp
        });
        
        _providerGrants[msg.sender].push(grantId);
        
        emit GrantCreated(grantId, msg.sender, name, msg.value);
        
        return grantId;
    }
    
    /**
     * @dev Create a grant match between a grant and a project
     * @param grantId The ID of the grant
     * @param projectId The ID of the project
     * @param amount The amount to match
     * @param matchScore The match score (0-10000)
     */
    function createGrantMatch(
        uint256 grantId,
        uint256 projectId,
        uint256 amount,
        uint256 matchScore
    ) external {
        Grant storage grant = _grants[grantId];
        Project storage project = _projects[projectId];
        
        require(grant.id > 0, "Grant does not exist");
        require(project.id > 0, "Project does not exist");
        require(grant.isActive, "Grant is not active");
        require(project.isActive, "Project is not active");
        require(amount > 0 && amount <= grant.availableFunds, "Invalid amount");
        require(matchScore <= 10000, "Match score must be between 0 and 10000");
        
        // Only the grant provider or project creator can create a match
        require(
            msg.sender == grant.provider || msg.sender == project.creator,
            "Only grant provider or project creator can create a match"
        );
        
        // Create the grant match
        _projectGrantMatches[projectId].push(GrantMatch({
            grantId: grantId,
            projectId: projectId,
            amount: amount,
            matchScore: matchScore,
            isApproved: false,
            isClaimed: false,
            claimedAt: 0
        }));
        
        emit GrantMatchCreated(grantId, projectId, amount, matchScore);
    }
    
    /**
     * @dev Approve a grant match
     * @param grantId The ID of the grant
     * @param projectId The ID of the project
     */
    function approveGrantMatch(uint256 grantId, uint256 projectId) external {
        Grant storage grant = _grants[grantId];
        Project storage project = _projects[projectId];
        
        require(grant.id > 0, "Grant does not exist");
        require(project.id > 0, "Project does not exist");
        require(msg.sender == grant.provider, "Only grant provider can approve matches");
        
        // Find the grant match
        GrantMatch[] storage matches = _projectGrantMatches[projectId];
        uint256 matchIndex = type(uint256).max;
        
        for (uint256 i = 0; i < matches.length; i++) {
            if (matches[i].grantId == grantId) {
                matchIndex = i;
                break;
            }
        }
        
        require(matchIndex != type(uint256).max, "Grant match not found");
        require(!matches[matchIndex].isApproved, "Grant match already approved");
        require(!matches[matchIndex].isClaimed, "Grant match already claimed");
        require(matches[matchIndex].amount <= grant.availableFunds, "Insufficient grant funds");
        
        // Approve the grant match
        matches[matchIndex].isApproved = true;
        
        emit GrantMatchApproved(grantId, projectId, matches[matchIndex].amount);
    }
    
    /**
     * @dev Claim a grant match
     * @param grantId The ID of the grant
     * @param projectId The ID of the project
     */
    function claimGrantMatch(uint256 grantId, uint256 projectId) external nonReentrant {
        Project storage project = _projects[projectId];
        Grant storage grant = _grants[grantId];
        
        require(grant.id > 0, "Grant does not exist");
        require(project.id > 0, "Project does not exist");
        require(msg.sender == project.creator, "Only project creator can claim grant match");
        
        // Find the grant match
        GrantMatch[] storage matches = _projectGrantMatches[projectId];
        uint256 matchIndex = type(uint256).max;
        
        for (uint256 i = 0; i < matches.length; i++) {
            if (matches[i].grantId == grantId) {
                matchIndex = i;
                break;
            }
        }
        
        require(matchIndex != type(uint256).max, "Grant match not found");
        require(matches[matchIndex].isApproved, "Grant match not approved");
        require(!matches[matchIndex].isClaimed, "Grant match already claimed");
        
        uint256 amount = matches[matchIndex].amount;
        require(amount <= grant.availableFunds, "Insufficient grant funds");
        
        // Update grant funds
        grant.availableFunds -= amount;
        
        // Update project funding
        project.currentFunding += amount;
        
        // Mark as claimed
        matches[matchIndex].isClaimed = true;
        matches[matchIndex].claimedAt = block.timestamp;
        
        // Check if project is now fully funded
        if (project.currentFunding >= project.fundingGoal) {
            project.isFunded = true;
            project.completedAt = block.timestamp;
            emit ProjectCompleted(projectId, project.currentFunding);
        }
        
        // Transfer funds to the project creator
        (bool success, ) = project.creator.call{value: amount}("");
        require(success, "Transfer to project creator failed");
        
        emit GrantMatchClaimed(grantId, projectId, amount, project.creator);
    }
    
    /**
     * @dev Get grant details
     * @param grantId The ID of the grant
     * @return Grant details
     */
    function getGrant(uint256 grantId) external view returns (Grant memory) {
        require(_grants[grantId].id > 0, "Grant does not exist");
        return _grants[grantId];
    }
    
    /**
     * @dev Get the grant matches for a project
     * @param projectId The ID of the project
     * @return Array of grant matches
     */
    function getProjectGrantMatches(uint256 projectId) external view returns (GrantMatch[] memory) {
        require(_projects[projectId].id > 0, "Project does not exist");
        return _projectGrantMatches[projectId];
    }
    
    /**
     * @dev Get the grants provided by a user
     * @param providerAddress The address of the provider
     * @return Array of grant IDs
     */
    function getProviderGrants(address providerAddress) external view returns (uint256[] memory) {
        return _providerGrants[providerAddress];
    }
    
    /**
     * @dev Get the total number of grants
     * @return Total number of grants
     */
    function getTotalGrants() external view returns (uint256) {
        return _nextGrantId - 1;
    }
    
    /**
     * @dev Update the platform fee percentage (only owner)
     * @param newFeePercentage New fee percentage in basis points (10000 = 100%)
     */
    function setPlatformFeePercentage(uint256 newFeePercentage) external onlyOwner {
        require(newFeePercentage <= 2000, "Fee cannot exceed 20%");
        
        uint256 oldFee = platformFeePercentage;
        platformFeePercentage = newFeePercentage;
        
        emit PlatformFeeUpdated(oldFee, newFeePercentage);
    }
    
    /**
     * @dev Update the treasury address (only owner)
     * @param newTreasuryAddress New treasury address
     */
    function setTreasuryAddress(address newTreasuryAddress) external onlyOwner {
        require(newTreasuryAddress != address(0), "Treasury address cannot be zero");
        
        address oldAddress = treasuryAddress;
        treasuryAddress = newTreasuryAddress;
        
        emit TreasuryAddressUpdated(oldAddress, newTreasuryAddress);
    }
    
    /**
     * @dev Update a team member's reputation score (only owner)
     * @param projectId The ID of the project
     * @param memberAddress The address of the team member
     * @param newScore The new reputation score
     */
    function updateReputationScore(uint256 projectId, address memberAddress, uint256 newScore) external onlyOwner {
        require(_projects[projectId].id > 0, "Project does not exist");
        
        TeamMember[] storage teamMembers = _projectTeams[projectId];
        for (uint256 i = 0; i < teamMembers.length; i++) {
            if (teamMembers[i].memberAddress == memberAddress) {
                teamMembers[i].reputationScore = newScore;
                return;
            }
        }
        
        revert("Team member not found");
    }
}