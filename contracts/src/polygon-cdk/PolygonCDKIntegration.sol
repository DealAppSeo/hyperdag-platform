// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title PolygonCDKIntegration
 * @dev This contract implements the integration with Polygon CDK (Chain Development Kit)
 * @custom:security-contact security@hyperdag.com
 */
contract PolygonCDKIntegration {
    // State variables
    address public admin;
    bool public isInitialized;
    string public cdkVersion = "1.0.0";
    
    // Event declarations
    event CDKInitialized(address indexed admin, uint256 timestamp);
    event CDKConfigurationUpdated(string configName, string oldValue, string newValue);
    
    // Struct to hold CDK configuration
    struct CDKConfig {
        string rollupType; // "optimistic" or "zk"
        string dataAvailabilityLayer; // "Avail" or "Celestia" or "Ethereum"
        string validationMechanism; // "Plonky3" or other
        bool isEVMCompatible;
        uint256 blockTime;
        uint256 finalizationTime; // Time for block finalization
    }
    
    // CDK configuration
    CDKConfig public cdkConfig;
    
    // Constructor
    constructor(address _admin) {
        admin = _admin;
    }
    
    /**
     * @dev Initializes the CDK integration with specific configuration
     * @param _rollupType Type of rollup ("optimistic" or "zk")
     * @param _dataAvailabilityLayer Data availability layer being used
     * @param _validationMechanism Validation mechanism being used
     * @param _isEVMCompatible Whether this chain is EVM compatible
     * @param _blockTime Target block time in seconds
     * @param _finalizationTime Time for block finalization in seconds
     */
    function initializeCDK(
        string memory _rollupType,
        string memory _dataAvailabilityLayer,
        string memory _validationMechanism,
        bool _isEVMCompatible,
        uint256 _blockTime,
        uint256 _finalizationTime
    ) external {
        require(msg.sender == admin, "Only admin can initialize");
        require(!isInitialized, "Already initialized");
        
        cdkConfig = CDKConfig({
            rollupType: _rollupType,
            dataAvailabilityLayer: _dataAvailabilityLayer,
            validationMechanism: _validationMechanism,
            isEVMCompatible: _isEVMCompatible,
            blockTime: _blockTime,
            finalizationTime: _finalizationTime
        });
        
        isInitialized = true;
        emit CDKInitialized(admin, block.timestamp);
    }
    
    /**
     * @dev Updates the CDK configuration
     * @param _configName Name of the configuration to update
     * @param _newValue New value for the configuration
     */
    function updateCDKConfig(string memory _configName, string memory _newValue) external {
        require(msg.sender == admin, "Only admin can update config");
        require(isInitialized, "Not initialized yet");
        
        string memory oldValue;
        
        if (keccak256(bytes(_configName)) == keccak256(bytes("rollupType"))) {
            oldValue = cdkConfig.rollupType;
            cdkConfig.rollupType = _newValue;
        } else if (keccak256(bytes(_configName)) == keccak256(bytes("dataAvailabilityLayer"))) {
            oldValue = cdkConfig.dataAvailabilityLayer;
            cdkConfig.dataAvailabilityLayer = _newValue;
        } else if (keccak256(bytes(_configName)) == keccak256(bytes("validationMechanism"))) {
            oldValue = cdkConfig.validationMechanism;
            cdkConfig.validationMechanism = _newValue;
        } else {
            revert("Invalid config name");
        }
        
        emit CDKConfigurationUpdated(_configName, oldValue, _newValue);
    }
    
    /**
     * @dev Updates the boolean configurations
     * @param _isEVMCompatible Whether this chain is EVM compatible
     */
    function updateEVMCompatibility(bool _isEVMCompatible) external {
        require(msg.sender == admin, "Only admin can update config");
        require(isInitialized, "Not initialized yet");
        
        cdkConfig.isEVMCompatible = _isEVMCompatible;
    }
    
    /**
     * @dev Updates the numeric configurations
     * @param _configName Name of the configuration to update
     * @param _newValue New numeric value for the configuration
     */
    function updateNumericConfig(string memory _configName, uint256 _newValue) external {
        require(msg.sender == admin, "Only admin can update config");
        require(isInitialized, "Not initialized yet");
        
        if (keccak256(bytes(_configName)) == keccak256(bytes("blockTime"))) {
            cdkConfig.blockTime = _newValue;
        } else if (keccak256(bytes(_configName)) == keccak256(bytes("finalizationTime"))) {
            cdkConfig.finalizationTime = _newValue;
        } else {
            revert("Invalid config name");
        }
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
     * @dev Gets the full CDK configuration
     * @return The CDK configuration struct
     */
    function getCDKConfig() external view returns (CDKConfig memory) {
        return cdkConfig;
    }
}