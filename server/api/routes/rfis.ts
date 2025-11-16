/**
 * RFIs (Requests for Information) API Routes
 */

import { Request, Response, NextFunction } from 'express';
import { storage } from '../../storage';
import { apiResponse } from '../index';
import { db } from '../../db';
import { rfis as rfisTable, users as usersTable, votes as votesTable, rfps as rfpsTable } from '@shared/schema';
import { eq, and, desc } from 'drizzle-orm';

// Get all RFIs
export async function getRfis(req: Request, res: Response) {
  try {
    // Get query parameters for filtering
    const status = req.query.status as string;
    const category = req.query.category as string;
    
    let rfis = await storage.getRfis();
    
    // Apply filters if provided
    if (status) {
      rfis = rfis.filter(rfi => rfi.status === status);
    }
    
    if (category) {
      rfis = rfis.filter(rfi => rfi.category === category);
    }
    
    return res.json(apiResponse(true, rfis));
  } catch (error) {
    console.error('Error fetching RFIs:', error);
    return res.status(500).json(apiResponse(false, null, 'Failed to fetch RFIs'));
  }
}

// Get a single RFI by ID
export async function getRfiById(req: Request, res: Response) {
  try {
    const rfiId = parseInt(req.params.id);
    if (isNaN(rfiId)) {
      return res.status(400).json(apiResponse(false, null, 'Invalid RFI ID'));
    }

    const rfi = await storage.getRfiById(rfiId);
    if (!rfi) {
      return res.status(404).json(apiResponse(false, null, 'RFI not found'));
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
      .where(eq(usersTable.id, rfi.submitterId));

    // Enrich response with additional info
    const result = {
      ...rfi,
      submitter,
    };

    return res.json(apiResponse(true, result));
  } catch (error) {
    console.error('Error fetching RFI:', error);
    return res.status(500).json(apiResponse(false, null, 'Failed to fetch RFI'));
  }
}

// Create a new RFI
export async function createRfi(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json(apiResponse(false, null, 'Unauthorized'));
  }
  
  try {
    const { title, description, category, problem, impact } = req.body;
    
    // Basic validation
    if (!title || !description || !category || !problem || !impact) {
      return res.status(400).json(apiResponse(false, null, 'Missing required fields'));
    }

    // Create the RFI
    const newRfi = await storage.createRfi({
      title,
      description,
      category,
      problem,
      impact,
      status: 'published',
      upvotes: 0,
      downvotes: 0,
      totalStaked: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      submitterId: req.user.id
    });

    // Add some reputation for submitting an RFI
    await db.insert(rfisTable).values({
      userId: req.user.id,
      type: 'rfi_submission',
      points: 5,
      description: `Submitted new RFI: ${title}`,
      timestamp: new Date()
    });

    return res.status(201).json(apiResponse(true, newRfi));
  } catch (error) {
    console.error('Error creating RFI:', error);
    return res.status(500).json(apiResponse(false, null, 'Failed to create RFI'));
  }
}

// Vote on an RFI
export async function voteOnRfi(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json(apiResponse(false, null, 'Unauthorized'));
  }
  
  try {
    const rfiId = parseInt(req.params.id);
    if (isNaN(rfiId)) {
      return res.status(400).json(apiResponse(false, null, 'Invalid RFI ID'));
    }

    const { voteType } = req.body;
    if (!voteType || !['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json(apiResponse(false, null, 'Invalid vote type'));
    }

    // Get the RFI
    const rfi = await storage.getRfiById(rfiId);
    if (!rfi) {
      return res.status(404).json(apiResponse(false, null, 'RFI not found'));
    }

    // Check if user has already voted
    const [existingVote] = await db
      .select()
      .from(votesTable)
      .where(
        and(
          eq(votesTable.userId, req.user.id),
          eq(votesTable.rfiId, rfiId)
        )
      );

    if (existingVote) {
      return res.status(400).json(apiResponse(false, null, 'User has already voted on this RFI'));
    }

    // Create the vote
    await db.insert(votesTable).values({
      userId: req.user.id,
      rfiId,
      voteType,
      createdAt: new Date()
    });

    // Update RFI vote count
    const updateData = voteType === 'upvote'
      ? { upvotes: rfi.upvotes + 1 }
      : { downvotes: rfi.downvotes + 1 };

    await db
      .update(rfisTable)
      .set(updateData)
      .where(eq(rfisTable.id, rfiId));

    // Return updated RFI
    const updatedRfi = await storage.getRfiById(rfiId);
    return res.json(apiResponse(true, updatedRfi));
  } catch (error) {
    console.error('Error voting on RFI:', error);
    return res.status(500).json(apiResponse(false, null, 'Failed to vote on RFI'));
  }
}

// Convert an RFI to an RFP
export async function convertRfiToRfp(req: Request, res: Response) {
  if (!req.user) {
    return res.status(401).json(apiResponse(false, null, 'Unauthorized'));
  }
  
  try {
    const rfiId = parseInt(req.params.id);
    if (isNaN(rfiId)) {
      return res.status(400).json(apiResponse(false, null, 'Invalid RFI ID'));
    }

    // Get the RFI
    const rfi = await storage.getRfiById(rfiId);
    if (!rfi) {
      return res.status(404).json(apiResponse(false, null, 'RFI not found'));
    }

    // Verify the user is the creator of the RFI or an admin
    if (req.user.id !== rfi.submitterId && !req.user.isAdmin) {
      return res.status(403).json(apiResponse(false, null, 'You are not authorized to convert this RFI'));
    }

    // Check if RFI has already been converted
    if (rfi.status === 'converted') {
      return res.status(400).json(apiResponse(false, null, 'RFI has already been converted to an RFP'));
    }

    const { requirements, deliverables, fundingGoal, timeline, skillsRequired } = req.body;

    // Validate required fields for RFP
    if (!requirements || !deliverables || !fundingGoal) {
      return res.status(400).json(apiResponse(false, null, 'Missing required fields for conversion'));
    }

    // Create the RFP
    const newRfp = await storage.createRfp({
      rfiId,
      title: rfi.title,
      description: rfi.description,
      category: rfi.category,
      tags: req.body.tags || null,
      requirements,
      deliverables,
      fundingGoal: parseInt(fundingGoal),
      budget: req.body.budget ? parseInt(req.body.budget) : null,
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
      submitterId: req.user.id
    });

    // Update RFI status to 'converted'
    await db
      .update(rfisTable)
      .set({ status: 'converted' })
      .where(eq(rfisTable.id, rfiId));

    return res.json(apiResponse(true, {
      rfi,
      rfp: newRfp
    }));
  } catch (error) {
    console.error('Error converting RFI to RFP:', error);
    return res.status(500).json(apiResponse(false, null, 'Failed to convert RFI to RFP'));
  }
}