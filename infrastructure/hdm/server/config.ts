/**
 * Application Configuration
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  // Server configuration
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  SESSION_SECRET: process.env.SESSION_SECRET || 'dev-session-secret',
  
  // Database configuration
  DATABASE_URL: process.env.DATABASE_URL || '',
  
  // Web3 configuration
  WEB3_PROVIDER_URL: process.env.WEB3_PROVIDER_URL || 'http://localhost:8545',
  TOKEN_CONTRACT_ADDRESS: process.env.TOKEN_CONTRACT_ADDRESS || '',
  HYPERCROWD_CONTRACT_ADDRESS: process.env.HYPERCROWD_CONTRACT_ADDRESS || '',
  ADMIN_PRIVATE_KEY: process.env.ADMIN_PRIVATE_KEY || '',
  
  // Blockchain network configuration
  CHAIN_ID: parseInt(process.env.CHAIN_ID || '80001', 10), // Mumbai testnet by default
  
  // Reward system configuration
  REFERRAL_POINTS: 25,
  ACTIVITY_POINTS: 5,
  CONTRIBUTION_POINTS: 50,
  
  // Authentication
  AUTH_TOKEN_EXPIRY: '24h',
  REFRESH_TOKEN_EXPIRY: '7d',
  PASSWORD_RESET_EXPIRY: 3600000, // 1 hour in milliseconds
  
  // Email service configuration
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@hyperdag.io',
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  
  // Feature flags
  ENABLE_WEB3_AUTH: process.env.ENABLE_WEB3_AUTH === 'true' || false,
  ENABLE_TOKEN_REWARDS: process.env.ENABLE_TOKEN_REWARDS === 'true' || false,
  ENABLE_GRANT_MATCHING: process.env.ENABLE_GRANT_MATCHING === 'true' || false,
  
  // External services
  PERPLEXITY_API_KEY: process.env.PERPLEXITY_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  MORALIS_API_KEY: process.env.MORALIS_API_KEY || '',
  
  // Telegram bot
  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',
  
  // Rate limiting
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 100, // Max requests per window
  
  // ZKP system
  ZKP_ENABLED: process.env.ZKP_ENABLED === 'true' || false,
  ZKP_PROVING_KEY_PATH: process.env.ZKP_PROVING_KEY_PATH || './zkp/reputation_proving_key.json',
  ZKP_VERIFICATION_KEY_PATH: process.env.ZKP_VERIFICATION_KEY_PATH || './zkp/reputation_verification_key.json',
  
  // Bacalhau distributed computing
  BACALHAU_API_ENDPOINT: process.env.BACALHAU_API_ENDPOINT || 'https://api.bacalhau.org/api/v1',
  
  // Caching
  CACHE_TTL: 300, // 5 minutes in seconds
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  
  // Frontend URL (for CORS and email links)
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000'
};