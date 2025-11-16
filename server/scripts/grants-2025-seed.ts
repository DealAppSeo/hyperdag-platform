// Script to seed new AI and Web3 grants for 2025
import { db } from '../db';
import { grantSources } from '@shared/schema';
import { log } from '../vite';
import { eq } from 'drizzle-orm';

async function seedNewGrants2025() {
  log('Starting to seed new AI and Web3 grants for 2025', 'grant-seeding');

  // New grants from the provided information
  const newGrants = [
    {
      name: 'ChainGPT Web3 AI Grant',
      website: 'https://chaingpt.org/grants',
      description: 'Supports AI x Blockchain projects with financial grants, technical integration, and promotional partnerships. Offers up to $50,000 for Growth Grants; smaller tiers for Research ($5K–$10K) and Builder stages ($10K–$25K).',
      categories: ['AI', 'Blockchain', 'Web3', 'Chatbots', 'Trading Tools', 'Developer Tooling', 'AI Research'],
      availableFunds: 50000,
      applicationUrl: 'https://chaingpt.org/grants/apply'
    },
    {
      name: 'Arbitrum AI Development Grant',
      website: 'https://arbitrum.foundation/grants',
      description: 'Funds developers creating specialized AI agents and onchain AI products integrated with Arbitrum chains. Requires a launched AI agent with onchain functionality.',
      categories: ['AI Agents', 'Onchain AI', 'Arbitrum Ecosystem', 'Decentralized Applications'],
      availableFunds: 10000,
      applicationUrl: 'https://arbitrum.foundation/grants/apply'
    },
    {
      name: 'Polygon Community Grants (Polybrain AI)',
      website: 'https://polygon.technology/grants',
      description: 'Supports AI projects building on Polygon, evaluated by an AI-driven allocator ("Polybrain") via social media pitches. Uses "Collective Polygon Intelligence" for decision-making.',
      categories: ['AI', 'Polygon', 'Web3', 'Collective Intelligence', 'Decentralized Applications'],
      availableFunds: 100000,
      applicationUrl: 'https://polygon.technology/grants/apply'
    },
    {
      name: 'Solana Foundation Grants',
      website: 'https://solana.org/grants',
      description: 'Funds open-source AI/Web3 projects, particularly those benefiting emerging markets. Prioritizes public goods, inclusivity, and diversity with milestone-based grants and community-backed funding.',
      categories: ['AI', 'Web3', 'Open Source', 'Public Goods', 'Emerging Markets', 'Decentralization'],
      availableFunds: 10000,
      applicationUrl: 'https://solana.org/grants/apply'
    },
    {
      name: 'Solidus AI Tech Compute Grant',
      website: 'https://www.solidus.ai/grants',
      description: 'Provides high-performance computing resources for training AI models in Web2 and Web3 contexts. Includes mentorship, incubation, and partnership opportunities.',
      categories: ['AI', 'High-Performance Computing', 'Web3', 'Web2-to-Web3 Transition', 'DePIN'],
      availableFunds: 100000,
      applicationUrl: 'https://www.solidus.ai/grants/apply'
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
            categories: grantData.categories,
            available_funds: grantData.availableFunds,
            application_url: grantData.applicationUrl,
            updated_at: new Date(),
            is_active: true
          })
          .where(eq(grantSources.id, existingGrant.id));
      } else {
        // Insert new grant
        log(`Adding new grant source: ${grantData.name}`, 'grant-seeding');
        await db.insert(grantSources).values({
          name: grantData.name,
          description: grantData.description,
          website: grantData.website,
          categories: grantData.categories,
          available_funds: grantData.availableFunds,
          application_url: grantData.applicationUrl,
          is_active: true,
          last_scraped: new Date(),
          updated_at: new Date(),
          created_at: new Date()
        });
      }
    }

    log(`Successfully seeded ${newGrants.length} grant sources for 2025`, 'grant-seeding');
    return { success: true, count: newGrants.length };
  } catch (error) {
    log(`Error seeding grant sources: ${error}`, 'grant-seeding');
    throw error;
  }
}

// Auto-run when imported directly from tsx
seedNewGrants2025()
  .then(result => {
    console.log('Grant seeding completed:', result);
  })
  .catch(error => {
    console.error('Grant seeding failed:', error);
    process.exit(1);
  });

export { seedNewGrants2025 };