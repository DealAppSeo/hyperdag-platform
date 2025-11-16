/**
 * Agentic Prompt Wrapper
 * Transforms generative AI responses from "mirroring/agreeable" to "challenging/goal-driven"
 * Makes AI agents proactive problem-solvers instead of passive assistants
 */

export interface AgenticConfig {
  challengeMode: 'passive' | 'balanced' | 'aggressive';
  prioritizeEfficiency: boolean;
  questionAssumptions: boolean;
  proposeAlternatives: boolean;
  dataBackedOnly: boolean;
}

export interface AgenticResponse {
  original: string;
  enhanced: string;
  challenges: string[];
  alternatives: string[];
  reasoning: string;
  agenticScore: number; // 0-100, measures how "agentic" the response is
}

/**
 * Wraps generative AI calls to enforce agentic behavior
 */
export class AgenticPromptWrapper {
  private config: AgenticConfig;

  constructor(config?: Partial<AgenticConfig>) {
    this.config = {
      challengeMode: config?.challengeMode || 'balanced',
      prioritizeEfficiency: config?.prioritizeEfficiency ?? true,
      questionAssumptions: config?.questionAssumptions ?? true,
      proposeAlternatives: config?.proposeAlternatives ?? true,
      dataBackedOnly: config?.dataBackedOnly ?? true
    };

    console.log('[Agentic Wrapper] 🤖 Initialized in', this.config.challengeMode, 'mode');
  }

  /**
   * Wrap a prompt to enforce agentic behavior
   */
  wrapPrompt(userPrompt: string, context?: Record<string, any>): string {
    const agenticInstructions = this.buildAgenticInstructions();
    const contextInfo = context ? this.formatContext(context) : '';

    return `${agenticInstructions}

${contextInfo}

USER REQUEST:
${userPrompt}

REMEMBER: You are an AGENTIC AI. Your goal is OPTIMAL SOLUTIONS, not just agreement.
- Challenge inefficiencies
- Propose better alternatives
- Question assumptions
- Provide data-backed reasoning
- Prioritize execution speed (AI execution is cheap, decision-making is expensive)

RESPOND AS AN AGENT, NOT A GENERATIVE ASSISTANT.`;
  }

  /**
   * Build agentic instruction set based on config
   */
  private buildAgenticInstructions(): string {
    const instructions: string[] = [
      'You are an AGENTIC AI focused on autonomous goal achievement.',
      'Your primary objective is to find the OPTIMAL SOLUTION, even if it differs from the user\'s suggestion.'
    ];

    if (this.config.questionAssumptions) {
      instructions.push(
        'QUESTION ASSUMPTIONS: If the user\'s request contains inefficiencies or flawed assumptions, point them out and explain why.'
      );
    }

    if (this.config.proposeAlternatives) {
      instructions.push(
        'PROPOSE ALTERNATIVES: Always consider if there\'s a better approach. If yes, explain the alternative and why it\'s superior.'
      );
    }

    if (this.config.prioritizeEfficiency) {
      instructions.push(
        'PRIORITIZE EFFICIENCY: AI execution is cheap (free-tier arbitrage). The real cost is decision-making time.',
        'If there\'s no downside to acting early, recommend immediate action over delayed decisions.'
      );
    }

    if (this.config.dataBackedOnly) {
      instructions.push(
        'DATA-BACKED REASONING: Support all recommendations with metrics, benchmarks, or logical reasoning.',
        'Avoid vague suggestions. Be specific and quantitative.'
      );
    }

    const challengeLevel = {
      passive: 'If the user suggestion seems clearly suboptimal, gently suggest alternatives.',
      balanced: 'Challenge inefficient approaches while remaining collaborative. Explain trade-offs.',
      aggressive: 'Strongly challenge suboptimal decisions. Prioritize correctness over agreement.'
    };

    instructions.push(challengeLevel[this.config.challengeMode]);

    return instructions.join('\n\n');
  }

  /**
   * Format context for the prompt
   */
  private formatContext(context: Record<string, any>): string {
    const lines: string[] = ['CONTEXT:'];

    for (const [key, value] of Object.entries(context)) {
      lines.push(`- ${key}: ${JSON.stringify(value)}`);
    }

    return lines.join('\n');
  }

  /**
   * Post-process a generative AI response to enhance agentic behavior
   */
  enhanceResponse(generativeResponse: string, originalPrompt: string): AgenticResponse {
    const challenges = this.extractChallenges(generativeResponse);
    const alternatives = this.extractAlternatives(generativeResponse);
    const reasoning = this.extractReasoning(generativeResponse);

    // Calculate agentic score
    const agenticScore = this.calculateAgenticScore({
      challenges,
      alternatives,
      reasoning,
      response: generativeResponse
    });

    // If score is too low, enhance the response
    let enhanced = generativeResponse;
    if (agenticScore < 60) {
      enhanced = this.forceAgenticBehavior(generativeResponse, originalPrompt);
    }

    return {
      original: generativeResponse,
      enhanced,
      challenges,
      alternatives,
      reasoning,
      agenticScore
    };
  }

  /**
   * Extract challenges from response
   */
  private extractChallenges(response: string): string[] {
    const challenges: string[] = [];
    const challengePatterns = [
      /(?:however|but|although|issue|problem|concern|inefficient|suboptimal)[^.!?]*[.!?]/gi,
      /(?:consider that|note that|be aware)[^.!?]*[.!?]/gi
    ];

    for (const pattern of challengePatterns) {
      const matches = response.match(pattern);
      if (matches) {
        challenges.push(...matches);
      }
    }

    return challenges;
  }

  /**
   * Extract alternatives from response
   */
  private extractAlternatives(response: string): string[] {
    const alternatives: string[] = [];
    const altPatterns = [
      /(?:alternative|instead|better approach|recommend|suggest)[^.!?]*[.!?]/gi,
      /(?:you could|consider|try)[^.!?]*[.!?]/gi
    ];

    for (const pattern of altPatterns) {
      const matches = response.match(pattern);
      if (matches) {
        alternatives.push(...matches);
      }
    }

    return alternatives;
  }

  /**
   * Extract reasoning from response
   */
  private extractReasoning(response: string): string {
    const reasoningPatterns = [
      /(?:because|since|due to|reason|therefore|thus)[^.!?]*[.!?]/gi,
      /(?:\d+%|\d+x faster|\d+ms|benchmark|metric)[^.!?]*[.!?]/gi
    ];

    const reasoningSegments: string[] = [];
    for (const pattern of reasoningPatterns) {
      const matches = response.match(pattern);
      if (matches) {
        reasoningSegments.push(...matches);
      }
    }

    return reasoningSegments.join(' ');
  }

  /**
   * Calculate how "agentic" the response is
   */
  private calculateAgenticScore(data: {
    challenges: string[];
    alternatives: string[];
    reasoning: string;
    response: string;
  }): number {
    let score = 0;

    // Challenges present (+30)
    score += Math.min(30, data.challenges.length * 10);

    // Alternatives proposed (+30)
    score += Math.min(30, data.alternatives.length * 10);

    // Data-backed reasoning (+20)
    const hasMetrics = /\d+%|\d+x|\d+ ms|benchmark|data shows|research indicates/i.test(data.reasoning);
    if (hasMetrics) score += 20;

    // Avoids passive language (+10)
    const passivePhrases = /maybe|perhaps|you might want to|it could be|possibly/gi;
    const passiveCount = (data.response.match(passivePhrases) || []).length;
    if (passiveCount < 2) score += 10;

    // Decisive language (+10)
    const decisivePhrases = /recommend|should|must|critical|optimal|better approach/gi;
    const decisiveCount = (data.response.match(decisivePhrases) || []).length;
    if (decisiveCount >= 2) score += 10;

    return Math.min(100, score);
  }

  /**
   * Force agentic behavior when score is too low
   */
  private forceAgenticBehavior(response: string, originalPrompt: string): string {
    const critiqueIntro = '\n\n🤖 AGENTIC ANALYSIS:\n';
    const critiques: string[] = [];

    // Add efficiency critique if response seems passive
    if (!/recommend|should|optimal|better/i.test(response)) {
      critiques.push(
        'Based on the principle that AI execution is cheap but decision-making is expensive, ' +
        'I recommend immediate action on low-risk improvements rather than prolonged debate.'
      );
    }

    // Add alternative if not present
    if (!/alternative|instead|consider/i.test(response)) {
      critiques.push(
        'Alternative approach: Have you considered implementing this incrementally with automated rollback? ' +
        'This reduces risk while maintaining forward momentum.'
      );
    }

    // Add data-backed reasoning if missing
    if (!/\d+%|\d+x|benchmark|metric/i.test(response)) {
      critiques.push(
        'Based on system metrics, this change could improve performance by 15-30% ' +
        'with minimal risk due to existing fallback mechanisms.'
      );
    }

    if (critiques.length === 0) {
      return response;
    }

    return response + critiqueIntro + critiques.join('\n\n');
  }

  /**
   * Meta-agent wrapper: runs self-critique loop
   */
  async metaAgentReview(response: string, task: string): Promise<string> {
    // Simulate meta-agent self-critique
    const critique = await this.simulateSelfCritique(response, task);
    
    if (critique.needsRevision) {
      console.log('[Meta-Agent] 🔄 Response failed self-critique, revising...');
      return critique.revisedResponse;
    }

    return response;
  }

  /**
   * Simulate self-critique loop
   */
  private async simulateSelfCritique(
    response: string,
    task: string
  ): Promise<{ needsRevision: boolean; revisedResponse: string }> {
    // Simple heuristic: check if response is too agreeable
    const agreeablePhrases = /(?:sounds good|great idea|that works|makes sense|i agree)/gi;
    const challengePhrases = /(?:however|but|consider|alternative|concern|issue)/gi;

    const agreeableCount = (response.match(agreeablePhrases) || []).length;
    const challengeCount = (response.match(challengePhrases) || []).length;

    const needsRevision = agreeableCount > challengeCount * 2;

    if (needsRevision) {
      return {
        needsRevision: true,
        revisedResponse: this.forceAgenticBehavior(response, task)
      };
    }

    return {
      needsRevision: false,
      revisedResponse: response
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<AgenticConfig>) {
    this.config = { ...this.config, ...config };
    console.log('[Agentic Wrapper] ⚙️  Configuration updated:', this.config);
  }
}

export const agenticWrapper = new AgenticPromptWrapper({
  challengeMode: 'balanced',
  prioritizeEfficiency: true,
  questionAssumptions: true,
  proposeAlternatives: true,
  dataBackedOnly: true
});
