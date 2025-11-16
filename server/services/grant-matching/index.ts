/**
 * HyperCrowd Grant Matching Service
 * 
 * This service handles matching RFPs and projects with appropriate grant sources.
 * It provides multiple matching algorithms:
 * 1. Rule-based matching - Uses explicit criteria matching (categories, keywords, funding amounts)
 * 2. Semantic matching - Uses AI-powered semantic similarity
 * 3. Hybrid matching - Combines both approaches for optimal results
 * 4. Reputation-enhanced matching - Takes user reputation into account
 */

import { logger } from '../../utils/logger';

// Helper function to use the same log format as the rest of the app
const log = (message: string, source: string = 'grant-matching') => {
  logger.info(`[${source}] ${message}`);
};
import { storage } from '../../storage';
import { smartAI } from '../redundancy/ai/smart-ai-service';
import { perplexityGenerateGrantMatches } from '../perplexity-service';
import { calculateRepScore, getTopReputationInfluencers } from '../reputation';
import { calculateSemanticSimilarity } from '../ai-utils';

// Import types
import type { 
  GrantSource, 
  RFP, 
  Project, 
  GrantMatch,
  User,
  ReputationActivity 
} from '../../../shared/schema';

// Constants
const DEFAULT_MATCH_THRESHOLD = 0.5; // 50% match or better
const DEFAULT_MAX_RESULTS = 10;
const CATEGORIES_WEIGHT = 0.3;
const KEYWORDS_WEIGHT = 0.25;
const FUNDING_WEIGHT = 0.15;
const REPUTATION_WEIGHT = 0.2;
const SEMANTIC_WEIGHT = 0.1;

// Type definitions for matching parameters
export interface GrantMatchingOptions {
  threshold?: number;
  maxResults?: number;
  includeReputation?: boolean;
  semanticMatching?: boolean;
  enhancementLevel?: 'basic' | 'detailed' | 'comprehensive';
}

/**
 * Find matching grants using AI-enhanced algorithms
 */
export async function findAIEnhancedGrantMatches(
  rfp: RFP,
  options: GrantMatchingOptions = {}
): Promise<GrantMatch[]> {
  try {
    log(`Starting AI-enhanced grant matching for RFP: ${rfp.title}`, 'grant-matching');
    
    // Apply default options if not specified
    const threshold = options.threshold || DEFAULT_MATCH_THRESHOLD;
    const maxResults = options.maxResults || DEFAULT_MAX_RESULTS;
    const includeReputation = options.includeReputation !== false;
    
    // Get available grant sources
    const grantSources = await storage.getActiveGrantSources();
    if (!grantSources || grantSources.length === 0) {
      log('No active grant sources found', 'grant-matching');
      return [];
    }
    
    log(`Found ${grantSources.length} active grant sources to evaluate`, 'grant-matching');
    
    try {
      // Try AI-powered matching first
      const aiMatches = await generateAIMatchesPerplexity(rfp, grantSources);
      
      if (aiMatches && aiMatches.length > 0) {
        log(`Successfully generated ${aiMatches.length} AI-enhanced matches`, 'grant-matching');
        
        // Convert AI results to GrantMatch format
        const formattedMatches = await formatAIMatches(rfp, aiMatches, grantSources);
        
        // Apply reputation enhancement if requested
        const finalMatches = includeReputation 
          ? await enhanceMatchesWithReputation(formattedMatches, rfp.creatorId) 
          : formattedMatches;
            
        // Filter by threshold and limit results
        return finalMatches
          .filter(match => parseFloat(match.matchScore) >= threshold)
          .sort((a, b) => parseFloat(b.matchScore) - parseFloat(a.matchScore))
          .slice(0, maxResults);
      }
    } catch (aiError) {
      log(`AI-powered matching failed: ${aiError.message}`, 'grant-matching');
      // Continue with rule-based fallback
    }
    
    // Fallback to rule-based matching
    log('Falling back to rule-based matching', 'grant-matching');
    return findRuleBasedMatches(rfp, { threshold, maxResults, includeReputation });
  } catch (error) {
    log(`Error in findAIEnhancedGrantMatches: ${error.message}`, 'grant-matching');
    throw error;
  }
}

/**
 * Find matching grants using rule-based algorithms
 */
export async function findRuleBasedMatches(
  rfp: RFP,
  options: GrantMatchingOptions = {}
): Promise<GrantMatch[]> {
  try {
    log(`Starting rule-based grant matching for RFP: ${rfp.title}`, 'grant-matching');
    
    // Apply default options if not specified
    const threshold = options.threshold || DEFAULT_MATCH_THRESHOLD;
    const maxResults = options.maxResults || DEFAULT_MAX_RESULTS;
    const includeReputation = options.includeReputation !== false;
    
    // Get available grant sources
    const grantSources = await storage.getActiveGrantSources();
    if (!grantSources || grantSources.length === 0) {
      log('No active grant sources found', 'grant-matching');
      return [];
    }
    
    log(`Found ${grantSources.length} active grant sources to evaluate`, 'grant-matching');
    
    // Calculate match scores for each grant source
    const matches: GrantMatch[] = grantSources.map((grantSource, index) => {
      const matchScore = calculateRuleBasedScore(rfp, grantSource);
      
      return {
        id: index + 1,
        rfpId: rfp.id,
        grantSourceId: grantSource.id,
        matchScore: matchScore.toFixed(2),
        status: "suggested",
        matchReason: defaultMatchReason(rfp, grantSource),
        potentialFunding: grantSource.availableFunds,
        grantSource: grantSource,
        aiRecommended: false,
        tags: extractTags(rfp, grantSource),
      };
    });
    
    // Apply reputation enhancement if requested
    const finalMatches = includeReputation 
      ? await enhanceMatchesWithReputation(matches, rfp.creatorId) 
      : matches;
    
    // Filter by threshold and limit results
    return finalMatches
      .filter(match => parseFloat(match.matchScore) >= threshold)
      .sort((a, b) => parseFloat(b.matchScore) - parseFloat(a.matchScore))
      .slice(0, maxResults);
  } catch (error) {
    log(`Error in findRuleBasedMatches: ${error.message}`, 'grant-matching');
    throw error;
  }
}

/**
 * Calculate rule-based match score between an RFP and a grant source
 */
export function calculateRuleBasedScore(rfp: RFP, grantSource: GrantSource): number {
  try {
    let totalScore = 0;
    let componentScores = {
      categoryMatch: 0,
      keywordMatch: 0,
      fundingMatch: 0
    };
    
    // 1. Category matching (30%)
    const rfpCategories = rfp.categories || [];
    const grantCategories = grantSource.categories || [];
    
    if (rfpCategories.length > 0 && grantCategories.length > 0) {
      const matchingCategories = rfpCategories.filter(category => 
        grantCategories.some(gc => gc.toLowerCase() === category.toLowerCase())
      );
      
      componentScores.categoryMatch = matchingCategories.length / 
        Math.max(rfpCategories.length, grantCategories.length);
    }
    
    // 2. Keyword matching (25%)
    const rfpKeywords = extractKeywords(rfp.title + ' ' + rfp.description);
    const grantKeywords = extractKeywords(grantSource.name + ' ' + grantSource.description);
    
    if (rfpKeywords.length > 0 && grantKeywords.length > 0) {
      const matchingKeywords = rfpKeywords.filter(keyword => 
        grantKeywords.some(gk => gk.toLowerCase().includes(keyword.toLowerCase()) || 
                            keyword.toLowerCase().includes(gk.toLowerCase()))
      );
      
      componentScores.keywordMatch = matchingKeywords.length / 
        Math.max(rfpKeywords.length, 10); // Cap at 10 keywords for normalization
    }
    
    // 3. Funding match (15%)
    if (rfp.fundingGoal && grantSource.availableFunds) {
      // Perfect match if grant can fully fund the RFP
      if (grantSource.availableFunds >= rfp.fundingGoal) {
        componentScores.fundingMatch = 1;
      } else {
        // Partial match based on percentage of funding
        componentScores.fundingMatch = grantSource.availableFunds / rfp.fundingGoal;
        // Cap at 0.85 since it can't fully fund
        componentScores.fundingMatch = Math.min(componentScores.fundingMatch, 0.85);
      }
    } else {
      // If either value is missing, assign neutral score
      componentScores.fundingMatch = 0.5;
    }
    
    // Calculate weighted total (out of the weights we can calculate without reputation/semantic)
    const effectiveCategoriesWeight = CATEGORIES_WEIGHT / (CATEGORIES_WEIGHT + KEYWORDS_WEIGHT + FUNDING_WEIGHT);
    const effectiveKeywordsWeight = KEYWORDS_WEIGHT / (CATEGORIES_WEIGHT + KEYWORDS_WEIGHT + FUNDING_WEIGHT);
    const effectiveFundingWeight = FUNDING_WEIGHT / (CATEGORIES_WEIGHT + KEYWORDS_WEIGHT + FUNDING_WEIGHT);
    
    totalScore = 
      (componentScores.categoryMatch * effectiveCategoriesWeight) +
      (componentScores.keywordMatch * effectiveKeywordsWeight) +
      (componentScores.fundingMatch * effectiveFundingWeight);
    
    return totalScore;
  } catch (error) {
    log(`Error calculating rule-based score: ${error.message}`, 'grant-matching');
    return 0.1; // Return a minimal score on error
  }
}

/**
 * Enhance matches with reputation data
 */
async function enhanceMatchesWithReputation(
  matches: GrantMatch[], 
  userId: number
): Promise<GrantMatch[]> {
  try {
    if (!userId) {
      return matches; // No user ID provided
    }
    
    // Get reputation data for user
    const reputationScore = await calculateRepScore(userId);
    if (!reputationScore) {
      return matches; // No reputation data
    }
    
    // Apply reputation boost to match scores
    return matches.map(match => {
      // Calculate reputation adjustment (0.8 to 1.2 multiplier)
      const normalizedRepScore = Math.min(Math.max(reputationScore / 100, 0), 1);
      const repMultiplier = 0.8 + (normalizedRepScore * 0.4);
      
      // Apply multiplier but ensure we don't exceed 1.0
      const adjustedScore = Math.min(
        parseFloat(match.matchScore) * repMultiplier, 
        1.0
      ).toFixed(2);
      
      return {
        ...match,
        matchScore: adjustedScore,
        reputationEnhanced: true
      };
    });
  } catch (error) {
    log(`Error enhancing matches with reputation: ${error.message}`, 'grant-matching');
    return matches; // Return original matches on error
  }
}

/**
 * Generate AI matches using Perplexity
 */
async function generateAIMatchesPerplexity(
  rfp: RFP, 
  grantSources: GrantSource[]
): Promise<any[]> {
  try {
    // Check if we should try Perplexity API
    if (!process.env.PERPLEXITY_API_KEY) {
      throw new Error('PERPLEXITY_API_KEY not available');
    }
    
    // Format grant sources for AI
    const formattedSources = grantSources.map(source => ({
      id: source.id,
      name: source.name,
      description: source.description,
      categories: source.categories,
      availableFunds: source.availableFunds,
      requirements: source.requirements
    }));
    
    // Call Perplexity service
    return await perplexityGenerateGrantMatches(rfp, formattedSources);
  } catch (error) {
    log(`Error generating AI matches with Perplexity: ${error.message}`, 'grant-matching');
    throw error;
  }
}

/**
 * Format AI matches into standard GrantMatch format
 */
async function formatAIMatches(
  rfp: RFP, 
  aiMatches: any[], 
  grantSources: GrantSource[]
): Promise<GrantMatch[]> {
  try {
    return aiMatches.map((match, index) => {
      // Find the corresponding grant source
      const grantSource = grantSources.find(source => source.id === match.grantSourceId);
      
      if (!grantSource) {
        log(`Warning: Grant source with ID ${match.grantSourceId} not found`, 'grant-matching');
        return null;
      }
      
      // Convert AI match score (0-100) to our format (0-1)
      const normalizedScore = (match.matchScore / 100).toFixed(2);
      
      return {
        id: index + 1,
        rfpId: rfp.id,
        grantSourceId: grantSource.id,
        matchScore: normalizedScore,
        status: "suggested",
        matchReason: match.explanation || defaultMatchReason(rfp, grantSource),
        potentialFunding: grantSource.availableFunds,
        grantSource: grantSource,
        aiRecommended: true,
        tags: match.tags || extractTags(rfp, grantSource),
      };
    }).filter(Boolean); // Filter out null entries
  } catch (error) {
    log(`Error formatting AI matches: ${error.message}`, 'grant-matching');
    return [];
  }
}

/**
 * Extract keywords from text
 */
function extractKeywords(text: string): string[] {
  try {
    if (!text) return [];
    
    // Simple keyword extraction logic
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .split(/\s+/) // Split on whitespace
      .filter(word => word.length > 3); // Filter out short words
    
    // Remove common stopwords
    const stopwords = ['this', 'that', 'these', 'those', 'with', 'from', 'about', 'their', 'would', 'could', 'should', 'have', 'which', 'while', 'where'];
    const filteredWords = words.filter(word => !stopwords.includes(word));
    
    // Count frequency
    const wordFrequency: Record<string, number> = {};
    for (const word of filteredWords) {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
    }
    
    // Get unique words sorted by frequency (most frequent first)
    return Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 20); // Limit to top 20 keywords
  } catch (error) {
    log(`Error extracting keywords: ${error.message}`, 'grant-matching');
    return [];
  }
}

/**
 * Generate a default match reason
 */
export function defaultMatchReason(rfp: RFP, grantSource: GrantSource): string {
  try {
    // Extract categories from RFP and grant
    const rfpCategories = rfp.categories || [];
    const grantCategories = grantSource.categories || [];
    
    // Find matching categories
    const matchingCategories = rfpCategories.filter(category => 
      grantCategories.some(gc => gc.toLowerCase() === category.toLowerCase())
    );
    
    if (matchingCategories.length > 0) {
      return `Matches ${matchingCategories.length} categories: ${matchingCategories.slice(0, 3).join(', ')}${matchingCategories.length > 3 ? '...' : ''}`;
    }
    
    // If no matching categories, check funding goals
    if (rfp.fundingGoal && grantSource.availableFunds) {
      if (grantSource.availableFunds >= rfp.fundingGoal) {
        return `Grant can fully fund your project's requested amount of $${rfp.fundingGoal.toLocaleString()}`;
      } else {
        const percentage = Math.round((grantSource.availableFunds / rfp.fundingGoal) * 100);
        return `Grant can fund ${percentage}% of your project's requested amount`;
      }
    }
    
    // Generic fallback reason
    return "Potential match based on project and grant details";
  } catch (error) {
    log(`Error generating match reason: ${error.message}`, 'grant-matching');
    return "Potential funding opportunity";
  }
}

/**
 * Extract tags based on RFP and grant source
 */
function extractTags(rfp: RFP, grantSource: GrantSource): string[] {
  try {
    const tags: string[] = [];
    
    // Add categories as tags
    const categories = [...(rfp.categories || []), ...(grantSource.categories || [])];
    
    // Add unique categories (up to 5)
    new Set(categories).forEach(category => {
      if (tags.length < 5) {
        tags.push(category);
      }
    });
    
    // If we need more tags, extract from descriptions
    if (tags.length < 5) {
      const keywords = extractKeywords(rfp.title + ' ' + rfp.description + ' ' + grantSource.name + ' ' + grantSource.description);
      for (const keyword of keywords) {
        if (tags.length < 5 && !tags.includes(keyword)) {
          tags.push(keyword);
        }
      }
    }
    
    return tags.slice(0, 5);
  } catch (error) {
    log(`Error extracting tags: ${error.message}`, 'grant-matching');
    return [];
  }
}