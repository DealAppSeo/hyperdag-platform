
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/HyperDAGToken.sol";
import "../src/HyperCrowd.sol";

contract DeployOptimism is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Deploy HyperDAG Token on Optimism
        HyperDAGToken token = new HyperDAGToken(
            "HyperDAG Token",
            "HDAG",
            1000000 * 10**18 // 1M initial supply
        );

        // Deploy HyperCrowd crowdfunding contract
        HyperCrowd crowdfund = new HyperCrowd(
            address(token),
            1000 * 10**18 // 1000 HDAG minimum stake
        );

        console.log("HyperDAG Token deployed to:", address(token));
        console.log("HyperCrowd deployed to:", address(crowdfund));

        vm.stopBroadcast();
    }
}
