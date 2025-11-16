const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting ZKP RepID NFT deployment to Cardona zkEVM testnet...");
  
  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "MATIC");
  
  if (balance < hre.ethers.parseEther("0.1")) {
    console.warn("⚠️  Low balance! Get testnet MATIC from https://faucet.polygon.technology/");
  }
  
  try {
    // Deploy ZKPVerifier first
    console.log("\n📋 1. Deploying ZKPVerifier...");
    const ZKPVerifier = await hre.ethers.getContractFactory("ZKPVerifier");
    const zkpVerifier = await ZKPVerifier.deploy();
    await zkpVerifier.waitForDeployment();
    const zkpVerifierAddress = await zkpVerifier.getAddress();
    console.log("✅ ZKPVerifier deployed to:", zkpVerifierAddress);
    
    // Deploy RepIDNFT
    console.log("\n📋 2. Deploying RepIDNFT...");
    const RepIDNFT = await hre.ethers.getContractFactory("RepIDNFT");
    const repIDNFT = await RepIDNFT.deploy();
    await repIDNFT.waitForDeployment();
    const repIDNFTAddress = await repIDNFT.getAddress();
    console.log("✅ RepIDNFT deployed to:", repIDNFTAddress);
    
    // Deploy RepIDManager (upgradeable proxy)
    console.log("\n📋 3. Deploying RepIDManager...");
    const RepIDManager = await hre.ethers.getContractFactory("RepIDManager");
    const repIDManager = await hre.upgrades.deployProxy(
      RepIDManager,
      [repIDNFTAddress, zkpVerifierAddress, deployer.address], // ANFIS oracle = deployer for now
      { initializer: 'initialize' }
    );
    await repIDManager.waitForDeployment();
    const repIDManagerAddress = await repIDManager.getAddress();
    console.log("✅ RepIDManager deployed to:", repIDManagerAddress);
    
    // Deploy BiometricSBTUpgrade
    console.log("\n📋 4. Deploying BiometricSBTUpgrade...");
    const BiometricSBTUpgrade = await hre.ethers.getContractFactory("BiometricSBTUpgrade");
    const biometricUpgrade = await BiometricSBTUpgrade.deploy(repIDNFTAddress, zkpVerifierAddress);
    await biometricUpgrade.waitForDeployment();
    const biometricUpgradeAddress = await biometricUpgrade.getAddress();
    console.log("✅ BiometricSBTUpgrade deployed to:", biometricUpgradeAddress);
    
    // Configure roles and permissions
    console.log("\n🔐 5. Configuring roles and permissions...");
    
    // Grant ANFIS oracle role to RepIDManager
    await repIDNFT.grantRole(await repIDNFT.ANFIS_ORACLE_ROLE(), repIDManagerAddress);
    console.log("✅ Granted ANFIS oracle role to RepIDManager");
    
    // Grant ZKP verifier role
    await zkpVerifier.grantRole(await zkpVerifier.VERIFIER_ROLE(), biometricUpgradeAddress);
    console.log("✅ Granted verifier role to BiometricSBTUpgrade");
    
    // Verify deployments
    console.log("\n🔍 6. Verifying deployments...");
    
    // Test RepIDNFT
    const name = await repIDNFT.name();
    const symbol = await repIDNFT.symbol();
    console.log(`✅ RepIDNFT: ${name} (${symbol})`);
    
    // Test ZKPVerifier
    const proofTypes = await zkpVerifier.getSupportedProofTypes();
    console.log(`✅ ZKPVerifier: ${proofTypes.length} proof types supported`);
    
    // Test RepIDManager
    const scoringConfig = await repIDManager.scoringConfig();
    console.log(`✅ RepIDManager: Base decay rate ${scoringConfig.baseDecayRate}bp`);
    
    // Output environment variables for backend integration
    console.log("\n🌍 Environment variables for backend (.env file):");
    console.log("# Cardona zkEVM Testnet Contract Addresses");
    console.log(`REPID_NFT_CONTRACT_ADDRESS=${repIDNFTAddress}`);
    console.log(`ZKP_VERIFIER_CONTRACT_ADDRESS=${zkpVerifierAddress}`);
    console.log(`REPID_MANAGER_CONTRACT_ADDRESS=${repIDManagerAddress}`);
    console.log(`BIOMETRIC_SBT_CONTRACT_ADDRESS=${biometricUpgradeAddress}`);
    console.log(`BLOCKCHAIN_NETWORK=cardona`);
    console.log(`BLOCKCHAIN_CHAIN_ID=2442`);
    
    // Output verification commands
    console.log("\n🔍 Contract verification commands:");
    console.log(`npx hardhat verify --network cardona ${zkpVerifierAddress}`);
    console.log(`npx hardhat verify --network cardona ${repIDNFTAddress}`);
    console.log(`npx hardhat verify --network cardona ${repIDManagerAddress} ${repIDNFTAddress} ${zkpVerifierAddress} ${deployer.address}`);
    console.log(`npx hardhat verify --network cardona ${biometricUpgradeAddress} ${repIDNFTAddress} ${zkpVerifierAddress}`);
    
    console.log("\n🎉 ZKP RepID NFT deployment completed successfully!");
    console.log("📋 Next steps:");
    console.log("1. Add the environment variables to your .env file");
    console.log("2. Verify contracts on Polygonscan");
    console.log("3. Test the API endpoints");
    console.log("4. Get testnet MATIC from https://faucet.polygon.technology/");
    
    return {
      zkpVerifier: zkpVerifierAddress,
      repIDNFT: repIDNFTAddress,
      repIDManager: repIDManagerAddress,
      biometricUpgrade: biometricUpgradeAddress
    };
    
  } catch (error) {
    console.error("\n❌ Deployment failed:", error);
    process.exitCode = 1;
  }
}

// Execute deployment
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});