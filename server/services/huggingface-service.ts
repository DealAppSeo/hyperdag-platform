/**
 * Hugging Face Integration Service
 * 
 * Provides AI-powered text analysis, embeddings, and semantic matching
 * for enhanced grant discovery and project matching capabilities
 */

import { HfInference } from '@huggingface/inference';

class HuggingFaceService {
  private hf: HfInference;
  private isInitialized: boolean = false;

  constructor() {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      console.warn('[huggingface] API key not found, service disabled');
      return;
    }

    this.hf = new HfInference(apiKey);
    this.isInitialized = true;
    console.log('[huggingface] Service initialized successfully');
  }

  /**
   * Generate AI response using Hugging Face Inference API
   * Cost: $0 (free tier)
   * Speed: Variable
   * Use case: Open models, experimentation
   */
  async generateResponse(prompt: string, options: any = {}): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('Hugging Face service not initialized');
    }

    const startTime = Date.now();
    
    try {
      const model = options.model || 'microsoft/DialoGPT-medium';
      
      const response = await this.hf.textGeneration({
        model,
        inputs: prompt,
        parameters: {
          max_new_tokens: options.maxTokens || 500,
          temperature: options.temperature || 0.7,
          do_sample: true,
          return_full_text: false
        }
      });

      const latency = Date.now() - startTime;
      const content = response.generated_text || '';

      return {
        content,
        latency,
        cost: 0, // Free tier
        provider: 'huggingface',
        model,
        success: true,
        tokens: content.split(' ').length // Rough estimate
      };

    } catch (error) {
      const latency = Date.now() - startTime;
      console.error('[HuggingFace] Generation error:', error.message);
      
      return {
        content: '',
        latency,
        cost: 0,
        provider: 'huggingface',
        model: options.model || 'microsoft/DialoGPT-medium',
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Generate embeddings for text using sentence-transformers model
   */
  async generateEmbeddings(text: string): Promise<number[]> {
    if (!this.isInitialized) {
      throw new Error('Hugging Face service not initialized');
    }

    try {
      const response = await this.hf.featureExtraction({
        model: 'sentence-transformers/all-MiniLM-L6-v2',
        inputs: text
      });

      // Handle different response formats
      if (Array.isArray(response) && Array.isArray(response[0])) {
        return response[0] as number[];
      }
      return response as number[];
    } catch (error) {
      console.error('[huggingface] Embedding generation failed:', error);
      throw new Error('Failed to generate embeddings');
    }
  }

  /**
   * Calculate semantic similarity between two texts using embeddings
   */
  async calculateSimilarity(text1: string, text2: string): Promise<number> {
    try {
      const [embedding1, embedding2] = await Promise.all([
        this.generateEmbeddings(text1),
        this.generateEmbeddings(text2)
      ]);

      return this.cosineSimilarity(embedding1, embedding2);
    } catch (error) {
      console.error('[huggingface] Similarity calculation failed:', error);
      return 0;
    }
  }

  /**
   * Enhanced grant matching using semantic similarity
   */
  async enhancedGrantMatching(projectDescription: string, grantDescriptions: string[]): Promise<Array<{ index: number; similarity: number }>> {
    if (!this.isInitialized) {
      console.warn('[huggingface] Service not available, using fallback matching');
      return [];
    }

    try {
      const projectEmbedding = await this.generateEmbeddings(projectDescription);
      const matches = [];

      for (let i = 0; i < grantDescriptions.length; i++) {
        try {
          const grantEmbedding = await this.generateEmbeddings(grantDescriptions[i]);
          const similarity = this.cosineSimilarity(projectEmbedding, grantEmbedding);
          
          if (similarity > 0.3) { // Threshold for relevance
            matches.push({ index: i, similarity });
          }
        } catch (error) {
          console.warn(`[huggingface] Failed to process grant ${i}:`, error);
        }
      }

      return matches.sort((a, b) => b.similarity - a.similarity);
    } catch (error) {
      console.error('[huggingface] Enhanced matching failed:', error);
      return [];
    }
  }

  /**
   * Extract key topics and categories from text
   */
  async extractTopics(text: string): Promise<string[]> {
    if (!this.isInitialized) {
      return [];
    }

    try {
      // Use a more reliable approach with keyword extraction
      const keywords = [
        'technology', 'healthcare', 'education', 'environment', 'social impact',
        'artificial intelligence', 'ai', 'blockchain', 'sustainability', 'innovation',
        'research', 'community development', 'climate change', 'data science',
        'machine learning', 'web3', 'nonprofit', 'grants', 'funding'
      ];

      const lowerText = text.toLowerCase();
      const foundTopics = keywords.filter(keyword => 
        lowerText.includes(keyword) || lowerText.includes(keyword.replace(' ', ''))
      );

      return foundTopics.slice(0, 5); // Return top 5 matching topics
    } catch (error) {
      console.error('[huggingface] Topic extraction failed:', error);
      return [];
    }
  }

  /**
   * Summarize long text content
   */
  async summarizeText(text: string, maxLength: number = 150): Promise<string> {
    if (!this.isInitialized) {
      return text.substring(0, maxLength) + '...';
    }

    try {
      const response = await this.hf.summarization({
        model: 'facebook/bart-large-cnn',
        inputs: text,
        parameters: {
          max_length: maxLength,
          min_length: 30
        }
      });

      return response.summary_text;
    } catch (error) {
      console.error('[huggingface] Summarization failed:', error);
      return text.substring(0, maxLength) + '...';
    }
  }

  /**
   * Analyze sentiment of text
   */
  async analyzeSentiment(text: string): Promise<{ label: string; score: number }> {
    if (!this.isInitialized) {
      return { label: 'neutral', score: 0.5 };
    }

    try {
      // Use keyword-based sentiment analysis for reliability
      const positiveWords = ['good', 'great', 'excellent', 'amazing', 'positive', 'success', 'innovative', 'effective', 'beneficial', 'promising'];
      const negativeWords = ['bad', 'terrible', 'awful', 'negative', 'failure', 'problematic', 'difficult', 'challenging', 'issues', 'problems'];
      
      const lowerText = text.toLowerCase();
      const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
      const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
      
      if (positiveCount > negativeCount) {
        return { label: 'positive', score: Math.min(0.8, 0.5 + (positiveCount * 0.1)) };
      } else if (negativeCount > positiveCount) {
        return { label: 'negative', score: Math.min(0.8, 0.5 + (negativeCount * 0.1)) };
      } else {
        return { label: 'neutral', score: 0.5 };
      }
    } catch (error) {
      console.error('[huggingface] Sentiment analysis failed:', error);
      return { label: 'neutral', score: 0.5 };
    }
  }

  /**
   * Generate project recommendations based on user interests
   */
  async generateRecommendations(userProfile: string, availableProjects: string[]): Promise<Array<{ index: number; relevance: number; reason: string }>> {
    if (!this.isInitialized || availableProjects.length === 0) {
      return [];
    }

    try {
      const recommendations = [];
      const userTopics = await this.extractTopics(userProfile);
      
      for (let i = 0; i < availableProjects.length; i++) {
        const similarity = await this.calculateSimilarity(userProfile, availableProjects[i]);
        const projectTopics = await this.extractTopics(availableProjects[i]);
        
        const commonTopics = userTopics.filter(topic => projectTopics.includes(topic));
        
        if (similarity > 0.4 || commonTopics.length > 0) {
          recommendations.push({
            index: i,
            relevance: similarity,
            reason: commonTopics.length > 0 
              ? `Matches your interests in: ${commonTopics.join(', ')}`
              : 'High content similarity to your profile'
          });
        }
      }

      return recommendations.sort((a, b) => b.relevance - a.relevance);
    } catch (error) {
      console.error('[huggingface] Recommendation generation failed:', error);
      return [];
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vector dimensions must match');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
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
      models: {
        embeddings: 'sentence-transformers/all-MiniLM-L6-v2',
        classification: 'facebook/bart-large-mnli',
        summarization: 'facebook/bart-large-cnn',
        sentiment: 'cardiffnlp/twitter-roberta-base-sentiment-latest'
      }
    };
  }
}

export const huggingFaceService = new HuggingFaceService();