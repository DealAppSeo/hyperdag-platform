// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title HDAGToken
 * @dev Implementation of the HDAG token with burning, pausing, and minting capabilities
 * @custom:security-contact security@hyperdag.com
 */
contract HDAGToken is ERC20, ERC20Burnable, Pausable, Ownable {
    // Maximum total supply (100 million tokens with 18 decimals)
    uint256 public constant MAX_SUPPLY = 100_000_000 * 10**18;
    
    // Token distribution ratios (in percentage)
    uint8 public constant ECOSYSTEM_RATIO = 40; // 40% for ecosystem growth
    uint8 public constant TEAM_RATIO = 15;      // 15% for team
    uint8 public constant INVESTORS_RATIO = 25; // 25% for investors
    uint8 public constant RESERVE_RATIO = 20;   // 20% for reserve fund
    
    // Token distribution addresses
    address public ecosystemFundAddress;
    address public teamFundAddress;
    address public investorsFundAddress;
    address public reserveFundAddress;
    
    // Token release timestamps
    uint256 public teamTokensReleaseTime;
    uint256 public investorsTokensReleaseTime;
    
    // Events
    event TokensReleased(address indexed to, uint256 amount);
    event AddressChanged(string indexed role, address indexed oldAddress, address indexed newAddress);
    
    /**
     * @dev Constructor that initializes the HDAG token and sets up distribution addresses
     * @param _ecosystemFundAddress Address for ecosystem development funds
     * @param _teamFundAddress Address for team allocation funds
     * @param _investorsFundAddress Address for investors funds
     * @param _reserveFundAddress Address for reserve funds
     */
    constructor(
        address _ecosystemFundAddress,
        address _teamFundAddress,
        address _investorsFundAddress,
        address _reserveFundAddress
    ) ERC20("HyperDAG Token", "HDAG") {
        require(_ecosystemFundAddress != address(0), "Ecosystem address cannot be zero");
        require(_teamFundAddress != address(0), "Team address cannot be zero");
        require(_investorsFundAddress != address(0), "Investors address cannot be zero");
        require(_reserveFundAddress != address(0), "Reserve address cannot be zero");
        
        ecosystemFundAddress = _ecosystemFundAddress;
        teamFundAddress = _teamFundAddress;
        investorsFundAddress = _investorsFundAddress;
        reserveFundAddress = _reserveFundAddress;
        
        // Set token release times (1 year for team, 6 months for investors)
        teamTokensReleaseTime = block.timestamp + 365 days;
        investorsTokensReleaseTime = block.timestamp + 180 days;
        
        // Initial token distribution - Ecosystem funds are available immediately
        uint256 ecosystemTokens = (MAX_SUPPLY * ECOSYSTEM_RATIO) / 100;
        _mint(ecosystemFundAddress, ecosystemTokens);
        
        // Reserve fund tokens are available immediately
        uint256 reserveTokens = (MAX_SUPPLY * RESERVE_RATIO) / 100;
        _mint(reserveFundAddress, reserveTokens);
        
        // Team and investors tokens are minted to this contract and will be released later
        uint256 teamTokens = (MAX_SUPPLY * TEAM_RATIO) / 100;
        uint256 investorsTokens = (MAX_SUPPLY * INVESTORS_RATIO) / 100;
        
        _mint(address(this), teamTokens + investorsTokens);
    }
    
    /**
     * @dev Pauses token transfers (only callable by owner)
     */
    function pause() public onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpauses token transfers (only callable by owner)
     */
    function unpause() public onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Releases team tokens after lockup period
     */
    function releaseTeamTokens() external {
        require(block.timestamp >= teamTokensReleaseTime, "Team tokens are still locked");
        require(balanceOf(address(this)) > 0, "No tokens to release");
        
        uint256 teamTokens = (MAX_SUPPLY * TEAM_RATIO) / 100;
        require(teamTokens <= balanceOf(address(this)), "Insufficient tokens in contract");
        
        _transfer(address(this), teamFundAddress, teamTokens);
        
        emit TokensReleased(teamFundAddress, teamTokens);
    }
    
    /**
     * @dev Releases investor tokens after lockup period
     */
    function releaseInvestorTokens() external {
        require(block.timestamp >= investorsTokensReleaseTime, "Investor tokens are still locked");
        require(balanceOf(address(this)) > 0, "No tokens to release");
        
        uint256 investorsTokens = (MAX_SUPPLY * INVESTORS_RATIO) / 100;
        require(investorsTokens <= balanceOf(address(this)), "Insufficient tokens in contract");
        
        _transfer(address(this), investorsFundAddress, investorsTokens);
        
        emit TokensReleased(investorsFundAddress, investorsTokens);
    }
    
    /**
     * @dev Changes the ecosystem fund address (only callable by owner)
     * @param newAddress The new ecosystem fund address
     */
    function changeEcosystemFundAddress(address newAddress) external onlyOwner {
        require(newAddress != address(0), "New address cannot be zero");
        address oldAddress = ecosystemFundAddress;
        ecosystemFundAddress = newAddress;
        emit AddressChanged("ecosystem", oldAddress, newAddress);
    }
    
    /**
     * @dev Changes the team fund address (only callable by owner)
     * @param newAddress The new team fund address
     */
    function changeTeamFundAddress(address newAddress) external onlyOwner {
        require(newAddress != address(0), "New address cannot be zero");
        address oldAddress = teamFundAddress;
        teamFundAddress = newAddress;
        emit AddressChanged("team", oldAddress, newAddress);
    }
    
    /**
     * @dev Changes the investors fund address (only callable by owner)
     * @param newAddress The new investors fund address
     */
    function changeInvestorsFundAddress(address newAddress) external onlyOwner {
        require(newAddress != address(0), "New address cannot be zero");
        address oldAddress = investorsFundAddress;
        investorsFundAddress = newAddress;
        emit AddressChanged("investors", oldAddress, newAddress);
    }
    
    /**
     * @dev Changes the reserve fund address (only callable by owner)
     * @param newAddress The new reserve fund address
     */
    function changeReserveFundAddress(address newAddress) external onlyOwner {
        require(newAddress != address(0), "New address cannot be zero");
        address oldAddress = reserveFundAddress;
        reserveFundAddress = newAddress;
        emit AddressChanged("reserve", oldAddress, newAddress);
    }
    
    /**
     * @dev Override of the _beforeTokenTransfer function to add pausing functionality
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override whenNotPaused {
        super._beforeTokenTransfer(from, to, amount);
    }
}
