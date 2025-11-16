/**
 * Client-side utilities for referrals
 */

/**
 * Generate a temporary referral code for new users
 * This is just for visual mockup - real codes are generated server-side
 * @param username Username to base the code on
 * @returns A referral code
 */
export function generateReferralCode(username: string = 'user'): string {
  const prefix = username.slice(0, 4).toUpperCase();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${random}`;
}

/**
 * Calculate profile completion percentage
 * @param user User object
 * @returns Completion percentage (0-100)
 */
export function calculateProfileCompletion(user: any): number {
  if (!user) return 0;
  
  // Define total fields that constitute a complete profile
  const totalFields = 8;
  let completedFields = 0;
  
  // Check each field
  if (user.username) completedFields++;
  if (user.email) completedFields++;
  if (user.bio) completedFields++;
  if (user.skills && Array.isArray(user.skills) && user.skills.length > 0) completedFields++;
  if (user.interests && Array.isArray(user.interests) && user.interests.length > 0) completedFields++;
  if (user.walletAddress) completedFields++;
  if (user.persona) completedFields++;
  
  // Check various profile image fields that might exist
  if (user.profileImageUrl || 
      (user.settings && user.settings.profile && user.settings.profile.image) || 
      (user.settings && user.settings.social && user.settings.social.profileImage)) {
    completedFields++;
  }
  
  // Calculate percentage
  return Math.round((completedFields / totalFields) * 100);
}

/**
 * Get reward multiplier based on user's status
 * Early adopters get higher multipliers
 * @param user User object
 * @returns Reward multiplier (1-5)
 */
export function getRewardMultiplier(user: any): number {
  // Early adopter status defaults to 5x rewards
  // This would be determined by server-side logic in a real implementation
  return 5;
}

/**
 * Get appropriate milestone for a user
 * @param profileCompletion Profile completion percentage
 * @returns Object with milestone details
 */
export function getUserMilestone(profileCompletion: number): {
  title: string;
  description: string;
  progress: number;
  nextStep: string;
  reward: string;
} {
  if (profileCompletion < 25) {
    return {
      title: "Profile Pioneer",
      description: "Start your journey",
      progress: profileCompletion,
      nextStep: "Complete your basic profile information",
      reward: "100 reputation points"
    };
  } else if (profileCompletion < 50) {
    return {
      title: "Identity Established",
      description: "Building your presence",
      progress: profileCompletion,
      nextStep: "Add your skills and interests",
      reward: "250 reputation points"
    };
  } else if (profileCompletion < 75) {
    return {
      title: "Credential Verified",
      description: "Your expertise is recognized",
      progress: profileCompletion,
      nextStep: "Connect your wallet for full verification",
      reward: "500 reputation points + Access to advanced features"
    };
  } else if (profileCompletion < 100) {
    return {
      title: "Advanced Identity",
      description: "Nearly complete",
      progress: profileCompletion,
      nextStep: "Finish remaining profile sections",
      reward: "750 reputation points + Team Formation access"
    };
  } else {
    return {
      title: "Identity Mastery",
      description: "Full profile complete!",
      progress: 100,
      nextStep: "Share your success with others",
      reward: "1000 reputation points + Early Adopter badge"
    };
  }
}