// Grant Matching Service
// Provides both rule-based and AI-enhanced grant matching capabilities

import { storage } from "../storage";
import { perplexityChat } from "./perplexity-service";
import type { GrantSource, RFP, User } from "@shared/schema";
import { log } from "../vite";

/**
 * Calculate a simple rule-based match score between an RFP and a grant source
 * @param rfp The request for proposal
 * @param grantSource The grant source to match against
 * @returns A number between 0 and 1 representing match quality
 */
export function calculateRuleBasedScore(rfp: RFP, grantSource: GrantSource): number {
  let score = 0;
  
  // Base score - all grants start with a small chance
  score += 0.1;
  
  // Category matching (most important)
  const rfpCategories = rfp.categories || [];
  const grantCategories = grantSource.categories || [];
  
  const matchingCategories = rfpCategories.filter(cat => 
    grantCategories.some(g => g.toLowerCase() === cat.toLowerCase())
  );
  
  // Add up to 0.5 points for category matches
  if (matchingCategories.length > 0) {
    // % of RFP categories that match grant categories
    const rfpCategoryMatchPercent = matchingCategories.length / rfpCategories.length;
    // % of grant categories that match RFP categories
    const grantCategoryMatchPercent = matchingCategories.length / grantCategories.length;
    
    // Average of both percentages, weighted towards more importance on RFP matching grant
    score += (rfpCategoryMatchPercent * 0.3) + (grantCategoryMatchPercent * 0.2);
  }
  
  // Title and description keyword matching
  if (grantSource.name && rfp.title) {
    // Simple keyword extraction and matching
    const grantKeywords = extractKeywords(grantSource.name);
    const rfpTitleKeywords = extractKeywords(rfp.title);
    
    const matchingTitleKeywords = rfpTitleKeywords.filter(k => 
      grantKeywords.some(gk => gk.toLowerCase() === k.toLowerCase())
    );
    
    if (matchingTitleKeywords.length > 0) {
      score += 0.1 * (matchingTitleKeywords.length / rfpTitleKeywords.length);
    }
  }
  
  if (grantSource.description && rfp.description) {
    // Word matching between descriptions
    const grantWords = grantSource.description.toLowerCase().split(/\W+/);
    const rfpWords = rfp.description.toLowerCase().split(/\W+/);
    
    const significantRfpWords = rfpWords.filter(w => w.length > 3);
    const matchingWords = significantRfpWords.filter(w => grantWords.includes(w));
    
    if (matchingWords.length > 0 && significantRfpWords.length > 0) {
      score += 0.1 * (matchingWords.length / significantRfpWords.length);
    }
  }
  
  // Funding match
  if (rfp.fundingGoal && grantSource.availableFunds) {
    if (grantSource.availableFunds >= rfp.fundingGoal) {
      score += 0.1;
    } else {
      // Partial funding score
      score += 0.1 * (grantSource.availableFunds / rfp.fundingGoal);
    }
  }
  
  // Cap score at 1.0
  return Math.min(1.0, score);
}

/**
 * Generate a default match reason based on RFP and grant source
 */
export function defaultMatchReason(rfp: RFP, grantSource: GrantSource): string {
  // Find matching categories
  const rfpCategories = rfp.categories || [];
  const grantCategories = grantSource.categories || [];
  
  const matchingCategories = rfpCategories.filter(cat => 
    grantCategories.some(g => g.toLowerCase() === cat.toLowerCase())
  );
  
  if (matchingCategories.length > 0) {
    return `This grant matches your project's ${matchingCategories.join(', ')} categories.`;
  }
  
  if (grantSource.availableFunds && rfp.fundingGoal && grantSource.availableFunds >= rfp.fundingGoal) {
    return `This grant has sufficient funding (${formatCurrency(grantSource.availableFunds)}) to meet your funding goal.`;
  }
  
  return `This grant might be relevant to your project.`;
}

/**
 * Use AI to find enhanced grant matches for an RFP
 * @param rfp The request for proposal to find matches for
 * @returns Array of grant matches with AI-enhanced scoring and reasoning
 */
export async function findAIEnhancedGrantMatches(rfp: RFP): Promise<any[]> {
  try {
    const grantSources = await storage.getActiveGrantSources();
    
    if (!grantSources || grantSources.length === 0) {
      console.log('[grant-matching-service] No active grant sources found');
      return [];
    }
    
    // First, filter potential matches with rule-based method
    const potentialMatches = grantSources.map(source => ({
      grantSource: source,
      score: calculateRuleBasedScore(rfp, source)
    })).sort((a, b) => b.score - a.score);
    
    // Take top 5 potential matches for AI enhancement
    const topMatches = potentialMatches.slice(0, 5);
    
    console.log(`[grant-matching-service] Found ${topMatches.length} potential matches for RFP: ${rfp.title}`);
    
    // Use AI to enhance the matching logic for top matches
    const aiEnhancedMatches = await Promise.all(topMatches.map(async (match, index) => {
      try {
        // Prepare AI prompt with RFP and grant information
        const aiResults = await evaluateAIMatch(rfp, match.grantSource);
        
        return {
          id: index + 1,
          rfpId: rfp.id,
          grantSourceId: match.grantSource.id,
          matchScore: (aiResults.score).toFixed(2),
          status: "suggested",
          matchReason: aiResults.reason || defaultMatchReason(rfp, match.grantSource),
          potentialFunding: estimatePotentialFunding(rfp, match.grantSource),
          grantSource: match.grantSource
        };
      } catch (error) {
        console.error('[grant-matching-service] AI enhancement failed for match', error);
        
        // Fallback to rule-based matching
        return {
          id: index + 1,
          rfpId: rfp.id,
          grantSourceId: match.grantSource.id,
          matchScore: match.score.toFixed(2),
          status: "suggested",
          matchReason: defaultMatchReason(rfp, match.grantSource),
          potentialFunding: estimatePotentialFunding(rfp, match.grantSource),
          grantSource: match.grantSource
        };
      }
    }));
    
    // Sort by AI-enhanced score
    return aiEnhancedMatches.sort((a, b) => parseFloat(b.matchScore) - parseFloat(a.matchScore));
  } catch (error) {
    console.error('[grant-matching-service] Error in AI enhanced grant matching:', error);
    throw error;
  }
}

/**
 * Use AI to evaluate the match between an RFP and a grant
 */
async function evaluateAIMatch(rfp: RFP, grantSource: GrantSource): Promise<{ score: number, reason: string }> {
  try {
    const prompt = `
You are an expert grant matching algorithm. You need to evaluate how well a grant source matches a Request for Proposal (RFP).

RFP:
- Title: ${rfp.title}
- Description: ${rfp.description}
- Categories: ${rfp.categories?.join(', ') || 'None specified'}
- Funding Goal: ${formatCurrency(rfp.fundingGoal)}
- Duration: ${rfp.durationDays || 'Not specified'} days

Grant Source:
- Name: ${grantSource.name}
- Description: ${grantSource.description}
- Categories: ${grantSource.categories?.join(', ') || 'None specified'} 
- Available Funds: ${formatCurrency(grantSource.availableFunds)}

Please analyze if this grant source is a good match for the RFP. Respond with a JSON object containing:
1. "score": A number between 0.0 and 1.0 representing how good the match is (0 being no match, 1 being perfect match)
2. "reason": A brief explanation (1-2 sentences) for why this is a good match or not

Example response: {"score": 0.8, "reason": "Strong category alignment in AI and blockchain with sufficient funding available."} 
`;

    // Call Perplexity AI API
    const perplexityResponse = await perplexityChat(prompt);
    
    // Parse JSON from response
    try {
      // Extract JSON object from response if it's wrapped in text
      const jsonMatch = perplexityResponse.match(/\{.*\}/s);
      
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const result = JSON.parse(jsonStr);
        
        // Validate and sanitize the result
        const score = typeof result.score === 'number' ? 
                       Math.min(1.0, Math.max(0.0, result.score)) : 0.5;
                       
        const reason = typeof result.reason === 'string' ? 
                       result.reason.slice(0, 150) : defaultMatchReason(rfp, grantSource);
        
        return { score, reason };
      }
    } catch (parseError) {
      console.error('[grant-matching-service] Error parsing AI response:', parseError);
    }
    
    // Fallback to rule-based score if AI fails
    const fallbackScore = calculateRuleBasedScore(rfp, grantSource);
    return { 
      score: fallbackScore, 
      reason: defaultMatchReason(rfp, grantSource)
    };
  } catch (error) {
    console.error('[grant-matching-service] AI match evaluation failed:', error);
    const fallbackScore = calculateRuleBasedScore(rfp, grantSource);
    return { 
      score: fallbackScore, 
      reason: defaultMatchReason(rfp, grantSource)
    };
  }
}

/**
 * Estimate the potential funding amount from a grant source for an RFP
 */
function estimatePotentialFunding(rfp: RFP, grantSource: GrantSource): number {
  if (!grantSource.availableFunds) {
    return 0;
  }
  
  if (!rfp.fundingGoal) {
    // If no funding goal specified, estimate a reasonable amount
    return Math.min(grantSource.availableFunds, 100000);
  }
  
  // Return the minimum of funding goal and available funds
  return Math.min(grantSource.availableFunds, rfp.fundingGoal);
}

/**
 * Extract keywords from a string
 */
function extractKeywords(text: string): string[] {
  // Simple implementation - just splits by spaces and removes short words
  return text.split(/\W+/).filter(word => word.length > 3);
}

/**
 * Format a number as currency
 */
function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) {
    return 'Amount not specified';
  }
  
  return `$${amount.toLocaleString()}`;
}

/**
 * Test blockchain integration for grant matching
 * This function simulates blockchain-based grant matching with cross-chain capabilities
 * @param rfpId The ID of the RFP to test blockchain grant matching for
 * @returns Test results data
 */
export async function testBlockchainGrantMatching(rfpId: number): Promise<any> {
  log('Starting blockchain grant matching test', 'blockchain-test');
  
  try {
    // Get the RFP
    const rfp = await storage.getRfpById(rfpId);
    if (!rfp) {
      throw new Error(`RFP with ID ${rfpId} not found`);
    }
    
    log(`Testing blockchain grant matching for RFP: ${rfp.title}`, 'blockchain-test');
    
    // Simulate blockchain operations with delays to mimic real transactions
    const transactions = [];
    
    // Step 1: Simulate cross-chain grant contract deployment
    await simulateBlockchainDelay(1500);
    transactions.push({
      txHash: generateMockTxHash(),
      operation: 'Deploy Grant Registry Contract',
      network: 'Polygon zkEVM',
      status: 'Success',
      gasUsed: Math.floor(Math.random() * 1000000) + 500000,
      timestamp: new Date().toISOString()
    });
    
    log('Successfully simulated grant registry contract deployment', 'blockchain-test');
    
    // Step 2: Simulate multi-chain grant resource allocation
    await simulateBlockchainDelay(2000);
    const fundingNetworks = ['Polygon zkEVM', 'Solana'];
    
    for (const network of fundingNetworks) {
      transactions.push({
        txHash: generateMockTxHash(),
        operation: 'Resource Allocation',
        network,
        status: 'Success',
        amount: network === 'Polygon zkEVM' ? 
          Math.floor(Math.random() * 5000) + 1000 : 
          Math.floor(Math.random() * 100) + 20,
        tokenSymbol: network === 'Polygon zkEVM' ? 'MATIC' : 'SOL',
        timestamp: new Date().toISOString()
      });
    }
    
    log('Successfully simulated multi-chain resource allocation', 'blockchain-test');
    
    // Step 3: Simulate grant matching criteria publishing
    await simulateBlockchainDelay(1000);
    transactions.push({
      txHash: generateMockTxHash(),
      operation: 'Publish Grant Criteria',
      network: 'Polygon zkEVM',
      status: 'Success',
      ipfsHash: `Qm${generateRandomString(44)}`,
      criteriaCount: rfp.categories?.length || 3,
      timestamp: new Date().toISOString()
    });
    
    log('Successfully simulated grant criteria publishing', 'blockchain-test');
    
    // Step 4: Simulate zero-knowledge proof generation for private matching
    await simulateBlockchainDelay(3000);
    const zkProof = {
      proof: generateRandomString(128),
      publicInputs: [
        rfpId.toString(),
        generateRandomString(32),
        generateRandomString(32)
      ],
      verifierContract: `0x${generateRandomString(40)}`
    };
    
    transactions.push({
      txHash: generateMockTxHash(),
      operation: 'ZK-Proof Generation',
      network: 'Polygon zkEVM',
      status: 'Success',
      zkProof,
      timestamp: new Date().toISOString()
    });
    
    log('Successfully simulated ZK-proof generation for private matching', 'blockchain-test');
    
    // Step 5: Simulate grant sources on multiple networks
    const grantSources = await storage.getActiveGrantSources();
    const matchedSources = grantSources.slice(0, 3).map((source, index) => {
      // Generate random scores that decrease by source index
      const matchScore = (0.95 - (index * 0.15)).toFixed(2);
      
      return {
        grantSourceId: source.id,
        matchScore,
        matchReason: "Blockchain-verified match based on ZK-proof alignment",
        network: index === 0 ? 'Polygon zkEVM' : (index === 1 ? 'Solana' : 'Cross-Chain'),
        potentialFunding: source.availableFunds || 100000,
        contractAddress: `0x${generateRandomString(40)}`,
        lockPeriodDays: 30 + (index * 15),
        vestingSchedule: `${3 + index} months with ${index + 1} cliff`,
        zkVerified: true
      };
    });
    
    log(`Found ${matchedSources.length} blockchain-verified grant sources`, 'blockchain-test');
    
    // Finalize test results
    const results = {
      rfpId,
      rfpTitle: rfp.title,
      transactions,
      matchedSources,
      testTimestamp: new Date().toISOString(),
      testDuration: '8.5 seconds',
      status: 'Success',
      message: 'Blockchain grant matching test completed successfully'
    };
    
    log('Blockchain grant matching test completed successfully', 'blockchain-test');
    return results;
    
  } catch (error) {
    log(`Blockchain grant matching test failed: ${error}`, 'blockchain-test');
    throw error;
  }
}

/**
 * Helper to simulate blockchain operation delay
 */
async function simulateBlockchainDelay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a mock transaction hash
 */
function generateMockTxHash(): string {
  return `0x${generateRandomString(64)}`;
}

/**
 * Generate a random string of specified length
 */
function generateRandomString(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate top RFIs (Requests for Information) based on user profile using AI
 * @param user The user to generate RFIs for
 * @returns Array of RFI objects that can be created in the database
 */
export async function generateTopRfisWithAI(user: User): Promise<any[]> {
  log(`Generating top RFIs with AI for user: ${user.id}`, 'ai-rfi-generator');
  
  try {
    // Get user interests, reputation activities, and skills from profile
    const userInterests = user.interests || [];
    const userBio = user.bio || '';
    const userNetworkingGoals = user.networkingGoals || [];
    
    // Get user reputation activities
    const reputationActivities = await storage.getUserReputationActivities(user.id);
    
    // Extract keywords from activities
    const activityDescriptions = reputationActivities.map(a => a.description).join(', ');
    
    // Build context for AI
    const context = `
User Profile:
- Interests: ${userInterests.join(', ')}
- Bio: ${userBio}
- Networking Goals: ${userNetworkingGoals.join(', ')}
- Recent Activities: ${activityDescriptions}
    `.trim();
    
    // Query AI for RFI suggestions
    const prompt = `
Based on the following user profile, generate 3 compelling RFI (Request for Information) ideas that would be valuable for a blockchain/Web3 collaborative platform. 

${context}

These RFIs should align with the user's interests and expertise while also having potential for broader community interest.

For each RFI, provide:
1. A clear, concise title (max 100 characters)
2. A detailed description (200-300 words)
3. Relevant categories (3-5 tags)
4. Suggested team roles needed (2-4 roles)
5. Estimated funding goal (in USD)
6. Estimated duration in days

Format your response as a valid JSON array with objects containing these fields: 
[
  {
    "title": "RFI Title",
    "description": "Detailed description...",
    "categories": ["tag1", "tag2", "tag3"],
    "teamRoles": ["role1", "role2", "role3"],
    "fundingGoal": 5000,
    "durationDays": 30
  },
  ...
]
    `.trim();
    
    log('Querying AI for RFI suggestions', 'ai-rfi-generator');
    const aiResponse = await perplexityChat(prompt, {
      temperature: 0.7,
      max_tokens: 2000
    });
    
    let rfis = [];
    
    try {
      // For simple string responses, try to extract JSON
      if (typeof aiResponse === 'string') {
        // Try to extract JSON from the string response
        const jsonMatch = aiResponse.match(/\[\s*\{.*\}\s*\]/s);
        if (jsonMatch) {
          rfis = JSON.parse(jsonMatch[0]);
        } else {
          log('Failed to extract JSON from AI response', 'ai-rfi-generator');
          // Fall back to default RFIs
          rfis = getDefaultRfis();
        }
      } else if (aiResponse.choices && aiResponse.choices[0].message) {
        // For full response object
        const content = aiResponse.choices[0].message.content;
        try {
          // Try to extract JSON from the content
          const jsonMatch = content.match(/\[\s*\{.*\}\s*\]/s);
          if (jsonMatch) {
            rfis = JSON.parse(jsonMatch[0]);
          } else {
            // Try to parse the entire content as JSON
            rfis = JSON.parse(content);
          }
        } catch (e) {
          log(`Failed to parse JSON from AI response: ${e.message}`, 'ai-rfi-generator');
          rfis = getDefaultRfis();
        }
      }
    } catch (error) {
      log(`Error parsing AI response: ${error.message}`, 'ai-rfi-generator');
      rfis = getDefaultRfis();
    }
    
    // Ensure we have required fields and proper format
    rfis = rfis.map(rfi => {
      return {
        title: rfi.title || 'Untitled RFI',
        description: rfi.description || 'No description provided',
        categories: Array.isArray(rfi.categories) ? rfi.categories : ['general'],
        teamRoles: Array.isArray(rfi.teamRoles) ? rfi.teamRoles : ['developer', 'designer'],
        fundingGoal: typeof rfi.fundingGoal === 'number' ? rfi.fundingGoal : 5000,
        durationDays: typeof rfi.durationDays === 'number' ? rfi.durationDays : 30
      };
    });
    
    // Limit to 3 RFIs
    rfis = rfis.slice(0, 3);
    
    log(`Successfully generated ${rfis.length} RFIs with AI`, 'ai-rfi-generator');
    return rfis;
    
  } catch (error) {
    log(`Error generating RFIs with AI: ${error.message}`, 'ai-rfi-generator');
    return getDefaultRfis();
  }
}

/**
 * Get default RFIs in case AI generation fails
 */
function getDefaultRfis(): any[] {
  return [
    {
      title: "Cross-Chain Identity Management System",
      description: "Develop a standardized cross-chain identity system that allows users to maintain a consistent identity across multiple blockchains. This system should use zero-knowledge proofs to selectively disclose personal information while providing verifiable credentials that work across different blockchain ecosystems.",
      categories: ["identity", "cross-chain", "privacy", "ZKP"],
      teamRoles: ["blockchain developer", "cryptography specialist", "UI/UX designer"],
      fundingGoal: 12000,
      durationDays: 90
    },
    {
      title: "Decentralized Grant Matching Platform",
      description: "Create a platform that uses AI to match projects with grant opportunities across the blockchain ecosystem. The platform should analyze project proposals and automatically identify the most suitable grant programs based on focus areas, requirements, and funding amounts.",
      categories: ["funding", "AI", "grants", "DAO"],
      teamRoles: ["AI developer", "blockchain developer", "project manager", "UI designer"],
      fundingGoal: 8500,
      durationDays: 60
    },
    {
      title: "Community-Driven Skill Verification System",
      description: "Build a decentralized skill verification system that allows community members to endorse each other's abilities and expertise. Incorporate reputation metrics and on-chain credential verification to create a trustless environment for talent discovery.",
      categories: ["reputation", "community", "credentials", "talent"],
      teamRoles: ["smart contract developer", "frontend developer", "community manager"],
      fundingGoal: 7000,
      durationDays: 45
    }
  ];
}