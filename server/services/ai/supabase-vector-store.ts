/**
 * Supabase Vector Database Integration for Semantic RAG
 * Replaces in-memory storage with real vector database using pgvector
 */

import { createClient } from '@supabase/supabase-js';

interface VectorDocument {
  id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, any>;
  domain: string;
  created_at?: string;
}

interface SearchResult {
  id: string;
  content: string;
  metadata: Record<string, any>;
  similarity: number;
}

export class SupabaseVectorStore {
  private supabase: any;
  private tableName = 'semantic_embeddings';

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_ANON_KEY || ''
    );
    
    this.initializeVectorStore();
    console.log('[Supabase Vector] Vector store initialized with pgvector');
  }

  /**
   * Initialize vector store schema if needed
   */
  private async initializeVectorStore() {
    try {
      // Check if table exists and create if needed
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('count(*)')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        console.log('[Supabase Vector] Creating vector table schema...');
        await this.createVectorTable();
      } else {
        console.log('[Supabase Vector] Vector table already exists');
      }
    } catch (error) {
      console.error('[Supabase Vector] Initialization error:', error);
    }
  }

  /**
   * Create vector table with pgvector extension
   */
  private async createVectorTable() {
    // Note: This would typically be done via Supabase SQL editor or migration
    // For now, log the required SQL
    console.log(`
[Supabase Vector] Please run this SQL in your Supabase SQL editor:

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create semantic embeddings table
CREATE TABLE IF NOT EXISTS semantic_embeddings (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI embedding dimension
  metadata JSONB DEFAULT '{}',
  domain TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vector similarity index
CREATE INDEX IF NOT EXISTS semantic_embeddings_embedding_idx 
ON semantic_embeddings USING ivfflat (embedding vector_cosine_ops) 
WITH (lists = 100);

-- Create domain index for filtering
CREATE INDEX IF NOT EXISTS semantic_embeddings_domain_idx 
ON semantic_embeddings (domain);
    `);
  }

  /**
   * Store vector embedding in Supabase
   */
  async storeEmbedding(document: VectorDocument): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .upsert({
          id: document.id,
          content: document.content,
          embedding: JSON.stringify(document.embedding), // Store as JSON string
          metadata: document.metadata,
          domain: document.domain
        });

      if (error) {
        console.error('[Supabase Vector] Store error:', error);
        return false;
      }

      console.log(`[Supabase Vector] Stored embedding for document: ${document.id}`);
      return true;
    } catch (error) {
      console.error('[Supabase Vector] Store exception:', error);
      return false;
    }
  }

  /**
   * Batch store multiple embeddings
   */
  async batchStoreEmbeddings(documents: VectorDocument[]): Promise<number> {
    try {
      const records = documents.map(doc => ({
        id: doc.id,
        content: doc.content,
        embedding: JSON.stringify(doc.embedding),
        metadata: doc.metadata,
        domain: doc.domain
      }));

      const { data, error } = await this.supabase
        .from(this.tableName)
        .upsert(records);

      if (error) {
        console.error('[Supabase Vector] Batch store error:', error);
        return 0;
      }

      console.log(`[Supabase Vector] Batch stored ${documents.length} embeddings`);
      return documents.length;
    } catch (error) {
      console.error('[Supabase Vector] Batch store exception:', error);
      return 0;
    }
  }

  /**
   * Search for similar vectors using pgvector
   */
  async searchSimilar(
    queryEmbedding: number[],
    options: {
      limit?: number;
      threshold?: number;
      domain?: string;
    } = {}
  ): Promise<SearchResult[]> {
    const { limit = 5, threshold = 0.7, domain } = options;

    try {
      // Build the query
      let query = this.supabase.rpc('similarity_search', {
        query_embedding: JSON.stringify(queryEmbedding),
        similarity_threshold: threshold,
        match_count: limit
      });

      // Add domain filter if specified
      if (domain) {
        query = query.eq('domain', domain);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[Supabase Vector] Search error:', error);
        return [];
      }

      const results: SearchResult[] = data.map((row: any) => ({
        id: row.id,
        content: row.content,
        metadata: row.metadata,
        similarity: row.similarity
      }));

      console.log(`[Supabase Vector] Found ${results.length} similar documents`);
      return results;

    } catch (error) {
      console.error('[Supabase Vector] Search exception:', error);
      return [];
    }
  }

  /**
   * Get documents by domain
   */
  async getDocumentsByDomain(domain: string, limit: number = 50): Promise<VectorDocument[]> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('domain', domain)
        .limit(limit);

      if (error) {
        console.error('[Supabase Vector] Domain query error:', error);
        return [];
      }

      return data.map((row: any) => ({
        id: row.id,
        content: row.content,
        embedding: JSON.parse(row.embedding),
        metadata: row.metadata,
        domain: row.domain,
        created_at: row.created_at
      }));

    } catch (error) {
      console.error('[Supabase Vector] Domain query exception:', error);
      return [];
    }
  }

  /**
   * Delete document by ID
   */
  async deleteDocument(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[Supabase Vector] Delete error:', error);
        return false;
      }

      console.log(`[Supabase Vector] Deleted document: ${id}`);
      return true;
    } catch (error) {
      console.error('[Supabase Vector] Delete exception:', error);
      return false;
    }
  }

  /**
   * Update document metadata
   */
  async updateMetadata(id: string, metadata: Record<string, any>): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .update({ metadata })
        .eq('id', id);

      if (error) {
        console.error('[Supabase Vector] Update error:', error);
        return false;
      }

      console.log(`[Supabase Vector] Updated metadata for document: ${id}`);
      return true;
    } catch (error) {
      console.error('[Supabase Vector] Update exception:', error);
      return false;
    }
  }

  /**
   * Get vector store statistics
   */
  async getStats(): Promise<{
    totalDocuments: number;
    domainBreakdown: Record<string, number>;
    recentDocuments: number;
  }> {
    try {
      // Total documents
      const { count: totalDocuments } = await this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true });

      // Domain breakdown
      const { data: domainData } = await this.supabase
        .from(this.tableName)
        .select('domain')
        .group('domain');

      const domainBreakdown: Record<string, number> = {};
      if (domainData) {
        for (const row of domainData) {
          const { count } = await this.supabase
            .from(this.tableName)
            .select('*', { count: 'exact', head: true })
            .eq('domain', row.domain);
          domainBreakdown[row.domain] = count || 0;
        }
      }

      // Recent documents (last 24 hours)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { count: recentDocuments } = await this.supabase
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .gte('created_at', yesterday.toISOString());

      return {
        totalDocuments: totalDocuments || 0,
        domainBreakdown,
        recentDocuments: recentDocuments || 0
      };

    } catch (error) {
      console.error('[Supabase Vector] Stats error:', error);
      return {
        totalDocuments: 0,
        domainBreakdown: {},
        recentDocuments: 0
      };
    }
  }

  /**
   * Health check for vector store
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    message: string;
    connectionTime: number;
  }> {
    const startTime = Date.now();
    
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('count(*)')
        .limit(1);

      const connectionTime = Date.now() - startTime;

      if (error) {
        return {
          status: 'unhealthy',
          message: `Database error: ${error.message}`,
          connectionTime
        };
      }

      return {
        status: 'healthy',
        message: 'Vector store is operational',
        connectionTime
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        message: `Connection failed: ${error}`,
        connectionTime: Date.now() - startTime
      };
    }
  }
}

export const supabaseVectorStore = new SupabaseVectorStore();