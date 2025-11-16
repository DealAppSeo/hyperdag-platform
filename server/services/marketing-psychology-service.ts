/**
 * Marketing Psychology Service
 * 
 * This service implements the 9 psychological marketing principles to enhance:
 * 1. User onboarding
 * 2. Messaging and notifications
 * 3. Viral sharing mechanisms
 * 4. Feedback loops that improve user experience
 */

import { User } from '@shared/schema';
import { logger } from '../utils/logger';
import { sendEmail } from './email-service-helper';
import { sendSms } from './sms-service';

/**
 * Calculate profile completion percentage based on available user data
 */
function calculateProfileCompletion(user: User): number {
  // Total possible profile fields
  const totalFields = 8;
  let completedFields = 0;
  
  // Check each key field that constitutes a complete profile
  if (user.username) completedFields++;
  if (user.email) completedFields++;
  if (user.bio) completedFields++;
  if (user.skills && user.skills.length > 0) completedFields++;
  if (user.interests && user.interests.length > 0) completedFields++;
  if (user.walletAddress) completedFields++;
  if (user.persona) completedFields++;
  // Use optional chaining for fields that might not be directly on the user object
  if (user.settings?.social?.profileImage) completedFields++;
  
  // Calculate and return percentage (0-100)
  return Math.round((completedFields / totalFields) * 100);
}

/**
 * Benefit-focused messaging templates that convert features to benefits
 */
export const benefitMessages = {
  // Principle 1: Sell benefits, not features
  zkpAuthentication: {
    feature: "Zero-knowledge proof authentication",
    benefit: "Share your credentials without revealing sensitive data"
  },
  reputationSystem: {
    feature: "Reputation scoring system",
    benefit: "Unlock opportunities based on your verified skills, not just who you know"
  },
  decentralizedStorage: {
    feature: "IPFS decentralized storage",
    benefit: "Own your data forever - free from corporate control"
  },
  aiRecommendations: {
    feature: "AI-powered recommendations",
    benefit: "Discover perfect opportunities tailored to your unique skills"
  },
  blockchainVerification: {
    feature: "Blockchain verification",
    benefit: "Prove your expertise without exposing your identity"
  }
};

/**
 * Scarcity and urgency templates
 */
export const scarcityMessages = {
  // Principle 2: Scarcity drives demand
  earlyAdopter: {
    message: "Early adopter spots are limited - only 500 Pioneer badges remain!",
    deadline: null // Optional deadline
  },
  grantDeadline: (days: number) => ({
    message: `Only ${days} days left to apply for this grant`,
    deadline: new Date(Date.now() + days * 86400000)
  }),
  limitedSpots: (spots: number) => ({
    message: `Only ${spots} spots remaining for this opportunity`,
    urgency: spots < 5 ? 'high' : 'medium'
  }),
  // Principle 6: Give people a reason to act now
  timeBasedRewards: (multiplier: number) => ({
    message: `Early participants earn ${multiplier}x more reputation points`,
    deadline: new Date(Date.now() + 7 * 86400000)
  })
};

/**
 * Emotional connection messaging templates
 */
export const emotionalMessages = {
  // Principle 4: People connect with emotions, not products
  identityProtection: {
    story: "In a world where your data is constantly exploited, HyperDAG gives you the power to control your digital identity.",
    emotion: "security"
  },
  opportunityAccess: {
    story: "Talented people worldwide are overlooked because they lack connections. HyperDAG ensures your skills speak louder than your network.",
    emotion: "fairness"
  },
  communityBelonging: {
    story: "Join a community of forward-thinking builders creating the future of the web together.",
    emotion: "belonging"
  }
};

/**
 * Outcome-focused messaging templates
 */
export const outcomeMessages = {
  // Principle 5: People buy outcomes, not products
  careerAdvancement: {
    outcome: "Land your dream Web3 job with verified credentials that prove your expertise",
    before: "Struggling to stand out in job applications",
    after: "Instantly recognized for your validated skills"
  },
  projectSuccess: {
    outcome: "Build successful projects with the perfect team, matched by AI based on verified skills",
    before: "Wasting time with mismatched collaborators",
    after: "Working efficiently with complementary experts"
  },
  fundingSuccess: {
    outcome: "Get your projects funded through targeted grant matches and crowdfunding",
    before: "Endless applications to grants you aren't eligible for",
    after: "Focused applications with high success probability"
  }
};

/**
 * Social proof templates
 */
export const socialProofMessages = {
  // Principle 7: Always leverage social proof
  userTestimonial: (testimonial: any) => ({
    quote: testimonial.text,
    author: `${testimonial.name}, ${testimonial.title}`,
    outcome: testimonial.outcome
  }),
  userCount: (count: number) => ({
    message: `Join over ${count.toLocaleString()} professionals building Web3's future`,
    strength: count > 10000 ? 'strong' : 'growing'
  }),
  activityFeed: (activities: any[]) => ({
    message: "See what others are achieving on HyperDAG",
    activities: activities.map(a => ({
      action: a.action,
      outcome: a.outcome,
      timeAgo: a.timeAgo
    }))
  })
};

/**
 * Risk removal messaging
 */
export const riskRemovalMessages = {
  // Principle 9: Always Remove the Risk
  privacyGuarantee: {
    message: "Your privacy is guaranteed. Share credentials without revealing your identity.",
    objection: "I'm worried about privacy"
  },
  noLockIn: {
    message: "Your data belongs to you. Export anytime - no vendor lock-in.",
    objection: "I'm worried about being locked into another platform"
  },
  easyCancellation: {
    message: "Easy one-click account deletion at any time.",
    objection: "I don't want a long-term commitment"
  }
};

/**
 * Generate personalized onboarding message with benefit focus
 */
export function generatePersonalizedBenefitMessage(user: User) {
  const persona = user.persona || 'general';
  
  // Custom benefit mapping based on user persona
  const personaBenefits: Record<string, string> = {
    developer: "Build your reputation with privacy-protected credentials and showcase your expertise without revealing all your personal data",
    designer: "Showcase your creative portfolio with privacy controls that let you reveal only what you want to potential clients",
    influencer: "Connect your audience to opportunities while maintaining control over your personal information",
    general: "Protect your privacy while accessing career-advancing opportunities"
  };
  
  return {
    title: "Welcome to HyperDAG",
    benefitMessage: personaBenefits[persona] || personaBenefits.general,
    callToAction: "Complete your profile to unlock personalized opportunities"
  };
}

/**
 * Generate scarcity-based messaging for specific user actions
 */
export function generateScarcityMessage(action: string, user: User) {
  const messages: Record<string, any> = {
    completeProfile: {
      message: "Early profile completion rewards end soon - earn 2x reputation points!",
      deadline: new Date(Date.now() + 3 * 86400000)
    },
    connectWallet: {
      message: "First 1,000 wallet connections receive exclusive Pioneer NFT badge",
      remaining: 1000 - (Math.floor(Math.random() * 750)) // Simulated count for now
    },
    referFriends: {
      message: `Early referrers earn 5x the rewards - only during beta period`,
      deadline: new Date(Date.now() + 14 * 86400000)
    }
  };
  
  return messages[action] || {
    message: "Limited-time opportunity to get ahead on HyperDAG",
    deadline: new Date(Date.now() + 7 * 86400000)
  };
}

/**
 * Generate outcome-focused messaging based on user profile
 */
export function generateOutcomeMessage(user: User) {
  const persona = user.persona || 'general';
  // Use a calculated profile completion or default to 0
  const profileCompletion = calculateProfileCompletion(user) || 0;
  
  // If profile is less than 50% complete, focus on profile completion outcomes
  if (profileCompletion < 50) {
    return {
      before: "An incomplete profile that gets overlooked",
      after: "Stand out with a verified identity that opens doors",
      transformation: "Complete your profile to start your transformation"
    };
  }
  
  // Persona-specific outcomes
  const personaOutcomes: Record<string, any> = {
    developer: {
      before: "Applying to opportunities with just a resume and hope",
      after: "Automatically matched with perfect-fit projects based on verified skills",
      transformation: "Add your technical skills and connect your GitHub for verification"
    },
    designer: {
      before: "Portfolio lost in a sea of applicants",
      after: "Projects seeking exactly your aesthetic find you automatically",
      transformation: "Connect your design portfolio for AI-powered matching"
    },
    influencer: {
      before: "Manually searching for relevant partnership opportunities",
      after: "Brands and projects that align with your values find you",
      transformation: "Connect your social accounts to enable opportunity matching"
    },
    general: {
      before: "Struggling to find the right opportunities",
      after: "Opportunities find you based on your verified credentials",
      transformation: "Complete your verification steps to transform your experience"
    }
  };
  
  return personaOutcomes[persona] || personaOutcomes.general;
}

/**
 * Generate social proof messaging
 */
export function generateSocialProofMessage(context: string) {
  // These would ideally come from a database of real user actions
  const testimonials = [
    {
      context: "profile_completion",
      quote: "After completing my HyperDAG profile with verified credentials, I received 3 project offers in the first week!",
      author: "Alex K., Frontend Developer"
    },
    {
      context: "grant_matching",
      quote: "HyperDAG matched me with a grant I didn't even know existed. Application took 20 minutes, received $15k funding.",
      author: "Maya R., Blockchain Researcher"
    },
    {
      context: "team_formation",
      quote: "Found the perfect technical co-founder through HyperDAG's AI matching. Our skills complement each other perfectly.",
      author: "Jordan T., Product Designer"
    }
  ];
  
  // Filter testimonials relevant to the current context
  const relevantTestimonials = testimonials.filter(t => 
    t.context === context || context === 'general'
  );
  
  if (relevantTestimonials.length > 0) {
    // Return a random relevant testimonial
    const randomIndex = Math.floor(Math.random() * relevantTestimonials.length);
    return relevantTestimonials[randomIndex];
  }
  
  // Fallback message if no specific testimonials match
  return {
    context: "general",
    quote: "HyperDAG changed how I approach Web3 opportunities. Privacy-protected credentials opened doors I didn't know existed.",
    author: "Taylor M., Crypto Enthusiast"
  };
}

/**
 * Generate risk removal messaging based on user concerns
 */
export function generateRiskRemovalMessage(concern: string) {
  const concernMessages: Record<string, string> = {
    privacy: "Your data is yours. Our Zero-Knowledge Proofs let you prove credentials without revealing personal information.",
    complexity: "Start simple, grow advanced. Our step-by-step onboarding adapts to your technical comfort level.",
    value: "Only continue if you're getting value. No commitments, and you control what information you share.",
    security: "Built on military-grade cryptography. Your credentials can never be forged or compromised.",
    time: "Spend just 5 minutes setting up your profile. Our AI does the heavy lifting to find opportunities for you."
  };
  
  return concernMessages[concern] || "We've designed HyperDAG with your concerns in mind. Data control stays in your hands.";
}

/**
 * Create viral sharing message with user-specific referral code
 */
export function generateViralSharingMessage(user: User, referralCode: string) {
  return {
    shareMessage: `I'm using HyperDAG to find privacy-protected opportunities in Web3. Join with my code for 2x rewards: ${referralCode}`,
    benefits: [
      "You'll get 500 reputation points when they join",
      "They'll get 250 bonus points using your code",
      "Early referrers earn 5x rewards during beta"
    ],
    platforms: [
      {
        name: "Twitter",
        message: `Building my Web3 future with @HyperDAG_io - privacy-first credentials that open doors! Join with my code for bonus rewards: ${referralCode} #Web3 #Privacy #Blockchain`
      },
      {
        name: "LinkedIn",
        message: `I've joined HyperDAG - a privacy-focused professional network for Web3 collaboration. Their innovative approach to verified credentials while protecting personal data is impressive. Join with my referral code for bonus rewards: ${referralCode}`
      },
      {
        name: "Discord",
        message: `Just got into HyperDAG and it's changing how I approach Web3 opportunities. Use my code ${referralCode} to join and we both get bonus rewards!`
      }
    ]
  };
}

/**
 * Send notification with psychological marketing principles applied
 */
export async function sendEnhancedNotification(
  user: User, 
  type: 'onboarding' | 'opportunity' | 'account' | 'system',
  data: any
) {
  try {
    // Apply marketing principles based on notification type
    let subject = '';
    let message = '';
    let urgency = 'medium';
    
    switch (type) {
      case 'onboarding':
        // Combine benefit selling with outcome focus
        const benefit = benefitMessages[data.feature as keyof typeof benefitMessages];
        const outcome = generateOutcomeMessage(user);
        
        subject = `Your next step: ${data.action}`;
        message = `
          <div style="padding: 20px; max-width: 600px;">
            <h2>Complete this step to transform your experience</h2>
            <p><strong>From:</strong> ${outcome.before}</p>
            <p><strong>To:</strong> ${outcome.after}</p>
            <p>${benefit ? benefit.benefit : data.customBenefit}</p>
            
            ${data.deadline ? 
              `<p style="color: #f44336;"><strong>Limited time offer:</strong> Complete by ${new Date(data.deadline).toLocaleDateString()}</p>` 
              : ''}
            
            <p>${generateSocialProofMessage('onboarding').quote}</p>
            <p>- ${generateSocialProofMessage('onboarding').author}</p>
            
            <a href="${data.actionUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              ${data.actionText}
            </a>
          </div>
        `;
        urgency = 'high';
        break;
        
      case 'opportunity':
        // Combine scarcity with social proof
        const scarcity = data.deadline ? 
          scarcityMessages.grantDeadline(Math.ceil((new Date(data.deadline).getTime() - Date.now()) / 86400000)) : 
          scarcityMessages.limitedSpots(data.spots || 10);
          
        subject = `Exclusive opportunity: ${data.title}`;
        message = `
          <div style="padding: 20px; max-width: 600px;">
            <h2>${data.title}</h2>
            <p>${data.description}</p>
            
            <p style="color: #f44336;"><strong>${scarcity.message}</strong></p>
            
            <p>${generateSocialProofMessage('opportunity').quote}</p>
            <p>- ${generateSocialProofMessage('opportunity').author}</p>
            
            <p>${generateRiskRemovalMessage('value')}</p>
            
            <a href="${data.actionUrl}" style="display: inline-block; background-color: #3F51B5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
              View Opportunity
            </a>
          </div>
        `;
        urgency = 'medium';
        break;
        
      case 'account':
        // Focus on progress visualization
        subject = `${data.title || 'Account update'}`;
        message = `
          <div style="padding: 20px; max-width: 600px;">
            <h2>${data.title || 'Account update'}</h2>
            <p>${data.message}</p>
            
            ${data.progress ? 
              `<div style="background-color: #f1f1f1; border-radius: 4px; margin: 15px 0;">
                <div style="background-color: #4CAF50; width: ${data.progress}%; height: 20px; border-radius: 4px;"></div>
              </div>
              <p>${data.progress}% complete</p>` 
              : ''}
            
            ${data.actionUrl ? 
              `<a href="${data.actionUrl}" style="display: inline-block; background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                ${data.actionText || 'View Details'}
              </a>` 
              : ''}
          </div>
        `;
        urgency = 'low';
        break;
        
      case 'system':
      default:
        subject = data.title || 'HyperDAG Update';
        message = `
          <div style="padding: 20px; max-width: 600px;">
            <h2>${data.title || 'HyperDAG Update'}</h2>
            <p>${data.message}</p>
            
            ${data.actionUrl ? 
              `<a href="${data.actionUrl}" style="display: inline-block; background-color: #607D8B; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">
                ${data.actionText || 'Learn More'}
              </a>` 
              : ''}
          </div>
        `;
        urgency = 'low';
        break;
    }
    
    // Send notification based on user preferences
    let notificationSent = false;
    
    // Send email if user has email
    if (user.email) {
      const emailResult = await sendEmail(
        user.email,
        subject,
        message
      );
      
      if (emailResult) {
        notificationSent = true;
        logger.info(`[marketing-psychology] Enhanced email notification sent to ${user.email}`);
      }
    }
    
    // Send SMS if high urgency and user has phone in settings or via other means
    // First check if the user has a direct phone property, then fall back to settings
    const phoneNumber = user.phoneNumber || user.phone || 
      (user.settings && user.settings.communication ? 
      (user.settings.communication as any).phoneNumber : undefined);
    
    if (urgency === 'high' && phoneNumber) {
      // Create a plain text version
      const plainText = `${subject}\n\n${data.message || message.replace(/<[^>]*>?/gm, '')}\n\nTap to view: ${data.actionUrl}`;
      
      const smsResult = await sendSms(
        phoneNumber,
        plainText
      );
      
      if (smsResult) {
        notificationSent = true;
        logger.info(`[marketing-psychology] Enhanced SMS notification sent to ${phoneNumber}`);
      }
    }
    
    // In a real implementation, would also send push, in-app notification etc.
    
    return notificationSent;
  } catch (error) {
    logger.error('[marketing-psychology] Error sending enhanced notification:', error);
    return false;
  }
}

/**
 * Generate a viral sharing campaign for a specific achievement
 */
export function generateSharingCampaign(
  user: User, 
  achievement: string,
  referralCode: string
) {
  // Achievement-specific messaging that creates virality
  const achievementMessages: Record<string, any> = {
    project_funded: {
      title: "My project just got funded through HyperDAG!",
      detail: "Found the perfect grant and received funding within 2 weeks.",
      hashtags: ["FundedProject", "Web3Grants", "BuildWeb3"]
    },
    team_formed: {
      title: "Just assembled my dream team on HyperDAG!",
      detail: "AI matched us based on complementary verified skills.",
      hashtags: ["DreamTeam", "Web3Collaboration", "BuilderCommunity"]
    },
    reputation_milestone: {
      title: "Just hit a reputation milestone on HyperDAG!",
      detail: "My verified credentials are opening new doors.",
      hashtags: ["Web3Reputation", "BuildInPublic", "CareerMilestone"]
    },
    verified_credential: {
      title: "Just earned a verified credential on HyperDAG!",
      detail: "Zero-knowledge proofs let me prove my expertise while protecting my privacy.",
      hashtags: ["VerifiedSkills", "PrivacyFirst", "Web3Career"]
    }
  };
  
  const message = achievementMessages[achievement] || {
    title: "I'm building my Web3 future on HyperDAG!",
    detail: "Privacy-protected credentials that open doors.",
    hashtags: ["Web3", "PrivacyFirst", "BuildWeb3"]
  };
  
  // Generate platform-specific sharing content
  return {
    achievement,
    referralCode,
    shareLink: `https://hyperdag.org/join?ref=${referralCode}`,
    platforms: {
      twitter: {
        text: `${message.title} ${message.detail} Join me on HyperDAG with my code: ${referralCode} ${message.hashtags.map(h => `#${h}`).join(' ')}`,
        url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${message.title} ${message.detail} Join me on HyperDAG with my code: ${referralCode} ${message.hashtags.map(h => `#${h}`).join(' ')}`)}`
      },
      linkedin: {
        text: `${message.title}\n\n${message.detail}\n\nI'm using HyperDAG to build my Web3 future with privacy-protected credentials. Join with my referral code for bonus rewards: ${referralCode}`,
        url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://hyperdag.org/join?ref=${referralCode}`)}`
      },
      facebook: {
        text: `${message.title}\n\n${message.detail}`,
        url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://hyperdag.org/join?ref=${referralCode}`)}`
      },
      email: {
        subject: `Join me on HyperDAG - ${message.title}`,
        body: `Hey,\n\n${message.title}\n\n${message.detail}\n\nHyperDAG is changing how we collaborate in Web3 while protecting our privacy.\n\nJoin with my referral code for bonus rewards: ${referralCode}\n\nhttps://hyperdag.org/join?ref=${referralCode}`,
        url: `mailto:?subject=${encodeURIComponent(`Join me on HyperDAG - ${message.title}`)}&body=${encodeURIComponent(`Hey,\n\n${message.title}\n\n${message.detail}\n\nHyperDAG is changing how we collaborate in Web3 while protecting our privacy.\n\nJoin with my referral code for bonus rewards: ${referralCode}\n\nhttps://hyperdag.org/join?ref=${referralCode}`)}`
      }
    },
    rewards: {
      referrer: "500 reputation points for each successful referral",
      referee: "250 bonus reputation points for joining with a referral code"
    },
    // Track sharing metrics
    analytics: {
      shareId: `share_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      achievementType: achievement,
      timestamp: new Date().toISOString()
    }
  };
}

/**
 * Track user behavior to optimize messaging
 */
export function trackUserResponse(
  userId: string,
  messageId: string,
  action: 'opened' | 'clicked' | 'shared' | 'ignored'
) {
  // In a real implementation, this would store the data in the database
  logger.info(`[marketing-psychology] User ${userId} ${action} message ${messageId}`);
  
  // This would feed into a feedback loop to optimize future messaging
  return {
    userId,
    messageId,
    action,
    timestamp: new Date().toISOString(),
    success: true
  };
}