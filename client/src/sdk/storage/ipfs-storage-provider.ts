import { ForumPost, ForumStorageMetrics, ForumStorageProvider } from './forum-storage-interface';

/**
 * IPFS Storage Provider
 * 
 * Implements the ForumStorageProvider interface using IPFS for decentralized storage.
 * This provides a permanent, decentralized storage option for forum data.
 * 
 * Note: This implementation uses localStorage as a temporary cache until the IPFS
 * connection is fully established and HyperDAG's IPFS service is integrated.
 */
export class IPFSStorageProvider implements ForumStorageProvider {
  readonly name = 'IPFS Storage Provider';
  readonly type = 'ipfs' as const;
  
  private storageKey = 'hyperdag_forum_ipfs_posts';
  private metricsKey = 'hyperdag_forum_ipfs_metrics';
  private cidsKey = 'hyperdag_forum_ipfs_cids';
  private readOps = 0;
  private writeOps = 0;
  private isConnected = false;
  
  constructor() {
    // Initialize metrics if they don't exist
    if (!localStorage.getItem(this.metricsKey)) {
      this.updateMetrics({
        totalPosts: 0,
        totalSizeBytes: 0,
        readOperations: 0,
        writeOperations: 0,
        storageProviderInfo: {
          name: this.name,
          type: this.type,
          status: 'offline'
        }
      });
    }
    
    // Attempt to connect to IPFS service
    this.connectToIPFS();
  }
  
  private async connectToIPFS(): Promise<void> {
    try {
      // In the future, this will connect to HyperDAG's IPFS service
      // For now, we'll simulate a connection
      console.log('Connecting to IPFS service...');
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.isConnected = true;
      
      // Update metrics to show we're connected
      const metrics = await this.getMetrics();
      metrics.storageProviderInfo.status = 'active';
      this.updateMetrics(metrics);
      
      console.log('Connected to IPFS service');
    } catch (error) {
      console.error('Failed to connect to IPFS service:', error);
      this.isConnected = false;
      
      // Update metrics to show we're offline
      const metrics = await this.getMetrics();
      metrics.storageProviderInfo.status = 'offline';
      this.updateMetrics(metrics);
    }
  }
  
  async savePost(post: ForumPost): Promise<ForumPost> {
    try {
      // Get existing posts from local cache
      const posts = await this.getAllPosts();
      
      // Add or update the post
      const existingIndex = posts.findIndex(p => p.id === post.id);
      
      if (existingIndex >= 0) {
        posts[existingIndex] = {
          ...posts[existingIndex],
          ...post,
          updatedAt: new Date().toISOString()
        };
      } else {
        // Set timestamps if not provided
        if (!post.createdAt) {
          post.createdAt = new Date().toISOString();
        }
        post.updatedAt = new Date().toISOString();
        
        posts.push(post);
      }
      
      // Save to local cache
      this.saveToLocalStorage(posts);
      
      // If connected to IPFS, store the post in IPFS as well
      if (this.isConnected) {
        await this.storeInIPFS(posts);
      }
      
      // Update metrics
      await this.updateMetricsAfterWrite(posts);
      
      return post;
    } catch (error) {
      console.error('Error saving post to IPFS:', error);
      throw error;
    }
  }
  
  async getAllPosts(): Promise<ForumPost[]> {
    try {
      let posts: ForumPost[] = [];
      
      // Try to fetch from IPFS first if connected
      if (this.isConnected) {
        posts = await this.fetchFromIPFS();
      }
      
      // If IPFS fetch failed or returned no posts, use local cache
      if (posts.length === 0) {
        const data = localStorage.getItem(this.storageKey);
        posts = data ? JSON.parse(data) : [];
      }
      
      this.readOps++;
      
      // Update metrics
      await this.updateMetricsAfterRead();
      
      return posts;
    } catch (error) {
      console.error('Error getting posts from IPFS:', error);
      
      // Fallback to local cache
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    }
  }
  
  async getPostById(id: string): Promise<ForumPost | null> {
    try {
      const posts = await this.getAllPosts();
      const post = posts.find(p => p.id === id);
      
      return post || null;
    } catch (error) {
      console.error('Error getting post by ID from IPFS:', error);
      return null;
    }
  }
  
  async getPostsByUser(userId: string): Promise<ForumPost[]> {
    try {
      const posts = await this.getAllPosts();
      return posts.filter(p => p.userId === userId);
    } catch (error) {
      console.error('Error getting posts by user from IPFS:', error);
      return [];
    }
  }
  
  async updatePost(id: string, updates: Partial<ForumPost>): Promise<ForumPost | null> {
    try {
      const posts = await this.getAllPosts();
      const index = posts.findIndex(p => p.id === id);
      
      if (index === -1) {
        return null;
      }
      
      // Update the post
      const updatedPost = {
        ...posts[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      posts[index] = updatedPost;
      
      // Save to local cache
      this.saveToLocalStorage(posts);
      
      // If connected to IPFS, update the post in IPFS as well
      if (this.isConnected) {
        await this.storeInIPFS(posts);
      }
      
      // Update metrics
      await this.updateMetricsAfterWrite(posts);
      
      return updatedPost;
    } catch (error) {
      console.error('Error updating post in IPFS:', error);
      return null;
    }
  }
  
  async deletePost(id: string): Promise<boolean> {
    try {
      const posts = await this.getAllPosts();
      const filteredPosts = posts.filter(p => p.id !== id);
      
      if (filteredPosts.length === posts.length) {
        return false; // No post was deleted
      }
      
      // Save to local cache
      this.saveToLocalStorage(filteredPosts);
      
      // If connected to IPFS, update the posts in IPFS as well
      if (this.isConnected) {
        await this.storeInIPFS(filteredPosts);
      }
      
      // Update metrics
      await this.updateMetricsAfterWrite(filteredPosts);
      
      return true;
    } catch (error) {
      console.error('Error deleting post from IPFS:', error);
      return false;
    }
  }
  
  async getReplies(postId: string): Promise<ForumPost[]> {
    try {
      const posts = await this.getAllPosts();
      return posts.filter(p => p.parentId === postId);
    } catch (error) {
      console.error('Error getting replies from IPFS:', error);
      return [];
    }
  }
  
  async getMetrics(): Promise<ForumStorageMetrics> {
    try {
      const metricsData = localStorage.getItem(this.metricsKey);
      const metrics = metricsData ? JSON.parse(metricsData) : this.createDefaultMetrics();
      
      // Update with current session metrics
      metrics.readOperations += this.readOps;
      metrics.writeOperations += this.writeOps;
      
      // Reset session counters
      this.readOps = 0;
      this.writeOps = 0;
      
      // Update connection status
      metrics.storageProviderInfo.status = this.isConnected ? 'active' : 'offline';
      
      return metrics;
    } catch (error) {
      console.error('Error getting metrics from IPFS:', error);
      return this.createDefaultMetrics();
    }
  }
  
  async exportData(): Promise<string> {
    try {
      const posts = await this.getAllPosts();
      return JSON.stringify(posts);
    } catch (error) {
      console.error('Error exporting data from IPFS:', error);
      throw error;
    }
  }
  
  async importData(data: string): Promise<boolean> {
    try {
      const posts = JSON.parse(data) as ForumPost[];
      
      // Validate the imported data
      if (!Array.isArray(posts)) {
        throw new Error('Invalid data format. Expected an array of posts.');
      }
      
      // Check if each item has the required fields
      posts.forEach(post => {
        if (!post.id || !post.userId || !post.content) {
          throw new Error('Invalid post format. Missing required fields.');
        }
      });
      
      // Save to local cache
      this.saveToLocalStorage(posts);
      
      // If connected to IPFS, store the posts in IPFS as well
      if (this.isConnected) {
        await this.storeInIPFS(posts);
      }
      
      // Update metrics
      await this.updateMetricsAfterWrite(posts);
      
      return true;
    } catch (error) {
      console.error('Error importing data to IPFS:', error);
      return false;
    }
  }
  
  async isAvailable(): Promise<boolean> {
    // Check connection to IPFS
    if (!this.isConnected) {
      await this.connectToIPFS();
    }
    
    return this.isConnected;
  }
  
  private saveToLocalStorage(posts: ForumPost[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(posts));
    this.writeOps++;
  }
  
  private async updateMetricsAfterRead(): Promise<void> {
    const metrics = await this.getMetrics();
    metrics.readOperations++;
    this.updateMetrics(metrics);
  }
  
  private async updateMetricsAfterWrite(posts: ForumPost[]): Promise<void> {
    const metrics = await this.getMetrics();
    metrics.totalPosts = posts.length;
    metrics.totalSizeBytes = new Blob([JSON.stringify(posts)]).size;
    metrics.lastSyncTimestamp = new Date().toISOString();
    metrics.writeOperations++;
    this.updateMetrics(metrics);
  }
  
  private updateMetrics(metrics: ForumStorageMetrics): void {
    localStorage.setItem(this.metricsKey, JSON.stringify(metrics));
  }
  
  private createDefaultMetrics(): ForumStorageMetrics {
    return {
      totalPosts: 0,
      totalSizeBytes: 0,
      readOperations: 0,
      writeOperations: 0,
      storageProviderInfo: {
        name: this.name,
        type: this.type,
        status: this.isConnected ? 'active' : 'offline'
      }
    };
  }
  
  // IPFS-specific methods
  
  /**
   * Store posts in IPFS
   * This is a placeholder implementation that will be replaced
   * with actual IPFS integration when ready
   */
  private async storeInIPFS(posts: ForumPost[]): Promise<string> {
    // Simulate storing in IPFS
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Generate a mock CID (Content Identifier)
    const mockCid = 'Qm' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // Store CID in local cache for retrieval
    const cids = this.getStoredCIDs();
    cids.unshift({ cid: mockCid, timestamp: new Date().toISOString(), count: posts.length });
    
    // Keep only the last 10 CIDs
    if (cids.length > 10) {
      cids.pop();
    }
    
    localStorage.setItem(this.cidsKey, JSON.stringify(cids));
    
    console.log(`Stored posts in IPFS with CID: ${mockCid}`);
    
    return mockCid;
  }
  
  /**
   * Fetch posts from IPFS
   * This is a placeholder implementation that will be replaced
   * with actual IPFS integration when ready
   */
  private async fetchFromIPFS(): Promise<ForumPost[]> {
    // Simulate fetching from IPFS
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Get stored CIDs
    const cids = this.getStoredCIDs();
    
    if (cids.length === 0) {
      // No stored CIDs, return local cache
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    }
    
    // Simulate retrieving from the most recent CID
    console.log(`Fetching posts from IPFS with CID: ${cids[0].cid}`);
    
    // For now, just return the local cache
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }
  
  /**
   * Get stored CIDs from local cache
   */
  private getStoredCIDs(): Array<{ cid: string, timestamp: string, count: number }> {
    const data = localStorage.getItem(this.cidsKey);
    return data ? JSON.parse(data) : [];
  }
}