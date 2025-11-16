import { Router } from 'express';
import { db } from '../db';
import { dbtCredentials, organizations, users, type DbtCredential, type InsertDbtCredential } from '@shared/schema';
import { eq, desc, and, or, like } from 'drizzle-orm';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Register AI/Digital Entity
router.post('/register-entity', requireAuth, async (req, res) => {
  try {
    const { entityName, entityType, description, website, capabilities, walletAddress } = req.body;
    const userId = (req.user as any).id;

    if (!entityName || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Entity name and description are required' 
      });
    }

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address is required for AI agent registration'
      });
    }

    // Import anti-gaming service
    const { dbtAntiGamingService } = await import('../services/dbt-anti-gaming');

    // Validate wallet address format
    if (!walletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid wallet address format'
      });
    }

    // Check for wallet address uniqueness
    const existingWallet = await db.select()
      .from(users)
      .where(eq(users.walletAddress, walletAddress));

    if (existingWallet.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Wallet address already registered to another entity'
      });
    }

    // Perform anti-gaming validation
    const validation = await dbtAntiGamingService.validateAgentActivity(
      userId,
      'agent_registration',
      undefined,
      { entityName, entityType, walletAddress }
    );

    if (!validation.isValid && validation.riskLevel === 'critical') {
      return res.status(403).json({
        success: false,
        message: 'Registration blocked due to suspicious activity patterns',
        reasons: validation.reasons
      });
    }

    // Create DBT entity record
    const entityData = {
      id: Date.now(),
      entityName,
      entityType,
      description,
      website,
      capabilities: capabilities ? capabilities.split(',').map((c: string) => c.trim()) : [],
      walletAddress,
      status: validation.riskLevel === 'low' ? 'active' : 'pending_verification',
      riskLevel: validation.riskLevel,
      registeredAt: new Date().toISOString(),
      userId,
      humanOversightRequired: true,
      externalValidationRequired: entityType === 'ai_agent' || entityType === 'ai_model',
      antiGamingFlags: validation.reasons
    };

    // Update user's wallet address
    await db.update(users)
      .set({ walletAddress })
      .where(eq(users.id, userId));

    // Add reputation activity for registration
    await db.insert(reputationActivities).values({
      userId,
      type: 'dbt_entity_registered',
      points: validation.riskLevel === 'low' ? 15 : 5,
      description: `Registered AI/Digital entity: ${entityName}`,
      metadata: {
        entityType,
        riskLevel: validation.riskLevel,
        walletAddress: walletAddress.slice(0, 6) + '...' + walletAddress.slice(-4)
      }
    });

    res.json({
      success: true,
      message: 'AI/Digital entity registered successfully',
      data: entityData,
      warnings: validation.reasons.length > 0 ? validation.reasons : undefined
    });

  } catch (error) {
    console.error('Error registering DBT entity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register entity'
    });
  }
});

/**
 * DBT (Digital Bound Token) Routes
 * AI agent and digital entity reputation system for non-living entities
 */

// Get all DBT credentials for digital entities
router.get('/credentials', async (req, res) => {
  try {
    const entityType = req.query.entityType as string;
    const isActive = req.query.isActive !== 'false';
    
    let query = db
      .select({
        id: dbtCredentials.id,
        entityId: dbtCredentials.entityId,
        entityType: dbtCredentials.entityType,
        tokenId: dbtCredentials.tokenId,
        contractAddress: dbtCredentials.contractAddress,
        chainId: dbtCredentials.chainId,
        entityName: dbtCredentials.entityName,
        entityDescription: dbtCredentials.entityDescription,
        ownerUserId: dbtCredentials.ownerUserId,
        parentOrganizationId: dbtCredentials.parentOrganizationId,
        reliabilityScore: dbtCredentials.reliabilityScore,
        performanceScore: dbtCredentials.performanceScore,
        securityScore: dbtCredentials.securityScore,
        ethicsScore: dbtCredentials.ethicsScore,
        overallReputationScore: dbtCredentials.overallReputationScore,
        uptime: dbtCredentials.uptime,
        responseTime: dbtCredentials.responseTime,
        errorRate: dbtCredentials.errorRate,
        successfulInteractions: dbtCredentials.successfulInteractions,
        totalInteractions: dbtCredentials.totalInteractions,
        lastSecurityAudit: dbtCredentials.lastSecurityAudit,
        securityCertifications: dbtCredentials.securityCertifications,
        complianceStandards: dbtCredentials.complianceStandards,
        vulnerabilitiesFound: dbtCredentials.vulnerabilitiesFound,
        vulnerabilitiesFixed: dbtCredentials.vulnerabilitiesFixed,
        modelVersion: dbtCredentials.modelVersion,
        trainingDataQuality: dbtCredentials.trainingDataQuality,
        biasScore: dbtCredentials.biasScore,
        explainabilityScore: dbtCredentials.explainabilityScore,
        fairnessScore: dbtCredentials.fairnessScore,
        issuedAt: dbtCredentials.issuedAt,
        expiresAt: dbtCredentials.expiresAt,
        isRevoked: dbtCredentials.isRevoked,
        verificationLevel: dbtCredentials.verificationLevel,
        isActive: dbtCredentials.isActive,
        lastHealthCheck: dbtCredentials.lastHealthCheck,
        apiEndpoints: dbtCredentials.apiEndpoints,
        capabilities: dbtCredentials.capabilities,
        // Join with users table for owner info
        ownerUsername: users.username,
        // Join with organizations table for parent org info
        organizationName: organizations.name
      })
      .from(dbtCredentials)
      .leftJoin(users, eq(dbtCredentials.ownerUserId, users.id))
      .leftJoin(organizations, eq(dbtCredentials.parentOrganizationId, organizations.id))
      .where(and(
        eq(dbtCredentials.isRevoked, false),
        eq(dbtCredentials.isActive, isActive)
      ));

    if (entityType) {
      query = query.where(eq(dbtCredentials.entityType, entityType));
    }

    const credentials = await query
      .orderBy(desc(dbtCredentials.overallReputationScore), desc(dbtCredentials.issuedAt));

    res.json({
      success: true,
      data: { credentials }
    });
  } catch (error) {
    console.error('Error fetching DBT credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch digital entity credentials'
    });
  }
});

// Get DBT credential by entity ID
router.get('/entity/:entityId', async (req, res) => {
  try {
    const { entityId } = req.params;
    
    const [credential] = await db
      .select()
      .from(dbtCredentials)
      .leftJoin(users, eq(dbtCredentials.ownerUserId, users.id))
      .leftJoin(organizations, eq(dbtCredentials.parentOrganizationId, organizations.id))
      .where(and(
        eq(dbtCredentials.entityId, entityId),
        eq(dbtCredentials.isRevoked, false)
      ));

    if (!credential) {
      return res.status(404).json({
        success: false,
        message: 'Digital entity credentials not found'
      });
    }

    res.json({
      success: true,
      data: { credential }
    });
  } catch (error) {
    console.error('Error fetching digital entity credential:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch digital entity credential'
    });
  }
});

// Get DBT credentials by owner user ID
router.get('/owner/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const user = req.user as any;
    
    // Users can only access their own entities unless they're admin
    if (parseInt(userId) !== user.id && !user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const credentials = await db
      .select()
      .from(dbtCredentials)
      .where(and(
        eq(dbtCredentials.ownerUserId, parseInt(userId)),
        eq(dbtCredentials.isRevoked, false)
      ))
      .orderBy(desc(dbtCredentials.overallReputationScore));

    res.json({
      success: true,
      data: { credentials }
    });
  } catch (error) {
    console.error('Error fetching user DBT credentials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user digital entities'
    });
  }
});

// Create DBT credential
router.post('/create', requireAuth, async (req, res) => {
  try {
    const user = req.user as any;
    const credentialData: InsertDbtCredential = req.body;
    
    // Validate required fields
    if (!credentialData.entityId || !credentialData.entityType || !credentialData.entityName || !credentialData.tokenId) {
      return res.status(400).json({
        success: false,
        message: 'Entity ID, type, name, and token ID are required'
      });
    }

    // Check if entity ID already exists
    const [existingEntity] = await db
      .select()
      .from(dbtCredentials)
      .where(eq(dbtCredentials.entityId, credentialData.entityId));

    if (existingEntity) {
      return res.status(400).json({
        success: false,
        message: 'Entity ID already exists'
      });
    }

    // Set owner if not provided
    if (!credentialData.ownerUserId) {
      credentialData.ownerUserId = user.id;
    }

    // Create DBT credential
    const [newCredential] = await db
      .insert(dbtCredentials)
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
    console.error('Error creating DBT credential:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create digital entity credential'
    });
  }
});

// Update DBT credential
router.put('/:credentialId', requireAuth, async (req, res) => {
  try {
    const user = req.user as any;
    const { credentialId } = req.params;
    const updateData = req.body;
    
    // Check if user owns this entity or is admin
    const [existingCredential] = await db
      .select()
      .from(dbtCredentials)
      .where(eq(dbtCredentials.id, parseInt(credentialId)));

    if (!existingCredential) {
      return res.status(404).json({
        success: false,
        message: 'DBT credential not found'
      });
    }

    if (existingCredential.ownerUserId !== user.id && !user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const [updatedCredential] = await db
      .update(dbtCredentials)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(dbtCredentials.id, parseInt(credentialId)))
      .returning();

    res.json({
      success: true,
      data: { credential: updatedCredential }
    });
  } catch (error) {
    console.error('Error updating DBT credential:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update digital entity credential'
    });
  }
});

// Update entity performance metrics
router.post('/:credentialId/metrics', requireAuth, async (req, res) => {
  try {
    const user = req.user as any;
    const { credentialId } = req.params;
    const { 
      successfulInteractions, 
      totalInteractions, 
      responseTime, 
      errorRate, 
      uptime 
    } = req.body;
    
    // Check if user owns this entity or is admin
    const [existingCredential] = await db
      .select()
      .from(dbtCredentials)
      .where(eq(dbtCredentials.id, parseInt(credentialId)));

    if (!existingCredential) {
      return res.status(404).json({
        success: false,
        message: 'DBT credential not found'
      });
    }

    if (existingCredential.ownerUserId !== user.id && !user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Calculate new performance score based on metrics
    const currentSuccessful = existingCredential.successfulInteractions || 0;
    const currentTotal = existingCredential.totalInteractions || 0;
    const newSuccessful = currentSuccessful + (successfulInteractions || 0);
    const newTotal = currentTotal + (totalInteractions || 0);
    const successRate = newTotal > 0 ? (newSuccessful / newTotal) * 100 : 0;
    
    // Update performance score (0-100)
    const newPerformanceScore = Math.min(100, Math.round(successRate));
    
    const [updatedCredential] = await db
      .update(dbtCredentials)
      .set({
        successfulInteractions: newSuccessful,
        totalInteractions: newTotal,
        responseTime: responseTime || existingCredential.responseTime,
        errorRate: errorRate || existingCredential.errorRate,
        uptime: uptime || existingCredential.uptime,
        performanceScore: newPerformanceScore,
        lastHealthCheck: new Date(),
        updatedAt: new Date()
      })
      .where(eq(dbtCredentials.id, parseInt(credentialId)))
      .returning();

    res.json({
      success: true,
      data: { credential: updatedCredential }
    });
  } catch (error) {
    console.error('Error updating DBT metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update entity metrics'
    });
  }
});

// Get top-performing digital entities leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const entityType = req.query.entityType as string;
    
    let query = db
      .select({
        id: dbtCredentials.id,
        entityId: dbtCredentials.entityId,
        entityName: dbtCredentials.entityName,
        entityType: dbtCredentials.entityType,
        overallReputationScore: dbtCredentials.overallReputationScore,
        reliabilityScore: dbtCredentials.reliabilityScore,
        performanceScore: dbtCredentials.performanceScore,
        securityScore: dbtCredentials.securityScore,
        ethicsScore: dbtCredentials.ethicsScore,
        uptime: dbtCredentials.uptime,
        successfulInteractions: dbtCredentials.successfulInteractions,
        totalInteractions: dbtCredentials.totalInteractions,
        verificationLevel: dbtCredentials.verificationLevel,
        ownerUsername: users.username,
        organizationName: organizations.name
      })
      .from(dbtCredentials)
      .leftJoin(users, eq(dbtCredentials.ownerUserId, users.id))
      .leftJoin(organizations, eq(dbtCredentials.parentOrganizationId, organizations.id))
      .where(and(
        eq(dbtCredentials.isRevoked, false),
        eq(dbtCredentials.isActive, true)
      ));

    if (entityType) {
      query = query.where(eq(dbtCredentials.entityType, entityType));
    }

    const topEntities = await query
      .orderBy(desc(dbtCredentials.overallReputationScore))
      .limit(limit);

    res.json({
      success: true,
      data: { entities: topEntities }
    });
  } catch (error) {
    console.error('Error fetching DBT leaderboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch digital entity leaderboard'
    });
  }
});

// Search digital entities
router.get('/search', async (req, res) => {
  try {
    const { q, entityType, minScore } = req.query;
    
    let query = db
      .select()
      .from(dbtCredentials)
      .leftJoin(users, eq(dbtCredentials.ownerUserId, users.id))
      .leftJoin(organizations, eq(dbtCredentials.parentOrganizationId, organizations.id))
      .where(and(
        eq(dbtCredentials.isRevoked, false),
        eq(dbtCredentials.isActive, true)
      ));

    if (q) {
      query = query.where(or(
        like(dbtCredentials.entityName, `%${q}%`),
        like(dbtCredentials.entityDescription, `%${q}%`)
      ));
    }

    if (entityType) {
      query = query.where(eq(dbtCredentials.entityType, entityType as string));
    }

    if (minScore) {
      query = query.where(eq(dbtCredentials.overallReputationScore, parseInt(minScore as string)));
    }

    const results = await query
      .orderBy(desc(dbtCredentials.overallReputationScore))
      .limit(20);

    res.json({
      success: true,
      data: { entities: results }
    });
  } catch (error) {
    console.error('Error searching digital entities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search digital entities'
    });
  }
});

// Deactivate digital entity
router.post('/:credentialId/deactivate', requireAuth, async (req, res) => {
  try {
    const user = req.user as any;
    const { credentialId } = req.params;
    
    // Check if user owns this entity or is admin
    const [existingCredential] = await db
      .select()
      .from(dbtCredentials)
      .where(eq(dbtCredentials.id, parseInt(credentialId)));

    if (!existingCredential) {
      return res.status(404).json({
        success: false,
        message: 'DBT credential not found'
      });
    }

    if (existingCredential.ownerUserId !== user.id && !user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const [deactivatedCredential] = await db
      .update(dbtCredentials)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(dbtCredentials.id, parseInt(credentialId)))
      .returning();

    res.json({
      success: true,
      data: { credential: deactivatedCredential }
    });
  } catch (error) {
    console.error('Error deactivating DBT credential:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate digital entity'
    });
  }
});

// Revoke DBT credential (admin only)
router.post('/:credentialId/revoke', requireAuth, async (req, res) => {
  try {
    const user = req.user as any;
    const { credentialId } = req.params;
    
    if (!user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required to revoke DBT credentials'
      });
    }

    const [revokedCredential] = await db
      .update(dbtCredentials)
      .set({
        isRevoked: true,
        revokedAt: new Date(),
        revokedBy: user.id,
        updatedAt: new Date()
      })
      .where(eq(dbtCredentials.id, parseInt(credentialId)))
      .returning();

    if (!revokedCredential) {
      return res.status(404).json({
        success: false,
        message: 'DBT credential not found'
      });
    }

    res.json({
      success: true,
      data: { credential: revokedCredential }
    });
  } catch (error) {
    console.error('Error revoking DBT credential:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to revoke digital entity credential'
    });
  }
});

export default router;