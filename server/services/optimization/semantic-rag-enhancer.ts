/**
 * Semantic RAG Enhancement System
 * Advanced retrieval-augmented generation with vector embeddings and knowledge graphs
 */

import axios from 'axios';

interface VectorEmbedding {
  vector: number[];
  metadata: Record<string, any>;
  text: string;
  similarity?: number;
}

interface KnowledgeNode {
  id: string;
  label: string;
  type: 'entity' | 'concept' | 'relation' | 'fact';
  properties: Record<string, any>;
  connections: string[];
}

interface SemanticQuery {
  query: string;
  context?: string;
  domain?: string;
  maxResults?: number;
  threshold?: number;
}

interface RAGResponse {
  answer: string;
  sources: VectorEmbedding[];
  confidence: number;
  reasoning: string;
  knowledgeGraph?: KnowledgeNode[];
}

export class SemanticRAGEnhancer {
  private vectorStore: Map<string, VectorEmbedding[]> = new Map();
  private knowledgeGraph: Map<string, KnowledgeNode> = new Map();
  private embeddingDimension = 1536; // OpenAI text-embedding-3-small dimension
  private similarityThreshold = 0.7;

  constructor() {
    // ⚠️ BLOAT PURGE: Only initialize if explicitly enabled
    // Re-enable by setting: ENABLE_SEMANTIC_RAG=true in .env
    if (process.env.ENABLE_SEMANTIC_RAG === 'true') {
      this.initializeVectorStore();
      this.buildKnowledgeGraph();
      console.log('[Semantic RAG] ✅ Auto-initialization ENABLED');
    } else {
      console.log('[Semantic RAG] ⚙️  Auto-initialization DISABLED (reduce server load)');
    }
  }

  private async initializeVectorStore() {
    // Initialize with AI/Web3 domain knowledge
    const domains = [
      'artificial_intelligence',
      'blockchain_technology', 
      'machine_learning',
      'web3_infrastructure',
      'smart_contracts',
      'decentralized_systems',
      'neural_networks',
      'natural_language_processing',
      'computer_vision',
      'reinforcement_learning'
    ];

    for (const domain of domains) {
      await this.populateDomainKnowledge(domain);
    }

    console.log(`[Semantic RAG] Vector store initialized with ${this.vectorStore.size} domains`);
  }

  private async populateDomainKnowledge(domain: string) {
    const embeddings: VectorEmbedding[] = [];

    // Generate synthetic knowledge for demonstration
    // In production, this would be populated from actual documents/APIs
    const knowledgeItems = this.generateDomainKnowledge(domain);

    for (const item of knowledgeItems) {
      const embedding = await this.generateEmbedding(item.text);
      embeddings.push({
        vector: embedding,
        text: item.text,
        metadata: {
          domain,
          category: item.category,
          confidence: item.confidence,
          source: item.source
        }
      });
    }

    this.vectorStore.set(domain, embeddings);
  }

  private generateDomainKnowledge(domain: string) {
    const knowledge = {
      artificial_intelligence: [
        {
          text: "ANFIS (Adaptive Neuro-Fuzzy Inference System) combines neural networks with fuzzy logic for adaptive learning and decision making.",
          category: "algorithms",
          confidence: 0.95,
          source: "academic_papers"
        },
        {
          text: "Reinforcement Learning from AI Feedback (RLAIF) uses AI systems to provide feedback for training other AI systems, reducing human annotation requirements.",
          category: "training_methods", 
          confidence: 0.92,
          source: "research_papers"
        },
        {
          text: "Semantic routing in AI systems uses vector embeddings to match queries with the most appropriate AI provider based on capability vectors.",
          category: "system_architecture",
          confidence: 0.88,
          source: "technical_documentation"
        }
      ],
      blockchain_technology: [
        {
          text: "Zero-Knowledge Proofs (ZKPs) enable verification of information without revealing the underlying data, crucial for privacy-preserving blockchain applications.",
          category: "cryptography",
          confidence: 0.96,
          source: "whitepaper"
        },
        {
          text: "Directed Acyclic Graphs (DAGs) provide scalable alternatives to traditional blockchain architectures with faster transaction processing.",
          category: "consensus_mechanisms",
          confidence: 0.90,
          source: "technical_specifications"
        }
      ],
      machine_learning: [
        {
          text: "Mutual information optimization maximizes the shared information between task characteristics and provider capabilities for optimal AI routing.",
          category: "optimization",
          confidence: 0.87,
          source: "research_implementation"
        },
        {
          text: "Fractal network optimization reduces computational complexity through self-similar patterns, achieving 20-50% efficiency gains.",
          category: "network_optimization",
          confidence: 0.85,
          source: "experimental_results"
        }
      ]
    };

    return knowledge[domain as keyof typeof knowledge] || [];
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    try {
      // Use OpenAI's embedding API for real semantic embeddings
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: text,
          model: 'text-embedding-3-small',
          encoding_format: 'float'
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI embedding failed: ${response.statusText}`);
      }

      const data = await response.json();
      const embedding = data.data[0].embedding;
      
      console.log(`[Semantic RAG] Generated real OpenAI embedding for text length: ${text.length}`);
      return embedding;
      
    } catch (error) {
      console.error('[Semantic RAG] Real embedding generation failed, falling back to synthetic:', error);
      
      // Fallback to synthetic embedding if OpenAI fails
      const embedding = new Array(this.embeddingDimension);
      const hash = this.hashString(text);
      const random = this.seededRandom(hash);
      
      for (let i = 0; i < this.embeddingDimension; i++) {
        embedding[i] = (random() - 0.5) * 2;
      }
      
      const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      return embedding.map(val => val / magnitude);
    }
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private seededRandom(seed: number) {
    let state = seed;
    return () => {
      state = (state * 1664525 + 1013904223) % 4294967296;
      return state / 4294967296;
    };
  }

  private buildKnowledgeGraph() {
    const nodes: KnowledgeNode[] = [
      {
        id: 'anfis',
        label: 'ANFIS',
        type: 'concept',
        properties: { description: 'Adaptive Neuro-Fuzzy Inference System', domain: 'AI' },
        connections: ['neural_networks', 'fuzzy_logic', 'machine_learning']
      },
      {
        id: 'neural_networks',
        label: 'Neural Networks',
        type: 'concept', 
        properties: { description: 'Interconnected processing nodes mimicking brain neurons', domain: 'AI' },
        connections: ['anfis', 'deep_learning', 'backpropagation']
      },
      {
        id: 'fuzzy_logic',
        label: 'Fuzzy Logic',
        type: 'concept',
        properties: { description: 'Multi-valued logic dealing with partial truth', domain: 'AI' },
        connections: ['anfis', 'uncertainty_handling', 'decision_systems']
      },
      {
        id: 'reinforcement_learning',
        label: 'Reinforcement Learning',
        type: 'concept',
        properties: { description: 'Learning through reward-based feedback', domain: 'AI' },
        connections: ['rlaif', 'q_learning', 'policy_optimization']
      },
      {
        id: 'rlaif',
        label: 'RLAIF',
        type: 'concept',
        properties: { description: 'Reinforcement Learning from AI Feedback', domain: 'AI' },
        connections: ['reinforcement_learning', 'ai_feedback', 'training_optimization']
      },
      {
        id: 'blockchain',
        label: 'Blockchain',
        type: 'concept',
        properties: { description: 'Distributed ledger technology', domain: 'Web3' },
        connections: ['zkp', 'smart_contracts', 'decentralization']
      },
      {
        id: 'zkp',
        label: 'Zero-Knowledge Proofs',
        type: 'concept',
        properties: { description: 'Cryptographic method for privacy-preserving verification', domain: 'Cryptography' },
        connections: ['blockchain', 'privacy', 'cryptography']
      }
    ];

    for (const node of nodes) {
      this.knowledgeGraph.set(node.id, node);
    }

    console.log(`[Knowledge Graph] Initialized with ${this.knowledgeGraph.size} nodes`);
  }

  /**
   * Perform semantic retrieval and generate augmented response
   */
  async query(semanticQuery: SemanticQuery): Promise<RAGResponse> {
    try {
      console.log(`[Semantic RAG] Processing query: "${semanticQuery.query}"`);

      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(semanticQuery.query);

      // Retrieve relevant context
      const relevantSources = await this.retrieveRelevantSources(
        queryEmbedding, 
        semanticQuery.domain,
        semanticQuery.maxResults || 5,
        semanticQuery.threshold || this.similarityThreshold
      );

      // Extract related knowledge graph nodes
      const relatedNodes = this.extractRelatedKnowledgeNodes(semanticQuery.query);

      // Generate augmented response
      const response = await this.generateAugmentedResponse(
        semanticQuery.query,
        relevantSources,
        relatedNodes,
        semanticQuery.context
      );

      return {
        answer: response.answer,
        sources: relevantSources,
        confidence: response.confidence,
        reasoning: response.reasoning,
        knowledgeGraph: relatedNodes
      };

    } catch (error) {
      console.error('[Semantic RAG] Query processing failed:', error);
      return {
        answer: 'I apologize, but I encountered an error processing your query. Please try again.',
        sources: [],
        confidence: 0,
        reasoning: 'Error in semantic processing pipeline',
        knowledgeGraph: []
      };
    }
  }

  private async retrieveRelevantSources(
    queryEmbedding: number[], 
    domain?: string,
    maxResults = 5,
    threshold = 0.7
  ): Promise<VectorEmbedding[]> {
    const allEmbeddings: VectorEmbedding[] = [];

    // Collect embeddings from relevant domains
    const searchDomains = domain ? [domain] : Array.from(this.vectorStore.keys());
    
    for (const searchDomain of searchDomains) {
      const domainEmbeddings = this.vectorStore.get(searchDomain) || [];
      allEmbeddings.push(...domainEmbeddings);
    }

    // Calculate similarities
    for (const embedding of allEmbeddings) {
      embedding.similarity = this.cosineSimilarity(queryEmbedding, embedding.vector);
    }

    // Filter and sort by similarity
    return allEmbeddings
      .filter(e => e.similarity! >= threshold)
      .sort((a, b) => b.similarity! - a.similarity!)
      .slice(0, maxResults);
  }

  private cosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      return 0;
    }

    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      magnitudeA += vectorA[i] * vectorA[i];
      magnitudeB += vectorB[i] * vectorB[i];
    }

    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);

    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }

    return dotProduct / (magnitudeA * magnitudeB);
  }

  private extractRelatedKnowledgeNodes(query: string): KnowledgeNode[] {
    const queryLower = query.toLowerCase();
    const relatedNodes: KnowledgeNode[] = [];

    for (const [id, node] of Array.from(this.knowledgeGraph.entries())) {
      // Check if node is relevant to query
      const relevantTerms = [
        node.label.toLowerCase(),
        node.properties.description?.toLowerCase() || '',
        ...Object.values(node.properties).map(v => String(v).toLowerCase())
      ];

      const isRelevant = relevantTerms.some(term => 
        queryLower.includes(term) || term.includes(queryLower) ||
        this.semanticSimilarity(queryLower, term) > 0.3
      );

      if (isRelevant) {
        relatedNodes.push(node);
      }
    }

    // Add connected nodes for broader context
    const connectedNodes: Set<string> = new Set();
    for (const node of relatedNodes) {
      for (const connectionId of node.connections) {
        connectedNodes.add(connectionId);
      }
    }

    for (const nodeId of Array.from(connectedNodes)) {
      const node = this.knowledgeGraph.get(nodeId);
      if (node && !relatedNodes.some(n => n.id === nodeId)) {
        relatedNodes.push(node);
      }
    }

    return relatedNodes.slice(0, 10); // Limit to top 10 most relevant
  }

  private semanticSimilarity(str1: string, str2: string): number {
    // Simple semantic similarity based on common words
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = new Set([...words1, ...words2]).size;
    
    return commonWords.length / totalWords;
  }

  private async generateAugmentedResponse(
    query: string,
    sources: VectorEmbedding[],
    knowledgeNodes: KnowledgeNode[],
    context?: string
  ) {
    // Construct augmented context from sources
    const contextText = sources
      .map((source, index) => `[Source ${index + 1}]: ${source.text} (Confidence: ${(source.similarity! * 100).toFixed(1)}%)`)
      .join('\n\n');

    const knowledgeContext = knowledgeNodes
      .map(node => `${node.label}: ${node.properties.description}`)
      .join(', ');

    // Generate response based on retrieved context
    let answer = '';
    let reasoning = '';
    let confidence = 0;

    if (sources.length > 0) {
      // Extract key information from sources
      const keyPoints = this.extractKeyPoints(sources, query);
      answer = this.synthesizeAnswer(query, keyPoints, knowledgeContext);
      reasoning = this.generateReasoning(keyPoints, sources);
      confidence = this.calculateConfidence(sources, keyPoints);
    } else {
      answer = "I don't have sufficient information in my knowledge base to provide a comprehensive answer to your query.";
      reasoning = "No relevant sources found above the similarity threshold.";
      confidence = 0;
    }

    return {
      answer,
      reasoning,
      confidence
    };
  }

  private extractKeyPoints(sources: VectorEmbedding[], query: string): string[] {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const keyPoints: string[] = [];

    for (const source of sources) {
      const sentences = source.text.split(/[.!?]+/);
      for (const sentence of sentences) {
        const sentenceLower = sentence.toLowerCase();
        const relevantTermCount = queryTerms.filter(term => 
          sentenceLower.includes(term)
        ).length;

        if (relevantTermCount >= 1 && sentence.trim().length > 10) {
          keyPoints.push(sentence.trim());
        }
      }
    }

    return keyPoints.slice(0, 5); // Top 5 most relevant points
  }

  private synthesizeAnswer(query: string, keyPoints: string[], knowledgeContext: string): string {
    if (keyPoints.length === 0) {
      return "I couldn't find specific information to answer your query comprehensively.";
    }

    let answer = "Based on my knowledge base, here's what I can tell you:\n\n";
    
    keyPoints.forEach((point, index) => {
      answer += `${index + 1}. ${point}\n`;
    });

    if (knowledgeContext) {
      answer += `\nRelated concepts: ${knowledgeContext}`;
    }

    return answer;
  }

  private generateReasoning(keyPoints: string[], sources: VectorEmbedding[]): string {
    const avgSimilarity = sources.reduce((sum, s) => sum + s.similarity!, 0) / sources.length;
    const domainSpread = new Set(sources.map(s => s.metadata.domain)).size;

    let reasoning = `Retrieved ${sources.length} relevant sources with average similarity of ${(avgSimilarity * 100).toFixed(1)}%. `;
    reasoning += `Information spans ${domainSpread} domain(s). `;
    reasoning += `Extracted ${keyPoints.length} key points for synthesis.`;

    return reasoning;
  }

  private calculateConfidence(sources: VectorEmbedding[], keyPoints: string[]): number {
    if (sources.length === 0 || keyPoints.length === 0) {
      return 0;
    }

    const avgSimilarity = sources.reduce((sum, s) => sum + s.similarity!, 0) / sources.length;
    const sourceQuality = sources.reduce((sum, s) => sum + (s.metadata.confidence || 0.5), 0) / sources.length;
    const completeness = Math.min(keyPoints.length / 3, 1); // Assume 3 key points is complete

    return (avgSimilarity * 0.4 + sourceQuality * 0.4 + completeness * 0.2);
  }

  /**
   * Add new knowledge to the vector store
   */
  async addKnowledge(domain: string, text: string, metadata: Record<string, any>) {
    const embedding = await this.generateEmbedding(text);
    const vectorEmbedding: VectorEmbedding = {
      vector: embedding,
      text,
      metadata: { domain, ...metadata }
    };

    if (!this.vectorStore.has(domain)) {
      this.vectorStore.set(domain, []);
    }

    this.vectorStore.get(domain)!.push(vectorEmbedding);
    console.log(`[Semantic RAG] Added knowledge to domain: ${domain}`);
  }

  /**
   * Get system statistics
   */
  getSystemStats() {
    const totalEmbeddings = Array.from(this.vectorStore.values())
      .reduce((sum, embeddings) => sum + embeddings.length, 0);

    return {
      domains: Array.from(this.vectorStore.keys()),
      totalEmbeddings,
      knowledgeGraphNodes: this.knowledgeGraph.size,
      embeddingDimension: this.embeddingDimension,
      similarityThreshold: this.similarityThreshold
    };
  }
}

export const semanticRAG = new SemanticRAGEnhancer();