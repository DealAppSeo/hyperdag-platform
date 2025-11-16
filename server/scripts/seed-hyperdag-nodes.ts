import { db } from '../db';
import { hyperdagNodes } from '@shared/schema';

async function seedHyperdagNodes() {
  console.log('[HyperDAG] Seeding initial graph nodes...');

  const initialNodes = [
    {
      nodeId: 'APM-1',
      nodeType: 'manager' as const,
      label: 'AI-Prompt-Manager',
      description: 'Optimizes and routes AI prompts with ANFIS intelligence',
      status: 'active' as const,
      health: '98.5',
      connectedTo: ['HDM-1', 'Mel-1'],
      keywords: ['prompt', 'optimization', 'routing'],
      metrics: {
        tasksCompleted: 156,
        avgResponseTime: 187,
        cost: '0.00024',
        errorRate: 0.02,
        lastActive: new Date().toISOString()
      }
    },
    {
      nodeId: 'HDM-1',
      nodeType: 'manager' as const,
      label: 'HyperDAGManager',
      description: 'Central orchestrator for distributed AI coordination',
      status: 'active' as const,
      health: '99.2',
      connectedTo: ['APM-1', 'Mel-1', 'Graph-1'],
      keywords: ['graph', 'chaos', 'orchestration'], // ✅ BOTH keywords = 2.0x boost
      metrics: {
        tasksCompleted: 213,
        avgResponseTime: 142,
        cost: '0.00018',
        errorRate: 0.01,
        lastActive: new Date().toISOString()
      }
    },
    {
      nodeId: 'Mel-1',
      nodeType: 'manager' as const,
      label: 'Mel (ImageBearer)',
      description: 'Visual synthesis and creative AI coordination',
      status: 'active' as const,
      health: '97.8',
      connectedTo: ['APM-1', 'HDM-1'],
      keywords: ['image', 'creative', 'synthesis'],
      metrics: {
        tasksCompleted: 89,
        avgResponseTime: 256,
        cost: '0.00031',
        errorRate: 0.03,
        lastActive: new Date().toISOString()
      }
    },
    {
      nodeId: 'Graph-1',
      nodeType: 'chaos' as const,
      label: 'Chaos Graph Engine',
      description: 'Applies chaotic dynamics to graph optimization',
      status: 'processing' as const,
      health: '95.0',
      connectedTo: ['HDM-1'],
      keywords: ['chaos', 'graph', 'dynamics'], // ✅ BOTH keywords = 2.0x boost
      metrics: {
        tasksCompleted: 42,
        avgResponseTime: 89,
        cost: '0.00009',
        errorRate: 0.05,
        lastActive: new Date().toISOString()
      }
    },
    {
      nodeId: 'Task-Pool-1',
      nodeType: 'resource' as const,
      label: 'Task Pool',
      description: 'Distributed task queue with priority routing',
      status: 'active' as const,
      health: '100.0',
      connectedTo: ['APM-1', 'HDM-1', 'Mel-1'],
      keywords: ['tasks', 'queue', 'priority'],
      metrics: {
        tasksCompleted: 500,
        avgResponseTime: 12,
        cost: '0.00001',
        errorRate: 0.0,
        lastActive: new Date().toISOString()
      }
    }
  ];

  try {
    for (const node of initialNodes) {
      const existing = await db.select().from(hyperdagNodes).where(eq(hyperdagNodes.nodeId, node.nodeId));
      
      if (existing.length === 0) {
        await db.insert(hyperdagNodes).values(node);
        console.log(`✅ Created node: ${node.nodeId} (Boost: ${node.keywords.includes('chaos') && node.keywords.includes('graph') ? '2.0x' : node.keywords.includes('chaos') || node.keywords.includes('graph') ? '1.5x' : '1.0x'})`);
      } else {
        console.log(`⏭️  Skipped existing node: ${node.nodeId}`);
      }
    }

    console.log('✅ [HyperDAG] Seed completed successfully!');
  } catch (error) {
    console.error('[HyperDAG] Seed error:', error);
  }
}

// Import eq for the where clause
import { eq } from 'drizzle-orm';

seedHyperdagNodes().catch(console.error);
