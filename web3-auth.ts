import { Express, Request, Response } from "express";
import { randomBytes } from "crypto";
import { verifyMessage } from "ethers";
import { storage } from "./storage";

// Generate a random nonce for Web3 authentication
function generateNonce(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Sets up Web3 authentication routes
 */
export function setupWeb3Auth(app: Express): void {
  /**
   * Step 1: Request a nonce for authentication
   * Each nonce is stored in the user's session and tied to their wallet address
   */
  app.get("/api/web3/nonce", (req: Request, res: Response) => {
    if (!req.session) {
      return res.status(500).json({ message: "Session unavailable" });
    }

    const { address } = req.query;
    
    if (!address || typeof address !== "string" || !address.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({ message: "Invalid wallet address" });
    }
    
    try {
      // Generate a new nonce for this authentication attempt
      const nonce = generateNonce();
      
      // Store nonce in session, associated with this address
      req.session.nonce = nonce;
      
      res.json({ nonce });
    } catch (error) {
      console.error("Error generating nonce:", error);
      res.status(500).json({ message: "Failed to generate authentication nonce" });
    }
  });
  
  /**
   * Step 2: Verify the signed message and authenticate user
   * User signs a message containing the nonce with their wallet
   * We verify the signature and log them in or create a new account
   */
  app.post("/api/web3/verify", async (req: Request, res: Response) => {
    if (!req.session || !req.session.nonce) {
      return res.status(400).json({ 
        success: false, 
        message: "Authentication session expired, please request a new nonce" 
      });
    }
    
    const { address, signature, message } = req.body;
    
    if (!address || !signature || !message) {
      return res.status(400).json({ 
        success: false, 
        message: "Missing required parameters" 
      });
    }
    
    try {
      // Verify that the message contains the correct nonce
      if (!message.includes(req.session.nonce)) {
        return res.status(400).json({
          success: false,
          message: "Invalid authentication message"
        });
      }
      
      // Verify the signature
      const recoveredAddress = verifyMessage(message, signature);
      
      // Check if the recovered address matches the claimed address
      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        return res.status(400).json({
          success: false,
          message: "Signature verification failed"
        });
      }
      
      // Get user by wallet address
      let user = await storage.getUserByWalletAddress(address);
      
      if (user) {
        // If user exists, log them in
        req.login(user, (err) => {
          if (err) {
            console.error("Error logging in user:", err);
            return res.status(500).json({
              success: false,
              message: "Authentication error"
            });
          }
          
          // Clear the nonce to prevent replay attacks
          req.session.nonce = null;
          
          // Return success response with user info
          return res.json({
            success: true,
            user: {
              id: user.id,
              username: user.username,
              walletAddress: user.walletAddress,
              tokens: user.tokens,
              points: user.points
            }
          });
        });
      } else {
        // If user doesn't exist, look for orphaned wallet address in existing users
        const existingUserWithoutWallet = await storage.getUserWithoutWalletAddress();
        
        if (existingUserWithoutWallet) {
          // Link wallet to existing user
          user = await storage.linkWalletToUser(existingUserWithoutWallet.id, address);
          
          req.login(user, (err) => {
            if (err) {
              console.error("Error logging in user:", err);
              return res.status(500).json({
                success: false,
                message: "Authentication error"
              });
            }
            
            // Clear the nonce to prevent replay attacks
            req.session.nonce = null;
            
            return res.json({
              success: true,
              user: {
                id: user.id,
                username: user.username,
                walletAddress: user.walletAddress,
                tokens: user.tokens,
                points: user.points
              },
              message: "Wallet linked to your account"
            });
          });
        } else {
          // Create new user with wallet address
          // Generate a username based on wallet address
          const username = `user_${address.substring(2, 8)}`;
          
          // Create user with wallet address
          const newUser = await storage.createUser({
            username,
            password: generateNonce(), // Generate a strong random password
            walletAddress: address,
            referralCode: randomBytes(8).toString("hex"),
            referredBy: null
          });
          
          req.login(newUser, (err) => {
            if (err) {
              console.error("Error logging in new user:", err);
              return res.status(500).json({
                success: false,
                message: "Authentication error"
              });
            }
            
            // Clear the nonce to prevent replay attacks
            req.session.nonce = null;
            
            return res.json({
              success: true,
              user: {
                id: newUser.id,
                username: newUser.username,
                walletAddress: newUser.walletAddress,
                tokens: newUser.tokens,
                points: newUser.points
              },
              message: "New account created with your wallet"
            });
          });
        }
      }
    } catch (error) {
      console.error("Web3 authentication error:", error);
      res.status(500).json({
        success: false,
        message: "Authentication failed"
      });
    }
  });
}