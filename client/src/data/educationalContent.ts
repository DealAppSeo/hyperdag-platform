import type { MultimodalContent } from "@/components/MultimodalTooltip";

export const educationalContent: Record<string, MultimodalContent> = {
  repIdBoost: {
    type: "text",
    title: "RepID Score Boost",
    description: "Earn RepID points through valuable contributions",
    textContent: "Your RepID score determines your influence in governance and unlocks rewards.\n\n• Complete referrals: +15 RepID\n• Share content: +10 RepID\n• Active participation: Bonus points\n\nHigher RepID unlocks voting rights, revenue sharing, and premium features.",
  },
  
  quadraticVoting: {
    type: "text",
    title: "Quadratic Voting Explained",
    description: "Democratic decision-making that prevents whale dominance",
    textContent: "Quadratic voting ensures fair governance by making additional votes exponentially more expensive.\n\n• 1st vote: 1 credit\n• 2nd vote: 4 credits\n• 3rd vote: 9 credits\n• 4th vote: 16 credits\n\nThis prevents wealthy users from dominating decisions while allowing passionate voters to express stronger preferences.",
  },
  
  referralRewards: {
    type: "text",
    title: "Referral Rewards System",
    description: "Earn 15 RepID for each successful referral",
    textContent: "When someone signs up using your referral link and completes onboarding:\n\n• You earn: +15 RepID\n• They receive: +5 RepID welcome bonus\n\nTrack your referral performance and unlock higher SBT tiers! Rewards are credited immediately upon completion.",
  },
  
  sbtTiers: {
    type: "text",
    title: "SBT Tier System",
    description: "Unlock benefits as you progress through reputation tiers",
    textContent: "Progress through 5 SBT tiers based on your referrals:\n\n• Bronze (0-4): Standard access\n• Silver (5-9): Priority support\n• Gold (10-19): Governance voting\n• Platinum (20-49): Revenue sharing\n• Diamond (50+): Maximum benefits\n\nYour tier unlocks permanent benefits and increases your influence in the Trinity ecosystem.",
  },
  
  zkpPrivacy: {
    type: "text",
    title: "Zero-Knowledge Proofs",
    description: "Prove your identity without revealing personal data",
    textContent: "ZKP technology lets you verify credentials without exposing sensitive information:\n\n• Age verification without revealing birthdate\n• Fund sufficiency without showing balance\n• Identity proof without personal details\n\nThis ensures maximum privacy while maintaining trust and security in the Trinity network.",
  },
  
  anfisRouting: {
    type: "text",
    title: "ANFIS AI Routing",
    description: "Intelligent AI provider selection for optimal cost and quality",
    textContent: "Our Adaptive Neuro-Fuzzy Inference System (ANFIS) automatically routes your requests to the best AI provider:\n\n• Analyzes cost, speed, and quality\n• Selects optimal provider in real-time\n• Achieves 70-85% cost savings\n• Maintains high response quality\n\nYou get the best results at the lowest price, automatically.",
  },
  
  shareLinks: {
    type: "text",
    title: "Share & Earn",
    description: "Generate shareable links and track your viral growth",
    textContent: "Create custom share links for social media platforms like Twitter, LinkedIn, and Facebook. When someone signs up via your link, you earn 10 RepID. Track views, shares, and conversions in your dashboard to measure your impact.",
  },
  
  bilateralLearning: {
    type: "text",
    title: "Bilateral Learning",
    description: "Mutual growth through human-AI collaboration",
    textContent: "In the Trinity ecosystem, both humans and AI learn from each other:\n\n• You provide feedback that improves AI performance\n• AI helps you discover your purpose and potential\n• Both parties benefit from the interaction\n• Creates exponential value through symbiosis\n\nThis bilateral approach ensures AI remains safe, honest, and aligned with human values while amplifying human capabilities.",
  },
  
  fourFactorAuth: {
    type: "text",
    title: "4-Factor Authentication",
    description: "Military-grade security with Web3 integration",
    textContent: "Our 4FA system provides maximum security through four independent layers:\n\n1. Password/Biometrics - Your personal credentials\n2. Web3 Wallet Signature - Cryptographic proof\n3. Email/SMS Verification - Secondary channel\n4. Proof-of-Life - Continuous authentication\n\nEach layer is independent, so compromising one doesn't break security. This multi-layered approach ensures your account is secure while maintaining a smooth user experience.",
  },
  
  viralGrowth: {
    type: "text",
    title: "Viral Growth Strategy",
    description: "Built-in network effects and gamification",
    textContent: "Every action in Trinity contributes to viral growth: referrals earn you RepID, shares boost visibility, and achievements unlock new tiers. We've optimized for a viral coefficient >1.2, meaning each user brings more than one new user on average.",
  },
};

// Helper function to get content by key
export function getEducationalContent(key: string): MultimodalContent | undefined {
  return educationalContent[key];
}

// Helper function to get all content keys
export function getEducationalContentKeys(): string[] {
  return Object.keys(educationalContent);
}
