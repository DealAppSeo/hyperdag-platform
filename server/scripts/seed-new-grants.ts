// Script to seed new AI and Web3 grants for 2025
import { db } from '../db';
import { grantSources } from '@shared/schema';
import { log } from '../vite';
import { eq } from 'drizzle-orm';

async function seedNewGrants() {
  log('Starting to seed new AI and Web3 grants for 2025', 'grant-seeding');

  // New grants from the provided information
  const newGrants = [
    {
      name: 'ChainGPT Web3 AI Grant',
      website: 'https://chaingpt.org/grants',
      description: 'Supports AI x Blockchain projects with financial grants, technical integration, and promotional partnerships. Offers up to $50,000 for Growth Grants; smaller tiers for Research ($5K–$10K) and Builder stages ($10K–$25K).',
      website_website_url: 'https://chaingpt.org/grants',
      categories: ['AI', 'Blockchain', 'Web3', 'Chatbots', 'Trading Tools', 'Developer Tooling', 'AI Research'],
      available_funds: 50000,
      application_url: 'https://chaingpt.org/grants/apply',
      is_active: true
    },
    {
      name: 'Arbitrum AI Development Grant',
      website: 'https://arbitrum.foundation/grants',
      description: 'Funds developers creating specialized AI agents and onchain AI products integrated with Arbitrum chains. Requires a launched AI agent with onchain functionality.',
      website_url: 'https://arbitrum.foundation/grants',
      categories: ['AI Agents', 'Onchain AI', 'Arbitrum Ecosystem', 'Decentralized Applications'],
      available_funds: 10000,
      application_url: 'https://arbitrum.foundation/grants/apply',
      is_active: true
    },
    {
      name: 'Polygon Community Grants (Polybrain AI)',
      website: 'https://polygon.technology/grants',
      description: 'Supports AI projects building on Polygon, evaluated by an AI-driven allocator ("Polybrain") via social media pitches. Uses "Collective Polygon Intelligence" for decision-making.',
      website_url: 'https://polygon.technology/grants',
      categories: ['AI', 'Polygon', 'Web3', 'Collective Intelligence', 'Decentralized Applications'],
      available_funds: 100000,
      application_url: 'https://polygon.technology/grants/apply',
      is_active: true
    },
    {
      name: 'Solana Foundation Grants',
      website: 'https://solana.org/grants',
      description: 'Funds open-source AI/Web3 projects, particularly those benefiting emerging markets. Prioritizes public goods, inclusivity, and diversity with milestone-based grants and community-backed funding.',
      website_url: 'https://solana.org/grants',
      categories: ['AI', 'Web3', 'Open Source', 'Public Goods', 'Emerging Markets', 'Decentralization'],
      available_funds: 10000,
      application_url: 'https://solana.org/grants/apply',
      is_active: true
    },
    {
      name: 'Solidus AI Tech Compute Grant',
      website: 'https://www.solidus.ai/grants',
      description: 'Provides high-performance computing resources for training AI models in Web2 and Web3 contexts. Includes mentorship, incubation, and partnership opportunities.',
      website_url: 'https://www.solidus.ai/grants',
      categories: ['AI', 'High-Performance Computing', 'Web3', 'Web2-to-Web3 Transition', 'DePIN'],
      available_funds: 100000,
      application_url: 'https://www.solidus.ai/grants/apply',
      is_active: true
    },
    {
      name: 'Ethereum Foundation Ecosystem Support Program',
      website: 'https://esp.ethereum.foundation',
      description: 'Funds public goods projects, including AI infrastructure, decentralized tools, and applied cryptography. Prioritizes projects aligning with Ethereum\'s values (credible neutrality, sustainability).',
      website_url: 'https://esp.ethereum.foundation',
      categories: ['AI Infrastructure', 'Applied Cryptography', 'Decentralized Tools', 'Public Goods', 'Ethereum'],
      available_funds: 30000,
      application_url: 'https://esp.ethereum.foundation/apply',
      is_active: true
    },
    {
      name: 'Polkadot JAM Prize & DePIN Grants',
      website: 'https://web3.foundation/grants',
      description: 'Supports AI-driven decentralized infrastructure and privacy-preserving data protocols. The JAM Prize targets enhanced smart contract functionality, while DePIN grants focus on decentralized physical infrastructure networks.',
      website_url: 'https://web3.foundation/grants',
      categories: ['AI', 'DePIN', 'Polkadot', 'Kusama', 'Decentralized Infrastructure', 'Privacy'],
      available_funds: 40000,
      application_url: 'https://web3.foundation/grants/apply',
      is_active: true
    },
    {
      name: 'Celo Public Goods Grants',
      website: 'https://celo.org/grants',
      description: 'Funds AI/Web3 projects driving real-world impact, measured by onchain metrics. Focuses on financial inclusion, climate initiatives, and community-driven solutions.',
      website_url: 'https://celo.org/grants',
      categories: ['AI', 'Social Good', 'Web3', 'Onchain Metrics', 'Financial Inclusion'],
      available_funds: 50000,
      application_url: 'https://celo.org/grants/apply',
      is_active: true
    },
    {
      name: 'Mercy Corps Crypto For Good Fund',
      website: 'https://mercycorps.org/ventures/crypto-for-good',
      description: 'Targets Web3 solutions for financial inclusion and climate resilience in emerging markets. Focuses on programmable money, locally adapted solutions, and humanitarian aid delivery.',
      website_url: 'https://mercycorps.org/ventures/crypto-for-good',
      categories: ['Web3', 'AI', 'Financial Inclusion', 'Climate Resilience', 'Humanitarian Aid'],
      available_funds: 100000,
      application_url: 'https://mercycorps.org/ventures/crypto-for-good/apply',
      is_active: true
    },
    {
      name: 'SAFE Foundation Grants',
      website: 'https://safe.global/grants',
      description: 'Funds AI-enhanced smart contract tooling, security solutions, and decentralized governance projects. Prioritizes innovations improving the Safe ecosystem\'s usability and security for Web3 applications.',
      website_url: 'https://safe.global/grants',
      categories: ['AI', 'Smart Contracts', 'Security', 'Decentralized Governance', 'Web3'],
      available_funds: 25000,
      application_url: 'https://safe.global/grants/apply',
      is_active: true
    },
    {
      name: 'Filecoin ProPGF Grants',
      website: 'https://fil.org/grants',
      description: 'Supports AI projects leveraging Filecoin\'s decentralized storage or Filecoin Virtual Machine (FVM). Funds storage solutions, developer tooling, and public goods.',
      website_url: 'https://fil.org/grants',
      categories: ['AI', 'Decentralized Storage', 'Web3', 'Filecoin Virtual Machine', 'Public Goods'],
      available_funds: 50000,
      application_url: 'https://fil.org/grants/apply',
      is_active: true
    },
    {
      name: 'aZen Strategic Grants',
      website: 'https://azen.io/grants',
      description: 'Funds cross-chain DePIN and AI integrations, focusing on decentralized infrastructure for AI workloads. Emphasizes interoperability with ecosystems like Polkadot and Internet Computer (ICP).',
      website_url: 'https://azen.io/grants',
      categories: ['AI', 'DePIN', 'Cross-Chain', 'Web3', 'Decentralized Infrastructure'],
      available_funds: 30000,
      application_url: 'https://azen.io/grants/apply',
      is_active: true
    },
    {
      name: 'HashKey Chain Atlas Grant Program',
      website: 'https://hashkey.com/grants',
      description: 'Supports global Web3 projects in the OP Stack ecosystem, focusing on tokenization of real-world assets (RWA), PayFi, stablecoins, and BTCFi.',
      website_url: 'https://hashkey.com/grants',
      categories: ['AI', 'Web3', 'Tokenization', 'PayFi', 'Stablecoins', 'BTCFi'],
      available_funds: 50000,
      application_url: 'https://hashkey.com/grants/apply',
      is_active: true
    },
    {
      name: 'Kadena Eco Grants',
      website: 'https://kadena.io/grants',
      description: 'Funds high-quality, open-source projects in gaming, metaverse, NFTs, Web3, DeFi, and DAOs. Evaluation based on technical strength, team experience, and practicality.',
      website_url: 'https://kadena.io/grants',
      categories: ['AI', 'Web3', 'Gaming', 'Metaverse', 'NFTs', 'DeFi', 'DAO'],
      available_funds: 25000,
      application_url: 'https://kadena.io/grants/apply',
      is_active: true
    },
    {
      name: 'RARI Ecosystem Grants',
      website: 'https://rari.foundation/grants',
      description: 'Supports projects driving innovation in the NFT space, including AI-enhanced NFT marketplaces, gaming, social platforms, and brand loyalty initiatives.',
      website_url: 'https://rari.foundation/grants',
      categories: ['AI', 'NFTs', 'Web3', 'Gaming', 'Social', 'Brand Loyalty'],
      available_funds: 20000,
      application_url: 'https://rari.foundation/grants/apply',
      is_active: true
    },
    {
      name: 'Optimism Mission Rounds',
      website: 'https://optimism.io/grants',
      description: 'Funds AI/Web3 projects enhancing Ethereum\'s scalability and usability through the Optimism ecosystem.',
      website_url: 'https://optimism.io/grants',
      categories: ['AI', 'Web3', 'Ethereum', 'Optimism', 'Scalability'],
      available_funds: 15000,
      application_url: 'https://optimism.io/grants/apply',
      is_active: true
    }
  ];

  try {
    // Check for existing grants to avoid duplicates
    for (const grantData of newGrants) {
      // Check if grant with same name already exists
      const existingGrants = await db
        .select()
        .from(grantSources)
        .where(eq(grantSources.name, grantData.name));
      
      const existingGrant = existingGrants[0];

      if (existingGrant) {
        log(`Grant source "${grantData.name}" already exists, updating...`, 'grant-seeding');
        
        // Update existing grant with new information
        await db
          .update(grantSources)
          .set({
            website: grantData.website,
            description: grantData.description,
            website_url: grantData.website_url, // Use website_url instead of url
            categories: grantData.categories,
            available_funds: grantData.availableFunds, // Use available_funds instead of availableFunds
            application_url: grantData.applicationUrl, // Use application_url instead of applicationUrl
            updated_at: new Date() // Use updated_at instead of lastUpdated
          })
          .where(eq(grantSources.id, existingGrant.id));
      } else {
        // Insert new grant
        log(`Adding new grant source: ${grantData.name}`, 'grant-seeding');
        await db.insert(grantSources).values({
          name: grantData.name,
          description: grantData.description,
          website: grantData.website,
          website_url: grantData.website_url, // Use website_url instead of url
          categories: grantData.categories,
          available_funds: grantData.availableFunds, // Use available_funds instead of availableFunds
          application_url: grantData.applicationUrl, // Use application_url instead of applicationUrl
          is_active: true,
          last_scraped: new Date(),
          updated_at: new Date(),
          created_at: new Date()
        });
      }
    }

    log(`Successfully seeded ${newGrants.length} grant sources`, 'grant-seeding');
    return { success: true, count: newGrants.length };
  } catch (error) {
    log(`Error seeding grant sources: ${error}`, 'grant-seeding');
    throw error;
  }
}

// Auto-run when imported directly from tsx
seedNewGrants()
  .then(result => {
    console.log('Grant seeding completed:', result);
  })
  .catch(error => {
    console.error('Grant seeding failed:', error);
    process.exit(1);
  });

export { seedNewGrants };