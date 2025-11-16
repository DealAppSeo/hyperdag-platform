/**
 * Mock implementation of OpenAI service functions for development or when API is unavailable
 * This provides consistent responses for the frontend to use when the real OpenAI API is not accessible
 */

// Mock project recommendations
export function getMockProjectRecommendations(): any[] {
  return [
    {
      projectId: 2,
      matchScore: 95,
      reason: "This project aligns perfectly with your blockchain interests and developer skills. The focus on education and technical training makes it an ideal match for your profile."
    },
    {
      projectId: 3,
      matchScore: 82,
      reason: "Your interest in decentralization and web3 technologies makes this project a good fit. Your collaborative skills would be valuable for this community-driven initiative."
    },
    {
      projectId: 1,
      matchScore: 78,
      reason: "With your blockchain expertise and communication skills, you could make meaningful contributions to this project. It provides opportunities to expand your web3 knowledge."
    }
  ];
}

// Mock project idea generation
export function getMockProjectIdeas(): any[] {
  return [
    {
      title: "DecentralLearn",
      description: "An educational platform using blockchain to verify course completion and issue NFT credentials. Helps professionals showcase verified skills on-chain.",
      categories: ["Education", "NFT", "DID"],
      requiredRoles: ["Smart Contract Developer", "UI/UX Designer", "Content Creator"],
      fundingGoal: "15,000 - 25,000 USDC"
    },
    {
      title: "EcoTrack DAO",
      description: "Decentralized platform for tracking and incentivizing environmental impact. Uses IoT devices to verify real-world actions and rewards participants with tokens.",
      categories: ["Climate", "IoT", "DAO", "Impact"],
      requiredRoles: ["Backend Developer", "Smart Contract Developer", "Environmental Scientist"],
      fundingGoal: "30,000 - 45,000 USDC"
    },
    {
      title: "HealthChain",
      description: "A privacy-focused health data management system using zero-knowledge proofs to allow sharing selective medical information while maintaining full privacy.",
      categories: ["Health", "Privacy", "ZKP"],
      requiredRoles: ["ZK Developer", "Healthcare Professional", "UI Designer"],
      fundingGoal: "20,000 - 35,000 USDC"
    }
  ];
}

// Mock enhanced project description
export function getMockEnhancedDescription(originalDescription: string): string {
  // Return a slightly enhanced version with added keywords
  return `${originalDescription} Leveraging cutting-edge blockchain technology and web3 infrastructure, this project aims to revolutionize decentralized collaboration. Built with scalability and user privacy in mind, it incorporates advanced zero-knowledge proofs and secure multi-party computation.`;
}

// Mock team role recommendations
export function getMockTeamRoles(): any[] {
  return [
    {
      title: "Smart Contract Developer",
      skills: ["Solidity", "Hardhat", "Foundry", "Security best practices"],
      contribution: "Responsible for building secure and optimized smart contracts to handle project core functionality and tokenomics."
    },
    {
      title: "Frontend Developer",
      skills: ["React", "Next.js", "ethers.js", "Wallet integration"],
      contribution: "Creates intuitive and responsive UI that interfaces smoothly with blockchain functionality."
    },
    {
      title: "Tokenomics Specialist",
      skills: ["Economic modeling", "Mechanism design", "Game theory"],
      contribution: "Designs balanced token ecosystem with proper incentives for sustainable project growth."
    },
    {
      title: "Community Manager",
      skills: ["Social media", "Community building", "User education"],
      contribution: "Builds and nurtures the project community, creates educational content, and gathers feedback."
    }
  ];
}
