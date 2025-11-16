import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { logger } from "../../utils/logger";

/**
 * AI Workflow Service
 * 
 * Provides orchestrated AI capabilities with redundancy across multiple providers
 * Simpler implementation than full LangGraph but achieves similar reliability
 */
export class AIWorkflowService {
  private openaiModel: ChatOpenAI | null = null;
  private anthropicModel: ChatAnthropic | null = null;
  private isConfigured: boolean = false;

  constructor() {
    try {
      // Initialize OpenAI if API key is available
      if (process.env.OPENAI_API_KEY) {
        this.openaiModel = new ChatOpenAI({
          modelName: "gpt-4o", // The newest OpenAI model
          temperature: 0,
          maxTokens: 4000,
        });
      }

      // Initialize Anthropic if API key is available
      if (process.env.ANTHROPIC_API_KEY) {
        this.anthropicModel = new ChatAnthropic({
          modelName: "claude-3-7-sonnet-20250219", // The newest Claude model
          temperature: 0,
          maxTokens: 4000,
        });
      }

      // Check if at least one model is configured
      if (this.openaiModel || this.anthropicModel) {
        this.isConfigured = true;
        logger.info("[AIWorkflowService] Initialized successfully with providers:", {
          openai: !!this.openaiModel,
          anthropic: !!this.anthropicModel
        });
      } else {
        logger.warn("[AIWorkflowService] No AI providers configured - service will be limited");
      }
    } catch (error) {
      logger.error("[AIWorkflowService] Initialization error:", error);
    }
  }

  /**
   * Analyzes code for security vulnerabilities with provider redundancy
   */
  public async analyzeCodeSecurity(code: string): Promise<{
    vulnerabilities: Array<{
      severity: "critical" | "high" | "medium" | "low";
      description: string;
      location?: string;
      remediation?: string;
    }>;
    overallRisk: "critical" | "high" | "medium" | "low";
    summary: string;
  } | null> {
    if (!this.isConfigured) {
      logger.warn("[AIWorkflowService] Security analysis attempted but service not configured");
      return null;
    }

    // Determine provider order (prefer Anthropic for security analysis)
    const providers = [];
    if (this.anthropicModel) providers.push({ name: "anthropic", model: this.anthropicModel });
    if (this.openaiModel) providers.push({ name: "openai", model: this.openaiModel });

    // If no providers available, return early
    if (providers.length === 0) {
      logger.error("[AIWorkflowService] No AI providers available for security analysis");
      return null;
    }

    // Try each provider in sequence until one works
    for (const { name, model } of providers) {
      try {
        logger.info(`[AIWorkflowService] Attempting security analysis with ${name}`);
        
        const securityPrompt = [
          new SystemMessage(
            "You are an expert security analyst. Analyze the code for security vulnerabilities."
          ),
          new HumanMessage(
            `Analyze this code for security vulnerabilities and return a JSON report:
            
            \`\`\`
            ${code}
            \`\`\`
            
            Format your response as a JSON object with the following structure:
            {
              "vulnerabilities": [
                {
                  "severity": "critical|high|medium|low",
                  "description": "detailed description",
                  "location": "file/line information",
                  "remediation": "suggestion for fixing"
                }
              ],
              "overallRisk": "critical|high|medium|low",
              "summary": "concise summary"
            }`
          )
        ];
        
        const response = await model.invoke(securityPrompt);
        
        try {
          // Parse the response content as JSON
          const content = response.content as string;
          const securityReport = JSON.parse(content);
          
          logger.info(`[AIWorkflowService] Security analysis with ${name} successful`);
          return securityReport;
        } catch (parseError) {
          logger.error(`[AIWorkflowService] Failed to parse ${name} security analysis:`, parseError);
          // Continue to next provider if parsing fails
          continue;
        }
      } catch (error) {
        logger.error(`[AIWorkflowService] Security analysis with ${name} failed:`, error);
        // Continue to next provider if this one fails
        continue;
      }
    }
    
    // If all providers failed, return null
    logger.error("[AIWorkflowService] All providers failed for security analysis");
    return null;
  }

  /**
   * Analyzes code for performance issues with provider redundancy
   */
  public async analyzeCodePerformance(code: string): Promise<{
    issues: Array<{
      type: string;
      description: string;
      impact: "critical" | "high" | "medium" | "low";
      suggestion: string;
    }>;
    overallScore: number;
    recommendations: string[];
  } | null> {
    if (!this.isConfigured) {
      logger.warn("[AIWorkflowService] Performance analysis attempted but service not configured");
      return null;
    }

    // Determine provider order (prefer OpenAI for performance analysis)
    const providers = [];
    if (this.openaiModel) providers.push({ name: "openai", model: this.openaiModel });
    if (this.anthropicModel) providers.push({ name: "anthropic", model: this.anthropicModel });

    // If no providers available, return early
    if (providers.length === 0) {
      logger.error("[AIWorkflowService] No AI providers available for performance analysis");
      return null;
    }

    // Try each provider in sequence until one works
    for (const { name, model } of providers) {
      try {
        logger.info(`[AIWorkflowService] Attempting performance analysis with ${name}`);
        
        const performancePrompt = [
          new SystemMessage(
            "You are an expert performance engineer. Analyze the code for performance optimizations."
          ),
          new HumanMessage(
            `Analyze this code for performance issues and return a JSON report:
            
            \`\`\`
            ${code}
            \`\`\`
            
            Format your response as a JSON object with the following structure:
            {
              "issues": [
                {
                  "type": "issue type",
                  "description": "detailed description",
                  "impact": "critical|high|medium|low",
                  "suggestion": "optimization suggestion"
                }
              ],
              "overallScore": 0-100,
              "recommendations": ["recommendation1", "recommendation2"]
            }`
          )
        ];
        
        const response = await model.invoke(performancePrompt);
        
        try {
          // Parse the response content as JSON
          const content = response.content as string;
          const performanceReport = JSON.parse(content);
          
          logger.info(`[AIWorkflowService] Performance analysis with ${name} successful`);
          return performanceReport;
        } catch (parseError) {
          logger.error(`[AIWorkflowService] Failed to parse ${name} performance analysis:`, parseError);
          // Continue to next provider if parsing fails
          continue;
        }
      } catch (error) {
        logger.error(`[AIWorkflowService] Performance analysis with ${name} failed:`, error);
        // Continue to next provider if this one fails
        continue;
      }
    }
    
    // If all providers failed, return null
    logger.error("[AIWorkflowService] All providers failed for performance analysis");
    return null;
  }

  /**
   * Complete code analysis workflow that combines security and performance
   * Intelligently distributes tasks and handles failures with built-in redundancy
   */
  public async analyzeCode(code: string): Promise<{
    success: boolean;
    security?: any;
    performance?: any;
    error?: string;
  }> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: "AI workflow service not properly configured"
      };
    }

    try {
      logger.info("[AIWorkflowService] Starting comprehensive code analysis");
      
      // Run security and performance analyses in parallel
      const [securityResult, performanceResult] = await Promise.allSettled([
        this.analyzeCodeSecurity(code),
        this.analyzeCodePerformance(code)
      ]);
      
      // Extract results or errors
      const security = securityResult.status === 'fulfilled' ? securityResult.value : null;
      const performance = performanceResult.status === 'fulfilled' ? performanceResult.value : null;
      
      // Generate comprehensive report
      const result = {
        success: !!(security || performance),
        timestamp: new Date().toISOString()
      };
      
      // Add security report if available
      if (security) {
        Object.assign(result, { security });
      }
      
      // Add performance report if available
      if (performance) {
        Object.assign(result, { performance });
      }
      
      // Add error if both failed
      if (!security && !performance) {
        Object.assign(result, { 
          error: "Failed to generate any analysis reports"
        });
      }
      
      return result;
    } catch (error) {
      logger.error("[AIWorkflowService] Workflow execution failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error in workflow execution"
      };
    }
  }

  /**
   * Generate personalized assistance for users based on their level
   */
  public async generatePersonalizedAssistance(
    query: string, 
    userLevel: 'beginner' | 'intermediate' | 'expert' = 'intermediate'
  ): Promise<string | null> {
    if (!this.isConfigured) {
      logger.warn("[AIWorkflowService] Personalized assistance attempted but service not configured");
      return null;
    }

    // Prioritize Anthropic for personalized assistance (more nuanced responses)
    const providers = [];
    if (this.anthropicModel) providers.push({ name: "anthropic", model: this.anthropicModel });
    if (this.openaiModel) providers.push({ name: "openai", model: this.openaiModel });

    // If no providers available, return early
    if (providers.length === 0) {
      logger.error("[AIWorkflowService] No AI providers available for personalized assistance");
      return null;
    }

    // Try each provider in sequence until one works
    for (const { name, model } of providers) {
      try {
        logger.info(`[AIWorkflowService] Attempting personalized assistance with ${name}`);
        
        // Adjust assistance based on user level
        let levelGuidance;
        if (userLevel === 'beginner') {
          levelGuidance = "Explain concepts in simple terms with examples. Avoid technical jargon.";
        } else if (userLevel === 'intermediate') {
          levelGuidance = "Balance explanations with technical details. Use some technical terms but explain them.";
        } else {
          levelGuidance = "Focus on advanced concepts and technical depth. Use domain-specific terminology freely.";
        }
        
        const assistancePrompt = [
          new SystemMessage(
            `You are an expert AI assistant for a Web3 platform called HyperDAG. ${levelGuidance}`
          ),
          new HumanMessage(query)
        ];
        
        const response = await model.invoke(assistancePrompt);
        const content = response.content as string;
        
        logger.info(`[AIWorkflowService] Personalized assistance with ${name} successful`);
        return content;
      } catch (error) {
        logger.error(`[AIWorkflowService] Personalized assistance with ${name} failed:`, error);
        // Continue to next provider if this one fails
        continue;
      }
    }
    
    // If all providers failed, return null
    logger.error("[AIWorkflowService] All providers failed for personalized assistance");
    return null;
  }

  /**
   * Generate recommendations for grant matching
   */
  public async generateGrantRecommendations(
    project: { title: string; description: string; categories: string[] },
    availableGrants: Array<{ id: string; name: string; description: string; fundingAmount: number; requirements: string[] }>
  ): Promise<Array<{ grantId: string; score: number; rationale: string; }> | null> {
    if (!this.isConfigured) {
      logger.warn("[AIWorkflowService] Grant recommendations attempted but service not configured");
      return null;
    }

    // Use any available provider
    const providers = [];
    if (this.anthropicModel) providers.push({ name: "anthropic", model: this.anthropicModel });
    if (this.openaiModel) providers.push({ name: "openai", model: this.openaiModel });

    if (providers.length === 0) {
      logger.error("[AIWorkflowService] No AI providers available for grant recommendations");
      return null;
    }

    // Try each provider in sequence until one works
    for (const { name, model } of providers) {
      try {
        logger.info(`[AIWorkflowService] Attempting grant recommendations with ${name}`);
        
        const recommendationsPrompt = [
          new SystemMessage(
            "You are an expert grant matching advisor. Evaluate project fit against grants and provide recommendations."
          ),
          new HumanMessage(
            `I need to match this project with potential grants. Evaluate the fit and return a JSON array of recommendations:
            
            PROJECT:
            Title: ${project.title}
            Description: ${project.description}
            Categories: ${project.categories.join(', ')}
            
            AVAILABLE GRANTS:
            ${JSON.stringify(availableGrants, null, 2)}
            
            Return your response as a JSON array with the following structure:
            [
              {
                "grantId": "grant ID string",
                "score": number between 0-100,
                "rationale": "explanation of fit"
              }
            ]
            
            Only include grants with a score above 50. Sort by score descending.`
          )
        ];
        
        const response = await model.invoke(recommendationsPrompt);
        
        try {
          // Parse the response content as JSON
          const content = response.content as string;
          const recommendations = JSON.parse(content);
          
          logger.info(`[AIWorkflowService] Grant recommendations with ${name} successful`);
          return recommendations;
        } catch (parseError) {
          logger.error(`[AIWorkflowService] Failed to parse ${name} grant recommendations:`, parseError);
          // Continue to next provider if parsing fails
          continue;
        }
      } catch (error) {
        logger.error(`[AIWorkflowService] Grant recommendations with ${name} failed:`, error);
        // Continue to next provider if this one fails
        continue;
      }
    }
    
    // If all providers failed, return null
    logger.error("[AIWorkflowService] All providers failed for grant recommendations");
    return null;
  }
}