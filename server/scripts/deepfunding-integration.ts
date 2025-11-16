/**
 * DeepFunding.ai Integration Script
 * 
 * This script fetches and integrates grant opportunities from DeepFunding.ai
 * into the HyperDAG grants database, making them available for matching.
 */

import axios from 'axios';
import { JSDOM } from 'jsdom';
import { db } from '../db';
import { grantSources } from '@shared/schema';
import { logger } from '../utils/logger';

interface DeepFundingRFP {
  title: string;
  description: string;
  fundingAmount: number | null;
  applicationUrl: string;
  deadline: string | null;
  categories: string[];
  rfpId: string;
}

/**
 * Fetch all RFPs from DeepFunding.ai
 */
async function fetchDeepFundingRFPs(): Promise<DeepFundingRFP[]> {
  try {
    logger.info('DeepFunding Integration', 'Fetching RFPs from DeepFunding.ai');
    
    // Fetch the RFPs listing page
    const response = await axios.get('https://deepfunding.ai/all-rfps/');
    const { document } = new JSDOM(response.data).window;
    
    // Extract RFP links
    const rfpLinks: string[] = [];
    const rfpElements = document.querySelectorAll('.rfps-item');
    
    rfpElements.forEach(element => {
      const linkElement = element.querySelector('a');
      if (linkElement && linkElement.href) {
        rfpLinks.push(linkElement.href);
      }
    });

    logger.info('DeepFunding Integration', `Found ${rfpLinks.length} RFPs`);
    
    // Fetch details for each RFP
    const rfps: DeepFundingRFP[] = [];
    
    for (const link of rfpLinks.slice(0, 10)) { // Limit to 10 for testing
      try {
        // Get the RFP ID from the URL
        const rfpId = link.split('/').pop() || '';
        
        // Skip if no valid ID
        if (!rfpId) continue;
        
        // Fetch the RFP details page
        const rfpResponse = await axios.get(`https://deepfunding.ai/rfps/${rfpId}`);
        const rfpDocument = new JSDOM(rfpResponse.data).window.document;
        
        // Extract RFP details
        const title = rfpDocument.querySelector('h1')?.textContent?.trim() || '';
        
        // Extract description
        const descriptionElement = rfpDocument.querySelector('.rfp-description');
        const description = descriptionElement ? 
          descriptionElement.textContent?.trim() || '' : 
          'No description available';
        
        // Extract funding amount
        let fundingAmount: number | null = null;
        const fundingText = rfpDocument.querySelector('.rfp-funding')?.textContent;
        if (fundingText) {
          const amountMatch = fundingText.match(/\$([0-9,]+)/);
          if (amountMatch && amountMatch[1]) {
            fundingAmount = parseFloat(amountMatch[1].replace(/,/g, ''));
          }
        }
        
        // Extract deadline
        let deadline: string | null = null;
        const deadlineElement = rfpDocument.querySelector('.rfp-deadline');
        if (deadlineElement) {
          const deadlineText = deadlineElement.textContent?.trim();
          if (deadlineText) {
            const dateMatch = deadlineText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
            if (dateMatch && dateMatch[1]) {
              deadline = dateMatch[1];
            }
          }
        }
        
        // Extract categories
        const categoriesElement = rfpDocument.querySelector('.rfp-categories');
        const categories: string[] = [];
        if (categoriesElement) {
          const categoryItems = categoriesElement.querySelectorAll('li');
          categoryItems.forEach(item => {
            if (item.textContent) {
              categories.push(item.textContent.trim());
            }
          });
        }
        
        // If no categories are found, add a default one
        if (categories.length === 0) {
          categories.push('Web3');
          categories.push('AI');
        }
        
        // Add the RFP to our array
        rfps.push({
          title,
          description,
          fundingAmount,
          applicationUrl: `https://deepfunding.ai/rfps/${rfpId}`,
          deadline,
          categories,
          rfpId
        });
        
        logger.info('DeepFunding Integration', `Processed RFP: ${title}`);
        
        // Small delay to avoid overloading the server
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        logger.error('DeepFunding Integration', `Error processing RFP ${link}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        continue;
      }
    }
    
    return rfps;
    
  } catch (error) {
    logger.error('DeepFunding Integration', `Failed to fetch RFPs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
}

/**
 * Add DeepFunding RFPs to the grant sources database
 */
async function addDeepFundingToDatabase(rfps: DeepFundingRFP[]): Promise<number> {
  try {
    logger.info('DeepFunding Integration', `Adding ${rfps.length} RFPs to database`);
    
    let importedCount = 0;
    
    for (const rfp of rfps) {
      try {
        // Check if this RFP already exists in our database
        const existing = await db.query.grantSources.findFirst({
          where: (sources, { eq }) => eq(sources.applicationUrl, rfp.applicationUrl)
        });
        
        if (existing) {
          logger.info('DeepFunding Integration', `RFP already exists: ${rfp.title}`);
          continue;
        }
        
        // Parse deadline if available
        let applicationDeadline = null;
        if (rfp.deadline) {
          try {
            applicationDeadline = new Date(rfp.deadline);
          } catch (e) {
            // Invalid date format, ignore
          }
        }
        
        // Insert the RFP into our database
        await db.insert(grantSources).values({
          name: rfp.title,
          description: rfp.description,
          website: 'https://deepfunding.ai/all-rfps/',
          categories: rfp.categories,
          availableFunds: rfp.fundingAmount,
          applicationUrl: rfp.applicationUrl,
          applicationDeadline,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        importedCount++;
        logger.info('DeepFunding Integration', `Added RFP to database: ${rfp.title}`);
        
      } catch (error) {
        logger.error('DeepFunding Integration', `Error adding RFP to database: ${rfp.title} - ${error instanceof Error ? error.message : 'Unknown error'}`);
        continue;
      }
    }
    
    return importedCount;
    
  } catch (error) {
    logger.error('DeepFunding Integration', `Failed to add RFPs to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return 0;
  }
}

/**
 * Main integration function
 */
export async function integrateDeepFunding(): Promise<{ success: boolean; imported: number }> {
  try {
    logger.info('DeepFunding Integration', 'Starting integration process');
    
    // Fetch RFPs from DeepFunding.ai
    const rfps = await fetchDeepFundingRFPs();
    
    if (rfps.length === 0) {
      logger.warn('DeepFunding Integration', 'No RFPs found or error occurred during fetch');
      return { success: false, imported: 0 };
    }
    
    // Add RFPs to database
    const importedCount = await addDeepFundingToDatabase(rfps);
    
    logger.info('DeepFunding Integration', `Integration completed. Imported ${importedCount} RFPs.`);
    
    return {
      success: true,
      imported: importedCount
    };
    
  } catch (error) {
    logger.error('DeepFunding Integration', `Integration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      success: false,
      imported: 0
    };
  }
}