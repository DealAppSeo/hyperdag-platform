import { db } from '../../db';
import { autonomousLogs, trinityTasks } from '@shared/schema';
import { eq } from 'drizzle-orm';

let rotationIntervalId: NodeJS.Timeout | null = null;
let rotationTimeoutId: NodeJS.Timeout | null = null;
let rotationCount = 0;
const ROTATION_DURATION = 20 * 60 * 1000; // 20 minutes
const HEARTBEAT_INTERVAL = 2 * 60 * 1000; // 2 minutes

export async function startHDMRotation() {
  const startTime = new Date();
  console.log('[HDM Rotation] Starting 20-minute rotation cycle...');

  try {
    // Initial rotation log
    await db.insert(autonomousLogs).values({
      agent: 'HDM',
      event: 'rotation_start',
      details: {
        message: 'HDM 20-minute rotation started',
        timestamp: startTime.toISOString(),
        duration: '20 minutes',
        heartbeat_interval: '2 minutes',
        claimed_task: 4
      },
      repid_tag: `VERIFIED:RotationStart:${startTime.toISOString()}`
    });

    // Heartbeat every 2 minutes
    rotationIntervalId = setInterval(async () => {
      rotationCount++;
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);

      try {
        await db.insert(autonomousLogs).values({
          agent: 'HDM',
          event: 'rotation_heartbeat',
          details: {
            message: 'HDM rotation heartbeat',
            heartbeat_number: rotationCount,
            elapsed_seconds: elapsed,
            elapsed_minutes: Math.floor(elapsed / 60),
            timestamp: now.toISOString()
          },
          repid_tag: `VERIFIED:RotationHeartbeat:${rotationCount}`
        });
        console.log(`[HDM Rotation] Heartbeat #${rotationCount} (${Math.floor(elapsed / 60)}min elapsed)`);

        // Check for task updates every heartbeat
        const tasks = await db.select()
          .from(trinityTasks)
          .where(eq(trinityTasks.assignedManager, 'HDM'));
        
        console.log(`[HDM Rotation] Monitoring ${tasks.length} HDM tasks`);
      } catch (error) {
        console.error('[HDM Rotation] Heartbeat error:', error);
      }
    }, HEARTBEAT_INTERVAL);

    // Auto-stop after 20 minutes
    rotationTimeoutId = setTimeout(async () => {
      try {
        if (rotationIntervalId) {
          clearInterval(rotationIntervalId);
          rotationIntervalId = null;
        }

        const endTime = new Date();
        const totalDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

        await db.insert(autonomousLogs).values({
          agent: 'HDM',
          event: 'rotation_complete',
          details: {
            message: 'HDM rotation complete - handing off to next agent',
            total_heartbeats: rotationCount,
            total_duration_seconds: totalDuration,
            total_duration_minutes: Math.floor(totalDuration / 60),
            cost: '$0.00',
            timestamp: endTime.toISOString(),
            next_agent: 'MEL'
          },
          repid_tag: 'VERIFIED:RotationComplete:Success'
        });
        console.log(`[HDM Rotation] Rotation complete! ${rotationCount} heartbeats in ${Math.floor(totalDuration / 60)} minutes`);
        console.log(`[HDM Rotation] Handing off to MEL...`);
      } catch (error) {
        console.error('[HDM Rotation] Rotation completion error:', error);
      }
    }, ROTATION_DURATION);

    return {
      status: 'started',
      message: 'HDM 20-minute rotation running',
      started_at: startTime.toISOString(),
      ends_at: new Date(startTime.getTime() + ROTATION_DURATION).toISOString(),
      claimed_task: 4
    };

  } catch (error) {
    console.error('[HDM Rotation] Initialization error:', error);
    throw error;
  }
}

export function stopHDMRotation() {
  if (rotationIntervalId) {
    clearInterval(rotationIntervalId);
    rotationIntervalId = null;
  }
  if (rotationTimeoutId) {
    clearTimeout(rotationTimeoutId);
    rotationTimeoutId = null;
  }
  console.log('[HDM Rotation] Rotation stopped manually');
  return { status: 'stopped', heartbeats: rotationCount };
}
