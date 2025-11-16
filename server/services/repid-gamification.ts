/**
 * RepID Gamification System
 * Fibonacci-weighted reputation scoring with progressive achievement system
 * Part of the AI Symphony Autonomous Mission
 */

interface RepIDScore {
  userId: string;
  totalScore: number;
  level: number;
  badges: Badge[];
  achievements: Achievement[];
  fibonacciMultiplier: number;
  lastActivity: Date;
  streak: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  fibonacciWeight: number;
  earnedAt: Date;
}

interface Achievement {
  id: string;
  category: 'AI_MASTERY' | 'COLLABORATION' | 'INNOVATION' | 'CONSISTENCY' | 'VIRAL_CONTENT';
  title: string;
  description: string;
  requirement: string;
  fibonacciPoints: number;
  progress: number;
  completed: boolean;
  completedAt?: Date;
}

interface ContestEntry {
  id: string;
  userId: string;
  contestId: string;
  title: string;
  content: string;
  aiQuality: number; // 0-1 score from AI evaluation
  peerVotes: number;
  fibonacciBonus: number;
  submittedAt: Date;
}

export class RepIDGamificationService {
  private fibonacci: number[] = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610];
  private userScores: Map<string, RepIDScore> = new Map();
  private contests: Map<string, Contest> = new Map();
  
  constructor() {
    this.initializeAchievements();
    this.initializeBestAIEmailContest();
  }

  /**
   * Calculate RepID score using Fibonacci weights
   */
  calculateFibonacciScore(baseActions: { [key: string]: number }): number {
    let totalScore = 0;
    
    // Apply Fibonacci weights to different actions
    const actionWeights = {
      'ai_interaction': this.fibonacci[2], // 2 points
      'quality_content': this.fibonacci[4], // 5 points  
      'peer_validation': this.fibonacci[3], // 3 points
      'innovation': this.fibonacci[6], // 13 points
      'consistency_streak': this.fibonacci[5], // 8 points
      'viral_achievement': this.fibonacci[8], // 34 points
      'ai_symphony_coordination': this.fibonacci[7], // 21 points
      'contest_participation': this.fibonacci[4], // 5 points
      'contest_victory': this.fibonacci[9] // 55 points
    };

    Object.entries(baseActions).forEach(([action, count]) => {
      const weight = actionWeights[action] || 1;
      totalScore += count * weight;
    });

    return totalScore;
  }

  /**
   * Update user RepID score with new activity
   */
  updateRepIDScore(
    userId: string, 
    actions: { [key: string]: number },
    context: {
      aiProvider?: string;
      contentQuality?: number;
      collaborationScore?: number;
      innovationLevel?: number;
    } = {}
  ): RepIDScore {
    const existing = this.userScores.get(userId) || this.createNewUserScore(userId);
    
    // Calculate Fibonacci score for new actions
    const newPoints = this.calculateFibonacciScore(actions);
    
    // Apply context multipliers
    let multiplier = existing.fibonacciMultiplier;
    
    if (context.contentQuality && context.contentQuality > 0.8) {
      multiplier *= this.fibonacci[3] / 10; // Quality bonus
    }
    
    if (context.collaborationScore && context.collaborationScore > 0.7) {
      multiplier *= this.fibonacci[2] / 10; // Collaboration bonus  
    }
    
    if (context.innovationLevel && context.innovationLevel > 0.9) {
      multiplier *= this.fibonacci[4] / 10; // Innovation bonus
    }

    // Update streak logic
    const now = new Date();
    const lastActivity = existing.lastActivity;
    const daysSinceLastActivity = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastActivity === 1) {
      existing.streak += 1;
    } else if (daysSinceLastActivity > 1) {
      existing.streak = 1; // Reset streak
    }
    
    // Apply streak multiplier using Fibonacci
    const streakMultiplier = existing.streak > 0 ? 
      this.fibonacci[Math.min(existing.streak - 1, this.fibonacci.length - 1)] / 10 : 1;

    // Calculate final score
    const finalPoints = Math.floor(newPoints * multiplier * streakMultiplier);
    existing.totalScore += finalPoints;
    existing.lastActivity = now;
    existing.fibonacciMultiplier = Math.min(multiplier * 1.01, 3.0); // Gradual improvement, cap at 3x

    // Level progression using Fibonacci thresholds
    existing.level = this.calculateLevel(existing.totalScore);
    
    // Check for new achievements and badges
    this.checkAchievements(userId, existing, actions, context);
    this.checkBadgeEligibility(userId, existing);
    
    this.userScores.set(userId, existing);
    
    return existing;
  }

  /**
   * Calculate user level based on Fibonacci thresholds
   */
  private calculateLevel(totalScore: number): number {
    for (let i = this.fibonacci.length - 1; i >= 0; i--) {
      const threshold = this.fibonacci[i] * 10; // Scale up thresholds
      if (totalScore >= threshold) {
        return i + 1;
      }
    }
    return 1;
  }

  /**
   * Create new user RepID score
   */
  private createNewUserScore(userId: string): RepIDScore {
    return {
      userId,
      totalScore: 0,
      level: 1,
      badges: [],
      achievements: [],
      fibonacciMultiplier: 1.0,
      lastActivity: new Date(),
      streak: 0
    };
  }

  /**
   * Initialize achievement system
   */
  private initializeAchievements(): void {
    const achievements: Achievement[] = [
      {
        id: 'first_ai_interaction',
        category: 'AI_MASTERY',
        title: 'AI Whisperer',
        description: 'Successfully interact with the ANFIS AI system',
        requirement: 'Complete 1 AI interaction',
        fibonacciPoints: this.fibonacci[3], // 3 points
        progress: 0,
        completed: false
      },
      {
        id: 'fibonacci_master',
        category: 'AI_MASTERY', 
        title: 'Fibonacci Master',
        description: 'Reach RepID level based on Fibonacci sequence',
        requirement: 'Achieve RepID level 8',
        fibonacciPoints: this.fibonacci[8], // 34 points
        progress: 0,
        completed: false
      },
      {
        id: 'symphony_conductor',
        category: 'COLLABORATION',
        title: 'Symphony Conductor',
        description: 'Coordinate successful AI Symphony operation',
        requirement: 'Lead 5 multi-AI collaborative tasks',
        fibonacciPoints: this.fibonacci[7], // 21 points
        progress: 0,
        completed: false
      },
      {
        id: 'viral_content_creator',
        category: 'VIRAL_CONTENT',
        title: 'Viral Visionary',
        description: 'Create content that achieves viral metrics',
        requirement: 'Content with 1000+ engagements',
        fibonacciPoints: this.fibonacci[9], // 55 points
        progress: 0,
        completed: false
      },
      {
        id: 'innovation_pioneer',
        category: 'INNOVATION',
        title: 'Innovation Pioneer',
        description: 'Contribute breakthrough AI optimization',
        requirement: 'Achieve 79%+ cost savings',
        fibonacciPoints: this.fibonacci[10], // 89 points
        progress: 0,
        completed: false
      },
      {
        id: 'consistency_champion',
        category: 'CONSISTENCY',
        title: 'Consistency Champion', 
        description: 'Maintain daily activity streak',
        requirement: '21-day activity streak',
        fibonacciPoints: this.fibonacci[6], // 13 points
        progress: 0,
        completed: false
      }
    ];

    // Store achievements for user checking
    this.achievements = achievements;
  }

  private achievements: Achievement[] = [];

  /**
   * Check user achievements based on activity
   */
  private checkAchievements(
    userId: string, 
    userScore: RepIDScore, 
    actions: { [key: string]: number },
    context: any
  ): void {
    this.achievements.forEach(achievement => {
      const userAchievement = userScore.achievements.find(a => a.id === achievement.id);
      
      if (!userAchievement) {
        // Add new achievement to track
        const newAchievement: Achievement = {
          ...achievement,
          progress: 0,
          completed: false
        };
        userScore.achievements.push(newAchievement);
      } else if (!userAchievement.completed) {
        // Update progress
        switch (achievement.id) {
          case 'first_ai_interaction':
            if (actions.ai_interaction > 0) {
              userAchievement.progress = 1;
              userAchievement.completed = true;
              userAchievement.completedAt = new Date();
            }
            break;
          case 'fibonacci_master':
            userAchievement.progress = userScore.level;
            if (userScore.level >= 8) {
              userAchievement.completed = true;
              userAchievement.completedAt = new Date();
            }
            break;
          case 'symphony_conductor':
            if (actions.ai_symphony_coordination > 0) {
              userAchievement.progress += actions.ai_symphony_coordination;
              if (userAchievement.progress >= 5) {
                userAchievement.completed = true;
                userAchievement.completedAt = new Date();
              }
            }
            break;
          case 'consistency_champion':
            userAchievement.progress = userScore.streak;
            if (userScore.streak >= 21) {
              userAchievement.completed = true;
              userAchievement.completedAt = new Date();
            }
            break;
        }
      }
    });
  }

  /**
   * Check badge eligibility based on achievements
   */
  private checkBadgeEligibility(userId: string, userScore: RepIDScore): void {
    const completedAchievements = userScore.achievements.filter(a => a.completed);
    
    // Award badges based on completed achievements
    completedAchievements.forEach(achievement => {
      const existingBadge = userScore.badges.find(b => b.id === `badge_${achievement.id}`);
      
      if (!existingBadge) {
        const badge: Badge = {
          id: `badge_${achievement.id}`,
          name: achievement.title,
          description: `Earned by: ${achievement.description}`,
          iconUrl: `/badges/${achievement.category.toLowerCase()}.svg`,
          rarity: this.determineBadgeRarity(achievement.fibonacciPoints),
          fibonacciWeight: achievement.fibonacciPoints,
          earnedAt: new Date()
        };
        
        userScore.badges.push(badge);
      }
    });
  }

  /**
   * Determine badge rarity based on Fibonacci points
   */
  private determineBadgeRarity(points: number): Badge['rarity'] {
    if (points >= this.fibonacci[9]) return 'Legendary'; // 55+
    if (points >= this.fibonacci[7]) return 'Epic';      // 21+  
    if (points >= this.fibonacci[5]) return 'Rare';      // 8+
    return 'Common';
  }

  /**
   * Initialize "Best AI Assistant Email" contest
   */
  private initializeBestAIEmailContest(): void {
    const contest: Contest = {
      id: 'best_ai_email_2025',
      title: 'Best AI Assistant Email Contest',
      description: 'Create the most helpful, engaging, and innovative AI assistant email response',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      categories: [
        'Most Helpful Response',
        'Most Creative Solution', 
        'Best Technical Innovation',
        'Most User-Friendly',
        'Best Cost Optimization'
      ],
      prizes: {
        first: this.fibonacci[11], // 144 RepID points
        second: this.fibonacci[9], // 55 RepID points
        third: this.fibonacci[7],  // 21 RepID points
        participation: this.fibonacci[4] // 5 RepID points
      },
      judging: {
        aiEvaluation: 0.4, // 40% AI quality assessment
        peerVoting: 0.4,   // 40% peer votes
        fibonacciBonus: 0.2 // 20% innovation/efficiency bonus
      }
    };

    this.contests.set(contest.id, contest);
  }

  /**
   * Submit contest entry
   */
  submitContestEntry(
    userId: string,
    contestId: string,
    entry: {
      title: string;
      content: string;
      category: string;
    }
  ): ContestEntry {
    const contest = this.contests.get(contestId);
    if (!contest) {
      throw new Error('Contest not found');
    }

    if (new Date() > contest.endDate) {
      throw new Error('Contest has ended');
    }

    // Evaluate entry using AI quality metrics
    const aiQuality = this.evaluateEntryQuality(entry.content);
    const fibonacciBonus = this.calculateFibonacciBonus(entry.content, aiQuality);

    const contestEntry: ContestEntry = {
      id: `entry_${Date.now()}_${userId}`,
      userId,
      contestId,
      title: entry.title,
      content: entry.content,
      aiQuality,
      peerVotes: 0,
      fibonacciBonus,
      submittedAt: new Date()
    };

    // Award participation points
    this.updateRepIDScore(userId, { contest_participation: 1 }, {
      contentQuality: aiQuality,
      innovationLevel: fibonacciBonus
    });

    return contestEntry;
  }

  /**
   * Evaluate entry quality using AI metrics
   */
  private evaluateEntryQuality(content: string): number {
    // Simplified AI quality evaluation
    let score = 0.5; // Base score

    // Length and detail bonus
    if (content.length > 500) score += 0.1;
    if (content.length > 1000) score += 0.1;

    // Technical depth indicators
    const technicalTerms = ['API', 'algorithm', 'optimization', 'efficiency', 'automation'];
    const technicalMatches = technicalTerms.filter(term => 
      content.toLowerCase().includes(term.toLowerCase())
    ).length;
    score += Math.min(0.2, technicalMatches * 0.04);

    // Innovation indicators  
    const innovationTerms = ['novel', 'breakthrough', 'innovative', 'unique', 'creative'];
    const innovationMatches = innovationTerms.filter(term => 
      content.toLowerCase().includes(term.toLowerCase())
    ).length;
    score += Math.min(0.2, innovationMatches * 0.04);

    return Math.min(1.0, score);
  }

  /**
   * Calculate Fibonacci bonus for innovative entries
   */
  private calculateFibonacciBonus(content: string, aiQuality: number): number {
    let bonus = 0;

    // High quality content bonus
    if (aiQuality > 0.8) bonus += this.fibonacci[3] / 100;
    
    // Innovation keywords bonus
    const innovationKeywords = ['fibonacci', 'symphony', 'autonomous', 'optimization'];
    const matches = innovationKeywords.filter(keyword => 
      content.toLowerCase().includes(keyword)
    ).length;
    bonus += matches * this.fibonacci[2] / 100;

    return bonus;
  }

  /**
   * Get user RepID status
   */
  getUserRepID(userId: string): RepIDScore | null {
    return this.userScores.get(userId) || null;
  }

  /**
   * Get leaderboard
   */
  getLeaderboard(limit: number = 10): RepIDScore[] {
    return Array.from(this.userScores.values())
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit);
  }

  /**
   * Get contest status
   */
  getContestStatus(contestId: string): Contest | null {
    return this.contests.get(contestId) || null;
  }
}

interface Contest {
  id: string;
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
  categories: string[];
  prizes: {
    first: number;
    second: number;
    third: number;
    participation: number;
  };
  judging: {
    aiEvaluation: number;
    peerVoting: number;
    fibonacciBonus: number;
  };
}

export const repidService = new RepIDGamificationService();