/**
 * Habits Store
 * 
 * This store manages the user's habits and their tracking data,
 * synchronized with HyperDAG's backend for decentralized storage.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import hyperDAGClient from '../lib/hyperdag-client';

export interface Habit {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: 'health' | 'productivity' | 'learning' | 'mindfulness' | 'creativity' | 'relationships' | 'other';
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  customFrequency?: string; // e.g., "3,5,7" for Monday, Wednesday, Friday
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'anytime';
  reminderEnabled: boolean;
  reminderTime?: string; // HH:MM format
  createdAt: string | Date;
  startDate: string | Date;
  endDate?: string | Date;
  isActive: boolean;
  isPrivate: boolean; // If true, this habit is protected by ZKP
  streakCount: number;
  longestStreak: number;
  totalCompletions: number;
  cueAction?: string;
  reward?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  impact: 'low' | 'medium' | 'high';
  zkProofId?: string; // ID of ZKP for private habits
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  userId: string;
  completedAt: string | Date;
  notes?: string;
  mood?: 'great' | 'good' | 'neutral' | 'difficult';
  zkProofId?: string; // ID of ZKP for private habit completions
}

export interface HabitStats {
  habitId: string;
  streak: number;
  consistency: number; // 0-100%
  lastWeek: number; // completions
  lastMonth: number; // completions
  averageInterval: number; // in days
  bestTimeOfDay?: 'morning' | 'afternoon' | 'evening';
  improvementRate?: number; // rate of improvement over time
}

interface HabitsState {
  // Data
  habits: Habit[];
  completions: HabitCompletion[];
  stats: Record<string, HabitStats>;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchHabits: () => Promise<void>;
  fetchCompletions: (habitId?: string) => Promise<void>;
  calculateStats: (habitId?: string) => Promise<void>;
  addHabit: (habit: Omit<Habit, 'id' | 'userId' | 'createdAt' | 'streakCount' | 'longestStreak' | 'totalCompletions'>) => Promise<string>;
  updateHabit: (habitId: string, updates: Partial<Habit>) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  completeHabit: (habitId: string, details?: Partial<HabitCompletion>) => Promise<void>;
  undoCompletion: (completionId: string) => Promise<void>;
  togglePrivacy: (habitId: string, isPrivate: boolean) => Promise<void>;
}

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set, get) => ({
      habits: [],
      completions: [],
      stats: {},
      isLoading: false,
      error: null,
      
      // Fetch habits from HyperDAG
      fetchHabits: async () => {
        if (!hyperDAGClient.isUserAuthenticated()) {
          set({ error: 'User not authenticated' });
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const habits = await hyperDAGClient.getHabits();
          set({ habits, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch habits:', error);
          set({ 
            isLoading: false, 
            error: 'Failed to fetch habits. Please try again later.'
          });
        }
      },
      
      // Fetch habit completions
      fetchCompletions: async (habitId) => {
        if (!hyperDAGClient.isUserAuthenticated()) {
          set({ error: 'User not authenticated' });
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const completions = await hyperDAGClient.getHabitCompletions(habitId);
          set({ completions, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch habit completions:', error);
          set({ 
            isLoading: false, 
            error: 'Failed to fetch habit completions. Please try again later.'
          });
        }
      },
      
      // Calculate habit statistics
      calculateStats: async (habitId) => {
        const { habits, completions } = get();
        
        if (habits.length === 0) {
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          // If a specific habit ID is provided, only calculate stats for that habit
          const habitsToProcess = habitId 
            ? habits.filter(h => h.id === habitId) 
            : habits;
          
          const newStats: Record<string, HabitStats> = {};
          
          for (const habit of habitsToProcess) {
            const habitCompletions = completions.filter(c => c.habitId === habit.id);
            
            // Sort completions by date
            habitCompletions.sort((a, b) => {
              return new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime();
            });
            
            // Calculate basic stats
            const lastWeek = habitCompletions.filter(c => {
              const completedDate = new Date(c.completedAt);
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return completedDate >= weekAgo;
            }).length;
            
            const lastMonth = habitCompletions.filter(c => {
              const completedDate = new Date(c.completedAt);
              const monthAgo = new Date();
              monthAgo.setDate(monthAgo.getDate() - 30);
              return completedDate >= monthAgo;
            }).length;
            
            // Calculate consistency based on expected vs. actual completions
            const startDate = new Date(habit.startDate);
            const today = new Date();
            const daysSinceStart = Math.max(1, Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
            
            let expectedCompletions = 0;
            switch (habit.frequency) {
              case 'daily':
                expectedCompletions = daysSinceStart;
                break;
              case 'weekly':
                expectedCompletions = Math.floor(daysSinceStart / 7);
                break;
              case 'monthly':
                expectedCompletions = Math.floor(daysSinceStart / 30);
                break;
              // Handle custom frequency calculations
              case 'custom':
                if (habit.customFrequency) {
                  const daysPerWeek = habit.customFrequency.split(',').length;
                  expectedCompletions = Math.floor(daysSinceStart * (daysPerWeek / 7));
                }
                break;
            }
            
            // Calculate actual completions and consistency
            const totalCompletions = habitCompletions.length;
            const consistency = expectedCompletions > 0 
              ? Math.min(100, Math.round((totalCompletions / expectedCompletions) * 100)) 
              : 0;
            
            // Determine best time of day
            const timeStats = {
              morning: 0,
              afternoon: 0,
              evening: 0
            };
            
            habitCompletions.forEach(c => {
              const date = new Date(c.completedAt);
              const hour = date.getHours();
              
              if (hour >= 5 && hour < 12) {
                timeStats.morning++;
              } else if (hour >= 12 && hour < 18) {
                timeStats.afternoon++;
              } else {
                timeStats.evening++;
              }
            });
            
            const bestTimeOfDay = Object.entries(timeStats).reduce((best, [time, count]) => {
              return count > best.count ? { time: time as 'morning' | 'afternoon' | 'evening', count } : best;
            }, { time: 'anytime' as 'morning' | 'afternoon' | 'evening', count: 0 }).time;
            
            // Store calculated stats
            newStats[habit.id] = {
              habitId: habit.id,
              streak: habit.streakCount,
              consistency,
              lastWeek,
              lastMonth,
              averageInterval: totalCompletions > 1 ? daysSinceStart / totalCompletions : daysSinceStart,
              bestTimeOfDay: totalCompletions > 0 ? bestTimeOfDay : undefined,
              improvementRate: undefined // To be implemented
            };
          }
          
          // Update the stats in state
          set({ 
            stats: { ...get().stats, ...newStats },
            isLoading: false 
          });
        } catch (error) {
          console.error('Failed to calculate habit stats:', error);
          set({ 
            isLoading: false, 
            error: 'Failed to calculate habit statistics'
          });
        }
      },
      
      // Add a new habit
      addHabit: async (habitData) => {
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
          
          const newHabit = {
            ...habitData,
            userId: user.id,
            createdAt: new Date().toISOString(),
            streakCount: 0,
            longestStreak: 0,
            totalCompletions: 0
          };
          
          // Create habit in HyperDAG
          const habitId = await hyperDAGClient.createHabit(newHabit as any);
          
          // Update local state
          const habits = [...get().habits, { ...newHabit, id: habitId }];
          
          set({ habits, isLoading: false });
          return habitId;
        } catch (error) {
          console.error('Failed to add habit:', error);
          set({ 
            isLoading: false, 
            error: 'Failed to add habit. Please try again later.'
          });
          return '';
        }
      },
      
      // Update an existing habit
      updateHabit: async (habitId, updates) => {
        if (!hyperDAGClient.isUserAuthenticated()) {
          set({ error: 'User not authenticated' });
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          await hyperDAGClient.updateHabit(habitId, updates);
          
          // Update local state
          const habits = get().habits.map(habit => 
            habit.id === habitId ? { ...habit, ...updates } : habit
          );
          
          set({ habits, isLoading: false });
        } catch (error) {
          console.error('Failed to update habit:', error);
          set({ 
            isLoading: false, 
            error: 'Failed to update habit. Please try again later.'
          });
        }
      },
      
      // Delete a habit
      deleteHabit: async (habitId) => {
        if (!hyperDAGClient.isUserAuthenticated()) {
          set({ error: 'User not authenticated' });
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          await hyperDAGClient.deleteHabit(habitId);
          
          // Update local state
          const habits = get().habits.filter(habit => habit.id !== habitId);
          const completions = get().completions.filter(completion => completion.habitId !== habitId);
          
          const stats = { ...get().stats };
          delete stats[habitId];
          
          set({ habits, completions, stats, isLoading: false });
        } catch (error) {
          console.error('Failed to delete habit:', error);
          set({ 
            isLoading: false, 
            error: 'Failed to delete habit. Please try again later.'
          });
        }
      },
      
      // Complete a habit
      completeHabit: async (habitId, details = {}) => {
        if (!hyperDAGClient.isUserAuthenticated()) {
          set({ error: 'User not authenticated' });
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const user = hyperDAGClient.getCurrentUser();
          
          if (!user) {
            throw new Error('User information not available');
          }
          
          const habit = get().habits.find(h => h.id === habitId);
          
          if (!habit) {
            throw new Error('Habit not found');
          }
          
          // Create completion
          const completionData = {
            habitId,
            userId: user.id,
            completedAt: new Date().toISOString(),
            ...details
          };
          
          // If it's a private habit, create a ZKP
          if (habit.isPrivate) {
            try {
              // Create a ZKP for this completion via HyperDAG's ZKP service
              const zkProofResult = await fetch('/api/bolt/zkp/generate', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Bolt-API-Key': import.meta.env.VITE_BOLT_API_KEY || ''
                },
                body: JSON.stringify({
                  privateInputs: {
                    userId: user.id,
                    habitId,
                    timestamp: new Date().getTime()
                  },
                  publicInputs: {
                    habitCategory: habit.category,
                    isCompleted: true
                  }
                })
              });
              
              if (zkProofResult.ok) {
                const { proof } = await zkProofResult.json();
                completionData.zkProofId = proof.proof;
              }
            } catch (zkpError) {
              console.error('Failed to generate ZKP for habit completion:', zkpError);
              // Continue without ZKP
            }
          }
          
          const completionId = await hyperDAGClient.completeHabit(completionData as any);
          
          // Update local state with new completion
          const newCompletion = { ...completionData, id: completionId };
          const completions = [...get().completions, newCompletion];
          
          // Update habit stats
          const updatedHabit = {
            ...habit,
            streakCount: habit.streakCount + 1,
            longestStreak: Math.max(habit.longestStreak, habit.streakCount + 1),
            totalCompletions: habit.totalCompletions + 1
          };
          
          const habits = get().habits.map(h => 
            h.id === habitId ? updatedHabit : h
          );
          
          set({ habits, completions, isLoading: false });
          
          // Recalculate stats for this habit
          await get().calculateStats(habitId);
        } catch (error) {
          console.error('Failed to complete habit:', error);
          set({ 
            isLoading: false, 
            error: 'Failed to mark habit as completed. Please try again later.'
          });
        }
      },
      
      // Undo habit completion
      undoCompletion: async (completionId) => {
        if (!hyperDAGClient.isUserAuthenticated()) {
          set({ error: 'User not authenticated' });
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const completion = get().completions.find(c => c.id === completionId);
          
          if (!completion) {
            throw new Error('Completion not found');
          }
          
          // Delete the completion
          await hyperDAGClient.deleteHabitCompletion(completionId);
          
          // Update local state
          const completions = get().completions.filter(c => c.id !== completionId);
          
          // Update habit stats
          const habit = get().habits.find(h => h.id === completion.habitId);
          
          if (habit) {
            const updatedHabit = {
              ...habit,
              streakCount: Math.max(0, habit.streakCount - 1),
              totalCompletions: Math.max(0, habit.totalCompletions - 1)
            };
            
            const habits = get().habits.map(h => 
              h.id === habit.id ? updatedHabit : h
            );
            
            set({ habits, completions, isLoading: false });
            
            // Recalculate stats for this habit
            await get().calculateStats(habit.id);
          } else {
            set({ completions, isLoading: false });
          }
        } catch (error) {
          console.error('Failed to undo habit completion:', error);
          set({ 
            isLoading: false, 
            error: 'Failed to undo habit completion. Please try again later.'
          });
        }
      },
      
      // Toggle privacy settings for a habit (enabling/disabling ZKP)
      togglePrivacy: async (habitId, isPrivate) => {
        if (!hyperDAGClient.isUserAuthenticated()) {
          set({ error: 'User not authenticated' });
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          // Update in HyperDAG
          await hyperDAGClient.updateHabit(habitId, { isPrivate });
          
          // Update local state
          const habits = get().habits.map(habit => 
            habit.id === habitId ? { ...habit, isPrivate } : habit
          );
          
          // If making private, we need to generate a ZKP for existing completions
          if (isPrivate) {
            const user = hyperDAGClient.getCurrentUser();
            const completions = get().completions.filter(c => c.habitId === habitId && !c.zkProofId);
            
            // For development, just update the local state without actual ZKP generation
            const updatedCompletions = get().completions.map(completion => {
              if (completion.habitId === habitId && !completion.zkProofId) {
                return {
                  ...completion,
                  zkProofId: `mock-zkp-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`
                };
              }
              return completion;
            });
            
            set({ habits, completions: updatedCompletions, isLoading: false });
          } else {
            set({ habits, isLoading: false });
          }
        } catch (error) {
          console.error('Failed to toggle habit privacy:', error);
          set({ 
            isLoading: false, 
            error: 'Failed to update habit privacy settings. Please try again later.'
          });
        }
      }
    }),
    {
      name: 'bolt-habits-storage',
      partialize: (state) => ({ 
        habits: state.habits,
        completions: state.completions,
        stats: state.stats
      })
    }
  )
);

export default useHabitsStore;