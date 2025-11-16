/**
 * RepID Gamification API Routes
 * Fibonacci-weighted reputation system with contest framework
 */

import { Router } from 'express';
import { repidService } from '../services/repid-gamification.js';

const router = Router();

/**
 * GET /api/repid/status/:userId
 * Get user's RepID score and achievements
 */
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const repidScore = repidService.getUserRepID(userId);
    
    if (!repidScore) {
      return res.status(404).json({
        success: false,
        error: 'User RepID not found'
      });
    }

    res.json({
      success: true,
      data: {
        userId: repidScore.userId,
        totalScore: repidScore.totalScore,
        level: repidScore.level,
        badges: repidScore.badges.length,
        achievements: repidScore.achievements.filter(a => a.completed).length,
        streak: repidScore.streak,
        fibonacciMultiplier: repidScore.fibonacciMultiplier,
        recentBadges: repidScore.badges.slice(-3),
        nextLevelThreshold: this.calculateNextLevelThreshold(repidScore.level)
      }
    });
  } catch (error) {
    console.error('[RepID API] Get status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get RepID status'
    });
  }
});

/**
 * POST /api/repid/update-score
 * Update user's RepID score with new activity
 */
router.post('/update-score', async (req, res) => {
  try {
    const { userId, actions, context = {} } = req.body;

    if (!userId || !actions) {
      return res.status(400).json({
        success: false,
        error: 'userId and actions are required'
      });
    }

    const updatedScore = repidService.updateRepIDScore(userId, actions, context);

    res.json({
      success: true,
      data: {
        totalScore: updatedScore.totalScore,
        level: updatedScore.level,
        newBadges: updatedScore.badges.filter(b => 
          new Date(b.earnedAt).getTime() > Date.now() - 60000 // Last minute
        ),
        streak: updatedScore.streak,
        fibonacciMultiplier: updatedScore.fibonacciMultiplier
      }
    });
  } catch (error) {
    console.error('[RepID API] Update score error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update RepID score'
    });
  }
});

/**
 * GET /api/repid/leaderboard
 * Get RepID leaderboard
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const leaderboard = repidService.getLeaderboard(parseInt(limit as string));

    res.json({
      success: true,
      data: {
        leaderboard: leaderboard.map(score => ({
          userId: score.userId,
          totalScore: score.totalScore,
          level: score.level,
          badges: score.badges.length,
          streak: score.streak,
          topBadge: score.badges.sort((a, b) => b.fibonacciWeight - a.fibonacciWeight)[0]
        })),
        totalUsers: leaderboard.length
      }
    });
  } catch (error) {
    console.error('[RepID API] Leaderboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get leaderboard'
    });
  }
});

/**
 * POST /api/repid/contest/submit
 * Submit entry to "Best AI Assistant Email" contest
 */
router.post('/contest/submit', async (req, res) => {
  try {
    const { userId, contestId = 'best_ai_email_2025', title, content, category } = req.body;

    if (!userId || !title || !content || !category) {
      return res.status(400).json({
        success: false,
        error: 'userId, title, content, and category are required'
      });
    }

    const entry = repidService.submitContestEntry(userId, contestId, {
      title,
      content,
      category
    });

    res.json({
      success: true,
      data: {
        entryId: entry.id,
        aiQuality: entry.aiQuality,
        fibonacciBonus: entry.fibonacciBonus,
        participationPoints: 5, // Fibonacci[4]
        submittedAt: entry.submittedAt
      }
    });
  } catch (error) {
    console.error('[RepID API] Contest submission error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to submit contest entry'
    });
  }
});

/**
 * GET /api/repid/contest/:contestId
 * Get contest information and status
 */
router.get('/contest/:contestId', async (req, res) => {
  try {
    const { contestId } = req.params;
    const contest = repidService.getContestStatus(contestId);

    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    const now = new Date();
    const isActive = now >= contest.startDate && now <= contest.endDate;
    const daysRemaining = Math.max(0, Math.ceil((contest.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    res.json({
      success: true,
      data: {
        contest: {
          id: contest.id,
          title: contest.title,
          description: contest.description,
          categories: contest.categories,
          prizes: contest.prizes,
          judging: contest.judging
        },
        status: {
          isActive,
          daysRemaining,
          startDate: contest.startDate,
          endDate: contest.endDate
        }
      }
    });
  } catch (error) {
    console.error('[RepID API] Get contest error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contest information'
    });
  }
});

/**
 * GET /api/repid/achievements/:userId
 * Get user's detailed achievements and progress
 */
router.get('/achievements/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const repidScore = repidService.getUserRepID(userId);
    
    if (!repidScore) {
      return res.status(404).json({
        success: false,
        error: 'User RepID not found'
      });
    }

    const achievements = repidScore.achievements.map(achievement => ({
      ...achievement,
      progressPercentage: Math.min(100, (achievement.progress / this.getRequirementValue(achievement.requirement)) * 100),
      estimatedTimeToComplete: this.estimateTimeToComplete(achievement, repidScore)
    }));

    res.json({
      success: true,
      data: {
        userId,
        achievements: {
          completed: achievements.filter(a => a.completed),
          inProgress: achievements.filter(a => !a.completed && a.progress > 0),
          available: achievements.filter(a => !a.completed && a.progress === 0)
        },
        badges: repidScore.badges.map(badge => ({
          ...badge,
          rarityRank: this.getBadgeRarityRank(badge.rarity)
        })),
        stats: {
          totalAchievements: achievements.length,
          completedCount: achievements.filter(a => a.completed).length,
          totalBadges: repidScore.badges.length,
          rareBadges: repidScore.badges.filter(b => ['Rare', 'Epic', 'Legendary'].includes(b.rarity)).length
        }
      }
    });
  } catch (error) {
    console.error('[RepID API] Get achievements error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get achievements'
    });
  }
});

// Helper methods (would be in a separate utility file in production)
function calculateNextLevelThreshold(currentLevel: number): number {
  const fibonacci = [1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610];
  return fibonacci[Math.min(currentLevel, fibonacci.length - 1)] * 10;
}

function getRequirementValue(requirement: string): number {
  const match = requirement.match(/\d+/);
  return match ? parseInt(match[0]) : 1;
}

function estimateTimeToComplete(achievement: any, userScore: any): string {
  const remaining = getRequirementValue(achievement.requirement) - achievement.progress;
  const dailyRate = userScore.streak > 0 ? 1.5 : 1; // Higher rate for streaks
  const estimatedDays = Math.ceil(remaining / dailyRate);
  
  if (estimatedDays <= 1) return '1 day';
  if (estimatedDays <= 7) return `${estimatedDays} days`;
  if (estimatedDays <= 30) return `${Math.ceil(estimatedDays / 7)} weeks`;
  return `${Math.ceil(estimatedDays / 30)} months`;
}

function getBadgeRarityRank(rarity: string): number {
  const ranks = { 'Common': 1, 'Rare': 2, 'Epic': 3, 'Legendary': 4 };
  return ranks[rarity] || 1;
}

export default router;