// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./PolygonCDKIntegration.sol";

/**
 * @title AvailDataConnector
 * @dev This contract implements the connection to Polygon Avail data availability layer
 * @custom:security-contact security@hyperdag.com
 */
contract AvailDataConnector {
    // State variables
    address public admin;
    PolygonCDKIntegration public cdkIntegration;
    bool public isInitialized;
    string public availEndpoint;
    uint256 public availAppId;
    
    // Event declarations
    event ConnectorInitialized(address indexed admin, string availEndpoint, uint256 timestamp);
    event DataSubmitted(bytes32 indexed dataHash, uint256 size, uint256 timestamp);
    event EndpointUpdated(string oldEndpoint, string newEndpoint);
    event AppIdUpdated(uint256 oldAppId, uint256 newAppId);
    
    // Structs
    struct AvailData {
        bytes32 dataHash;
        uint256 dataSize;
        uint256 timestamp;
        bool confirmed;
    }
    
    // Mapping of submitted data hashes to their metadata
    mapping(bytes32 => AvailData) public submittedData;
    
    // Constructor
    constructor(address _admin, address _cdkIntegration) {
        admin = _admin;
        cdkIntegration = PolygonCDKIntegration(_cdkIntegration);
    }
    
    /**
     * @dev Initializes the Avail connector
     * @param _availEndpoint The endpoint for the Avail node
     * @param _availAppId The application ID on Avail
     */
    function initializeConnector(string memory _availEndpoint, uint256 _availAppId) external {
        require(msg.sender == admin, "Only admin can initialize");
        require(!isInitialized, "Already initialized");
        
        // Verification with CDK integration
        require(cdkIntegration.isInitialized(), "CDK integration must be initialized first");
        
        // Check if using Avail as data availability layer
        PolygonCDKIntegration.CDKConfig memory config = cdkIntegration.getCDKConfig();
        bytes memory daLayerBytes = bytes(config.dataAvailabilityLayer);
        bytes memory availBytes = bytes("Avail");
        
        bool isAvail = daLayerBytes.length == availBytes.length;
        if (isAvail) {
            for (uint i = 0; i < daLayerBytes.length; i++) {
                if (daLayerBytes[i] != availBytes[i]) {
                    isAvail = false;
                    break;
                }
            }
        }
        
        require(isAvail, "CDK must use Avail as data availability layer");
        
        availEndpoint = _availEndpoint;
        availAppId = _availAppId;
        isInitialized = true;
        
        emit ConnectorInitialized(admin, _availEndpoint, block.timestamp);
    }
    
    /**
     * @dev Submits data to the Avail network
     * @param _data The data to submit
     * @return The hash of the submitted data
     */
    function submitData(bytes memory _data) public returns (bytes32) {
        require(isInitialized, "Connector not initialized");
        
        bytes32 dataHash = keccak256(_data);
        
        // In a real implementation, this would interact with Avail
        // Since we don't have direct access to Avail, we'll simulate it
        AvailData memory newData = AvailData({
            dataHash: dataHash,
            dataSize: _data.length,
            timestamp: block.timestamp,
            confirmed: false
        });
        
        submittedData[dataHash] = newData;
        
        emit DataSubmitted(dataHash, _data.length, block.timestamp);
        return dataHash;
    }
    
    /**
     * @dev Confirms data submission to Avail
     * @param _dataHash The hash of the data to confirm
     */
    function confirmDataSubmission(bytes32 _dataHash) external {
        require(msg.sender == admin, "Only admin can confirm data");
        require(submittedData[_dataHash].dataHash == _dataHash, "Data not found");
        require(!submittedData[_dataHash].confirmed, "Data already confirmed");
        
        submittedData[_dataHash].confirmed = true;
    }
    
    /**
     * @dev Updates the Avail endpoint
     * @param _newEndpoint The new endpoint URL
     */
    function updateAvailEndpoint(string memory _newEndpoint) external {
        require(msg.sender == admin, "Only admin can update");
        string memory oldEndpoint = availEndpoint;
        availEndpoint = _newEndpoint;
        
        emit EndpointUpdated(oldEndpoint, _newEndpoint);
    }
    
    /**
     * @dev Updates the Avail application ID
     * @param _newAppId The new application ID
     */
    function updateAvailAppId(uint256 _newAppId) external {
        require(msg.sender == admin, "Only admin can update");
        uint256 oldAppId = availAppId;
        availAppId = _newAppId;
        
        emit AppIdUpdated(oldAppId, _newAppId);
    }
    
    /**
     * @dev Changes the admin address
     * @param _newAdmin The new admin address
     */
    function changeAdmin(address _newAdmin) external {
        require(msg.sender == admin, "Only admin can change admin");
        require(_newAdmin != address(0), "Invalid address");
        admin = _newAdmin;
    }
    
    /**
     * @dev Updates the CDK integration
     * @param _newCdkIntegration The new CDK integration address
     */
    function updateCDKIntegration(address _newCdkIntegration) external {
        require(msg.sender == admin, "Only admin can update");
        require(_newCdkIntegration != address(0), "Invalid address");
        cdkIntegration = PolygonCDKIntegration(_newCdkIntegration);
    }
    
    /**
     * @dev Checks if data is confirmed on Avail
     * @param _dataHash The hash of the data to check
     * @return Whether the data is confirmed
     */
    function isDataConfirmed(bytes32 _dataHash) external view returns (bool) {
        return submittedData[_dataHash].confirmed;
    }
    
    /**
     * @dev Gets data information
     * @param _dataHash The hash of the data to get
     * @return The data information
     */
    function getDataInfo(bytes32 _dataHash) external view returns (AvailData memory) {
        return submittedData[_dataHash];
    }
}