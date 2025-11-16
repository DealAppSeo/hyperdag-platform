// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title SoulboundIdentity
 * @dev Implementation of a soulbound token (non-transferable NFT) for self-sovereign identity
 * with zero-knowledge proof verification capabilities
 */
contract SoulboundIdentity is ERC721, Ownable {
    using ECDSA for bytes32;
    using Strings for uint256;

    // Identity token counter
    uint256 private _tokenIdCounter;

    // Maps tokenId to metadata hash
    mapping(uint256 => bytes32) private _metadataHashes;

    // Maps tokenId to verification registry address
    mapping(uint256 => address) private _verificationRegistries;

    // Maps address to tokenId
    mapping(address => uint256) private _addressToTokenId;

    // Maps tokenId to credential commitment hashes
    mapping(uint256 => mapping(bytes32 => bytes32)) private _credentialCommitments;

    // Maps tokenId to ZKP verifier addresses for different verification types
    mapping(uint256 => mapping(bytes32 => address)) private _zkpVerifiers;

    // Credential revocation status
    mapping(bytes32 => bool) private _revokedCredentials;

    // Events
    event IdentityCreated(uint256 indexed tokenId, address indexed owner, bytes32 metadataHash);
    event CredentialAdded(uint256 indexed tokenId, bytes32 indexed credentialType, bytes32 commitmentHash);
    event CredentialRevoked(uint256 indexed tokenId, bytes32 indexed credentialType);
    event VerificationCompleted(uint256 indexed tokenId, bytes32 indexed verificationType, bool success);

    /**
     * @dev Constructor for SoulboundIdentity
     */
    constructor() ERC721("HyperDAG Identity", "HDID") Ownable(msg.sender) {}

    /**
     * @dev Creates a new identity token for the specified owner
     * @param owner The owner of the identity token
     * @param metadataHash Hash of the off-chain metadata
     * @param verificationRegistry Address of the verification registry
     * @return The ID of the newly created token
     */
    function createIdentity(address owner, bytes32 metadataHash, address verificationRegistry) 
        external 
        onlyOwner 
        returns (uint256) 
    {
        require(owner != address(0), "Invalid owner address");
        require(_addressToTokenId[owner] == 0, "Identity already exists for this address");

        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;

        _safeMint(owner, tokenId);
        _metadataHashes[tokenId] = metadataHash;
        _verificationRegistries[tokenId] = verificationRegistry;
        _addressToTokenId[owner] = tokenId;

        emit IdentityCreated(tokenId, owner, metadataHash);

        return tokenId;
    }

    /**
     * @dev Adds a credential commitment to an identity
     * @param tokenId The identity token ID
     * @param credentialType Type identifier for the credential
     * @param commitmentHash Hash of the credential commitment
     */
    function addCredential(
        uint256 tokenId, 
        bytes32 credentialType, 
        bytes32 commitmentHash
    ) 
        external 
        onlyOwner 
    {
        require(_exists(tokenId), "Identity does not exist");
        require(commitmentHash != bytes32(0), "Invalid commitment hash");

        _credentialCommitments[tokenId][credentialType] = commitmentHash;

        emit CredentialAdded(tokenId, credentialType, commitmentHash);
    }

    /**
     * @dev Sets a ZKP verifier contract for a specific verification type
     * @param tokenId The identity token ID
     * @param verificationType Type of verification
     * @param verifierAddress Address of the ZKP verifier contract
     */
    function setZkpVerifier(
        uint256 tokenId,
        bytes32 verificationType,
        address verifierAddress
    )
        external
        onlyOwner
    {
        require(_exists(tokenId), "Identity does not exist");
        require(verifierAddress != address(0), "Invalid verifier address");

        _zkpVerifiers[tokenId][verificationType] = verifierAddress;
    }

    /**
     * @dev Revokes a credential
     * @param credentialId Unique identifier for the credential
     */
    function revokeCredential(bytes32 credentialId) external onlyOwner {
        _revokedCredentials[credentialId] = true;
        emit CredentialRevoked(0, credentialId); // tokenId 0 means global revocation
    }

    /**
     * @dev Records a successful verification
     * @param tokenId The identity token ID
     * @param verificationType Type of verification that was completed
     */
    function recordVerification(
        uint256 tokenId,
        bytes32 verificationType
    )
        external
    {
        // Verify the caller is an authorized verifier
        require(
            msg.sender == _zkpVerifiers[tokenId][verificationType] ||
            msg.sender == owner(),
            "Unauthorized verifier"
        );

        emit VerificationCompleted(tokenId, verificationType, true);
    }

    /**
     * @dev Gets credential commitment hash
     */
    function getCredentialCommitment(uint256 tokenId, bytes32 credentialType) 
        external 
        view 
        returns (bytes32) 
    {
        return _credentialCommitments[tokenId][credentialType];
    }

    /**
     * @dev Checks if a credential has been revoked
     */
    function isCredentialRevoked(bytes32 credentialId) external view returns (bool) {
        return _revokedCredentials[credentialId];
    }

    /**
     * @dev Gets token ID for an address
     */
    function getTokenIdForAddress(address owner) external view returns (uint256) {
        return _addressToTokenId[owner];
    }

    /**
     * @dev Gets metadata hash for a token
     */
    function getMetadataHash(uint256 tokenId) external view returns (bytes32) {
        require(_exists(tokenId), "Identity does not exist");
        return _metadataHashes[tokenId];
    }

    // Override transfer functions to make the token soulbound (non-transferable)
    function _beforeTokenTransfer(address from, address to, uint256, uint256) internal pure override {
        // Only allow minting, not transferring
        if (from != address(0)) {
            revert("SoulboundIdentity: token is non-transferable");
        }
    }
}