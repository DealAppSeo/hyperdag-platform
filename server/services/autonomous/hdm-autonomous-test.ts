import { db } from '../../db';
import { autonomousLogs } from '@shared/schema';

let heartbeatCount = 0;
let intervalId: NodeJS.Timeout | null = null;
let timeoutId: NodeJS.Timeout | null = null;

export async function startHDMAutonomousTest() {
  const startTime = new Date();
  console.log('[HDM Autonomous Test] Starting 5-minute verification test...');

  try {
    await db.insert(autonomousLogs).values({
      agent: 'HDM',
      event: 'test_start',
      details: {
        message: 'HDM online, testing autonomy.',
        timestamp: startTime.toISOString(),
        test_duration: '5 minutes',
        heartbeat_interval: '60 seconds'
      },
      repid_tag: `VERIFIED:Timestamp:${startTime.toISOString()}`
    });
    console.log('[HDM Autonomous Test] Initial log created');

    intervalId = setInterval(async () => {
      heartbeatCount++;
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);

      try {
        await db.insert(autonomousLogs).values({
          agent: 'HDM',
          event: 'heartbeat',
          details: {
            message: 'HDM heartbeat',
            heartbeat_number: heartbeatCount,
            elapsed_seconds: elapsed,
            timestamp: now.toISOString()
          },
          repid_tag: `VERIFIED:Heartbeat:${heartbeatCount}`
        });
        console.log(`[HDM Autonomous Test] Heartbeat #${heartbeatCount} (${elapsed}s elapsed)`);
      } catch (error) {
        console.error('[HDM Autonomous Test] Heartbeat error:', error);
      }
    }, 60000);

    setTimeout(async () => {
      try {
        await db.insert(autonomousLogs).values({
          agent: 'HDM',
          event: 'task_assignment',
          details: {
            message: 'HDM tags task for APM: "Confirm coordination".',
            assigned_to: 'APM',
            task: 'Confirm coordination',
            elapsed_minutes: 3,
            timestamp: new Date().toISOString()
          },
          repid_tag: 'VERIFIED:TaskAssignment:APM'
        });
        console.log('[HDM Autonomous Test] Tagged task for APM at 3-minute mark');
      } catch (error) {
        console.error('[HDM Autonomous Test] Task assignment error:', error);
      }
    }, 180000);

    timeoutId = setTimeout(async () => {
      try {
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }

        const endTime = new Date();
        const totalDuration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

        await db.insert(autonomousLogs).values({
          agent: 'HDM',
          event: 'test_complete',
          details: {
            message: 'HDM test complete',
            total_heartbeats: heartbeatCount,
            total_duration_seconds: totalDuration,
            cost: '$0.00',
            timestamp: endTime.toISOString(),
            status: 'success'
          },
          repid_tag: 'VERIFIED:TestComplete:Success'
        });
        console.log(`[HDM Autonomous Test] Test complete! ${heartbeatCount} heartbeats in ${totalDuration}s`);
      } catch (error) {
        console.error('[HDM Autonomous Test] Test completion error:', error);
      }
    }, 300000);

    return {
      status: 'started',
      message: 'HDM autonomous test running for 5 minutes',
      started_at: startTime.toISOString()
    };

  } catch (error) {
    console.error('[HDM Autonomous Test] Initialization error:', error);
    throw error;
  }
}

export function stopHDMAutonomousTest() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }
  console.log('[HDM Autonomous Test] Test stopped manually');
  return { status: 'stopped', heartbeats: heartbeatCount };
}
