/**
 * Mentorship Store
 * 
 * This store manages mentorship data including sessions, connections, and notes
 * with synchronization to HyperDAG's backend services.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import hyperDAGClient from '../lib/hyperdag-client';

export interface Mentor {
  id: string;
  name: string;
  expertise: string[];
  bio: string;
  availability: 'high' | 'medium' | 'low';
  rating: number;
  profileImageUrl?: string;
  verified: boolean;
  sessions?: MentorshipSession[];
}

export interface MentorshipSession {
  id: string;
  mentorId: string;
  menteeId: string;
  scheduledAt: string | Date;
  status: 'scheduled' | 'completed' | 'cancelled';
  duration: number; // in minutes
  focus: string[];
  notes?: string;
  rating?: number;
  feedback?: string;
  actionItems?: string[];
  recordingUrl?: string;
  transcriptUrl?: string;
  resourcesShared?: {
    title: string;
    url: string;
    type: 'article' | 'video' | 'book' | 'tool' | 'other';
  }[];
}

export interface MentorshipGoal {
  id: string;
  userId: string;
  title: string;
  description: string;
  targetDate: string | Date;
  status: 'active' | 'completed' | 'abandoned';
  progress: number; // 0-100
  milestones?: {
    id: string;
    title: string;
    completed: boolean;
    completedAt?: string | Date;
  }[];
  relatedMentorSessions?: string[]; // Session IDs
}

interface MentorshipState {
  // Data
  mentors: Mentor[];
  sessions: MentorshipSession[];
  goals: MentorshipGoal[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchMentors: () => Promise<void>;
  fetchSessions: () => Promise<void>;
  fetchGoals: () => Promise<void>;
  bookSession: (mentorId: string, details: Partial<MentorshipSession>) => Promise<string>;
  updateSession: (sessionId: string, updates: Partial<MentorshipSession>) => Promise<void>;
  cancelSession: (sessionId: string, reason?: string) => Promise<void>;
  addGoal: (goal: Omit<MentorshipGoal, 'id'>) => Promise<string>;
  updateGoal: (goalId: string, updates: Partial<MentorshipGoal>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
}

export const useMentorshipStore = create<MentorshipState>()(
  persist(
    (set, get) => ({
      mentors: [],
      sessions: [],
      goals: [],
      isLoading: false,
      error: null,
      
      // Fetch mentors from HyperDAG
      fetchMentors: async () => {
        if (!hyperDAGClient.isUserAuthenticated()) {
          set({ error: 'User not authenticated' });
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const mentors = await hyperDAGClient.getMentors();
          set({ mentors, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch mentors:', error);
          set({ 
            isLoading: false, 
            error: 'Failed to fetch mentors. Please try again later.'
          });
        }
      },
      
      // Fetch mentorship sessions from HyperDAG
      fetchSessions: async () => {
        if (!hyperDAGClient.isUserAuthenticated()) {
          set({ error: 'User not authenticated' });
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const sessions = await hyperDAGClient.getMentorshipSessions();
          set({ sessions, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch mentorship sessions:', error);
          set({ 
            isLoading: false, 
            error: 'Failed to fetch mentorship sessions. Please try again later.'
          });
        }
      },
      
      // Fetch mentorship goals from HyperDAG
      fetchGoals: async () => {
        if (!hyperDAGClient.isUserAuthenticated()) {
          set({ error: 'User not authenticated' });
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const goals = await hyperDAGClient.getMentorshipGoals();
          set({ goals, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch mentorship goals:', error);
          set({ 
            isLoading: false, 
            error: 'Failed to fetch mentorship goals. Please try again later.'
          });
        }
      },
      
      // Book a new mentorship session
      bookSession: async (mentorId, details) => {
        if (!hyperDAGClient.isUserAuthenticated()) {
          set({ error: 'User not authenticated' });
          return '';
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const user = hyperDAGClient.getCurrentUser();
          
          if (!user) {
            throw new Error('User information not available');
          }
          
          const sessionData = {
            mentorId,
            menteeId: user.id,
            status: 'scheduled',
            ...details
          };
          
          // Create the session
          const sessionId = await hyperDAGClient.createMentorshipSession(sessionData as any);
          
          // Fetch updated sessions
          await get().fetchSessions();
          
          set({ isLoading: false });
          return sessionId;
        } catch (error) {
          console.error('Failed to book mentorship session:', error);
          set({ 
            isLoading: false, 
            error: 'Failed to book mentorship session. Please try again later.'
          });
          return '';
        }
      },
      
      // Update an existing mentorship session
      updateSession: async (sessionId, updates) => {
        if (!hyperDAGClient.isUserAuthenticated()) {
          set({ error: 'User not authenticated' });
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          await hyperDAGClient.updateMentorshipSession(sessionId, updates);
          
          // Update local state
          const sessions = get().sessions.map(session => 
            session.id === sessionId ? { ...session, ...updates } : session
          );
          
          set({ sessions, isLoading: false });
        } catch (error) {
          console.error('Failed to update mentorship session:', error);
          set({ 
            isLoading: false, 
            error: 'Failed to update mentorship session. Please try again later.'
          });
        }
      },
      
      // Cancel a mentorship session
      cancelSession: async (sessionId, reason) => {
        if (!hyperDAGClient.isUserAuthenticated()) {
          set({ error: 'User not authenticated' });
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          await hyperDAGClient.updateMentorshipSession(sessionId, { 
            status: 'cancelled',
            notes: reason ? `Cancelled: ${reason}` : 'Cancelled by user'
          });
          
          // Update local state
          const sessions = get().sessions.map(session => 
            session.id === sessionId 
              ? { 
                  ...session, 
                  status: 'cancelled',
                  notes: reason ? `Cancelled: ${reason}` : 'Cancelled by user'
                } 
              : session
          );
          
          set({ sessions, isLoading: false });
        } catch (error) {
          console.error('Failed to cancel mentorship session:', error);
          set({ 
            isLoading: false, 
            error: 'Failed to cancel mentorship session. Please try again later.'
          });
        }
      },
      
      // Add a new mentorship goal
      addGoal: async (goalData) => {
        if (!hyperDAGClient.isUserAuthenticated()) {
          set({ error: 'User not authenticated' });
          return '';
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const user = hyperDAGClient.getCurrentUser();
          
          if (!user) {
            throw new Error('User information not available');
          }
          
          const fullGoalData = {
            ...goalData,
            userId: user.id,
            status: 'active',
            progress: 0
          };
          
          // Create the goal
          const goalId = await hyperDAGClient.createMentorshipGoal(fullGoalData as any);
          
          // Fetch updated goals
          await get().fetchGoals();
          
          set({ isLoading: false });
          return goalId;
        } catch (error) {
          console.error('Failed to add mentorship goal:', error);
          set({ 
            isLoading: false, 
            error: 'Failed to add mentorship goal. Please try again later.'
          });
          return '';
        }
      },
      
      // Update an existing mentorship goal
      updateGoal: async (goalId, updates) => {
        if (!hyperDAGClient.isUserAuthenticated()) {
          set({ error: 'User not authenticated' });
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          await hyperDAGClient.updateMentorshipGoal(goalId, updates);
          
          // Update local state
          const goals = get().goals.map(goal => 
            goal.id === goalId ? { ...goal, ...updates } : goal
          );
          
          set({ goals, isLoading: false });
        } catch (error) {
          console.error('Failed to update mentorship goal:', error);
          set({ 
            isLoading: false, 
            error: 'Failed to update mentorship goal. Please try again later.'
          });
        }
      },
      
      // Delete a mentorship goal
      deleteGoal: async (goalId) => {
        if (!hyperDAGClient.isUserAuthenticated()) {
          set({ error: 'User not authenticated' });
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          await hyperDAGClient.deleteMentorshipGoal(goalId);
          
          // Update local state
          const goals = get().goals.filter(goal => goal.id !== goalId);
          
          set({ goals, isLoading: false });
        } catch (error) {
          console.error('Failed to delete mentorship goal:', error);
          set({ 
            isLoading: false, 
            error: 'Failed to delete mentorship goal. Please try again later.'
          });
        }
      }
    }),
    {
      name: 'bolt-mentorship-storage',
      partialize: (state) => ({ 
        // Only persist the data, not the loading state or error
        mentors: state.mentors,
        sessions: state.sessions,
        goals: state.goals
      })
    }
  )
);

export default useMentorshipStore;