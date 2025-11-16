/**
 * DeepFunding.ai API Routes
 * 
 * This module provides routes for integrating with DeepFunding.ai,
 * allowing administrators to import and manage grant data.
 */
import express, { Request, Response } from 'express';
import axios from 'axios';
import { db } from '../../db';
import { eq, and, sql } from 'drizzle-orm';
import { requireAdmin } from '../../middleware/admin-middleware';
import { grantSources, externalGrants, type GrantSource, type ExternalGrant, type InsertGrantSource, type InsertExternalGrant } from '@shared/schema';

const router = express.Router();

/**
 * Get the current status of DeepFunding.ai integration
 */
router.get('/status', requireAdmin, async (req: Request, res: Response) => {
  try {
    // Check if DeepFunding source exists
    const [deepFundingSource] = await db
      .select()
      .from(grantSources)
      .where(eq(grantSources.name, 'DeepFunding.ai'))
      .limit(1);

    if (!deepFundingSource) {
      return res.status(200).json({
        success: true,
        data: {
          integrated: false,
          count: 0,
          lastUpdated: null
        }
      });
    }
    
    // Get count of grants from this source
    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(externalGrants)
      .where(eq(externalGrants.sourceId, deepFundingSource.id));

    const status = {
      integrated: true,
      count: countResult?.count || 0,
      lastUpdated: deepFundingSource?.lastScraped || null
    };

    return res.status(200).json({ 
      success: true, 
      data: status 
    });
  } catch (error: any) {
    console.error('[DeepFunding] Status check error:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to check DeepFunding integration status' 
    });
  }
});

/**
 * Import grants from DeepFunding.ai
 */
router.post('/import', requireAdmin, async (req: Request, res: Response) => {
  try {
    // Fetch grants from DeepFunding.ai
    const grants = await fetchGrantsFromDeepFunding();
    
    // Insert or update grants in our database
    const result = await updateGrantsDatabase(grants);

    // Update the grant source last updated timestamp
    await updateGrantSourceTimestamp();

    return res.status(200).json({ 
      success: true, 
      data: {
        message: `Successfully imported grants from DeepFunding.ai`,
        imported: grants.length
      }
    });
  } catch (error: any) {
    console.error('[DeepFunding] Import error:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to import grants from DeepFunding.ai' 
    });
  }
});

/**
 * Fetches grants from DeepFunding.ai API
 */
async function fetchGrantsFromDeepFunding() {
  try {
    // This is a simplified example. In a real implementation,
    // you would make an actual API call to DeepFunding.ai
    // For demo purposes, we're returning sample grants
    const sampleGrants = [
      {
        id: 'df-1001',
        title: 'AI for Scientific Research',
        description: 'Funding for using AI to accelerate scientific discovery',
        fundingAmount: 50000,
        deadline: new Date(2025, 7, 15),
        url: 'https://deepfunding.ai/grants/ai-research',
        categories: ['AI', 'Science', 'Research']
      },
      {
        id: 'df-1002',
        title: 'Web3 Infrastructure Development',
        description: 'Supporting core infrastructure for decentralized applications',
        fundingAmount: 75000,
        deadline: new Date(2025, 8, 30),
        url: 'https://deepfunding.ai/grants/web3-infra',
        categories: ['Web3', 'Infrastructure', 'Blockchain']
      },
      {
        id: 'df-1003',
        title: 'Privacy-First Computing',
        description: 'Development of privacy-enhancing technologies',
        fundingAmount: 60000,
        deadline: new Date(2025, 6, 1),
        url: 'https://deepfunding.ai/grants/privacy-computing',
        categories: ['Privacy', 'Security', 'ZKP']
      }
    ];
    
    return sampleGrants;
  } catch (error) {
    console.error('Error fetching grants from DeepFunding:', error);
    throw new Error('Failed to fetch grants from DeepFunding.ai');
  }
}

/**
 * Updates the grants database with new grants from DeepFunding
 */
async function updateGrantsDatabase(grantsData: any[]) {
  try {
    // Check if source exists
    let sourceId: number;
    let [existingSource] = await db
      .select()
      .from(grantSources)
      .where(eq(grantSources.name, 'DeepFunding.ai'));
    
    if (existingSource) {
      sourceId = existingSource.id;
      // Update the lastScraped timestamp
      await db
        .update(grantSources)
        .set({ lastScraped: new Date() })
        .where(eq(grantSources.id, sourceId));
    } else {
      // Create a new source
      const [newSource] = await db
        .insert(grantSources)
        .values({
          name: 'DeepFunding.ai',
          description: 'AI-focused grant program for scientific research and Web3',
          website: 'https://deepfunding.ai',
          url: 'https://deepfunding.ai',
          categories: ['AI', 'Web3', 'Privacy'],
          lastScraped: new Date()
        })
        .returning();
      
      sourceId = newSource.id;
    }
    
    // Insert or update grants
    for (const grantData of grantsData) {
      // Check if the grant already exists
      const [existingGrant] = await db
        .select()
        .from(externalGrants)
        .where(and(
          eq(externalGrants.externalId, grantData.id),
          eq(externalGrants.sourceId, sourceId)
        ));
      
      if (existingGrant) {
        // Update existing grant
        await db
          .update(externalGrants)
          .set({
            title: grantData.title,
            description: grantData.description,
            fundingAmount: grantData.fundingAmount,
            applicationDeadline: grantData.deadline,
            url: grantData.url,
            categories: grantData.categories,
            updatedAt: new Date()
          })
          .where(eq(externalGrants.id, existingGrant.id));
      } else {
        // Insert new grant
        await db
          .insert(externalGrants)
          .values({
            externalId: grantData.id,
            sourceId: sourceId,
            title: grantData.title,
            description: grantData.description,
            fundingAmount: grantData.fundingAmount,
            applicationDeadline: grantData.deadline,
            url: grantData.url,
            categories: grantData.categories,
            isActive: true
          });
      }
    }
    
    return { success: true, count: grantsData.length };
  } catch (error) {
    console.error('Error updating grants database:', error);
    throw new Error('Failed to update grants database');
  }
}

/**
 * Updates the timestamp for when the DeepFunding source was last updated
 */
async function updateGrantSourceTimestamp() {
  try {
    const [deepFundingSource] = await db
      .select()
      .from(grantSources)
      .where(eq(grantSources.name, 'DeepFunding.ai'));
    
    if (deepFundingSource) {
      await db
        .update(grantSources)
        .set({ lastScraped: new Date() })
        .where(eq(grantSources.id, deepFundingSource.id));
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating grant source timestamp:', error);
    throw new Error('Failed to update grant source timestamp');
  }
}

export default router;