import { logger } from '../../utils/logger';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

/**
 * Advanced AI Agent System
 * 
 * This service integrates multiple AI providers (Anthropic, OpenAI, etc.) for:
 * 1. Code quality enhancement and self-improvement
 * 2. Security analysis and vulnerability detection
 * 3. AI agent collaboration and knowledge sharing
 * 4. User interaction and assistance
 * 5. System performance optimization
 */
export class AdvancedAIAgentSystem {
  private anthropic: Anthropic | null = null;
  private openai: OpenAI | null = null;
  private isInitialized: boolean = false;
  private capabilities: {
    codeAnalysis: boolean;
    securityScanning: boolean;
    interAgentCommunication: boolean;
    userInteraction: boolean;
    systemOptimization: boolean;
  };

  constructor() {
    this.capabilities = {
      codeAnalysis: false,
      securityScanning: false,
      interAgentCommunication: false,
      userInteraction: false,
      systemOptimization: false,
    };
    this.initialize();
  }

  /**
   * Initialize AI services
   */
  private async initialize() {
    try {
      // Initialize Anthropic if API key is available
      if (process.env.ANTHROPIC_API_KEY) {
        this.anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
          baseURL: "https://anthropic.helicone.ai",
          defaultHeaders: {
            "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`
          }
        });
        this.capabilities.codeAnalysis = true;
        this.capabilities.interAgentCommunication = true;
        logger.info('[advanced-ai] Anthropic initialized successfully');
      } else {
        logger.warn('[advanced-ai] ANTHROPIC_API_KEY not found, Anthropic capabilities disabled');
      }

      // Initialize OpenAI if API key is available
      if (process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        this.capabilities.securityScanning = true;
        this.capabilities.userInteraction = true;
        this.capabilities.systemOptimization = true;
        logger.info('[advanced-ai] OpenAI initialized successfully');
      } else {
        logger.warn('[advanced-ai] OPENAI_API_KEY not found, OpenAI capabilities disabled');
      }

      // Set initialization flag based on whether at least one provider is available
      this.isInitialized = !!(this.anthropic || this.openai);
      
      if (this.isInitialized) {
        logger.info('[advanced-ai] Advanced AI Agent System initialized successfully');
        logger.info(`[advanced-ai] Capabilities: ${JSON.stringify(this.capabilities)}`);
      } else {
        logger.error('[advanced-ai] No AI providers available, system disabled');
      }
    } catch (error) {
      logger.error('[advanced-ai] Failed to initialize AI services:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Analyze code quality and suggest improvements
   */
  public async analyzeCode(codeSnippet: string, language: string): Promise<{
    suggestions: string[];
    securityIssues: string[];
    performanceImprovements: string[];
    quality: 'high' | 'medium' | 'low';
  } | null> {
    if (!this.isInitialized || !this.capabilities.codeAnalysis) {
      logger.warn('[advanced-ai] Code analysis attempted but capability is disabled');
      return null;
    }

    try {
      // Try Anthropic first, fall back to OpenAI
      let provider: Anthropic | null = this.anthropic;
      
      // If first attempt fails, try with the other provider
      if (!provider || !this.capabilities.codeAnalysis) {
        // Use OpenAI for code analysis if Anthropic is not available
        if (this.openai && this.capabilities.systemOptimization) {
          return await this.analyzeCodeWithOpenAI(codeSnippet, language);
        }
        if (!provider) {
          logger.error('[advanced-ai] No AI providers available for code analysis');
          return null;
        }
      }
      
      if (!provider) {
        return null;
      }

      let analysis;
      
      if (provider === this.anthropic) {
        // Use Anthropic for code analysis
        // the newest Anthropic model is "claude-3-7-sonnet-20250219" which was released February 24, 2025
        const response = await this.anthropic.messages.create({
          model: 'claude-3-7-sonnet-20250219',
          max_tokens: 2000,
          system: `You are an expert code reviewer and security analyst. Analyze the provided ${language} code and return a JSON object with these properties:
           - suggestions: array of strings with code quality suggestions
           - securityIssues: array of strings identifying security vulnerabilities
           - performanceImprovements: array of strings suggesting performance optimizations
           - quality: string with value "high", "medium", or "low" indicating overall code quality
           Be specific, thorough but concise.`,
          messages: [
            {
              role: 'user',
              content: `Please analyze this ${language} code:\n\n${codeSnippet}`
            }
          ],
        });
        
        // Handle response format differences in Anthropic API
        if (response.content && response.content.length > 0) {
          const content = response.content[0];
          if (typeof content === 'object' && 'type' in content && content.type === 'text') {
            analysis = JSON.parse(content.text);
          }
        }
      } else if (provider === this.openai) {
        // Use OpenAI for code analysis
        // the newest OpenAI model is "gpt-4o" which was released May 13, 2024
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `You are an expert code reviewer and security analyst. Analyze the provided ${language} code and return a JSON object with these properties:
              - suggestions: array of strings with code quality suggestions
              - securityIssues: array of strings identifying security vulnerabilities
              - performanceImprovements: array of strings suggesting performance optimizations
              - quality: string with value "high", "medium", or "low" indicating overall code quality
              Be specific, thorough but concise.`
            },
            {
              role: 'user',
              content: `Please analyze this ${language} code:\n\n${codeSnippet}`
            }
          ],
        });
        
        const content = response.choices[0].message.content;
        if (content !== null) {
          analysis = JSON.parse(content);
        }
      }

      return analysis || null;
    } catch (error) {
      logger.error('[advanced-ai] Code analysis failed:', error);
      return null;
    }
  }

  /**
   * Scan for security vulnerabilities
   */
  public async scanSecurity(codebase: { fileName: string, content: string }[]): Promise<{
    vulnerabilities: Array<{
      fileName: string;
      lineNumber?: number;
      severity: 'critical' | 'high' | 'medium' | 'low';
      description: string;
      suggestion: string;
    }>;
    overallRisk: 'critical' | 'high' | 'medium' | 'low';
  } | null> {
    if (!this.isInitialized || !this.capabilities.securityScanning) {
      logger.warn('[advanced-ai] Security scanning attempted but capability is disabled');
      return null;
    }

    try {
      // Prefer OpenAI for security scanning as it handles larger contexts better
      const provider = this.openai || this.anthropic;
      
      if (!provider) {
        return null;
      }

      // Prepare codebase summary for scanning
      const codebaseSummary = codebase.map(file => 
        `File: ${file.fileName}\n\n${file.content.substring(0, 1000)}${file.content.length > 1000 ? '...(truncated)' : ''}`
      ).join('\n\n---\n\n');

      let scanResult;
      
      if (provider === this.openai) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `You are a cybersecurity expert specialized in Web3 and blockchain applications. 
              Scan the provided codebase for security vulnerabilities with focus on:
              - Authentication weaknesses
              - Smart contract vulnerabilities
              - Input validation issues
              - Cryptographic flaws
              - Access control problems
              - Data exposure risks
              - Denial of service vectors
              
              Return a JSON object with:
              - vulnerabilities: array of objects with properties:
                - fileName: string
                - lineNumber: number (if identifiable, otherwise omit)
                - severity: string (critical, high, medium, or low)
                - description: string explaining the vulnerability
                - suggestion: string with specific fix recommendation
              - overallRisk: string (critical, high, medium, or low) assessment of the codebase
              
              Be specific and actionable.`
            },
            {
              role: 'user',
              content: `Scan this codebase for security vulnerabilities:\n\n${codebaseSummary}`
            }
          ],
        });
        
        const content = response.choices[0].message.content;
        if (typeof content === 'string') {
          scanResult = JSON.parse(content);
        }
      } else if (provider === this.anthropic) {
        const response = await this.anthropic.messages.create({
          model: 'claude-3-7-sonnet-20250219',
          max_tokens: 3000,
          system: `You are a cybersecurity expert specialized in Web3 and blockchain applications. 
          Scan the provided codebase for security vulnerabilities with focus on:
          - Authentication weaknesses
          - Smart contract vulnerabilities
          - Input validation issues
          - Cryptographic flaws
          - Access control problems
          - Data exposure risks
          - Denial of service vectors
          
          Return a JSON object with:
          - vulnerabilities: array of objects with properties:
            - fileName: string
            - lineNumber: number (if identifiable, otherwise omit)
            - severity: string (critical, high, medium, or low)
            - description: string explaining the vulnerability
            - suggestion: string with specific fix recommendation
          - overallRisk: string (critical, high, medium, or low) assessment of the codebase
          
          Be specific and actionable.`,
          messages: [
            {
              role: 'user',
              content: `Scan this codebase for security vulnerabilities:\n\n${codebaseSummary}`
            }
          ],
        });
        
        // Handle response format
        if (response.content && response.content.length > 0) {
          const content = response.content[0];
          if (typeof content === 'object' && 'type' in content && content.type === 'text') {
            scanResult = JSON.parse(content.text);
          }
        }
      }

      return scanResult || null;
    } catch (error) {
      logger.error('[advanced-ai] Security scanning failed:', error);
      return null;
    }
  }

  /**
   * Generate an architecture improvement plan
   */
  public async generateArchitectureImprovement(
    currentArchitecture: string,
    performanceMetrics: Record<string, any>
  ): Promise<{
    shortTermImprovements: string[];
    longTermImprovements: string[];
    technicalDebtItems: string[];
    architectureDiagram?: string; // ASCII or text-based diagram
  } | null> {
    if (!this.isInitialized || !this.capabilities.systemOptimization) {
      logger.warn('[advanced-ai] Architecture improvement attempted but capability is disabled');
      return null;
    }

    try {
      const provider = this.anthropic || this.openai;
      
      if (!provider) {
        return null;
      }

      let improvementPlan;
      
      if (provider === this.anthropic) {
        const response = await this.anthropic.messages.create({
          model: 'claude-3-7-sonnet-20250219',
          max_tokens: 3000,
          system: `You are an expert software architect specializing in distributed systems, blockchain technology, and AI integration.
          Analyze the current architecture description and performance metrics to generate an improvement plan. 
          Return a JSON object with:
          - shortTermImprovements: array of high-impact improvements that can be implemented quickly
          - longTermImprovements: array of strategic architectural changes for the future
          - technicalDebtItems: array of technical debt issues that should be addressed
          - architectureDiagram: (optional) an ASCII or text-based diagram showing the improved architecture
          
          Focus on scalability, security, maintainability, and performance.`,
          messages: [
            {
              role: 'user',
              content: `Please analyze our current architecture and suggest improvements:\n\nCurrent Architecture:\n${currentArchitecture}\n\nPerformance Metrics:\n${JSON.stringify(performanceMetrics, null, 2)}`
            }
          ],
        });
        
        // Handle response format
        if (response.content && response.content.length > 0) {
          const content = response.content[0];
          if (typeof content === 'object' && 'type' in content && content.type === 'text') {
            improvementPlan = JSON.parse(content.text);
          }
        }
      } else if (provider === this.openai) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `You are an expert software architect specializing in distributed systems, blockchain technology, and AI integration.
              Analyze the current architecture description and performance metrics to generate an improvement plan. 
              Return a JSON object with:
              - shortTermImprovements: array of high-impact improvements that can be implemented quickly
              - longTermImprovements: array of strategic architectural changes for the future
              - technicalDebtItems: array of technical debt issues that should be addressed
              - architectureDiagram: (optional) an ASCII or text-based diagram showing the improved architecture
              
              Focus on scalability, security, maintainability, and performance.`
            },
            {
              role: 'user',
              content: `Please analyze our current architecture and suggest improvements:\n\nCurrent Architecture:\n${currentArchitecture}\n\nPerformance Metrics:\n${JSON.stringify(performanceMetrics, null, 2)}`
            }
          ],
        });
        
        const content = response.choices[0].message.content;
        if (typeof content === 'string') {
          improvementPlan = JSON.parse(content);
        }
      }

      return improvementPlan || null;
    } catch (error) {
      logger.error('[advanced-ai] Architecture improvement failed:', error);
      return null;
    }
  }

  /**
   * Enable AI agents to collaborate and share knowledge
   */
  public async collaborateOnTask(
    taskDescription: string,
    agentSpecialities: string[], // e.g., ['code', 'security', 'performance']
    context: Record<string, any>
  ): Promise<{
    solution: string;
    reasoningProcess: string;
    confidenceScore: number;
    contributingAgents: string[];
  } | null> {
    if (!this.isInitialized || !this.capabilities.interAgentCommunication) {
      logger.warn('[advanced-ai] Agent collaboration attempted but capability is disabled');
      return null;
    }

    try {
      // This would ideally be a multi-step process with agents building on each other's work
      // For now, we'll simulate this with a single advanced model call
      
      const provider = this.anthropic || this.openai;
      
      if (!provider) {
        return null;
      }

      let collaborationResult;
      
      if (provider === this.anthropic) {
        const response = await this.anthropic.messages.create({
          model: 'claude-3-7-sonnet-20250219',
          max_tokens: 4000,
          system: `You are a collective of AI agents with specialties in: ${agentSpecialities.join(', ')}.
          Each agent has deep expertise in its domain. Collaborate to solve the given task by:
          1. Having each specialist analyze the problem from their perspective
          2. Sharing insights between specialists
          3. Iteratively improving the solution based on multi-specialist feedback
          4. Arriving at a consensus solution
          
          Return a JSON object with:
          - solution: detailed solution to the task
          - reasoningProcess: explanation of how the specialists collaborated
          - confidenceScore: number between 0-1 indicating confidence
          - contributingAgents: array of specialists that contributed significantly
          
          Simulate the collaborative process thoroughly.`,
          messages: [
            {
              role: 'user',
              content: `Task: ${taskDescription}\n\nContext: ${JSON.stringify(context, null, 2)}`
            }
          ],
        });
        
        // Handle response format
        if (response.content && response.content.length > 0) {
          const content = response.content[0];
          if (typeof content === 'object' && 'type' in content && content.type === 'text') {
            collaborationResult = JSON.parse(content.text);
          }
        }
      } else if (provider === this.openai) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `You are a collective of AI agents with specialties in: ${agentSpecialities.join(', ')}.
              Each agent has deep expertise in its domain. Collaborate to solve the given task by:
              1. Having each specialist analyze the problem from their perspective
              2. Sharing insights between specialists
              3. Iteratively improving the solution based on multi-specialist feedback
              4. Arriving at a consensus solution
              
              Return a JSON object with:
              - solution: detailed solution to the task
              - reasoningProcess: explanation of how the specialists collaborated
              - confidenceScore: number between 0-1 indicating confidence
              - contributingAgents: array of specialists that contributed significantly
              
              Simulate the collaborative process thoroughly.`
            },
            {
              role: 'user',
              content: `Task: ${taskDescription}\n\nContext: ${JSON.stringify(context, null, 2)}`
            }
          ],
        });
        
        const content = response.choices[0].message.content;
        if (typeof content === 'string') {
          collaborationResult = JSON.parse(content);
        }
      }

      return collaborationResult || null;
    } catch (error) {
      logger.error('[advanced-ai] Agent collaboration failed:', error);
      return null;
    }
  }

  /**
   * Personalized user assistance based on user history and context
   */
  public async generatePersonalizedAssistance(
    userId: number,
    userHistory: {
      pastInteractions: string[];
      knowledgeLevel: 'beginner' | 'intermediate' | 'expert';
      preferences: Record<string, any>;
    },
    currentQuery: string
  ): Promise<{
    response: string;
    suggestedNextSteps: string[];
    relevantResources: string[];
  } | null> {
    if (!this.isInitialized || !this.capabilities.userInteraction) {
      logger.warn('[advanced-ai] Personalized assistance attempted but capability is disabled');
      return null;
    }

    try {
      const provider = this.openai || this.anthropic;
      
      if (!provider) {
        return null;
      }

      let assistanceResult;
      
      if (provider === this.openai) {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o',
          response_format: { type: 'json_object' },
          messages: [
            {
              role: 'system',
              content: `You are a personalized AI assistant for HyperDAG, a Web3 collaborative platform.
              Provide assistance tailored to this specific user based on their history and preferences.
              For users with blockchain/Web3 knowledge level: ${userHistory.knowledgeLevel}.
              
              Return a JSON object with:
              - response: detailed answer to the user's query, matched to their technical level
              - suggestedNextSteps: array of logical next actions the user might take
              - relevantResources: array of specific resources (docs, tools, etc.) that would help
              
              Be conversational yet informative. Avoid jargon for beginners, but be technical for experts.`
            },
            {
              role: 'user',
              content: `User Query: ${currentQuery}\n\nUser History: ${JSON.stringify(userHistory, null, 2)}`
            }
          ],
        });
        
        const content = response.choices[0].message.content;
        if (typeof content === 'string') {
          assistanceResult = JSON.parse(content);
        }
      } else if (provider === this.anthropic) {
        const response = await this.anthropic.messages.create({
          model: 'claude-3-7-sonnet-20250219',
          max_tokens: 2000,
          system: `You are a personalized AI assistant for HyperDAG, a Web3 collaborative platform.
          Provide assistance tailored to this specific user based on their history and preferences.
          For users with blockchain/Web3 knowledge level: ${userHistory.knowledgeLevel}.
          
          Return a JSON object with:
          - response: detailed answer to the user's query, matched to their technical level
          - suggestedNextSteps: array of logical next actions the user might take
          - relevantResources: array of specific resources (docs, tools, etc.) that would help
          
          Be conversational yet informative. Avoid jargon for beginners, but be technical for experts.`,
          messages: [
            {
              role: 'user',
              content: `User Query: ${currentQuery}\n\nUser History: ${JSON.stringify(userHistory, null, 2)}`
            }
          ],
        });
        
        // Handle response format
        if (response.content && response.content.length > 0) {
          const content = response.content[0];
          if (typeof content === 'object' && 'type' in content && content.type === 'text') {
            assistanceResult = JSON.parse(content.text);
          }
        }
      }

      return assistanceResult || null;
    } catch (error) {
      logger.error('[advanced-ai] Personalized assistance failed:', error);
      return null;
    }
  }

  /**
   * Get the status of AI agent capabilities
   */
  public getCapabilitiesStatus(): {
    isInitialized: boolean;
    capabilities: {
      codeAnalysis: boolean;
      securityScanning: boolean;
      interAgentCommunication: boolean;
      userInteraction: boolean;
      systemOptimization: boolean;
    };
    primaryProvider: 'anthropic' | 'openai' | 'none';
  } {
    return {
      isInitialized: this.isInitialized,
      capabilities: this.capabilities,
      primaryProvider: this.anthropic ? 'anthropic' : this.openai ? 'openai' : 'none',
    };
  }
}

// Create singleton instance
export const advancedAIAgentSystem = new AdvancedAIAgentSystem();