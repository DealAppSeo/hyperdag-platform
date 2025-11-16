/**
 * HyperCrowd Grant Source Integration
 * 
 * This service integrates with external grant sources:
 * 1. Automated scraping of grant opportunities
 * 2. API integration with partner grant platforms
 * 3. Manual grant source addition and verification
 * 4. Grant availability tracking and alerts
 */

import { log } from '../../utils/logger';
import { storage } from '../../storage';
import { smartAI } from '../redundancy/ai/smart-ai-service';
import { redundantStorage } from '../redundancy/storage/redundant-storage-service';

// Import types
import type { 
  GrantSource, 
  GrantSourceSync, 
  GrantSourceAPI, 
  User,
  Rfp 
} from '../../../shared/schema';

// Status types
export enum GrantSourceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING_VERIFICATION = 'pending_verification',
  VERIFIED = 'verified'
}

export enum SyncStatus {
  SUCCESS = 'success',
  PARTIAL = 'partial',
  FAILED = 'failed'
}

// Grant source types
export enum GrantSourceType {
  MANUAL = 'manual',
  API = 'api',
  SCRAPED = 'scraped',
  PARTNER = 'partner'
}

// Constants
const DEFAULT_SYNC_INTERVAL_HOURS = 24;
const MAX_GRANT_SOURCES_PER_USER = 20;

/**
 * Add a new grant source manually
 */
export async function addGrantSource(
  userId: number,
  grantSourceData: Partial<GrantSource>
): Promise<GrantSource> {
  try {
    log(`Adding grant source by user ${userId}`, 'grant-source');
    
    // Validate required fields
    if (!grantSourceData.name || grantSourceData.name.trim().length < 3) {
      throw new Error('Name is too short or missing');
    }
    
    if (!grantSourceData.description || grantSourceData.description.trim().length < 20) {
      throw new Error('Description is too short or missing');
    }
    
    if (!grantSourceData.website || !isValidUrl(grantSourceData.website)) {
      throw new Error('Website URL is invalid or missing');
    }
    
    // Check if user can add more grant sources
    const userGrantSources = await storage.getGrantSourcesByCreator(userId);
    if (userGrantSources.length >= MAX_GRANT_SOURCES_PER_USER) {
      throw new Error(`User ${userId} has reached the maximum number of grant sources (${MAX_GRANT_SOURCES_PER_USER})`);
    }
    
    // Normalize categories
    const categories = grantSourceData.categories || [];
    const normalizedCategories = categories.map(category => 
      category.trim().charAt(0).toUpperCase() + category.trim().slice(1)
    );
    
    // Create grant source object
    const grantSource: GrantSource = {
      id: 0, // Will be set by storage
      name: grantSourceData.name.trim(),
      description: grantSourceData.description.trim(),
      website: grantSourceData.website.trim(),
      categories: normalizedCategories,
      creatorId: userId,
      status: GrantSourceStatus.PENDING_VERIFICATION,
      type: GrantSourceType.MANUAL,
      availableFunds: grantSourceData.availableFunds || null,
      applicationUrl: grantSourceData.applicationUrl || grantSourceData.website.trim(),
      logoUrl: grantSourceData.logoUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastScraped: null
    };
    
    // Save the grant source
    const savedGrantSource = await storage.createGrantSource(grantSource);
    
    log(`Added grant source ${savedGrantSource.id} by user ${userId}`, 'grant-source');
    
    // If AI verification is available, schedule it
    try {
      await scheduleGrantSourceVerification(savedGrantSource.id);
    } catch (verifyError) {
      log(`Failed to schedule grant source verification: ${verifyError.message}`, 'grant-source');
      // Continue despite verification error
    }
    
    return savedGrantSource;
  } catch (error) {
    log(`Error adding grant source: ${error.message}`, 'grant-source');
    throw error;
  }
}

/**
 * Add or update a grant source API integration
 */
export async function addGrantSourceAPI(
  userId: number,
  apiData: Partial<GrantSourceAPI>
): Promise<GrantSourceAPI> {
  try {
    log(`Adding grant source API by user ${userId}`, 'grant-source');
    
    // Validate required fields
    if (!apiData.name || apiData.name.trim().length < 3) {
      throw new Error('Name is too short or missing');
    }
    
    if (!apiData.baseUrl || !isValidUrl(apiData.baseUrl)) {
      throw new Error('Base URL is invalid or missing');
    }
    
    if (!apiData.endpointPath) {
      throw new Error('Endpoint path is missing');
    }
    
    // Check if this API already exists
    const existingAPI = await storage.getGrantSourceAPIByUrl(apiData.baseUrl);
    if (existingAPI) {
      // Update the existing API
      const updatedAPI = {
        ...existingAPI,
        name: apiData.name.trim(),
        baseUrl: apiData.baseUrl.trim(),
        endpointPath: apiData.endpointPath.trim(),
        apiKey: apiData.apiKey || existingAPI.apiKey,
        headers: apiData.headers || existingAPI.headers,
        authType: apiData.authType || existingAPI.authType,
        dataMapping: apiData.dataMapping || existingAPI.dataMapping,
        syncInterval: apiData.syncInterval || existingAPI.syncInterval,
        updatedAt: new Date(),
        updatedById: userId
      };
      
      // Save the updated API
      const savedAPI = await storage.updateGrantSourceAPI(existingAPI.id, updatedAPI);
      
      log(`Updated grant source API ${savedAPI.id} by user ${userId}`, 'grant-source');
      
      return savedAPI;
    }
    
    // Create new API object
    const grantSourceAPI: GrantSourceAPI = {
      id: 0, // Will be set by storage
      name: apiData.name.trim(),
      baseUrl: apiData.baseUrl.trim(),
      endpointPath: apiData.endpointPath.trim(),
      apiKey: apiData.apiKey || null,
      headers: apiData.headers || {},
      authType: apiData.authType || 'none',
      dataMapping: apiData.dataMapping || {
        id: 'id',
        name: 'name',
        description: 'description',
        website: 'website',
        categories: 'categories',
        availableFunds: 'amount',
        applicationUrl: 'applyUrl'
      },
      syncInterval: apiData.syncInterval || DEFAULT_SYNC_INTERVAL_HOURS,
      creatorId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSynced: null,
      status: 'pending'
    };
    
    // Save the API
    const savedAPI = await storage.createGrantSourceAPI(grantSourceAPI);
    
    log(`Added grant source API ${savedAPI.id} by user ${userId}`, 'grant-source');
    
    // Try to sync immediately
    try {
      await syncGrantSourceAPI(savedAPI.id);
    } catch (syncError) {
      log(`Failed to sync grant source API: ${syncError.message}`, 'grant-source');
      // Continue despite sync error
    }
    
    return savedAPI;
  } catch (error) {
    log(`Error adding grant source API: ${error.message}`, 'grant-source');
    throw error;
  }
}

/**
 * Sync with a grant source API to get the latest grants
 */
export async function syncGrantSourceAPI(apiId: number): Promise<GrantSourceSync> {
  try {
    log(`Syncing grant source API ${apiId}`, 'grant-source');
    
    // Get the API configuration
    const api = await storage.getGrantSourceAPI(apiId);
    if (!api) {
      throw new Error(`Grant source API with ID ${apiId} not found`);
    }
    
    // Prepare the URL
    const url = `${api.baseUrl}${api.endpointPath}`.replace(/([^:]\/)\/+/g, '$1');
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...api.headers
    };
    
    // Add API key if available
    if (api.apiKey) {
      if (api.authType === 'bearer') {
        headers['Authorization'] = `Bearer ${api.apiKey}`;
      } else if (api.authType === 'apikey') {
        headers['X-API-Key'] = api.apiKey;
      }
    }
    
    let fetchResponse;
    let responseData;
    
    try {
      // Fetch data from the API
      fetchResponse = await fetch(url, {
        method: 'GET',
        headers
      });
      
      if (!fetchResponse.ok) {
        throw new Error(`API request failed with status ${fetchResponse.status}`);
      }
      
      responseData = await fetchResponse.json();
    } catch (fetchError) {
      log(`Failed to fetch from API ${apiId}: ${fetchError.message}`, 'grant-source');
      
      // Create sync record for failed attempt
      const syncRecord: GrantSourceSync = {
        id: 0,
        apiId,
        syncedAt: new Date(),
        status: SyncStatus.FAILED,
        addedCount: 0,
        updatedCount: 0,
        errorCount: 1,
        errors: [`API fetch failed: ${fetchError.message}`]
      };
      
      const savedSync = await storage.createGrantSourceSync(syncRecord);
      
      // Update API last synced time
      await storage.updateGrantSourceAPIField(apiId, 'lastSynced', new Date());
      
      return savedSync;
    }
    
    // Process the response data
    const processedGrants = processAPIResponse(responseData, api.dataMapping);
    
    // Track sync statistics
    let addedCount = 0;
    let updatedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];
    
    // Process each grant
    for (const grantData of processedGrants) {
      try {
        // Check if this grant already exists (by URL or name)
        const existingGrant = await findExistingGrant(grantData.name, grantData.website);
        
        if (existingGrant) {
          // Update the existing grant
          const updatedGrant = {
            ...existingGrant,
            description: grantData.description || existingGrant.description,
            categories: grantData.categories || existingGrant.categories,
            availableFunds: grantData.availableFunds || existingGrant.availableFunds,
            applicationUrl: grantData.applicationUrl || existingGrant.applicationUrl,
            updatedAt: new Date(),
            lastScraped: new Date()
          };
          
          await storage.updateGrantSource(existingGrant.id, updatedGrant);
          updatedCount++;
        } else {
          // Create a new grant source
          const newGrant: GrantSource = {
            id: 0,
            name: grantData.name,
            description: grantData.description || 'No description available',
            website: grantData.website,
            categories: grantData.categories || [],
            creatorId: api.creatorId,
            status: GrantSourceStatus.ACTIVE,
            type: GrantSourceType.API,
            availableFunds: grantData.availableFunds || null,
            applicationUrl: grantData.applicationUrl || grantData.website,
            logoUrl: grantData.logoUrl || null,
            createdAt: new Date(),
            updatedAt: new Date(),
            lastScraped: new Date()
          };
          
          await storage.createGrantSource(newGrant);
          addedCount++;
        }
      } catch (grantError) {
        errorCount++;
        errors.push(`Error processing grant ${grantData.name}: ${grantError.message}`);
        log(`Error processing grant from API ${apiId}: ${grantError.message}`, 'grant-source');
      }
    }
    
    // Determine overall status
    let status = SyncStatus.SUCCESS;
    if (errorCount > 0 && (addedCount > 0 || updatedCount > 0)) {
      status = SyncStatus.PARTIAL;
    } else if (errorCount > 0 && addedCount === 0 && updatedCount === 0) {
      status = SyncStatus.FAILED;
    }
    
    // Create sync record
    const syncRecord: GrantSourceSync = {
      id: 0,
      apiId,
      syncedAt: new Date(),
      status,
      addedCount,
      updatedCount,
      errorCount,
      errors: errors.length > 0 ? errors : null
    };
    
    const savedSync = await storage.createGrantSourceSync(syncRecord);
    
    // Update API last synced time
    await storage.updateGrantSourceAPIField(apiId, 'lastSynced', new Date());
    
    log(`Completed sync for grant source API ${apiId}: ${addedCount} added, ${updatedCount} updated, ${errorCount} errors`, 'grant-source');
    
    return savedSync;
  } catch (error) {
    log(`Error syncing grant source API: ${error.message}`, 'grant-source');
    throw error;
  }
}

/**
 * Process API response data using the provided mapping
 */
function processAPIResponse(
  responseData: any,
  mapping: Record<string, string>
): Partial<GrantSource>[] {
  try {
    // Determine if responseData is an array or needs extraction
    let grantsArray = responseData;
    
    // If responseData is not an array, try to extract the grants array
    if (!Array.isArray(responseData)) {
      // Common API patterns for the grants array
      const possibleArrayPaths = ['data', 'grants', 'items', 'results'];
      
      for (const path of possibleArrayPaths) {
        if (responseData[path] && Array.isArray(responseData[path])) {
          grantsArray = responseData[path];
          break;
        }
      }
      
      // If still not an array, wrap in array
      if (!Array.isArray(grantsArray)) {
        grantsArray = [responseData];
      }
    }
    
    // Map the data according to the provided mapping
    return grantsArray.map(item => {
      const grant: Partial<GrantSource> = {};
      
      // Apply each mapping field
      for (const [grantField, apiField] of Object.entries(mapping)) {
        // Handle nested fields using dot notation
        if (apiField.includes('.')) {
          const fieldPaths = apiField.split('.');
          let value = item;
          
          for (const path of fieldPaths) {
            if (value && value[path] !== undefined) {
              value = value[path];
            } else {
              value = null;
              break;
            }
          }
          
          grant[grantField] = value;
        } else {
          grant[grantField] = item[apiField];
        }
      }
      
      // Ensure required fields
      if (!grant.name || !grant.website) {
        return null;
      }
      
      return grant;
    }).filter(Boolean); // Remove null entries
  } catch (error) {
    log(`Error processing API response: ${error.message}`, 'grant-source');
    return [];
  }
}

/**
 * Find an existing grant by name or website
 */
async function findExistingGrant(
  name: string,
  website: string
): Promise<GrantSource | null> {
  try {
    // First try to find by website (more unique)
    const byWebsite = await storage.getGrantSourceByWebsite(website);
    if (byWebsite) {
      return byWebsite;
    }
    
    // Then try by name
    const byName = await storage.getGrantSourceByName(name);
    return byName;
  } catch (error) {
    log(`Error finding existing grant: ${error.message}`, 'grant-source');
    return null;
  }
}

/**
 * Verify a grant source using AI if available
 */
export async function verifyGrantSource(grantSourceId: number): Promise<boolean> {
  try {
    log(`Verifying grant source ${grantSourceId}`, 'grant-source');
    
    // Get the grant source
    const grantSource = await storage.getGrantSource(grantSourceId);
    if (!grantSource) {
      throw new Error(`Grant source with ID ${grantSourceId} not found`);
    }
    
    // Skip verification if already verified
    if (grantSource.status === GrantSourceStatus.VERIFIED) {
      log(`Grant source ${grantSourceId} is already verified`, 'grant-source');
      return true;
    }
    
    // Try to verify using AI
    try {
      if (process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || process.env.PERPLEXITY_API_KEY) {
        // Fetch additional information about the grant source
        const websiteText = await fetchWebsiteText(grantSource.website);
        
        const prompt = `
I need to verify if this is a legitimate grant-giving organization or funding source.

Grant Source Name: ${grantSource.name}
Website: ${grantSource.website}
Description: ${grantSource.description}
Categories: ${grantSource.categories ? grantSource.categories.join(', ') : 'None specified'}
Available Funds: ${grantSource.availableFunds ? `$${grantSource.availableFunds.toLocaleString()}` : 'Not specified'}

Additional website content: ${websiteText || 'Not available'}

Based on this information, please analyze:
1. Is this a legitimate grant-giving entity?
2. Are there any red flags or signs this might be fraudulent?
3. Does the website content match the description?

Return your analysis as a JSON object with these fields:
- legitimate: boolean (true/false)
- confidence: number (0-1)
- explanation: string (brief explanation of your determination)
- redFlags: string[] (any concerns identified)

Do not include any other text outside of the JSON object.
`;

        const aiResponse = await smartAI.complete({
          prompt,
          max_tokens: 500,
          temperature: 0.2,
          format: 'json'
        });
        
        let verification;
        try {
          verification = JSON.parse(aiResponse.content);
        } catch (parseError) {
          log(`Failed to parse AI verification response: ${parseError.message}`, 'grant-source');
          throw new Error('Failed to parse AI verification response');
        }
        
        // Update grant source based on verification
        if (verification.legitimate && verification.confidence >= 0.7) {
          // Mark as verified
          const updatedGrantSource = {
            ...grantSource,
            status: GrantSourceStatus.VERIFIED,
            updatedAt: new Date()
          };
          
          await storage.updateGrantSource(grantSourceId, updatedGrantSource);
          
          log(`AI verified grant source ${grantSourceId} as legitimate`, 'grant-source');
          return true;
        } else if (!verification.legitimate && verification.confidence >= 0.7) {
          // Mark as inactive due to failed verification
          const updatedGrantSource = {
            ...grantSource,
            status: GrantSourceStatus.INACTIVE,
            updatedAt: new Date()
          };
          
          await storage.updateGrantSource(grantSourceId, updatedGrantSource);
          
          log(`AI rejected grant source ${grantSourceId} as non-legitimate`, 'grant-source');
          return false;
        } else {
          // Confidence is too low, keep as pending verification
          log(`AI verification inconclusive for grant source ${grantSourceId}`, 'grant-source');
          return false;
        }
      }
    } catch (aiError) {
      log(`AI verification failed: ${aiError.message}`, 'grant-source');
      // Continue with manual verification approach
    }
    
    // If AI verification failed or isn't available, use basic verification
    // For now, just check if the website is accessible
    try {
      const isWebsiteAccessible = await checkWebsiteAccessibility(grantSource.website);
      
      if (isWebsiteAccessible) {
        // Mark as active but not fully verified
        const updatedGrantSource = {
          ...grantSource,
          status: GrantSourceStatus.ACTIVE,
          updatedAt: new Date()
        };
        
        await storage.updateGrantSource(grantSourceId, updatedGrantSource);
        
        log(`Basic verification passed for grant source ${grantSourceId}`, 'grant-source');
        return true;
      } else {
        // Mark as inactive due to inaccessible website
        const updatedGrantSource = {
          ...grantSource,
          status: GrantSourceStatus.INACTIVE,
          updatedAt: new Date()
        };
        
        await storage.updateGrantSource(grantSourceId, updatedGrantSource);
        
        log(`Basic verification failed for grant source ${grantSourceId} - website inaccessible`, 'grant-source');
        return false;
      }
    } catch (checkError) {
      log(`Website accessibility check failed: ${checkError.message}`, 'grant-source');
      return false;
    }
  } catch (error) {
    log(`Error verifying grant source: ${error.message}`, 'grant-source');
    throw error;
  }
}

/**
 * Schedule verification of a grant source
 */
async function scheduleGrantSourceVerification(grantSourceId: number): Promise<void> {
  try {
    // In a production environment, this would add the task to a queue
    // For now, just run it directly
    await verifyGrantSource(grantSourceId);
  } catch (error) {
    log(`Error scheduling grant source verification: ${error.message}`, 'grant-source');
    throw error;
  }
}

/**
 * Match a specific RFP against all grant sources
 */
export async function matchRfpToAllGrantSources(
  rfpId: number,
  threshold: number = 0.5
): Promise<{grantSource: GrantSource, matchScore: number}[]> {
  try {
    log(`Matching RFP ${rfpId} to all grant sources`, 'grant-source');
    
    // Get the RFP
    const rfp = await storage.getRfpById(rfpId);
    if (!rfp) {
      throw new Error(`RFP with ID ${rfpId} not found`);
    }
    
    // Get all active grant sources
    const grantSources = await storage.getActiveGrantSources();
    if (!grantSources || grantSources.length === 0) {
      log(`No active grant sources found for RFP ${rfpId}`, 'grant-source');
      return [];
    }
    
    // Calculate match scores for each grant source
    const matches = await Promise.all(
      grantSources.map(async grantSource => {
        const matchScore = calculateGrantMatchScore(rfp, grantSource);
        return {
          grantSource,
          matchScore
        };
      })
    );
    
    // Filter by threshold and sort by match score
    const filteredMatches = matches
      .filter(match => match.matchScore >= threshold)
      .sort((a, b) => b.matchScore - a.matchScore);
    
    log(`Found ${filteredMatches.length} matching grant sources for RFP ${rfpId}`, 'grant-source');
    
    return filteredMatches;
  } catch (error) {
    log(`Error matching RFP to grant sources: ${error.message}`, 'grant-source');
    throw error;
  }
}

/**
 * Calculate match score between RFP and grant source
 */
function calculateGrantMatchScore(rfp: Rfp, grantSource: GrantSource): number {
  try {
    let score = 0;
    let totalWeight = 0;
    
    // 1. Category matching (weight: 40%)
    const categoryWeight = 0.4;
    if (rfp.categories && rfp.categories.length > 0 && 
        grantSource.categories && grantSource.categories.length > 0) {
      
      const rfpCats = rfp.categories.map(c => c.toLowerCase());
      const grantCats = grantSource.categories.map(c => c.toLowerCase());
      
      const matchingCategories = rfpCats.filter(cat => 
        grantCats.some(gc => gc.includes(cat) || cat.includes(gc))
      );
      
      const categoryScore = matchingCategories.length / Math.max(rfpCats.length, 1);
      score += categoryScore * categoryWeight;
      totalWeight += categoryWeight;
    }
    
    // 2. Funding match (weight: 30%)
    const fundingWeight = 0.3;
    if (rfp.fundingGoal && grantSource.availableFunds) {
      let fundingScore = 0;
      
      if (grantSource.availableFunds >= rfp.fundingGoal) {
        // Perfect match if grant can fully fund
        fundingScore = 1;
      } else {
        // Partial match based on percentage of funding
        fundingScore = grantSource.availableFunds / rfp.fundingGoal;
        // Cap at 0.8 since it can't fully fund
        fundingScore = Math.min(fundingScore, 0.8);
      }
      
      score += fundingScore * fundingWeight;
      totalWeight += fundingWeight;
    }
    
    // 3. Text similarity (weight: 30%)
    const textWeight = 0.3;
    const rfpText = `${rfp.title} ${rfp.description}`.toLowerCase();
    const grantText = `${grantSource.name} ${grantSource.description}`.toLowerCase();
    
    // Simple word overlap similarity
    const rfpWords = new Set(rfpText.split(/\W+/).filter(w => w.length > 3));
    const grantWords = new Set(grantText.split(/\W+/).filter(w => w.length > 3));
    
    const intersection = new Set([...rfpWords].filter(x => grantWords.has(x)));
    const union = new Set([...rfpWords, ...grantWords]);
    
    const textScore = intersection.size / Math.max(union.size, 1);
    
    score += textScore * textWeight;
    totalWeight += textWeight;
    
    // Normalize by weights used
    return totalWeight > 0 ? score / totalWeight : 0;
  } catch (error) {
    log(`Error calculating grant match score: ${error.message}`, 'grant-source');
    return 0;
  }
}

/**
 * Check if a website is accessible
 */
async function checkWebsiteAccessibility(url: string): Promise<boolean> {
  try {
    // Try to fetch the website
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'HyperDAG-GrantVerifier/1.0'
      }
    });
    
    // Consider 2xx status codes as accessible
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    log(`Website accessibility check failed for ${url}: ${error.message}`, 'grant-source');
    return false;
  }
}

/**
 * Fetch and extract text from a website for verification
 */
async function fetchWebsiteText(url: string): Promise<string | null> {
  try {
    // Try to fetch the website
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'HyperDAG-GrantVerifier/1.0'
      }
    });
    
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Failed to fetch website, status: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Very simple HTML to text conversion
    // In a production environment, use a proper HTML parser
    const text = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Limit to 1000 characters to avoid overwhelming the AI
    return text.substring(0, 1000);
  } catch (error) {
    log(`Website text extraction failed for ${url}: ${error.message}`, 'grant-source');
    return null;
  }
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:';
  } catch (error) {
    return false;
  }
}