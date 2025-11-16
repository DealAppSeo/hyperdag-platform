// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./PolygonCDKIntegration.sol";
import "./Plonky3Validator.sol";
import "./AvailDataConnector.sol";
import "../HyperCrowd.sol";
import "../HDAGToken.sol";

/**
 * @title HyperCrowdCDKDeployment
 * @dev This contract handles the deployment of HyperCrowd ecosystem on Polygon CDK
 * @custom:security-contact security@hyperdag.com
 */
contract HyperCrowdCDKDeployment {
    // State variables
    address public admin;
    address public polygonCDKIntegration;
    address public plonky3Validator;
    address public availDataConnector;
    address public hyperCrowdContract;
    address public hdagTokenContract;
    
    bool public isDeployed;
    
    // Event declarations
    event DeploymentInitiated(address indexed admin, uint256 timestamp);
    event DeploymentCompleted(address indexed hyperCrowd, address indexed hdagToken, uint256 timestamp);
    event ContractAddressUpdated(string contractType, address indexed oldAddress, address indexed newAddress);
    
    // Constructor
    constructor(address _admin) {
        admin = _admin;
    }
    
    /**
     * @dev Initializes the Polygon CDK integration and related contracts
     * @param _cdkIntegration Address of the PolygonCDKIntegration contract
     * @param _plonky3Validator Address of the Plonky3Validator contract
     * @param _availConnector Address of the AvailDataConnector contract
     */
    function initializeIntegration(
        address _cdkIntegration,
        address _plonky3Validator,
        address _availConnector
    ) external {
        require(msg.sender == admin, "Only admin can initialize");
        require(!isDeployed, "Already deployed");
        
        require(_cdkIntegration != address(0), "Invalid CDK integration address");
        require(_plonky3Validator != address(0), "Invalid validator address");
        require(_availConnector != address(0), "Invalid connector address");
        
        polygonCDKIntegration = _cdkIntegration;
        plonky3Validator = _plonky3Validator;
        availDataConnector = _availConnector;
        
        // Ensure the integration is initialized
        PolygonCDKIntegration integration = PolygonCDKIntegration(polygonCDKIntegration);
        require(integration.isInitialized(), "CDK integration must be initialized");
        
        // Ensure the validator is initialized
        Plonky3Validator validator = Plonky3Validator(plonky3Validator);
        require(validator.isInitialized(), "Validator must be initialized");
        
        // Ensure the connector is initialized
        AvailDataConnector connector = AvailDataConnector(availDataConnector);
        require(connector.isInitialized(), "Connector must be initialized");
        
        emit DeploymentInitiated(admin, block.timestamp);
    }
    
    /**
     * @dev Deploys the HyperCrowd ecosystem on Polygon CDK
     * @param _ecosystemFundAddress Address for ecosystem development funds
     * @param _teamFundAddress Address for team allocation funds
     * @param _investorsFundAddress Address for investors funds
     * @param _reserveFundAddress Address for reserve funds
     * @param _platformFeePercentage Platform fee percentage for crowdfunding
     */
    function deployHyperCrowdEcosystem(
        address _ecosystemFundAddress,
        address _teamFundAddress,
        address _investorsFundAddress,
        address _reserveFundAddress,
        uint8 _platformFeePercentage
    ) external {
        require(msg.sender == admin, "Only admin can deploy");
        require(!isDeployed, "Already deployed");
        require(polygonCDKIntegration != address(0), "Integration not initialized");
        
        // Deploy HDAG Token
        HDAGToken hdagToken = new HDAGToken(
            _ecosystemFundAddress,
            _teamFundAddress,
            _investorsFundAddress,
            _reserveFundAddress
        );
        
        // Deploy HyperCrowd
        HyperCrowd hyperCrowd = new HyperCrowd(
            address(hdagToken),
            _platformFeePercentage,
            admin
        );
        
        hdagTokenContract = address(hdagToken);
        hyperCrowdContract = address(hyperCrowd);
        isDeployed = true;
        
        emit DeploymentCompleted(hyperCrowdContract, hdagTokenContract, block.timestamp);
    }
    
    /**
     * @dev Updates a contract address
     * @param _contractType Type of contract to update ("cdk", "validator", "connector", "hypercrowd", "token")
     * @param _newAddress New address for the contract
     */
    function updateContractAddress(string memory _contractType, address _newAddress) external {
        require(msg.sender == admin, "Only admin can update");
        require(_newAddress != address(0), "Invalid address");
        
        bytes32 contractTypeHash = keccak256(bytes(_contractType));
        
        if (contractTypeHash == keccak256(bytes("cdk"))) {
            address oldAddress = polygonCDKIntegration;
            polygonCDKIntegration = _newAddress;
            emit ContractAddressUpdated(_contractType, oldAddress, _newAddress);
        } else if (contractTypeHash == keccak256(bytes("validator"))) {
            address oldAddress = plonky3Validator;
            plonky3Validator = _newAddress;
            emit ContractAddressUpdated(_contractType, oldAddress, _newAddress);
        } else if (contractTypeHash == keccak256(bytes("connector"))) {
            address oldAddress = availDataConnector;
            availDataConnector = _newAddress;
            emit ContractAddressUpdated(_contractType, oldAddress, _newAddress);
        } else if (contractTypeHash == keccak256(bytes("hypercrowd"))) {
            address oldAddress = hyperCrowdContract;
            hyperCrowdContract = _newAddress;
            emit ContractAddressUpdated(_contractType, oldAddress, _newAddress);
        } else if (contractTypeHash == keccak256(bytes("token"))) {
            address oldAddress = hdagTokenContract;
            hdagTokenContract = _newAddress;
            emit ContractAddressUpdated(_contractType, oldAddress, _newAddress);
        } else {
            revert("Invalid contract type");
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
}