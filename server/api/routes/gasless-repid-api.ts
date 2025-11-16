/**
 * Gasless RepID API for Lovable.dev Integration
 * 
 * No MetaMask required - Server handles all wallet operations
 * Perfect for hackathon MVP and production-ready demos
 */

import { Router, type Request, type Response } from 'express';
import { gaslessRepIDService } from '../../services/gasless-repid-service.js';
import { db } from '../../db.js';
import { repidCredentials, users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../../utils/logger.js';

const router = Router();

router.post('/create', async (req: Request, res: Response) => {
  try {
    const { userId, email, initialScore = 0 } = req.body;

    if (!userId && !email) {
      return res.status(400).json({
        success: false,
        error: 'userId or email required'
      });
    }

    let user;
    if (userId) {
      try {
        const result = await db.select({
          id: users.id,
          email: users.email,
          username: users.username,
          walletAddress: users.walletAddress
        }).from(users).where(eq(users.id, userId)).limit(1);
        user = result[0];
      } catch (error: any) {
        logger.error('[RepID API] Failed to query user:', error);
      }
    } else if (email) {
      try {
        const result = await db.select({
          id: users.id,
          email: users.email,
          username: users.username,
          walletAddress: users.walletAddress
        }).from(users).where(eq(users.email, email)).limit(1);
        user = result[0];
      } catch (error: any) {
        logger.error('[RepID API] Failed to query user:', error);
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found - please register first'
      });
    }

    const existingCredentials = await db
      .select()
      .from(repidCredentials)
      .where(eq(repidCredentials.userId, user.id))
      .limit(1);

    if (existingCredentials.length > 0) {
      return res.status(200).json({
        success: true,
        message: 'RepID already exists',
        data: existingCredentials[0]
      });
    }

    let walletAddress = user.walletAddress;
    
    if (!walletAddress) {
      const wallet = await gaslessRepIDService.createUserWallet();
      
      await db
        .update(users)
        .set({
          walletAddress: wallet.address
        })
        .where(eq(users.id, user.id));
      
      walletAddress = wallet.address;
      logger.info(`[RepID API] Created new wallet for user ${user.id}: ${walletAddress}`);
    }

    const credential = await gaslessRepIDService.mintRepIDCredential(
      walletAddress,
      initialScore
    );

    const zkpProof = await gaslessRepIDService.generateZKPProof(
      walletAddress,
      initialScore
    );

    const [newCredential] = await db
      .insert(repidCredentials)
      .values({
        userId: user.id,
        walletAddress: walletAddress,
        repidScore: initialScore,
        network: 'polygon-cardona',
        zkpProof: zkpProof,
        publicSignals: { score: initialScore },
        isSoulbound: true,
        lastVerified: new Date()
      })
      .returning();

    logger.info(`[RepID API] Created RepID credential for user ${user.id}`);

    return res.status(201).json({
      success: true,
      message: 'RepID credential created successfully',
      data: {
        id: newCredential.id,
        walletAddress: newCredential.walletAddress,
        repidScore: newCredential.repidScore,
        network: newCredential.network,
        transactionHash: credential.transactionHash,
        zkpProof: zkpProof,
        createdAt: newCredential.createdAt
      }
    });
  } catch (error: any) {
    logger.error('[RepID API] Failed to create RepID:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create RepID credential'
    });
  }
});

router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId required'
      });
    }

    const credentials = await db
      .select()
      .from(repidCredentials)
      .where(eq(repidCredentials.userId, parseInt(userId)))
      .limit(1);

    if (credentials.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'RepID credential not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: credentials[0]
    });
  } catch (error: any) {
    logger.error('[RepID API] Failed to get RepID:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve RepID credential'
    });
  }
});

router.post('/verify-proof', async (req: Request, res: Response) => {
  try {
    const { zkpProof } = req.body;

    if (!zkpProof) {
      return res.status(400).json({
        success: false,
        error: 'zkpProof required'
      });
    }

    const isValid = await gaslessRepIDService.verifyZKPProof(zkpProof);

    return res.status(200).json({
      success: true,
      data: {
        valid: isValid,
        verifiedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    logger.error('[RepID API] Failed to verify proof:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to verify ZKP proof'
    });
  }
});

router.put('/update-score', async (req: Request, res: Response) => {
  try {
    const { userId, repidScore } = req.body;

    if (!userId || repidScore === undefined) {
      return res.status(400).json({
        success: false,
        error: 'userId and repidScore required'
      });
    }

    const credentials = await db
      .select()
      .from(repidCredentials)
      .where(eq(repidCredentials.userId, parseInt(userId)))
      .limit(1);

    if (credentials.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'RepID credential not found'
      });
    }

    const newZkpProof = await gaslessRepIDService.generateZKPProof(
      credentials[0].walletAddress,
      repidScore
    );

    const [updated] = await db
      .update(repidCredentials)
      .set({
        repidScore: repidScore,
        zkpProof: newZkpProof,
        publicSignals: { score: repidScore },
        updatedAt: new Date(),
        lastVerified: new Date()
      })
      .where(eq(repidCredentials.userId, parseInt(userId)))
      .returning();

    logger.info(`[RepID API] Updated RepID score for user ${userId}: ${repidScore}`);

    return res.status(200).json({
      success: true,
      message: 'RepID score updated successfully',
      data: updated
    });
  } catch (error: any) {
    logger.error('[RepID API] Failed to update score:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update RepID score'
    });
  }
});

router.get('/network/info', async (req: Request, res: Response) => {
  try {
    const networkInfo = await gaslessRepIDService.getNetworkInfo();

    return res.status(200).json({
      success: true,
      data: networkInfo
    });
  } catch (error: any) {
    logger.error('[RepID API] Failed to get network info:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get network info'
    });
  }
});

export default router;
