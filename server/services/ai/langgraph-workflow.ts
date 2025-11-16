import { StateGraph } from "@langchain/langgraph";
import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { Document } from "@langchain/core/documents";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { BaseMessage } from "@langchain/core/messages";
import { StructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { logger } from "../../utils/logger";

// Define state type for our workflow
type State = {
  query: string;
  code?: string;
  provider?: string;
  securityReport?: {
    vulnerabilities: {
      severity: "critical" | "high" | "medium" | "low";
      description: string;
      location?: string;
      remediation?: string;
    }[];
    overallRisk: "critical" | "high" | "medium" | "low";
    summary: string;
  };
  performanceReport?: {
    issues: {
      type: string;
      description: string;
      impact: "critical" | "high" | "medium" | "low";
      suggestion: string;
    }[];
    overallScore: number;
    recommendations: string[];
  };
  error?: string;
  retryCount: number;
  finalReport?: any;
};

/**
 * Security Analysis LangGraph Workflow
 * 
 * This workflow orchestrates AI agents to analyze code security with redundancy
 * between different AI providers.
 */
export class SecurityAnalysisWorkflow {
  private graph: StateGraph<State>;
  private openaiModel: ChatOpenAI;
  private anthropicModel: ChatAnthropic;
  private isConfigured: boolean = false;

  constructor() {
    // Initialize models with fallbacks
    try {
      this.openaiModel = new ChatOpenAI({
        modelName: "gpt-4o", // The newest OpenAI model
        temperature: 0,
        maxTokens: 4000,
      });

      this.anthropicModel = new ChatAnthropic({
        modelName: "claude-3-7-sonnet-20250219", // The newest Claude model
        temperature: 0,
        maxTokens: 4000,
      });

      this.graph = this.buildWorkflow();
      this.isConfigured = true;
      logger.info("[SecurityAnalysisWorkflow] Initialized successfully with multiple AI providers");
    } catch (error) {
      logger.error("[SecurityAnalysisWorkflow] Failed to initialize:", error);
      this.isConfigured = false;
    }
  }

  /**
   * Builds the security analysis workflow graph
   */
  private buildWorkflow(): StateGraph<State> {
    // Create a new graph
    const workflow = defineGraph<State>({
      // Define the channels and edges for the graph
      channels: {
        query: {
          input: z.string(),
          output: z.string(),
        },
        code: {
          input: z.string().optional(),
          output: z.string().optional(),
        },
        securityReport: {
          input: z.any().optional(),
          output: z.any().optional(),
        },
        performanceReport: {
          input: z.any().optional(),
          output: z.any().optional(),
        },
        error: {
          input: z.string().optional(),
          output: z.string().optional(),
        },
        retryCount: {
          input: z.number(),
          output: z.number(),
        },
        provider: {
          input: z.string().optional(),
          output: z.string().optional(),
        },
        finalReport: {
          input: z.any().optional(),
          output: z.any().optional(),
        },
      },
    });

    // Node to select AI provider based on availability and past performance
    workflow.addNode("selectProvider", this.selectProvider.bind(this));

    // Node to perform security analysis
    workflow.addNode("analyzeCodeSecurity", this.analyzeCodeSecurity.bind(this));

    // Node to perform performance analysis
    workflow.addNode("analyzeCodePerformance", this.analyzeCodePerformance.bind(this));

    // Node to handle errors and retry with another provider if needed
    workflow.addNode("handleError", this.handleError.bind(this));

    // Node to generate final report combining security and performance
    workflow.addNode("generateFinalReport", this.generateFinalReport.bind(this));

    // Set the entry point
    workflow.setEntryPoint("selectProvider");

    // Define edges
    workflow.addEdge("selectProvider", "analyzeCodeSecurity");
    workflow.addEdge("analyzeCodeSecurity", "analyzeCodePerformance");
    workflow.addEdge("analyzeCodePerformance", "generateFinalReport");

    // Add conditional edges for error handling
    workflow.addConditionalEdges(
      "analyzeCodeSecurity",
      (state) => {
        if (state.error) {
          return "handleError";
        }
        return "analyzeCodePerformance";
      }
    );

    workflow.addConditionalEdges(
      "handleError",
      (state) => {
        if (state.retryCount < 3) {
          return "selectProvider";
        }
        return "generateFinalReport";
      }
    );

    // Compile the graph
    return workflow.compile();
  }

  /**
   * Selects the appropriate AI provider based on availability
   */
  private async selectProvider(state: State): Promise<State> {
    logger.info("[SecurityAnalysisWorkflow] Selecting provider");
    
    try {
      // Simple alternating strategy with preference for Anthropic
      if (state.retryCount === 0) {
        // Start with Anthropic if available
        if (process.env.ANTHROPIC_API_KEY) {
          return { ...state, provider: "anthropic" };
        } else {
          return { ...state, provider: "openai" };
        }
      } else {
        // On retry, switch providers
        return { 
          ...state, 
          provider: state.provider === "anthropic" ? "openai" : "anthropic" 
        };
      }
    } catch (error) {
      logger.error("[SecurityAnalysisWorkflow] Provider selection error:", error);
      return { 
        ...state, 
        provider: "openai", // Default to OpenAI as fallback
        error: error instanceof Error ? error.message : "Unknown error in provider selection"
      };
    }
  }

  /**
   * Analyzes code for security vulnerabilities
   */
  private async analyzeCodeSecurity(state: State): Promise<State> {
    if (!state.code) {
      return { ...state, error: "No code provided for security analysis" };
    }

    logger.info(`[SecurityAnalysisWorkflow] Analyzing code security with ${state.provider}`);

    try {
      const securityPrompt = ChatPromptTemplate.fromMessages([
        new SystemMessage(
          "You are an expert security analyst. Analyze the code for security vulnerabilities."
        ),
        new HumanMessage(
          `Analyze this code for security vulnerabilities and return a JSON report:
          
          \`\`\`
          ${state.code}
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
        ),
      ]);

      // Select the model based on the provider
      const model = state.provider === "anthropic" ? this.anthropicModel : this.openaiModel;
      
      // Call the selected model
      const response = await model.invoke(securityPrompt);
      
      try {
        // Parse the response content as JSON
        const content = response.content as string;
        const securityReport = JSON.parse(content);
        
        return { ...state, securityReport, error: undefined };
      } catch (parseError) {
        logger.error("[SecurityAnalysisWorkflow] Failed to parse security analysis:", parseError);
        return { 
          ...state, 
          error: "Failed to parse security analysis response" 
        };
      }
    } catch (error) {
      logger.error("[SecurityAnalysisWorkflow] Security analysis failed:", error);
      return { 
        ...state, 
        error: error instanceof Error ? error.message : "Unknown error in security analysis",
        retryCount: state.retryCount + 1
      };
    }
  }

  /**
   * Analyzes code for performance issues
   */
  private async analyzeCodePerformance(state: State): Promise<State> {
    if (!state.code) {
      return { ...state, error: "No code provided for performance analysis" };
    }

    logger.info(`[SecurityAnalysisWorkflow] Analyzing code performance with ${state.provider}`);

    try {
      const performancePrompt = ChatPromptTemplate.fromMessages([
        new SystemMessage(
          "You are an expert performance engineer. Analyze the code for performance optimizations."
        ),
        new HumanMessage(
          `Analyze this code for performance issues and return a JSON report:
          
          \`\`\`
          ${state.code}
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
        ),
      ]);

      // Select the model based on the provider
      const model = state.provider === "anthropic" ? this.anthropicModel : this.openaiModel;
      
      // Call the selected model
      const response = await model.invoke(performancePrompt);
      
      try {
        // Parse the response content as JSON
        const content = response.content as string;
        const performanceReport = JSON.parse(content);
        
        return { ...state, performanceReport, error: undefined };
      } catch (parseError) {
        logger.error("[SecurityAnalysisWorkflow] Failed to parse performance analysis:", parseError);
        return { 
          ...state, 
          error: "Failed to parse performance analysis response",
          retryCount: state.retryCount + 1
        };
      }
    } catch (error) {
      logger.error("[SecurityAnalysisWorkflow] Performance analysis failed:", error);
      return { 
        ...state, 
        error: error instanceof Error ? error.message : "Unknown error in performance analysis",
        retryCount: state.retryCount + 1
      };
    }
  }

  /**
   * Handles errors by implementing retry logic and provider switching
   */
  private async handleError(state: State): Promise<State> {
    logger.warn(`[SecurityAnalysisWorkflow] Handling error: ${state.error}`);
    
    // If we've tried multiple times, give up
    if (state.retryCount >= 3) {
      logger.error("[SecurityAnalysisWorkflow] Maximum retry count reached, giving up");
      return { 
        ...state,
        finalReport: {
          success: false,
          error: `Analysis failed after ${state.retryCount} attempts: ${state.error}`
        }
      };
    }
    
    // Otherwise, increment retry count and try again with a different provider
    return {
      ...state,
      retryCount: state.retryCount + 1,
      provider: state.provider === "anthropic" ? "openai" : "anthropic"
    };
  }

  /**
   * Generates a final comprehensive report combining security and performance
   */
  private async generateFinalReport(state: State): Promise<State> {
    logger.info("[SecurityAnalysisWorkflow] Generating final report");

    // If there was an error and we couldn't recover, return error report
    if (state.error && state.retryCount >= 3) {
      return {
        ...state,
        finalReport: {
          success: false,
          error: state.error,
          message: "Analysis failed after multiple attempts"
        }
      };
    }

    // If we have either security or performance report, generate a combined report
    if (state.securityReport || state.performanceReport) {
      const finalReport = {
        success: true,
        timestamp: new Date().toISOString(),
        security: state.securityReport || {
          vulnerabilities: [],
          overallRisk: "low",
          summary: "No security analysis available"
        },
        performance: state.performanceReport || {
          issues: [],
          overallScore: 0,
          recommendations: ["No performance analysis available"]
        },
        provider: state.provider
      };

      return { ...state, finalReport };
    }

    // Fallback report if something went wrong but didn't trigger error handling
    return {
      ...state,
      finalReport: {
        success: false,
        message: "Failed to generate reports",
        error: state.error || "Unknown error"
      }
    };
  }

  /**
   * Runs the security analysis workflow on a given code snippet
   */
  public async analyzeCode(code: string): Promise<any> {
    if (!this.isConfigured) {
      logger.error("[SecurityAnalysisWorkflow] Workflow not properly configured");
      return { 
        success: false, 
        error: "Security analysis workflow not properly configured" 
      };
    }

    try {
      logger.info("[SecurityAnalysisWorkflow] Starting code analysis");
      
      // Define initial state
      const initialState: State = {
        query: "Analyze this code for security and performance issues",
        code,
        retryCount: 0
      };

      // Execute the graph
      const finalState = await this.graph.invoke(initialState);
      
      return finalState.finalReport || {
        success: false,
        error: "No report generated"
      };
    } catch (error) {
      logger.error("[SecurityAnalysisWorkflow] Workflow execution failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error in workflow execution"
      };
    }
  }
}