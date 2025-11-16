/**
 * Smart Authentication Service
 * 
 * This service enhances the authentication system with device recognition and simplified auth flows
 * for returning users on trusted devices.
 */

import crypto from 'crypto';
import { db } from '../db';
import { eq, and, or, isNull, lt, gt } from 'drizzle-orm';
import * as schema from '@shared/schema';
import { logger } from '../utils/logger';
import { fourFAService } from './four-fa-service';
import { sbtService } from './sbt-service';
import { Request } from 'express';

// Interface for trusted device data
export interface TrustedDevice {
  id: string;
  userId: number;
  deviceName: string;
  deviceType: string;
  browser: string;
  os: string;
  deviceFingerprint: string; // Cryptographic fingerprint of the device
  ipAddress: string;
  lastUsed: Date | null;
  expiresAt: Date;
  createdAt: Date | null;
  isRevoked: boolean | null;
}

// Interface for device recognition info
export interface DeviceInfo {
  deviceName: string;
  deviceType: string;
  browser: string;
  os: string;
  fingerprint: string;
  ipAddress: string;
}

// Interface for simplified auth status
export interface SimplifiedAuthStatus {
  canUseSimplifiedAuth: boolean;
  requiredFactors: number[]; // Which factors are still required (if any)
  trustedDeviceId?: string;
  authChallenge?: string; // Challenge string for simplified auth
}

/**
 * Manages enhanced authentication with device recognition
 */
export class SmartAuthService {
  private readonly DEVICE_EXPIRY_DAYS = 30; // Trusted devices expire after 30 days by default
  private readonly TOKEN_EXPIRY_HOURS = 24; // Auth tokens expire after 24 hours
  
  /**
   * Initialize the Smart Auth service
   */
  constructor() {
    logger.info('[SmartAuth] Smart Authentication service initialized');
  }
  
  /**
   * Get device info from a request
   * 
   * @param req Express request object
   * @returns Device information
   */
  getDeviceInfo(req: Request): DeviceInfo {
    // Parse user agent
    const userAgent = req.headers['user-agent'] || '';
    
    // Simple parsing for browser, OS, and device info
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';
    let deviceType = 'desktop';
    
    // Simple browser detection
    if (userAgent.includes('Firefox/')) browser = 'Firefox';
    else if (userAgent.includes('Chrome/')) browser = 'Chrome';
    else if (userAgent.includes('Safari/')) browser = 'Safari';
    else if (userAgent.includes('Edge/')) browser = 'Edge';
    else if (userAgent.includes('MSIE') || userAgent.includes('Trident/')) browser = 'Internet Explorer';
    
    // Simple OS detection
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac OS X')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('iOS')) os = 'iOS';
    else if (userAgent.includes('Android')) os = 'Android';
    
    // Simple device type detection
    if (userAgent.includes('Mobile')) deviceType = 'mobile';
    else if (userAgent.includes('Tablet')) deviceType = 'tablet';
    
    // Create parsedUA object similar to what UAParser would return
    const parsedUA = {
      browser: { name: browser },
      os: { name: os },
      device: { 
        vendor: '',
        model: '',
        type: deviceType
      }
    };
    
    // Get IP address
    const ip = req.headers['x-forwarded-for'] || 
              req.socket.remoteAddress || 
              '0.0.0.0';
    
    // Get device fingerprint components
    const fpComponents = [
      userAgent,
      ip,
      parsedUA.browser.name,
      parsedUA.os.name,
      parsedUA.device.vendor,
      parsedUA.device.model
      // CPU architecture not available in our simple parser
    ].filter(Boolean).join('|');
    
    // Create a hash fingerprint
    const fingerprint = crypto
      .createHash('sha256')
      .update(fpComponents)
      .digest('hex');
    
    return {
      deviceName: `${parsedUA.browser.name || 'Unknown'} on ${parsedUA.os.name || 'Unknown'}`,
      deviceType: parsedUA.device.type || (parsedUA.os.name?.toLowerCase().includes('android') || 
                  parsedUA.os.name?.toLowerCase().includes('ios') ? 'mobile' : 'desktop'),
      browser: parsedUA.browser.name || 'Unknown',
      os: parsedUA.os.name || 'Unknown',
      fingerprint,
      ipAddress: typeof ip === 'string' ? ip : ip[0]
    };
  }
  
  /**
   * Register a device as trusted for a user
   * 
   * @param userId User ID
   * @param deviceInfo Device information
   * @param durationDays How long the device should be trusted (in days)
   * @returns The trusted device record or null if registration failed
   */
  async registerTrustedDevice(
    userId: number, 
    deviceInfo: DeviceInfo, 
    durationDays = this.DEVICE_EXPIRY_DAYS
  ): Promise<TrustedDevice | null> {
    try {
      // Check for existing device with the same fingerprint
      const [existingDevice] = await db
        .select()
        .from(schema.trustedDevices)
        .where(
          and(
            eq(schema.trustedDevices.userId, userId),
            eq(schema.trustedDevices.fingerprint, deviceInfo.fingerprint),
            eq(schema.trustedDevices.isRevoked, false)
          )
        );
      
      // If device already exists, just update its lastUsed and expiresAt
      if (existingDevice) {
        const expiryDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
        
        // Update the existing device record
        await db
          .update(schema.trustedDevices)
          .set({
            deviceName: deviceInfo.deviceName, // Update name in case it changed
            lastUsed: new Date(),
            expiresAt: expiryDate
          })
          .where(eq(schema.trustedDevices.id, existingDevice.id));
        
        // Get the updated record
        const [updatedDevice] = await db
          .select()
          .from(schema.trustedDevices)
          .where(eq(schema.trustedDevices.id, existingDevice.id));
        
        if (!updatedDevice) {
          return null;
        }
        
        // Convert to our interface format
        const result: TrustedDevice = {
          id: updatedDevice.id,
          userId: updatedDevice.userId,
          deviceName: updatedDevice.deviceName,
          deviceType: updatedDevice.deviceType,
          browser: updatedDevice.browser || '',
          os: updatedDevice.os || '',
          deviceFingerprint: updatedDevice.fingerprint,
          ipAddress: updatedDevice.ipAddress || '',
          lastUsed: updatedDevice.lastUsed,
          expiresAt: updatedDevice.expiresAt,
          createdAt: updatedDevice.createdAt,
          isRevoked: updatedDevice.isRevoked || false
        };
        
        logger.info(`[SmartAuth] Updated trusted device for user ${userId}`);
        return result;
      }
      
      // Create a new trusted device record
      const expiryDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);
      
      // Insert the new device
      const [newDevice] = await db
        .insert(schema.trustedDevices)
        .values({
          userId: userId,
          deviceName: deviceInfo.deviceName,
          deviceType: deviceInfo.deviceType,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          fingerprint: deviceInfo.fingerprint,
          ipAddress: deviceInfo.ipAddress,
          lastUsed: new Date(),
          expiresAt: expiryDate
        })
        .returning();
      
      if (!newDevice) {
        return null;
      }
      
      // Convert to our interface format
      const result: TrustedDevice = {
        id: newDevice.id,
        userId: newDevice.userId,
        deviceName: newDevice.deviceName,
        deviceType: newDevice.deviceType,
        browser: newDevice.browser || '',
        os: newDevice.os || '',
        deviceFingerprint: newDevice.fingerprint,
        ipAddress: newDevice.ipAddress || '',
        lastUsed: newDevice.lastUsed,
        expiresAt: newDevice.expiresAt,
        createdAt: newDevice.createdAt,
        isRevoked: newDevice.isRevoked || false
      };
      
      logger.info(`[SmartAuth] Registered new trusted device for user ${userId}`);
      return result;
    } catch (error) {
      logger.error('[SmartAuth] Error registering trusted device', error);
      return null;
    }
  }
  
  /**
   * Get a trusted device by its fingerprint
   * 
   * @param userId User ID
   * @param fingerprint Device fingerprint
   * @returns The trusted device or null if not found
   */
  async getTrustedDeviceByFingerprint(userId: number, fingerprint: string): Promise<TrustedDevice | null> {
    try {
      // Get the device from the database
      const [device] = await db
        .select()
        .from(schema.trustedDevices)
        .where(
          and(
            eq(schema.trustedDevices.userId, userId),
            eq(schema.trustedDevices.fingerprint, fingerprint),
            eq(schema.trustedDevices.isRevoked, false)
          )
        );
      
      if (!device) {
        return null;
      }
      
      // Convert to our interface format
      return {
        id: device.id,
        userId: device.userId,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        browser: device.browser || '',
        os: device.os || '',
        deviceFingerprint: device.fingerprint,
        ipAddress: device.ipAddress || '',
        lastUsed: device.lastUsed,
        expiresAt: device.expiresAt,
        createdAt: device.createdAt,
        isRevoked: device.isRevoked || false
      };
    } catch (error) {
      logger.error('[SmartAuth] Error getting trusted device', error);
      return null;
    }
  }
  
  /**
   * Get all trusted devices for a user
   * 
   * @param userId User ID
   * @returns Array of trusted devices
   */
  async getUserTrustedDevices(userId: number): Promise<TrustedDevice[]> {
    try {
      // Get all trusted devices from the database
      const devices = await db
        .select()
        .from(schema.trustedDevices)
        .where(
          and(
            eq(schema.trustedDevices.userId, userId),
            eq(schema.trustedDevices.isRevoked, false)
          )
        );
      
      if (!devices || devices.length === 0) {
        return [];
      }
      
      // Convert to our interface format
      return devices.map(device => ({
        id: device.id,
        userId: device.userId,
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        browser: device.browser || '',
        os: device.os || '',
        deviceFingerprint: device.fingerprint,
        ipAddress: device.ipAddress || '',
        lastUsed: device.lastUsed,
        expiresAt: device.expiresAt,
        createdAt: device.createdAt,
        isRevoked: device.isRevoked || false
      }));
    } catch (error) {
      logger.error('[SmartAuth] Error getting user trusted devices', error);
      return [];
    }
  }
  
  /**
   * Revoke a trusted device
   * 
   * @param userId User ID
   * @param deviceId Device ID to revoke
   * @returns True if revoked successfully, false otherwise
   */
  async revokeTrustedDevice(userId: number, deviceId: string): Promise<boolean> {
    try {
      // Find the device to verify it belongs to the user
      const [device] = await db
        .select()
        .from(schema.trustedDevices)
        .where(
          and(
            eq(schema.trustedDevices.id, deviceId),
            eq(schema.trustedDevices.userId, userId)
          )
        );
      
      if (!device) {
        return false;
      }
      
      // Mark the device as revoked
      await db
        .update(schema.trustedDevices)
        .set({ isRevoked: true })
        .where(eq(schema.trustedDevices.id, deviceId));
      
      logger.info(`[SmartAuth] Revoked trusted device ${deviceId} for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('[SmartAuth] Error revoking trusted device', error);
      return false;
    }
  }
  
  /**
   * Check if a device is trusted for a user
   * 
   * @param userId User ID
   * @param deviceInfo Device information
   * @returns True if the device is trusted, false otherwise
   */
  async isDeviceTrusted(userId: number, deviceInfo: DeviceInfo): Promise<boolean> {
    try {
      // Check for a valid trusted device directly from the database
      const [device] = await db
        .select()
        .from(schema.trustedDevices)
        .where(
          and(
            eq(schema.trustedDevices.userId, userId),
            eq(schema.trustedDevices.fingerprint, deviceInfo.fingerprint),
            eq(schema.trustedDevices.isRevoked, false),
            gt(schema.trustedDevices.expiresAt, new Date()) // Not expired
          )
        );
      
      return !!device; // Convert to boolean
    } catch (error) {
      logger.error('[SmartAuth] Error checking trusted device', error);
      return false;
    }
  }
  
  /**
   * Generate a simplified auth challenge for a device
   * 
   * @param userId User ID
   * @param deviceId Device ID
   * @returns Auth challenge string or null if failed
   */
  async generateAuthChallenge(userId: number, deviceId: string): Promise<string | null> {
    try {
      // Find the device in the database to ensure it exists and is valid
      const [device] = await db
        .select()
        .from(schema.trustedDevices)
        .where(
          and(
            eq(schema.trustedDevices.id, deviceId),
            eq(schema.trustedDevices.userId, userId),
            eq(schema.trustedDevices.isRevoked, false),
            gt(schema.trustedDevices.expiresAt, new Date()) // Not expired
          )
        );
      
      if (!device) {
        return null;
      }
      
      // Generate a random challenge
      const challenge = crypto.randomBytes(32).toString('hex');
      
      // Store the challenge in verification_codes
      await db
        .insert(schema.verificationCodes)
        .values({
          userId: userId,
          code: challenge,
          type: 'simplified-auth',
          expires: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        });
      
      // Update device last used time
      await db
        .update(schema.trustedDevices)
        .set({ lastUsed: new Date() })
        .where(eq(schema.trustedDevices.id, deviceId));
      
      logger.info(`[SmartAuth] Generated auth challenge for user ${userId}, device ${deviceId}`);
      return challenge;
    } catch (error) {
      logger.error('[SmartAuth] Error generating auth challenge', error);
      return null;
    }
  }
  
  /**
   * Verify an auth challenge response
   * 
   * @param userId User ID
   * @param challenge Challenge string
   * @param response Challenge response
   * @returns True if verification succeeded, false otherwise
   */
  async verifyAuthChallenge(userId: number, challenge: string): Promise<boolean> {
    try {
      // Find the challenge in verification_codes
      const [verificationCode] = await db
        .select()
        .from(schema.verificationCodes)
        .where(and(
          eq(schema.verificationCodes.userId, userId),
          eq(schema.verificationCodes.code, challenge),
          eq(schema.verificationCodes.type, 'simplified-auth'),
          gt(schema.verificationCodes.expires, new Date())
        ));
      
      if (!verificationCode) {
        return false;
      }
      
      // Delete the verification code
      await db
        .delete(schema.verificationCodes)
        .where(eq(schema.verificationCodes.id, verificationCode.id));
      
      logger.info(`[SmartAuth] Verified auth challenge for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('[SmartAuth] Error verifying auth challenge', error);
      return false;
    }
  }
  
  /**
   * Check if a user can use simplified authentication on a device
   * 
   * @param userId User ID
   * @param deviceInfo Device information
   * @returns Simplified auth status
   */
  async checkSimplifiedAuth(userId: number, deviceInfo: DeviceInfo): Promise<SimplifiedAuthStatus> {
    try {
      // Get authentication factors
      const authFactors = await fourFAService.getAuthFactorsStatus(userId);
      const authLevel = await fourFAService.getAuthLevel(userId);
      
      // Default response
      const response: SimplifiedAuthStatus = {
        canUseSimplifiedAuth: false,
        requiredFactors: []
      };
      
      // Check if device is trusted directly from the database
      const [device] = await db
        .select()
        .from(schema.trustedDevices)
        .where(
          and(
            eq(schema.trustedDevices.userId, userId),
            eq(schema.trustedDevices.fingerprint, deviceInfo.fingerprint),
            eq(schema.trustedDevices.isRevoked, false),
            gt(schema.trustedDevices.expiresAt, new Date()) // Not expired
          )
        );
      
      if (!device) {
        // Device not trusted or expired - require full authentication
        // Build list of required factors
        if (!authFactors.factor1) response.requiredFactors.push(1);
        if (!authFactors.factor2) response.requiredFactors.push(2);
        if (!authFactors.factor3) response.requiredFactors.push(3);
        if (!authFactors.factor4) response.requiredFactors.push(4);
        
        // Always require at least factor 1 (knowledge)
        if (!response.requiredFactors.includes(1)) {
          response.requiredFactors.push(1);
        }
        
        return response;
      }
      
      // Device is trusted - allow simplified auth if user has at least level 2 auth
      if (authLevel >= 2) {
        response.canUseSimplifiedAuth = true;
        response.trustedDeviceId = device.id;
        
        // Generate auth challenge
        const challenge = await this.generateAuthChallenge(userId, device.id);
        if (challenge) {
          response.authChallenge = challenge;
        }
        
        // Device is already updated in generateAuthChallenge method
      } else {
        // User doesn't have enough factors verified for simplified auth
        if (!authFactors.factor1) response.requiredFactors.push(1);
        if (!authFactors.factor2) response.requiredFactors.push(2);
        if (!authFactors.factor3) response.requiredFactors.push(3);
        if (!authFactors.factor4) response.requiredFactors.push(4);
      }
      
      return response;
    } catch (error) {
      logger.error('[SmartAuth] Error checking simplified auth', error);
      return {
        canUseSimplifiedAuth: false,
        requiredFactors: [1, 2, 3, 4] // Require all factors if there's an error
      };
    }
  }
  
  /**
   * Perform simplified authentication
   * 
   * @param userId User ID
   * @param deviceId Device ID
   * @param challenge Auth challenge
   * @returns True if authentication succeeded, false otherwise
   */
  async performSimplifiedAuth(userId: number, deviceId: string, challenge: string): Promise<boolean> {
    try {
      // Verify the device is still trusted and valid
      const [device] = await db
        .select()
        .from(schema.trustedDevices)
        .where(
          and(
            eq(schema.trustedDevices.id, deviceId),
            eq(schema.trustedDevices.userId, userId),
            eq(schema.trustedDevices.isRevoked, false),
            gt(schema.trustedDevices.expiresAt, new Date()) // Not expired
          )
        );
      
      if (!device) {
        logger.info(`[SmartAuth] Device ${deviceId} not found or not valid for user ${userId}`);
        return false;
      }
      
      // Verify the challenge
      const isValid = await this.verifyAuthChallenge(userId, challenge);
      
      if (!isValid) {
        logger.info(`[SmartAuth] Challenge verification failed for user ${userId}`);
        return false;
      }
      
      // Update device last used timestamp
      await db
        .update(schema.trustedDevices)
        .set({ lastUsed: new Date() })
        .where(eq(schema.trustedDevices.id, deviceId));
      
      logger.info(`[SmartAuth] Simplified authentication successful for user ${userId}`);
      return true;
    } catch (error) {
      logger.error('[SmartAuth] Error performing simplified auth', error);
      return false;
    }
  }
}

// Export singleton instance
export const smartAuthService = new SmartAuthService();