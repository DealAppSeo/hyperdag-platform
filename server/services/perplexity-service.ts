/**
 * Perplexity AI Service
 * 
 * This service provides access to the Perplexity AI API for AI assistance,
 * content generation, and intelligent recommendations.
 * 
 * It includes a fallback to OpenAI if Perplexity is unavailable.
 */

import { log } from '../vite';
import OpenAI from 'openai';
import axios from 'axios';

// Constants
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';
const DEFAULT_MODEL = 'llama-3.1-sonar-small-128k-online';
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_TOP_P = 0.9;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // milliseconds

// Initialize OpenAI client for fallback
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Type definitions
export type PerplexityMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type PerplexityOptions = {
  model?: string;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  search_domain_filter?: string[];
  return_images?: boolean;
  return_related_questions?: boolean;
  search_recency_filter?: 'day' | 'week' | 'month' | 'year';
};

export type PerplexityResponse = {
  id: string;
  model: string;
  created: number;
  object: string;
  citations: string[];
  choices: {
    index: number;
    finish_reason: string;
    message: {
      role: string;
      content: string;
    };
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

/**
 * Sends a request to the Perplexity API
 * @param messages Array of messages to send to the API or a simple string prompt
 * @param options Additional options for the API request
 * @returns The API response
 */
export async function perplexityChat(
  prompt: string,
  options?: PerplexityOptions
): Promise<string>;
export async function perplexityChat(
  messages: PerplexityMessage[],
  options?: PerplexityOptions
): Promise<PerplexityResponse>;
export async function perplexityChat(
  messagesOrPrompt: PerplexityMessage[] | string,
  options: PerplexityOptions = {}
): Promise<PerplexityResponse | string> {
  // Convert string prompt to messages array if needed
  const messages: PerplexityMessage[] = typeof messagesOrPrompt === 'string' 
    ? [{ role: 'user', content: messagesOrPrompt }] 
    : messagesOrPrompt;
  const apiKey = process.env.PERPLEXITY_API_KEY;
  
  if (!apiKey) {
    log('PERPLEXITY_API_KEY not set, using fallback', 'perplexity');
    const result = await fallbackToOpenAI(messages, options);
    return typeof messagesOrPrompt === 'string' ? result.choices[0].message.content : result;
  }
  
  // Set default options
  const requestOptions = {
    model: options.model || DEFAULT_MODEL,
    messages,
    temperature: options.temperature ?? DEFAULT_TEMPERATURE,
    top_p: options.top_p ?? DEFAULT_TOP_P,
    max_tokens: options.max_tokens,
    search_domain_filter: options.search_domain_filter,
    return_images: options.return_images ?? false,
    return_related_questions: options.return_related_questions ?? false,
    search_recency_filter: options.search_recency_filter,
  };
  
  let attempts = 0;
  let lastError: Error | null = null;
  
  while (attempts < MAX_RETRIES) {
    try {
      log(`Sending request to Perplexity API (attempt ${attempts + 1})`, 'perplexity');
      
      const response = await axios.post(
        PERPLEXITY_API_URL,
        requestOptions,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      log('Perplexity API request successful', 'perplexity');
      return response.data;
    } catch (error: any) {
      lastError = error;
      log(`Perplexity API request failed: ${error.message}`, 'perplexity');
      
      // Check if this is a rate limit error or server error
      const status = error.response?.status;
      if (status === 429 || (status >= 500 && status < 600)) {
        attempts++;
        if (attempts < MAX_RETRIES) {
          log(`Retrying in ${RETRY_DELAY}ms...`, 'perplexity');
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      } else {
        // For other errors, go straight to fallback
        break;
      }
    }
  }
  
  // If we reached max retries or had a non-retryable error, use fallback
  log('Max retries reached or non-retryable error, using fallback', 'perplexity');
  if (lastError) {
    log(`Last error: ${lastError.message}`, 'perplexity');
  }
  
  return await fallbackToOpenAI(messages, options);
}

/**
 * Fallback to OpenAI when Perplexity API fails
 * @param messages Array of messages to send to the API
 * @param options Additional options for the API request
 * @returns A response object formatted like the Perplexity response
 */
async function fallbackToOpenAI(
  messages: PerplexityMessage[],
  options: PerplexityOptions = {}
): Promise<PerplexityResponse> {
  if (!openai) {
    throw new Error('Perplexity API failed and OpenAI fallback not available (OPENAI_API_KEY not set)');
  }
  
  try {
    log('Falling back to OpenAI', 'perplexity');
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o', // Use the latest OpenAI model
      messages,
      temperature: options.temperature ?? DEFAULT_TEMPERATURE,
      top_p: options.top_p ?? DEFAULT_TOP_P,
      max_tokens: options.max_tokens,
    });
    
    // Convert OpenAI response to Perplexity format
    return {
      id: completion.id,
      model: completion.model,
      created: Math.floor(Date.now() / 1000),
      object: 'chat.completion',
      citations: [],
      choices: completion.choices.map(choice => ({
        index: choice.index,
        finish_reason: choice.finish_reason || 'stop',
        message: {
          role: choice.message.role,
          content: choice.message.content || '',
        },
      })),
      usage: {
        prompt_tokens: completion.usage?.prompt_tokens || 0,
        completion_tokens: completion.usage?.completion_tokens || 0,
        total_tokens: completion.usage?.total_tokens || 0,
      },
    };
  } catch (error: any) {
    log(`OpenAI fallback failed: ${error.message}`, 'perplexity');
    
    // If the fallback also fails, create a synthetic response
    // indicating the error, rather than throwing an exception
    return {
      id: 'error-fallback',
      model: 'fallback-error',
      created: Math.floor(Date.now() / 1000),
      object: 'chat.completion',
      citations: [],
      choices: [
        {
          index: 0,
          finish_reason: 'error',
          message: {
            role: 'assistant',
            content: `I apologize, but I'm currently experiencing connectivity issues. Please try again later. (Error: ${error.message})`,
          },
        },
      ],
      usage: {
        prompt_tokens: 0,
        completion_tokens: 0,
        total_tokens: 0,
      },
    };
  }
}

/**
 * Generate a grant match recommendation using AI
 * @param rfpText The RFP text to find grant matches for
 * @param grantSources Array of available grant sources
 * @returns Array of ranked grant matches with explanations
 */
export async function generateGrantMatches(
  rfpText: string,
  grantSources: any[]
): Promise<{ grantSourceId: number; matchScore: number; explanation: string; tags: string[] }[]> {
  try {
    log('Generating grant matches with AI', 'perplexity');
    
    // Extract just the necessary information from grant sources
    const simplifiedSources = grantSources.map(source => ({
      id: source.id,
      name: source.name,
      description: source.description,
      focusAreas: source.focusAreas,
      keywords: source.keywords,
      websiteUrl: source.websiteUrl,
      fundingRange: source.fundingRange,
      eligibilityCriteria: source.eligibilityCriteria,
    }));
    
    const prompt = `
I need to find the best matching grant sources for this Request for Proposal (RFP):

"${rfpText}"

Below are the available grant sources:
${JSON.stringify(simplifiedSources, null, 2)}

Please analyze the RFP and the grant sources, and provide the following in JSON format:
1. Match each grant source to the RFP with a score from 0-100
2. Provide a brief explanation for each match
3. Extract 3-5 relevant tags/keywords for each match

Format your response as a JSON array of objects with these properties:
- grantSourceId: number (the ID of the grant source)
- matchScore: number (0-100)
- explanation: string (1-2 sentences explaining the match)
- tags: string[] (array of 3-5 keyword tags)

Sort the results by matchScore, descending.
Include exactly 12 results: 3 excellent matches (score 85-100), 3 good matches (score 70-84), 3 moderate matches (score 50-69), and 3 basic matches (score 25-49).
The response should be ONLY the valid JSON array, nothing else.
    `;
    
    const response = await perplexityChat([
      { role: 'system', content: 'You are a grant matching specialist. Respond only with valid JSON as instructed.' },
      { role: 'user', content: prompt }
    ], {
      temperature: 0.5,
      top_p: 0.95,
      search_recency_filter: 'month',
      model: 'llama-3.1-sonar-small-128k-online',
    });
    
    const content = response.choices[0].message.content;
    
    // Parse the response as JSON
    try {
      const matches = JSON.parse(content);
      log(`Successfully generated ${matches.length} grant matches`, 'perplexity');
      return matches;
    } catch (e) {
      log(`Failed to parse AI response as JSON: ${e}`, 'perplexity');
      log(`Raw AI response: ${content}`, 'perplexity');
      
      // Return a fallback response with no matches
      return [];
    }
  } catch (error: any) {
    log(`Error generating grant matches: ${error.message}`, 'perplexity');
    return [];
  }
}

/**
 * Generate personalized onboarding guidance based on user persona
 * @param persona The user's selected persona (e.g., 'developer', 'designer', 'influencer')
 * @param knowledgeLevel The user's self-reported knowledge level (1-5)
 * @returns Personalized guidance for the user
 */
export async function generatePersonalizedGuidance(
  persona: string,
  knowledgeLevel: number
): Promise<string> {
  try {
    log(`Generating personalized guidance for ${persona} with knowledge level ${knowledgeLevel}`, 'perplexity');
    
    const prompt = `
Create a personalized onboarding guide for a ${persona} with a Web3/blockchain knowledge level of ${knowledgeLevel}/5.

The response should include:
1. A welcoming introduction to HyperDAG
2. Key features relevant to a ${persona} (focus on professional growth and collaboration opportunities)
3. Suggested first steps tailored to their knowledge level
4. Explanation of reputation system and how it benefits them
5. How to navigate the HyperCrowd grant matching system

Keep the language conversational and accessible for someone at knowledge level ${knowledgeLevel}. 
For technical terms, include brief explanations if knowledge level is below 3.
    `;
    
    const response = await perplexityChat([
      { role: 'system', content: 'You are a knowledgeable guide for onboarding new users to HyperDAG, a Web3 collaborative platform. Be welcoming, clear, and helpful.' },
      { role: 'user', content: prompt }
    ], {
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    return response.choices[0].message.content;
  } catch (error: any) {
    log(`Error generating personalized guidance: ${error.message}`, 'perplexity');
    return "Welcome to HyperDAG! We're experiencing some technical difficulties with our personalization system. Please explore the platform at your own pace, and don't hesitate to reach out if you have any questions.";
  }
}

/**
 * Generate skill recommendations based on user persona and activity
 * @param persona The user's selected persona
 * @param completedActivities Array of activities the user has completed
 * @returns Array of recommended skills to develop
 */
export async function generateSkillRecommendations(
  persona: string,
  completedActivities: string[]
): Promise<string[]> {
  try {
    log(`Generating skill recommendations for ${persona} with ${completedActivities.length} completed activities`, 'perplexity');
    
    const prompt = `
Based on a user with the persona "${persona}" who has completed these activities:
${completedActivities.join(", ")}

Recommend 5 skills they should develop next to advance in the HyperDAG ecosystem.
For each skill, provide a brief explanation of why it's valuable.

Format your response as a JSON array of objects with these properties:
- skill: string (name of the skill)
- description: string (why it's valuable)
- difficulty: string (one of: "beginner", "intermediate", "advanced")

The response should be ONLY the valid JSON array, nothing else.
    `;
    
    const response = await perplexityChat([
      { role: 'system', content: 'You are a career development advisor specializing in Web3 skills.' },
      { role: 'user', content: prompt }
    ], {
      temperature: 0.7,
    });
    
    const content = response.choices[0].message.content;
    
    // Parse the response as JSON
    try {
      const skills = JSON.parse(content);
      log(`Successfully generated ${skills.length} skill recommendations`, 'perplexity');
      return skills;
    } catch (e) {
      log(`Failed to parse AI response as JSON: ${e}`, 'perplexity');
      
      // Return a fallback response
      return [
        "Blockchain Fundamentals",
        "Smart Contract Interaction", 
        "Digital Collaboration",
        "Technical Documentation",
        "Community Building"
      ];
    }
  } catch (error: any) {
    log(`Error generating skill recommendations: ${error.message}`, 'perplexity');
    return [
      "Web3 Literacy",
      "Digital Collaboration", 
      "Project Management",
      "Technical Communication",
      "Network Building"
    ];
  }
}

/**
 * Generate grant matches for an RFP using Perplexity AI
 * @param rfp The RFP to find grant matches for
 * @param grantSources Array of available grant sources
 * @returns Array of grant matches with scores and explanations
 */
export async function perplexityGenerateGrantMatches(
  rfp: any,
  grantSources: any[]
): Promise<{ grantSourceId: number; matchScore: number; explanation: string; tags: string[] }[]> {
  try {
    log('Generating grant matches with Perplexity AI', 'perplexity');
    
    // Extract just the necessary information from grant sources
    const simplifiedSources = grantSources.map(source => ({
      id: source.id,
      name: source.name,
      description: source.description,
      categories: source.categories,
      availableFunds: source.availableFunds,
      requirements: source.requirements,
      focusAreas: source.focusAreas || source.categories,
      keywords: source.keywords,
      eligibilityCriteria: source.eligibilityCriteria
    }));

    // Format RFP information
    const rfpSummary = {
      title: rfp.title,
      description: rfp.description,
      categories: rfp.categories,
      fundingGoal: rfp.fundingGoal,
      requirements: rfp.requirements
    };
    
    const prompt = `
I need to find the best matching grant sources for this Request for Proposal (RFP):

RFP Details:
${JSON.stringify(rfpSummary, null, 2)}

Available Grant Sources:
${JSON.stringify(simplifiedSources, null, 2)}

Please analyze the RFP against each grant source and provide a comprehensive matching analysis. Consider:
1. Category alignment between RFP and grant focus areas
2. Funding amount compatibility
3. Eligibility criteria matching
4. Project scope and grant requirements alignment
5. Strategic fit and potential impact

Format your response as a JSON array of objects with these properties:
- grantSourceId: number (the ID of the grant source)
- matchScore: number (0-100, where 100 is perfect match)
- explanation: string (detailed explanation of why this grant matches, including specific alignment points)
- tags: string[] (array of 3-5 relevant keyword tags that represent the match)

Provide results for ALL grant sources. Sort by matchScore descending.
The response should be ONLY the valid JSON array, nothing else.
    `;
    
    const response = await perplexityChat([
      { role: 'system', content: 'You are an expert grant matching specialist with deep knowledge of funding landscapes. Analyze matches comprehensively and provide detailed, actionable insights.' },
      { role: 'user', content: prompt }
    ], {
      temperature: 0.3, // Lower temperature for more consistent results
      top_p: 0.9,
      max_tokens: 2000,
      search_recency_filter: 'month',
      model: 'llama-3.1-sonar-small-128k-online',
    });
    
    const content = response.choices[0].message.content;
    
    // Parse the response as JSON
    try {
      const matches = JSON.parse(content);
      log(`Successfully generated ${matches.length} grant matches using Perplexity`, 'perplexity');
      
      // Validate the response structure
      const validMatches = matches.filter((match: any) => 
        match.grantSourceId && 
        typeof match.matchScore === 'number' && 
        match.explanation && 
        Array.isArray(match.tags)
      );
      
      if (validMatches.length !== matches.length) {
        log(`Filtered ${matches.length - validMatches.length} invalid matches`, 'perplexity');
      }
      
      return validMatches;
    } catch (parseError) {
      log(`Failed to parse Perplexity response as JSON: ${parseError}`, 'perplexity');
      log(`Raw response: ${content.substring(0, 500)}...`, 'perplexity');
      
      // Return empty array - the calling function will handle fallback
      return [];
    }
  } catch (error: any) {
    log(`Error in perplexityGenerateGrantMatches: ${error.message}`, 'perplexity');
    throw error; // Re-throw to trigger fallback in calling function
  }
}

/**
 * Generate project recommendations based on user interests and profile
 * @param userProfile User profile information
 * @param userInterests Array of user interests
 * @param availableProjects Array of available projects
 * @returns Array of recommended projects with explanations
 */
export async function generateProjectRecommendations(
  userProfile: any,
  userInterests: string[],
  availableProjects: any[]
): Promise<{ projectId: number; matchScore: number; explanation: string }[]> {
  try {
    log('Generating project recommendations with AI', 'perplexity');
    
    // Simplify the projects data
    const simplifiedProjects = availableProjects.map(project => ({
      id: project.id,
      title: project.title,
      description: project.description,
      categories: project.categories,
      requiredRoles: project.requiredRoles,
    }));
    
    // Simplify the user profile
    const simplifiedProfile = {
      persona: userProfile.persona,
      skills: userProfile.skills,
      interests: userInterests,
      reputationLevel: userProfile.reputationLevel,
    };
    
    const prompt = `
I need to find the best project matches for a user with this profile:
${JSON.stringify(simplifiedProfile, null, 2)}

Here are the available projects:
${JSON.stringify(simplifiedProjects, null, 2)}

Please analyze the user profile and the projects, and provide the following in JSON format:
- Project recommendations ranked by match score
- Brief explanation for why each project is recommended

Format your response as a JSON array of objects with these properties:
- projectId: number (the ID of the project)
- matchScore: number (0-100)
- explanation: string (1-2 sentences explaining why this project is a good match)

The response should be ONLY the valid JSON array with the top 5 project recommendations, sorted by matchScore descending.
    `;
    
    const response = await perplexityChat([
      { role: 'system', content: 'You are a project matching specialist. Respond only with valid JSON as instructed.' },
      { role: 'user', content: prompt }
    ], {
      temperature: 0.5,
    });
    
    const content = response.choices[0].message.content;
    
    // Parse the response as JSON
    try {
      const recommendations = JSON.parse(content);
      log(`Successfully generated ${recommendations.length} project recommendations`, 'perplexity');
      return recommendations;
    } catch (e) {
      log(`Failed to parse AI response as JSON: ${e}`, 'perplexity');
      
      // Return a fallback response
      return simplifiedProjects.slice(0, 5).map((project, index) => ({
        projectId: project.id,
        matchScore: 95 - (index * 5),
        explanation: `This project aligns with your ${userInterests[0] || 'interests'} and would benefit from your skills as a ${userProfile.persona || 'contributor'}.`
      }));
    }
  } catch (error: any) {
    log(`Error generating project recommendations: ${error.message}`, 'perplexity');
    return [];
  }
}