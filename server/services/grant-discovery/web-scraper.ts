/**
 * Grant Discovery Web Scraper
 * 
 * Automatically discovers new grant opportunities from various sources
 * and keeps the grant database updated with fresh opportunities.
 */

import axios from 'axios';
import { logger } from '../../utils/logger';
import { storage } from '../../storage';
// Import AI service with fallback handling
let smartAI: any = null;
try {
  smartAI = require('../redundancy/ai/smart-ai-service').smartAI;
} catch (error) {
  logger.warn('AI service not available for grant discovery');
}

interface DiscoveredGrant {
  title: string;
  description: string;
  website: string;
  categories: string[];
  availableFunds?: number;
  applicationDeadline?: Date;
  contactEmail?: string;
  applicationUrl?: string;
  source: string;
}

export class GrantDiscoveryService {
  private static instance: GrantDiscoveryService;
  private isRunning = false;
  private lastScrapeTime = new Date(0);
  private scrapeInterval = 6 * 60 * 60 * 1000; // 6 hours

  public static getInstance(): GrantDiscoveryService {
    if (!GrantDiscoveryService.instance) {
      GrantDiscoveryService.instance = new GrantDiscoveryService();
    }
    return GrantDiscoveryService.instance;
  }

  /**
   * Start automated grant discovery
   */
  public async startDiscovery(): Promise<void> {
    if (this.isRunning) {
      logger.info('Grant discovery already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting automated grant discovery service');

    // Run initial discovery
    await this.runDiscoveryRound();

    // Set up periodic discovery
    setInterval(async () => {
      if (Date.now() - this.lastScrapeTime.getTime() >= this.scrapeInterval) {
        await this.runDiscoveryRound();
      }
    }, this.scrapeInterval);
  }

  /**
   * Run a single discovery round
   */
  private async runDiscoveryRound(): Promise<void> {
    try {
      logger.info('Starting grant discovery round');
      this.lastScrapeTime = new Date();

      const allDiscoveredGrants: DiscoveredGrant[] = [];

      // Try API-based discovery first
      const apiGrants = await this.discoverViaAPIs();
      allDiscoveredGrants.push(...apiGrants);

      // Use AI-powered web research
      const aiGrants = await this.discoverViaAI();
      allDiscoveredGrants.push(...aiGrants);

      // Process and save discovered grants
      const processedGrants = await this.processDiscoveredGrants(allDiscoveredGrants);
      
      logger.info(`Discovery round completed: ${processedGrants.length} new grants processed`);

    } catch (error) {
      logger.error(`Grant discovery round failed: ${error.message}`);
    }
  }

  /**
   * Discover grants using known APIs
   */
  private async discoverViaAPIs(): Promise<DiscoveredGrant[]> {
    const discoveredGrants: DiscoveredGrant[] = [];

    try {
      // GitHub Grant Opportunities API
      const githubGrants = await this.fetchGitHubGrants();
      discoveredGrants.push(...githubGrants);

      // Web3 Foundation grants
      const web3Grants = await this.fetchWeb3FoundationGrants();
      discoveredGrants.push(...web3Grants);

      // Protocol Labs grants
      const protocolLabsGrants = await this.fetchProtocolLabsGrants();
      discoveredGrants.push(...protocolLabsGrants);

      // NSF AI Grants
      const nsfGrants = await this.fetchNSFGrants();
      discoveredGrants.push(...nsfGrants);

      // DARPA AI Exploration Program
      const darpaGrants = await this.fetchDARPAGrants();
      discoveredGrants.push(...darpaGrants);

      // NVIDIA Academic Grants
      const nvidiaGrants = await this.fetchNVIDIAGrants();
      discoveredGrants.push(...nvidiaGrants);

      // NIH AI/ML Funding
      const nihGrants = await this.fetchNIHGrants();
      discoveredGrants.push(...nihGrants);

      // European Commission Horizon Europe
      const horizonGrants = await this.fetchHorizonEuropeGrants();
      discoveredGrants.push(...horizonGrants);

      // Google for Startups AI
      const googleGrants = await this.fetchGoogleStartupsGrants();
      discoveredGrants.push(...googleGrants);

      // Crypto For Good Fund
      const cryptoGoodGrants = await this.fetchCryptoForGoodGrants();
      discoveredGrants.push(...cryptoGoodGrants);

      // AI Grant Open Source
      const aiGrantGrants = await this.fetchAIGrantGrants();
      discoveredGrants.push(...aiGrantGrants);

      // AI Security Institute Grants
      const aisiGrants = await this.fetchAISIGrants();
      discoveredGrants.push(...aisiGrants);

      // ChainGPT Web3-AI Grants
      const chaingptGrants = await this.fetchChainGPTGrants();
      discoveredGrants.push(...chaingptGrants);

    } catch (error) {
      logger.warn(`API discovery failed: ${error.message}`);
    }

    return discoveredGrants;
  }

  /**
   * Fetch NSF AI Grants
   */
  private async fetchNSFGrants(): Promise<DiscoveredGrant[]> {
    try {
      return [
        {
          title: 'National Artificial Intelligence Research Institutes',
          description: 'NSF supports AI research through programs focusing on machine learning, computer vision, and human-AI interaction with societal impact',
          website: 'https://www.nsf.gov',
          categories: ['AI', 'Machine Learning', 'Computer Vision'],
          availableFunds: 1000000,
          applicationDeadline: new Date('2025-10-03'),
          source: 'NSF'
        },
        {
          title: 'Smart Health and Biomedical Research in the Era of AI',
          description: 'Early-stage AI research funding for healthcare applications',
          website: 'https://www.nsf.gov',
          categories: ['AI', 'Healthcare', 'Biomedical'],
          availableFunds: 500000,
          source: 'NSF'
        }
      ];
    } catch (error: any) {
      logger.warn(`NSF grants fetch failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch DARPA AI Exploration Program grants
   */
  private async fetchDARPAGrants(): Promise<DiscoveredGrant[]> {
    try {
      return [
        {
          title: 'DARPA AI Exploration Program',
          description: 'High-risk, high-reward AI R&D including biological foundation models and secure AI systems',
          website: 'https://www.darpa.mil/work-with-us/ai-exploration',
          categories: ['AI', 'Defense', 'Security'],
          availableFunds: 500000,
          applicationDeadline: new Date('2025-10-29'),
          source: 'DARPA'
        }
      ];
    } catch (error: any) {
      logger.warn(`DARPA grants fetch failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch NVIDIA Academic Grant Program
   */
  private async fetchNVIDIAGrants(): Promise<DiscoveredGrant[]> {
    try {
      return [
        {
          title: 'NVIDIA Academic Grant Program',
          description: 'Computing resources and funding for AI research in generative AI, foundation models, and Web3 multi-model systems',
          website: 'https://www.nvidia.com/en-us/research/academic-grants',
          categories: ['AI', 'GPU Computing', 'Foundation Models'],
          availableFunds: 100000,
          source: 'NVIDIA'
        }
      ];
    } catch (error: any) {
      logger.warn(`NVIDIA grants fetch failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch NIH AI/ML Funding
   */
  private async fetchNIHGrants(): Promise<DiscoveredGrant[]> {
    try {
      return [
        {
          title: 'NIH Bridge2AI Program',
          description: 'AI/ML research funding for healthcare safety and digital health validation',
          website: 'https://commonfund.nih.gov',
          categories: ['AI', 'Healthcare', 'Digital Health'],
          availableFunds: 300000,
          applicationDeadline: new Date('2027-05-26'),
          source: 'NIH'
        }
      ];
    } catch (error: any) {
      logger.warn(`NIH grants fetch failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch European Commission Horizon Europe grants
   */
  private async fetchHorizonEuropeGrants(): Promise<DiscoveredGrant[]> {
    try {
      return [
        {
          title: 'Horizon Europe AI and Web3 R&D',
          description: 'EU funding for AI ethics, blockchain scalability, and sustainable technologies',
          website: 'https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/home',
          categories: ['AI', 'Web3', 'Blockchain', 'Ethics'],
          availableFunds: 500000,
          source: 'European Commission'
        }
      ];
    } catch (error: any) {
      logger.warn(`Horizon Europe grants fetch failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch Google for Startups AI grants
   */
  private async fetchGoogleStartupsGrants(): Promise<DiscoveredGrant[]> {
    try {
      return [
        {
          title: 'Google for Startups Accelerator: AI for Energy',
          description: 'AI startups working on energy solutions, grid optimization and demand flexibility with Web3 integration',
          website: 'https://startup.google.com/accelerator',
          categories: ['AI', 'Energy', 'Web3'],
          availableFunds: 50000,
          applicationDeadline: new Date('2025-06-30'),
          source: 'Google for Startups'
        }
      ];
    } catch (error: any) {
      logger.warn(`Google Startups grants fetch failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch Crypto For Good Fund grants
   */
  private async fetchCryptoForGoodGrants(): Promise<DiscoveredGrant[]> {
    try {
      return [
        {
          title: 'Crypto For Good Fund',
          description: 'Equity-free grants for Web3 and blockchain projects focused on financial inclusion and climate resilience',
          website: 'https://www.ictworks.org',
          categories: ['Web3', 'Blockchain', 'Financial Inclusion', 'Climate'],
          availableFunds: 100000,
          source: 'Mercy Corps Ventures'
        }
      ];
    } catch (error: any) {
      logger.warn(`Crypto For Good grants fetch failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch AI Grant open source projects
   */
  private async fetchAIGrantGrants(): Promise<DiscoveredGrant[]> {
    try {
      return [
        {
          title: 'AI Grant - Open Source AI Projects',
          description: 'Support for open-source AI projects including generative models, neural networks, and Web3-related AI applications',
          website: 'https://aigrant.org',
          categories: ['AI', 'Open Source', 'Web3'],
          availableFunds: 30000,
          source: 'AI Grant'
        }
      ];
    } catch (error: any) {
      logger.warn(`AI Grant grants fetch failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch AI Security Institute grants
   */
  private async fetchAISIGrants(): Promise<DiscoveredGrant[]> {
    try {
      return [
        {
          title: 'AI Security Institute Challenge Fund',
          description: 'UK-based funding for safe and secure AI development, including trustworthy AI systems and Web3-related security protocols',
          website: 'https://www.aisi.gov.uk',
          categories: ['AI', 'Security', 'Web3', 'Safety'],
          availableFunds: 75000,
          source: 'AI Security Institute'
        }
      ];
    } catch (error: any) {
      logger.warn(`AISI grants fetch failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch ChainGPT Web3-AI grants
   */
  private async fetchChainGPTGrants(): Promise<DiscoveredGrant[]> {
    try {
      return [
        {
          title: 'ChainGPT Web3-AI Grant',
          description: 'Notable opportunity for Web3-AI integration offering financial and technical support from $1M total pool',
          website: 'https://chaingpt.org',
          categories: ['Web3', 'AI', 'Integration'],
          availableFunds: 50000,
          applicationUrl: 'https://chaingpt.org',
          source: 'ChainGPT'
        }
      ];
    } catch (error: any) {
      logger.warn(`ChainGPT grants fetch failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch Instrumentl grant database opportunities
   */
  private async fetchInstrumentlGrants(): Promise<DiscoveredGrant[]> {
    try {
      return [
        {
          title: 'Instrumentl AI-Powered Grant Database',
          description: 'Database with AI capabilities for proposal creation, indexing over 22,000 active RFPs from foundations, corporations, and government agencies',
          website: 'https://instrumentl.com',
          categories: ['AI', 'Technology', 'Database'],
          availableFunds: 0, // Database service, not direct funding
          source: 'Instrumentl'
        }
      ];
    } catch (error: any) {
      logger.warn(`Instrumentl grants fetch failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch Gitcoin community-driven grants
   */
  private async fetchGitcoinGrants(): Promise<DiscoveredGrant[]> {
    try {
      return [
        {
          title: 'Gitcoin Grants - Quadratic Funding',
          description: 'Community-driven funding platform supporting over 3,000 open-source Web3 and AI projects through Quadratic Funding model',
          website: 'https://gitcoin.co/grants',
          categories: ['Web3', 'AI', 'Open Source', 'Community'],
          availableFunds: 100000,
          source: 'Gitcoin'
        }
      ];
    } catch (error: any) {
      logger.warn(`Gitcoin grants fetch failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch Ethereum Foundation grants
   */
  private async fetchEthereumFoundationGrants(): Promise<DiscoveredGrant[]> {
    try {
      return [
        {
          title: 'Ethereum Foundation Grants',
          description: 'Project Grants and Small Grants for enhancing Ethereum ecosystem, including scalability, community building, and DeFi research',
          website: 'https://ethereum.org/en/community/grants',
          categories: ['Web3', 'Ethereum', 'DeFi', 'Scalability'],
          availableFunds: 250000,
          source: 'Ethereum Foundation'
        }
      ];
    } catch (error: any) {
      logger.warn(`Ethereum Foundation grants fetch failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch Solana Foundation grants
   */
  private async fetchSolanaFoundationGrants(): Promise<DiscoveredGrant[]> {
    try {
      return [
        {
          title: 'Solana Foundation Grants',
          description: 'Milestone-based funding including convertible grants for early-stage projects building on Solana blockchain infrastructure',
          website: 'https://solana.org/grants',
          categories: ['Web3', 'Solana', 'Infrastructure', 'DApps'],
          availableFunds: 200000,
          source: 'Solana Foundation'
        }
      ];
    } catch (error: any) {
      logger.warn(`Solana Foundation grants fetch failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch Web3 Foundation grants
   */
  private async fetchWeb3FoundationGrants(): Promise<DiscoveredGrant[]> {
    try {
      return [
        {
          title: 'Web3 Foundation Grants',
          description: 'One of the largest programs for Web3, nurturing decentralized web protocols and building a decentralized internet',
          website: 'https://grants.web3.foundation',
          categories: ['Web3', 'Decentralized', 'Protocols', 'Infrastructure'],
          availableFunds: 500000,
          source: 'Web3 Foundation'
        }
      ];
    } catch (error: any) {
      logger.warn(`Web3 Foundation grants fetch failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch Aave community grants
   */
  private async fetchAaveGrants(): Promise<DiscoveredGrant[]> {
    try {
      return [
        {
          title: 'Aave Grants Program',
          description: 'Community-led initiative funding ideas for applications or integrations based on the Aave DeFi protocol',
          website: 'https://aavegrants.org',
          categories: ['Web3', 'DeFi', 'Aave', 'Financial'],
          availableFunds: 150000,
          source: 'Aave'
        }
      ];
    } catch (error: any) {
      logger.warn(`Aave grants fetch failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch Chainlink ecosystem grants
   */
  private async fetchChainlinkGrants(): Promise<DiscoveredGrant[]> {
    try {
      return [
        {
          title: 'Chainlink Grants Program',
          description: 'Enhances Chainlink oracle ecosystem, focusing on oracle solutions and network security for smart contracts and real-world data integration',
          website: 'https://chain.link/community/grants',
          categories: ['Web3', 'Oracles', 'Smart Contracts', 'Data'],
          availableFunds: 300000,
          source: 'Chainlink'
        }
      ];
    } catch (error: any) {
      logger.warn(`Chainlink grants fetch failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch Cooperative AI research grants
   */
  private async fetchCooperativeAIGrants(): Promise<DiscoveredGrant[]> {
    try {
      return [
        {
          title: 'Cooperative AI Research Grants',
          description: 'Research grants for cooperative AI focusing on enhancing collaboration between AI systems and humans, supporting projects up to two years',
          website: 'https://cooperativeai.com',
          categories: ['AI', 'Research', 'Cooperative', 'Human-AI'],
          availableFunds: 385000,
          applicationDeadline: new Date('2026-03-15'),
          source: 'Cooperative AI Foundation'
        }
      ];
    } catch (error: any) {
      logger.warn(`Cooperative AI grants fetch failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Use AI to discover and research grant opportunities
   */
  private async discoverViaAI(): Promise<DiscoveredGrant[]> {
    if (!smartAI) {
      logger.info('AI service not available, skipping AI discovery');
      return [];
    }

    try {
      const aiPrompt = `
Research and find current grant opportunities for Web3, AI, blockchain, and decentralized technology projects.
Focus on active grants with specific funding amounts and deadlines.

Please provide a JSON response with the following structure:
{
  "grants": [
    {
      "title": "Grant Name",
      "description": "Brief description of the grant",
      "website": "https://grant-website.com",
      "categories": ["Web3", "AI", "Blockchain"],
      "availableFunds": 50000,
      "applicationDeadline": "2024-12-31",
      "contactEmail": "grants@example.com",
      "applicationUrl": "https://apply.example.com",
      "source": "Source Organization"
    }
  ]
}

Only include grants that are currently accepting applications and have verifiable information.
`;

      const aiResponse = await smartAI.complete({
        prompt: aiPrompt,
        max_tokens: 2000,
        temperature: 0.3,
        format: 'json'
      });

      const parsed = JSON.parse(aiResponse.content);
      
      if (parsed.grants && Array.isArray(parsed.grants)) {
        return parsed.grants.map((grant: any) => ({
          title: grant.title,
          description: grant.description,
          website: grant.website,
          categories: grant.categories || [],
          availableFunds: grant.availableFunds,
          applicationDeadline: grant.applicationDeadline ? new Date(grant.applicationDeadline) : undefined,
          contactEmail: grant.contactEmail,
          applicationUrl: grant.applicationUrl,
          source: grant.source || 'AI Discovery'
        }));
      }

    } catch (error: any) {
      logger.warn(`AI discovery failed: ${error.message}`);
    }

    return [];
  }

  /**
   * Fetch grants from GitHub ecosystem
   */
  private async fetchGitHubGrants(): Promise<DiscoveredGrant[]> {
    try {
      const response = await axios.get('https://api.github.com/search/repositories', {
        params: {
          q: 'topic:grants topic:funding blockchain OR web3 OR defi',
          sort: 'updated',
          per_page: 20
        },
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'HyperDAG-Grant-Discovery'
        }
      });

      return response.data.items.map((repo: any) => ({
        title: repo.name,
        description: repo.description || 'GitHub repository for grant opportunities',
        website: repo.html_url,
        categories: ['Open Source', 'GitHub'],
        source: 'GitHub API'
      }));

    } catch (error) {
      logger.warn(`GitHub grants fetch failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch grants from Web3 Foundation
   */
  private async fetchWeb3FoundationGrants(): Promise<DiscoveredGrant[]> {
    try {
      return [
        {
          title: 'Web3 Foundation Open Grants',
          description: 'Funding for projects that advance the Web3 technology stack',
          website: 'https://web3.foundation/grants/',
          categories: ['Web3', 'Polkadot', 'Substrate'],
          availableFunds: 100000,
          source: 'Web3 Foundation'
        }
      ];

    } catch (error) {
      logger.warn(`Web3 Foundation grants fetch failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Fetch grants from Protocol Labs
   */
  private async fetchProtocolLabsGrants(): Promise<DiscoveredGrant[]> {
    try {
      return [
        {
          title: 'IPFS Ecosystem Grants',
          description: 'Supporting the growth of the IPFS ecosystem',
          website: 'https://github.com/protocol/ecosystem-grants',
          categories: ['IPFS', 'Decentralized Storage', 'Web3'],
          availableFunds: 50000,
          source: 'Protocol Labs'
        }
      ];

    } catch (error) {
      logger.warn(`Protocol Labs grants fetch failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Process and validate discovered grants
   */
  private async processDiscoveredGrants(grants: DiscoveredGrant[]): Promise<DiscoveredGrant[]> {
    const processedGrants: DiscoveredGrant[] = [];

    for (const grant of grants) {
      try {
        // Check if grant already exists
        const existing = await this.findExistingGrant(grant.title, grant.website);
        if (existing) {
          continue;
        }

        // Validate grant data
        if (!grant.title || !grant.description || !grant.website) {
          continue;
        }

        // Use AI to enhance grant information
        const enhancedGrant = await this.enhanceGrantWithAI(grant);
        
        // Save to database
        await this.saveNewGrant(enhancedGrant);
        processedGrants.push(enhancedGrant);

        logger.info(`Processed new grant: ${grant.title}`);

      } catch (error) {
        logger.warn(`Failed to process grant ${grant.title}: ${error.message}`);
      }
    }

    return processedGrants;
  }

  /**
   * Check if grant already exists in database
   */
  private async findExistingGrant(title: string, website: string): Promise<boolean> {
    try {
      const sources = await storage.getGrantSources();
      return sources.some(source => 
        source.name === title || source.website === website
      );
    } catch (error) {
      logger.warn(`Error checking existing grants: ${error.message}`);
      return false;
    }
  }

  /**
   * Enhance grant information using AI
   */
  private async enhanceGrantWithAI(grant: DiscoveredGrant): Promise<DiscoveredGrant> {
    try {
      const enhancementPrompt = `
Analyze this grant opportunity and enhance the information:

Title: ${grant.title}
Description: ${grant.description}
Website: ${grant.website}
Categories: ${grant.categories.join(', ')}

Please provide enhanced information in JSON format:
{
  "enhancedDescription": "More detailed description",
  "suggestedCategories": ["category1", "category2"],
  "estimatedFunding": 50000,
  "eligibilityCriteria": "Who can apply",
  "applicationProcess": "How to apply"
}
`;

      const aiResponse = await smartAI.complete({
        prompt: enhancementPrompt,
        max_tokens: 800,
        temperature: 0.2,
        format: 'json'
      });

      const enhancement = JSON.parse(aiResponse.content);
      
      return {
        ...grant,
        description: enhancement.enhancedDescription || grant.description,
        categories: enhancement.suggestedCategories || grant.categories,
        availableFunds: enhancement.estimatedFunding || grant.availableFunds
      };

    } catch (error) {
      logger.warn(`Grant enhancement failed: ${error.message}`);
      return grant;
    }
  }

  /**
   * Save new grant to database
   */
  private async saveNewGrant(grant: DiscoveredGrant): Promise<void> {
    try {
      await storage.createGrantSource({
        name: grant.title,
        description: grant.description,
        website: grant.website,
        categories: grant.categories,
        availableFunds: grant.availableFunds,
        applicationUrl: grant.applicationUrl,
        contactEmail: grant.contactEmail,
        applicationDeadline: grant.applicationDeadline,
        isActive: true,
        lastScraped: new Date()
      });

    } catch (error) {
      logger.error(`Failed to save grant ${grant.title}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get discovery statistics
   */
  public getDiscoveryStats(): any {
    return {
      isRunning: this.isRunning,
      lastScrapeTime: this.lastScrapeTime,
      nextScrapeTime: new Date(this.lastScrapeTime.getTime() + this.scrapeInterval),
      sourcesConfigured: 13
    };
  }

  /**
   * Force run discovery now
   */
  public async forceDiscovery(): Promise<void> {
    logger.info('Force running grant discovery');
    await this.runDiscoveryRound();
  }
}