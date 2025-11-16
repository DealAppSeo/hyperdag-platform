// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title HyperCrowd
 * @dev Implementation of the HyperCrowd crowdfunding and team matching platform
 * @custom:security-contact security@hyperdag.com
 */
contract HyperCrowd {
    // ============ State Variables ============
    
    // Project counter for generating unique IDs
    uint256 private _projectIdCounter;
    
    // Token counter for generating unique IDs
    uint256 private _tokenIdCounter;
    
    // Platform fee percentage (100 = 1%)
    uint16 private _platformFeePercent = 250; // 2.5%
    
    // Contract owner address
    address private _owner;
    
    // ============ Structs ============
    
    // Project structure
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
    
    // Team member structure
    struct TeamMember {
        address memberAddress;
        string role;
        uint256 reputationScore;
        uint256 joinedAt;
        bool isActive;
    }
    
    // Proposal structure
    struct Proposal {
        uint256 id;
        uint256 projectId;
        address proposer;
        string description;
        uint256 amount;
        uint256 createdAt;
        bool isAccepted;
    }
    
    // Project type enum
    enum ProjectType { RFI, RFP }
    
    // ============ Mappings ============
    
    // Mapping from project ID to Project
    mapping(uint256 => Project) private _projects;
    
    // Mapping from project ID to list of team members
    mapping(uint256 => TeamMember[]) private _projectTeams;
    
    // Mapping from project ID to list of proposals
    mapping(uint256 => Proposal[]) private _projectProposals;
    
    // Mapping of user address to their projects (as creator)
    mapping(address => uint256[]) private _userProjects;
    
    // Mapping of user address to their joined projects (as team member)
    mapping(address => uint256[]) private _userJoinedProjects;
    
    // Mapping of user address to their nonce (for signature verification)
    mapping(address => uint256) private _userNonces;
    
    // ============ Events ============
    
    // Project created event
    event ProjectCreated(
        uint256 indexed projectId,
        address indexed creator,
        string title,
        uint256 fundingGoal,
        uint256 durationDays,
        ProjectType projectType
    );
    
    // Project funded event
    event ProjectFunded(
        uint256 indexed projectId,
        address indexed funder,
        uint256 amount
    );
    
    // Team member joined event
    event TeamMemberJoined(
        uint256 indexed projectId,
        address indexed member,
        string role
    );
    
    // Proposal submitted event
    event ProposalSubmitted(
        uint256 indexed projectId,
        uint256 indexed proposalId,
        address indexed proposer,
        uint256 amount
    );
    
    // Proposal accepted event
    event ProposalAccepted(
        uint256 indexed projectId,
        uint256 indexed proposalId,
        address indexed proposer
    );
    
    // ============ Constructor ============
    
    /**
     * @dev Sets the contract owner to the message sender
     */
    constructor() {
        _owner = msg.sender;
    }
    
    // ============ Modifiers ============
    
    /**
     * @dev Throws if called by any account other than the owner
     */
    modifier onlyOwner() {
        require(msg.sender == _owner, "HyperCrowd: caller is not the owner");
        _;
    }
    
    /**
     * @dev Throws if the project does not exist
     */
    modifier projectExists(uint256 projectId) {
        require(_projects[projectId].creator != address(0), "HyperCrowd: project does not exist");
        _;
    }
    
    /**
     * @dev Throws if the caller is not the project creator
     */
    modifier onlyProjectCreator(uint256 projectId) {
        require(_projects[projectId].creator == msg.sender, "HyperCrowd: caller is not the project creator");
        _;
    }
    
    // ============ Public Functions ============
    
    /**
     * @dev Creates a new project
     * @param title The title of the project
     * @param description The description of the project
     * @param categories Array of project categories
     * @param requiredRoles Array of required team roles
     * @param fundingGoal Funding goal in wei
     * @param durationDays Duration in days
     * @param projectType Type of project (RFI = 0, RFP = 1)
     * @return uint256 The ID of the created project
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
        // Increment project ID counter
        _projectIdCounter++;
        uint256 projectId = _projectIdCounter;
        
        // Create new project
        Project storage project = _projects[projectId];
        project.id = projectId;
        project.creator = msg.sender;
        project.title = title;
        project.description = description;
        project.categories = categories;
        project.requiredRoles = requiredRoles;
        project.fundingGoal = fundingGoal;
        project.currentFunding = 0;
        project.durationDays = durationDays;
        project.createdAt = block.timestamp;
        project.isActive = true;
        project.isFunded = false;
        project.projectType = projectType;
        
        // Add project to user's list
        _userProjects[msg.sender].push(projectId);
        
        // Emit event
        emit ProjectCreated(
            projectId,
            msg.sender,
            title,
            fundingGoal,
            durationDays,
            projectType
        );
        
        return projectId;
    }
    
    /**
     * @dev Funds a project
     * @param projectId The ID of the project to fund
     */
    function fundProject(uint256 projectId) external payable projectExists(projectId) {
        Project storage project = _projects[projectId];
        
        // Check if project is active
        require(project.isActive, "HyperCrowd: project is not active");
        
        // Check if project is not already funded
        require(!project.isFunded, "HyperCrowd: project is already fully funded");
        
        // Update project funding
        project.currentFunding += msg.value;
        
        // Check if project is now fully funded
        if (project.currentFunding >= project.fundingGoal) {
            project.isFunded = true;
        }
        
        // Emit event
        emit ProjectFunded(projectId, msg.sender, msg.value);
    }
    
    /**
     * @dev Allows a user to join a project team
     * @param projectId The ID of the project to join
     * @param role The role the user is taking in the project
     */
    function joinTeam(uint256 projectId, string memory role) external projectExists(projectId) {
        Project storage project = _projects[projectId];
        
        // Check if project is active
        require(project.isActive, "HyperCrowd: project is not active");
        
        // Check if role is required
        bool roleRequired = false;
        for (uint i = 0; i < project.requiredRoles.length; i++) {
            if (keccak256(bytes(project.requiredRoles[i])) == keccak256(bytes(role))) {
                roleRequired = true;
                break;
            }
        }
        require(roleRequired, "HyperCrowd: role is not required for this project");
        
        // Check if user is not already a team member
        for (uint i = 0; i < _projectTeams[projectId].length; i++) {
            require(_projectTeams[projectId][i].memberAddress != msg.sender, "HyperCrowd: already a team member");
        }
        
        // Add team member
        TeamMember memory newMember = TeamMember({
            memberAddress: msg.sender,
            role: role,
            reputationScore: 0, // Initial reputation score
            joinedAt: block.timestamp,
            isActive: true
        });
        
        _projectTeams[projectId].push(newMember);
        _userJoinedProjects[msg.sender].push(projectId);
        
        // Emit event
        emit TeamMemberJoined(projectId, msg.sender, role);
    }
    
    /**
     * @dev Submits a proposal for a project
     * @param projectId The ID of the project
     * @param description The description of the proposal
     * @param amount The amount requested in the proposal
     * @return uint256 The ID of the created proposal
     */
    function submitProposal(
        uint256 projectId,
        string memory description,
        uint256 amount
    ) external projectExists(projectId) returns (uint256) {
        Project storage project = _projects[projectId];
        
        // Check if project is active
        require(project.isActive, "HyperCrowd: project is not active");
        
        // Check if project is funded
        require(project.isFunded, "HyperCrowd: project is not funded");
        
        // Check if user is a team member
        bool isTeamMember = false;
        for (uint i = 0; i < _projectTeams[projectId].length; i++) {
            if (_projectTeams[projectId][i].memberAddress == msg.sender) {
                isTeamMember = true;
                break;
            }
        }
        require(isTeamMember, "HyperCrowd: caller is not a team member");
        
        // Create proposal
        uint256 proposalId = _projectProposals[projectId].length;
        
        Proposal memory newProposal = Proposal({
            id: proposalId,
            projectId: projectId,
            proposer: msg.sender,
            description: description,
            amount: amount,
            createdAt: block.timestamp,
            isAccepted: false
        });
        
        _projectProposals[projectId].push(newProposal);
        
        // Emit event
        emit ProposalSubmitted(projectId, proposalId, msg.sender, amount);
        
        return proposalId;
    }
    
    /**
     * @dev Accepts a proposal (only callable by project creator)
     * @param projectId The ID of the project
     * @param proposalId The ID of the proposal
     */
    function acceptProposal(
        uint256 projectId,
        uint256 proposalId
    ) external projectExists(projectId) onlyProjectCreator(projectId) {
        // Check if proposal exists
        require(proposalId < _projectProposals[projectId].length, "HyperCrowd: proposal does not exist");
        
        Proposal storage proposal = _projectProposals[projectId][proposalId];
        
        // Check if proposal is not already accepted
        require(!proposal.isAccepted, "HyperCrowd: proposal is already accepted");
        
        // Check if project has enough funds
        require(_projects[projectId].currentFunding >= proposal.amount, "HyperCrowd: insufficient project funds");
        
        // Mark proposal as accepted
        proposal.isAccepted = true;
        
        // Transfer funds to proposer
        // Calculate platform fee
        uint256 platformFee = (proposal.amount * _platformFeePercent) / 10000;
        uint256 paymentAmount = proposal.amount - platformFee;
        
        // Update project funding
        _projects[projectId].currentFunding -= proposal.amount;
        
        // Transfer funds
        payable(proposal.proposer).transfer(paymentAmount);
        payable(_owner).transfer(platformFee); // Transfer platform fee to contract owner
        
        // Emit event
        emit ProposalAccepted(projectId, proposalId, proposal.proposer);
    }
    
    /**
     * @dev Gets a project by ID
     * @param projectId The ID of the project
     * @return Project The project data
     */
    function getProject(uint256 projectId) external view projectExists(projectId) returns (Project memory) {
        return _projects[projectId];
    }
    
    /**
     * @dev Gets team members for a project
     * @param projectId The ID of the project
     * @return TeamMember[] Array of team members
     */
    function getProjectTeam(uint256 projectId) external view projectExists(projectId) returns (TeamMember[] memory) {
        return _projectTeams[projectId];
    }
    
    /**
     * @dev Gets proposals for a project
     * @param projectId The ID of the project
     * @return Proposal[] Array of proposals
     */
    function getProjectProposals(uint256 projectId) external view projectExists(projectId) returns (Proposal[] memory) {
        return _projectProposals[projectId];
    }
    
    /**
     * @dev Gets projects created by a user
     * @param userAddress The address of the user
     * @return uint256[] Array of project IDs
     */
    function getUserProjects(address userAddress) external view returns (uint256[] memory) {
        return _userProjects[userAddress];
    }
    
    /**
     * @dev Gets projects joined by a user
     * @param userAddress The address of the user
     * @return uint256[] Array of project IDs
     */
    function getUserJoinedProjects(address userAddress) external view returns (uint256[] memory) {
        return _userJoinedProjects[userAddress];
    }
    
    /**
     * @dev Updates the platform fee percentage (only callable by owner)
     * @param newFeePercent The new fee percentage (100 = 1%)
     */
    function setPlatformFeePercent(uint16 newFeePercent) external onlyOwner {
        require(newFeePercent <= 1000, "HyperCrowd: fee percent too high"); // Max 10%
        _platformFeePercent = newFeePercent;
    }
    
    /**
     * @dev Gets the current platform fee percentage
     * @return uint16 The current fee percentage (100 = 1%)
     */
    function getPlatformFeePercent() external view returns (uint16) {
        return _platformFeePercent;
    }
    
    /**
     * @dev Gets the current owner of the contract
     * @return address The address of the owner
     */
    function getOwner() external view returns (address) {
        return _owner;
    }
    
    /**
     * @dev Gets the total number of projects
     * @return uint256 The total number of projects
     */
    function getTotalProjects() external view returns (uint256) {
        return _projectIdCounter;
    }
}
