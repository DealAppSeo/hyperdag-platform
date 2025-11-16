/**
 * HyperDAG Client
 * 
 * This client provides frontend access to HyperDAG's services and APIs
 * for Bolt's Ikigai journey, habit tracking, and mentorship features.
 */

import { apiRequest } from './queryClient';

// Types for user data
export interface User {
  id: string;
  username: string;
  email?: string;
  profileImageUrl?: string;
  walletAddress?: string;
  createdAt: string | Date;
}

// Types for Ikigai data
export interface IkigaiProgress {
  userId: string;
  passion: number;
  mission: number;
  vocation: number;
  profession: number;
  ikigaiScore: number;
  lastUpdated: string | Date;
  insights?: string[];
  recommendations?: string[];
  nextSteps?: string[];
}

// Types for habit tracking
export interface Habit {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category: string;
  frequency: string;
  customFrequency?: string;
  timeOfDay?: string;
  reminderEnabled: boolean;
  reminderTime?: string;
  createdAt: string | Date;
  startDate: string | Date;
  endDate?: string | Date;
  isActive: boolean;
  isPrivate: boolean;
  streakCount: number;
  longestStreak: number;
  totalCompletions: number;
  cueAction?: string;
  reward?: string;
  difficulty: string;
  impact: string;
  zkProofId?: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  userId: string;
  completedAt: string | Date;
  notes?: string;
  mood?: string;
  zkProofId?: string;
}

// Types for mentorship
export interface Mentor {
  id: string;
  name: string;
  expertise: string[];
  bio: string;
  availability: string;
  rating: number;
  profileImageUrl?: string;
  verified: boolean;
}

export interface MentorshipSession {
  id: string;
  mentorId: string;
  menteeId: string;
  scheduledAt: string;
  status: string;
  duration: number;
  focus: string[];
  notes?: string;
  rating?: number;
  feedback?: string;
  actionItems?: string[];
  recordingUrl?: string;
  transcriptUrl?: string;
  resourcesShared?: any[];
}

export interface MentorshipGoal {
  id: string;
  userId: string;
  title: string;
  description: string;
  targetDate: string | Date;
  status: string;
  progress: number;
  milestones?: any[];
  relatedMentorSessions?: string[];
}

class HyperDAGClient {
  private apiKey: string | null = null;
  private currentUser: User | null = null;
  
  constructor() {
    // Try to initialize from localStorage if available
    this.loadFromStorage();
  }
  
  private loadFromStorage() {
    try {
      const storedUser = localStorage.getItem('hyperdag_user');
      if (storedUser) {
        this.currentUser = JSON.parse(storedUser);
      }
      
      const storedApiKey = localStorage.getItem('hyperdag_api_key');
      if (storedApiKey) {
        this.apiKey = storedApiKey;
      }
    } catch (error) {
      console.error('Failed to load HyperDAG client data from storage:', error);
    }
  }
  
  private saveToStorage() {
    try {
      if (this.currentUser) {
        localStorage.setItem('hyperdag_user', JSON.stringify(this.currentUser));
      } else {
        localStorage.removeItem('hyperdag_user');
      }
      
      if (this.apiKey) {
        localStorage.setItem('hyperdag_api_key', this.apiKey);
      } else {
        localStorage.removeItem('hyperdag_api_key');
      }
    } catch (error) {
      console.error('Failed to save HyperDAG client data to storage:', error);
    }
  }
  
  /**
   * Check if user is authenticated
   */
  isUserAuthenticated(): boolean {
    return !!this.currentUser;
  }
  
  /**
   * Get current user information
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }
  
  /**
   * Set the API key for HyperDAG services
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    this.saveToStorage();
  }
  
  /**
   * Set user data after authentication
   */
  setUser(user: User): void {
    this.currentUser = user;
    this.saveToStorage();
  }
  
  /**
   * Clear user data and API key
   */
  logout(): void {
    this.currentUser = null;
    this.apiKey = null;
    this.saveToStorage();
  }
  
  /**
   * Get API headers for authorized requests
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (this.apiKey) {
      headers['X-Bolt-API-Key'] = this.apiKey;
    }
    
    return headers;
  }
  
  // ==================== Ikigai Progress Methods ====================
  
  /**
   * Get user's Ikigai progress
   */
  async getIkigaiProgress(): Promise<IkigaiProgress> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch(`/api/bolt/ikigai/progress/${this.currentUser.id}`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch Ikigai progress');
      }
      
      const data = await response.json();
      return data.progress;
    } catch (error) {
      console.error('Ikigai progress fetch error:', error);
      
      // For development, return a default progress object
      return {
        userId: this.currentUser?.id || '',
        passion: 0,
        mission: 0,
        vocation: 0,
        profession: 0,
        ikigaiScore: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }
  
  /**
   * Update user's Ikigai progress
   */
  async updateIkigaiProgress(progress: IkigaiProgress): Promise<boolean> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch(`/api/bolt/ikigai/progress/${this.currentUser.id}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(progress)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update Ikigai progress');
      }
      
      return true;
    } catch (error) {
      console.error('Ikigai progress update error:', error);
      return false;
    }
  }
  
  // ==================== Habit Tracking Methods ====================
  
  /**
   * Get user's habits
   */
  async getHabits(): Promise<Habit[]> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch(`/api/bolt/habits/user/${this.currentUser.id}`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch habits');
      }
      
      const data = await response.json();
      return data.habits;
    } catch (error) {
      console.error('Habits fetch error:', error);
      return [];
    }
  }
  
  /**
   * Create a new habit
   */
  async createHabit(habit: Omit<Habit, 'id'>): Promise<string> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch('/api/bolt/habits', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(habit)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create habit');
      }
      
      const data = await response.json();
      return data.habitId;
    } catch (error) {
      console.error('Habit creation error:', error);
      throw error;
    }
  }
  
  /**
   * Update an existing habit
   */
  async updateHabit(habitId: string, updates: Partial<Habit>): Promise<boolean> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch(`/api/bolt/habits/${habitId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update habit');
      }
      
      return true;
    } catch (error) {
      console.error('Habit update error:', error);
      throw error;
    }
  }
  
  /**
   * Delete a habit
   */
  async deleteHabit(habitId: string): Promise<boolean> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch(`/api/bolt/habits/${habitId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete habit');
      }
      
      return true;
    } catch (error) {
      console.error('Habit deletion error:', error);
      throw error;
    }
  }
  
  /**
   * Get habit completions
   */
  async getHabitCompletions(habitId?: string): Promise<HabitCompletion[]> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const url = habitId 
        ? `/api/bolt/habits/${habitId}/completions` 
        : `/api/bolt/habits/completions/user/${this.currentUser.id}`;
      
      const response = await fetch(url, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch habit completions');
      }
      
      const data = await response.json();
      return data.completions;
    } catch (error) {
      console.error('Habit completions fetch error:', error);
      return [];
    }
  }
  
  /**
   * Complete a habit
   */
  async completeHabit(completion: Omit<HabitCompletion, 'id'>): Promise<string> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch('/api/bolt/habits/complete', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(completion)
      });
      
      if (!response.ok) {
        throw new Error('Failed to complete habit');
      }
      
      const data = await response.json();
      return data.completionId;
    } catch (error) {
      console.error('Habit completion error:', error);
      throw error;
    }
  }
  
  /**
   * Delete a habit completion
   */
  async deleteHabitCompletion(completionId: string): Promise<boolean> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch(`/api/bolt/habits/completions/${completionId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete habit completion');
      }
      
      return true;
    } catch (error) {
      console.error('Habit completion deletion error:', error);
      throw error;
    }
  }
  
  // ==================== Mentorship Methods ====================
  
  /**
   * Get available mentors
   */
  async getMentors(): Promise<Mentor[]> {
    try {
      const response = await fetch('/api/bolt/mentorship/mentors', {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch mentors');
      }
      
      const data = await response.json();
      return data.mentors;
    } catch (error) {
      console.error('Mentors fetch error:', error);
      return [];
    }
  }
  
  /**
   * Get user's mentorship sessions
   */
  async getMentorshipSessions(): Promise<MentorshipSession[]> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch(`/api/bolt/mentorship/sessions/user/${this.currentUser.id}`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch mentorship sessions');
      }
      
      const data = await response.json();
      return data.sessions;
    } catch (error) {
      console.error('Mentorship sessions fetch error:', error);
      return [];
    }
  }
  
  /**
   * Create a new mentorship session
   */
  async createMentorshipSession(session: Omit<MentorshipSession, 'id'>): Promise<MentorshipSession> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch('/api/bolt/mentorship/sessions', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(session)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create mentorship session');
      }
      
      const data = await response.json();
      return data.session;
    } catch (error) {
      console.error('Mentorship session creation error:', error);
      throw error;
    }
  }
  
  /**
   * Get user's mentorship goals
   */
  async getMentorshipGoals(): Promise<MentorshipGoal[]> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch(`/api/bolt/mentorship/goals/user/${this.currentUser.id}`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch mentorship goals');
      }
      
      const data = await response.json();
      return data.goals;
    } catch (error) {
      console.error('Mentorship goals fetch error:', error);
      return [];
    }
  }
  
  /**
   * Create a new mentorship goal
   */
  async createMentorshipGoal(goal: Omit<MentorshipGoal, 'id'>): Promise<string> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch('/api/bolt/mentorship/goals', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(goal)
      });
      
      if (!response.ok) {
        throw new Error('Failed to create mentorship goal');
      }
      
      const data = await response.json();
      return data.goalId;
    } catch (error) {
      console.error('Mentorship goal creation error:', error);
      throw error;
    }
  }
  
  /**
   * Update a mentorship goal
   */
  async updateMentorshipGoal(goalId: string, updates: Partial<MentorshipGoal>): Promise<boolean> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch(`/api/bolt/mentorship/goals/${goalId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update mentorship goal');
      }
      
      return true;
    } catch (error) {
      console.error('Mentorship goal update error:', error);
      throw error;
    }
  }
  
  /**
   * Delete a mentorship goal
   */
  async deleteMentorshipGoal(goalId: string): Promise<boolean> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const response = await fetch(`/api/bolt/mentorship/goals/${goalId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete mentorship goal');
      }
      
      return true;
    } catch (error) {
      console.error('Mentorship goal deletion error:', error);
      throw error;
    }
  }
  
  // ==================== Additional Methods ====================
  
  /**
   * Generate a new API key for Bolt integration
   */
  async generateApiKey(name: string, permissions: string[] = []): Promise<string> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const response = await apiRequest('POST', '/api/bolt/apikey', {
        name,
        permissions
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate API key');
      }
      
      const data = await response.json();
      
      // Automatically set the new API key
      if (data.success && data.apiKey) {
        this.setApiKey(data.apiKey);
      }
      
      return data.apiKey;
    } catch (error) {
      console.error('API key generation error:', error);
      throw error;
    }
  }
  
  /**
   * Get user's API keys
   */
  async getApiKeys(): Promise<any[]> {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const response = await apiRequest('GET', '/api/bolt/apikeys');
      
      if (!response.ok) {
        throw new Error('Failed to fetch API keys');
      }
      
      const data = await response.json();
      return data.apiKeys;
    } catch (error) {
      console.error('API keys fetch error:', error);
      return [];
    }
  }
  
  /**
   * Check health status of HyperDAG services
   */
  async checkHealth(): Promise<any> {
    try {
      const response = await fetch('/api/bolt/health', {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        throw new Error('Failed to check health status');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

// Create and export a singleton instance
const hyperDAGClient = new HyperDAGClient();
export default hyperDAGClient;