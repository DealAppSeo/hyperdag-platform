import { Router } from 'express';
import { z } from 'zod';
import { sbtManager } from '../../services/sbt/sbt-manager.js';
import { zkpSystem } from '../../services/zkp/zkp-system.js';
import { reputationANFIS } from '../../services/anfis/reputation-anfis.js';
import { daoGovernance } from '../../services/dao/governance-system.js';
import { integratedHyperDAG } from '../../services/sbt/integrated-hyperdag-system.js';

const router = Router();

// ========================================
// SOUL BOUND TOKEN MANAGEMENT
// ========================================

/**
 * Create a new Soul Bound Token
 */
router.post('/sbt/create', async (req, res) => {
  try {
    const createSBTSchema = z.object({
      walletAddress: z.string().min(1),
      tokenType: z.enum(['SBT', 'DBT', 'CBT']),
      authLevel: z.number().min(1).max(4),
      email: z.string().email().optional(),
      username: z.string().optional(),
      // SBT-specific
      initialSkills: z.object({
        technical: z.number().min(0).max(100),
        social: z.number().min(0).max(100),
        creative: z.number().min(0).max(100),
        impact: z.number().min(0).max(100)
      }).optional(),
      // DBT-specific
      capabilities: z.array(z.string()).optional(),
      autonomyLevel: z.number().min(1).max(5).optional(),
      modelType: z.string().optional(),
      provider: z.string().optional(),
      // CBT-specific
      organizationName: z.string().optional(),
      focusAreas: z.array(z.string()).optional(),
      verificationData: z.object({
        ein: z.string().optional(),
        charityNavigatorRating: z.number().optional(),
        guidestarSeal: z.boolean().optional(),
        transparencyScore: z.number().min(0).max(100)
      }).optional(),
      // Initial contributions
      initialContributions: z.array(z.object({
        type: z.enum(['code', 'governance', 'mentorship', 'content', 'nonprofit']),
        value: z.number().min(0),
        description: z.string(),
        externalReference: z.string().optional()
      })).optional()
    });

    const data = createSBTSchema.parse(req.body);

    // Create verified SBT with all components
    const result = await integratedHyperDAG.createVerifiedSBT(data);

    res.json({
      success: true,
      data: {
        sbt: result.sbt,
        reputation: result.reputation,
        zkpProofs: result.zkpProofs.map(proof => ({
          proofId: proof.proofId,
          proofType: proof.proofType,
          verified: proof.verified,
          statement: proof.statement
        })),
        initialContributions: result.initialContributions.length,
        message: `${data.tokenType} created successfully with ${result.reputation.totalScore.toFixed(1)} reputation`
      }
    });

  } catch (error) {
    console.error('[SBT API] Error creating SBT:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create SBT'
    });
  }
});

/**
 * Get SBT by owner address
 */
router.get('/sbt/:address', async (req, res) => {
  try {
    const address = req.params.address;
    const sbt = await sbtManager.getSBT(address);

    if (!sbt) {
      return res.status(404).json({
        success: false,
        error: 'SBT not found for this address'
      });
    }

    // Get contributions
    const contributions = await sbtManager.getContributions(sbt.id);
    
    // Get ZKP proofs
    const zkpProofs = await zkpSystem.getProofsForSBT(sbt.id);

    res.json({
      success: true,
      data: {
        sbt,
        contributions: contributions.length,
        zkpProofs: zkpProofs.length,
        recentContributions: contributions.slice(0, 5).map(c => ({
          type: c.contributionType,
          value: parseFloat(c.value),
          description: c.description,
          timestamp: c.timestamp,
          verified: c.verificationStatus === 'verified'
        })),
        recentProofs: zkpProofs.slice(0, 3).map(p => ({
          proofType: p.proofType,
          statement: p.statement,
          verified: p.verified,
          createdAt: p.createdAt
        }))
      }
    });

  } catch (error) {
    console.error('[SBT API] Error getting SBT:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve SBT'
    });
  }
});

/**
 * Add contribution to SBT
 */
router.post('/sbt/:address/contribution', async (req, res) => {
  try {
    const address = req.params.address;
    
    const contributionSchema = z.object({
      contributionType: z.enum(['code', 'governance', 'mentorship', 'content', 'nonprofit']),
      value: z.number().min(0),
      description: z.string().min(1),
      externalReference: z.string().optional(),
      impactMultiplier: z.number().min(0.1).max(10).optional()
    });

    const contributionData = contributionSchema.parse(req.body);

    // Get SBT
    const sbt = await sbtManager.getSBT(address);
    if (!sbt) {
      return res.status(404).json({
        success: false,
        error: 'SBT not found for this address'
      });
    }

    // Add contribution
    const contribution = await sbtManager.addContribution({
      sbtId: sbt.id,
      ...contributionData
    });

    // Generate ZKP proof for contribution
    const zkpProof = await zkpSystem.generateContributionProof(
      sbt.id,
      contributionData.value,
      contributionData.impactMultiplier || 1,
      { externalReference: contributionData.externalReference }
    );

    res.json({
      success: true,
      data: {
        contribution,
        zkpProof: {
          proofId: zkpProof.proofId,
          verified: zkpProof.verified,
          statement: zkpProof.statement
        },
        message: 'Contribution added and verified with ZKP'
      }
    });

  } catch (error) {
    console.error('[SBT API] Error adding contribution:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add contribution'
    });
  }
});

// ========================================
// ZERO-KNOWLEDGE PROOF OPERATIONS
// ========================================

/**
 * Generate skill verification proof
 */
router.post('/zkp/skill-proof', async (req, res) => {
  try {
    const skillProofSchema = z.object({
      sbtId: z.number(),
      actualSkills: z.object({
        technical: z.number().min(0).max(100),
        social: z.number().min(0).max(100),
        creative: z.number().min(0).max(100),
        impact: z.number().min(0).max(100)
      }),
      minimumRequired: z.object({
        technical: z.number().min(0).max(100),
        social: z.number().min(0).max(100),
        creative: z.number().min(0).max(100),
        impact: z.number().min(0).max(100)
      })
    });

    const data = skillProofSchema.parse(req.body);

    const proof = await zkpSystem.generateSkillProof(
      data.sbtId,
      data.actualSkills,
      data.minimumRequired
    );

    res.json({
      success: true,
      data: {
        proofId: proof.proofId,
        proofType: proof.proofType,
        statement: proof.statement,
        verified: proof.verified,
        publicSignals: proof.publicSignals,
        expiresAt: proof.expiresAt,
        message: 'Skill verification proof generated successfully'
      }
    });

  } catch (error) {
    console.error('[ZKP API] Error generating skill proof:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate skill proof'
    });
  }
});

/**
 * Generate reputation threshold proof
 */
router.post('/zkp/reputation-proof', async (req, res) => {
  try {
    const reputationProofSchema = z.object({
      sbtId: z.number(),
      threshold: z.number().min(0)
    });

    const data = reputationProofSchema.parse(req.body);

    // Get SBT to check actual reputation
    const sbt = await sbtManager.getSBTById(data.sbtId.toString());
    if (!sbt) {
      return res.status(404).json({
        success: false,
        error: 'SBT not found'
      });
    }

    const actualReputation = parseFloat(sbt.reputationScore);
    
    const proof = await zkpSystem.generateReputationProof(
      data.sbtId,
      actualReputation,
      data.threshold
    );

    res.json({
      success: true,
      data: {
        proofId: proof.proofId,
        proofType: proof.proofType,
        statement: proof.statement,
        verified: proof.verified,
        publicSignals: proof.publicSignals,
        meetsThreshold: actualReputation >= data.threshold,
        expiresAt: proof.expiresAt,
        message: 'Reputation threshold proof generated successfully'
      }
    });

  } catch (error) {
    console.error('[ZKP API] Error generating reputation proof:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate reputation proof'
    });
  }
});

/**
 * Verify ZKP proof
 */
router.post('/zkp/verify/:proofId', async (req, res) => {
  try {
    const proofId = req.params.proofId;
    const isValid = await zkpSystem.verifyProof(proofId);

    res.json({
      success: true,
      data: {
        proofId,
        valid: isValid,
        verifiedAt: new Date().toISOString(),
        message: isValid ? 'Proof verified successfully' : 'Proof verification failed'
      }
    });

  } catch (error) {
    console.error('[ZKP API] Error verifying proof:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify proof'
    });
  }
});

// ========================================
// REPUTATION & ANFIS OPERATIONS
// ========================================

/**
 * Calculate reputation using ANFIS
 */
router.post('/reputation/calculate/:sbtId', async (req, res) => {
  try {
    const sbtId = parseInt(req.params.sbtId);
    
    // Get SBT and contributions
    const sbt = await sbtManager.getSBTById(sbtId.toString());
    if (!sbt) {
      return res.status(404).json({
        success: false,
        error: 'SBT not found'
      });
    }

    const contributions = await sbtManager.getContributions(sbtId);
    
    // Calculate reputation using ANFIS
    const reputation = await reputationANFIS.calculateReputation(contributions, sbt);

    res.json({
      success: true,
      data: {
        sbtId,
        totalScore: reputation.totalScore,
        dimensionalScores: reputation.dimensionalScores,
        confidence: reputation.confidence,
        reasoning: reputation.reasoning,
        contributionsAnalyzed: contributions.length,
        message: 'Reputation calculated using ANFIS engine'
      }
    });

  } catch (error) {
    console.error('[Reputation API] Error calculating reputation:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate reputation'
    });
  }
});

/**
 * Calculate voting power for governance
 */
router.post('/reputation/voting-power', async (req, res) => {
  try {
    const votingPowerSchema = z.object({
      voterAddress: z.string(),
      proposalCategory: z.string(),
      proposalType: z.string()
    });

    const data = votingPowerSchema.parse(req.body);

    const sbt = await sbtManager.getSBT(data.voterAddress);
    if (!sbt) {
      return res.status(404).json({
        success: false,
        error: 'SBT not found for this address'
      });
    }

    const votingPower = await reputationANFIS.calculateVotingPower(
      sbt,
      data.proposalCategory,
      data.proposalType
    );

    res.json({
      success: true,
      data: {
        voterAddress: data.voterAddress,
        baseWeight: votingPower.baseWeight,
        purposeWeight: votingPower.purposeWeight,
        totalWeight: votingPower.totalWeight,
        alignment: votingPower.alignment,
        reasoning: votingPower.reasoning,
        message: 'Voting power calculated with purpose weighting'
      }
    });

  } catch (error) {
    console.error('[Reputation API] Error calculating voting power:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate voting power'
    });
  }
});

// ========================================
// DAO GOVERNANCE OPERATIONS
// ========================================

/**
 * Create governance proposal
 */
router.post('/dao/proposal', async (req, res) => {
  try {
    const proposalSchema = z.object({
      title: z.string().min(1),
      description: z.string().min(1),
      category: z.enum(['technical', 'funding', 'governance', 'social_impact']),
      proposalType: z.string(),
      submittedBy: z.string(),
      votingDuration: z.number().optional(),
      requiredParticipation: z.number().optional(),
      consensusThreshold: z.number().optional(),
      useANFISOptimization: z.boolean().optional(),
      requireZKPVoting: z.boolean().optional()
    });

    const data = proposalSchema.parse(req.body);

    const result = await integratedHyperDAG.processIntegratedGovernance(data);

    res.json({
      success: true,
      data: {
        proposal: result.proposal,
        eligibilityAnalysis: result.eligibilityAnalysis,
        anfisOptimization: result.anfisOptimization,
        zkpReadiness: result.zkpReadiness,
        message: 'Governance proposal created with integrated analysis'
      }
    });

  } catch (error) {
    console.error('[DAO API] Error creating proposal:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create proposal'
    });
  }
});

/**
 * Cast vote on proposal
 */
router.post('/dao/vote', async (req, res) => {
  try {
    const voteSchema = z.object({
      proposalId: z.number(),
      voterAddress: z.string(),
      position: z.enum(['for', 'against', 'abstain']),
      voteStrength: z.number().min(1).max(100),
      reasoning: z.string().optional(),
      anonymous: z.boolean().optional()
    });

    const data = voteSchema.parse(req.body);

    const vote = await daoGovernance.castVote(data);

    res.json({
      success: true,
      data: {
        voteId: vote.id,
        proposalId: vote.proposalId,
        position: vote.position,
        voteStrength: parseFloat(vote.voteStrength),
        purposeWeightedPower: parseFloat(vote.purposeWeightedPower),
        quadraticCost: parseFloat(vote.quadraticCost),
        anonymous: vote.isAnonymous,
        zkpVerified: vote.zkpVerified,
        message: `Vote cast successfully with ${vote.isAnonymous ? 'anonymous' : 'public'} verification`
      }
    });

  } catch (error) {
    console.error('[DAO API] Error casting vote:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cast vote'
    });
  }
});

/**
 * Get voting power for address
 */
router.get('/dao/voting-power/:address', async (req, res) => {
  try {
    const address = req.params.address;
    const proposalId = req.query.proposalId ? parseInt(req.query.proposalId as string) : undefined;

    const votingPower = await daoGovernance.getVotingPower(address, proposalId);

    res.json({
      success: true,
      data: votingPower
    });

  } catch (error) {
    console.error('[DAO API] Error getting voting power:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get voting power'
    });
  }
});

/**
 * Get active proposals
 */
router.get('/dao/proposals', async (req, res) => {
  try {
    const category = req.query.category as string | undefined;
    const proposals = await daoGovernance.getActiveProposals(category);

    res.json({
      success: true,
      data: {
        proposals,
        count: proposals.length,
        filtered: !!category
      }
    });

  } catch (error) {
    console.error('[DAO API] Error getting proposals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get proposals'
    });
  }
});

// ========================================
// INTEGRATED SYSTEM OPERATIONS
// ========================================

/**
 * Enhanced routing with reputation
 */
router.post('/integrated/routing', async (req, res) => {
  try {
    const routingSchema = z.object({
      question: z.string().min(1),
      userId: z.string().optional(),
      requirements: z.object({
        priority: z.enum(['speed', 'cost', 'accuracy', 'balanced']).optional(),
        consensusRequired: z.boolean().optional(),
        minConfidence: z.number().optional()
      }).optional(),
      sbtEnhanced: z.boolean().optional()
    });

    const data = routingSchema.parse(req.body);

    const result = await integratedHyperDAG.routeWithReputation(data);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('[Integrated API] Error with enhanced routing:', error);
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process enhanced routing'
    });
  }
});

/**
 * Get system metrics
 */
router.get('/integrated/metrics', async (req, res) => {
  try {
    const metrics = await integratedHyperDAG.generateSystemMetrics();

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('[Integrated API] Error getting system metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get system metrics'
    });
  }
});

/**
 * Verify system integration health
 */
router.get('/integrated/health', async (req, res) => {
  try {
    const health = await integratedHyperDAG.verifySystemIntegration();

    res.json({
      success: true,
      data: health
    });

  } catch (error) {
    console.error('[Integrated API] Error checking system health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check system health'
    });
  }
});

export default router;