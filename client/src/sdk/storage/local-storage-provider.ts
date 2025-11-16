import { ForumPost, ForumStorageMetrics, ForumStorageProvider } from './forum-storage-interface';
import { v4 as uuidv4 } from 'uuid';

/**
 * LocalStorageProvider
 * 
 * Implements the ForumStorageProvider interface using browser's localStorage.
 * This provides immediate functionality while more robust options are implemented.
 */
export class LocalStorageProvider implements ForumStorageProvider {
  readonly name = 'LocalStorage Provider';
  readonly type = 'local' as const;
  
  private storageKey = 'hyperdag_forum_posts';
  private metricsKey = 'hyperdag_forum_metrics';
  private readOps = 0;
  private writeOps = 0;

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
          status: 'active'
        }
      });
    }
  }

  async savePost(post: ForumPost): Promise<ForumPost> {
    try {
      const posts = await this.getAllPosts();
      
      // Generate ID if not provided
      if (!post.id) {
        post.id = uuidv4();
      }
      
      // Set timestamps if not provided
      if (!post.createdAt) {
        post.createdAt = new Date().toISOString();
      }
      post.updatedAt = new Date().toISOString();
      
      // Add the new post
      posts.push(post);
      
      // Save to localStorage
      this.saveToStorage(posts);
      
      // Update metrics
      await this.updateMetricsAfterWrite(posts);
      
      return post;
    } catch (error) {
      console.error('Error saving post to localStorage:', error);
      throw error;
    }
  }

  async getAllPosts(): Promise<ForumPost[]> {
    try {
      const data = localStorage.getItem(this.storageKey);
      this.readOps++;
      
      // Update metrics
      await this.updateMetricsAfterRead();
      
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting posts from localStorage:', error);
      return [];
    }
  }

  async getPostById(id: string): Promise<ForumPost | null> {
    try {
      const posts = await this.getAllPosts();
      const post = posts.find(p => p.id === id);
      
      return post || null;
    } catch (error) {
      console.error('Error getting post by ID from localStorage:', error);
      return null;
    }
  }

  async getPostsByUser(userId: string): Promise<ForumPost[]> {
    try {
      const posts = await this.getAllPosts();
      return posts.filter(p => p.userId === userId);
    } catch (error) {
      console.error('Error getting posts by user from localStorage:', error);
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
      
      // Save to localStorage
      this.saveToStorage(posts);
      
      // Update metrics
      await this.updateMetricsAfterWrite(posts);
      
      return updatedPost;
    } catch (error) {
      console.error('Error updating post in localStorage:', error);
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
      
      // Save to localStorage
      this.saveToStorage(filteredPosts);
      
      // Update metrics
      await this.updateMetricsAfterWrite(filteredPosts);
      
      return true;
    } catch (error) {
      console.error('Error deleting post from localStorage:', error);
      return false;
    }
  }

  async getReplies(postId: string): Promise<ForumPost[]> {
    try {
      const posts = await this.getAllPosts();
      return posts.filter(p => p.parentId === postId);
    } catch (error) {
      console.error('Error getting replies from localStorage:', error);
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
      
      return metrics;
    } catch (error) {
      console.error('Error getting metrics from localStorage:', error);
      return this.createDefaultMetrics();
    }
  }

  async exportData(): Promise<string> {
    try {
      const posts = await this.getAllPosts();
      return JSON.stringify(posts);
    } catch (error) {
      console.error('Error exporting data from localStorage:', error);
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
      
      // Save to localStorage
      this.saveToStorage(posts);
      
      // Update metrics
      await this.updateMetricsAfterWrite(posts);
      
      return true;
    } catch (error) {
      console.error('Error importing data to localStorage:', error);
      return false;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Check if localStorage is available
      const testKey = 'hyperdag_test_storage';
      localStorage.setItem(testKey, 'test');
      const testValue = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      return testValue === 'test';
    } catch (error) {
      console.error('Error checking localStorage availability:', error);
      return false;
    }
  }

  private saveToStorage(posts: ForumPost[]): void {
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
        status: 'active'
      }
    };
  }
}