import { Request, Response } from 'express';
import { storage } from '../storage';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Predefined features in the system that can be progressively discovered
 * Each feature has:
 * - id: Unique identifier
 * - name: User-facing name
 * - description: Brief explanation 
 * - category: Logical grouping
 * - persona: Which persona it's most relevant for (or 'all')
 * - requiredKnowledgeLevel: Minimum knowledge level required to understand this feature
 * - requiredStep: Minimum onboarding step required
 * - image: Icon or image for the feature
 * - path: Router path to access the feature
 */
export const FEATURES = [
  // Core features available to all personas with basic knowledge
  {
    id: 'profile',
    name: 'HyperDAG Identity',
    description: 'Your secure, privacy-preserving digital identity',
    category: 'identity',
    persona: 'all',
    requiredKnowledgeLevel: 1,
    requiredStep: 'identity_created',
    image: 'user-circle',
    path: '/profile'
  },
  {
    id: 'reputation',
    name: 'RepID',
    description: 'Your reputation score and credentials',
    category: 'identity',
    persona: 'all',
    requiredKnowledgeLevel: 2,
    requiredStep: 'profile_completed',
    image: 'award',
    path: '/reputation'
  },
  {
    id: 'networking',
    name: 'Network Building',
    description: 'Connect with collaborators and mentors',
    category: 'collaboration',
    persona: 'all',
    requiredKnowledgeLevel: 1,
    requiredStep: 'identity_created',
    image: 'users',
    path: '/networking'
  },
  
  // Developer-focused features
  {
    id: 'dev_dashboard',
    name: 'Developer Dashboard',
    description: 'Access developer tools and resources',
    category: 'development',
    persona: 'developer',
    requiredKnowledgeLevel: 3,
    requiredStep: 'knowledge_assessed',
    image: 'code',
    path: '/developer-dashboard'
  },
  {
    id: 'zkp_tools',
    name: 'ZKP Playground',
    description: 'Experiment with zero-knowledge proofs',
    category: 'privacy',
    persona: 'developer',
    requiredKnowledgeLevel: 4,
    requiredStep: 'completed_basic_challenge',
    image: 'shield',
    path: '/zkp'
  },
  {
    id: 'bacalhau',
    name: 'Distributed Compute',
    description: 'Run compute jobs on the Bacalhau network',
    category: 'development',
    persona: 'developer',
    requiredKnowledgeLevel: 4,
    requiredStep: 'completed_intermediate_challenge',
    image: 'cpu',
    path: '/bacalhau'
  },
  
  // Designer-focused features
  {
    id: 'design_dashboard',
    name: 'Designer Workspace',
    description: 'Tools for UI/UX contributions',
    category: 'design',
    persona: 'designer',
    requiredKnowledgeLevel: 3,
    requiredStep: 'knowledge_assessed',
    image: 'palette',
    path: '/design-dashboard'
  },
  {
    id: 'design_challenges',
    name: 'Design Challenges',
    description: 'Contribute designs to earn reputation',
    category: 'design',
    persona: 'designer',
    requiredKnowledgeLevel: 3,
    requiredStep: 'completed_basic_challenge',
    image: 'diamond',
    path: '/design-challenges'
  },
  
  // Influencer-focused features
  {
    id: 'influencer_dashboard',
    name: 'Influence Hub',
    description: 'Track your impact and reach',
    category: 'influence',
    persona: 'influencer',
    requiredKnowledgeLevel: 3,
    requiredStep: 'knowledge_assessed',
    image: 'trending-up',
    path: '/influence-hub'
  },
  {
    id: 'referrals',
    name: 'Referral Program',
    description: 'Invite others and earn rewards',
    category: 'influence',
    persona: 'influencer',
    requiredKnowledgeLevel: 2,
    requiredStep: 'profile_completed',
    image: 'share',
    path: '/refer'
  },
  
  // Grant system features (progressively revealed)
  {
    id: 'rfi_submit',
    name: 'Submit Ideas',
    description: 'Share your ideas for community voting',
    category: 'funding',
    persona: 'all',
    requiredKnowledgeLevel: 2,
    requiredStep: 'profile_completed',
    image: 'lightbulb',
    path: '/grant-flow'
  },
  {
    id: 'rfi_vote',
    name: 'Vote on Ideas',
    description: 'Help shape which ideas get funded',
    category: 'funding',
    persona: 'all',
    requiredKnowledgeLevel: 2,
    requiredStep: 'completed_basic_challenge',
    image: 'vote',
    path: '/grant-flow'
  },
  {
    id: 'rfp_create',
    name: 'Create Proposals',
    description: 'Develop detailed proposals for funding',
    category: 'funding',
    persona: 'all',
    requiredKnowledgeLevel: 3,
    requiredStep: 'completed_intermediate_challenge',
    image: 'file-text',
    path: '/grant-flow'
  },
  {
    id: 'hypercrowd',
    name: 'HyperCrowd Funding',
    description: 'Crowdfund with grant-matching',
    category: 'funding',
    persona: 'all',
    requiredKnowledgeLevel: 4,
    requiredStep: 'completed_advanced_challenge',
    image: 'coins',
    path: '/hypercrowd'
  }
];

/**
 * Predefined challenges for onboarding engagement
 * Each challenge has:
 * - id: Unique identifier
 * - name: User-facing name
 * - description: What the user needs to do
 * - persona: Which persona it's for (or 'all')
 * - difficulty: How challenging it is (basic, intermediate, advanced)
 * - tokenReward: Tokens earned for completion
 * - reputationPoints: Reputation points earned
 * - requiredStep: Minimum onboarding step required
 * - unlocksFeatures: Features unlocked upon completion
 */
export const CHALLENGES = [
  // Basic challenges for all personas
  {
    id: 'complete_profile',
    name: 'Complete Your Profile',
    description: 'Add your bio, interests, and skills',
    persona: 'all',
    difficulty: 'basic',
    tokenReward: 5,
    reputationPoints: 10,
    requiredStep: 'identity_created',
    unlocksFeatures: ['reputation', 'rfi_submit']
  },
  {
    id: 'connect_wallet',
    name: 'Connect Your Wallet',
    description: 'Add a Web3 wallet to your account',
    persona: 'all',
    difficulty: 'basic',
    tokenReward: 10,
    reputationPoints: 15,
    requiredStep: 'profile_completed',
    unlocksFeatures: ['referrals']
  },
  
  // Developer challenges
  {
    id: 'dev_knowledge_quiz',
    name: 'Web3 Knowledge Check',
    description: 'Complete a blockchain technology quiz',
    persona: 'developer',
    difficulty: 'basic',
    tokenReward: 15,
    reputationPoints: 20,
    requiredStep: 'identity_created',
    unlocksFeatures: ['dev_dashboard']
  },
  {
    id: 'zkp_verify_identity',
    name: 'ZKP Identity Verification',
    description: 'Verify your identity using zero-knowledge proofs',
    persona: 'developer',
    difficulty: 'intermediate',
    tokenReward: 25,
    reputationPoints: 30,
    requiredStep: 'knowledge_assessed',
    unlocksFeatures: ['zkp_tools']
  },
  
  // Designer challenges
  {
    id: 'design_showcase',
    name: 'UI Component Showcase',
    description: 'Submit a design for a dashboard component',
    persona: 'designer',
    difficulty: 'basic',
    tokenReward: 15,
    reputationPoints: 20,
    requiredStep: 'identity_created',
    unlocksFeatures: ['design_dashboard']
  },
  
  // Influencer challenges
  {
    id: 'first_referral',
    name: 'First Referral',
    description: 'Refer your first team member',
    persona: 'influencer',
    difficulty: 'basic',
    tokenReward: 20,
    reputationPoints: 25,
    requiredStep: 'profile_completed',
    unlocksFeatures: ['influencer_dashboard']
  }
];

/**
 * Get all available features for progressive discovery
 */
export const getAllFeatures = async (req: Request, res: Response) => {
  try {
    // Filter features based on user's persona and progress
    const user = req.user;
    const userPersona = user.persona || 'all';
    
    // Get the user's knowledge scores and onboarding progress
    const knowledgeScores = user.knowledgeScores || {};
    const averageKnowledgeScore = calculateAverageKnowledgeScore(knowledgeScores);
    const currentStep = user.funnelStep || 'identity_created';
    
    // Filter features that are relevant to this user
    const relevantFeatures = FEATURES.filter(feature => {
      // Include if it's for all personas or matches user's persona
      const personaMatch = feature.persona === 'all' || feature.persona === userPersona;
      
      // Knowledge level requirement check
      const knowledgeCheck = feature.requiredKnowledgeLevel <= averageKnowledgeScore;
      
      // Onboarding step requirement check
      const stepCheck = isStepCompleted(currentStep, feature.requiredStep);
      
      return personaMatch && knowledgeCheck && stepCheck;
    });
    
    // Get the user's discovered features
    const discoveredFeatures = user.discoveredFeatures || [];
    
    // Mark features as discovered or locked
    const featuresWithStatus = relevantFeatures.map(feature => ({
      ...feature,
      discovered: discoveredFeatures.includes(feature.id),
      locked: !isStepCompleted(currentStep, feature.requiredStep) || 
              feature.requiredKnowledgeLevel > averageKnowledgeScore
    }));
    
    return res.json({
      success: true,
      features: featuresWithStatus,
      userProgress: {
        persona: userPersona,
        knowledgeScore: averageKnowledgeScore,
        currentStep,
        discoveredFeatures
      }
    });
  } catch (error) {
    console.error("Error fetching features:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch features",
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Get a user's onboarding funnel progress
 */
export const getUserProgress = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    
    // Calculate knowledge score
    const knowledgeScores = user.knowledgeScores || {};
    const averageKnowledgeScore = calculateAverageKnowledgeScore(knowledgeScores);
    
    // Get appropriate challenges based on user's persona and progress
    const userPersona = user.persona || 'all';
    const currentStep = user.funnelStep || 'identity_created';
    const completedChallenges = user.completedChallenges || [];
    
    // Filter available challenges
    const availableChallenges = CHALLENGES.filter(challenge => {
      const personaMatch = challenge.persona === 'all' || challenge.persona === userPersona;
      const stepMatch = isStepCompleted(currentStep, challenge.requiredStep);
      const notCompleted = !completedChallenges.includes(challenge.id);
      
      return personaMatch && stepMatch && notCompleted;
    });
    
    // Get active goals
    const activeGoals = user.activeGoals || [];
    
    return res.json({
      success: true,
      progress: {
        persona: userPersona,
        currentStep,
        knowledgeScore: averageKnowledgeScore,
        knowledgeAreas: knowledgeScores,
        completedChallenges,
        engagementScore: user.engagementScore || 0,
        discoveredFeatures: user.discoveredFeatures || [],
        lastEngagement: user.lastEngagement
      },
      availableChallenges,
      activeGoals
    });
  } catch (error) {
    console.error("Error fetching user progress:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user progress",
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Save a user's onboarding progress
 */
export const saveOnboardingProgress = async (req: Request, res: Response) => {
  try {
    const { step, data } = req.body;
    
    if (!step) {
      return res.status(400).json({
        success: false,
        message: "Missing required field: step"
      });
    }
    
    // Get current user data
    const user = req.user;
    
    // Set up update data
    const updateData: any = {
      funnelStep: step,
      lastEngagement: new Date()
    };
    
    // Handle different step types
    switch (step) {
      case 'persona_selected':
        if (!data?.persona || !['developer', 'designer', 'influencer'].includes(data.persona)) {
          return res.status(400).json({
            success: false,
            message: "Invalid persona selection"
          });
        }
        updateData.persona = data.persona;
        break;
        
      case 'identity_created':
        // Nothing special needed - basic account created
        break;
        
      case 'profile_completed':
        // Update profile fields
        if (data?.bio) updateData.bio = data.bio;
        if (data?.interests && Array.isArray(data.interests)) updateData.interests = data.interests;
        if (data?.skills && Array.isArray(data.skills)) updateData.skills = data.skills;
        if (data?.openToCollaboration !== undefined) updateData.openToCollaboration = data.openToCollaboration;
        break;
        
      case 'knowledge_assessed':
        // Store knowledge assessment results
        if (data?.knowledgeScores && typeof data.knowledgeScores === 'object') {
          updateData.knowledgeScores = data.knowledgeScores;
        }
        break;
        
      case 'completed_basic_challenge':
      case 'completed_intermediate_challenge':
      case 'completed_advanced_challenge':
        // Add completed challenge
        if (data?.challengeId) {
          // Get existing completed challenges
          const completedChallenges = user.completedChallenges || [];
          if (!completedChallenges.includes(data.challengeId)) {
            updateData.completedChallenges = [...completedChallenges, data.challengeId];
            
            // Find the challenge to calculate rewards
            const challenge = CHALLENGES.find(c => c.id === data.challengeId);
            if (challenge) {
              // Award tokens and reputation
              updateData.tokens = (user.tokens || 0) + challenge.tokenReward;
              updateData.reputationScore = (user.reputationScore || 0) + challenge.reputationPoints;
              
              // Add newly unlocked features
              const discoveredFeatures = user.discoveredFeatures || [];
              const newFeatures = challenge.unlocksFeatures.filter(f => !discoveredFeatures.includes(f));
              if (newFeatures.length > 0) {
                updateData.discoveredFeatures = [...discoveredFeatures, ...newFeatures];
              }
            }
          }
        }
        break;
        
      case 'feature_discovered':
        // Mark a feature as discovered
        if (data?.featureId) {
          const discoveredFeatures = user.discoveredFeatures || [];
          if (!discoveredFeatures.includes(data.featureId)) {
            updateData.discoveredFeatures = [...discoveredFeatures, data.featureId];
            // Small reputation bonus for discovering features
            updateData.reputationScore = (user.reputationScore || 0) + 5;
          }
        }
        break;
        
      case 'goal_set':
        // Add a new goal
        if (data?.goalId) {
          const activeGoals = user.activeGoals || [];
          if (!activeGoals.includes(data.goalId)) {
            updateData.activeGoals = [...activeGoals, data.goalId];
          }
        }
        break;
    }
    
    // Increment engagement score
    updateData.engagementScore = (user.engagementScore || 0) + 1;
    
    // Special handling for onboardingStage for backward compatibility
    if (['profile_completed', 'knowledge_assessed', 'completed_basic_challenge'].includes(step)) {
      updateData.onboardingStage = Math.max(user.onboardingStage || 1, 2);
    }
    
    // Update the user
    const updatedUser = await storage.updateUser(user.id, updateData);
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    return res.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error("Error updating onboarding progress:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update onboarding progress",
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

/**
 * Save knowledge assessment results
 */
export const saveKnowledgeAssessment = async (req: Request, res: Response) => {
  try {
    const { scores } = req.body;
    
    if (!scores || typeof scores !== 'object') {
      return res.status(400).json({
        success: false,
        message: "Invalid knowledge assessment data"
      });
    }
    
    // Calculate average score
    const scoreValues = Object.values(scores).filter(val => typeof val === 'number') as number[];
    const averageScore = scoreValues.length > 0 
      ? Math.round(scoreValues.reduce((sum, val) => sum + val, 0) / scoreValues.length) 
      : 0;
    
    // Update user
    const updateData = {
      knowledgeScores: scores,
      knowledgeScore: averageScore,
      funnelStep: 'knowledge_assessed',
      lastEngagement: new Date(),
      engagementScore: (req.user.engagementScore || 0) + 2 // Extra engagement points for completing assessment
    };
    
    const updatedUser = await storage.updateUser(req.user.id, updateData);
    
    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }
    
    // Determine which features to unlock based on knowledge score
    const userPersona = updatedUser.persona || 'all';
    const newlyUnlockedFeatures = FEATURES.filter(feature => {
      // Include if it's for all personas or matches user's persona
      const personaMatch = feature.persona === 'all' || feature.persona === userPersona;
      
      // Knowledge level requirement check (only include newly unlocked)
      const knowledgeUnlocked = feature.requiredKnowledgeLevel <= averageScore && 
                               feature.requiredStep === 'knowledge_assessed';
      
      return personaMatch && knowledgeUnlocked;
    }).map(f => f.id);
    
    // If there are newly unlocked features, update the user again
    if (newlyUnlockedFeatures.length > 0) {
      const discoveredFeatures = updatedUser.discoveredFeatures || [];
      const uniqueNewFeatures = newlyUnlockedFeatures.filter(f => !discoveredFeatures.includes(f));
      
      if (uniqueNewFeatures.length > 0) {
        await storage.updateUser(req.user.id, {
          discoveredFeatures: [...discoveredFeatures, ...uniqueNewFeatures]
        });
      }
    }
    
    return res.json({
      success: true,
      user: updatedUser,
      assessment: {
        averageScore,
        scores
      },
      unlockedFeatures: newlyUnlockedFeatures
    });
  } catch (error) {
    console.error("Error saving knowledge assessment:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save knowledge assessment",
      error: error instanceof Error ? error.message : String(error)
    });
  }
};

// Utility function to calculate average knowledge score
function calculateAverageKnowledgeScore(scores: Record<string, number>): number {
  if (!scores || typeof scores !== 'object') return 1; // Default to beginner level
  
  const scoreValues = Object.values(scores).filter(val => typeof val === 'number') as number[];
  return scoreValues.length > 0 
    ? Math.round(scoreValues.reduce((sum, val) => sum + val, 0) / scoreValues.length) 
    : 1;
}

// Utility to check if a step requirement is met
function isStepCompleted(currentStep: string, requiredStep: string): boolean {
  // Step hierarchy from least to most progress
  const stepHierarchy = [
    'identity_created',
    'persona_selected',
    'profile_completed',
    'knowledge_assessed',
    'completed_basic_challenge',
    'completed_intermediate_challenge',
    'completed_advanced_challenge'
  ];
  
  const currentStepIndex = stepHierarchy.indexOf(currentStep);
  const requiredStepIndex = stepHierarchy.indexOf(requiredStep);
  
  // If step is not found, return false (safety check)
  if (currentStepIndex === -1 || requiredStepIndex === -1) return false;
  
  // Current step is equal to or higher than required step
  return currentStepIndex >= requiredStepIndex;
}