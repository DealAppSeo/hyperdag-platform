/**
 * Viral Loop Service
 * 
 * This service implements the psychological marketing principles to create
 * a virtuous cycle of user engagement, sharing, and growth for HyperDAG.
 * 
 * The service:
 * 1. Enhances onboarding with personalized, benefit-focused messaging
 * 2. Creates urgency through scarcity and FOMO
 * 3. Focuses on outcomes, not features
 * 4. Facilitates viral sharing through strategic incentives
 * 5. Uses social proof to increase trust and conversion
 * 6. Eliminates objections through risk removal
 * 7. Measures and optimizes all communications
 */

import { User } from '@shared/schema';
import { logger } from '../utils/logger';
import { sendEmail } from './email-service';
import { sendSms } from './sms-service';
import { generateReferralCode } from '../utils/referral-utils';

// Benefit-focused messaging templates by persona type
const BENEFIT_MESSAGES = {
  developer: {
    headline: "Build your reputation with privacy-protected credentials",
    subheadline: "Showcase your expertise without revealing all your personal data",
    callToAction: "Connect your GitHub to verify your skills and multiply your rewards"
  },
  designer: {
    headline: "Create a privacy-first professional profile",
    subheadline: "Control exactly which parts of your design portfolio are visible to whom",
    callToAction: "Upload your design samples to attract perfect-fit projects"
  },
  influencer: {
    headline: "Connect your audience to opportunities that matter",
    subheadline: "Build a reputation as a connector while maintaining complete privacy control",
    callToAction: "Link your social accounts to unlock community rewards"
  },
  general: {
    headline: "Where privacy meets opportunity",
    subheadline: "Collaborate, build, and fund projects without sacrificing your privacy",
    callToAction: "Complete your profile to unlock personalized opportunities"
  }
};

// Outcome-based messaging to replace feature descriptions
const OUTCOME_MESSAGES = {
  reputation: {
    before: "Struggling to prove your skills without exposing personal details",
    after: "Getting opportunities based on verified credentials, not who you know"
  },
  referrals: {
    before: "Helping friends without receiving recognition or rewards",
    after: "Building your own network of collaborators while earning reputation points"
  },
  grants: {
    before: "Spending hours applying to grants with low success rates",
    after: "Getting matched only with grants you're qualified for, saving time and increasing success"
  },
  privacy: {
    before: "Choosing between opportunity and privacy",
    after: "Having both - verified credentials without revealing sensitive information"
  }
};

// Urgency and scarcity messaging to drive immediate action
const URGENCY_MESSAGES = {
  earlyAdopter: "Early adopters receive 5x reputation multiplier - limited time only!",
  limitedSpots: (remaining: number) => `Only ${remaining} spots remaining at this reputation tier`,
  deadlineApproaching: (days: number) => `${days} days left to secure early adopter benefits`,
  expiringRewards: "2x referral bonus expires soon - refer friends now to maximize rewards"
};

// Social proof messaging to enhance trust
const SOCIAL_PROOF_MESSAGING = {
  recentActivity: [
    "Alex K. just verified their blockchain development skills and earned 500 reputation points",
    "Taylor S. received their first grant match worth $15,000",
    "Jordan M. connected their GitHub and found 3 collaboration opportunities",
    "Morgan W. earned a Privacy Expert badge after completing verification"
  ],
  testimonials: [
    {
      quote: "After connecting my GitHub to HyperDAG, I received two collaboration offers within 24 hours.",
      author: "Devon, Blockchain Developer"
    },
    {
      quote: "The grant matching algorithm found a perfect-fit opportunity I would have never discovered on my own.",
      author: "Riley, Researcher"
    },
    {
      quote: "I built a team of experts without ever exposing my personal data - revolutionary for Web3 projects.",
      author: "Alex, Project Lead"
    }
  ],
  statistics: {
    averageReputationIncrease: "350% reputation growth in first 30 days",
    averageConnectionsFormed: "5 meaningful connections in first week",
    grantMatchSuccess: "37% grant application success rate (vs. 3% industry average)",
    privacyPreservation: "100% of credentials verifiable without exposing personal details"
  }
};

// Risk removal messaging to overcome objections
const RISK_REMOVAL_MESSAGING = {
  dataControl: "Your data stays yours - export or delete anytime with one click",
  privacyGuarantee: "Zero-knowledge proofs ensure your privacy is mathematically guaranteed",
  noLockIn: "No vendor lock-in - all your reputation credentials are portable via Web3 standards",
  satisfaction: "See value within 14 days or we'll help you find a better solution"
};

/**
 * Generate a personalized viral sharing campaign
 * @param user User object
 * @param achievement Achievement type that triggered sharing opportunity
 * @returns Sharing campaign with personalized messaging
 */
export function generateViralSharingCampaign(user: User, achievement: string) {
  // Generate a referral code if user doesn't have one
  const referralCode = user.referralCode || generateReferralCode(user.username);
  
  // Base URL for referrals
  const baseUrl = 'https://hyperdag.org/join';
  const referralUrl = `${baseUrl}?ref=${referralCode}`;
  
  // Sharable achievement descriptions
  const achievements = {
    profile_completed: {
      title: "I just built my privacy-protected profile on HyperDAG!",
      description: "Now I can share credentials without revealing personal data."
    },
    skill_verified: {
      title: "Just verified my Web3 skills on HyperDAG!",
      description: "Zero-knowledge proofs let me prove expertise while protecting my privacy."
    },
    grant_matched: {
      title: "Found the perfect grant opportunity through HyperDAG!",
      description: "The AI matching algorithm found exactly what I was looking for."
    },
    team_formed: {
      title: "Just assembled a dream team on HyperDAG!",
      description: "Connected with complementary experts while maintaining privacy control."
    },
    badge_earned: {
      title: "Just earned a new credential badge on HyperDAG!",
      description: "Building my Web3 reputation while keeping my personal data private."
    }
  };
  
  // Get achievement content or use default
  const achievementContent = achievements[achievement as keyof typeof achievements] || {
    title: "I'm building on HyperDAG!",
    description: "Where privacy meets opportunity in Web3."
  };
  
  // Persona-based incentives to encourage sharing
  const sharingIncentives = {
    developer: {
      referrerBonus: "500 reputation points + early access to new technical features",
      friendBonus: "250 reputation points + private alpha access"
    },
    designer: {
      referrerBonus: "500 reputation points + featured showcase placement",
      friendBonus: "250 reputation points + design resource access"
    },
    influencer: {
      referrerBonus: "500 reputation points + community leadership badge",
      friendBonus: "250 reputation points + collaboration opportunities"
    },
    general: {
      referrerBonus: "500 reputation points + early access privileges",
      friendBonus: "250 reputation points + welcome bonus"
    }
  };
  
  // Get persona-specific incentives or use default
  const persona = user.persona || 'general';
  const incentives = sharingIncentives[persona as keyof typeof sharingIncentives] || 
                    sharingIncentives.general;
  
  // Platform-specific sharing templates
  return {
    achievement,
    referralCode,
    referralUrl,
    shareTitle: achievementContent.title,
    shareDescription: achievementContent.description,
    incentives,
    platforms: {
      twitter: {
        text: `${achievementContent.title} ${achievementContent.description} Join me on @HyperDAG with my code: ${referralCode} #Web3 #Privacy`,
        url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${achievementContent.title} ${achievementContent.description} Join me on HyperDAG with my code: ${referralCode} #Web3 #Privacy`)}&url=${encodeURIComponent(referralUrl)}`
      },
      linkedin: {
        text: `${achievementContent.title}\n\n${achievementContent.description}\n\nI'm using HyperDAG to build my Web3 future with privacy-protected credentials.\n\nJoin with my referral code for bonus rewards: ${referralCode}`,
        url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`
      },
      discord: {
        text: `${achievementContent.title}\n${achievementContent.description}\n\nJoin me on HyperDAG with my referral code: ${referralCode}\nWe'll both get bonus rewards!\n${referralUrl}`
      },
      email: {
        subject: `Join me on HyperDAG - ${achievementContent.title}`,
        body: `Hey,\n\n${achievementContent.title}\n\n${achievementContent.description}\n\nHyperDAG is changing how we collaborate in Web3 while protecting our privacy.\n\nJoin with my referral code for bonus rewards: ${referralCode}\n\n${referralUrl}`
      }
    },
    // Social proof element to boost conversion
    socialProof: {
      userCount: "5,000+ professionals already on HyperDAG",
      testimonial: SOCIAL_PROOF_MESSAGING.testimonials[
        Math.floor(Math.random() * SOCIAL_PROOF_MESSAGING.testimonials.length)
      ]
    }
  };
}

/**
 * Generate personalized onboarding message with benefit focus and transformation
 * @param user User to generate message for
 * @returns Personalized message using marketing psychology
 */
export function generateOnboardingMessage(user: User) {
  const persona = user.persona || 'general';
  
  // Get persona-specific benefit messaging
  const benefitMessage = BENEFIT_MESSAGES[persona as keyof typeof BENEFIT_MESSAGES] ||
                        BENEFIT_MESSAGES.general;
  
  // Calculate profile completion for transformation focus
  const profileCompletion = calculateProfileCompletion(user);
  
  // Social proof elements
  const socialProof = SOCIAL_PROOF_MESSAGING.testimonials[
    Math.floor(Math.random() * SOCIAL_PROOF_MESSAGING.testimonials.length)
  ];
  
  // Urgency element based on profile completion
  let urgency = '';
  if (profileCompletion < 30) {
    urgency = URGENCY_MESSAGES.earlyAdopter;
  } else if (profileCompletion < 70) {
    urgency = URGENCY_MESSAGES.limitedSpots(500 - Math.floor(Math.random() * 200));
  } else {
    urgency = URGENCY_MESSAGES.deadlineApproaching(7);
  }
  
  // Transformation outcome for this user persona
  const transformationOutcome = OUTCOME_MESSAGES[
    persona === 'developer' ? 'reputation' :
    persona === 'designer' ? 'privacy' :
    persona === 'influencer' ? 'referrals' : 'grants'
  ];
  
  // Risk removal message for objection handling
  const riskRemoval = [
    RISK_REMOVAL_MESSAGING.privacyGuarantee,
    RISK_REMOVAL_MESSAGING.dataControl
  ].join(' ');
  
  // Combine all elements into a cohesive message
  return {
    headline: benefitMessage.headline,
    subheadline: benefitMessage.subheadline,
    profileCompletion,
    progressBar: {
      percentage: profileCompletion,
      nextMilestone: profileCompletion < 50 ? 50 : profileCompletion < 75 ? 75 : 100,
      rewardAtNextMilestone: profileCompletion < 50 ? 
        "Unlock grant matching at 50%" : 
        profileCompletion < 75 ? 
        "Unlock team formation at 75%" : 
        "Unlock maximum reputation at 100%"
    },
    transformation: {
      before: transformationOutcome.before,
      after: transformationOutcome.after
    },
    callToAction: {
      primary: benefitMessage.callToAction,
      urgency
    },
    socialProof: {
      quote: socialProof.quote,
      author: socialProof.author
    },
    riskRemoval
  };
}

/**
 * Calculate profile completion percentage
 * @param user User to calculate completion for
 * @returns Percentage of profile completion (0-100)
 */
function calculateProfileCompletion(user: User): number {
  const totalFields = 8;
  let completedFields = 0;
  
  // Basic fields
  if (user.username) completedFields++;
  if (user.email) completedFields++;
  if (user.bio) completedFields++;
  if (user.skills && user.skills.length > 0) completedFields++;
  if (user.interests && user.interests.length > 0) completedFields++;
  if (user.walletAddress) completedFields++;
  if (user.persona) completedFields++;
  
  // Advanced fields (optional chaining for safety)
  const settings = user.settings as any || {};
  if (settings.persona?.primary) completedFields++;
  
  return Math.round((completedFields / totalFields) * 100);
}

/**
 * Generate personalized milestone achievements to encourage progression
 * @param user User to generate milestones for
 * @returns Milestone data with rewards and sharing opportunities
 */
export function generateProgressMilestones(user: User) {
  const profileCompletion = calculateProfileCompletion(user);
  
  // Define progression milestones
  const milestones = [
    {
      id: "profile_25",
      title: "Profile Pioneer",
      description: "Complete 25% of your profile",
      threshold: 25,
      completed: profileCompletion >= 25,
      reward: "100 reputation points",
      sharing: profileCompletion >= 25 ? generateViralSharingCampaign(user, "profile_started") : null
    },
    {
      id: "profile_50",
      title: "Identity Established",
      description: "Complete 50% of your profile",
      threshold: 50,
      completed: profileCompletion >= 50,
      reward: "250 reputation points + Grant Matching access",
      sharing: profileCompletion >= 50 ? generateViralSharingCampaign(user, "profile_halfway") : null
    },
    {
      id: "profile_75",
      title: "Credential Verified",
      description: "Complete 75% of your profile and verify at least one credential",
      threshold: 75,
      completed: profileCompletion >= 75,
      reward: "500 reputation points + Team Formation access",
      sharing: profileCompletion >= 75 ? generateViralSharingCampaign(user, "profile_verified") : null
    },
    {
      id: "profile_100",
      title: "Identity Mastery",
      description: "Complete 100% of your profile",
      threshold: 100,
      completed: profileCompletion >= 100,
      reward: "1000 reputation points + Early Adopter badge",
      sharing: profileCompletion >= 100 ? generateViralSharingCampaign(user, "profile_completed") : null
    }
  ];
  
  // Add additional milestones based on user activity
  if (user.referralCode) {
    milestones.push({
      id: "first_referral",
      title: "Community Builder",
      description: "Refer your first friend to HyperDAG",
      threshold: null,
      completed: false, // This would be calculated from actual referral data
      reward: "250 reputation points per successful referral",
      nextStep: "Share your unique referral link with friends interested in Web3"
    });
  }
  
  // Focus the user on the next milestone to create a clear path
  const nextMilestone = milestones.find(m => !m.completed);
  
  return {
    currentCompletion: profileCompletion,
    milestones,
    nextMilestone,
    // Add social proof to the milestone system
    socialProof: {
      statistic: `${Math.floor(Math.random() * 30) + 70}% of users who complete their profile receive collaboration opportunities within 14 days`,
      testimonial: SOCIAL_PROOF_MESSAGING.testimonials[
        Math.floor(Math.random() * SOCIAL_PROOF_MESSAGING.testimonials.length)
      ]
    }
  };
}

/**
 * Generate personalized viral referral messaging to encourage sharing
 * @param user User to generate referral messaging for
 * @returns Personalized referral program details with marketing psychology principles
 */
export function generateReferralProgram(user: User) {
  const referralCode = user.referralCode || generateReferralCode(user.username);
  const baseUrl = 'https://hyperdag.org/join';
  const referralUrl = `${baseUrl}?ref=${referralCode}`;
  
  // Persona-specific incentives
  const persona = user.persona || 'general';
  
  // Apply scarcity and urgency to referral program
  const earlyAdopterMultiplier = 5;
  const timeRemaining = Math.floor(Math.random() * 14) + 7; // Random days remaining for early rewards
  
  // Generate platform-specific sharing messages
  const shareMessages = {
    developer: `I'm building my Web3 reputation with privacy-protected ZKPs on HyperDAG. Join with my code ${referralCode} to boost your reputation. #Web3 #Privacy #BuildWeb3`,
    designer: `Creating a privacy-first portfolio on HyperDAG that lets me control what I share and with whom. Join with my code ${referralCode} for bonus rewards. #Design #Web3 #PrivacyFirst`,
    influencer: `Connecting my community to Web3 opportunities while maintaining privacy with HyperDAG. Use my code ${referralCode} for bonus reputation. #Web3 #Community #BuildWeb3`,
    general: `Where privacy meets opportunity - I'm on HyperDAG building my Web3 future. Join with my code ${referralCode} for bonus rewards. #Web3 #Privacy #Blockchain`
  };
  
  // Use persona-specific message or default
  const shareMessage = shareMessages[persona as keyof typeof shareMessages] || 
                      shareMessages.general;
  
  // Define the reward structure with clear benefits
  const rewardTiers = [
    {
      tier: 1,
      count: "1-5 referrals",
      reward: "500 reputation points per referral",
      bonusMultiplier: earlyAdopterMultiplier,
      bonusReward: `${500 * earlyAdopterMultiplier} reputation points during early adopter period`
    },
    {
      tier: 2,
      count: "6-15 referrals",
      reward: "750 reputation points per referral",
      bonusMultiplier: earlyAdopterMultiplier,
      bonusReward: `${750 * earlyAdopterMultiplier} reputation points during early adopter period`
    },
    {
      tier: 3,
      count: "16+ referrals",
      reward: "1000 reputation points per referral + Community Leader badge",
      bonusMultiplier: earlyAdopterMultiplier,
      bonusReward: `${1000 * earlyAdopterMultiplier} reputation points during early adopter period`
    }
  ];
  
  // Add social proof for increased credibility
  const socialProof = {
    userTrend: "Users with 5+ referrals receive 3x more collaboration opportunities",
    testimonal: SOCIAL_PROOF_MESSAGING.testimonials[
      Math.floor(Math.random() * SOCIAL_PROOF_MESSAGING.testimonials.length)
    ],
    referralAverage: "The average HyperDAG user refers 3.7 colleagues within their first month"
  };
  
  return {
    referralCode,
    referralUrl,
    shareMessage,
    platforms: {
      twitter: {
        text: shareMessage,
        url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(referralUrl)}`
      },
      linkedin: {
        text: `I've joined HyperDAG - a privacy-focused platform for Web3 collaboration.\n\n${shareMessage.replace('#', '').replace('#', '').replace('#', '')}`,
        url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`
      },
      email: {
        subject: "Join me on HyperDAG for privacy-focused Web3 collaboration",
        body: `Hey,\n\nI'm using HyperDAG to build my Web3 reputation and find collaboration opportunities while maintaining privacy control.\n\nJoin with my referral code for bonus rewards: ${referralCode}\n\n${referralUrl}`
      }
    },
    rewardStructure: {
      referrerRewards: rewardTiers,
      friendReward: "Your friends get 250 reputation points for joining with your code",
      urgencyMessage: `Early adopter ${earlyAdopterMultiplier}x multiplier expires in ${timeRemaining} days!`
    },
    socialProof,
    // Add risk removal to preemptively handle objections
    riskRemoval: RISK_REMOVAL_MESSAGING.privacyGuarantee
  };
}