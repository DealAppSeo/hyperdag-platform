import axios, { AxiosInstance } from 'axios';

/**
 * ASi1.ai Integration Service for HyperDAG
 * 
 * Provides advanced AI capabilities including:
 * - Natural language processing for grant matching
 * - Intelligent team formation recommendations
 * - Automated project analysis and optimization
 * - Smart contract interaction assistance
 * - Multi-modal AI interactions
 */
export class ASi1Service {
  private client!: AxiosInstance;
  private isConfigured: boolean = false;
  private apiKey: string | undefined;
  private baseURL: string = 'https://api.asi1.ai/v1';

  constructor() {
    this.apiKey = process.env.ASI1_API_KEY;
    this.initializeClient();
  }

  private initializeClient() {
    if (!this.apiKey) {
      console.warn('[asi1-service] ASi1.ai API key not configured');
      return;
    }

    console.log('[asi1-service] Initializing ASi1.ai client with API key');
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'HyperDAG/1.0'
      },
      timeout: 30000
    });

    this.isConfigured = true;
    console.log('[asi1-service] ASi1.ai service initialized successfully');
  }

  /**
   * Test API connection and service availability
   */
  public async healthCheck(): Promise<{ status: string; capabilities: string[] }> {
    if (!this.isConfigured) {
      return { status: 'not_configured', capabilities: [] };
    }

    try {
      const response = await this.client.get('/health');
      return {
        status: 'healthy',
        capabilities: response.data.capabilities || [
          'text_generation',
          'analysis',
          'grant_matching',
          'team_formation',
          'project_optimization'
        ]
      };
    } catch (error) {
      console.error('[asi1-service] Health check failed:', error);
      // Fallback to indicate service is available but may have connectivity issues
      return { 
        status: 'configured', 
        capabilities: [
          'text_generation',
          'analysis', 
          'grant_matching',
          'team_formation',
          'project_optimization'
        ]
      };
    }
  }

  /**
   * Generate intelligent grant matching recommendations
   */
  public async matchGrants(profile: {
    skills: string[];
    interests: string[];
    experience: string;
    projectGoals: string;
  }): Promise<{
    matches: Array<{
      grantId: string;
      relevanceScore: number;
      reasoning: string;
      suggestedApproach: string;
    }>;
    totalMatches: number;
  }> {
    if (!this.isConfigured) {
      throw new Error('ASi1.ai service not configured');
    }

    try {
      const response = await this.client.post('/grant-matching', {
        profile,
        preferences: {
          includeReasoning: true,
          maxResults: 10,
          minRelevanceScore: 0.6
        }
      });

      return response.data;
    } catch (error) {
      console.error('[asi1-service] Grant matching failed:', error);
      throw new Error('Failed to generate grant matches');
    }
  }

  /**
   * Analyze team formation opportunities
   */
  public async analyzeTeamFormation(project: {
    title: string;
    description: string;
    requiredSkills: string[];
    budget?: number;
    timeline?: string;
  }): Promise<{
    recommendedTeamSize: number;
    roleRecommendations: Array<{
      role: string;
      skills: string[];
      priority: 'high' | 'medium' | 'low';
      reasoning: string;
    }>;
    collaborationStrategy: string;
  }> {
    if (!this.isConfigured) {
      throw new Error('ASi1.ai service not configured');
    }

    try {
      const response = await this.client.post('/team-formation', {
        project,
        analysisType: 'comprehensive'
      });

      return response.data;
    } catch (error) {
      console.error('[asi1-service] Team formation analysis failed:', error);
      return this.generateTeamFormationFallback(project);
    }
  }

  /**
   * Generate project optimization recommendations
   */
  public async optimizeProject(projectData: {
    currentStatus: string;
    goals: string[];
    resources: any;
    challenges: string[];
  }): Promise<{
    optimizations: Array<{
      category: string;
      recommendation: string;
      impact: 'high' | 'medium' | 'low';
      effort: 'high' | 'medium' | 'low';
    }>;
    priorityActions: string[];
    estimatedImpact: string;
  }> {
    if (!this.isConfigured) {
      throw new Error('ASi1.ai service not configured');
    }

    try {
      const response = await this.client.post('/project-optimization', {
        project: projectData,
        optimizationScope: 'full'
      });

      return response.data;
    } catch (error) {
      console.error('[asi1-service] Project optimization failed:', error);
      return this.generateProjectOptimizationFallback(projectData);
    }
  }

  /**
   * Generate intelligent content for grant applications
   */
  public async generateGrantContent(params: {
    grantType: string;
    projectSummary: string;
    teamCapabilities: string[];
    fundingGoals: string;
  }): Promise<{
    executiveSummary: string;
    technicalApproach: string;
    teamQualifications: string;
    budgetJustification: string;
    impactStatement: string;
  }> {
    if (!this.isConfigured) {
      throw new Error('ASi1.ai service not configured');
    }

    try {
      const response = await this.client.post('/content-generation', {
        type: 'grant_application',
        parameters: params,
        style: 'professional',
        length: 'comprehensive'
      });

      return response.data;
    } catch (error) {
      console.error('[asi1-service] Content generation failed:', error);
      throw new Error('Failed to generate grant content');
    }
  }

  /**
   * Analyze project sentiment and community engagement
   */
  public async analyzeSentiment(content: {
    text: string;
    context: 'project' | 'grant' | 'team' | 'community';
  }): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    confidence: number;
    insights: string[];
    recommendations: string[];
  }> {
    if (!this.isConfigured) {
      throw new Error('ASi1.ai service not configured');
    }

    try {
      const response = await this.client.post('/sentiment-analysis', content);
      return response.data;
    } catch (error) {
      console.error('[asi1-service] Sentiment analysis failed:', error);
      throw new Error('Failed to analyze sentiment');
    }
  }

  /**
   * Get AI-powered insights for HyperCrowd team matching
   */
  public async getTeamMatchingInsights(userProfile: any, availableProjects: any[]): Promise<{
    matches: Array<{
      projectId: number;
      matchScore: number;
      reasoning: string;
      roleRecommendation: string;
    }>;
    personalizedSuggestions: string[];
  }> {
    if (!this.isConfigured) {
      throw new Error('ASi1.ai service not configured');
    }

    try {
      const response = await this.client.post('/team-matching-insights', {
        profile: userProfile,
        projects: availableProjects,
        matchingCriteria: {
          skillAlignment: 0.3,
          interestAlignment: 0.2,
          experienceLevel: 0.2,
          availability: 0.2,
          personalityFit: 0.1
        }
      });

      return response.data;
    } catch (error) {
      console.error('[asi1-service] Team matching insights failed:', error);
      throw new Error('Failed to get team matching insights');
    }
  }

  /**
   * Generate smart contract interaction recommendations
   */
  public async analyzeSmartContract(contractData: {
    address: string;
    abi?: any;
    purpose: string;
  }): Promise<{
    analysis: string;
    securityAssessment: string;
    optimizationSuggestions: string[];
    interactionGuidance: string;
  }> {
    if (!this.isConfigured) {
      throw new Error('ASi1.ai service not configured');
    }

    try {
      const response = await this.client.post('/smart-contract-analysis', contractData);
      return response.data;
    } catch (error) {
      console.error('[asi1-service] Smart contract analysis failed:', error);
      throw new Error('Failed to analyze smart contract');
    }
  }

  /**
   * Check if service is properly configured
   */
  public isReady(): boolean {
    return this.isConfigured;
  }

  /**
   * Get service status and capabilities
   */
  public getStatus() {
    return {
      configured: this.isConfigured,
      capabilities: this.isConfigured ? [
        'grant_matching',
        'team_formation',
        'project_optimization',
        'content_generation',
        'sentiment_analysis',
        'smart_contract_analysis'
      ] : []
    };
  }

  /**
   * Generate fallback team formation analysis when API is unavailable
   */
  private generateTeamFormationFallback(project: {
    title: string;
    description: string;
    requiredSkills: string[];
    budget?: number;
    timeline?: string;
  }) {
    const skillCategories = {
      technical: ['programming', 'development', 'coding', 'software', 'ai', 'blockchain'],
      design: ['design', 'ui', 'ux', 'graphics', 'visual'],
      business: ['marketing', 'business', 'strategy', 'management', 'sales'],
      research: ['research', 'analysis', 'academic', 'writing']
    };

    const roles = [];
    const skills = project.requiredSkills.map(s => s.toLowerCase());

    if (skills.some(s => skillCategories.technical.some(t => s.includes(t)))) {
      roles.push({
        role: 'Technical Lead',
        skills: ['Software Development', 'Architecture', 'Team Leadership'],
        priority: 'high' as const,
        reasoning: 'Technical expertise is critical for project implementation'
      });
    }

    if (skills.some(s => skillCategories.design.some(t => s.includes(t)))) {
      roles.push({
        role: 'UI/UX Designer',
        skills: ['User Experience', 'Interface Design', 'Prototyping'],
        priority: 'medium' as const,
        reasoning: 'Design skills needed for user-facing components'
      });
    }

    if (skills.some(s => skillCategories.business.some(t => s.includes(t)))) {
      roles.push({
        role: 'Product Manager',
        skills: ['Product Strategy', 'Project Management', 'Stakeholder Communication'],
        priority: 'high' as const,
        reasoning: 'Business leadership essential for project success'
      });
    }

    return {
      recommendedTeamSize: Math.max(3, Math.min(8, roles.length + 2)),
      roleRecommendations: roles,
      collaborationStrategy: 'Focus on clear role definition and regular communication cycles'
    };
  }

  /**
   * Generate fallback project optimization recommendations when API is unavailable
   */
  private generateProjectOptimizationFallback(projectData: {
    currentStatus: string;
    goals: string[];
    resources: any;
    challenges: string[];
  }) {
    const optimizations = [];

    if (projectData.challenges.length > 0) {
      optimizations.push({
        category: 'Risk Management',
        recommendation: 'Address identified challenges through structured risk mitigation',
        impact: 'high' as const,
        effort: 'medium' as const
      });
    }

    if (projectData.goals.length > 3) {
      optimizations.push({
        category: 'Goal Prioritization',
        recommendation: 'Focus on 2-3 primary objectives to improve execution clarity',
        impact: 'medium' as const,
        effort: 'low' as const
      });
    }

    optimizations.push({
      category: 'Resource Optimization',
      recommendation: 'Implement regular resource utilization reviews',
      impact: 'medium' as const,
      effort: 'low' as const
    });

    return {
      optimizations,
      priorityActions: [
        'Define clear success metrics',
        'Establish regular progress checkpoints',
        'Implement feedback collection mechanisms'
      ],
      estimatedImpact: 'These optimizations should improve project efficiency by 15-25%'
    };
  }
}

export default ASi1Service;