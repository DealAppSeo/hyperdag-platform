/**
 * Structured Debate Protocol with Anti-Loop Mechanisms
 * Enables Trinity AI managers to question each other productively without infinite loops
 * Implements proactive safeguards to circumvent logic loops before they start
 */

import { EventEmitter } from 'events';

export interface DebateMessage {
  id: string;
  round: number;
  sender: 'HyperDAG' | 'AI-Prompt-Manager' | 'ImageBearerAI';
  type: 'propose' | 'question' | 'challenge' | 'respond' | 'vote';
  content: string;
  timestamp: Date;
  similarityToParent?: number; // Detects repetition
}

export interface DebateTopic {
  id: string;
  topic: string;
  initiator: string;
  status: 'active' | 'resolved' | 'escalated' | 'terminated';
  resolution?: string;
  votes?: Map<string, 'approve' | 'reject' | 'abstain'>;
  messages: DebateMessage[];
  createdAt: Date;
  resolvedAt?: Date;
}

export interface DebateConfig {
  maxRounds: number;              // Maximum debate rounds (default: 5)
  maxDuration: number;            // Maximum debate duration in ms (default: 5 minutes)
  similarityThreshold: number;    // 0-1, detect repetition (default: 0.85)
  consensusThreshold: number;     // 2/3 = 0.67 for Trinity
  enableAutoTermination: boolean; // Auto-terminate loops
}

export class StructuredDebateProtocol extends EventEmitter {
  private debates: Map<string, DebateTopic> = new Map();
  private messageHistory: Map<string, string[]> = new Map(); // For similarity detection
  private config: DebateConfig;

  constructor(config?: Partial<DebateConfig>) {
    super();
    this.config = {
      maxRounds: config?.maxRounds || 5,
      maxDuration: config?.maxDuration || 5 * 60 * 1000, // 5 minutes
      similarityThreshold: config?.similarityThreshold || 0.85,
      consensusThreshold: config?.consensusThreshold || 0.67, // 2/3 for Trinity
      enableAutoTermination: config?.enableAutoTermination ?? true
    };

    console.log('[Debate Protocol] 🗣️  Initialized with anti-loop mechanisms');
    console.log(`[Debate Protocol] ⚙️  Max rounds: ${this.config.maxRounds}, Duration: ${this.config.maxDuration}ms`);
  }

  /**
   * Start a new debate
   */
  startDebate(topic: string, initiator: string): string {
    const debateId = `debate-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const debate: DebateTopic = {
      id: debateId,
      topic,
      initiator,
      status: 'active',
      messages: [],
      createdAt: new Date(),
      votes: new Map()
    };

    this.debates.set(debateId, debate);
    this.messageHistory.set(debateId, []);

    console.log(`[Debate Protocol] 🎯 New debate started: "${topic}" by ${initiator}`);

    // Auto-terminate if exceeds duration
    if (this.config.enableAutoTermination) {
      setTimeout(() => {
        this.checkAutoTermination(debateId);
      }, this.config.maxDuration);
    }

    this.emit('debate_started', debate);
    return debateId;
  }

  /**
   * Add message to debate with loop detection
   */
  addMessage(
    debateId: string,
    sender: DebateMessage['sender'],
    type: DebateMessage['type'],
    content: string
  ): { success: boolean; reason?: string; loopDetected?: boolean } {
    const debate = this.debates.get(debateId);
    if (!debate || debate.status !== 'active') {
      return { success: false, reason: 'Debate not active' };
    }

    // Check round limit
    const currentRound = Math.floor(debate.messages.length / 3) + 1; // 3 managers
    if (currentRound > this.config.maxRounds) {
      this.terminateDebate(debateId, 'Max rounds exceeded');
      return { success: false, reason: 'Max rounds exceeded', loopDetected: false };
    }

    // Detect repetition (potential loop)
    const history = this.messageHistory.get(debateId)!;
    const similarity = this.calculateMaxSimilarity(content, history);

    if (similarity > this.config.similarityThreshold) {
      console.log(`[Debate Protocol] 🔁 Loop detected (similarity: ${(similarity * 100).toFixed(1)}%)`);
      this.emit('loop_detected', { debateId, sender, similarity });

      // Force resolution vote instead of continuing loop
      this.forceVote(debateId);
      return { 
        success: false, 
        reason: 'Repetitive argument detected - forcing vote', 
        loopDetected: true 
      };
    }

    // Add message
    const message: DebateMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      round: currentRound,
      sender,
      type,
      content,
      timestamp: new Date(),
      similarityToParent: similarity
    };

    debate.messages.push(message);
    history.push(content);

    this.emit('message_added', { debateId, message });
    console.log(`[Debate Protocol] 💬 Round ${currentRound} - ${sender} (${type}): "${content.substring(0, 50)}..."`);

    // Check if ready for vote
    if (currentRound >= 2 && type === 'respond') {
      console.log(`[Debate Protocol] 🗳️  Debate ready for vote after ${currentRound} rounds`);
      this.emit('ready_for_vote', { debateId, round: currentRound });
    }

    return { success: true };
  }

  /**
   * Submit vote
   */
  submitVote(
    debateId: string,
    voter: DebateMessage['sender'],
    vote: 'approve' | 'reject' | 'abstain'
  ): { success: boolean; resolved?: boolean; resolution?: string } {
    const debate = this.debates.get(debateId);
    if (!debate) {
      return { success: false };
    }

    if (!debate.votes) {
      debate.votes = new Map();
    }

    debate.votes.set(voter, vote);

    console.log(`[Debate Protocol] 🗳️  ${voter} votes: ${vote}`);

    // Check if all managers have voted
    if (debate.votes.size === 3) {
      const approval = this.calculateConsensus(debate.votes);
      
      if (approval >= this.config.consensusThreshold) {
        this.resolveDebate(debateId, 'approved');
        return { success: true, resolved: true, resolution: 'approved' };
      } else {
        this.resolveDebate(debateId, 'rejected');
        return { success: true, resolved: true, resolution: 'rejected' };
      }
    }

    return { success: true, resolved: false };
  }

  /**
   * Force a vote (when loop detected or max rounds reached)
   */
  private forceVote(debateId: string) {
    const debate = this.debates.get(debateId);
    if (!debate) return;

    console.log(`[Debate Protocol] ⚠️  Forcing vote due to loop/limit`);
    this.emit('force_vote', { debateId });

    // Set timeout to escalate if no votes received
    setTimeout(() => {
      if (debate.status === 'active' && (!debate.votes || debate.votes.size < 3)) {
        this.escalateDebate(debateId);
      }
    }, 60 * 1000); // 1 minute to vote
  }

  /**
   * Resolve debate
   */
  private resolveDebate(debateId: string, resolution: string) {
    const debate = this.debates.get(debateId);
    if (!debate) return;

    debate.status = 'resolved';
    debate.resolution = resolution;
    debate.resolvedAt = new Date();

    const duration = debate.resolvedAt.getTime() - debate.createdAt.getTime();
    const rounds = Math.floor(debate.messages.length / 3);

    console.log(`[Debate Protocol] ✅ Debate resolved: ${resolution}`);
    console.log(`[Debate Protocol] 📊 Duration: ${(duration / 1000).toFixed(1)}s, Rounds: ${rounds}`);

    this.emit('debate_resolved', { debate, duration, rounds });
  }

  /**
   * Escalate debate to user
   */
  private escalateDebate(debateId: string) {
    const debate = this.debates.get(debateId);
    if (!debate) return;

    debate.status = 'escalated';
    console.log(`[Debate Protocol] 🆙 Debate escalated to user: "${debate.topic}"`);

    this.emit('debate_escalated', debate);
  }

  /**
   * Terminate debate (timeout or loop)
   */
  private terminateDebate(debateId: string, reason: string) {
    const debate = this.debates.get(debateId);
    if (!debate) return;

    debate.status = 'terminated';
    debate.resolution = `Terminated: ${reason}`;

    console.log(`[Debate Protocol] ⛔ Debate terminated: ${reason}`);

    this.emit('debate_terminated', { debate, reason });
  }

  /**
   * Check if debate should auto-terminate
   */
  private checkAutoTermination(debateId: string) {
    const debate = this.debates.get(debateId);
    if (!debate || debate.status !== 'active') return;

    const duration = Date.now() - debate.createdAt.getTime();

    if (duration >= this.config.maxDuration) {
      this.terminateDebate(debateId, 'Max duration exceeded');
    }
  }

  /**
   * Calculate similarity between text and history (simple Jaccard similarity)
   */
  private calculateMaxSimilarity(text: string, history: string[]): number {
    if (history.length === 0) return 0;

    const words = new Set(text.toLowerCase().split(/\s+/));
    let maxSimilarity = 0;

    for (const historical of history) {
      const historicalWords = new Set(historical.toLowerCase().split(/\s+/));
      const intersection = new Set([...words].filter(w => historicalWords.has(w)));
      const union = new Set([...words, ...historicalWords]);
      
      const similarity = intersection.size / union.size;
      maxSimilarity = Math.max(maxSimilarity, similarity);
    }

    return maxSimilarity;
  }

  /**
   * Calculate consensus from votes
   */
  private calculateConsensus(votes: Map<string, 'approve' | 'reject' | 'abstain'>): number {
    let approvals = 0;
    let total = 0;

    for (const [, vote] of votes) {
      if (vote === 'approve') approvals++;
      if (vote !== 'abstain') total++;
    }

    return total > 0 ? approvals / total : 0;
  }

  /**
   * Get debate status
   */
  getDebate(debateId: string): DebateTopic | undefined {
    return this.debates.get(debateId);
  }

  /**
   * Get all active debates
   */
  getActiveDebates(): DebateTopic[] {
    return Array.from(this.debates.values())
      .filter(d => d.status === 'active');
  }

  /**
   * Get debate history
   */
  getDebateHistory(): DebateTopic[] {
    return Array.from(this.debates.values())
      .filter(d => d.status === 'resolved' || d.status === 'terminated');
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const all = Array.from(this.debates.values());
    const resolved = all.filter(d => d.status === 'resolved');
    const terminated = all.filter(d => d.status === 'terminated');
    const escalated = all.filter(d => d.status === 'escalated');

    const avgDuration = resolved.length > 0
      ? resolved.reduce((sum, d) => {
          const duration = d.resolvedAt!.getTime() - d.createdAt.getTime();
          return sum + duration;
        }, 0) / resolved.length
      : 0;

    const avgRounds = resolved.length > 0
      ? resolved.reduce((sum, d) => sum + Math.floor(d.messages.length / 3), 0) / resolved.length
      : 0;

    return {
      total: all.length,
      active: all.filter(d => d.status === 'active').length,
      resolved: resolved.length,
      terminated: terminated.length,
      escalated: escalated.length,
      avgDurationMs: avgDuration,
      avgRounds: avgRounds,
      loopsDetected: terminated.filter(d => d.resolution?.includes('Loop')).length
    };
  }
}

export const debateProtocol = new StructuredDebateProtocol({
  maxRounds: 5,
  maxDuration: 5 * 60 * 1000, // 5 minutes
  similarityThreshold: 0.85,
  consensusThreshold: 0.67, // 2/3 for Trinity
  enableAutoTermination: true
});
