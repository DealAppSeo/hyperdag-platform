/**
 * Chain Configuration for supported networks
 */

export const chainConfig = {
  // Polygon zkEVM Cardona Testnet
  'polygon-zkevm-cardona': {
    name: 'Polygon zkEVM Cardona Testnet',
    chainId: 2442,
    rpcUrl: 'https://rpc.cardona.zkevm-test.net',
    explorerUrl: 'https://cardona-zkevm.polygonscan.com',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    gasOptions: {
      low: 30,
      medium: 40,
      high: 60
    }
  },
  
  // Solana Testnet
  'solana-testnet': {
    name: 'Solana Testnet',
    rpcUrl: 'https://api.testnet.solana.com',
    explorerUrl: 'https://explorer.solana.com/?cluster=testnet',
    nativeCurrency: {
      name: 'Solana',
      symbol: 'SOL',
      decimals: 9
    }
  },
  
  // Polygon Mumbai Testnet
  'polygon-mumbai': {
    name: 'Polygon Mumbai Testnet',
    chainId: 80001,
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    explorerUrl: 'https://mumbai.polygonscan.com',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18
    },
    gasOptions: {
      low: 30,
      medium: 40,
      high: 60
    }
  },
  
  // Ethereum Goerli Testnet
  'ethereum-goerli': {
    name: 'Ethereum Goerli Testnet',
    chainId: 5,
    rpcUrl: 'https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
    explorerUrl: 'https://goerli.etherscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    },
    gasOptions: {
      low: 10,
      medium: 20,
      high: 30
    }
  }
};

export type ChainId = keyof typeof chainConfig;