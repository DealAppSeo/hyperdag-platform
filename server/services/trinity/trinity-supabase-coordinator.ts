/**
 * Trinity Supabase Coordinator
 * Manages real-time coordination between all 3 Trinity Symphony managers
 * via shared Supabase database (Mel's instance)
 */

import { getSupabaseClient, isSupabaseAvailable } from '../shared/unified-supabase-client';
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

interface TrinityPrompt {
  id?: string;
  prompt_text: string;
  version: number;
  manager: string; // 'HyperDAG' | 'AI-Prompt-Manager' | 'Mel'
  created_at?: string;
  active: boolean;
}

interface AutonomousDecision {
  id?: string;
  problem_id: string;
  decision_type: string;
  description: string;
  score: number;
  priority: string;
  pattern?: string;
  manager: string;
  created_at?: string;
}

interface AutonomousMetrics {
  id?: string;
  manager: string;
  timestamp: string;
  api_latency_avg?: number;
  cache_hit_rate?: number;
  free_tier_utilization?: number;
  error_rate?: number;
  active_requests?: number;
}

interface TrinityVote {
  id?: string;
  decision_id: string;
  proposal: string;
  severity: string;
  hyperdag_vote?: string;
  hyperdag_reasoning?: string;
  apm_vote?: string;
  apm_reasoning?: string;
  mel_vote?: string;
  mel_reasoning?: string;
  final_decision?: string;
  created_at?: string;
}

export class TrinitySupabaseCoordinator {
  private client: SupabaseClient | null = null;
  private channels: Map<string, RealtimeChannel> = new Map();
  private isInitialized = false;

  /**
   * Initialize Trinity coordination
   */
  async initialize(): Promise<void> {
    if (!isSupabaseAvailable()) {
      console.log('[Trinity Coordinator] ⚠️  Supabase not available - running in local mode');
      return;
    }

    try {
      this.client = getSupabaseClient();
      
      // Create tables if they don't exist
      await this.createTables();
      
      // Subscribe to real-time updates
      await this.subscribeToPrompts();
      await this.subscribeToVotes();
      
      this.isInitialized = true;
      console.log('[Trinity Coordinator] ✅ Initialized with Supabase coordination');
      console.log('[Trinity Coordinator] 📡 Real-time channels active');
    } catch (error) {
      console.error('[Trinity Coordinator] ❌ Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create Trinity tables in Supabase
   */
  private async createTables(): Promise<void> {
    if (!this.client) return;

    try {
      // Note: These tables should ideally be created via Supabase migrations
      // For now, we'll check if they exist by attempting a select
      
      const tables = [
        'trinity_prompts',
        'autonomous_decisions', 
        'autonomous_metrics',
        'trinity_votes'
      ];

      for (const table of tables) {
        const { error } = await this.client
          .from(table)
          .select('*')
          .limit(1);
          
        if (error && error.message.includes('does not exist')) {
          console.log(`[Trinity Coordinator] 📋 Table ${table} needs to be created in Supabase`);
          console.log(`[Trinity Coordinator] 💡 Run migrations or create via Supabase UI`);
        }
      }
      
      console.log('[Trinity Coordinator] ✅ Table check complete');
    } catch (error) {
      console.warn('[Trinity Coordinator] ⚠️  Table creation check failed:', error);
    }
  }

  /**
   * Subscribe to Trinity prompt updates
   */
  private async subscribeToPrompts(): Promise<void> {
    if (!this.client) return;

    const channel = this.client
      .channel('trinity_prompts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trinity_prompts',
          filter: 'active=eq.true'
        },
        (payload) => {
          console.log('[Trinity Coordinator] 📝 Prompt updated:', payload);
          this.handlePromptUpdate(payload.new as TrinityPrompt);
        }
      )
      .subscribe();

    this.channels.set('prompts', channel);
  }

  /**
   * Subscribe to Trinity votes
   */
  private async subscribeToVotes(): Promise<void> {
    if (!this.client) return;

    const channel = this.client
      .channel('trinity_votes_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trinity_votes'
        },
        (payload) => {
          console.log('[Trinity Coordinator] 🗳️  Vote received:', payload);
          this.handleVoteUpdate(payload.new as TrinityVote);
        }
      )
      .subscribe();

    this.channels.set('votes', channel);
  }

  /**
   * Handle prompt updates
   */
  private handlePromptUpdate(prompt: TrinityPrompt): void {
    console.log('[Trinity Coordinator] 🔄 New prompt from', prompt.manager);
    // Autonomous system can react to prompt changes here
  }

  /**
   * Handle vote updates
   */
  private handleVoteUpdate(vote: TrinityVote): void {
    console.log('[Trinity Coordinator] 🗳️  Processing vote for decision:', vote.decision_id);
    
    // Check if we have consensus (2 out of 3 managers)
    const votes = [vote.hyperdag_vote, vote.apm_vote, vote.mel_vote].filter(v => v);
    if (votes.length >= 2) {
      const approvals = votes.filter(v => v === 'approve').length;
      const rejections = votes.filter(v => v === 'reject').length;
      
      if (approvals >= 2) {
        console.log('[Trinity Coordinator] ✅ Consensus reached: APPROVE');
      } else if (rejections >= 2) {
        console.log('[Trinity Coordinator] ❌ Consensus reached: REJECT');
      }
    }
  }

  /**
   * Store autonomous decision
   */
  async storeDecision(decision: Omit<AutonomousDecision, 'id' | 'created_at'>): Promise<void> {
    if (!this.client || !this.isInitialized) {
      console.log('[Trinity Coordinator] ⚠️  Cannot store decision - not initialized');
      return;
    }

    try {
      const { error } = await this.client
        .from('autonomous_decisions')
        .insert({
          ...decision,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('[Trinity Coordinator] ❌ Failed to store decision:', error);
      } else {
        console.log('[Trinity Coordinator] ✅ Decision stored');
      }
    } catch (error) {
      console.error('[Trinity Coordinator] ❌ Error storing decision:', error);
    }
  }

  /**
   * Store autonomous metrics
   */
  async storeMetrics(metrics: Omit<AutonomousMetrics, 'id'>): Promise<void> {
    if (!this.client || !this.isInitialized) {
      return;
    }

    try {
      const { error } = await this.client
        .from('autonomous_metrics')
        .insert(metrics);

      if (error && !error.message.includes('does not exist')) {
        console.error('[Trinity Coordinator] ❌ Failed to store metrics:', error);
      }
    } catch (error) {
      // Silent fail for metrics
    }
  }

  /**
   * Create a vote for Trinity consensus
   */
  async createVote(vote: Omit<TrinityVote, 'id' | 'created_at'>): Promise<string | null> {
    if (!this.client || !this.isInitialized) {
      console.log('[Trinity Coordinator] ⚠️  Cannot create vote - not initialized');
      return null;
    }

    try {
      const { data, error } = await this.client
        .from('trinity_votes')
        .insert({
          ...vote,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('[Trinity Coordinator] ❌ Failed to create vote:', error);
        return null;
      }

      console.log('[Trinity Coordinator] ✅ Vote created:', data.id);
      return data.id;
    } catch (error) {
      console.error('[Trinity Coordinator] ❌ Error creating vote:', error);
      return null;
    }
  }

  /**
   * Cast a vote (HyperDAG's vote)
   */
  async castVote(
    voteId: string,
    decision: 'approve' | 'reject' | 'abstain',
    reasoning: string
  ): Promise<void> {
    if (!this.client || !this.isInitialized) {
      return;
    }

    try {
      const { error } = await this.client
        .from('trinity_votes')
        .update({
          hyperdag_vote: decision,
          hyperdag_reasoning: reasoning
        })
        .eq('id', voteId);

      if (error) {
        console.error('[Trinity Coordinator] ❌ Failed to cast vote:', error);
      } else {
        console.log('[Trinity Coordinator] ✅ Vote cast:', decision);
      }
    } catch (error) {
      console.error('[Trinity Coordinator] ❌ Error casting vote:', error);
    }
  }

  /**
   * Update Trinity prompt (for /api/trinity/prompt/update endpoint)
   */
  async updatePrompt(promptText: string, manager: string = 'HyperDAG'): Promise<void> {
    if (!this.client || !this.isInitialized) {
      console.log('[Trinity Coordinator] ⚠️  Cannot update prompt - not initialized');
      return;
    }

    try {
      // Deactivate old prompts
      await this.client
        .from('trinity_prompts')
        .update({ active: false })
        .eq('active', true);

      // Insert new prompt
      const { error } = await this.client
        .from('trinity_prompts')
        .insert({
          prompt_text: promptText,
          version: Date.now(),
          manager,
          created_at: new Date().toISOString(),
          active: true
        });

      if (error) {
        console.error('[Trinity Coordinator] ❌ Failed to update prompt:', error);
      } else {
        console.log('[Trinity Coordinator] ✅ Prompt updated and broadcast to all managers');
      }
    } catch (error) {
      console.error('[Trinity Coordinator] ❌ Error updating prompt:', error);
    }
  }

  /**
   * Get latest active prompt
   */
  async getActivePrompt(): Promise<TrinityPrompt | null> {
    if (!this.client || !this.isInitialized) {
      return null;
    }

    try {
      const { data, error } = await this.client
        .from('trinity_prompts')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        return null;
      }

      return data as TrinityPrompt;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get status
   */
  getStatus(): { initialized: boolean; channelsActive: number } {
    return {
      initialized: this.isInitialized,
      channelsActive: this.channels.size
    };
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    for (const [name, channel] of this.channels) {
      await channel.unsubscribe();
      console.log(`[Trinity Coordinator] 👋 Unsubscribed from ${name}`);
    }
    this.channels.clear();
  }
}

// Export singleton
export const trinityCoordinator = new TrinitySupabaseCoordinator();
