/**
 * Autonomous Decision-Making System
 * Exports all autonomous components for build-measure-learn methodology
 */

export * from './autonomous-decision-engine';
export * from './problem-detector';
export * from './agentic-prompt-wrapper';
export * from './structured-debate-protocol';
export * from './auto-fix-executor';

import { autonomousDecisionEngine } from './autonomous-decision-engine';
import { problemDetector } from './problem-detector';
import { agenticWrapper } from './agentic-prompt-wrapper';
import { debateProtocol } from './structured-debate-protocol';
import { autoFixExecutor } from './auto-fix-executor';

/**
 * Initialize autonomous system integrations
 */
export function initializeAutonomousSystem() {
  console.log('[Autonomous System] 🚀 Initializing...');

  // Connect problem detector to decision engine
  problemDetector.on('problem_detected', (problem) => {
    console.log(`[Autonomous System] 🔗 Problem detected → Decision engine`);
  });

  // Connect decision engine to auto-fix executor
  autonomousDecisionEngine.on('auto_implement', async (decision) => {
    console.log(`[Autonomous System] 🔗 Auto-implement → Fix executor`);
    
    // In real implementation, would execute the fix here
    // For now, just log
    console.log(`[Autonomous System] ⚡ Would execute: ${decision.description}`);
  });

  // Connect fix executor to decision engine for learning
  autoFixExecutor.on('fix_completed', ({ result }) => {
    console.log(`[Autonomous System] 🔗 Fix completed → Update patterns`);
    // Learn from successful fixes
  });

  console.log('[Autonomous System] ✅ Autonomous system initialized');
  console.log('[Autonomous System] 📊 Components:');
  console.log('  - Decision Engine (no-downside heuristic)');
  console.log('  - Problem Detector (continuous monitoring)');
  console.log('  - Agentic Wrapper (challenge-oriented AI)');
  console.log('  - Debate Protocol (anti-loop mechanisms)');
  console.log('  - Auto-Fix Executor (test & rollback)');
}

export const autonomous = {
  decisionEngine: autonomousDecisionEngine,
  problemDetector,
  agenticWrapper,
  debateProtocol,
  autoFixExecutor,
  initialize: initializeAutonomousSystem
};
