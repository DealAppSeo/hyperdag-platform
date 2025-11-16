import { ForumPost, ForumStorageMetrics, ForumStorageProvider } from './forum-storage-interface';
import { LocalStorageProvider } from './local-storage-provider';

/**
 * StorageManager Configuration
 */
export interface StorageManagerConfig {
  /**
   * Default storage provider to use when no specific provider is chosen
   */
  defaultProvider: string;
  
  /**
   * Sync settings between providers
   */
  syncSettings: {
    /**
     * Whether to automatically sync between providers
     */
    autoSync: boolean;
    
    /**
     * Interval in milliseconds for auto sync
     */
    syncInterval?: number;
    
    /**
     * Whether to perform sync operations in the background
     */
    backgroundSync: boolean;
  };
  
  /**
   * Optimization settings for AI-driven storage decisions
   */
  optimizationSettings: {
    /**
     * Whether to enable AI-driven optimization
     */
    enabled: boolean;
    
    /**
     * Criteria for storage provider selection
     */
    criteria: {
      /**
       * Weight given to speed (0-1)
       */
      speedWeight: number;
      
      /**
       * Weight given to privacy (0-1)
       */
      privacyWeight: number;
      
      /**
       * Weight given to cost efficiency (0-1)
       */
      costWeight: number;
      
      /**
       * Weight given to persistence/reliability (0-1)
       */
      persistenceWeight: number;
    };
  };
}

/**
 * Forum Storage Manager
 * 
 * Manages multiple storage providers and intelligently routes operations
 * to the most appropriate provider based on AI-driven optimization.
 */
export class ForumStorageManager {
  private providers: Map<string, ForumStorageProvider> = new Map();
  private metrics: Map<string, ForumStorageMetrics> = new Map();
  private config: StorageManagerConfig;
  private syncTimer: ReturnType<typeof setInterval> | null = null;
  
  constructor(config?: Partial<StorageManagerConfig>) {
    // Default configuration
    this.config = {
      defaultProvider: 'local',
      syncSettings: {
        autoSync: false,
        syncInterval: 5 * 60 * 1000, // 5 minutes
        backgroundSync: true
      },
      optimizationSettings: {
        enabled: true,
        criteria: {
          speedWeight: 0.4,
          privacyWeight: 0.3,
          costWeight: 0.2,
          persistenceWeight: 0.1
        }
      },
      ...config
    };
    
    // Initialize the localStorage provider by default
    this.registerProvider(new LocalStorageProvider());
    
    // Start auto-sync if enabled
    if (this.config.syncSettings.autoSync && this.config.syncSettings.syncInterval) {
      this.startAutoSync();
    }
  }
  
  /**
   * Register a storage provider
   */
  registerProvider(provider: ForumStorageProvider): void {
    this.providers.set(provider.type, provider);
    
    // Collect initial metrics
    provider.getMetrics().then(metrics => {
      this.metrics.set(provider.type, metrics);
    }).catch(error => {
      console.error(`Failed to get metrics for provider ${provider.type}:`, error);
    });
  }
  
  /**
   * Get all registered providers
   */
  getProviders(): ForumStorageProvider[] {
    return Array.from(this.providers.values());
  }
  
  /**
   * Get a provider by type
   */
  getProvider(type: string): ForumStorageProvider | undefined {
    return this.providers.get(type);
  }
  
  /**
   * Get the default provider
   */
  getDefaultProvider(): ForumStorageProvider {
    const defaultProvider = this.providers.get(this.config.defaultProvider);
    
    if (!defaultProvider) {
      // Fallback to first available provider
      const firstProvider = this.providers.values().next().value;
      
      if (!firstProvider) {
        throw new Error('No storage providers registered');
      }
      
      return firstProvider;
    }
    
    return defaultProvider;
  }
  
  /**
   * Save a post using the optimal provider
   */
  async savePost(post: ForumPost): Promise<ForumPost> {
    const provider = await this.getOptimalProviderForOperation('write', post);
    const savedPost = await provider.savePost(post);
    
    // Sync with other providers if background sync is enabled
    if (this.config.syncSettings.backgroundSync) {
      this.syncPost(savedPost, provider.type);
    }
    
    return savedPost;
  }
  
  /**
   * Get all posts from the optimal provider
   */
  async getAllPosts(): Promise<ForumPost[]> {
    const provider = await this.getOptimalProviderForOperation('read');
    return provider.getAllPosts();
  }
  
  /**
   * Get a post by ID from the optimal provider
   */
  async getPostById(id: string): Promise<ForumPost | null> {
    const provider = await this.getOptimalProviderForOperation('read');
    return provider.getPostById(id);
  }
  
  /**
   * Get posts by user ID from the optimal provider
   */
  async getPostsByUser(userId: string): Promise<ForumPost[]> {
    const provider = await this.getOptimalProviderForOperation('read');
    return provider.getPostsByUser(userId);
  }
  
  /**
   * Update a post using the optimal provider
   */
  async updatePost(id: string, updates: Partial<ForumPost>): Promise<ForumPost | null> {
    const provider = await this.getOptimalProviderForOperation('write');
    const updatedPost = await provider.updatePost(id, updates);
    
    // Sync with other providers if background sync is enabled
    if (updatedPost && this.config.syncSettings.backgroundSync) {
      this.syncPost(updatedPost, provider.type);
    }
    
    return updatedPost;
  }
  
  /**
   * Delete a post using the optimal provider
   */
  async deletePost(id: string): Promise<boolean> {
    const provider = await this.getOptimalProviderForOperation('write');
    const success = await provider.deletePost(id);
    
    // Sync with other providers if background sync is enabled
    if (success && this.config.syncSettings.backgroundSync) {
      this.syncDelete(id, provider.type);
    }
    
    return success;
  }
  
  /**
   * Get replies for a post from the optimal provider
   */
  async getReplies(postId: string): Promise<ForumPost[]> {
    const provider = await this.getOptimalProviderForOperation('read');
    return provider.getReplies(postId);
  }
  
  /**
   * Get metrics for all providers
   */
  async getAllMetrics(): Promise<Map<string, ForumStorageMetrics>> {
    const updatedMetrics = new Map<string, ForumStorageMetrics>();
    
    for (const [type, provider] of this.providers.entries()) {
      try {
        const metrics = await provider.getMetrics();
        updatedMetrics.set(type, metrics);
      } catch (error) {
        console.error(`Failed to get metrics for provider ${type}:`, error);
        // Keep the old metrics if we can't get new ones
        if (this.metrics.has(type)) {
          updatedMetrics.set(type, this.metrics.get(type)!);
        }
      }
    }
    
    // Update internal metrics cache
    this.metrics = updatedMetrics;
    
    return updatedMetrics;
  }
  
  /**
   * Export data from all providers
   */
  async exportAllData(): Promise<Record<string, string>> {
    const exportData: Record<string, string> = {};
    
    for (const [type, provider] of this.providers.entries()) {
      try {
        const data = await provider.exportData();
        exportData[type] = data;
      } catch (error) {
        console.error(`Failed to export data from provider ${type}:`, error);
      }
    }
    
    return exportData;
  }
  
  /**
   * Import data to all providers
   */
  async importAllData(data: Record<string, string>): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    for (const [type, provider] of this.providers.entries()) {
      if (data[type]) {
        try {
          const success = await provider.importData(data[type]);
          results[type] = success;
        } catch (error) {
          console.error(`Failed to import data to provider ${type}:`, error);
          results[type] = false;
        }
      }
    }
    
    return results;
  }
  
  /**
   * Sync all data between providers
   */
  async syncAll(): Promise<void> {
    const defaultProvider = this.getDefaultProvider();
    const allPosts = await defaultProvider.getAllPosts();
    
    for (const provider of this.providers.values()) {
      if (provider.type === defaultProvider.type) {
        continue; // Skip the source provider
      }
      
      try {
        // Import all posts to the provider
        await provider.importData(JSON.stringify(allPosts));
      } catch (error) {
        console.error(`Failed to sync data to provider ${provider.type}:`, error);
      }
    }
  }
  
  /**
   * Start automatic syncing between providers
   */
  startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    this.syncTimer = setInterval(() => {
      this.syncAll().catch(error => {
        console.error('Auto sync failed:', error);
      });
    }, this.config.syncSettings.syncInterval);
  }
  
  /**
   * Stop automatic syncing
   */
  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }
  
  /**
   * Update configuration
   */
  updateConfig(config: Partial<StorageManagerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      syncSettings: {
        ...this.config.syncSettings,
        ...config.syncSettings
      },
      optimizationSettings: {
        ...this.config.optimizationSettings,
        ...config.optimizationSettings,
        criteria: {
          ...this.config.optimizationSettings.criteria,
          ...config?.optimizationSettings?.criteria
        }
      }
    };
    
    // Restart auto-sync if needed
    if (this.config.syncSettings.autoSync) {
      this.startAutoSync();
    } else {
      this.stopAutoSync();
    }
  }
  
  /**
   * Get the optimal provider for a specific operation
   * Uses AI-driven optimization if enabled
   */
  private async getOptimalProviderForOperation(
    operation: 'read' | 'write', 
    data?: any
  ): Promise<ForumStorageProvider> {
    if (!this.config.optimizationSettings.enabled) {
      return this.getDefaultProvider();
    }
    
    // Update metrics for all providers
    await this.getAllMetrics();
    
    // Calculate scores for each provider
    const scores = new Map<string, number>();
    
    for (const [type, provider] of this.providers.entries()) {
      const metrics = this.metrics.get(type);
      
      if (!metrics) continue;
      
      // Check if the provider is available
      const isAvailable = await provider.isAvailable().catch(() => false);
      
      if (!isAvailable) {
        scores.set(type, 0);
        continue;
      }
      
      // Calculate score based on optimization criteria
      const { criteria } = this.config.optimizationSettings;
      
      // Start with a base score
      let score = 0.5;
      
      // Adjust for speed - localStorage is fastest
      if (provider.type === 'local') {
        score += 0.8 * criteria.speedWeight;
      } else if (provider.type === 'database') {
        score += 0.5 * criteria.speedWeight;
      } else if (provider.type === 'ipfs') {
        score += 0.2 * criteria.speedWeight;
      }
      
      // Adjust for privacy - IPFS with encryption is most private
      if (provider.type === 'ipfs') {
        score += 0.9 * criteria.privacyWeight;
      } else if (provider.type === 'local') {
        score += 0.7 * criteria.privacyWeight;
      } else if (provider.type === 'database') {
        score += 0.4 * criteria.privacyWeight;
      }
      
      // Adjust for cost - localStorage is cheapest
      if (provider.type === 'local') {
        score += 0.9 * criteria.costWeight;
      } else if (provider.type === 'ipfs') {
        score += 0.5 * criteria.costWeight;
      } else if (provider.type === 'database') {
        score += 0.3 * criteria.costWeight;
      }
      
      // Adjust for persistence - IPFS and database are most persistent
      if (provider.type === 'ipfs') {
        score += 0.9 * criteria.persistenceWeight;
      } else if (provider.type === 'database') {
        score += 0.8 * criteria.persistenceWeight;
      } else if (provider.type === 'local') {
        score += 0.2 * criteria.persistenceWeight;
      }
      
      // Additional factors that could be considered:
      // - Data size (for large data, prefer more scalable solutions)
      // - Operation type (reads might prefer different providers than writes)
      // - Network conditions
      // - Battery level (for mobile devices)
      
      // For future AI enhancement, we would pass these metrics to an AI model
      // and let it make the decision based on learned patterns
      
      scores.set(type, score);
    }
    
    // Find the provider with the highest score
    let bestProvider = this.getDefaultProvider();
    let bestScore = 0;
    
    for (const [type, score] of scores.entries()) {
      if (score > bestScore) {
        bestScore = score;
        const provider = this.providers.get(type);
        
        if (provider) {
          bestProvider = provider;
        }
      }
    }
    
    return bestProvider;
  }
  
  /**
   * Sync a post with all providers except the source
   */
  private async syncPost(post: ForumPost, sourceType: string): Promise<void> {
    for (const [type, provider] of this.providers.entries()) {
      if (type === sourceType) {
        continue; // Skip the source provider
      }
      
      try {
        const existingPost = await provider.getPostById(post.id);
        
        if (existingPost) {
          await provider.updatePost(post.id, post);
        } else {
          await provider.savePost(post);
        }
      } catch (error) {
        console.error(`Failed to sync post to provider ${type}:`, error);
      }
    }
  }
  
  /**
   * Sync a delete operation with all providers except the source
   */
  private async syncDelete(id: string, sourceType: string): Promise<void> {
    for (const [type, provider] of this.providers.entries()) {
      if (type === sourceType) {
        continue; // Skip the source provider
      }
      
      try {
        await provider.deletePost(id);
      } catch (error) {
        console.error(`Failed to sync delete to provider ${type}:`, error);
      }
    }
  }
}