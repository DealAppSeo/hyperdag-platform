import { Router } from 'express';
import { db } from '../db';
import { hyperdagNodes, insertHyperdagNodeSchema, type HyperdagNode } from '@shared/schema';
import { eq, desc, sql } from 'drizzle-orm';

const router = Router();

// ✅ GET /api/hyperdag/nodes - Get all nodes (real-time compatible)
router.get('/nodes', async (req, res) => {
  try {
    const nodes = await db.select().from(hyperdagNodes).orderBy(desc(hyperdagNodes.createdAt));
    
    res.json({
      success: true,
      data: nodes,
      count: nodes.length
    });
  } catch (error: any) {
    console.error('[HyperDAG] Error fetching nodes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch nodes',
      message: error.message
    });
  }
});

// ✅ GET /api/hyperdag/nodes/:id - Get single node
router.get('/nodes/:id', async (req, res) => {
  try {
    const nodeId = parseInt(req.params.id);
    const node = await db.select().from(hyperdagNodes).where(eq(hyperdagNodes.id, nodeId)).limit(1);
    
    if (!node || node.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Node not found'
      });
    }
    
    res.json({
      success: true,
      data: node[0]
    });
  } catch (error: any) {
    console.error('[HyperDAG] Error fetching node:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch node',
      message: error.message
    });
  }
});

// ✅ POST /api/hyperdag/nodes - Create new node
router.post('/nodes', async (req, res) => {
  try {
    const validatedData = insertHyperdagNodeSchema.parse(req.body);
    
    // ANFIS boost logic for keywords
    const keywords = validatedData.keywords || [];
    let boostFactor = 1.0;
    
    if (keywords.includes('chaos') || keywords.includes('graph')) {
      boostFactor = 1.5; // ✅ 50% ANFIS boost for chaos/graph keywords
    }
    if (keywords.includes('chaos') && keywords.includes('graph')) {
      boostFactor = 2.0; // ✅ 100% boost for both keywords
    }
    
    const [newNode] = await db.insert(hyperdagNodes).values(validatedData).returning();
    
    // Update boost factor if different from default
    if (boostFactor !== 1.0) {
      await db.update(hyperdagNodes)
        .set({ boostFactor: boostFactor.toString() })
        .where(eq(hyperdagNodes.id, newNode.id));
    }
    
    console.log(`[HyperDAG] Created node ${newNode.nodeId} with ${boostFactor}x ANFIS boost`);
    
    res.json({
      success: true,
      data: newNode,
      message: `Node created with ${boostFactor}x ANFIS boost`
    });
  } catch (error: any) {
    console.error('[HyperDAG] Error creating node:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to create node',
      message: error.message
    });
  }
});

// ✅ PATCH /api/hyperdag/nodes/:id - Update node
router.patch('/nodes/:id', async (req, res) => {
  try {
    const nodeId = parseInt(req.params.id);
    const updates = req.body;
    
    // ANFIS boost recalculation if keywords changed
    if (updates.keywords) {
      const keywords = updates.keywords;
      let boostFactor = 1.0;
      
      if (keywords.includes('chaos') || keywords.includes('graph')) {
        boostFactor = 1.5;
      }
      if (keywords.includes('chaos') && keywords.includes('graph')) {
        boostFactor = 2.0;
      }
      
      updates.boostFactor = boostFactor.toString();
    }
    
    const [updatedNode] = await db.update(hyperdagNodes)
      .set({
        ...updates,
        updatedAt: sql`now()`
      })
      .where(eq(hyperdagNodes.id, nodeId))
      .returning();
    
    if (!updatedNode) {
      return res.status(404).json({
        success: false,
        error: 'Node not found'
      });
    }
    
    res.json({
      success: true,
      data: updatedNode
    });
  } catch (error: any) {
    console.error('[HyperDAG] Error updating node:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to update node',
      message: error.message
    });
  }
});

// ✅ DELETE /api/hyperdag/nodes/:id - Delete node
router.delete('/nodes/:id', async (req, res) => {
  try {
    const nodeId = parseInt(req.params.id);
    const [deletedNode] = await db.delete(hyperdagNodes).where(eq(hyperdagNodes.id, nodeId)).returning();
    
    if (!deletedNode) {
      return res.status(404).json({
        success: false,
        error: 'Node not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Node deleted successfully'
    });
  } catch (error: any) {
    console.error('[HyperDAG] Error deleting node:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete node',
      message: error.message
    });
  }
});

// ✅ GET /api/hyperdag/stats - Get graph statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await db.select({
      totalNodes: sql<number>`count(*)`,
      activeNodes: sql<number>`count(*) filter (where status = 'active')`,
      avgHealth: sql<number>`avg(CAST(health AS DECIMAL))`,
      avgBoost: sql<number>`avg(CAST(boost_factor AS DECIMAL))`
    }).from(hyperdagNodes);
    
    res.json({
      success: true,
      data: stats[0] || {
        totalNodes: 0,
        activeNodes: 0,
        avgHealth: 0,
        avgBoost: 1.0
      }
    });
  } catch (error: any) {
    console.error('[HyperDAG] Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch stats',
      message: error.message
    });
  }
});

export default router;
