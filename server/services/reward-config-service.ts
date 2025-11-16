/**
 * Reward Configuration Service
 * 
 * Allows users to design flexible reward mechanisms for grant success:
 * - Token rewards (HDAG, FET, ETH, SOL, custom tokens)
 * - Nonprofit donations 
 * - Custom reward structures
 */

export interface RewardConfig {
  type: 'HDAG' | 'FET' | 'ETH' | 'SOL' | 'nonprofit_donation' | 'custom';
  amount: number;
  nonprofitId?: number;
  customToken?: string;
  description: string;
  conditions?: {
    minimumGrantAmount?: number;
    requiredMatchScore?: number;
    successRateThreshold?: number;
  };
}

export interface PricingStructure {
  type: 'one_time' | 'monthly' | 'per_use';
  pricing: 'static' | 'range';
  staticAmount?: number;
  rangeMin?: number;
  rangeMax?: number;
  currency: 'USD' | 'HDAG' | 'FET' | 'ETH' | 'SOL';
  description: string;
}

export interface ServiceOffering {
  id: string;
  userId: number;
  title: string;
  description: string;
  category: 'ai_analysis' | 'grant_writing' | 'project_review' | 'consultation' | 'custom';
  pricing: PricingStructure;
  isActive: boolean;
  deliveryTime: number; // in days
}

export interface UserRewardPreferences {
  userId: number;
  defaultRewardType: string;
  rewardConfigs: RewardConfig[];
  nonprofitPreferences?: number[];
  serviceOfferings?: ServiceOffering[];
}

export class RewardConfigService {
  private userPreferences = new Map<number, UserRewardPreferences>();
  private serviceOfferings = new Map<string, ServiceOffering>();

  /**
   * Set user's reward preferences
   */
  setUserRewardPreferences(userId: number, preferences: Partial<UserRewardPreferences>): UserRewardPreferences {
    const current = this.userPreferences.get(userId) || {
      userId,
      defaultRewardType: 'HDAG',
      rewardConfigs: [],
      serviceOfferings: []
    };

    const updated = { ...current, ...preferences };
    this.userPreferences.set(userId, updated);
    return updated;
  }

  /**
   * Create a new service offering for monetization
   */
  createServiceOffering(userId: number, offering: Omit<ServiceOffering, 'id' | 'userId'>): ServiceOffering {
    const id = `service_${userId}_${Date.now()}`;
    const newOffering: ServiceOffering = {
      ...offering,
      id,
      userId,
    };

    this.serviceOfferings.set(id, newOffering);
    
    // Add to user's preferences
    const preferences = this.getUserRewardPreferences(userId);
    preferences.serviceOfferings = preferences.serviceOfferings || [];
    preferences.serviceOfferings.push(newOffering);
    this.setUserRewardPreferences(userId, preferences);

    return newOffering;
  }

  /**
   * Get all active service offerings from all users
   */
  getAllServiceOfferings(): ServiceOffering[] {
    return Array.from(this.serviceOfferings.values()).filter(offering => offering.isActive);
  }

  /**
   * Get service offerings by category
   */
  getServiceOfferingsByCategory(category: string): ServiceOffering[] {
    return this.getAllServiceOfferings().filter(offering => offering.category === category);
  }

  /**
   * Get user's service offerings
   */
  getUserServiceOfferings(userId: number): ServiceOffering[] {
    return Array.from(this.serviceOfferings.values()).filter(offering => offering.userId === userId);
  }

  /**
   * Update service offering
   */
  updateServiceOffering(offeringId: string, updates: Partial<ServiceOffering>): ServiceOffering | null {
    const existing = this.serviceOfferings.get(offeringId);
    if (!existing) return null;

    const updated = { ...existing, ...updates };
    this.serviceOfferings.set(offeringId, updated);
    return updated;
  }

  /**
   * Calculate pricing for a service offering
   */
  calculateServicePrice(offeringId: string, customAmount?: number): number {
    const offering = this.serviceOfferings.get(offeringId);
    if (!offering) return 0;

    const { pricing } = offering;
    
    if (pricing.pricing === 'static' && pricing.staticAmount) {
      return pricing.staticAmount;
    }
    
    if (pricing.pricing === 'range') {
      if (customAmount && pricing.rangeMin && pricing.rangeMax) {
        return Math.max(pricing.rangeMin, Math.min(customAmount, pricing.rangeMax));
      }
      return pricing.rangeMin || 0;
    }
    
    return 0;
  }

  /**
   * Get user's reward preferences
   */
  getUserRewardPreferences(userId: number): UserRewardPreferences {
    return this.userPreferences.get(userId) || {
      userId,
      defaultRewardType: 'HDAG',
      rewardConfigs: this.getDefaultRewardConfigs()
    };
  }

  /**
   * Calculate reward based on user preferences and grant details
   */
  calculateReward(userId: number, grantAmount: number, matchScore: number): RewardConfig {
    const preferences = this.getUserRewardPreferences(userId);
    const basePercentage = 0.01 + (matchScore / 100) * 0.04;
    const baseAmount = Math.floor(grantAmount * basePercentage);

    // Find matching reward config or use default
    const config = preferences.rewardConfigs.find(config => 
      this.meetsConditions(config, grantAmount, matchScore)
    ) || this.getDefaultRewardConfig(preferences.defaultRewardType, baseAmount);

    return {
      ...config,
      amount: this.calculateRewardAmount(config, baseAmount, grantAmount)
    };
  }

  /**
   * Get available nonprofits on the platform
   */
  getAvailableNonprofits() {
    return [
      { id: 1, name: 'Code.org', focus: 'Computer Science Education', referralCode: '836277C0' },
      { id: 2, name: 'Girls Who Code', focus: 'Women in Technology' },
      { id: 3, name: 'Black Girls CODE', focus: 'Diversity in Tech' },
      { id: 4, name: 'DonorsChoose', focus: 'Education Technology' },
      { id: 5, name: 'Khan Academy', focus: 'Free Education for All' }
    ];
  }

  /**
   * Check if reward config conditions are met
   */
  private meetsConditions(config: RewardConfig, grantAmount: number, matchScore: number): boolean {
    if (!config.conditions) return true;

    const { minimumGrantAmount, requiredMatchScore, successRateThreshold } = config.conditions;
    
    if (minimumGrantAmount && grantAmount < minimumGrantAmount) return false;
    if (requiredMatchScore && matchScore < requiredMatchScore) return false;
    
    return true;
  }

  /**
   * Calculate final reward amount based on config and base calculation
   */
  private calculateRewardAmount(config: RewardConfig, baseAmount: number, grantAmount: number): number {
    switch (config.type) {
      case 'HDAG':
        return baseAmount * 10; // 10x multiplier for ecosystem tokens
      case 'FET':
        return baseAmount;
      case 'ETH':
        return baseAmount * 0.001; // Convert to ETH
      case 'SOL':
        return baseAmount * 0.01; // Convert to SOL
      case 'nonprofit_donation':
        return Math.min(baseAmount, grantAmount * 0.01); // Cap at 1% of grant
      case 'custom':
        return config.amount || baseAmount;
      default:
        return baseAmount * 10;
    }
  }

  /**
   * Get default reward configurations
   */
  private getDefaultRewardConfigs(): RewardConfig[] {
    return [
      {
        type: 'HDAG',
        amount: 0, // Will be calculated
        description: 'HyperDAG tokens for ecosystem participation',
        conditions: { minimumGrantAmount: 1000 }
      },
      {
        type: 'nonprofit_donation',
        amount: 0,
        nonprofitId: 1, // Code.org default
        description: 'Donate to Code.org supporting computer science education',
        conditions: { minimumGrantAmount: 10000 }
      }
    ];
  }

  /**
   * Get default reward config for a specific type
   */
  private getDefaultRewardConfig(type: string, baseAmount: number): RewardConfig {
    const configs = {
      'HDAG': {
        type: 'HDAG' as const,
        amount: baseAmount * 10,
        description: 'HyperDAG tokens for ecosystem participation'
      },
      'FET': {
        type: 'FET' as const,
        amount: baseAmount,
        description: 'Fetch.AI tokens for agent services'
      },
      'ETH': {
        type: 'ETH' as const,
        amount: baseAmount * 0.001,
        description: 'Ethereum for DeFi opportunities'
      },
      'SOL': {
        type: 'SOL' as const,
        amount: baseAmount * 0.01,
        description: 'Solana for high-speed transactions'
      }
    };

    return configs[type] || configs['HDAG'];
  }
}

export const rewardConfigService = new RewardConfigService();