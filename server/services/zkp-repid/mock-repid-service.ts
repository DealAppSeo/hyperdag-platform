/**
 * Mock RepID Service - Fast testing without ZKP complexity
 * 
 * Provides instant responses for developer onboarding and testing.
 * Mimics real RepID behavior without proof generation overhead.
 */

export interface MockRepIDData {
  wallet: string;
  scores: Array<{
    category: string;
    score: number;
    weight?: number;
  }>;
  totalScore: number;
  level: number;
  nftTokenId: string;
  createdAt: string;
  updatedAt: string;
  mockMode: true;
}

export class MockRepIDService {
  private static mockDatabase = new Map<string, MockRepIDData>();
  
  /**
   * Initialize mock service with sample data
   */
  static initialize() {
    // Pre-populate with demo accounts for sandbox
    const demoAccounts = [
      {
        wallet: '0x1234567890123456789012345678901234567890',
        scores: [
          { category: 'governance', score: 750, weight: 1.2 },
          { category: 'technical', score: 850, weight: 1.0 },
          { category: 'community', score: 650, weight: 0.8 }
        ]
      },
      {
        wallet: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        scores: [
          { category: 'faithtech', score: 900, weight: 1.5 },
          { category: 'governance', score: 600, weight: 1.0 },
          { category: 'defi', score: 400, weight: 0.6 }
        ]
      }
    ];

    demoAccounts.forEach(account => {
      const totalScore = account.scores.reduce((sum, s) => sum + (s.score * (s.weight || 1)), 0);
      
      this.mockDatabase.set(account.wallet, {
        wallet: account.wallet,
        scores: account.scores,
        totalScore: Math.round(totalScore),
        level: this.calculateLevel(totalScore),
        nftTokenId: `mock-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString(), // Random date within 30 days
        updatedAt: new Date().toISOString(),
        mockMode: true
      });
    });
  }

  /**
   * Create mock RepID instantly (no ZKP generation)
   */
  static async createMockRepID(wallet: string, scores: Array<{category: string, score: number, weight?: number}>): Promise<MockRepIDData> {
    // Simulate brief processing delay for realism
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));

    const totalScore = scores.reduce((sum, s) => sum + (s.score * (s.weight || 1)), 0);
    
    const mockRepID: MockRepIDData = {
      wallet,
      scores,
      totalScore: Math.round(totalScore),
      level: this.calculateLevel(totalScore),
      nftTokenId: `mock-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mockMode: true
    };

    this.mockDatabase.set(wallet, mockRepID);
    return mockRepID;
  }

  /**
   * Verify mock RepID threshold (instant response)
   */
  static async verifyMockRepID(wallet: string, threshold: number, category?: string): Promise<boolean> {
    // Simulate brief verification delay
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));

    const repid = this.mockDatabase.get(wallet);
    if (!repid) return false;

    if (category) {
      const categoryScore = repid.scores.find(s => s.category === category);
      if (!categoryScore) return false;
      return (categoryScore.score * (categoryScore.weight || 1)) >= threshold;
    }

    return repid.totalScore >= threshold;
  }

  /**
   * Update mock RepID scores
   */
  static async updateMockRepID(wallet: string, newScores: Array<{category: string, score: number, weight?: number}>): Promise<MockRepIDData> {
    await new Promise(resolve => setTimeout(resolve, 80 + Math.random() * 120));

    const existing = this.mockDatabase.get(wallet);
    if (!existing) {
      throw new Error('Mock RepID not found for update');
    }

    // Merge scores (new scores override existing categories)
    const mergedScores = [...existing.scores];
    newScores.forEach(newScore => {
      const existingIndex = mergedScores.findIndex(s => s.category === newScore.category);
      if (existingIndex >= 0) {
        mergedScores[existingIndex] = newScore;
      } else {
        mergedScores.push(newScore);
      }
    });

    const totalScore = mergedScores.reduce((sum, s) => sum + (s.score * (s.weight || 1)), 0);

    const updatedRepID: MockRepIDData = {
      ...existing,
      scores: mergedScores,
      totalScore: Math.round(totalScore),
      level: this.calculateLevel(totalScore),
      updatedAt: new Date().toISOString()
    };

    this.mockDatabase.set(wallet, updatedRepID);
    return updatedRepID;
  }

  /**
   * Get mock RepID data
   */
  static getMockRepID(wallet: string): MockRepIDData | null {
    return this.mockDatabase.get(wallet) || null;
  }

  /**
   * Batch verify multiple mock RepIDs
   */
  static async batchVerifyMockRepIDs(requests: Array<{wallet: string, threshold: number, category?: string}>): Promise<boolean[]> {
    // Simulate batch processing delay (much faster than individual requests)
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 100));

    return Promise.all(
      requests.map(req => this.verifyMockRepID(req.wallet, req.threshold, req.category))
    );
  }

  /**
   * Get all mock RepIDs (for testing/demo purposes)
   */
  static getAllMockRepIDs(): MockRepIDData[] {
    return Array.from(this.mockDatabase.values());
  }

  /**
   * Clear mock database (for testing)
   */
  static clearMockDatabase(): void {
    this.mockDatabase.clear();
    this.initialize(); // Re-add demo accounts
  }

  /**
   * Get mock database statistics
   */
  static getStats(): {
    totalMockRepIDs: number;
    averageScore: number;
    categoryDistribution: Record<string, number>;
  } {
    const repids = Array.from(this.mockDatabase.values());
    const totalScore = repids.reduce((sum, r) => sum + r.totalScore, 0);
    
    const categoryDistribution: Record<string, number> = {};
    repids.forEach(repid => {
      repid.scores.forEach(score => {
        categoryDistribution[score.category] = (categoryDistribution[score.category] || 0) + 1;
      });
    });

    return {
      totalMockRepIDs: repids.length,
      averageScore: repids.length > 0 ? Math.round(totalScore / repids.length) : 0,
      categoryDistribution
    };
  }

  private static calculateLevel(totalScore: number): number {
    if (totalScore >= 5000) return 5; // Master
    if (totalScore >= 3000) return 4; // Expert  
    if (totalScore >= 1500) return 3; // Advanced
    if (totalScore >= 500) return 2;  // Intermediate
    return 1; // Beginner
  }
}

// Initialize with demo data
MockRepIDService.initialize();