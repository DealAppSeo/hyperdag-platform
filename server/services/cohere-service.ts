/**
 * Cohere AI Integration Service
 * 
 * Provides advanced text generation, embeddings, and semantic analysis
 * to enhance grant discovery and proposal generation capabilities
 */

import { CohereClient } from 'cohere-ai';

class CohereService {
  private cohere: CohereClient | null = null;
  private isInitialized: boolean = false;

  constructor() {
    if (process.env.COHERE_API_KEY) {
      this.cohere = new CohereClient({
        token: process.env.COHERE_API_KEY,
      });
      this.isInitialized = true;
      console.log('[cohere] Service initialized successfully');
    } else {
      console.warn('[cohere] API key not found, service disabled');
    }
  }

  /**
   * Generate text embeddings for semantic analysis
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (!this.isInitialized || !this.cohere) {
      return [];
    }

    try {
      const response = await this.cohere.embed({
        texts: texts,
        model: 'embed-english-v3.0',
        inputType: 'search_document'
      });

      // Handle different response formats
      if (Array.isArray(response.embeddings)) {
        return response.embeddings as number[][];
      }
      
      return [];
    } catch (error) {
      console.error('[cohere] Embedding generation failed:', error);
      return [];
    }
  }

  /**
   * Calculate semantic similarity between two texts using embeddings
   */
  async calculateSimilarity(text1: string, text2: string): Promise<number> {
    if (!this.isInitialized) {
      return 0;
    }

    try {
      const embeddings = await this.generateEmbeddings([text1, text2]);
      if (embeddings.length < 2) return 0;

      return this.cosineSimilarity(embeddings[0], embeddings[1]);
    } catch (error) {
      console.error('[cohere] Similarity calculation failed:', error);
      return 0;
    }
  }

  /**
   * Enhanced grant matching using Cohere embeddings
   */
  async enhancedGrantMatching(
    projectDescription: string, 
    grantDescriptions: string[]
  ): Promise<Array<{ index: number; similarity: number }>> {
    if (!this.isInitialized || grantDescriptions.length === 0) {
      return [];
    }

    try {
      const allTexts = [projectDescription, ...grantDescriptions];
      const embeddings = await this.generateEmbeddings(allTexts);
      
      if (embeddings.length === 0) return [];

      const projectEmbedding = embeddings[0];
      const matches = [];

      for (let i = 1; i < embeddings.length; i++) {
        const similarity = this.cosineSimilarity(projectEmbedding, embeddings[i]);
        matches.push({
          index: i - 1,
          similarity: similarity
        });
      }

      return matches.sort((a, b) => b.similarity - a.similarity);
    } catch (error) {
      console.error('[cohere] Enhanced matching failed:', error);
      return [];
    }
  }

  /**
   * Generate grant proposal text using Cohere's text generation
   */
  async generateProposal(
    projectDescription: string,
    grantRequirements: string,
    teamInfo: string = ''
  ): Promise<string> {
    if (!this.isInitialized) {
      return '';
    }

    try {
      const prompt = `Write a compelling grant proposal based on the following:

Project Description: ${projectDescription}

Grant Requirements: ${grantRequirements}

Team Information: ${teamInfo}

Create a professional proposal that addresses all requirements and highlights the project's impact and innovation. Focus on:
1. Clear project objectives
2. Technical approach and methodology
3. Expected outcomes and impact
4. Team qualifications
5. Budget justification`;

      const response = await this.cohere!.generate({
        prompt: prompt,
        model: 'command',
        maxTokens: 800,
        temperature: 0.7,
        k: 0,
        stopSequences: [],
        returnLikelihoods: 'NONE'
      });

      return response.generations[0]?.text?.trim() || '';
    } catch (error) {
      console.error('[cohere] Proposal generation failed:', error);
      return '';
    }
  }

  /**
   * Classify and categorize project descriptions
   */
  async classifyProject(projectDescription: string): Promise<{
    categories: string[];
    confidence: number;
    focusAreas: string[];
  }> {
    if (!this.isInitialized) {
      return { categories: [], confidence: 0, focusAreas: [] };
    }

    try {
      const categories = [
        'Technology',
        'Healthcare',
        'Education',
        'Environment',
        'Social Impact',
        'AI/Machine Learning',
        'Blockchain',
        'Sustainability',
        'Research',
        'Innovation'
      ];

      const response = await this.cohere!.classify({
        inputs: [projectDescription],
        examples: [
          { text: 'AI-powered medical diagnosis system', label: 'Healthcare' },
          { text: 'Blockchain carbon tracking platform', label: 'Environment' },
          { text: 'Educational technology for underserved communities', label: 'Education' },
          { text: 'Machine learning research project', label: 'AI/Machine Learning' },
          { text: 'Sustainable energy monitoring system', label: 'Sustainability' }
        ]
      });

      const classification = response.classifications[0];
      const topPrediction = classification?.prediction || '';
      const confidenceItem = classification?.confidences?.find((c: any) => c.label === topPrediction);
      const confidence = confidenceItem?.confidence || 0;

      // Extract focus areas using keyword analysis
      const focusAreas = this.extractFocusAreas(projectDescription);

      return {
        categories: topPrediction ? [topPrediction] : [],
        confidence: confidence,
        focusAreas: focusAreas
      };
    } catch (error) {
      console.error('[cohere] Classification failed:', error);
      return { categories: [], confidence: 0, focusAreas: [] };
    }
  }

  /**
   * Summarize long text content
   */
  async summarizeText(text: string, length: 'short' | 'medium' | 'long' = 'medium'): Promise<string> {
    if (!this.isInitialized) {
      return text.substring(0, 200) + '...';
    }

    try {
      const lengthMap = {
        short: 100,
        medium: 200,
        long: 400
      };

      const response = await this.cohere!.summarize({
        text: text,
        length: length,
        format: 'paragraph',
        model: 'summarize-xlarge',
        additionalCommand: 'Focus on key objectives, methodology, and expected impact.',
        temperature: 0.3
      });

      return response.summary || text.substring(0, lengthMap[length]) + '...';
    } catch (error) {
      console.error('[cohere] Summarization failed:', error);
      return text.substring(0, 200) + '...';
    }
  }

  /**
   * Rerank search results for better relevance
   */
  async rerankGrants(
    query: string,
    grants: Array<{ id: number; name: string; description: string }>
  ): Promise<Array<{ id: number; name: string; description: string; relevanceScore: number }>> {
    if (!this.isInitialized || grants.length === 0) {
      return grants.map(grant => ({ ...grant, relevanceScore: 0 }));
    }

    try {
      const documents = grants.map(grant => `${grant.name}: ${grant.description}`);
      
      const response = await this.cohere!.rerank({
        query: query,
        documents: documents,
        topN: grants.length,
        model: 'rerank-english-v2.0'
      });

      const rerankedResults = response.results.map(result => {
        const originalGrant = grants[result.index];
        return {
          ...originalGrant,
          relevanceScore: result.relevanceScore
        };
      });

      return rerankedResults;
    } catch (error) {
      console.error('[cohere] Reranking failed:', error);
      return grants.map(grant => ({ ...grant, relevanceScore: 0 }));
    }
  }

  /**
   * Extract focus areas from project description
   */
  private extractFocusAreas(text: string): string[] {
    const focusKeywords = {
      'AI/ML': ['artificial intelligence', 'machine learning', 'neural network', 'deep learning', 'ai', 'ml'],
      'Blockchain': ['blockchain', 'cryptocurrency', 'web3', 'smart contract', 'defi', 'nft'],
      'Environment': ['environmental', 'climate', 'carbon', 'sustainability', 'green', 'renewable'],
      'Healthcare': ['medical', 'healthcare', 'health', 'diagnosis', 'treatment', 'patient'],
      'Education': ['education', 'learning', 'student', 'teaching', 'academic', 'school'],
      'Social Impact': ['community', 'social', 'inclusion', 'accessibility', 'equity', 'justice']
    };

    const lowerText = text.toLowerCase();
    const foundAreas = [];

    for (const [area, keywords] of Object.entries(focusKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        foundAreas.push(area);
      }
    }

    return foundAreas;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return this.isInitialized;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      available: this.isInitialized,
      features: {
        embeddings: true,
        textGeneration: true,
        classification: true,
        summarization: true,
        reranking: true
      }
    };
  }
}

export const cohereService = new CohereService();