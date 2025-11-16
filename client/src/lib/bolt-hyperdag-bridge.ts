/**
 * Bolt-HyperDAG Bridge
 * 
 * This bridge component connects Bolt's frontend applications with HyperDAG's
 * decentralized backend services, providing seamless integration for
 * persistence, privacy, and AI features.
 */

import hyperDAGClient from './hyperdag-client';

// Interface for the bridge configuration
export interface BridgeConfig {
  apiKey?: string;
  enabledServices?: {
    storage?: boolean;
    privacy?: boolean;
    ai?: boolean;
    tokenization?: boolean;
  };
  defaultOptions?: {
    storage?: {
      preferredProvider: 'w3' | 'ipfs';
    };
    privacy?: {
      generateProofs: boolean;
    };
  };
}

// Main bridge class
class BoltHyperDAGBridge {
  private initialized: boolean = false;
  private config: BridgeConfig = {
    enabledServices: {
      storage: true,
      privacy: true,
      ai: true,
      tokenization: true
    },
    defaultOptions: {
      storage: {
        preferredProvider: 'w3'
      },
      privacy: {
        generateProofs: true
      }
    }
  };

  /**
   * Initialize the bridge with configuration
   */
  async initialize(config?: BridgeConfig): Promise<boolean> {
    try {
      console.log('[BoltHyperDAGBridge] Initializing...');
      
      // Merge provided config with defaults
      if (config) {
        this.config = {
          ...this.config,
          ...config,
          enabledServices: {
            ...this.config.enabledServices,
            ...config.enabledServices
          },
          defaultOptions: {
            ...this.config.defaultOptions,
            ...config.defaultOptions,
            storage: {
              ...this.config.defaultOptions?.storage,
              ...config.defaultOptions?.storage
            },
            privacy: {
              ...this.config.defaultOptions?.privacy,
              ...config.defaultOptions?.privacy
            }
          }
        };
      }
      
      // Set API key if provided
      if (this.config.apiKey) {
        hyperDAGClient.setApiKey(this.config.apiKey);
      }
      
      // Check health of HyperDAG services
      try {
        const healthStatus = await hyperDAGClient.checkHealth();
        console.log('[BoltHyperDAGBridge] HyperDAG service health:', healthStatus);
      } catch (error) {
        console.warn('[BoltHyperDAGBridge] Health check failed, continuing anyway:', error);
      }
      
      this.initialized = true;
      console.log('[BoltHyperDAGBridge] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[BoltHyperDAGBridge] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Check if the bridge is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Generate a new API key for Bolt
   */
  async generateApiKey(name: string = 'Bolt Integration'): Promise<string | null> {
    try {
      if (!hyperDAGClient.isUserAuthenticated()) {
        console.error('[BoltHyperDAGBridge] Cannot generate API key: User not authenticated');
        return null;
      }
      
      const apiKey = await hyperDAGClient.generateApiKey(name, ['storage', 'privacy', 'ai', 'tokenization']);
      
      // Update config
      this.config.apiKey = apiKey;
      
      return apiKey;
    } catch (error) {
      console.error('[BoltHyperDAGBridge] Failed to generate API key:', error);
      return null;
    }
  }

  // ==================== IKIGAI METHODS ====================

  /**
   * Get Ikigai progress for current user
   */
  async getIkigaiProgress() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      return await hyperDAGClient.getIkigaiProgress();
    } catch (error) {
      console.error('[BoltHyperDAGBridge] Failed to get Ikigai progress:', error);
      throw error;
    }
  }

  /**
   * Update Ikigai progress
   */
  async updateIkigaiProgress(progress: any) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      return await hyperDAGClient.updateIkigaiProgress(progress);
    } catch (error) {
      console.error('[BoltHyperDAGBridge] Failed to update Ikigai progress:', error);
      throw error;
    }
  }
  
  /**
   * Generate AI insights for Ikigai data
   */
  async generateIkigaiInsights(data: any) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      if (!this.config.enabledServices?.ai) {
        throw new Error('AI service is disabled');
      }
      
      // Call HyperDAG's AI service
      const response = await fetch('/api/bolt/ai/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bolt-API-Key': this.config.apiKey || ''
        },
        body: JSON.stringify({
          data,
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
      return result.insights;
    } catch (error) {
      console.error('[BoltHyperDAGBridge] Failed to generate Ikigai insights:', error);
      
      // Return fallback insights for development
      return {
        insights: [
          'Your Ikigai balance shows stronger passion and profession scores, with room for growth in mission and vocation.',
          'Your purpose alignment is improving but still needs work to reach optimal harmony.',
          'Progress is visible in the profession quadrant over the past month.'
        ],
        recommendations: [
          'Focus on connecting your skills to market needs to improve your vocation score.',
          'Explore ways your passions can address community needs to strengthen your mission score.',
          'Consider how your current work aligns with your personal values.'
        ],
        nextSteps: [
          'Schedule time for reflection on how your work benefits others.',
          'Research emerging needs in fields aligned with your passions.',
          'Connect with mentors who have successfully aligned all four Ikigai elements.'
        ]
      };
    }
  }

  // ==================== HABIT METHODS ====================

  /**
   * Get habits for current user
   */
  async getHabits() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      return await hyperDAGClient.getHabits();
    } catch (error) {
      console.error('[BoltHyperDAGBridge] Failed to get habits:', error);
      throw error;
    }
  }

  /**
   * Create a new habit
   */
  async createHabit(habit: any) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // If privacy is enabled and habit is private, generate a ZKP
      if (this.config.enabledServices?.privacy && habit.isPrivate && this.config.defaultOptions?.privacy?.generateProofs) {
        try {
          const user = hyperDAGClient.getCurrentUser();
          
          if (user) {
            // Generate a privacy proof for this habit
            const zkProofResult = await fetch('/api/bolt/zkp/generate', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Bolt-API-Key': this.config.apiKey || ''
              },
              body: JSON.stringify({
                privateInputs: {
                  userId: user.id,
                  habitData: habit
                },
                publicInputs: {
                  habitCategory: habit.category,
                  habitDifficulty: habit.difficulty
                }
              })
            });
            
            if (zkProofResult.ok) {
              const { proof } = await zkProofResult.json();
              habit.zkProofId = proof.proof;
            }
          }
        } catch (zkpError) {
          console.warn('[BoltHyperDAGBridge] Failed to generate ZKP for habit:', zkpError);
          // Continue without ZKP
        }
      }
      
      return await hyperDAGClient.createHabit(habit);
    } catch (error) {
      console.error('[BoltHyperDAGBridge] Failed to create habit:', error);
      throw error;
    }
  }

  /**
   * Complete a habit
   */
  async completeHabit(habitId: string, details: any = {}) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      const user = hyperDAGClient.getCurrentUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Get the habit data
      const habits = await hyperDAGClient.getHabits();
      const habit = habits.find(h => h.id === habitId);
      
      if (!habit) {
        throw new Error('Habit not found');
      }
      
      // Create completion data
      const completionData = {
        habitId,
        userId: user.id,
        completedAt: new Date().toISOString(),
        ...details
      };
      
      // If it's a private habit, create a ZKP
      if (this.config.enabledServices?.privacy && habit.isPrivate && this.config.defaultOptions?.privacy?.generateProofs) {
        try {
          // Create a ZKP for this completion
          const zkProofResult = await fetch('/api/bolt/zkp/generate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Bolt-API-Key': this.config.apiKey || ''
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
          console.warn('[BoltHyperDAGBridge] Failed to generate ZKP for habit completion:', zkpError);
          // Continue without ZKP
        }
      }
      
      return await hyperDAGClient.completeHabit(completionData);
    } catch (error) {
      console.error('[BoltHyperDAGBridge] Failed to complete habit:', error);
      throw error;
    }
  }

  // ==================== STORAGE METHODS ====================

  /**
   * Store data on HyperDAG's decentralized storage
   */
  async storeData(data: any, path?: string): Promise<{ cid: string; url: string }> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      if (!this.config.enabledServices?.storage) {
        throw new Error('Storage service is disabled');
      }
      
      const provider = this.config.defaultOptions?.storage?.preferredProvider || 'w3';
      const endpoint = `/api/bolt/storage/${provider}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bolt-API-Key': this.config.apiKey || ''
        },
        body: JSON.stringify({
          data,
          path
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to store data using ${provider}`);
      }
      
      const result = await response.json();
      return {
        cid: result.cid,
        url: result.url
      };
    } catch (error) {
      console.error('[BoltHyperDAGBridge] Failed to store data:', error);
      throw error;
    }
  }

  /**
   * Retrieve data from HyperDAG's decentralized storage
   */
  async retrieveData(cid: string, provider?: 'w3' | 'ipfs'): Promise<any> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      if (!this.config.enabledServices?.storage) {
        throw new Error('Storage service is disabled');
      }
      
      const storageProvider = provider || this.config.defaultOptions?.storage?.preferredProvider || 'w3';
      const endpoint = `/api/bolt/storage/${storageProvider}/${cid}`;
      
      const response = await fetch(endpoint, {
        headers: {
          'X-Bolt-API-Key': this.config.apiKey || ''
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to retrieve data using ${storageProvider}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('[BoltHyperDAGBridge] Failed to retrieve data:', error);
      throw error;
    }
  }

  // ==================== MENTORSHIP METHODS ====================

  /**
   * Get available mentors
   */
  async getMentors() {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      return await hyperDAGClient.getMentors();
    } catch (error) {
      console.error('[BoltHyperDAGBridge] Failed to get mentors:', error);
      throw error;
    }
  }

  /**
   * Book a mentorship session
   */
  async bookMentorshipSession(mentorId: string, details: any) {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      const user = hyperDAGClient.getCurrentUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const sessionData = {
        mentorId,
        menteeId: user.id,
        status: 'scheduled',
        ...details
      };
      
      return await hyperDAGClient.createMentorshipSession(sessionData);
    } catch (error) {
      console.error('[BoltHyperDAGBridge] Failed to book mentorship session:', error);
      throw error;
    }
  }

  // ==================== TOKEN METHODS ====================

  /**
   * Mint an SBT (Soulbound Token) for an achievement
   */
  async mintAchievementSBT(achievement: any): Promise<string | null> {
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      if (!this.config.enabledServices?.tokenization) {
        throw new Error('Tokenization service is disabled');
      }
      
      const user = hyperDAGClient.getCurrentUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      if (!user.walletAddress) {
        console.warn('[BoltHyperDAGBridge] User has no wallet address, skipping SBT minting');
        return null;
      }
      
      // Prepare metadata
      const metadata = {
        name: `Achievement: ${achievement.title}`,
        description: achievement.description,
        image: achievement.imageUrl || 'https://hyperdag.org/assets/achievements/default.png',
        attributes: [
          { trait_type: 'Achievement Type', value: achievement.type },
          { trait_type: 'Date Earned', value: new Date().toISOString() },
          { trait_type: 'Rarity', value: achievement.rarity || 'Common' }
        ],
        properties: {
          userId: user.id,
          achievementId: achievement.id
        }
      };
      
      // Call token service to mint an SBT
      const response = await fetch('/api/bolt/token/mint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Bolt-API-Key': this.config.apiKey || ''
        },
        body: JSON.stringify({
          tokenType: 'sbt',
          recipient: user.walletAddress,
          metadata,
          options: {
            chain: 'polygon' // Using polygon for lower gas fees
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to mint achievement SBT');
      }
      
      const result = await response.json();
      return result.token.tokenId;
    } catch (error) {
      console.error('[BoltHyperDAGBridge] Failed to mint achievement SBT:', error);
      return null;
    }
  }
}

// Create and export a singleton instance
const boltHyperDAGBridge = new BoltHyperDAGBridge();
export default boltHyperDAGBridge;