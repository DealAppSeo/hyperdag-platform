import { storage } from './storage';
import { discoveryRewardService } from './discovery-reward-service';

interface TestingPartnership {
  requesterId: number;
  testerId: number;
  appName: string;
  testingType: 'usability' | 'security' | 'performance' | 'integration';
  skillsNeeded: string[];
  incentive: 'tokens' | 'reciprocal_testing' | 'collaboration_credit';
  status: 'open' | 'matched' | 'in_progress' | 'completed';
  deadline?: Date;
}

interface DiscordCommunity {
  name: string;
  invite_channel: string;
  target_skills: string[];
  community_size: 'small' | 'medium' | 'large';
  engagement_level: 'high' | 'medium' | 'low';
}

/**
 * Discord Testing Partnerships Service
 * Builds relationships through mutual testing while growing HyperDAG's user base
 */
export class DiscordTestingPartnerships {
  private static instance: DiscordTestingPartnerships;

  // Target Discord communities for developer partnerships
  private readonly targetCommunities: DiscordCommunity[] = [
    {
      name: 'Polygon Developers',
      invite_channel: '#testing-feedback',
      target_skills: ['blockchain', 'smart contracts', 'web3'],
      community_size: 'large',
      engagement_level: 'high'
    },
    {
      name: 'React Developers',
      invite_channel: '#help-and-feedback',
      target_skills: ['react', 'javascript', 'frontend'],
      community_size: 'large',
      engagement_level: 'high'
    },
    {
      name: 'Indie Hackers',
      invite_channel: '#feedback-exchange',
      target_skills: ['product', 'design', 'full-stack'],
      community_size: 'medium',
      engagement_level: 'high'
    },
    {
      name: 'AI/ML Engineers',
      invite_channel: '#project-showcase',
      target_skills: ['ai', 'machine learning', 'python'],
      community_size: 'medium',
      engagement_level: 'medium'
    },
    {
      name: 'Node.js Developers',
      invite_channel: '#general',
      target_skills: ['nodejs', 'backend', 'api'],
      community_size: 'large',
      engagement_level: 'medium'
    }
  ];

  public static getInstance(): DiscordTestingPartnerships {
    if (!DiscordTestingPartnerships.instance) {
      DiscordTestingPartnerships.instance = new DiscordTestingPartnerships();
    }
    return DiscordTestingPartnerships.instance;
  }

  /**
   * Create testing request that can be shared in Discord communities
   */
  async createTestingRequest(userId: number, appDetails: any): Promise<TestingPartnership> {
    const user = await storage.getUser(userId);
    if (!user) throw new Error('User not found');

    const testingRequest: TestingPartnership = {
      requesterId: userId,
      testerId: 0, // Will be filled when matched
      appName: appDetails.name,
      testingType: appDetails.type,
      skillsNeeded: appDetails.skills,
      incentive: appDetails.incentive,
      status: 'open',
      deadline: appDetails.deadline
    };

    // Store the testing request
    const savedRequest = await storage.createTestingRequest(testingRequest);

    // Generate Discord community outreach messages
    await this.generateDiscordOutreach(savedRequest, user);

    return savedRequest;
  }

  /**
   * Generate Discord messages optimized for each community
   */
  private async generateDiscordOutreach(request: TestingPartnership, requester: any): Promise<void> {
    const relevantCommunities = this.targetCommunities.filter(community => 
      community.target_skills.some(skill => request.skillsNeeded.includes(skill))
    );

    for (const community of relevantCommunities) {
      const message = this.craftCommunityMessage(request, requester, community);
      
      // Store outreach message for manual posting or bot integration
      await storage.createDiscordOutreach({
        testingRequestId: request.id,
        community: community.name,
        channel: community.invite_channel,
        message: message.content,
        cta: message.cta,
        targetSkills: community.target_skills,
        createdAt: new Date()
      });
    }
  }

  /**
   * Craft community-specific messages for authentic engagement
   */
  private craftCommunityMessage(request: TestingPartnership, requester: any, community: DiscordCommunity): { content: string, cta: string } {
    const messages = {
      'Polygon Developers': {
        content: `Hey builders! 👋

Working on "${request.appName}" - a Web3 platform that helps devs discover exclusive grants and find perfect collaborators. 

Looking for ${request.skillsNeeded.join(', ')} expertise to test our ${request.testingType} implementation.

What you get:
🎯 Priority access to our grant discovery AI 
🤝 Testing credits for your own projects
💰 Discovery tokens in our platform
🔍 Early access to hidden funding opportunities

We're specifically looking for feedback on our blockchain integration and user experience for developers seeking grants.

This is mutual - happy to test your projects too! Building genuine relationships in the dev community.`,
        cta: 'DM me or drop a comment if interested!'
      },
      'React Developers': {
        content: `Looking for React developers to test our grant discovery platform! 🚀

"${request.appName}" helps developers find exclusive grants and team up with perfect collaborators. Think of it as LinkedIn meets AngelList but focused on funding opportunities.

Need feedback on:
• React component architecture
• User experience flow
• Performance optimization
• Mobile responsiveness

Offering:
✅ Testing tokens + reciprocal testing
✅ Early access to our grant matching AI
✅ Collaboration opportunities with other developers
✅ Potential for ongoing partnership

We've found some developers are missing out on $100K+ grants simply because they don't know where to look. Trying to solve that problem.`,
        cta: 'Interested? Let me know and I'll send you access!'
      },
      'Indie Hackers': {
        content: `Fellow indie hackers! Testing exchange opportunity 🤝

Building "${request.appName}" - helps developers discover grants and find collaborators. Currently in beta and need product feedback.

The backstory: Realized most indie devs are missing out on massive funding opportunities because grant databases are scattered and hard to navigate. Built an AI system that finds exclusive opportunities before they hit mainstream sites.

Looking for:
• Product-market fit feedback
• User journey insights  
• Monetization model validation
• Community building strategies

Happy to reciprocate testing for your projects! Building authentic relationships > one-off favors.

Early testers get lifetime priority access to our grant discoveries.`,
        cta: 'Anyone interested in a testing exchange?'
      },
      'AI/ML Engineers': {
        content: `AI/ML community - looking for technical feedback! 🤖

Built an AI system that discovers grants and matches developers with perfect collaborators. Using NLP for grant analysis and recommendation algorithms for team matching.

Technical areas needing review:
• Grant parsing and categorization algorithms
• User skill matching accuracy
• Recommendation system performance
• Data pipeline optimization

This could be interesting for AI engineers looking for funding - our system has already found several AI-specific grants worth $500K+ that weren't listed on major platforms.

Offering testing credits and early access to our AI grant discovery tools.`,
        cta: 'DM me if you want to dive into the technical details!'
      },
      'Node.js Developers': {
        content: `Node.js devs - need backend architecture feedback! ⚡

Working on "${request.appName}" - grant discovery platform built with Node.js/Express. Looking for code review and performance optimization feedback.

Tech stack: Node.js, Express, PostgreSQL, Redis, WebSocket integration

Areas for review:
• API design and scalability
• Database query optimization  
• Real-time notification system
• Authentication/authorization flow

Great for Node devs interested in fintech/Web3 applications. Platform helps developers find funding opportunities and build teams.

Offering reciprocal code reviews and early platform access.`,
        cta: 'Interested in diving into the codebase? Send me a message!'
      }
    };

    return messages[community.name] || {
      content: `Testing exchange opportunity for ${request.appName}! Looking for ${request.skillsNeeded.join(', ')} expertise. Happy to reciprocate testing for your projects. Building genuine dev relationships through mutual support.`,
      cta: 'Interested? Let\'s connect!'
    };
  }

  /**
   * Track successful testing partnerships for rewards
   */
  async completeTestingPartnership(requestId: number, testerId: number, feedback: any): Promise<void> {
    // Update partnership status
    await storage.updateTestingRequest(requestId, { 
      status: 'completed',
      testerId: testerId
    });

    // Award discovery rewards to both parties
    await discoveryRewardService.trackDiscoveryEvent({
      userId: testerId,
      eventType: 'skill_match_click', // Using existing event type
      searchParams: { partnershipType: 'testing_completed' },
      timestamp: new Date()
    });

    // Send completion notifications
    await this.sendPartnershipCompletionNotifications(requestId, testerId, feedback);

    // Track for relationship building
    await this.updatePartnershipNetwork(requestId, testerId);
  }

  /**
   * Send completion notifications to build ongoing relationships
   */
  private async sendPartnershipCompletionNotifications(requestId: number, testerId: number, feedback: any): Promise<void> {
    const request = await storage.getTestingRequest(requestId);
    const requester = await storage.getUser(request.requesterId);
    const tester = await storage.getUser(testerId);

    // Notify requester
    await storage.createNotification({
      userId: request.requesterId,
      type: 'testing_completed',
      message: `🎉 ${tester.username} completed testing for ${request.appName}! Check out their feedback and consider ongoing collaboration.`,
      metadata: { feedback, testerId },
      isRead: false,
      createdAt: new Date()
    });

    // Notify tester 
    await storage.createNotification({
      userId: testerId,
      type: 'testing_completed',
      message: `✅ Testing completed for ${request.appName}! You've earned discovery rewards and collaboration credits with ${requester.username}.`,
      metadata: { requestId, collaborationOpportunity: true },
      isRead: false,
      createdAt: new Date()
    });
  }

  /**
   * Build network of testing relationships for future collaboration
   */
  private async updatePartnershipNetwork(requestId: number, testerId: number): Promise<void> {
    const request = await storage.getTestingRequest(requestId);
    
    // Create bidirectional partnership record
    await storage.createPartnershipConnection({
      user1Id: request.requesterId,
      user2Id: testerId,
      connectionType: 'testing_partnership',
      strength: 'strong', // Completed testing = strong connection
      collaborationHistory: [requestId],
      createdAt: new Date()
    });

    // Both users get access to each other's future testing requests
    await storage.updateUser(request.requesterId, {
      trustedTesters: [...(await this.getTrustedTesters(request.requesterId)), testerId]
    });

    await storage.updateUser(testerId, {
      trustedCollaborators: [...(await this.getTrustedCollaborators(testerId)), request.requesterId]
    });
  }

  /**
   * Generate partnership opportunities from Discord testing relationships
   */
  async suggestPartnershipOpportunities(userId: number): Promise<any[]> {
    const user = await storage.getUser(userId);
    const connections = await storage.getPartnershipConnections(userId);
    
    const opportunities = [];

    for (const connection of connections) {
      const partnerId = connection.user1Id === userId ? connection.user2Id : connection.user1Id;
      const partner = await storage.getUser(partnerId);
      
      // Suggest collaboration based on complementary skills
      const sharedInterests = user.skills.filter(skill => partner.skills.includes(skill));
      const complementarySkills = partner.skills.filter(skill => !user.skills.includes(skill));

      if (complementarySkills.length > 0) {
        opportunities.push({
          partnerId: partner.id,
          partnerName: partner.username,
          connectionStrength: connection.strength,
          sharedSkills: sharedInterests,
          complementarySkills: complementarySkills,
          collaborationType: 'grant_application',
          potentialValue: 'high'
        });
      }
    }

    return opportunities;
  }

  private async getTrustedTesters(userId: number): Promise<number[]> {
    const user = await storage.getUser(userId);
    return user?.trustedTesters || [];
  }

  private async getTrustedCollaborators(userId: number): Promise<number[]> {
    const user = await storage.getUser(userId);
    return user?.trustedCollaborators || [];
  }
}

export const discordTestingPartnerships = DiscordTestingPartnerships.getInstance();