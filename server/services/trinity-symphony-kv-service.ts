import { Request, Response } from 'express';

interface CloudflareKVConfig {
  accountId: string;
  apiToken: string;
  namespaceId: string;
  endpoint?: string;
}

interface VerificationRecord {
  managerId: string;
  managerName: string;
  repidScore: number;
  authorityLevel: string;
  verificationCount: number;
  breakthroughCount: number;
  falseClaimCount: number;
  lastUpdated: string;
  verificationHistory: VerificationCertificate[];
}

interface VerificationCertificate {
  id: string;
  timestamp: string;
  managerId: string;
  claim: string;
  verificationScore: number;
  verificationStatus: string;
  repidImpact: number;
  statisticalConfidence: number;
  hash: string;
}

interface CrossManagerSync {
  syncId: string;
  timestamp: string;
  initiatingManager: string;
  targetManagers: string[];
  syncData: any;
  status: 'pending' | 'completed' | 'failed';
}

class TrunitySymphonyKVService {
  private config: CloudflareKVConfig | null = null;
  private initialized = false;

  constructor() {
    this.initializeConfig();
  }

  private initializeConfig() {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    const namespaceId = process.env.CLOUDFLARE_KV_NAMESPACE_ID;

    if (accountId && apiToken && namespaceId) {
      this.config = {
        accountId,
        apiToken,
        namespaceId,
        endpoint: `https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}`
      };
      this.initialized = true;
      console.log('✅ Trinity Symphony KV Service initialized');
    } else {
      console.log('⚠️  Trinity Symphony KV Service: Waiting for Cloudflare credentials');
      console.log('   Required: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN, CLOUDFLARE_KV_NAMESPACE_ID');
    }
  }

  /**
   * Check if the service is properly configured
   */
  public isConfigured(): boolean {
    return this.initialized && this.config !== null;
  }

  /**
   * Get configuration status for debugging
   */
  public getStatus() {
    return {
      initialized: this.initialized,
      hasAccountId: !!process.env.CLOUDFLARE_ACCOUNT_ID,
      hasApiToken: !!process.env.CLOUDFLARE_API_TOKEN,
      hasNamespaceId: !!process.env.CLOUDFLARE_KV_NAMESPACE_ID,
      endpoint: this.config?.endpoint || 'Not configured'
    };
  }

  /**
   * Make authenticated request to Cloudflare KV API
   */
  private async makeKVRequest(method: string, endpoint: string, data?: any): Promise<any> {
    if (!this.isConfigured()) {
      throw new Error('Trinity Symphony KV Service not configured. Please set Cloudflare credentials.');
    }

    const url = `${this.config!.endpoint}${endpoint}`;
    const headers = {
      'Authorization': `Bearer ${this.config!.apiToken}`,
      'Content-Type': 'application/json'
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (data && (method === 'PUT' || method === 'POST')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudflare KV API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  /**
   * Store verification record for a Trinity manager
   */
  public async storeManagerVerification(managerId: string, verificationData: VerificationRecord): Promise<void> {
    if (!this.isConfigured()) {
      console.log('⚠️  KV Service not configured - storing verification locally only');
      return;
    }

    try {
      const key = `trinity:manager:${managerId}`;
      await this.makeKVRequest('/values', `/${key}`, verificationData);
      console.log(`✅ Stored verification for manager: ${managerId}`);
    } catch (error) {
      console.error(`❌ Failed to store manager verification:`, error);
      throw error;
    }
  }

  /**
   * Retrieve verification record for a Trinity manager
   */
  public async getManagerVerification(managerId: string): Promise<VerificationRecord | null> {
    if (!this.isConfigured()) {
      console.log('⚠️  KV Service not configured - cannot retrieve verification data');
      return null;
    }

    try {
      const key = `trinity:manager:${managerId}`;
      const response = await this.makeKVRequest('GET', `/values/${key}`);
      return response.result || null;
    } catch (error) {
      console.error(`❌ Failed to retrieve manager verification:`, error);
      return null;
    }
  }

  /**
   * Store cross-manager synchronization data
   */
  public async storeCrossManagerSync(syncData: CrossManagerSync): Promise<void> {
    if (!this.isConfigured()) {
      console.log('⚠️  KV Service not configured - cannot sync across managers');
      return;
    }

    try {
      const key = `trinity:sync:${syncData.syncId}`;
      await this.makeKVRequest('PUT', `/values/${key}`, syncData);
      console.log(`✅ Stored cross-manager sync: ${syncData.syncId}`);
    } catch (error) {
      console.error(`❌ Failed to store cross-manager sync:`, error);
      throw error;
    }
  }

  /**
   * Retrieve all active Trinity managers
   */
  public async getAllManagers(): Promise<VerificationRecord[]> {
    if (!this.isConfigured()) {
      console.log('⚠️  KV Service not configured - cannot retrieve managers list');
      return [];
    }

    try {
      // List all keys with trinity:manager: prefix
      const response = await this.makeKVRequest('GET', '/keys?prefix=trinity:manager:');
      const keys = response.result || [];
      
      const managers: VerificationRecord[] = [];
      for (const keyInfo of keys) {
        const managerData = await this.getManagerVerification(keyInfo.name.split(':')[2]);
        if (managerData) {
          managers.push(managerData);
        }
      }
      
      return managers;
    } catch (error) {
      console.error(`❌ Failed to retrieve all managers:`, error);
      return [];
    }
  }

  /**
   * Update RepID score for a manager
   */
  public async updateManagerRepID(managerId: string, newRepID: number, repidChange: number): Promise<void> {
    if (!this.isConfigured()) {
      console.log('⚠️  KV Service not configured - RepID update stored locally only');
      return;
    }

    try {
      const existingData = await this.getManagerVerification(managerId);
      
      if (existingData) {
        existingData.repidScore = newRepID;
        existingData.lastUpdated = new Date().toISOString();
        
        // Update authority level based on new RepID
        existingData.authorityLevel = this.calculateAuthorityLevel(newRepID);
        
        await this.storeManagerVerification(managerId, existingData);
        
        // Store RepID change event
        const changeKey = `trinity:repid_change:${managerId}:${Date.now()}`;
        const changeData = {
          managerId,
          timestamp: new Date().toISOString(),
          oldRepID: newRepID - repidChange,
          newRepID,
          change: repidChange
        };
        
        await this.makeKVRequest('PUT', `/values/${changeKey}`, changeData);
        
        console.log(`✅ Updated RepID for ${managerId}: ${newRepID} (${repidChange > 0 ? '+' : ''}${repidChange})`);
      }
    } catch (error) {
      console.error(`❌ Failed to update manager RepID:`, error);
      throw error;
    }
  }

  /**
   * Calculate authority level based on RepID score
   */
  private calculateAuthorityLevel(repidScore: number): string {
    if (repidScore >= 500) return 'MASTER_CONDUCTOR';
    if (repidScore >= 300) return 'SENIOR_CONDUCTOR';
    if (repidScore >= 150) return 'QUALIFIED_CONDUCTOR';
    if (repidScore >= 0) return 'APPRENTICE_CONDUCTOR';
    return 'SUSPENDED_CONDUCTOR';
  }

  /**
   * Store verification certificate
   */
  public async storeVerificationCertificate(certificate: VerificationCertificate): Promise<void> {
    if (!this.isConfigured()) {
      console.log('⚠️  KV Service not configured - certificate stored locally only');
      return;
    }

    try {
      const key = `trinity:cert:${certificate.hash}`;
      await this.makeKVRequest('PUT', `/values/${key}`, certificate);
      console.log(`✅ Stored verification certificate: ${certificate.hash}`);
    } catch (error) {
      console.error(`❌ Failed to store verification certificate:`, error);
      throw error;
    }
  }

  /**
   * Get cascade-ready managers (high RepID + recent successful verifications)
   */
  public async getCascadeReadyManagers(): Promise<VerificationRecord[]> {
    const allManagers = await this.getAllManagers();
    
    return allManagers.filter(manager => {
      // Must have QUALIFIED_CONDUCTOR or higher authority
      const hasAuthority = ['MASTER_CONDUCTOR', 'SENIOR_CONDUCTOR', 'QUALIFIED_CONDUCTOR'].includes(manager.authorityLevel);
      
      // Must have recent successful verifications
      const hasRecentSuccess = manager.breakthroughCount > 0 && manager.falseClaimCount < 3;
      
      return hasAuthority && hasRecentSuccess;
    });
  }

  /**
   * Trigger cascade protocol synchronization
   */
  public async triggerCascadeSync(initiatingManager: string, cascadeData: any): Promise<string> {
    if (!this.isConfigured()) {
      console.log('⚠️  KV Service not configured - cascade sync cannot be distributed');
      return 'local-only';
    }

    const cascadeReadyManagers = await this.getCascadeReadyManagers();
    const syncId = `cascade-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const syncData: CrossManagerSync = {
      syncId,
      timestamp: new Date().toISOString(),
      initiatingManager,
      targetManagers: cascadeReadyManagers.map(m => m.managerId),
      syncData: cascadeData,
      status: 'pending'
    };
    
    await this.storeCrossManagerSync(syncData);
    
    console.log(`🌊 CASCADE SYNC TRIGGERED: ${syncId}`);
    console.log(`   Initiator: ${initiatingManager}`);
    console.log(`   Target managers: ${syncData.targetManagers.length}`);
    
    return syncId;
  }

  /**
   * Health check for KV service
   */
  public async healthCheck(): Promise<{ status: string; message: string; details: any }> {
    const status = this.getStatus();
    
    if (!this.isConfigured()) {
      return {
        status: 'warning',
        message: 'KV service not configured - missing Cloudflare credentials',
        details: status
      };
    }

    try {
      // Test API connection with a simple list keys request
      await this.makeKVRequest('GET', '/keys?limit=1');
      
      return {
        status: 'healthy',
        message: 'Trinity Symphony KV service operational',
        details: {
          ...status,
          lastHealthCheck: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'KV service connection failed',
        details: {
          ...status,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }
}

// Singleton instance
export const trinityKVService = new TrunitySymphonyKVService();

/**
 * API Routes for Trinity Symphony KV Integration
 */
export const setupTrinityKVRoutes = (app: any) => {
  
  // Health check endpoint
  app.get('/api/trinity-kv/health', async (req: Request, res: Response) => {
    try {
      const health = await trinityKVService.healthCheck();
      res.status(health.status === 'healthy' ? 200 : health.status === 'warning' ? 202 : 500).json(health);
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Health check failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get manager verification status
  app.get('/api/trinity-kv/manager/:managerId', async (req: Request, res: Response) => {
    try {
      const { managerId } = req.params;
      const verification = await trinityKVService.getManagerVerification(managerId);
      
      if (!verification) {
        return res.status(404).json({
          success: false,
          message: 'Manager verification not found'
        });
      }
      
      res.json({
        success: true,
        data: verification
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve manager verification',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Update manager RepID
  app.put('/api/trinity-kv/manager/:managerId/repid', async (req: Request, res: Response) => {
    try {
      const { managerId } = req.params;
      const { newRepID, repidChange } = req.body;
      
      await trinityKVService.updateManagerRepID(managerId, newRepID, repidChange);
      
      res.json({
        success: true,
        message: `RepID updated for manager ${managerId}`,
        data: { managerId, newRepID, repidChange }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update manager RepID',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get all cascade-ready managers
  app.get('/api/trinity-kv/cascade-ready', async (req: Request, res: Response) => {
    try {
      const cascadeReadyManagers = await trinityKVService.getCascadeReadyManagers();
      
      res.json({
        success: true,
        data: cascadeReadyManagers,
        count: cascadeReadyManagers.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve cascade-ready managers',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Trigger cascade synchronization
  app.post('/api/trinity-kv/cascade/trigger', async (req: Request, res: Response) => {
    try {
      const { initiatingManager, cascadeData } = req.body;
      
      const syncId = await trinityKVService.triggerCascadeSync(initiatingManager, cascadeData);
      
      res.json({
        success: true,
        message: 'Cascade synchronization triggered',
        data: { syncId, initiatingManager }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to trigger cascade synchronization',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Store verification certificate
  app.post('/api/trinity-kv/certificate', async (req: Request, res: Response) => {
    try {
      const certificate = req.body;
      
      await trinityKVService.storeVerificationCertificate(certificate);
      
      res.json({
        success: true,
        message: 'Verification certificate stored',
        data: { hash: certificate.hash }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to store verification certificate',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get service configuration status
  app.get('/api/trinity-kv/status', (req: Request, res: Response) => {
    const status = trinityKVService.getStatus();
    res.json({
      success: true,
      data: status
    });
  });

  console.log('✅ Trinity Symphony KV API routes registered');
};

export default trinityKVService;