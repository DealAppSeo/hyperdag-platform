/**
 * RFPs (Requests for Proposals) API Routes
 */

import { Request, Response, NextFunction } from 'express';
import { storage } from '../../storage';
import { apiResponse } from '../index';
import { db } from '../../db';
import { rfps as rfpsTable, users as usersTable, proposals as proposalsTable } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

// Get all RFPs
export async function getRfps(req: Request, res: Response) {
  try {
    // Get query parameters for filtering
    const status = req.query.status as string;
    const category = req.query.category as string;
    
    let rfps = await storage.getRfps();
    
    // Apply filters if provided
    if (status) {
      rfps = rfps.filter(rfp => rfp.status === status);
    }
    
    if (category) {
      rfps = rfps.filter(rfp => rfp.category === category);
    }
    
    return res.json(apiResponse(true, rfps));
  } catch (error) {
    console.error('Error fetching RFPs:', error);
    return res.status(500).json(apiResponse(false, null, 'Failed to fetch RFPs'));
  }
}

// Get a single RFP by ID
export async function getRfpById(req: Request, res: Response) {
  try {
    const rfpId = parseInt(req.params.id);
    if (isNaN(rfpId)) {
      return res.status(400).json(apiResponse(false, null, 'Invalid RFP ID'));
    }

    const rfp = await storage.getRfpById(rfpId);
    if (!rfp) {
      return res.status(404).json(apiResponse(false, null, 'RFP not found'));
    }

    // Get submitter info
    const [submitter] = await db
      .select({
        id: usersTable.id,
        username: usersTable.username,
        walletAddress: usersTable.walletAddress,
        persona: usersTable.persona,
        reputationScore: usersTable.reputationScore
      })
      .from(usersTable)
      .where(eq(usersTable.id, rfp.submitterId));

    // Get proposals if they exist
    const proposals = await db
      .select()
      .from(proposalsTable)
      .where(eq(proposalsTable.rfpId, rfpId));

    // Enrich response with additional info
    const result = {
      ...rfp,
      submitter,
      proposals
    };

    return res.json(apiResponse(true, result));
  } catch (error) {
    console.error('Error fetching RFP:', error);
    return res.status(500).json(apiResponse(false, null, 'Failed to fetch RFP'));
  }
}

// Create a new RFP
export async function createRfp(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json(apiResponse(false, null, 'Unauthorized'));
  }
  
  try {
    const { title, description, category, requirements, deliverables, fundingGoal, budget, timeline, skillsRequired } = req.body;
    
    // Basic validation
    if (!title || !description || !category || !requirements || !deliverables || !fundingGoal) {
      return res.status(400).json(apiResponse(false, null, 'Missing required fields'));
    }

    // Create the RFP
    const newRfp = await storage.createRfp({
      title,
      description,
      category,
      tags: req.body.tags || null,
      requirements,
      deliverables,
      fundingGoal: parseInt(fundingGoal),
      budget: budget ? parseInt(budget) : null,
      timeline: timeline ? parseInt(timeline) : null,
      skillsRequired: skillsRequired || [],
      status: 'published',
      upvotes: 0,
      downvotes: 0,
      totalStaked: 0,
      totalFunded: 0,
      deadline: req.body.deadline ? new Date(req.body.deadline) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
      submitterId: req.user.id,
      rfiId: req.body.rfiId || null
    });

    // Add some reputation for submitting a new RFP
    await db.insert(rfpsTable).values({
      userId: req.user.id,
      type: 'rfp_submission',
      points: 10,
      description: `Submitted new RFP: ${title}`,
      timestamp: new Date()
    });

    return res.status(201).json(apiResponse(true, newRfp));
  } catch (error) {
    console.error('Error creating RFP:', error);
    return res.status(500).json(apiResponse(false, null, 'Failed to create RFP'));
  }
}

// Fund an RFP
export async function fundRfp(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json(apiResponse(false, null, 'Unauthorized'));
  }
  
  try {
    const rfpId = parseInt(req.params.id);
    if (isNaN(rfpId)) {
      return res.status(400).json(apiResponse(false, null, 'Invalid RFP ID'));
    }

    const { amount, tokenType } = req.body;
    if (!amount || isNaN(parseInt(amount)) || parseInt(amount) <= 0) {
      return res.status(400).json(apiResponse(false, null, 'Invalid funding amount'));
    }

    // Get the RFP
    const rfp = await storage.getRfpById(rfpId);
    if (!rfp) {
      return res.status(404).json(apiResponse(false, null, 'RFP not found'));
    }

    // Check if user has enough tokens (if funding with platform tokens)
    if (tokenType === 'platform' && req.user.tokens < parseInt(amount)) {
      return res.status(400).json(apiResponse(false, null, 'Not enough tokens'));
    }

    // Update RFP with new funding amount
    const fundingAmount = parseInt(amount);
    await db
      .update(rfpsTable)
      .set({ 
        totalFunded: rfp.totalFunded + fundingAmount,
        updatedAt: new Date()
      })
      .where(eq(rfpsTable.id, rfpId));

    // If funding with platform tokens, deduct from user's balance
    if (tokenType === 'platform') {
      await storage.updateUserTokens(req.user.id, req.user.tokens - fundingAmount);
    }

    // Get updated RFP
    const updatedRfp = await storage.getRfpById(rfpId);

    return res.json(apiResponse(true, updatedRfp));
  } catch (error) {
    console.error('Error funding RFP:', error);
    return res.status(500).json(apiResponse(false, null, 'Failed to fund RFP'));
  }
}

// Submit a proposal for an RFP
export async function submitProposal(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json(apiResponse(false, null, 'Unauthorized'));
  }
  
  try {
    const rfpId = parseInt(req.params.id);
    if (isNaN(rfpId)) {
      return res.status(400).json(apiResponse(false, null, 'Invalid RFP ID'));
    }

    // Get the RFP
    const rfp = await storage.getRfpById(rfpId);
    if (!rfp) {
      return res.status(404).json(apiResponse(false, null, 'RFP not found'));
    }

    // Prevent submitting proposals to your own RFP
    if (req.user.id === rfp.submitterId) {
      return res.status(400).json(apiResponse(false, null, 'You cannot submit a proposal to your own RFP'));
    }

    // Check if user has already submitted a proposal
    const [existingProposal] = await db
      .select()
      .from(proposalsTable)
      .where(
        and(
          eq(proposalsTable.rfpId, rfpId),
          eq(proposalsTable.submitterId, req.user.id)
        )
      );

    if (existingProposal) {
      return res.status(400).json(apiResponse(false, null, 'You have already submitted a proposal for this RFP'));
    }

    const { solution, timeline, budget, additionalInfo, milestones } = req.body;

    // Basic validation
    if (!solution || !timeline || !budget) {
      return res.status(400).json(apiResponse(false, null, 'Missing required fields'));
    }

    // Create the proposal
    const newProposal = await db.insert(proposalsTable).values({
      rfpId,
      submitterId: req.user.id,
      solution,
      timeline: parseInt(timeline),
      budget: parseInt(budget),
      additionalInfo: additionalInfo || null,
      milestones: milestones || null,
      status: 'submitted',
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    return res.status(201).json(apiResponse(true, newProposal[0]));
  } catch (error) {
    console.error('Error submitting proposal:', error);
    return res.status(500).json(apiResponse(false, null, 'Failed to submit proposal'));
  }
}