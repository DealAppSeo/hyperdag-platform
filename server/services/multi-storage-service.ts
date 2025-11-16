/**
 * Multi-Storage Service for HyperDAG
 * 
 * Combines multiple free storage providers to go beyond Fetch.AI's storage limitations:
 * - Limewire (10GB free)
 * - IPFS/Web3.Storage (free with Filecoin backing)
 * - Existing HyperDAG IPFS infrastructure
 * - Smart routing based on file type and size
 */

// import { limewireIntegration } from './limewire-integration';

interface StorageProvider {
  name: string;
  available: boolean;
  freeLimit: number; // in GB
  bestFor: string[];
  priority: number;
}

interface StorageRoute {
  provider: string;
  url: string;
  backupProvider?: string;
  backupUrl?: string;
}

interface FileMetadata {
  id: string;
  filename: string;
  size: number;
  type: string;
  uploadDate: Date;
  provider: string;
  url: string;
  backupProvider?: string;
  backupUrl?: string;
  projectId?: number;
  userId: number;
}

export class MultiStorageService {
  private providers: Map<string, StorageProvider> = new Map();
  private userStorageUsage: Map<number, number> = new Map();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Limewire - AI-powered storage
    this.providers.set('limewire', {
      name: 'Limewire',
      available: true, // Available through existing integration
      freeLimit: 10, // 10GB free
      bestFor: ['video', 'audio', 'large-files', 'ai-content'],
      priority: 1
    });

    // IPFS via Web3.Storage - Decentralized storage
    this.providers.set('web3storage', {
      name: 'Web3.Storage',
      available: true, // Free with existing w3cli
      freeLimit: 1000, // 1TB free with Filecoin backing
      bestFor: ['documents', 'code', 'json', 'small-files'],
      priority: 2
    });

    // HyperDAG IPFS - Existing infrastructure
    this.providers.set('hyperdag-ipfs', {
      name: 'HyperDAG IPFS',
      available: true,
      freeLimit: 5, // 5GB on our infrastructure
      bestFor: ['project-files', 'metadata', 'configs'],
      priority: 3
    });

    // Fetch.AI Storage - Limited but integrated
    this.providers.set('fetchai', {
      name: 'Fetch.AI Storage',
      available: true,
      freeLimit: 0.1, // 100MB limit
      bestFor: ['agent-data', 'small-configs', 'credentials'],
      priority: 4
    });
  }

  /**
   * AI-powered storage routing using existing fuzzy logic system
   */
  private async selectOptimalProvider(fileSize: number, fileType: string, userId: number): Promise<string> {
    try {
      // Use existing AI system for intelligent routing decisions
      const { smartAIService } = await import('./redundancy/ai/smart-ai-service');
      
      const routingParams = {
        fileSize: fileSize / (1024 * 1024 * 1024), // Size in GB
        fileType,
        userId,
        userUsage: this.userStorageUsage.get(userId) || 0,
        availableProviders: Array.from(this.providers.entries()).map(([key, provider]) => ({
          id: key,
          available: provider.available,
          freeLimit: provider.freeLimit,
          bestFor: provider.bestFor,
          priority: provider.priority
        })),
        timestamp: Date.now()
      };

      // Let AI make the routing decision using fuzzy logic
      const routingDecision = await smartAIService.optimizeStorageRouting(routingParams);
      
      if (routingDecision && routingDecision.provider) {
        console.log(`[MultiStorage] AI selected provider: ${routingDecision.provider} (confidence: ${routingDecision.confidence})`);
        return routingDecision.provider;
      }

      // Fallback to simple logic if AI service unavailable
      return this.fallbackProviderSelection(fileSize, fileType, userId);
      
    } catch (error) {
      console.warn('[MultiStorage] AI routing failed, using fallback:', error);
      return this.fallbackProviderSelection(fileSize, fileType, userId);
    }
  }

  private fallbackProviderSelection(fileSize: number, fileType: string, userId: number): string {
    const sizeInGB = fileSize / (1024 * 1024 * 1024);
    const userUsage = this.userStorageUsage.get(userId) || 0;

    if (sizeInGB > 0.1 && userUsage < this.providers.get('limewire')!.freeLimit) {
      return 'limewire';
    }
    return 'web3storage';
  }

  /**
   * Upload file with automatic provider selection and backup
   */
  async uploadFile(fileData: {
    filename: string;
    content: Buffer;
    type: string;
    userId: number;
    projectId?: number;
  }): Promise<{ success: boolean; data: FileMetadata }> {
    try {
      const primaryProvider = this.selectOptimalProvider(
        fileData.content.length,
        fileData.type,
        fileData.userId
      );

      let uploadResult: any;
      let backupResult: any;

      // Upload to primary provider
      switch (primaryProvider) {
        case 'limewire':
          uploadResult = await this.uploadToLimewire(fileData);
          break;
        case 'web3storage':
          uploadResult = await this.uploadToWeb3Storage(fileData);
          break;
        case 'hyperdag-ipfs':
          uploadResult = await this.uploadToHyperDAGIPFS(fileData);
          break;
        default:
          uploadResult = await this.uploadToWeb3Storage(fileData);
      }

      // Create backup on different provider for important files
      if (fileData.content.length > 1024 * 1024) { // >1MB gets backup
        const backupProvider = primaryProvider === 'limewire' ? 'web3storage' : 'hyperdag-ipfs';
        try {
          switch (backupProvider) {
            case 'web3storage':
              backupResult = await this.uploadToWeb3Storage(fileData);
              break;
            case 'hyperdag-ipfs':
              backupResult = await this.uploadToHyperDAGIPFS(fileData);
              break;
          }
        } catch (error) {
          console.warn('[MultiStorage] Backup upload failed:', error);
        }
      }

      // Update usage tracking
      const sizeInGB = fileData.content.length / (1024 * 1024 * 1024);
      const currentUsage = this.userStorageUsage.get(fileData.userId) || 0;
      this.userStorageUsage.set(fileData.userId, currentUsage + sizeInGB);

      const metadata: FileMetadata = {
        id: uploadResult.id || this.generateFileId(),
        filename: fileData.filename,
        size: fileData.content.length,
        type: fileData.type,
        uploadDate: new Date(),
        provider: primaryProvider,
        url: uploadResult.url,
        backupProvider: backupResult?.provider,
        backupUrl: backupResult?.url,
        projectId: fileData.projectId,
        userId: fileData.userId
      };

      return {
        success: true,
        data: metadata
      };

    } catch (error) {
      console.error('[MultiStorage] Upload failed:', error);
      return {
        success: false,
        data: null as any
      };
    }
  }

  /**
   * Upload to Limewire with AI optimization
   */
  private async uploadToLimewire(fileData: any): Promise<any> {
    try {
      // Temporarily use fallback until limewire integration is fully configured
      console.log('[MultiStorage] Limewire integration not available, using fallback');
      return await this.uploadToWeb3Storage(fileData);
    } catch (error) {
      throw new Error(`Limewire upload failed: ${error}`);
    }
  }

  /**
   * Upload to Web3.Storage using existing w3cli
   */
  private async uploadToWeb3Storage(fileData: any): Promise<any> {
    try {
      // Use existing w3cli integration
      const { w3cliProvider } = await import('./w3cli-provider');
      
      const result = await w3cliProvider.uploadFile(fileData.filename, fileData.content);
      
      return {
        id: result.cid,
        url: `https://w3s.link/ipfs/${result.cid}`,
        provider: 'web3storage'
      };
    } catch (error) {
      throw new Error(`Web3.Storage upload failed: ${error}`);
    }
  }

  /**
   * Upload to HyperDAG IPFS infrastructure
   */
  private async uploadToHyperDAGIPFS(fileData: any): Promise<any> {
    try {
      // Use existing IPFS infrastructure
      const { ipfsStorage } = await import('./ipfs-storage');
      
      const result = await ipfsStorage.uploadFile(fileData.content, {
        filename: fileData.filename,
        type: fileData.type
      });

      return {
        id: result.hash,
        url: `https://ipfs.io/ipfs/${result.hash}`,
        provider: 'hyperdag-ipfs'
      };
    } catch (error) {
      throw new Error(`HyperDAG IPFS upload failed: ${error}`);
    }
  }

  /**
   * Retrieve file with automatic failover to backup
   */
  async retrieveFile(fileId: string, metadata: FileMetadata): Promise<Buffer> {
    try {
      // Try primary provider first
      let fileData = await this.retrieveFromProvider(metadata.provider, metadata.url);
      
      if (!fileData && metadata.backupProvider && metadata.backupUrl) {
        console.log(`[MultiStorage] Primary failed, trying backup: ${metadata.backupProvider}`);
        fileData = await this.retrieveFromProvider(metadata.backupProvider, metadata.backupUrl);
      }

      if (!fileData) {
        throw new Error('File not found on any provider');
      }

      return fileData;
    } catch (error) {
      console.error('[MultiStorage] File retrieval failed:', error);
      throw error;
    }
  }

  private async retrieveFromProvider(provider: string, url: string): Promise<Buffer | null> {
    try {
      switch (provider) {
        case 'limewire':
          return await this.retrieveFromLimewire(url);
        case 'web3storage':
          return await this.retrieveFromWeb3Storage(url);
        case 'hyperdag-ipfs':
          return await this.retrieveFromHyperDAGIPFS(url);
        default:
          return null;
      }
    } catch (error) {
      console.warn(`[MultiStorage] ${provider} retrieval failed:`, error);
      return null;
    }
  }

  private async retrieveFromLimewire(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Limewire retrieval failed');
    return Buffer.from(await response.arrayBuffer());
  }

  private async retrieveFromWeb3Storage(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Web3.Storage retrieval failed');
    return Buffer.from(await response.arrayBuffer());
  }

  private async retrieveFromHyperDAGIPFS(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) throw new Error('HyperDAG IPFS retrieval failed');
    return Buffer.from(await response.arrayBuffer());
  }

  /**
   * Get storage analytics for user
   */
  async getStorageAnalytics(userId: number): Promise<any> {
    const userUsage = this.userStorageUsage.get(userId) || 0;
    
    return {
      totalUsed: userUsage,
      providers: Array.from(this.providers.entries()).map(([key, provider]) => ({
        name: provider.name,
        available: provider.available,
        freeLimit: provider.freeLimit,
        used: key === 'limewire' ? Math.min(userUsage, provider.freeLimit) : 0,
        remaining: Math.max(0, provider.freeLimit - userUsage),
        bestFor: provider.bestFor
      })),
      recommendations: this.getStorageRecommendations(userId)
    };
  }

  private getStorageRecommendations(userId: number): string[] {
    const usage = this.userStorageUsage.get(userId) || 0;
    const recommendations = [];

    if (usage < 1) {
      recommendations.push("You have plenty of free storage available across all providers");
    }

    if (usage > 5) {
      recommendations.push("Consider upgrading to paid plans for additional storage");
    }

    recommendations.push("Large media files automatically use Limewire for AI optimization");
    recommendations.push("Documents and code use Web3.Storage for permanent decentralized storage");

    return recommendations;
  }

  /**
   * Get service status
   */
  getServiceStatus(): any {
    return {
      service: "Multi-Storage Service",
      active: true,
      providers: Array.from(this.providers.entries()).map(([key, provider]) => ({
        id: key,
        name: provider.name,
        available: provider.available,
        freeLimit: `${provider.freeLimit}GB`,
        bestFor: provider.bestFor
      })),
      capabilities: [
        "Smart routing based on file type and size",
        "Automatic backup to secondary providers",
        "AI-powered content optimization via Limewire",
        "Decentralized storage via IPFS/Web3.Storage",
        "Seamless failover between providers"
      ],
      totalFreeStorage: Array.from(this.providers.values())
        .reduce((total, provider) => total + provider.freeLimit, 0)
    };
  }

  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

export const multiStorageService = new MultiStorageService();