/**
 * Grant Overlap Analysis Service
 * 
 * Identifies strategic grant combinations that increase winning likelihood
 * through intelligent analysis of application requirements, deadlines, and compatibility
 */

import { smartAI } from './smart-ai-service';

export interface GrantOverlapAnalysis {
  grantCombinations: GrantCombination[];
  optimalStrategy: OptimalStrategy;
  riskAssessment: RiskAssessment;
  timelineAnalysis: TimelineAnalysis;
}

export interface GrantCombination {
  grants: GrantOpportunity[];
  overlapScore: number;
  synergies: string[];
  conflictRisks: string[];
  combinedFunding: number;
  winProbabilityBoost: number;
  applicationWorkload: number;
}

export interface GrantOpportunity {
  id: number;
  title: string;
  source: string;
  categories: string[];
  availableFunds: number;
  applicationDeadline?: Date;
  requirements: string[];
  eligibilityCriteria: string[];
  applicationComponents: ApplicationComponent[];
}

export interface ApplicationComponent {
  type: 'proposal' | 'budget' | 'team_cv' | 'technical_plan' | 'milestones' | 'references';
  required: boolean;
  format: string;
  wordLimit?: number;
  specificRequirements: string[];
}

export interface OptimalStrategy {
  priorityOrder: number[];
  applicationSequence: ApplicationSequence[];
  resourceAllocation: ResourceAllocation;
  timelineOptimization: TimelineOptimization;
}

export interface ApplicationSequence {
  grantId: number;
  startDate: Date;
  submissionDate: Date;
  preparationTime: number;
  dependencies: number[];
}

export interface ResourceAllocation {
  teamMemberHours: { [role: string]: number };
  budgetDistribution: { [category: string]: number };
  technicalRequirements: string[];
}

export interface TimelineOptimization {
  parallelApplications: number[][];
  sequentialDependencies: number[][];
  criticalPath: number[];
  bufferTime: number;
}

export interface RiskAssessment {
  overlapConflicts: ConflictRisk[];
  competitionLevel: { [grantId: number]: number };
  successProbability: { [grantId: number]: number };
  mitigation: MitigationStrategy[];
}

export interface ConflictRisk {
  type: 'funding_overlap' | 'time_conflict' | 'exclusivity_clause' | 'scope_duplication';
  severity: 'low' | 'medium' | 'high';
  affectedGrants: number[];
  description: string;
  mitigation: string;
}

export interface MitigationStrategy {
  risk: string;
  actions: string[];
  timeline: string;
  responsibility: string;
}

export interface TimelineAnalysis {
  applicationWindows: ApplicationWindow[];
  deadlineClashes: DeadlineClash[];
  optimalSubmissionDates: { [grantId: number]: Date };
  workloadDistribution: WorkloadPeriod[];
}

export interface ApplicationWindow {
  grantId: number;
  openDate: Date;
  deadlineDate: Date;
  preparationPeriod: number;
  competitiveness: number;
}

export interface DeadlineClash {
  grantIds: number[];
  clashDate: Date;
  severity: 'minor' | 'major' | 'critical';
  resolution: string;
}

export interface WorkloadPeriod {
  startDate: Date;
  endDate: Date;
  intensity: number;
  concurrentGrants: number[];
  requiredTeamSize: number;
}

export class GrantOverlapAnalysisService {
  /**
   * Analyze grant combinations for optimal overlap strategy
   */
  async analyzeGrantOverlaps(grants: GrantOpportunity[], userProfile: any, teamPreferences: any): Promise<GrantOverlapAnalysis> {
    console.log(`Analyzing ${grants.length} grants for strategic overlaps...`);
    
    // Generate all possible grant combinations
    const combinations = this.generateGrantCombinations(grants);
    
    // Score each combination for overlap potential
    const scoredCombinations = await this.scoreGrantCombinations(combinations, userProfile);
    
    // Identify optimal strategy
    const optimalStrategy = await this.calculateOptimalStrategy(scoredCombinations, userProfile, teamPreferences);
    
    // Assess risks and conflicts
    const riskAssessment = await this.assessOverlapRisks(scoredCombinations);
    
    // Analyze timeline optimization
    const timelineAnalysis = await this.analyzeTimelines(grants, optimalStrategy);
    
    return {
      grantCombinations: scoredCombinations.slice(0, 10), // Top 10 combinations
      optimalStrategy,
      riskAssessment,
      timelineAnalysis
    };
  }

  /**
   * Generate strategic grant combinations
   */
  private generateGrantCombinations(grants: GrantOpportunity[]): GrantCombination[] {
    const combinations: GrantCombination[] = [];
    
    // Generate 2-grant combinations
    for (let i = 0; i < grants.length; i++) {
      for (let j = i + 1; j < grants.length; j++) {
        combinations.push({
          grants: [grants[i], grants[j]],
          overlapScore: 0,
          synergies: [],
          conflictRisks: [],
          combinedFunding: grants[i].availableFunds + grants[j].availableFunds,
          winProbabilityBoost: 0,
          applicationWorkload: 0
        });
      }
    }
    
    // Generate 3-grant combinations for high-value opportunities
    const highValueGrants = grants.filter(g => g.availableFunds > 100000);
    for (let i = 0; i < Math.min(highValueGrants.length, 5); i++) {
      for (let j = i + 1; j < Math.min(highValueGrants.length, 5); j++) {
        for (let k = j + 1; k < Math.min(highValueGrants.length, 5); k++) {
          combinations.push({
            grants: [highValueGrants[i], highValueGrants[j], highValueGrants[k]],
            overlapScore: 0,
            synergies: [],
            conflictRisks: [],
            combinedFunding: highValueGrants[i].availableFunds + highValueGrants[j].availableFunds + highValueGrants[k].availableFunds,
            winProbabilityBoost: 0,
            applicationWorkload: 0
          });
        }
      }
    }
    
    return combinations;
  }

  /**
   * Score grant combinations using AI analysis
   */
  private async scoreGrantCombinations(combinations: GrantCombination[], userProfile: any): Promise<GrantCombination[]> {
    const scoredCombinations: GrantCombination[] = [];
    
    for (const combination of combinations) {
      try {
        // Use AI to analyze synergies and overlaps
        const analysisPrompt = `
        Analyze this grant combination for strategic overlap opportunities:
        
        Grants:
        ${combination.grants.map(g => `- ${g.title} (${g.source}): ${g.categories.join(', ')} - $${g.availableFunds.toLocaleString()}`).join('\n')}
        
        User Profile: ${JSON.stringify(userProfile, null, 2)}
        
        Analyze:
        1. Category overlaps and synergies
        2. Application component reusability
        3. Technical skill overlaps
        4. Timeline compatibility
        5. Funding complementarity
        6. Potential conflicts or exclusions
        
        Provide analysis in JSON format with:
        - overlapScore (0-100)
        - synergies (array of strings)
        - conflictRisks (array of strings) 
        - winProbabilityBoost (0-50)
        - applicationWorkload (1-10)
        `;
        
        const aiResponse = await smartAI.query(analysisPrompt, {
          responseType: 'analysis',
          maxTokens: 1000
        });
        
        const analysis = this.parseAIAnalysis(aiResponse);
        
        const scoredCombination: GrantCombination = {
          ...combination,
          overlapScore: analysis.overlapScore || this.calculateBasicOverlapScore(combination),
          synergies: analysis.synergies || this.identifyBasicSynergies(combination),
          conflictRisks: analysis.conflictRisks || [],
          winProbabilityBoost: analysis.winProbabilityBoost || 0,
          applicationWorkload: analysis.applicationWorkload || 5
        };
        
        scoredCombinations.push(scoredCombination);
        
      } catch (error) {
        // Fallback to basic scoring
        const scoredCombination: GrantCombination = {
          ...combination,
          overlapScore: this.calculateBasicOverlapScore(combination),
          synergies: this.identifyBasicSynergies(combination),
          conflictRisks: [],
          winProbabilityBoost: 0,
          applicationWorkload: 5
        };
        
        scoredCombinations.push(scoredCombination);
      }
    }
    
    // Sort by overlap score descending
    return scoredCombinations.sort((a, b) => b.overlapScore - a.overlapScore);
  }

  /**
   * Calculate basic overlap score without AI
   */
  private calculateBasicOverlapScore(combination: GrantCombination): number {
    const grants = combination.grants;
    let score = 0;
    
    // Category overlap scoring
    const allCategories = grants.flatMap(g => g.categories);
    const uniqueCategories = [...new Set(allCategories)];
    const overlapRatio = (allCategories.length - uniqueCategories.length) / allCategories.length;
    score += overlapRatio * 40;
    
    // Source diversity bonus
    const uniqueSources = new Set(grants.map(g => g.source)).size;
    if (uniqueSources === grants.length) score += 20;
    
    // Funding size bonus
    const avgFunding = combination.combinedFunding / grants.length;
    if (avgFunding > 200000) score += 20;
    else if (avgFunding > 100000) score += 10;
    
    // Timeline compatibility
    const deadlines = grants.filter(g => g.applicationDeadline).map(g => g.applicationDeadline!);
    if (deadlines.length > 1) {
      const daysDiff = Math.abs(deadlines[0].getTime() - deadlines[1].getTime()) / (1000 * 60 * 60 * 24);
      if (daysDiff > 30) score += 10; // Good spacing
    }
    
    return Math.min(100, score);
  }

  /**
   * Identify basic synergies
   */
  private identifyBasicSynergies(combination: GrantCombination): string[] {
    const synergies: string[] = [];
    const grants = combination.grants;
    
    // Category synergies
    const categories = grants.flatMap(g => g.categories);
    if (categories.includes('AI') && categories.includes('Web3')) {
      synergies.push('AI-Web3 integration opportunity');
    }
    if (categories.includes('Research') && categories.includes('Development')) {
      synergies.push('Research-to-development pipeline');
    }
    
    // Source synergies
    const hasCorporate = grants.some(g => ['NVIDIA', 'Google', 'ChainGPT'].includes(g.source));
    const hasGovernment = grants.some(g => ['NSF', 'DARPA', 'NIH'].includes(g.source));
    if (hasCorporate && hasGovernment) {
      synergies.push('Public-private partnership potential');
    }
    
    // Funding complementarity
    const fundingRange = Math.max(...grants.map(g => g.availableFunds)) - Math.min(...grants.map(g => g.availableFunds));
    if (fundingRange > 100000) {
      synergies.push('Diverse funding levels for staged development');
    }
    
    return synergies;
  }

  /**
   * Parse AI analysis response
   */
  private parseAIAnalysis(response: string): any {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.warn('Failed to parse AI analysis response:', error);
    }
    return {};
  }

  /**
   * Calculate optimal application strategy
   */
  private async calculateOptimalStrategy(combinations: GrantCombination[], userProfile: any, teamPreferences: any): Promise<OptimalStrategy> {
    const topCombination = combinations[0];
    if (!topCombination) {
      throw new Error('No grant combinations available');
    }
    
    const grants = topCombination.grants;
    
    // Calculate application sequence based on deadlines and dependencies
    const applicationSequence: ApplicationSequence[] = grants.map((grant, index) => ({
      grantId: grant.id,
      startDate: new Date(),
      submissionDate: grant.applicationDeadline || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days default
      preparationTime: 30, // 30 days default
      dependencies: index > 0 ? [grants[index - 1].id] : []
    }));
    
    // Resource allocation
    const resourceAllocation: ResourceAllocation = {
      teamMemberHours: {
        'Technical Lead': 120,
        'Research Lead': 100,
        'Project Manager': 80,
        'Grant Writer': 60
      },
      budgetDistribution: {
        'Personnel': 0.6,
        'Equipment': 0.2,
        'Overhead': 0.15,
        'Travel': 0.05
      },
      technicalRequirements: ['AI/ML expertise', 'Web3 development', 'Research methodology']
    };
    
    // Timeline optimization
    const timelineOptimization: TimelineOptimization = {
      parallelApplications: grants.length > 2 ? [[grants[0].id, grants[1].id]] : [],
      sequentialDependencies: grants.length > 1 ? [[grants[0].id, grants[1].id]] : [],
      criticalPath: grants.map(g => g.id),
      bufferTime: 7 // 7 days buffer
    };
    
    return {
      priorityOrder: grants.map(g => g.id),
      applicationSequence,
      resourceAllocation,
      timelineOptimization
    };
  }

  /**
   * Assess overlap risks and conflicts
   */
  private async assessOverlapRisks(combinations: GrantCombination[]): Promise<RiskAssessment> {
    const overlapConflicts: ConflictRisk[] = [];
    const competitionLevel: { [grantId: number]: number } = {};
    const successProbability: { [grantId: number]: number } = {};
    const mitigation: MitigationStrategy[] = [];
    
    // Analyze each combination for conflicts
    for (const combination of combinations.slice(0, 5)) {
      for (const grant of combination.grants) {
        competitionLevel[grant.id] = this.estimateCompetitionLevel(grant);
        successProbability[grant.id] = this.estimateSuccessProbability(grant);
      }
      
      // Check for potential conflicts
      if (combination.conflictRisks.length > 0) {
        for (const risk of combination.conflictRisks) {
          overlapConflicts.push({
            type: 'scope_duplication',
            severity: 'medium',
            affectedGrants: combination.grants.map(g => g.id),
            description: risk,
            mitigation: 'Clearly differentiate project scopes and deliverables'
          });
        }
      }
    }
    
    return {
      overlapConflicts,
      competitionLevel,
      successProbability,
      mitigation
    };
  }

  /**
   * Estimate competition level for a grant
   */
  private estimateCompetitionLevel(grant: GrantOpportunity): number {
    let competition = 0.5; // Base competition level
    
    // Higher funding = more competition
    if (grant.availableFunds > 500000) competition += 0.3;
    else if (grant.availableFunds > 100000) competition += 0.2;
    
    // Popular categories = more competition
    if (grant.categories.includes('AI')) competition += 0.2;
    if (grant.categories.includes('Web3')) competition += 0.1;
    
    // Government grants typically more competitive
    if (['NSF', 'DARPA', 'NIH'].includes(grant.source)) competition += 0.2;
    
    return Math.min(1.0, competition);
  }

  /**
   * Estimate success probability for a grant
   */
  private estimateSuccessProbability(grant: GrantOpportunity): number {
    let probability = 0.3; // Base probability
    
    // Lower competition grants
    const competition = this.estimateCompetitionLevel(grant);
    probability += (1 - competition) * 0.3;
    
    // Corporate grants often higher success rate
    if (['NVIDIA', 'Google', 'ChainGPT'].includes(grant.source)) probability += 0.2;
    
    // Open source / community grants
    if (grant.categories.includes('Open Source')) probability += 0.1;
    
    return Math.min(0.8, probability);
  }

  /**
   * Analyze timeline optimization
   */
  private async analyzeTimelines(grants: GrantOpportunity[], strategy: OptimalStrategy): Promise<TimelineAnalysis> {
    const applicationWindows: ApplicationWindow[] = [];
    const deadlineClashes: DeadlineClash[] = [];
    const optimalSubmissionDates: { [grantId: number]: Date } = {};
    const workloadDistribution: WorkloadPeriod[] = [];
    
    // Create application windows
    for (const grant of grants) {
      const deadline = grant.applicationDeadline || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);
      const openDate = new Date(deadline.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days before
      
      applicationWindows.push({
        grantId: grant.id,
        openDate,
        deadlineDate: deadline,
        preparationPeriod: 30,
        competitiveness: this.estimateCompetitionLevel(grant)
      });
      
      // Optimal submission is typically 1-2 weeks before deadline
      optimalSubmissionDates[grant.id] = new Date(deadline.getTime() - 7 * 24 * 60 * 60 * 1000);
    }
    
    // Check for deadline clashes
    for (let i = 0; i < applicationWindows.length; i++) {
      for (let j = i + 1; j < applicationWindows.length; j++) {
        const daysDiff = Math.abs(
          applicationWindows[i].deadlineDate.getTime() - applicationWindows[j].deadlineDate.getTime()
        ) / (1000 * 60 * 60 * 24);
        
        if (daysDiff < 14) {
          deadlineClashes.push({
            grantIds: [applicationWindows[i].grantId, applicationWindows[j].grantId],
            clashDate: applicationWindows[i].deadlineDate,
            severity: daysDiff < 7 ? 'critical' : 'major',
            resolution: 'Stagger application preparation or prioritize higher-value grant'
          });
        }
      }
    }
    
    return {
      applicationWindows,
      deadlineClashes,
      optimalSubmissionDates,
      workloadDistribution
    };
  }
}

export const grantOverlapAnalysisService = new GrantOverlapAnalysisService();