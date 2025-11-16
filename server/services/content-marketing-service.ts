import { storage } from './storage';

interface ContentTrigger {
  grantId: string;
  grantTitle: string;
  fundingAmount: number;
  deadline: Date;
  exclusiveAccess: boolean;
  skillsRequired: string[];
}

interface MarketingContent {
  platform: 'twitter' | 'linkedin' | 'reddit' | 'dev_communities';
  contentType: 'grant_alert' | 'success_story' | 'discovery_tip' | 'exclusive_opportunity';
  headline: string;
  body: string;
  cta: string;
  targetAudience: string[];
}

/**
 * Content Marketing Service - Attracts developers seeking grants
 * Focus: Real grant discoveries that create FOMO and drive sign-ups
 */
export class ContentMarketingService {
  private static instance: ContentMarketingService;

  public static getInstance(): ContentMarketingService {
    if (!ContentMarketingService.instance) {
      ContentMarketingService.instance = new ContentMarketingService();
    }
    return ContentMarketingService.instance;
  }

  /**
   * Generate content when exclusive grants are discovered
   */
  async createGrantDiscoveryContent(grant: ContentTrigger): Promise<MarketingContent[]> {
    const content: MarketingContent[] = [];

    // Twitter thread for urgent opportunities
    if (this.isUrgentOpportunity(grant)) {
      content.push(this.createTwitterThread(grant));
    }

    // LinkedIn post for professional developers
    content.push(this.createLinkedInPost(grant));

    // Reddit posts for specific developer communities
    content.push(...this.createRedditPosts(grant));

    // Dev community posts (Discord, Telegram)
    content.push(...this.createDevCommunityPosts(grant));

    return content;
  }

  /**
   * Create FOMO-driven Twitter thread
   */
  private createTwitterThread(grant: ContentTrigger): MarketingContent {
    const urgencyDays = Math.ceil((grant.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    return {
      platform: 'twitter',
      contentType: 'grant_alert',
      headline: `🚨 URGENT: $${grant.fundingAmount.toLocaleString()} grant closing in ${urgencyDays} days`,
      body: `Thread: Hidden grant opportunities for ${grant.skillsRequired.join(', ')} developers 🧵

1/ Just discovered "${grant.grantTitle}" - $${grant.fundingAmount.toLocaleString()} available
Not listed on major grant databases yet ⚡

2/ Perfect for devs with: ${grant.skillsRequired.slice(0, 3).join(', ')}
Deadline: ${grant.deadline.toLocaleDateString()}
Competition level: LOW (early discovery) 📈

3/ This is why I built HyperDAG - to find these hidden opportunities before they go mainstream. 

Our AI scans 100+ sources daily for grants that others miss 🤖

4/ Want early access to discoveries like this?
Join 500+ developers already finding exclusive opportunities 👇`,
      cta: 'Get exclusive grant access: hyperdag.org/discover',
      targetAudience: ['blockchain_devs', 'ai_developers', 'web3_builders']
    };
  }

  /**
   * Create professional LinkedIn post
   */
  private createLinkedInPost(grant: ContentTrigger): MarketingContent {
    return {
      platform: 'linkedin',
      contentType: 'exclusive_opportunity',
      headline: `Exclusive: $${grant.fundingAmount.toLocaleString()} funding opportunity for ${grant.skillsRequired[0]} developers`,
      body: `I've been testing an AI system that finds grants before they're widely announced, and the results have been impressive.

Today's discovery: "${grant.grantTitle}"
💰 Funding: $${grant.fundingAmount.toLocaleString()}
🎯 Perfect for: ${grant.skillsRequired.join(', ')} expertise
⏰ Deadline: ${grant.deadline.toLocaleDateString()}
🔍 Source: Not yet listed on major grant platforms

What makes this interesting:
→ Low competition (early discovery phase)
→ Specific skill match for current market needs  
→ Clear application pathway

For developers building in Web3/AI: These early discoveries can be game-changing. The difference between finding opportunities at announcement vs. 2-3 weeks later is often the difference between acceptance and rejection.

I'm sharing these discoveries through HyperDAG for developers who want that competitive edge.

#Grants #WebDevelopment #AI #Blockchain #Funding`,
      cta: 'Access exclusive grant discoveries: hyperdag.org',
      targetAudience: ['senior_developers', 'tech_leads', 'startup_founders']
    };
  }

  /**
   * Create targeted Reddit posts
   */
  private createRedditPosts(grant: ContentTrigger): MarketingContent[] {
    const posts: MarketingContent[] = [];

    // r/webdev post
    if (grant.skillsRequired.includes('javascript') || grant.skillsRequired.includes('react')) {
      posts.push({
        platform: 'reddit',
        contentType: 'discovery_tip',
        headline: `PSA: Found a $${grant.fundingAmount.toLocaleString()} grant for React/JS devs that's not on the usual sites`,
        body: `Not sure if this breaks any rules, but wanted to share a discovery method that's been working for me.

Been using an AI tool that scans for grants across multiple databases (not just the obvious ones like grants.gov). Found this one today:

"${grant.grantTitle}" - $${grant.fundingAmount.toLocaleString()}
Deadline: ${grant.deadline.toLocaleDateString()}
Skills: ${grant.skillsRequired.join(', ')}

The interesting part: It's not showing up on the major grant aggregators yet. Seems like they're doing targeted outreach before public announcement.

For anyone else hunting grants: The early bird advantage is real. Applications submitted in the first week vs. last week have significantly different acceptance rates.

Happy to share the discovery method if people are interested.`,
        cta: 'DM for grant discovery tips',
        targetAudience: ['javascript_developers', 'react_developers', 'fullstack_developers']
      });
    }

    // r/ethereum for blockchain grants
    if (grant.skillsRequired.includes('blockchain') || grant.skillsRequired.includes('ethereum')) {
      posts.push({
        platform: 'reddit',
        contentType: 'grant_alert',
        headline: `Early access: $${grant.fundingAmount.toLocaleString()} blockchain grant (deadline ${grant.deadline.toLocaleDateString()})`,
        body: `Found this through my grant monitoring setup:

"${grant.grantTitle}"
Amount: $${grant.fundingAmount.toLocaleString()}
Focus: ${grant.skillsRequired.join(', ')}
Application deadline: ${grant.deadline.toLocaleDateString()}

What's interesting: This isn't posted on the major crypto grant lists yet. Seems to be in the pre-announcement phase where they're doing targeted outreach.

For context: I've been tracking how grants get announced and there's usually a 2-3 week window between "insider knowledge" and public posting. Early applications have much higher success rates.

Building tools to democratize this discovery process because the current system favors those with insider networks.`,
        cta: 'More grant discoveries: hyperdag.org/blockchain-grants',
        targetAudience: ['blockchain_developers', 'ethereum_developers', 'defi_builders']
      });
    }

    return posts;
  }

  /**
   * Create posts for developer communities (Discord, Telegram)
   */
  private createDevCommunityPosts(grant: ContentTrigger): MarketingContent[] {
    return [{
      platform: 'dev_communities',
      contentType: 'exclusive_opportunity',
      headline: `🎯 Exclusive Grant Alert: $${grant.fundingAmount.toLocaleString()} for ${grant.skillsRequired[0]} devs`,
      body: `Hey devs! 👋

Just discovered a grant that's perfect for our community:

💰 **"${grant.grantTitle}"**
📊 Amount: $${grant.fundingAmount.toLocaleString()}
🛠️ Skills: ${grant.skillsRequired.join(', ')}
⏰ Deadline: ${grant.deadline.toLocaleDateString()}
🔍 Status: Early discovery (not on major platforms yet)

Why this matters:
• Low competition phase
• Perfect skill match for this community
• Clear application pathway
• ${Math.ceil((grant.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days to prepare

I've been building AI tools to find these opportunities before they hit the mainstream grant sites. The early bird advantage is substantial.

Drop a 🚀 if you're applying!`,
      cta: 'Join the grant discovery network: hyperdag.org',
      targetAudience: ['discord_developers', 'telegram_crypto_groups', 'dev_communities']
    }];
  }

  /**
   * Determine if grant requires urgent marketing
   */
  private isUrgentOpportunity(grant: ContentTrigger): boolean {
    const daysUntilDeadline = Math.ceil((grant.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilDeadline <= 14 && grant.fundingAmount >= 50000;
  }

  /**
   * Generate success story content from user wins
   */
  async createSuccessStoryContent(userId: number, grantWon: any): Promise<MarketingContent[]> {
    const user = await storage.getUser(userId);
    if (!user) return [];

    const content: MarketingContent[] = [];

    // Anonymous success story for social proof
    content.push({
      platform: 'twitter',
      contentType: 'success_story',
      headline: `💰 RESULT: HyperDAG user just won $${grantWon.amount.toLocaleString()} grant`,
      body: `Real results from our grant discovery platform:

✅ User found "${grantWon.title}" through early discovery
✅ Applied within 48 hours of posting
✅ Won $${grantWon.amount.toLocaleString()} funding
✅ Beat 200+ other applicants

The secret: Early discovery + perfect skill matching

They found this grant 2 weeks before it hit the major databases. That timing advantage was crucial.

This is exactly why we built HyperDAG - to democratize access to exclusive opportunities.

Next early discovery alert goes out tomorrow 👀`,
      cta: 'Get early grant access: hyperdag.org',
      targetAudience: ['aspiring_grant_winners', 'bootstrap_developers']
    });

    return content;
  }

  /**
   * Schedule content distribution across platforms
   */
  async scheduleContentDistribution(content: MarketingContent[]): Promise<void> {
    for (const post of content) {
      // In a real implementation, this would integrate with:
      // - Twitter API for automated posting
      // - LinkedIn API for professional content
      // - Reddit API for community posts
      // - Discord/Telegram webhooks for dev communities
      
      console.log(`[ContentMarketing] Scheduled ${post.contentType} for ${post.platform}`);
      console.log(`Headline: ${post.headline}`);
      console.log(`CTA: ${post.cta}`);
      console.log('---');
    }
  }
}

export const contentMarketingService = ContentMarketingService.getInstance();