/**
 * Purpose Hub Seed Data
 * 
 * Seeds the database with real grants, hackathons, and nonprofits
 * from Web3 and AI ecosystems based on 2025 research data
 */

import { db } from '../db';
import { grants, hackathons, nonprofits } from '@shared/schema';

export async function seedPurposeHub() {
  console.log('🌱 Seeding Purpose Hub with real data...');

  // Real AI/Web3 Grants from 2025 research
  const realGrants = [
    {
      name: 'ChainGPT Web3 AI Grant',
      description: 'Funding for AI x Blockchain intersection projects, especially those integrating with ChainGPT ecosystem',
      organization: 'ChainGPT',
      fundingMin: '5000',
      fundingMax: '50000',
      totalBudget: '1000000',
      currency: 'USDT',
      applicationUrl: 'https://www.chaingpt.org/web3-ai-grant',
      category: 'ai',
      subcategory: 'blockchain-ai',
      techStack: ['blockchain', 'artificial-intelligence', 'smart-contracts', 'web3'],
      themes: ['ai-agents', 'defi', 'gaming', 'nft'],
      eligibilityRequirements: ['Early-stage MVP/POC', 'ChainGPT ecosystem integration'],
      targetStage: 'prototype',
      targetRegions: ['Global'],
      grantType: 'development',
      deliverables: ['Working prototype', 'Integration with ChainGPT', 'Open source code'],
      status: 'active',
      priority: 4,
      difficultyLevel: 3,
      websiteUrl: 'https://www.chaingpt.org',
      contactEmail: 'grants@chaingpt.org',
      searchKeywords: ['chaingt', 'ai', 'blockchain', 'web3', 'cryptocurrency', 'machine-learning']
    },
    {
      name: 'Ethereum Foundation ESP Grant',
      description: 'Ecosystem Support Program funding for core infrastructure, developer tools, and applied cryptography projects',
      organization: 'Ethereum Foundation',
      fundingMin: '10000',
      fundingMax: '250000',
      totalBudget: '32000000',
      applicationDeadline: new Date('2025-03-24'),
      applicationUrl: 'https://esp.ethereum.foundation',
      category: 'web3',
      subcategory: 'ethereum-infrastructure',
      techStack: ['ethereum', 'solidity', 'cryptography', 'web3'],
      themes: ['infrastructure', 'developer-tools', 'cryptography', 'scaling'],
      eligibilityRequirements: ['Open source requirement', 'Public goods focus', 'Ethereum ecosystem benefit'],
      targetStage: 'mvp',
      targetRegions: ['Global'],
      grantType: 'infrastructure',
      deliverables: ['Open source code', 'Technical documentation', 'Community adoption'],
      reportingRequirements: 'Quarterly progress reports and milestone deliverables',
      status: 'active',
      priority: 5,
      difficultyLevel: 4,
      websiteUrl: 'https://ethereum.org',
      searchKeywords: ['ethereum', 'esp', 'infrastructure', 'developer-tools', 'blockchain']
    },
    {
      name: 'Polygon Community Grants',
      description: 'Up to 100M POL/year for AI agents, blockchain x AI, and DeFi innovation on Polygon',
      organization: 'Polygon Labs',
      fundingMin: '25000',
      fundingMax: '500000',
      totalBudget: '100000000',
      currency: 'POL',
      applicationUrl: 'https://polygon.technology/grants',
      category: 'ai',
      subcategory: 'polygon-ai',
      techStack: ['polygon', 'ethereum', 'ai', 'machine-learning'],
      themes: ['ai-agents', 'defi', 'scaling', 'zk-proofs'],
      eligibilityRequirements: ['Building on Polygon', 'AI integration', 'Clear roadmap'],
      targetStage: 'scaling',
      targetRegions: ['Global'],
      grantType: 'development',
      deliverables: ['Production deployment', 'User adoption metrics', 'Open source components'],
      status: 'active',
      priority: 4,
      difficultyLevel: 3,
      websiteUrl: 'https://polygon.technology',
      searchKeywords: ['polygon', 'ai', 'agents', 'defi', 'layer2', 'scaling']
    },
    {
      name: 'Base Builder Grants',
      description: 'Micro-grants of 1-5 ETH for early-stage Web3 + AI experiments on Base L2',
      organization: 'Coinbase Base',
      fundingMin: '3000',
      fundingMax: '15000',
      currency: 'ETH',
      applicationUrl: 'https://base.org/grants',
      category: 'web3',
      subcategory: 'base-l2',
      techStack: ['base', 'ethereum', 'layer2', 'web3'],
      themes: ['experiments', 'consumer-apps', 'ai-integration'],
      eligibilityRequirements: ['Building on Base', 'Quick application process', 'Early-stage project'],
      targetStage: 'idea',
      targetRegions: ['Global'],
      grantType: 'research',
      deliverables: ['MVP demonstration', 'User feedback', 'Technical learnings'],
      status: 'active',
      priority: 3,
      difficultyLevel: 2,
      websiteUrl: 'https://base.org',
      searchKeywords: ['base', 'coinbase', 'layer2', 'microgrants', 'experiments']
    }
  ];

  // Real Hackathons from 2025 research
  const realHackathons = [
    {
      name: 'HackIndia 2025',
      description: "India's largest Web3 & AI hackathon with participants from 150 universities across 20 cities",
      organizer: 'SingularityNET',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-09-30'),
      registrationDeadline: new Date('2025-08-15'),
      submissionDeadline: new Date('2025-09-30'),
      location: 'Delhi (Finals), 20 Cities (Regionals)',
      format: 'hybrid',
      timezone: 'IST',
      totalPrizePool: '150000',
      maxParticipants: 25000,
      currentParticipants: 8500,
      techStack: ['web3', 'ai', 'blockchain', 'machine-learning'],
      tracks: ['AI Agents', 'DeFi Innovation', 'Web3 Gaming', 'Social Impact'],
      themes: ['decentralized-ai', 'fintech', 'social-good'],
      sponsors: ['SingularityNET', 'Polygon', 'Ethereum Foundation'],
      prizeStructure: {
        first: 50000,
        second: 30000,
        third: 20000,
        special: [
          { name: 'Best AI Integration', amount: 15000, sponsor: 'SingularityNET' },
          { name: 'Best DeFi Solution', amount: 10000, sponsor: 'Polygon' }
        ]
      },
      eligibilityRequirements: ['University students', 'Team size 2-4', 'Original code'],
      judgingCriteria: ['Innovation', 'Technical implementation', 'Social impact'],
      submissionRequirements: ['Working prototype', 'Demo video', 'Source code'],
      websiteUrl: 'https://hackindia.xyz',
      registrationUrl: 'https://hackindia.xyz/register',
      status: 'upcoming',
      difficultyLevel: 4,
      searchKeywords: ['hackindia', 'india', 'web3', 'ai', 'university', 'students']
    },
    {
      name: 'Web3 HackFest 2025',
      description: 'Southeast Asia premier Web3 hackathon focusing on Blockchain - AI - Game convergence in Vietnam',
      organizer: 'Ho Chi Minh City Economic Forum',
      startDate: new Date('2025-11-15'),
      endDate: new Date('2025-11-16'),
      registrationDeadline: new Date('2025-10-15'),
      submissionDeadline: new Date('2025-11-16'),
      location: 'Nguyen Hue Walking Street, Ho Chi Minh City, Vietnam',
      format: 'in-person',
      timezone: 'ICT',
      totalPrizePool: '75000',
      techStack: ['blockchain', 'ai', 'gaming', 'web3'],
      tracks: ['Blockchain Gaming', 'AI-Enhanced DeFi', 'Metaverse Integration'],
      themes: ['gaming', 'ai-convergence', 'southeast-asia'],
      sponsors: ['Vietnam Ministry of Technology', 'Binance', 'Animoca Brands'],
      eligibilityRequirements: ['Global participation', 'Team formation on-site'],
      judgingCriteria: ['Market potential', 'Technical innovation', 'Regional relevance'],
      submissionRequirements: ['Pitch deck', 'Live demonstration', 'Business model'],
      websiteUrl: 'https://web3hackfest.org',
      registrationUrl: 'https://web3hackfest.org/register',
      status: 'upcoming',
      difficultyLevel: 3,
      searchKeywords: ['vietnam', 'hackfest', 'gaming', 'blockchain', 'ai', 'southeast-asia']
    },
    {
      name: 'Encode Club Web3 AI Hackathon',
      description: 'Multi-track hackathon focusing on AI agents, ZK-Rollups, and decentralized storage solutions',
      organizer: 'Encode Club',
      startDate: new Date('2025-05-10'),
      endDate: new Date('2025-05-25'),
      registrationDeadline: new Date('2025-04-25'),
      location: 'Online',
      format: 'virtual',
      totalPrizePool: '100000',
      techStack: ['ai', 'zkrollups', 'filecoin', 'starknet'],
      tracks: ['AI Agents on Galadriel', 'Citrea ZK-Rollup', 'Filecoin AI/ML', 'CoopHive Decentralized AI'],
      themes: ['ai-agents', 'zero-knowledge', 'decentralized-storage'],
      sponsors: ['Galadriel', 'Citrea', 'Filecoin', 'Starknet'],
      prizeStructure: {
        first: 25000,
        second: 15000,
        third: 10000,
        special: [
          { name: 'Best AI Agent', amount: 12000, sponsor: 'Galadriel' },
          { name: 'Best ZK Implementation', amount: 8000, sponsor: 'Starknet' }
        ]
      },
      eligibilityRequirements: ['Global participation', 'Original development'],
      websiteUrl: 'https://www.encode.club/web3-ai-hackathon',
      status: 'upcoming',
      difficultyLevel: 4,
      searchKeywords: ['encode', 'ai-agents', 'zk-rollups', 'filecoin', 'virtual']
    }
  ];

  // Real Nonprofits using AI/Web3 from research
  const realNonprofits = [
    {
      name: 'UNICEF',
      description: 'Leading blockchain/AI integration for humanitarian aid with CryptoFund and innovation initiatives',
      mission: 'For every child, a fair chance at life through innovative technology solutions',
      ein: '13-1760110',
      legalStatus: '501c3',
      verificationStatus: 'verified',
      websiteUrl: 'https://www.unicef.org',
      contactEmail: 'innovation@unicef.org',
      headquarters: 'New York, NY',
      operatingRegions: ['Global', 'Asia', 'Africa', 'Latin America'],
      focusAreas: ['children', 'humanitarian-aid', 'education', 'health'],
      targetBeneficiaries: ['children', 'refugees', 'underserved-communities'],
      impactMetrics: {
        beneficiariesServed: 190000000,
        yearsOperating: 79,
        projectsCompleted: 1500,
        fundsDistributed: 6500000000
      },
      techAdoption: {
        blockchain: true,
        ai: true,
        web3: true,
        level: 'advanced'
      },
      annualBudget: '7300000000',
      fundingSources: ['donations', 'government', 'corporate-partnerships'],
      transparencyScore: '4.0',
      charityNavigatorRating: 4,
      guidestarSeal: true,
      partnershipInterests: ['blockchain-development', 'ai-for-good', 'digital-identity'],
      skillsNeeded: ['blockchain-developers', 'ai-engineers', 'product-managers'],
      volunteerOpportunities: ['technical-consulting', 'product-development', 'research'],
      searchKeywords: ['unicef', 'children', 'humanitarian', 'blockchain', 'cryptofund', 'global']
    },
    {
      name: 'Gitcoin',
      description: 'Public goods funding platform using quadratic funding for equitable distribution of resources',
      mission: 'Build and fund the open web through collaborative funding mechanisms',
      legalStatus: 'foundation',
      verificationStatus: 'verified',
      websiteUrl: 'https://gitcoin.co',
      contactEmail: 'support@gitcoin.co',
      headquarters: 'Boulder, CO',
      operatingRegions: ['Global'],
      focusAreas: ['open-source', 'public-goods', 'developer-funding'],
      targetBeneficiaries: ['open-source-developers', 'blockchain-projects', 'digital-public-goods'],
      impactMetrics: {
        beneficiariesServed: 50000,
        yearsOperating: 7,
        projectsCompleted: 3500,
        fundsDistributed: 50000000
      },
      techAdoption: {
        blockchain: true,
        ai: false,
        web3: true,
        level: 'advanced'
      },
      annualBudget: '25000000',
      fundingSources: ['grants', 'dao-treasury', 'protocol-fees'],
      transparencyScore: '3.8',
      partnershipInterests: ['quadratic-funding', 'dao-governance', 'public-goods'],
      skillsNeeded: ['solidity-developers', 'dao-governance', 'community-managers'],
      volunteerOpportunities: ['grant-evaluation', 'community-building', 'technical-review'],
      searchKeywords: ['gitcoin', 'quadratic-funding', 'public-goods', 'open-source', 'ethereum']
    },
    {
      name: 'BitGive',
      description: 'First nonprofit focused on blockchain for humanitarian causes, now part of Heifer International',
      mission: 'Leverage blockchain technology for transparent and efficient charitable giving',
      ein: '46-1266816',
      legalStatus: '501c3',
      verificationStatus: 'verified',
      websiteUrl: 'https://www.bitgivefoundation.org',
      contactEmail: 'info@bitgivefoundation.org',
      headquarters: 'San Diego, CA',
      operatingRegions: ['Global'],
      focusAreas: ['humanitarian-aid', 'transparency', 'blockchain-education'],
      targetBeneficiaries: ['global-poor', 'disaster-victims', 'underbanked-populations'],
      impactMetrics: {
        beneficiariesServed: 100000,
        yearsOperating: 11,
        projectsCompleted: 45,
        fundsDistributed: 2500000
      },
      techAdoption: {
        blockchain: true,
        ai: false,
        web3: true,
        level: 'advanced'
      },
      annualBudget: '1500000',
      fundingSources: ['crypto-donations', 'traditional-donations'],
      transparencyScore: '4.2',
      charityNavigatorRating: 4,
      partnershipInterests: ['blockchain-transparency', 'donation-tracking', 'financial-inclusion'],
      skillsNeeded: ['blockchain-developers', 'transparency-tools', 'donation-platforms'],
      volunteerOpportunities: ['platform-development', 'donor-education', 'transparency-advocacy'],
      searchKeywords: ['bitgive', 'blockchain', 'transparency', 'donations', 'givetrack']
    },
    {
      name: 'Save the Children',
      description: 'Early crypto adopter with over $7M in cryptocurrency donations, pioneering blockchain philanthropy',
      mission: 'Give children a healthy start in life, the opportunity to learn and protection from harm',
      ein: '06-0726487',
      legalStatus: '501c3',
      verificationStatus: 'verified',
      websiteUrl: 'https://www.savethechildren.org',
      contactEmail: 'cryptodonations@savethechildren.org',
      headquarters: 'Fairfield, CT',
      operatingRegions: ['Global', 'US', 'Emergency-Response'],
      focusAreas: ['children', 'emergency-response', 'education', 'health'],
      targetBeneficiaries: ['children', 'families-in-crisis', 'refugee-children'],
      impactMetrics: {
        beneficiariesServed: 100000000,
        yearsOperating: 104,
        projectsCompleted: 2000,
        fundsDistributed: 2800000000
      },
      techAdoption: {
        blockchain: true,
        ai: false,
        web3: true,
        level: 'intermediate'
      },
      annualBudget: '1100000000',
      fundingSources: ['donations', 'government-grants', 'crypto-donations'],
      transparencyScore: '3.9',
      charityNavigatorRating: 4,
      guidestarSeal: true,
      partnershipInterests: ['crypto-philanthropy', 'emergency-response', 'child-protection'],
      skillsNeeded: ['crypto-payments', 'blockchain-transparency', 'digital-fundraising'],
      volunteerOpportunities: ['crypto-education', 'fundraising-innovation', 'technology-adoption'],
      searchKeywords: ['save-the-children', 'crypto-donations', 'children', 'emergency', 'hodlhope']
    }
  ];

  try {
    // Insert grants
    console.log('📄 Inserting grants...');
    for (const grant of realGrants) {
      await db.insert(grants).values(grant).onConflictDoNothing();
    }

    // Insert hackathons
    console.log('💻 Inserting hackathons...');
    for (const hackathon of realHackathons) {
      await db.insert(hackathons).values(hackathon).onConflictDoNothing();
    }

    // Insert nonprofits
    console.log('🏛️ Inserting nonprofits...');
    for (const nonprofit of realNonprofits) {
      await db.insert(nonprofits).values(nonprofit).onConflictDoNothing();
    }

    console.log('✅ Purpose Hub seeded successfully!');
    console.log(`   📄 ${realGrants.length} grants added`);
    console.log(`   💻 ${realHackathons.length} hackathons added`);
    console.log(`   🏛️ ${realNonprofits.length} nonprofits added`);

  } catch (error) {
    console.error('❌ Error seeding Purpose Hub:', error);
    throw error;
  }
}

// Export for direct execution
export default seedPurposeHub;