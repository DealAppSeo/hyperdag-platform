import { ForumStorageManager } from './storage/forum-storage-manager';
import { LocalStorageProvider } from './storage/local-storage-provider';
import { IPFSStorageProvider } from './storage/ipfs-storage-provider';
import { ForumPost, ForumStorageProvider } from './storage/forum-storage-interface';

/**
 * HyperDAG Forum Integration SDK
 * 
 * This SDK provides a simple interface for integrating HyperDAG's forum storage
 * with external platforms like Lovable.dev.
 * 
 * Features:
 * - Multi-provider storage with automatic fallback
 * - AI-optimized resource utilization
 * - Import/export functionality
 * - Metrics for storage performance
 */
export class HyperDAGForumSDK {
  private static instance: HyperDAGForumSDK;
  private storageManager: ForumStorageManager;
  
  private constructor() {
    // Initialize the storage manager with default settings
    this.storageManager = new ForumStorageManager({
      defaultProvider: 'local',
      syncSettings: {
        autoSync: true,
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
      }
    });
    
    // Register available storage providers
    this.storageManager.registerProvider(new LocalStorageProvider());
    
    // Register IPFS provider if available
    const ipfsProvider = new IPFSStorageProvider();
    this.storageManager.registerProvider(ipfsProvider);
    
    console.log('HyperDAG Forum SDK initialized with multiple storage providers');
  }
  
  /**
   * Get the SDK instance (singleton)
   */
  public static getInstance(): HyperDAGForumSDK {
    if (!HyperDAGForumSDK.instance) {
      HyperDAGForumSDK.instance = new HyperDAGForumSDK();
    }
    
    return HyperDAGForumSDK.instance;
  }
  
  /**
   * Save a forum post
   */
  async savePost(post: ForumPost): Promise<ForumPost> {
    return this.storageManager.savePost(post);
  }
  
  /**
   * Get all forum posts
   */
  async getAllPosts(): Promise<ForumPost[]> {
    return this.storageManager.getAllPosts();
  }
  
  /**
   * Get a post by ID
   */
  async getPostById(id: string): Promise<ForumPost | null> {
    return this.storageManager.getPostById(id);
  }
  
  /**
   * Get posts by user ID
   */
  async getPostsByUser(userId: string): Promise<ForumPost[]> {
    return this.storageManager.getPostsByUser(userId);
  }
  
  /**
   * Update a post
   */
  async updatePost(id: string, updates: Partial<ForumPost>): Promise<ForumPost | null> {
    return this.storageManager.updatePost(id, updates);
  }
  
  /**
   * Delete a post
   */
  async deletePost(id: string): Promise<boolean> {
    return this.storageManager.deletePost(id);
  }
  
  /**
   * Get replies for a post
   */
  async getReplies(postId: string): Promise<ForumPost[]> {
    return this.storageManager.getReplies(postId);
  }
  
  /**
   * Get storage metrics for all providers
   */
  async getStorageMetrics(): Promise<Record<string, any>> {
    const metricsMap = await this.storageManager.getAllMetrics();
    const metrics: Record<string, any> = {};
    
    metricsMap.forEach((value, key) => {
      metrics[key] = value;
    });
    
    return metrics;
  }
  
  /**
   * Export all forum data
   */
  async exportData(): Promise<string> {
    const exportData = await this.storageManager.exportAllData();
    return JSON.stringify(exportData);
  }
  
  /**
   * Import forum data
   */
  async importData(data: string): Promise<boolean> {
    try {
      const parsedData = JSON.parse(data);
      const results = await this.storageManager.importAllData(parsedData);
      
      // Return true if at least one provider successfully imported the data
      return Object.values(results).some(result => result === true);
    } catch (error) {
      console.error('Error importing forum data:', error);
      return false;
    }
  }
  
  /**
   * Sync data between all providers
   */
  async syncData(): Promise<void> {
    return this.storageManager.syncAll();
  }
  
  /**
   * Get all available storage providers
   */
  getAvailableProviders(): string[] {
    return this.storageManager.getProviders().map(provider => provider.type);
  }
  
  /**
   * Update storage optimization settings
   */
  updateOptimizationSettings(settings: any): void {
    this.storageManager.updateConfig({
      optimizationSettings: settings
    });
  }
}

// Export a default instance for easy import
const forumSDK = HyperDAGForumSDK.getInstance();
export default forumSDK;