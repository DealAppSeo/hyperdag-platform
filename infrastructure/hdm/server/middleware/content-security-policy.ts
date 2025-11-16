import { NextFunction, Request, Response } from "express";

/**
 * Enhanced Content Security Policy configuration
 * Provides helmet-compatible configuration for Content Security Policy
 */
export const cspConfig = {
  directives: {
    defaultSrc: ["'self'", "*.replit.dev", "*.replit.com", "*.replit.app"],
    scriptSrc: [
      "'self'", 
      "'unsafe-inline'",
      "'unsafe-eval'",
      "https://cdn.jsdelivr.net",
      "*.replit.dev",
      "*.replit.com", 
      "*.replit.app"
    ],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "*.replit.dev"],
    imgSrc: [
      "'self'", 
      "data:", 
      "blob:", 
      "https:",
      "*.replit.dev",
      "*.replit.com",
      "*.replit.app"
    ],
    fontSrc: ["'self'", "https://fonts.gstatic.com", "data:", "*.replit.dev"],
    connectSrc: [
      "'self'",
      "ws:",
      "wss:",
      "*.replit.dev",
      "*.replit.com", 
      "*.replit.app",
      "https://api.openai.com",
      "https://api.x.ai", 
      "https://api.perplexity.ai",
      "https://*.polygon.technology",
      "https://*.solana.com",
      "https://*.iota.org",
      "https://api.moralis.io",
      "https://api.hyperdag.org",
      "wss://relay.walletconnect.com",
      "ws://localhost:*"
    ],
    frameSrc: ["'self'", "https://verify.walletconnect.org"],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    frameAncestors: ["'none'"],
    formAction: ["'self'"]
  }
};

export default function contentSecurityPolicy(req: Request, res: Response, next: NextFunction) {
  try {
    next();
  } catch (error) {
    console.error("CSP error:", error);
    next();
  }
}