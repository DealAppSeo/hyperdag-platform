import { ethers } from 'ethers';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Deploy RepIDNFT contract to Polygon Cardona zkEVM testnet
 * Chain ID: 2442
 * RPC: https://polygon-cardona-zkevm.g.alchemy.com/v2/{API_KEY}
 */

const POLYGON_CARDONA_CHAIN_ID = 2442;

interface DeploymentResult {
  contractAddress: string;
  transactionHash: string;
  deployerAddress: string;
  chainId: number;
  timestamp: number;
}

async function deployRepIDNFT(): Promise<DeploymentResult> {
  const alchemyApiKey = process.env.ALCHEMY_API_KEY;
  
  if (!alchemyApiKey) {
    throw new Error('ALCHEMY_API_KEY not found in environment');
  }

  const rpcUrl = `https://polygon-cardona-zkevm.g.alchemy.com/v2/${alchemyApiKey}`;
  
  console.log('🔗 Connecting to Polygon Cardona zkEVM testnet...');
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  
  const network = await provider.getNetwork();
  console.log(`📡 Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
  
  if (Number(network.chainId) !== POLYGON_CARDONA_CHAIN_ID) {
    console.warn(`⚠️  Warning: Expected Chain ID ${POLYGON_CARDONA_CHAIN_ID}, got ${network.chainId}`);
  }

  const privateKey = process.env.DEPLOYER_PRIVATE_KEY || 
    ethers.Wallet.createRandom().privateKey;
  
  if (!process.env.DEPLOYER_PRIVATE_KEY) {
    console.warn('⚠️  No DEPLOYER_PRIVATE_KEY found, using temporary wallet');
    console.warn('⚠️  For production, set DEPLOYER_PRIVATE_KEY environment variable');
  }

  const wallet = new ethers.Wallet(privateKey, provider);
  console.log(`👛 Deployer address: ${wallet.address}`);

  const balance = await provider.getBalance(wallet.address);
  console.log(`💰 Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    console.warn('⚠️  Wallet has 0 balance. You need testnet ETH to deploy.');
    console.warn(`   Get testnet ETH for ${wallet.address} from Polygon Cardona faucet`);
    throw new Error('Insufficient funds for deployment');
  }

  const contractPath = path.join(__dirname, 'RepIDNFT.sol');
  const contractSource = fs.readFileSync(contractPath, 'utf8');

  console.log('📝 Reading contract source...');

  const abiPath = path.join(__dirname, 'RepIDNFT.abi.json');
  const bytecodePath = path.join(__dirname, 'RepIDNFT.bytecode.txt');

  if (!fs.existsSync(abiPath) || !fs.existsSync(bytecodePath)) {
    throw new Error(
      'Contract ABI and bytecode not found. Please compile the contract first using:\n' +
      'npx hardhat compile\n' +
      'or use solc compiler to generate ABI and bytecode'
    );
  }

  const abi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
  const bytecode = fs.readFileSync(bytecodePath, 'utf8').trim();

  console.log('🚀 Deploying RepIDNFT contract...');

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy();
  
  console.log(`📤 Transaction hash: ${contract.deploymentTransaction()?.hash}`);
  console.log('⏳ Waiting for deployment confirmation...');

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log(`✅ RepIDNFT deployed successfully!`);
  console.log(`📍 Contract address: ${contractAddress}`);

  const result: DeploymentResult = {
    contractAddress,
    transactionHash: contract.deploymentTransaction()?.hash || '',
    deployerAddress: wallet.address,
    chainId: Number(network.chainId),
    timestamp: Date.now()
  };

  const deploymentInfoPath = path.join(__dirname, 'deployment-info.json');
  fs.writeFileSync(deploymentInfoPath, JSON.stringify(result, null, 2));
  console.log(`💾 Deployment info saved to ${deploymentInfoPath}`);

  return result;
}

if (require.main === module) {
  deployRepIDNFT()
    .then((result) => {
      console.log('\n🎉 Deployment completed successfully!');
      console.log(JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Deployment failed:', error);
      process.exit(1);
    });
}

export { deployRepIDNFT, DeploymentResult };
