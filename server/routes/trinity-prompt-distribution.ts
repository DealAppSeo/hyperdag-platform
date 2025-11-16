/**
 * Trinity Prompt Distribution API
 * 
 * Central endpoint for distributing prompts to all Trinity managers
 * Enables autonomous coordination: one prompt → all managers work together
 */

import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { trinityPrompts, trinityPromptResponses, trinityManagerConfig } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { ProviderRouter } from '../services/provider-router';

const router = Router();
const providerRouter = new ProviderRouter();

/**
 * POST /api/trinity/prompt
 * Submit a prompt to all Trinity managers
 * Each manager processes it using free AI providers and coordinates responses
 */
router.post('/', async (req, res) => {
  try {
    const promptSchema = z.object({
      promptText: z.string().min(1),
      priority: z.enum(['urgent', 'high', 'normal', 'low']).default('normal'),
      userId: z.number().optional(),
      targetManagers: z.array(z.string()).optional(), // Optional: specify which managers to involve
    });
    
    const parsed = promptSchema.parse(req.body);
    
    // Get all active managers
    const activeManagers = await db
      .select()
      .from(trinityManagerConfig)
      .where(eq(trinityManagerConfig.status, 'active'));
    
    // Filter to target managers if specified
    const targetManagerIds = parsed.targetManagers || ['APM', 'HDM', 'Mel'];
    const managers = activeManagers.filter(m => targetManagerIds.includes(m.managerId));
    
    if (managers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No active managers available'
      });
    }
    
    // Create the prompt record
    const [prompt] = await db
      .insert(trinityPrompts)
      .values({
        promptText: parsed.promptText,
        userId: parsed.userId,
        priority: parsed.priority,
        status: 'processing',
        expectedManagers: managers.map(m => m.managerId),
        metadata: {
          submittedAt: new Date(),
          managerCount: managers.length
        }
      })
      .returning();
    
    console.log(`[Trinity Prompt] ID ${prompt.id} distributed to ${managers.length} managers: ${managers.map(m => m.managerId).join(', ')}`);
    
    // Create response placeholders for each manager
    const responsePromises = managers.map(async (manager) => {
      const [response] = await db
        .insert(trinityPromptResponses)
        .values({
          promptId: prompt.id,
          managerId: manager.managerId,
          status: 'acknowledged',
          metadata: {
            acknowledgedAt: new Date(),
            managerCapabilities: manager.capabilities
          }
        })
        .returning();
      
      return response;
    });
    
    const responses = await Promise.all(responsePromises);
    
    // Process prompt with each manager asynchronously (don't await - let it run in background)
    processPromptWithManagers(prompt.id, parsed.promptText, managers).catch(err => {
      console.error(`[Trinity Prompt] Error processing prompt ${prompt.id}:`, err);
    });
    
    // Return immediately with acknowledgment
    res.json({
      success: true,
      data: {
        promptId: prompt.id,
        status: 'processing',
        managersInvolved: managers.map(m => ({
          managerId: m.managerId,
          managerName: m.managerName,
          capabilities: m.capabilities,
          responseId: responses.find(r => r.managerId === m.managerId)?.id
        })),
        message: `Prompt distributed to ${managers.length} managers. Processing in background.`
      }
    });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }
    
    console.error('[Trinity Prompt] Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process prompt'
    });
  }
});

/**
 * GET /api/trinity/prompt/:promptId
 * Get status and responses for a specific prompt
 */
router.get('/:promptId', async (req, res) => {
  try {
    const promptId = parseInt(req.params.promptId);
    
    // Get prompt
    const [prompt] = await db
      .select()
      .from(trinityPrompts)
      .where(eq(trinityPrompts.id, promptId));
    
    if (!prompt) {
      return res.status(404).json({
        success: false,
        error: 'Prompt not found'
      });
    }
    
    // Get all responses
    const responses = await db
      .select()
      .from(trinityPromptResponses)
      .where(eq(trinityPromptResponses.promptId, promptId));
    
    res.json({
      success: true,
      data: {
        prompt,
        responses,
        summary: {
          totalManagers: prompt.expectedManagers?.length || 0,
          respondedCount: responses.filter(r => r.status === 'completed').length,
          processingCount: responses.filter(r => r.status === 'processing').length,
          failedCount: responses.filter(r => r.status === 'failed').length,
          totalCost: responses.reduce((sum, r) => sum + parseFloat(r.cost || '0'), 0),
          avgResponseTime: responses.filter(r => r.executionTimeMs).length > 0
            ? responses.reduce((sum, r) => sum + (r.executionTimeMs || 0), 0) / responses.filter(r => r.executionTimeMs).length
            : 0
        }
      }
    });
    
  } catch (error) {
    console.error('[Trinity Prompt] Error getting prompt:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve prompt'
    });
  }
});

/**
 * GET /api/trinity/prompts
 * Get all recent prompts with their status
 */
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    
    const prompts = await db
      .select()
      .from(trinityPrompts)
      .orderBy(trinityPrompts.id)
      .limit(limit);
    
    // Get response counts for each prompt
    const promptsWithCounts = await Promise.all(prompts.map(async (prompt) => {
      const responses = await db
        .select()
        .from(trinityPromptResponses)
        .where(eq(trinityPromptResponses.promptId, prompt.id));
      
      return {
        ...prompt,
        responses: responses.length,
        completed: responses.filter(r => r.status === 'completed').length
      };
    }));
    
    res.json({
      success: true,
      data: promptsWithCounts
    });
    
  } catch (error) {
    console.error('[Trinity Prompt] Error getting prompts:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to retrieve prompts'
    });
  }
});

/**
 * Background processing function
 * Each manager processes the prompt using free AI providers
 */
async function processPromptWithManagers(
  promptId: number,
  promptText: string,
  managers: any[]
) {
  const startTime = Date.now();
  
  // Process with each manager in parallel using free AI providers
  const processingPromises = managers.map(async (manager) => {
    const managerStart = Date.now();
    
    try {
      // Build context-specific prompt for this manager
      const contextualPrompt = buildManagerPrompt(manager, promptText);
      
      // Use ProviderRouter to execute with free AI providers
      const result = await providerRouter.executeTask({
        type: 'trinity-coordination',
        userMessage: contextualPrompt,
        context: {
          managerId: manager.managerId,
          capabilities: manager.capabilities,
          promptId
        }
      } as any);
      
      const executionTime = Date.now() - managerStart;
      
      // Update response with result
      await db
        .update(trinityPromptResponses)
        .set({
          status: result.success ? 'completed' : 'failed',
          response: result.result,
          aiProvider: result.provider,
          cost: result.cost.toString(),
          executionTimeMs: executionTime,
          completedAt: new Date(),
          metadata: {
            success: result.success,
            processingTime: executionTime
          }
        })
        .where(and(
          eq(trinityPromptResponses.promptId, promptId),
          eq(trinityPromptResponses.managerId, manager.managerId)
        ));
      
      console.log(`[Trinity ${manager.managerId}] Processed prompt ${promptId} in ${executionTime}ms using ${result.provider} ($${result.cost})`);
      
      return { managerId: manager.managerId, success: result.success };
      
    } catch (error) {
      const executionTime = Date.now() - managerStart;
      
      await db
        .update(trinityPromptResponses)
        .set({
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          executionTimeMs: executionTime,
          completedAt: new Date()
        })
        .where(and(
          eq(trinityPromptResponses.promptId, promptId),
          eq(trinityPromptResponses.managerId, manager.managerId)
        ));
      
      console.error(`[Trinity ${manager.managerId}] Failed to process prompt ${promptId}:`, error);
      
      return { managerId: manager.managerId, success: false };
    }
  });
  
  // Wait for all managers to complete
  const results = await Promise.all(processingPromises);
  
  const totalTime = Date.now() - startTime;
  const successCount = results.filter(r => r.success).length;
  
  // Update prompt status
  const finalStatus = successCount === managers.length ? 'completed' 
    : successCount > 0 ? 'completed'
    : 'failed';
  
  await db
    .update(trinityPrompts)
    .set({
      status: finalStatus,
      responseCount: successCount,
      completedAt: new Date(),
      metadata: {
        totalProcessingTime: totalTime,
        successfulManagers: successCount,
        completedAt: new Date()
      }
    })
    .where(eq(trinityPrompts.id, promptId));
  
  console.log(`[Trinity Prompt] Prompt ${promptId} completed: ${successCount}/${managers.length} managers successful in ${totalTime}ms`);
}

/**
 * Build manager-specific prompts based on their capabilities
 */
function buildManagerPrompt(manager: any, userPrompt: string): string {
  const basePrompt = `You are ${manager.managerName} (${manager.managerId}), a Trinity Symphony manager with capabilities: ${manager.capabilities?.join(', ')}.

User Request: ${userPrompt}

Your task: Analyze this request from your perspective and provide a response that includes:
1. What aspects of this request align with your capabilities
2. What tasks you can autonomously handle
3. What coordination you need from other managers (APM/HDM/Mel)
4. Estimated cost if using paid AI providers (you should prefer free providers)

Be concise and action-oriented. Focus on what you can DO, not just what you think.`;

  return basePrompt;
}

export default router;
