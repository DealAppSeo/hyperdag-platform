/**
 * StackAI Integration Service
 * 
 * Provides knowledge-enhanced AI capabilities for HyperDAG including:
 * - Knowledge base queries for grant information
 * - Conversation starters for grant discovery
 * - Context-aware responses using HyperDAG documentation
 */

import axios from 'axios';

export interface StackAIQuery {
  query: string;
  context?: string;
  conversationType?: 'grant_discovery' | 'application_help' | 'team_formation' | 'compliance_check';
  knowledgeBase?: string[];
}

export interface StackAIResponse {
  response: string;
  sources: string[];
  confidence: number;
  suggestions: string[];
}

export interface ConversationStarter {
  id: string;
  title: string;
  description: string;
  category: string;
  prompt: string;
}

class StackAIService {
  private apiKey: string | undefined;
  private baseURL: string;
  private knowledgeBaseId: string | undefined;
  private isConfigured: boolean = false;

  constructor() {
    this.apiKey = process.env.STACKAI_API_KEY;
    this.baseURL = 'https://api.stack-ai.com/v1';
    this.knowledgeBaseId = process.env.STACKAI_KNOWLEDGE_BASE_ID;
    this.isConfigured = !!(this.apiKey && this.knowledgeBaseId);
    
    if (this.isConfigured) {
      console.log('[stackai] StackAI service configured successfully');
    } else {
      console.warn('[stackai] StackAI API key or knowledge base ID not configured');
    }
  }

  /**
   * Query StackAI with knowledge base context
   */
  async queryWithKnowledge(query: StackAIQuery): Promise<StackAIResponse> {
    if (!this.isConfigured) {
      return this.generateFallbackResponse(query);
    }

    try {
      const response = await axios.post(`${this.baseURL}/chat/completions`, {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(query.conversationType || 'grant_discovery')
          },
          {
            role: 'user',
            content: this.enrichQueryWithContext(query)
          }
        ],
        knowledge_base_id: this.knowledgeBaseId,
        max_tokens: 1500,
        temperature: 0.3
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        response: response.data.choices[0].message.content,
        sources: response.data.sources || [],
        confidence: response.data.confidence || 0.8,
        suggestions: this.generateSuggestions(query.conversationType)
      };

    } catch (error) {
      console.error('[stackai] Query failed:', error);
      return this.generateFallbackResponse(query);
    }
  }

  /**
   * Get conversation starters for different use cases
   */
  getConversationStarters(): ConversationStarter[] {
    return [
      {
        id: 'grant-discovery-ai',
        title: 'Find AI Research Grants',
        description: 'Discover funding opportunities for AI and machine learning projects',
        category: 'Grant Discovery',
        prompt: 'Find current AI research grants suitable for blockchain integration projects with funding over $100k'
      },
      {
        id: 'application-optimization',
        title: 'Optimize Grant Application',
        description: 'Get AI-powered suggestions to improve your grant proposal',
        category: 'Application Help',
        prompt: 'Review my grant application and suggest improvements based on successful submissions'
      },
      {
        id: 'team-formation',
        title: 'Build Research Team',
        description: 'Find the ideal team composition for your grant project',
        category: 'Team Formation',
        prompt: 'What team roles and expertise do I need for a successful Web3 research grant application?'
      },
      {
        id: 'compliance-check',
        title: 'Check Compliance Requirements',
        description: 'Verify your project meets all grant compliance standards',
        category: 'Compliance',
        prompt: 'What are the compliance requirements for NSF grants involving blockchain technology?'
      },
      {
        id: 'funding-strategy',
        title: 'Develop Funding Strategy',
        description: 'Create a comprehensive funding plan with multiple grant sources',
        category: 'Strategy',
        prompt: 'Create a funding strategy combining multiple grants for a 3-year AI research project'
      },
      {
        id: 'budget-optimization',
        title: 'Optimize Project Budget',
        description: 'Get guidance on budget allocation for maximum grant success',
        category: 'Budget Planning',
        prompt: 'How should I allocate a $500k research budget across team, equipment, and operational costs?'
      }
    ];
  }

  /**
   * Generate context-aware system prompts
   */
  private getSystemPrompt(conversationType: string): string {
    const prompts = {
      grant_discovery: `You are a grant discovery expert with access to comprehensive funding databases. 
        Provide specific, actionable recommendations for grant opportunities based on user queries. 
        Include funding amounts, deadlines, eligibility criteria, and success strategies.`,
      
      application_help: `You are a grant application specialist with knowledge of successful proposals. 
        Analyze applications against best practices and provide specific improvement recommendations. 
        Focus on narrative structure, budget justification, and compliance requirements.`,
      
      team_formation: `You are a research team formation advisor with expertise in collaborative projects. 
        Recommend optimal team compositions based on grant requirements and project goals. 
        Consider skill complementarity, institutional diversity, and track record factors.`,
      
      compliance_check: `You are a regulatory compliance expert for research funding. 
        Provide detailed compliance requirements and verification steps for different funding bodies. 
        Include institutional requirements, reporting obligations, and risk mitigation strategies.`
    };

    return prompts[conversationType] || prompts.grant_discovery;
  }

  /**
   * Enrich user query with relevant context
   */
  private enrichQueryWithContext(query: StackAIQuery): string {
    let enrichedQuery = query.query;

    if (query.context) {
      enrichedQuery += `\n\nContext: ${query.context}`;
    }

    // Add HyperDAG-specific context
    enrichedQuery += `\n\nPlatform Context: This query is from HyperDAG, a decentralized grant discovery and application platform with AI-powered matching, team formation (HyperCrowd), and automated application generation capabilities.`;

    return enrichedQuery;
  }

  /**
   * Generate follow-up suggestions based on conversation type
   */
  private generateSuggestions(conversationType?: string): string[] {
    const suggestions = {
      grant_discovery: [
        'Analyze overlap potential with other funding sources',
        'Check eligibility requirements for your project',
        'Review successful applications in similar categories',
        'Set up automated alerts for new opportunities'
      ],
      application_help: [
        'Review budget allocation recommendations',
        'Check compliance requirements checklist',
        'Analyze similar successful proposals',
        'Schedule application review with team'
      ],
      team_formation: [
        'Browse HyperCrowd member profiles',
        'Create team formation project',
        'Review collaboration agreements',
        'Set up team communication channels'
      ],
      compliance_check: [
        'Download compliance checklist',
        'Schedule institutional review',
        'Verify reporting requirements',
        'Set up compliance monitoring'
      ]
    };

    return suggestions[conversationType || 'grant_discovery'] || suggestions.grant_discovery;
  }

  /**
   * Generate fallback response when StackAI is unavailable
   */
  private generateFallbackResponse(query: StackAIQuery): StackAIResponse {
    const fallbackResponses = {
      grant_discovery: 'Grant discovery services are temporarily using cached data. Please check the live grant discovery features for the most current opportunities.',
      application_help: 'Application assistance is available through our AI analysis tools. Consider using the automated application generation feature.',
      team_formation: 'Team formation recommendations are available through HyperCrowd. Browse member profiles and create collaboration projects.',
      compliance_check: 'Compliance guidance is available through our regulatory database. Check specific funding body requirements.'
    };

    return {
      response: fallbackResponses[query.conversationType || 'grant_discovery'] || 
                'Knowledge-enhanced responses temporarily unavailable. Using standard AI capabilities.',
      sources: [],
      confidence: 0.5,
      suggestions: this.generateSuggestions(query.conversationType)
    };
  }

  /**
   * Update knowledge base with new documents
   */
  async updateKnowledgeBase(documents: { title: string; content: string; category: string }[]): Promise<boolean> {
    if (!this.isConfigured) {
      console.warn('[stackai] Cannot update knowledge base - service not configured');
      return false;
    }

    try {
      const response = await axios.post(`${this.baseURL}/knowledge-base/${this.knowledgeBaseId}/documents`, {
        documents
      }, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('[stackai] Knowledge base updated successfully');
      return response.data.success;

    } catch (error) {
      console.error('[stackai] Knowledge base update failed:', error);
      return false;
    }
  }

  /**
   * Get service status and configuration
   */
  getStatus(): { configured: boolean; knowledgeBase: boolean; features: string[] } {
    return {
      configured: this.isConfigured,
      knowledgeBase: !!this.knowledgeBaseId,
      features: [
        'Knowledge-enhanced queries',
        'Conversation starters',
        'Context-aware responses',
        'Document ingestion',
        'Multi-turn conversations'
      ]
    };
  }

  /**
   * Check if service is ready for use
   */
  isReady(): boolean {
    return this.isConfigured;
  }
}

export const stackAI = new StackAIService();