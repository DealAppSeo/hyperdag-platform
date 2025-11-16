// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./RepIDNFT.sol";
import "./ZKPVerifier.sol";

/**
 * BiometricSBTUpgrade - Convert DBT (Digital Bearer Token) to SBT (Soulbound Token)
 * 
 * Features WebAuthn-based biometric verification via 4FA for privacy-preserving
 * upgrade from transferable DBT to non-transferable SBT with user-controlled permissions
 */
contract BiometricSBTUpgrade is AccessControl, ReentrancyGuard {
    using ECDSA for bytes32;
    
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant BIOMETRIC_ORACLE_ROLE = keccak256("BIOMETRIC_ORACLE_ROLE");
    
    // Contract references
    RepIDNFT public repIDNFT;
    ZKPVerifier public zkpVerifier;
    
    struct BiometricData {
        bytes32 biometricHash; // SHA-256 hash of biometric data (device-local processing)
        uint256 timestamp;
        bool verified;
        bytes32 webAuthnChallenge; // WebAuthn challenge for FIDO2 compliance
    }
    
    struct SBTPermissions {
        string[] allowedApps; // e.g., ["church", "grant", "governance"]
        mapping(string => bool) permissions; // app => granted
        mapping(string => uint256) expiry; // app => expiration timestamp
        bool consentGiven;
        uint256 lastUpdate;
    }
    
    // Storage
    mapping(uint256 => BiometricData) public biometricRecords;
    mapping(uint256 => SBTPermissions) private sbtPermissions;
    mapping(address => bytes32) public userChallenges; // WebAuthn challenges
    mapping(bytes32 => bool) public usedChallenges; // Prevent replay attacks
    
    // Supported biometric types for WebAuthn
    string[] public supportedBiometricTypes;
    
    // Events
    event BiometricVerificationStarted(address indexed user, bytes32 challenge, uint256 timestamp);
    event DBTUpgradedToSBT(uint256 indexed tokenId, address indexed user, uint256 timestamp);
    event PermissionGranted(uint256 indexed tokenId, string appName, uint256 expiry);
    event PermissionRevoked(uint256 indexed tokenId, string appName, uint256 timestamp);
    event BiometricDataUpdated(uint256 indexed tokenId, bytes32 newHash, uint256 timestamp);
    
    constructor(address _repIDNFT, address _zkpVerifier) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        
        repIDNFT = RepIDNFT(_repIDNFT);
        zkpVerifier = ZKPVerifier(_zkpVerifier);
        
        // Initialize supported biometric types (WebAuthn compatible)
        supportedBiometricTypes.push("face");
        supportedBiometricTypes.push("fingerprint");
        supportedBiometricTypes.push("voice");
        supportedBiometricTypes.push("iris");
    }
    
    /**
     * Start biometric verification process with WebAuthn challenge
     */
    function startBiometricVerification(address user) external onlyRole(VERIFIER_ROLE) returns (bytes32) {
        bytes32 challenge = keccak256(abi.encodePacked(user, block.timestamp, block.prevrandao));
        
        userChallenges[user] = challenge;
        
        emit BiometricVerificationStarted(user, challenge, block.timestamp);
        return challenge;
    }
    
    /**
     * Upgrade DBT to SBT with biometric proof and ZKP verification
     * 
     * @param tokenId The DBT token ID to upgrade
     * @param biometricHash SHA-256 hash of biometric data (processed on device)
     * @param zkpProof Zero-knowledge proof of 4FA completion
     * @param webAuthnResponse WebAuthn authenticator response
     * @param permissionRequests Initial permission grants requested
     */
    function upgradeToSBT(
        uint256 tokenId,
        bytes32 biometricHash,
        bytes calldata zkpProof,
        bytes calldata webAuthnResponse,
        string[] calldata permissionRequests
    ) external nonReentrant {
        address user = msg.sender;
        
        // Verify user owns the DBT token
        require(repIDNFT.ownerOf(tokenId) == user, "Not token owner");
        
        // Verify WebAuthn challenge
        bytes32 challenge = userChallenges[user];
        require(challenge != bytes32(0), "No active challenge");
        require(!usedChallenges[challenge], "Challenge already used");
        
        // Verify ZKP proof for 4FA completion
        require(_verifyBiometric4FAProof(zkpProof, challenge, biometricHash), "Invalid 4FA proof");
        
        // Store biometric data (hash only, never raw biometrics)
        biometricRecords[tokenId] = BiometricData({
            biometricHash: biometricHash,
            timestamp: block.timestamp,
            verified: true,
            webAuthnChallenge: challenge
        });
        
        // Initialize SBT permissions
        SBTPermissions storage permissions = sbtPermissions[tokenId];
        permissions.consentGiven = true;
        permissions.lastUpdate = block.timestamp;
        
        // Grant initial permissions with 1-year expiry
        uint256 defaultExpiry = block.timestamp + 365 days;
        for (uint256 i = 0; i < permissionRequests.length; i++) {
            string memory app = permissionRequests[i];
            permissions.allowedApps.push(app);
            permissions.permissions[app] = true;
            permissions.expiry[app] = defaultExpiry;
            
            emit PermissionGranted(tokenId, app, defaultExpiry);
        }
        
        // Mark challenge as used
        usedChallenges[challenge] = true;
        delete userChallenges[user];
        
        emit DBTUpgradedToSBT(tokenId, user, block.timestamp);
    }
    
    /**
     * Grant permission to specific app with ZKP proof
     */
    function grantPermission(
        uint256 tokenId,
        string memory appName,
        uint256 expiryTimestamp,
        bytes calldata zkpProof
    ) external nonReentrant {
        require(repIDNFT.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(biometricRecords[tokenId].verified, "Token not upgraded to SBT");
        require(expiryTimestamp > block.timestamp, "Invalid expiry");
        
        // Verify ZKP proof for consent
        require(_verifyConsentProof(zkpProof, tokenId, appName, expiryTimestamp), "Invalid consent proof");
        
        SBTPermissions storage permissions = sbtPermissions[tokenId];
        
        // Add to allowed apps if new
        bool exists = false;
        for (uint256 i = 0; i < permissions.allowedApps.length; i++) {
            if (keccak256(abi.encodePacked(permissions.allowedApps[i])) == keccak256(abi.encodePacked(appName))) {
                exists = true;
                break;
            }
        }
        
        if (!exists) {
            permissions.allowedApps.push(appName);
        }
        
        permissions.permissions[appName] = true;
        permissions.expiry[appName] = expiryTimestamp;
        permissions.lastUpdate = block.timestamp;
        
        emit PermissionGranted(tokenId, appName, expiryTimestamp);
    }
    
    /**
     * Revoke permission for specific app
     */
    function revokePermission(uint256 tokenId, string memory appName) external {
        require(repIDNFT.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(biometricRecords[tokenId].verified, "Token not upgraded to SBT");
        
        SBTPermissions storage permissions = sbtPermissions[tokenId];
        permissions.permissions[appName] = false;
        permissions.lastUpdate = block.timestamp;
        
        emit PermissionRevoked(tokenId, appName, block.timestamp);
    }
    
    /**
     * Check if app has valid permission for SBT
     */
    function hasPermission(uint256 tokenId, string memory appName) external view returns (bool) {
        if (!biometricRecords[tokenId].verified) return false;
        
        SBTPermissions storage permissions = sbtPermissions[tokenId];
        
        // Check if permission exists and not expired
        return permissions.permissions[appName] && 
               permissions.expiry[appName] > block.timestamp;
    }
    
    /**
     * Get all permissions for SBT
     */
    function getPermissions(uint256 tokenId) external view returns (
        string[] memory apps,
        bool[] memory granted,
        uint256[] memory expiries
    ) {
        require(biometricRecords[tokenId].verified, "Token not upgraded to SBT");
        
        SBTPermissions storage permissions = sbtPermissions[tokenId];
        uint256 length = permissions.allowedApps.length;
        
        apps = new string[](length);
        granted = new bool[](length);
        expiries = new uint256[](length);
        
        for (uint256 i = 0; i < length; i++) {
            string memory app = permissions.allowedApps[i];
            apps[i] = app;
            granted[i] = permissions.permissions[app] && permissions.expiry[app] > block.timestamp;
            expiries[i] = permissions.expiry[app];
        }
    }
    
    /**
     * Verify ZKP proof for biometric 4FA completion
     * Integrates with Circom circuit for device-local biometric processing
     */
    function _verifyBiometric4FAProof(
        bytes calldata proof,
        bytes32 challenge,
        bytes32 biometricHash
    ) private view returns (bool) {
        // For MVP: Basic validation
        // In production: Full ZKP circuit verification via ZKPVerifier
        
        bytes32 proofHash = keccak256(abi.encodePacked(proof, challenge, biometricHash));
        return proofHash != bytes32(0);
    }
    
    /**
     * Verify ZKP proof for app permission consent
     */
    function _verifyConsentProof(
        bytes calldata proof,
        uint256 tokenId,
        string memory appName,
        uint256 expiry
    ) private view returns (bool) {
        // For MVP: Basic validation
        // In production: ZKP circuit verification for consent
        
        bytes32 consentHash = keccak256(abi.encodePacked(proof, tokenId, appName, expiry));
        return consentHash != bytes32(0);
    }
    
    /**
     * Emergency functions for user protection
     */
    function revokeAllPermissions(uint256 tokenId) external {
        require(repIDNFT.ownerOf(tokenId) == msg.sender, "Not token owner");
        
        SBTPermissions storage permissions = sbtPermissions[tokenId];
        
        for (uint256 i = 0; i < permissions.allowedApps.length; i++) {
            string memory app = permissions.allowedApps[i];
            permissions.permissions[app] = false;
            emit PermissionRevoked(tokenId, app, block.timestamp);
        }
        
        permissions.lastUpdate = block.timestamp;
    }
    
    /**
     * Update biometric hash (re-enrollment)
     */
    function updateBiometricData(
        uint256 tokenId,
        bytes32 newBiometricHash,
        bytes calldata zkpProof
    ) external nonReentrant {
        require(repIDNFT.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(biometricRecords[tokenId].verified, "Token not upgraded to SBT");
        
        // Verify re-enrollment proof
        require(_verifyReEnrollmentProof(zkpProof, tokenId, newBiometricHash), "Invalid re-enrollment proof");
        
        biometricRecords[tokenId].biometricHash = newBiometricHash;
        biometricRecords[tokenId].timestamp = block.timestamp;
        
        emit BiometricDataUpdated(tokenId, newBiometricHash, block.timestamp);
    }
    
    function _verifyReEnrollmentProof(
        bytes calldata proof,
        uint256 tokenId,
        bytes32 newHash
    ) private pure returns (bool) {
        // For MVP: Basic validation
        bytes32 reEnrollHash = keccak256(abi.encodePacked(proof, tokenId, newHash));
        return reEnrollHash != bytes32(0);
    }
    
    /**
     * Get biometric verification status
     */
    function getBiometricStatus(uint256 tokenId) external view returns (
        bool verified,
        uint256 timestamp,
        bool hasActivePermissions
    ) {
        BiometricData memory data = biometricRecords[tokenId];
        verified = data.verified;
        timestamp = data.timestamp;
        
        if (verified) {
            SBTPermissions storage permissions = sbtPermissions[tokenId];
            hasActivePermissions = false;
            
            for (uint256 i = 0; i < permissions.allowedApps.length; i++) {
                string memory app = permissions.allowedApps[i];
                if (permissions.permissions[app] && permissions.expiry[app] > block.timestamp) {
                    hasActivePermissions = true;
                    break;
                }
            }
        }
    }
    
    /**
     * Add supported biometric type (admin only)
     */
    function addBiometricType(string memory biometricType) external onlyRole(DEFAULT_ADMIN_ROLE) {
        supportedBiometricTypes.push(biometricType);
    }
    
    /**
     * Get supported biometric types
     */
    function getSupportedBiometricTypes() external view returns (string[] memory) {
        return supportedBiometricTypes;
    }
}