import { Router } from 'express';
import { db } from '../db';
import { cbtCredentials, organizations, type CbtCredential, type InsertCbtCredential } from '@shared/schema';
import { eq, desc, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';

const router = Router();

/**
 * CBT (Charity Bound Token) Routes
 * Decentralized charity accountability system - like a decentralized Charity Navigator
 */

// Get all CBT credentials for charities
router.get('/credentials', async (req, res) => {
  try {
    const credentials = await db
      .select({
        id: cbtCredentials.id,
        charityId: cbtCredentials.charityId,
        tokenId: cbtCredentials.tokenId,
        contractAddress: cbtCredentials.contractAddress,
        chainId: cbtCredentials.chainId,
        accountabilityRating: cbtCredentials.accountabilityRating,
        transparencyRating: cbtCredentials.transparencyRating,
        financialEfficiencyRating: cbtCredentials.financialEfficiencyRating,
        impactRating: cbtCredentials.impactRating,
        overallRating: cbtCredentials.overallRating,
        programExpenseRatio: cbtCredentials.programExpenseRatio,
        adminExpenseRatio: cbtCredentials.adminExpenseRatio,
        fundraisingExpenseRatio: cbtCredentials.fundraisingExpenseRatio,
        totalRevenue: cbtCredentials.totalRevenue,
        totalExpenses: cbtCredentials.totalExpenses,
        form990Filed: cbtCredentials.form990Filed,
        auditedFinancials: cbtCredentials.auditedFinancials,
        boardGovernance: cbtCredentials.boardGovernance,
        conflictOfInterestPolicy: cbtCredentials.conflictOfInterestPolicy,
        whistleblowerPolicy: cbtCredentials.whistleblowerPolicy,
        beneficiariesServed: cbtCredentials.beneficiariesServed,
        impactDescription: cbtCredentials.impactDescription,
        outcomeMeasurement: cbtCredentials.outcomeMeasurement,
        issuedAt: cbtCredentials.issuedAt,
        expiresAt: cbtCredentials.expiresAt,
        isRevoked: cbtCredentials.isRevoked,
        verificationLevel: cbtCredentials.verificationLevel,
        lastAudited: cbtCredentials.lastAudited,
        nextAuditDue: cbtCredentials.nextAuditDue,
        // Join with organizations table to get charity info
        charityName: organizations.name,
        charityType: organizations.type,
        charityWebsite: organizations.website,
        charityDescription: organizations.description
      })
      .from(cbtCredentials)
      .leftJoin(organizations, eq(cbtCredentials.charityId, organizations.id))
      .where(eq(cbtCredentials.isRevoked, false))
      .orderBy(desc(cbtCredentials.overallRating), desc(cbtCredentials.issuedAt));

    res.json({
      success: true,
      data: { credentials }
    });
  } catch (error) {
    console.error('Error fetching CBT credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch charity credentials'
    });
  }
});

// Get CBT credential by charity ID
router.get('/charity/:charityId', async (req, res) => {
  try {
    const { charityId } = req.params;
    
    const [credential] = await db
      .select()
      .from(cbtCredentials)
      .leftJoin(organizations, eq(cbtCredentials.charityId, organizations.id))
      .where(and(
        eq(cbtCredentials.charityId, parseInt(charityId)),
        eq(cbtCredentials.isRevoked, false)
      ));

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Charity credentials not found'
      });
    }

    res.json({
      success: true,
      data: { credential }
    });
  } catch (error) {
    console.error('Error fetching charity credential:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch charity credential'
    });
  }
});

// Create CBT credential (admin only)
router.post('/create', requireAuth, async (req, res) => {
  try {
    const user = req.user as any;
    
    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required to create CBT credentials'
      });
    }

    const credentialData: InsertCbtCredential = req.body;
    
    // Validate required fields
    if (!credentialData.charityId || !credentialData.tokenId) {
      return res.status(400).json({
        success: false,
        message: 'Charity ID and token ID are required'
      });
    }

    // Check if charity exists
    const [charity] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, credentialData.charityId));

    if (!charity) {
      return res.status(404).json({
        success: false,
        message: 'Charity organization not found'
      });
    }

    // Create CBT credential
    const [newCredential] = await db
      .insert(cbtCredentials)
      .values({
        ...credentialData,
        issuerAddress: user.walletAddress || 'system',
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    res.status(201).json({
      success: true,
      data: { credential: newCredential }
    });
  } catch (error) {
    console.error('Error creating CBT credential:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create charity credential'
    });
  }
});

// Update CBT credential (admin only)
router.put('/:credentialId', requireAuth, async (req, res) => {
  try {
    const user = req.user as any;
    const { credentialId } = req.params;
    
    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required to update CBT credentials'
      });
    }

    const updateData = req.body;
    
    const [updatedCredential] = await db
      .update(cbtCredentials)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(cbtCredentials.id, parseInt(credentialId)))
      .returning();

    if (!updatedCredential) {
      return res.status(404).json({
        success: false,
        message: 'CBT credential not found'
      });
    }

    res.json({
      success: true,
      data: { credential: updatedCredential }
    });
  } catch (error) {
    console.error('Error updating CBT credential:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update charity credential'
    });
  }
});

// Get top-rated charities
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    
    const topCharities = await db
      .select({
        id: cbtCredentials.id,
        charityId: cbtCredentials.charityId,
        charityName: organizations.name,
        charityType: organizations.type,
        overallRating: cbtCredentials.overallRating,
        accountabilityRating: cbtCredentials.accountabilityRating,
        transparencyRating: cbtCredentials.transparencyRating,
        financialEfficiencyRating: cbtCredentials.financialEfficiencyRating,
        impactRating: cbtCredentials.impactRating,
        beneficiariesServed: cbtCredentials.beneficiariesServed,
        totalRevenue: cbtCredentials.totalRevenue,
        programExpenseRatio: cbtCredentials.programExpenseRatio,
        verificationLevel: cbtCredentials.verificationLevel
      })
      .from(cbtCredentials)
      .leftJoin(organizations, eq(cbtCredentials.charityId, organizations.id))
      .where(eq(cbtCredentials.isRevoked, false))
      .orderBy(desc(cbtCredentials.overallRating))
      .limit(limit);

    res.json({
      success: true,
      data: { charities: topCharities }
    });
  } catch (error) {
    console.error('Error fetching charity leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch charity leaderboard'
    });
  }
});

// Revoke CBT credential (admin only)
router.post('/:credentialId/revoke', requireAuth, async (req, res) => {
  try {
    const user = req.user as any;
    const { credentialId } = req.params;
    
    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required to revoke CBT credentials'
      });
    }

    const [revokedCredential] = await db
      .update(cbtCredentials)
      .set({
        isRevoked: true,
        revokedAt: new Date(),
        revokedBy: user.id,
        updatedAt: new Date()
      })
      .where(eq(cbtCredentials.id, parseInt(credentialId)))
      .returning();

    if (!revokedCredential) {
      return res.status(404).json({
        success: false,
        message: 'CBT credential not found'
      });
    }

    res.json({
      success: true,
      data: { credential: revokedCredential }
    });
  } catch (error) {
    console.error('Error revoking CBT credential:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke charity credential'
    });
  }
});

export default router;