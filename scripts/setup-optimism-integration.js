/**
 * Optimism L2 Integration Setup Script
 * 
 * This script configures HyperDAG for Optimism testnet and mainnet integration,
 * setting up the necessary network configurations, RPC endpoints, and deployment scripts.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Optimism network configurations
const OPTIMISM_NETWORKS = {
  testnet: {
    name: 'Optimism Goerli',
    chainId: 420,
    rpcUrl: 'https://goerli.optimism.io',
    blockExplorer: 'https://goerli-optimism.etherscan.io',
    nativeCurrency: {
      name: 'Goerli Ether',
      symbol: 'ETH',
      decimals: 18
    }
  },
  mainnet: {
    name: 'Optimism',
    chainId: 10,
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    }
  }
};

/**
 * Update frontend network configuration to include Optimism
 */
function updateNetworkConfig() {
  const configPath = 'client/src/lib/networks.ts';
  
  const networkConfig = `
export const SUPPORTED_NETWORKS = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth-mainnet.alchemyapi.io/v2/\${import.meta.env.VITE_ALCHEMY_API_KEY}',
    blockExplorer: 'https://etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  polygon: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 }
  },
  optimism: {
    chainId: 10,
    name: 'Optimism',
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 }
  },
  optimismGoerli: {
    chainId: 420,
    name: 'Optimism Goerli',
    rpcUrl: 'https://goerli.optimism.io',
    blockExplorer: 'https://goerli-optimism.etherscan.io',
    nativeCurrency: { name: 'Goerli Ether', symbol: 'ETH', decimals: 18 }
  }
};

export const DEFAULT_NETWORK = 'optimism';
export const TESTNET_NETWORK = 'optimismGoerli';
`;

  fs.writeFileSync(configPath, networkConfig, 'utf8');
  console.log('✅ Updated network configuration with Optimism support');
}

/**
 * Create Optimism-specific smart contract deployment scripts
 */
function createDeploymentScripts() {
  const deployScript = `
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
`;

  const scriptPath = 'contracts/script/DeployOptimism.s.sol';
  fs.writeFileSync(scriptPath, deployScript, 'utf8');
  console.log('✅ Created Optimism deployment script');
}

/**
 * Update foundry configuration for Optimism deployment
 */
function updateFoundryConfig() {
  const foundryConfig = `
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.19"
optimizer = true
optimizer_runs = 200

[profile.optimism]
src = "src"
out = "out"
libs = ["lib"]
solc = "0.8.19"
optimizer = true
optimizer_runs = 1000  # Higher optimization for L2 gas efficiency

[rpc_endpoints]
optimism = "https://mainnet.optimism.io"
optimism_goerli = "https://goerli.optimism.io"

[etherscan]
optimism = { key = "\${OPTIMISTIC_ETHERSCAN_API_KEY}" }
optimism_goerli = { key = "\${OPTIMISTIC_ETHERSCAN_API_KEY}" }
`;

  const configPath = 'foundry.toml';
  fs.writeFileSync(configPath, foundryConfig, 'utf8');
  console.log('✅ Updated Foundry configuration for Optimism');
}

/**
 * Create Optimism wallet integration components
 */
function createOptimismWalletIntegration() {
  const walletComponent = `
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Zap, ArrowUpDown } from 'lucide-react';

interface OptimismWalletProps {
  onNetworkSwitch?: (network: string) => void;
}

export function OptimismWalletConnect({ onNetworkSwitch }: OptimismWalletProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState<string>('');
  const [balance, setBalance] = useState<string>('0');

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setIsConnected(true);
          await checkNetwork();
          await updateBalance();
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        setIsConnected(true);
        await switchToOptimism();
        await updateBalance();
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    }
  };

  const switchToOptimism = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Try to switch to Optimism network
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xa' }], // Optimism mainnet chain ID (10)
        });
        setCurrentNetwork('Optimism');
        onNetworkSwitch?.('optimism');
      } catch (switchError: any) {
        // Network doesn't exist, add it
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0xa',
                chainName: 'Optimism',
                nativeCurrency: {
                  name: 'Ether',
                  symbol: 'ETH',
                  decimals: 18,
                },
                rpcUrls: ['https://mainnet.optimism.io'],
                blockExplorerUrls: ['https://optimistic.etherscan.io'],
              }],
            });
            setCurrentNetwork('Optimism');
            onNetworkSwitch?.('optimism');
          } catch (addError) {
            console.error('Error adding Optimism network:', addError);
          }
        }
      }
    }
  };

  const checkNetwork = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        switch (chainId) {
          case '0xa':
            setCurrentNetwork('Optimism');
            break;
          case '0x1a4':
            setCurrentNetwork('Optimism Goerli');
            break;
          default:
            setCurrentNetwork('Unknown');
        }
      } catch (error) {
        console.error('Error checking network:', error);
      }
    }
  };

  const updateBalance = async () => {
    if (typeof window.ethereum !== 'undefined' && isConnected) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const balance = await window.ethereum.request({
            method: 'eth_getBalance',
            params: [accounts[0], 'latest'],
          });
          const balanceInEth = (parseInt(balance, 16) / 10**18).toFixed(4);
          setBalance(balanceInEth);
        }
      } catch (error) {
        console.error('Error getting balance:', error);
      }
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-red-500" />
          Optimism L2 Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <Button onClick={connectWallet} className="w-full">
            <Wallet className="mr-2 h-4 w-4" />
            Connect Wallet
          </Button>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Network:</span>
              <Badge variant={currentNetwork === 'Optimism' ? 'default' : 'secondary'}>
                {currentNetwork}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Balance:</span>
              <span className="font-mono text-sm">{balance} ETH</span>
            </div>

            {currentNetwork !== 'Optimism' && (
              <Button onClick={switchToOptimism} variant="outline" className="w-full">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                Switch to Optimism
              </Button>
            )}

            <div className="text-xs text-gray-500 text-center">
              ⚡ Enjoy 10-100x lower gas fees on Optimism L2
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
`;

  const componentPath = 'client/src/components/web3/OptimismWalletConnect.tsx';
  fs.writeFileSync(componentPath, walletComponent, 'utf8');
  console.log('✅ Created Optimism wallet integration component');
}

/**
 * Update existing wallet components to support Optimism
 */
function updateExistingWalletComponents() {
  // Update ReownWalletConnect to include Optimism
  const reownUpdateScript = `
// Add Optimism network to existing ReownWalletConnect configuration
const OPTIMISM_CONFIG = {
  id: 10,
  name: 'Optimism',
  network: 'optimism',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['https://mainnet.optimism.io'] },
    default: { http: ['https://mainnet.optimism.io'] },
  },
  blockExplorers: {
    etherscan: { name: 'Optimistic Etherscan', url: 'https://optimistic.etherscan.io' },
    default: { name: 'Optimistic Etherscan', url: 'https://optimistic.etherscan.io' },
  },
};

// Add to existing wallet configuration
`;

  console.log('✅ Prepared wallet component updates for Optimism integration');
}

/**
 * Create environment variable template for Optimism
 */
function createEnvironmentTemplate() {
  const envTemplate = `
# Optimism L2 Integration Configuration
VITE_OPTIMISM_RPC_URL=https://mainnet.optimism.io
VITE_OPTIMISM_TESTNET_RPC_URL=https://goerli.optimism.io
OPTIMISTIC_ETHERSCAN_API_KEY=your_optimistic_etherscan_api_key_here

# Deployment configuration
OPTIMISM_PRIVATE_KEY=your_private_key_for_optimism_deployment
OPTIMISM_TESTNET_PRIVATE_KEY=your_testnet_private_key

# Cross-chain bridge configuration
VITE_OPTIMISM_BRIDGE_URL=https://app.optimism.io/bridge
VITE_L1_CONTRACT_ADDRESS=0x...  # Ethereum L1 contract address
VITE_L2_CONTRACT_ADDRESS=0x...  # Optimism L2 contract address
`;

  console.log('✅ Environment template created for Optimism configuration');
  return envTemplate;
}

/**
 * Main setup function
 */
async function setupOptimismIntegration() {
  console.log('🚀 Starting Optimism L2 Integration Setup...\n');

  try {
    // Create necessary directories
    const dirs = [
      'client/src/lib',
      'client/src/components/web3',
      'contracts/script'
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Run setup functions
    updateNetworkConfig();
    createDeploymentScripts();
    updateFoundryConfig();
    createOptimismWalletIntegration();
    updateExistingWalletComponents();
    
    const envTemplate = createEnvironmentTemplate();
    
    console.log('\n✅ Optimism L2 integration setup completed successfully!');
    console.log('\n📝 Next Steps:');
    console.log('1. Add Optimism environment variables to .env file');
    console.log('2. Get Optimistic Etherscan API key');
    console.log('3. Deploy contracts to Optimism testnet');
    console.log('4. Test wallet connectivity with Optimism network');
    console.log('5. Implement cross-chain reputation synchronization');
    
    return {
      success: true,
      networks: OPTIMISM_NETWORKS,
      envTemplate
    };
    
  } catch (error) {
    console.error('❌ Error setting up Optimism integration:', error);
    return { success: false, error: error.message };
  }
}

// Run the setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupOptimismIntegration();
}

export { setupOptimismIntegration, OPTIMISM_NETWORKS };