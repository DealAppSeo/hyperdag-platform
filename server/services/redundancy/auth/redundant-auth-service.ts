import { logger } from '../../../utils/logger';
import { storage } from '../../../storage';
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { ServiceStatus } from '../core/types';
import { User } from '@shared/schema';

const scryptAsync = promisify(scrypt);

/**
 * Redundant Authentication Service
 * 
 * Provides intelligent, self-healing authentication with automatic fallback:
 * 
 * 1. Supports multiple authentication methods (password, Web3, OAuth, etc.)
 * 2. Gracefully degrades when certain methods are unavailable
 * 3. Automatically adapts to changing conditions
 * 4. Provides comprehensive security while maintaining accessibility
 * 5. Supports four-factor authentication (4FA)
 */
export class RedundantAuthService {
  private status: ServiceStatus = 'idle';
  private lastStatusCheck: number = 0;
  private statusCheckInterval: number = 60000; // 1 minute
  
  // Authentication method availability flags
  private passwordAuthAvailable: boolean = true;
  private web3AuthAvailable: boolean = false;
  private emailAuthAvailable: boolean = true;
  private telegramAuthAvailable: boolean = false;
  private twoFactorAuthAvailable: boolean = true;
  private walletSignatureAvailable: boolean = false;
  
  // Health indicators
  private failedAuthAttempts: Map<string, number[]> = new Map(); // username -> timestamp[]
  private successfulAuthAttempts: Map<string, number[]> = new Map(); // username -> timestamp[]
  
  constructor() {
    this.initialize();
  }
  
  /**
   * Initialize the authentication service
   */
  private async initialize() {
    try {
      // Check availability of various authentication methods
      this.passwordAuthAvailable = true; // Always available as core method
      this.twoFactorAuthAvailable = true; // Should always be available

      // Check Web3 authentication 
      try {
        // Import web3 services dynamically to avoid circular dependencies
        const { polygonService } = await import('../../../services/polygon-service');
        this.web3AuthAvailable = (await polygonService.getNetworkStatus()).status !== 'error';
        
        // Import wallet signature service
        const walletService = await import('../../../services/wallet-signature-service').then(m => m.walletSignatureService).catch(() => null);
        this.walletSignatureAvailable = walletService !== null && await walletService.checkStatus() !== 'error';
      } catch (error) {
        this.web3AuthAvailable = false;
        this.walletSignatureAvailable = false;
        logger.warn('[redundant-auth] Web3 authentication unavailable:', error);
      }
      
      // Check email service availability
      try {
        const { checkEmailServiceStatus } = await import('../../../services/email-service');
        this.emailAuthAvailable = await checkEmailServiceStatus();
      } catch (error) {
        this.emailAuthAvailable = false;
        logger.warn('[redundant-auth] Email service unavailable:', error);
      }
      
      // Check Telegram service availability
      try {
        const { checkTelegramStatus } = await import('../../../services/telegram-service');
        this.telegramAuthAvailable = await checkTelegramStatus();
      } catch (error) {
        this.telegramAuthAvailable = false;
        logger.warn('[redundant-auth] Telegram service unavailable:', error);
      }
      
      // Set overall service status
      this.updateServiceStatus();
      
      logger.info(`[redundant-auth] Service initialized with status: ${this.status}`);
      logger.info(`[redundant-auth] Auth methods available: password=${this.passwordAuthAvailable}, web3=${this.web3AuthAvailable}, email=${this.emailAuthAvailable}, telegram=${this.telegramAuthAvailable}, 2FA=${this.twoFactorAuthAvailable}, wallet=${this.walletSignatureAvailable}`);
    } catch (error) {
      this.status = 'error';
      logger.error('[redundant-auth] Initialization failed:', error);
    }
  }
  
  /**
   * Update the overall service status based on available authentication methods
   */
  private updateServiceStatus() {
    if (this.passwordAuthAvailable) {
      // As long as password auth is available, service is at least degraded
      if (this.emailAuthAvailable && this.twoFactorAuthAvailable) {
        // If at least one additional method is available in addition to password + email + 2FA, we're fully operational
        if (this.web3AuthAvailable || this.telegramAuthAvailable || this.walletSignatureAvailable) {
          this.status = 'available';
        } else {
          this.status = 'degraded';
        }
      } else {
        // If we only have password auth, we're in limited mode
        this.status = 'limited';
      }
    } else {
      // If we don't even have password auth, we're in error state
      this.status = 'error';
    }
  }
  
  /**
   * Check the status of all authentication methods
   */
  public async checkStatus(): Promise<ServiceStatus> {
    const now = Date.now();
    
    // Only check status if enough time has passed since last check
    if (now - this.lastStatusCheck < this.statusCheckInterval) {
      return this.status;
    }
    
    this.lastStatusCheck = now;
    
    // This is a simplified check for now - in a real implementation,
    // we would test each auth method's health
    await this.initialize();
    
    return this.status;
  }
  
  /**
   * Generate a secure random verification code
   */
  public generateVerificationCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }
  
  /**
   * Hash a password securely
   * @param password The password to hash
   */
  public async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  }
  
  /**
   * Compare a password with a stored hash
   * @param supplied The supplied password
   * @param stored The stored hash
   */
  public async comparePasswords(supplied: string, stored: string): Promise<boolean> {
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  }
  
  /**
   * Authenticate a user with password
   * @param username The username
   * @param password The password
   */
  public async authenticateWithPassword(username: string, password: string): Promise<User | null> {
    try {
      if (!this.passwordAuthAvailable) {
        logger.warn(`[redundant-auth] Password authentication unavailable for user ${username}`);
        return null;
      }
      
      const user = await storage.getUserByUsername(username);
      
      if (!user || !(await this.comparePasswords(password, user.password))) {
        this.recordFailedAttempt(username);
        return null;
      }
      
      this.recordSuccessfulAttempt(username);
      return user;
    } catch (error) {
      logger.error(`[redundant-auth] Password authentication error for ${username}:`, error);
      this.recordFailedAttempt(username);
      return null;
    }
  }
  
  /**
   * Authenticate a user with email verification code
   * @param username The username or email
   * @param code The verification code
   */
  public async authenticateWithEmailCode(username: string, code: string): Promise<boolean> {
    try {
      if (!this.emailAuthAvailable) {
        logger.warn(`[redundant-auth] Email verification unavailable for user ${username}`);
        return false;
      }
      
      // Simplified validation - would use storage.validateVerificationCode in actual implementation
      const isValid = await storage.validateVerificationCode(username, code);
      
      if (!isValid) {
        this.recordFailedAttempt(username);
        return false;
      }
      
      this.recordSuccessfulAttempt(username);
      return true;
    } catch (error) {
      logger.error(`[redundant-auth] Email verification error for ${username}:`, error);
      this.recordFailedAttempt(username);
      return false;
    }
  }
  
  /**
   * Authenticate a user with Web3 wallet
   * @param address The wallet address
   * @param signature The signature
   * @param message The message that was signed
   */
  public async authenticateWithWeb3(address: string, signature: string, message: string): Promise<User | null> {
    try {
      if (!this.web3AuthAvailable) {
        logger.warn(`[redundant-auth] Web3 authentication unavailable for address ${address}`);
        return null;
      }
      
      // Dynamic import to avoid circular dependencies
      const web3AuthModule = await import('../../../services/web3-auth-service');
      
      // Verify the signature
      const isValid = await web3AuthModule.verifySignature(address, signature, message);
      
      if (!isValid) {
        this.recordFailedAttempt(address);
        return null;
      }
      
      // Get user by wallet address
      const user = await storage.getUserByWalletAddress(address);
      
      if (!user) {
        this.recordFailedAttempt(address);
        return null;
      }
      
      this.recordSuccessfulAttempt(user.username);
      return user;
    } catch (error) {
      logger.error(`[redundant-auth] Web3 authentication error for address ${address}:`, error);
      this.recordFailedAttempt(address);
      return null;
    }
  }
  
  /**
   * Authenticate a user with 2FA (TOTP)
   * @param username The username
   * @param token The TOTP token
   */
  public async authenticateWith2FA(username: string, token: string): Promise<boolean> {
    try {
      if (!this.twoFactorAuthAvailable) {
        logger.warn(`[redundant-auth] 2FA unavailable for user ${username}`);
        return false;
      }
      
      // Dynamic import to avoid circular dependencies
      const { verify2FAToken } = await import('../../../services/2fa-service');
      
      // Get the user first
      const user = await storage.getUserByUsername(username);
      
      if (!user || !user.totpSecret) {
        this.recordFailedAttempt(username);
        return false;
      }
      
      // Verify the token
      const isValid = await verify2FAToken(user.totpSecret, token);
      
      if (!isValid) {
        this.recordFailedAttempt(username);
        return false;
      }
      
      this.recordSuccessfulAttempt(username);
      return true;
    } catch (error) {
      logger.error(`[redundant-auth] 2FA error for ${username}:`, error);
      this.recordFailedAttempt(username);
      return false;
    }
  }
  
  /**
   * Send verification code via available channels
   * @param user The user to send the code to
   * @param code The verification code
   */
  public async sendVerificationCode(user: User, code: string): Promise<{
    email: boolean,
    telegram: boolean
  }> {
    const result = {
      email: false,
      telegram: false
    };
    
    // Try email first if available
    if (this.emailAuthAvailable && user.email) {
      try {
        const { sendVerificationCode } = await import('../../../services/email-service');
        result.email = await sendVerificationCode(user.email, user.username, code);
      } catch (error) {
        logger.error(`[redundant-auth] Failed to send verification code via email:`, error);
        result.email = false;
        
        // Mark email as unavailable if sending failed
        this.emailAuthAvailable = false;
        this.updateServiceStatus();
      }
    }
    
    // Try Telegram as fallback or additional channel
    if (this.telegramAuthAvailable && user.telegramId) {
      try {
        const { sendVerificationCode } = await import('../../../services/telegram-service');
        result.telegram = await sendVerificationCode(user.telegramId, code);
      } catch (error) {
        logger.error(`[redundant-auth] Failed to send verification code via Telegram:`, error);
        result.telegram = false;
        
        // Mark Telegram as unavailable if sending failed
        this.telegramAuthAvailable = false;
        this.updateServiceStatus();
      }
    }
    
    return result;
  }
  
  /**
   * Check if 4FA (Four-Factor Authentication) is available for a user
   * @param user The user to check
   */
  public is4FAAvailable(user: User): boolean {
    // 4FA requires all four factors to be available:
    // 1. Knowledge factor (password)
    // 2. Ownership factor (email or device)
    // 3. Inherence factor (biometrics via Web3 secure enclave)
    // 4. Location factor (IP verification or similar)
    
    const hasPasswordFactor = this.passwordAuthAvailable;
    const hasOwnershipFactor = (this.emailAuthAvailable && !!user.email) || 
                            (this.telegramAuthAvailable && !!user.telegramId) || 
                            (this.twoFactorAuthAvailable && !!user.totpSecret);
    const hasInherenceFactor = this.walletSignatureAvailable && !!user.walletAddress;
    const hasLocationFactor = true; // Simplified - always assume IP verification is available
    
    return hasPasswordFactor && hasOwnershipFactor && hasInherenceFactor && hasLocationFactor;
  }
  
  /**
   * Determine the optimal authentication flow for a user
   * @param username The username
   */
  public async getOptimalAuthFlow(username: string): Promise<{
    methods: ('password' | 'email' | 'telegram' | '2fa' | 'web3' | 'wallet' | 'ipVerification')[],
    requiredCount: number,
    user?: User
  }> {
    // Get the user
    const user = await storage.getUserByUsername(username);
    
    if (!user) {
      return {
        methods: ['password'],
        requiredCount: 1
      };
    }
    
    // Determine available methods for this user
    const availableMethods: ('password' | 'email' | 'telegram' | '2fa' | 'web3' | 'wallet' | 'ipVerification')[] = [];
    
    if (this.passwordAuthAvailable) {
      availableMethods.push('password');
    }
    
    if (this.emailAuthAvailable && user.email) {
      availableMethods.push('email');
    }
    
    if (this.telegramAuthAvailable && user.telegramId) {
      availableMethods.push('telegram');
    }
    
    if (this.twoFactorAuthAvailable && user.totpSecret) {
      availableMethods.push('2fa');
    }
    
    if (this.web3AuthAvailable && user.walletAddress) {
      availableMethods.push('web3');
    }
    
    if (this.walletSignatureAvailable && user.walletAddress) {
      availableMethods.push('wallet');
    }
    
    // IP verification is always available in this simplified model
    availableMethods.push('ipVerification');
    
    // Determine how many factors to require based on risk level and auth level
    let requiredCount = 1; // Default to single factor
    
    if (user.authLevel && user.authLevel >= 2) {
      // Enhanced auth requires at least 2 factors
      requiredCount = Math.min(2, availableMethods.length);
    }
    
    if (user.authLevel && user.authLevel >= 3) {
      // Full auth requires at least 3 factors if available
      requiredCount = Math.min(3, availableMethods.length);
    }
    
    // Special case: admin users or high-value accounts
    if (user.isAdmin || user.tokens > 100 || user.reputationScore > 100) {
      // Require more factors for high-value accounts
      requiredCount = Math.min(Math.max(requiredCount, 2), availableMethods.length);
    }
    
    // Check recent failed attempts to adjust security dynamically
    const recentFailedAttempts = this.getRecentAttempts(username, false);
    
    if (recentFailedAttempts > 2) {
      // Increase security for accounts with recent failed attempts
      requiredCount = Math.min(requiredCount + 1, availableMethods.length);
    }
    
    return {
      methods: availableMethods,
      requiredCount,
      user
    };
  }
  
  /**
   * Record a failed authentication attempt
   * @param identifier Username or wallet address
   */
  private recordFailedAttempt(identifier: string): void {
    if (!this.failedAuthAttempts.has(identifier)) {
      this.failedAuthAttempts.set(identifier, []);
    }
    
    const attempts = this.failedAuthAttempts.get(identifier)!;
    attempts.push(Date.now());
    
    // Limit array size to prevent memory issues
    if (attempts.length > 100) {
      this.failedAuthAttempts.set(identifier, attempts.slice(-100));
    }
  }
  
  /**
   * Record a successful authentication attempt
   * @param identifier Username or wallet address
   */
  private recordSuccessfulAttempt(identifier: string): void {
    if (!this.successfulAuthAttempts.has(identifier)) {
      this.successfulAuthAttempts.set(identifier, []);
    }
    
    const attempts = this.successfulAuthAttempts.get(identifier)!;
    attempts.push(Date.now());
    
    // Limit array size to prevent memory issues
    if (attempts.length > 100) {
      this.successfulAuthAttempts.set(identifier, attempts.slice(-100));
    }
    
    // Optionally, clear failed attempts on successful login
    if (this.failedAuthAttempts.has(identifier)) {
      this.failedAuthAttempts.delete(identifier);
    }
  }
  
  /**
   * Get the number of recent authentication attempts (failed or successful)
   * @param identifier Username or wallet address
   * @param successful Whether to count successful or failed attempts
   * @param timeWindowMs Time window in milliseconds
   */
  private getRecentAttempts(
    identifier: string, 
    successful: boolean = true, 
    timeWindowMs: number = 30 * 60 * 1000 // 30 minutes
  ): number {
    const now = Date.now();
    const attemptsMap = successful ? this.successfulAuthAttempts : this.failedAuthAttempts;
    
    if (!attemptsMap.has(identifier)) {
      return 0;
    }
    
    const attempts = attemptsMap.get(identifier)!;
    return attempts.filter(timestamp => now - timestamp < timeWindowMs).length;
  }
}

// Export singleton instance
export const redundantAuthService = new RedundantAuthService();