/**
 * Ikigai Progress Store
 * 
 * This store manages the user's Ikigai journey progress, tracking the four key components:
 * - Passion (What you love)
 * - Mission (What the world needs)
 * - Vocation (What you can be paid for)
 * - Profession (What you're good at)
 * 
 * And provides methods to update and sync with HyperDAG's backend.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import hyperDAGClient from '../lib/hyperdag-client';

export interface IkigaiProgress {
  userId: string;
  passion: number; // 0-100 score for "What you love"
  mission: number; // 0-100 score for "What the world needs" 
  vocation: number; // 0-100 score for "What you can be paid for"
  profession: number; // 0-100 score for "What you're good at"
  ikigaiScore: number; // Overall balance score (calculated)
  lastUpdated: string | Date;
  insights?: string[]; // AI-generated insights about balance
  recommendations?: string[]; // AI-generated recommendations for improvement
  nextSteps?: string[]; // Suggested activities to improve balance
}

interface IkigaiState {
  // Progress data
  progress: IkigaiProgress | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchProgress: () => Promise<void>;
  updateComponent: (component: 'passion' | 'mission' | 'vocation' | 'profession', value: number) => Promise<void>;
  resetProgress: () => void;
  generateInsights: () => Promise<void>;
}

// Calculate overall Ikigai score based on balance across components
function calculateIkigaiScore(progress: Partial<IkigaiProgress>): number {
  if (!progress.passion || !progress.mission || !progress.vocation || !progress.profession) {
    return 0;
  }
  
  // Balance is key to Ikigai - we want all components to be relatively equal
  const scores = [progress.passion, progress.mission, progress.vocation, progress.profession];
  const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  
  // Calculate how balanced the scores are (lower variance = better balance)
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
  const balance = Math.max(0, 100 - Math.sqrt(variance));
  
  // Overall score is average of all components multiplied by balance factor
  const rawScore = avg * (balance / 100);
  
  // Return rounded score
  return Math.round(rawScore);
}

// Create the Ikigai store with persistence
export const useIkigaiStore = create<IkigaiState>()(
  persist(
    (set, get) => ({
      progress: null,
      isLoading: false,
      error: null,
      
      // Fetch progress from HyperDAG
      fetchProgress: async () => {
        if (!hyperDAGClient.isUserAuthenticated()) {
          set({ error: 'User not authenticated' });
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          const progress = await hyperDAGClient.getIkigaiProgress();
          set({ progress, isLoading: false });
        } catch (error) {
          console.error('Failed to fetch Ikigai progress:', error);
          
          // If we can't get data, initialize with default values
          const userId = hyperDAGClient.getCurrentUser()?.id;
          
          if (userId) {
            set({ 
              progress: {
                userId,
                passion: 0,
                mission: 0,
                vocation: 0, 
                profession: 0,
                ikigaiScore: 0,
                lastUpdated: new Date().toISOString()
              },
              isLoading: false,
              error: 'Failed to fetch progress. Starting fresh.'
            });
          } else {
            set({ 
              isLoading: false, 
              error: 'Failed to fetch Ikigai progress. Please try again later.'
            });
          }
        }
      },
      
      // Update a specific Ikigai component
      updateComponent: async (component, value) => {
        const { progress } = get();
        
        if (!progress) {
          set({ error: 'No progress data to update' });
          return;
        }
        
        // Create updated progress
        const updatedProgress = {
          ...progress,
          [component]: value,
          lastUpdated: new Date().toISOString()
        };
        
        // Calculate new overall score
        updatedProgress.ikigaiScore = calculateIkigaiScore(updatedProgress);
        
        // Update local state immediately for responsive UI
        set({ progress: updatedProgress, isLoading: true, error: null });
        
        // Save to HyperDAG
        try {
          await hyperDAGClient.updateIkigaiProgress(updatedProgress);
          set({ isLoading: false });
        } catch (error) {
          console.error(`Failed to update ${component}:`, error);
          set({ 
            isLoading: false, 
            error: `Failed to update ${component}. Changes saved locally only.`
          });
        }
      },
      
      // Reset progress
      resetProgress: () => {
        set({ 
          progress: null, 
          error: null 
        });
      },
      
      // Generate AI insights based on current progress
      generateInsights: async () => {
        const { progress } = get();
        
        if (!progress) {
          set({ error: 'No progress data available for insights' });
          return;
        }
        
        set({ isLoading: true, error: null });
        
        try {
          // Call HyperDAG's AI service for insights
          const response = await fetch('/api/bolt/ai/insights', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Bolt-API-Key': import.meta.env.VITE_BOLT_API_KEY || ''
            },
            body: JSON.stringify({
              data: progress,
              type: 'ikigai',
              options: {
                includeRecommendations: true,
                includeNextSteps: true
              }
            })
          });
          
          if (!response.ok) {
            throw new Error('Failed to generate insights');
          }
          
          const result = await response.json();
          
          // Update progress with new insights
          const updatedProgress = {
            ...progress,
            insights: result.insights.insights || [],
            recommendations: result.insights.recommendations || [],
            nextSteps: result.insights.nextSteps || []
          };
          
          set({ progress: updatedProgress, isLoading: false });
        } catch (error) {
          console.error('Failed to generate insights:', error);
          set({ 
            isLoading: false, 
            error: 'Failed to generate insights. Please try again later.'
          });
        }
      }
    }),
    {
      name: 'bolt-ikigai-storage',
      partialize: (state) => ({ progress: state.progress })
    }
  )
);

export default useIkigaiStore;