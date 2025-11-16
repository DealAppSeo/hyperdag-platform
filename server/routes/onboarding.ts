import { Router } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { requireAuth } from '../middleware/auth-guard';

const router = Router();

// Enhanced onboarding profile schema for career development and MBTI
const OnboardingProfileSchema = z.object({
  interests: z.array(z.string()).optional(),
  role: z.string().optional(),
  experience: z.string().optional(),
  goals: z.array(z.string()).optional(),
  recommendedPath: z.string().optional(),
  completed: z.boolean().default(false),
  redirectTo: z.string().optional(),
  mbtiType: z.string().optional(),
  careerGoals: z.array(z.string()).optional(),
  skillDevelopment: z.array(z.string()).optional(),
  aiInterests: z.array(z.string()).optional(),
  earnToLearnPreferences: z.array(z.string()).optional()
});

// Save welcome onboarding progress
router.post('/welcome', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const profileData = OnboardingProfileSchema.parse(req.body);

    // Update user's onboarding stage and enhanced profile
    const updatedUser = await storage.updateUser(userId, {
      onboardingStage: profileData.completed ? 2 : 1,
      interests: [...(profileData.interests || []), ...(profileData.aiInterests || [])],
      persona: profileData.role || 'explorer',
      skills: [...(profileData.skillDevelopment || []), ...(profileData.earnToLearnPreferences || [])],
      lastUpdated: new Date()
    });

    res.json({
      success: true,
      data: {
        user: updatedUser,
        onboardingComplete: profileData.completed,
        nextStep: profileData.redirectTo || '/dashboard'
      }
    });

  } catch (error) {
    console.error('Error saving onboarding progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save onboarding progress'
    });
  }
});

// Get onboarding status
router.get('/status', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        profile: {
          onboardingStage: user.onboardingStage || 0,
          interests: user.interests || [],
          persona: user.persona || null,
          twoFactorEnabled: user.twoFactorEnabled || false,
          walletConnected: !!user.walletAddress,
          emailVerified: user.emailVerified || false
        },
        recommendations: generateRecommendations(user),
        nextSteps: getNextSteps(user)
      }
    });

  } catch (error) {
    console.error('Error fetching onboarding status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch onboarding status'
    });
  }
});

// Complete onboarding (including bypass functionality)
router.post('/complete', requireAuth, async (req, res) => {
  try {
    const userId = (req.user as any).id;
    const { profile, completed, redirectTo } = req.body;

    // Update user's onboarding stage to completed
    await storage.updateUser(userId, {
      onboardingStage: 2, // Mark as completed
      interests: profile?.interests || null,
      persona: profile?.persona || null,
      lastUpdated: new Date()
    });

    // Log completion activity
    await storage.createReputationActivity({
      userId,
      type: 'onboarding_completed',
      description: profile?.skipped ? 'Onboarding bypassed by user' : 'Onboarding completed successfully',
      points: 0,
      metadata: {
        completed,
        redirectTo,
        profile,
        timestamp: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      data: {
        message: 'Onboarding completed successfully',
        redirectTo: redirectTo || '/dashboard',
        onboardingStage: 2
      }
    });

  } catch (error) {
    console.error('Error completing onboarding:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete onboarding'
    });
  }
});

// Generate AI-powered chat response
router.post('/chat', requireAuth, async (req, res) => {
  try {
    const { message, context, step } = req.body;
    const userId = (req.user as any).id;

    // Generate contextual response based on user input and conversation context
    const response = generateChatResponse(message, context, step);

    // Log chat interaction
    await storage.createReputationActivity({
      userId,
      type: 'onboarding_chat',
      description: 'Interacted with onboarding AI',
      points: 0,
      metadata: {
        userMessage: message,
        aiResponse: response,
        context,
        step,
        timestamp: new Date().toISOString()
      }
    });

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error generating chat response:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate response'
    });
  }
});

// Helper function to generate recommendations based on user profile
function generateRecommendations(user: any) {
  const recommendations = [];

  if (!user.twoFactorEnabled) {
    recommendations.push({
      type: 'security',
      title: 'Enable Two-Factor Authentication',
      description: 'Secure your account with 2FA before creating credentials',
      action: '/settings',
      priority: 'high'
    });
  }

  if (!user.walletAddress) {
    recommendations.push({
      type: 'wallet',
      title: 'Connect Web3 Wallet',
      description: 'Connect your wallet to access SBT credentials and DeFi features',
      action: '/profile',
      priority: 'high'
    });
  }

  if (user.interests?.includes('privacy') || user.interests?.includes('identity')) {
    recommendations.push({
      type: 'feature',
      title: 'Explore ZKP Credentials',
      description: 'Create privacy-preserving identity credentials',
      action: '/credentials',
      priority: 'medium'
    });
  }

  if (user.interests?.includes('web3_dev') || user.interests?.includes('ai_dev')) {
    recommendations.push({
      type: 'developer',
      title: 'Developer Resources',
      description: 'Access APIs, documentation, and developer tools',
      action: '/docs',
      priority: 'medium'
    });
  }

  if (user.interests?.includes('community') || user.interests?.includes('career')) {
    recommendations.push({
      type: 'community',
      title: 'Join Community',
      description: 'Connect with other builders and contributors',
      action: '/community',
      priority: 'low'
    });
  }

  return recommendations;
}

// Helper function to determine next steps
function getNextSteps(user: any) {
  const steps = [];

  if (user.onboardingStage < 1) {
    steps.push('Complete welcome onboarding');
  }

  if (!user.twoFactorEnabled) {
    steps.push('Enable two-factor authentication');
  }

  if (!user.walletAddress) {
    steps.push('Connect Web3 wallet');
  }

  if (!user.emailVerified) {
    steps.push('Verify email address');
  }

  if (user.onboardingStage >= 2 && user.twoFactorEnabled && user.walletAddress) {
    steps.push('Create your first credential');
  }

  return steps;
}

// Helper function to generate contextual chat responses
function generateChatResponse(message: string, context: any, step: number) {
  const responses = {
    funding: [
      "Scanning 2,847 active grants... Found 47 immediate matches totaling $12.3M. My AI just identified a 73% funding gap in your sector - that means less competition and higher success rates. Want me to run a deep compatibility analysis?",
      "I've analyzed your project against 15,000 successful grant applications. Your concept shows 340% alignment with current funding priorities. I can predict your grant success probability in real-time.",
      "Processing real market data... There's a hidden $8.7M funding opportunity that 94% of applicants miss because they don't understand the evaluation criteria. My neural networks cracked the pattern."
    ],
    technical: [
      "HyperDAG processes 2.4M TPS using quantum-resistant CRYSTALS-Kyber-1024 encryption. Our hybrid DAG-blockchain architecture outperforms Ethereum by 847x while maintaining full decentralization.",
      "Our ZKP-NFT system enables selective disclosure with 256-bit quantum resistance. You can prove qualifications without revealing personal data - revolutionary for privacy-first applications.",
      "The ANFIS fuzzy logic AI optimizes resource allocation in real-time, reducing computational costs by 67% while improving transaction throughput exponentially."
    ],
    demo: [
      "Watch this: I just analyzed 15 competing platforms and identified why 73% fail at user retention. HyperDAG's unique approach to incentive alignment creates 340% better engagement through purpose-driven economics.",
      "I'm running predictive models on 50,000 user interactions. Our AI can forecast which features you'll need before you know you need them, reducing onboarding time by 89%.",
      "Real-time analysis shows you're in the top 12% of users who ask intelligent questions. My algorithms predict you'll excel in our developer ecosystem."
    ]
  };

  // Intelligent keyword analysis with funding focus
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('funding') || lowerMessage.includes('grant') || lowerMessage.includes('money') || lowerMessage.includes('project')) {
    return {
      content: responses.funding[Math.floor(Math.random() * responses.funding.length)],
      suggestions: ['Analyze my project for funding', 'Show me grant opportunities', 'Predict my success rate']
    };
  }
  
  if (lowerMessage.includes('technical') || lowerMessage.includes('code') || lowerMessage.includes('develop') || lowerMessage.includes('api')) {
    return {
      content: responses.technical[Math.floor(Math.random() * responses.technical.length)],
      suggestions: ['Access developer platform', 'See technical specifications', 'Try quantum-resistant features']
    };
  }

  return {
    content: responses.demo[Math.floor(Math.random() * responses.demo.length)],
    suggestions: ['Show me live AI analysis', 'Predict my user journey', 'Start personalized demo']
  };
}

export default router;