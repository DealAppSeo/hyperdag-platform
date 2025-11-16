import { Request, Response } from 'express';
import { storage } from '../../storage';
import { formatResponse, sendSuccess, sendError } from '../../utils/api-response';

// Get onboarding progress for the current user
export async function getOnboardingProgress(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 'UNAUTHORIZED', 401);
  }

  try {
    const user = await storage.getUser(req.user.id);
    if (!user) {
      return sendError(res, 'User not found', 'NOT_FOUND', 404);
    }

    // Calculate completion percentages
    const profileCompletionItems = [
      !!user.persona, // Persona selected
      !!user.email, // Email added
      !!user.emailVerified, // Email verified
      !!user.twoFactorEnabled, // 2FA enabled
      !!user.walletAddress, // Wallet connected
      !!user.bio, // Bio added
      !!user.skills, // Skills added
      !!user.interests, // Interests added
    ];

    const referralItems = [
      user.referredBy !== null, // Was referred
      (await storage.getReferralsByUserId(user.id)).length > 0, // Has referred others
    ];
    
    // Calculate badge count
    const badges = await storage.getBadgesByUserId(user.id);
    
    // Get referral stats
    const referralStats = await storage.getReferralStats(user.id);
    
    // Calculate completion percentages
    const profileCompletion = Math.round(
      (profileCompletionItems.filter(Boolean).length / profileCompletionItems.length) * 100
    );
    
    const referralCompletion = Math.round(
      (referralItems.filter(Boolean).length / referralItems.length) * 100
    );
    
    // Calculate rewards
    const totalReferralRewards = referralStats.rewards;
    
    // Check what's next to complete
    const nextSteps = [];
    
    if (!user.persona) nextSteps.push({ 
      id: 'persona', 
      label: 'Choose your path (Developer, Designer, or Influencer)', 
      importance: 'high',
      link: '/onboarding' 
    });
    
    if (!user.email) nextSteps.push({ 
      id: 'email', 
      label: 'Add your email address', 
      importance: 'high',
      link: '/settings?tab=account' 
    });
    
    if (user.email && !user.emailVerified) nextSteps.push({ 
      id: 'verify-email', 
      label: 'Verify your email address',
      importance: 'high', 
      link: '/settings?tab=account' 
    });
    
    if (!user.twoFactorEnabled) nextSteps.push({ 
      id: '2fa', 
      label: 'Enable two-factor authentication',
      importance: 'medium', 
      link: '/settings?tab=security' 
    });
    
    if (!user.walletAddress) nextSteps.push({ 
      id: 'wallet', 
      label: 'Connect your Web3 wallet',
      importance: 'high', 
      link: '/onboarding?step=5' 
    });
    
    if (!user.bio) nextSteps.push({ 
      id: 'bio', 
      label: 'Complete your bio',
      importance: 'medium', 
      link: '/settings?tab=profile' 
    });
    
    if (!user.skills) nextSteps.push({ 
      id: 'skills', 
      label: 'Add your skills',
      importance: 'medium', 
      link: '/settings?tab=skills' 
    });
    
    if (referralStats.level1 === 0) nextSteps.push({ 
      id: 'refer', 
      label: 'Refer friends and earn rewards',
      importance: 'high', 
      link: '/refer',
      note: 'Early referrers earn maximum rewards. Rewards decrease as our community grows!' 
    });
    
    return sendSuccess(res, {
      profile: {
        completion: profileCompletion,
        items: profileCompletionItems
      },
      referrals: {
        completion: referralCompletion,
        items: referralItems,
        stats: referralStats
      },
      nextSteps: nextSteps,
      badges: badges.length,
      tokens: user.tokens,
      rewards: totalReferralRewards,
      reputationScore: user.reputationScore,
      authLevel: user.authLevel,
      onboardingStage: user.onboardingStage
    });
  } catch (error) {
    console.error('Error fetching onboarding progress:', error);
    return sendError(res, 'Failed to fetch onboarding progress', 'INTERNAL_SERVER_ERROR', 500);
  }
}

// Update onboarding progress
export async function updateOnboardingProgress(req: Request, res: Response) {
  if (!req.user) {
    return sendError(res, 'Unauthorized', 'UNAUTHORIZED', 401);
  }

  try {
    const { stage, persona, bio, interests, skills } = req.body;
    
    const updates: any = {};
    if (stage) updates.onboardingStage = stage;
    if (persona) updates.persona = persona;
    if (bio) updates.bio = bio;
    if (interests) updates.interests = interests;
    if (skills) updates.skills = skills;
    
    const updatedUser = await storage.updateUser(req.user.id, updates);
    
    if (!updatedUser) {
      return sendError(res, 'User not found', 'NOT_FOUND', 404);
    }
    
    return sendSuccess(res, updatedUser);
  } catch (error) {
    console.error('Error updating onboarding progress:', error);
    return sendError(res, 'Failed to update onboarding progress', 'INTERNAL_SERVER_ERROR', 500);
  }
}