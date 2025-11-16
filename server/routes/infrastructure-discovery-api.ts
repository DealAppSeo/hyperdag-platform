import { Router } from 'express';
import { db } from '../db';
import { infrastructureAudit, insertInfrastructureAuditSchema, type InsertInfrastructureAudit } from '@shared/schema';
import { desc, eq } from 'drizzle-orm';

const router = Router();

router.post('/discover', async (req, res) => {
  try {
    const validatedData = insertInfrastructureAuditSchema.parse(req.body);
    
    const [audit] = await db.insert(infrastructureAudit)
      .values(validatedData)
      .returning();
    
    res.json({ 
      success: true, 
      audit,
      message: `Infrastructure component ${validatedData.component} discovered by ${validatedData.agentId}`
    });
  } catch (error: any) {
    console.error('[Infrastructure Discovery] Report error:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message || 'Failed to report infrastructure discovery'
    });
  }
});

router.post('/discover/batch', async (req, res) => {
  try {
    const { discoveries } = req.body;
    
    if (!Array.isArray(discoveries)) {
      return res.status(400).json({ 
        success: false, 
        error: 'discoveries must be an array' 
      });
    }
    
    const validatedDiscoveries = discoveries.map(d => 
      insertInfrastructureAuditSchema.parse(d)
    );
    
    const audits = await db.insert(infrastructureAudit)
      .values(validatedDiscoveries)
      .returning();
    
    res.json({ 
      success: true, 
      count: audits.length,
      audits,
      message: `${audits.length} infrastructure components discovered`
    });
  } catch (error: any) {
    console.error('[Infrastructure Discovery] Batch report error:', error);
    res.status(400).json({ 
      success: false, 
      error: error.message || 'Failed to report batch discoveries'
    });
  }
});

router.get('/audit', async (req, res) => {
  try {
    const { agent, component, limit = 100 } = req.query;
    
    let query = db.select().from(infrastructureAudit);
    
    if (agent) {
      query = query.where(eq(infrastructureAudit.agentId, agent as string)) as any;
    }
    
    if (component) {
      query = query.where(eq(infrastructureAudit.component, component as string)) as any;
    }
    
    const audits = await query
      .orderBy(desc(infrastructureAudit.discoveredAt))
      .limit(Number(limit));
    
    res.json({ 
      success: true, 
      count: audits.length,
      audits 
    });
  } catch (error: any) {
    console.error('[Infrastructure Discovery] Audit fetch error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch audit logs'
    });
  }
});

router.get('/status', async (req, res) => {
  try {
    const latestAudits = await db.select()
      .from(infrastructureAudit)
      .orderBy(desc(infrastructureAudit.discoveredAt))
      .limit(50);
    
    const componentMap = new Map<string, any>();
    
    for (const audit of latestAudits) {
      const key = `${audit.agentId}:${audit.component}`;
      if (!componentMap.has(key)) {
        componentMap.set(key, audit);
      }
    }
    
    const status = Array.from(componentMap.values());
    
    res.json({ 
      success: true, 
      count: status.length,
      components: status
    });
  } catch (error: any) {
    console.error('[Infrastructure Discovery] Status fetch error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch infrastructure status'
    });
  }
});

router.post('/run-discovery', async (req, res) => {
  try {
    const agentId = req.body.agentId || 'HDM';
    const discoveries: InsertInfrastructureAudit[] = [];
    
    discoveries.push({
      agentId,
      component: 'Replit',
      status: 'active',
      url: process.env.REPL_URL || 'https://hyperdag.dealappseo.repl.co',
      details: 'HyperDAG Manager - Running on Replit',
      metadata: {
        nodeVersion: process.version,
        platform: process.platform,
        uptime: process.uptime()
      }
    });
    
    if (process.env.SUPABASE_URL) {
      discoveries.push({
        agentId,
        component: 'Supabase',
        status: 'active',
        url: process.env.SUPABASE_URL,
        details: 'Supabase connection configured',
        metadata: {
          hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY
        }
      });
    } else {
      discoveries.push({
        agentId,
        component: 'Supabase',
        status: 'missing',
        url: '',
        details: 'Supabase URL not configured',
        metadata: {}
      });
    }
    
    if (process.env.DATABASE_URL) {
      discoveries.push({
        agentId,
        component: 'PostgreSQL',
        status: 'active',
        url: 'localhost',
        details: 'Local PostgreSQL database connected',
        metadata: {
          hasConnection: true
        }
      });
    }
    
    const audits = await db.insert(infrastructureAudit)
      .values(discoveries)
      .returning();
    
    res.json({ 
      success: true, 
      count: audits.length,
      discoveries: audits,
      message: `Discovery complete: ${audits.length} components found`
    });
  } catch (error: any) {
    console.error('[Infrastructure Discovery] Run discovery error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to run infrastructure discovery'
    });
  }
});

export default router;
