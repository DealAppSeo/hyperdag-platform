/**
 * Forum Storage Interface
 * 
 * This interface defines the storage operations required for the forum integration.
 * By abstracting storage operations, we can swap providers without changing application logic.
 */

export interface ForumPost {
  id: string;
  userId: string;
  username: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  likes: number;
  views: number;
  parentId?: string; // For comments/replies
}

export interface ForumStorageMetrics {
  totalPosts: number;
  totalSizeBytes: number;
  lastSyncTimestamp?: string;
  readOperations: number;
  writeOperations: number;
  storageProviderInfo: {
    name: string;
    type: string; // "local", "ipfs", "database", etc.
    status: "active" | "syncing" | "offline";
  };
}

export interface ForumStorageProvider {
  /**
   * Name of the storage provider
   */
  readonly name: string;

  /**
   * Type of storage provider
   */
  readonly type: "local" | "ipfs" | "database" | "custom";

  /**
   * Save a post to storage
   */
  savePost(post: ForumPost): Promise<ForumPost>;

  /**
   * Get all posts
   */
  getAllPosts(): Promise<ForumPost[]>;

  /**
   * Get a post by ID
   */
  getPostById(id: string): Promise<ForumPost | null>;

  /**
   * Get posts by user ID
   */
  getPostsByUser(userId: string): Promise<ForumPost[]>;

  /**
   * Update an existing post
   */
  updatePost(id: string, updates: Partial<ForumPost>): Promise<ForumPost | null>;

  /**
   * Delete a post
   */
  deletePost(id: string): Promise<boolean>;

  /**
   * Get replies/comments for a post
   */
  getReplies(postId: string): Promise<ForumPost[]>;

  /**
   * Get storage metrics
   */
  getMetrics(): Promise<ForumStorageMetrics>;

  /**
   * Export all data
   */
  exportData(): Promise<string>; // Returns JSON string of all data

  /**
   * Import data
   */
  importData(data: string): Promise<boolean>;

  /**
   * Check if the storage provider is available
   */
  isAvailable(): Promise<boolean>;
}