require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // Enable IR for gas optimization
    },
  },
  networks: {
    // Cardona zkEVM Testnet (ZKP-optimized, recommended)
    cardona: {
      url: "https://rpc.cardona.zkevm-rpc.com/",
      accounts: process.env.BLOCKCHAIN_PRIVATE_KEY ? [process.env.BLOCKCHAIN_PRIVATE_KEY] : [],
      chainId: 2442,
      gasPrice: "auto",
      verify: {
        etherscan: {
          apiUrl: "https://api-cardona-zkevm.polygonscan.com/",
          apiKey: process.env.POLYGONSCAN_API_KEY || ""
        }
      }
    },
    // Polygon Amoy Testnet (general PoS)
    amoy: {
      url: "https://rpc-amoy.polygon.technology/",
      accounts: process.env.BLOCKCHAIN_PRIVATE_KEY ? [process.env.BLOCKCHAIN_PRIVATE_KEY] : [],
      chainId: 80002,
      gasPrice: "auto",
      verify: {
        etherscan: {
          apiUrl: "https://api-amoy.polygonscan.com/",
          apiKey: process.env.POLYGONSCAN_API_KEY || ""
        }
      }
    },
    // Polygon Mainnet (production)
    polygon: {
      url: "https://polygon-rpc.com/",
      accounts: process.env.BLOCKCHAIN_PRIVATE_KEY ? [process.env.BLOCKCHAIN_PRIVATE_KEY] : [],
      chainId: 137,
      gasPrice: "auto",
      verify: {
        etherscan: {
          apiUrl: "https://api.polygonscan.com/",
          apiKey: process.env.POLYGONSCAN_API_KEY || ""
        }
      }
    },
    // Local development
    hardhat: {
      chainId: 1337,
      mining: {
        auto: true,
        interval: 0
      }
    }
  },
  etherscan: {
    apiKey: {
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      cardona: process.env.POLYGONSCAN_API_KEY || "",
      amoy: process.env.POLYGONSCAN_API_KEY || ""
    },
    customChains: [
      {
        network: "cardona",
        chainId: 2442,
        urls: {
          apiURL: "https://api-cardona-zkevm.polygonscan.com/api",
          browserURL: "https://cardona-zkevm.polygonscan.com/"
        }
      },
      {
        network: "amoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com/"
        }
      }
    ]
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS ? true : false,
    currency: "USD",
    gasPrice: 30, // GWEI
    coinmarketcap: process.env.COINMARKETCAP_API_KEY
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
  },
  mocha: {
    timeout: 60000
  }
};