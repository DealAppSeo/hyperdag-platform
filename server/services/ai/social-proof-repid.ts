/**
 * Social Proof RepID Enhancement
 * Adds impact scores, viral sharing, and humanitarian allocation tracking
 * Enables "people helped" metrics for social good viral loops
 */

interface ImpactMetrics {
  id: string;
  userId: string;
  totalImpact: number;        // Overall impact score 0-100
  peopleHelped: number;       // Direct beneficiaries count
  projectsSupported: number;  // GrantFlow contributions
  humanitarianAllocation: number; // % of earnings to humanitarian causes (10-15% target)
  viralCoefficient: number;   // Viral sharing multiplier
  lastUpdated: number;
}

interface SocialProofBadge {
  id: string;
  type: 'impact_warrior' | 'people_helper' | 'grant_supporter' | 'viral_catalyst' | 'humanitarian_hero';
  level: number; // 1-5 stars
  criteria: string;
  unlockedAt: number;
  shareCount: number;
}

interface ViralShare {
  id: string;
  userId: string;
  platform: 'twitter' | 'linkedin' | 'discord' | 'telegram' | 'reddit';
  content: string;
  metrics: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
    clickthroughs: number;
  };
  impactGenerated: number; // New users brought in
  timestamp: number;
}

interface HumanitarianProject {
  id: string;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  beneficiaries: number;
  category: 'education' | 'healthcare' | 'environment' | 'poverty' | 'disaster_relief';
  verified: boolean;
  supporters: string[]; // User IDs
}

export class SocialProofRepIDService {
  private impactMetrics: Map<string, ImpactMetrics> = new Map();
  private socialBadges: Map<string, SocialProofBadge[]> = new Map();
  private viralShares: Map<string, ViralShare[]> = new Map();
  private humanitarianProjects: Map<string, HumanitarianProject> = new Map();
  private globalMetrics = {
    totalPeopleHelped: 0,
    totalHumanitarianFunds: 0,
    totalProjects: 0,
    avgImpactScore: 0
  };

  constructor() {
    this.initializeHumanitarianProjects();
    this.startMetricsUpdateCycle();
  }

  private initializeHumanitarianProjects() {
    const projects: HumanitarianProject[] = [
      {
        id: 'project-education-1',
        name: 'AI Education for Underserved Communities',
        description: 'Providing AI literacy and coding education to underserved youth globally',
        targetAmount: 50000,
        currentAmount: 12340,
        beneficiaries: 2500,
        category: 'education',
        verified: true,
        supporters: []
      },
      {
        id: 'project-healthcare-1',
        name: 'AI-Powered Mental Health Support',
        description: 'Free AI counseling and mental health resources for developing regions',
        targetAmount: 75000,
        currentAmount: 23560,
        beneficiaries: 8900,
        category: 'healthcare',
        verified: true,
        supporters: []
      },
      {
        id: 'project-environment-1',
        name: 'Climate Data Analysis for Small Islands',
        description: 'AI climate monitoring and prediction for climate-vulnerable island nations',
        targetAmount: 100000,
        currentAmount: 45800,
        beneficiaries: 150000,
        category: 'environment',
        verified: true,
        supporters: []
      }
    ];

    projects.forEach(project => this.humanitarianProjects.set(project.id, project));
    
    console.log('[Social Proof RepID] 🌍 Initialized 3 humanitarian projects');
    console.log('[Social Proof RepID] 👥 Total potential beneficiaries: 161,400');
  }

  async updateUserImpact(userId: string, impactData: {
    newPeopleHelped?: number;
    projectsContributed?: string[];
    viralActions?: ViralShare[];
    humanitarianDonation?: number;
  }): Promise<ImpactMetrics> {
    let userImpact = this.impactMetrics.get(userId);
    
    if (!userImpact) {
      userImpact = {
        id: `impact-${userId}`,
        userId,
        totalImpact: 0,
        peopleHelped: 0,
        projectsSupported: 0,
        humanitarianAllocation: 0,
        viralCoefficient: 1.0,
        lastUpdated: Date.now()
      };
    }

    // Update people helped
    if (impactData.newPeopleHelped) {
      userImpact.peopleHelped += impactData.newPeopleHelped;
      this.globalMetrics.totalPeopleHelped += impactData.newPeopleHelped;
    }

    // Update project contributions
    if (impactData.projectsContributed) {
      for (const projectId of impactData.projectsContributed) {
        const project = this.humanitarianProjects.get(projectId);
        if (project && !project.supporters.includes(userId)) {
          project.supporters.push(userId);
          userImpact.projectsSupported += 1;
        }
      }
    }

    // Update viral actions
    if (impactData.viralActions) {
      const userShares = this.viralShares.get(userId) || [];
      userShares.push(...impactData.viralActions);
      this.viralShares.set(userId, userShares);
      
      // Calculate viral coefficient based on engagement
      const totalEngagement = userShares.reduce((sum, share) => 
        sum + share.metrics.likes + share.metrics.shares + share.metrics.comments, 0
      );
      userImpact.viralCoefficient = 1 + (totalEngagement / 1000); // Bonus up to 2x
    }

    // Update humanitarian allocation
    if (impactData.humanitarianDonation) {
      userImpact.humanitarianAllocation += impactData.humanitarianDonation;
      this.globalMetrics.totalHumanitarianFunds += impactData.humanitarianDonation;
    }

    // Calculate total impact score (0-100)
    userImpact.totalImpact = this.calculateTotalImpactScore(userImpact);
    userImpact.lastUpdated = Date.now();
    
    // Update badges
    await this.updateUserBadges(userId, userImpact);
    
    this.impactMetrics.set(userId, userImpact);

    console.log(`[Social Proof RepID] 📈 Updated impact for ${userId}: ${userImpact.totalImpact}/100`);
    console.log(`[Social Proof RepID] 👥 People helped: ${userImpact.peopleHelped}`);
    
    return userImpact;
  }

  private calculateTotalImpactScore(metrics: ImpactMetrics): number {
    // Weighted impact calculation
    const peopleHelpedScore = Math.min(metrics.peopleHelped / 100, 1) * 40; // Max 40 points
    const projectsScore = Math.min(metrics.projectsSupported / 10, 1) * 25; // Max 25 points
    const humanitarianScore = Math.min(metrics.humanitarianAllocation / 1000, 1) * 20; // Max 20 points
    const viralScore = Math.min((metrics.viralCoefficient - 1) * 10, 1) * 15; // Max 15 points
    
    return Math.round(peopleHelpedScore + projectsScore + humanitarianScore + viralScore);
  }

  private async updateUserBadges(userId: string, impact: ImpactMetrics): Promise<void> {
    const currentBadges = this.socialBadges.get(userId) || [];
    const newBadges: SocialProofBadge[] = [];

    // Impact Warrior Badge (based on total impact score)
    if (impact.totalImpact >= 20 && !currentBadges.find(b => b.type === 'impact_warrior')) {
      newBadges.push({
        id: `badge-${Date.now()}-impact`,
        type: 'impact_warrior',
        level: Math.min(Math.floor(impact.totalImpact / 20), 5),
        criteria: `Achieved ${impact.totalImpact}/100 impact score`,
        unlockedAt: Date.now(),
        shareCount: 0
      });
    }

    // People Helper Badge (based on people helped)
    if (impact.peopleHelped >= 10 && !currentBadges.find(b => b.type === 'people_helper')) {
      newBadges.push({
        id: `badge-${Date.now()}-helper`,
        type: 'people_helper',
        level: Math.min(Math.floor(impact.peopleHelped / 25), 5),
        criteria: `Directly helped ${impact.peopleHelped} people`,
        unlockedAt: Date.now(),
        shareCount: 0
      });
    }

    // Grant Supporter Badge (based on projects supported)
    if (impact.projectsSupported >= 3 && !currentBadges.find(b => b.type === 'grant_supporter')) {
      newBadges.push({
        id: `badge-${Date.now()}-grants`,
        type: 'grant_supporter',
        level: Math.min(Math.floor(impact.projectsSupported / 2), 5),
        criteria: `Supported ${impact.projectsSupported} humanitarian projects`,
        unlockedAt: Date.now(),
        shareCount: 0
      });
    }

    // Viral Catalyst Badge (based on viral coefficient)
    if (impact.viralCoefficient >= 1.5 && !currentBadges.find(b => b.type === 'viral_catalyst')) {
      newBadges.push({
        id: `badge-${Date.now()}-viral`,
        type: 'viral_catalyst',
        level: Math.min(Math.floor((impact.viralCoefficient - 1) * 5), 5),
        criteria: `${((impact.viralCoefficient - 1) * 100).toFixed(0)}% viral engagement boost`,
        unlockedAt: Date.now(),
        shareCount: 0
      });
    }

    // Humanitarian Hero Badge (based on allocation percentage)
    const allocationPercent = (impact.humanitarianAllocation / Math.max(impact.totalImpact * 100, 1)) * 100;
    if (allocationPercent >= 10 && !currentBadges.find(b => b.type === 'humanitarian_hero')) {
      newBadges.push({
        id: `badge-${Date.now()}-humanitarian`,
        type: 'humanitarian_hero',
        level: Math.min(Math.floor(allocationPercent / 5), 5),
        criteria: `${allocationPercent.toFixed(1)}% humanitarian allocation`,
        unlockedAt: Date.now(),
        shareCount: 0
      });
    }

    if (newBadges.length > 0) {
      this.socialBadges.set(userId, [...currentBadges, ...newBadges]);
      console.log(`[Social Proof RepID] 🏆 Awarded ${newBadges.length} new badges to ${userId}`);
    }
  }

  async generateViralShareContent(userId: string, platform: string): Promise<{
    content: string;
    imageUrl?: string;
    hashtags: string[];
    callToAction: string;
  }> {
    const userImpact = this.impactMetrics.get(userId);
    const userBadges = this.socialBadges.get(userId) || [];
    
    if (!userImpact) {
      throw new Error('User impact data not found');
    }

    const templates = {
      twitter: {
        content: `🌟 I've helped ${userImpact.peopleHelped} people through AI-powered social good!\n\n📊 Impact Score: ${userImpact.totalImpact}/100\n🏆 Badges: ${userBadges.length}\n💝 Humanitarian: ${userImpact.humanitarianAllocation.toFixed(0)}$\n\nJoin the TRinity Network and make an impact! 🚀`,
        hashtags: ['#AIForGood', '#SocialImpact', '#TrinityNetwork', '#PeopleHelped', '#HumanitarianTech'],
        callToAction: 'Click to join and start making an impact!'
      },
      linkedin: {
        content: `Proud to share my impact through the TRinity Network! 🌍\n\n✨ People directly helped: ${userImpact.peopleHelped}\n📈 Projects supported: ${userImpact.projectsSupported}\n💝 Humanitarian allocation: $${userImpact.humanitarianAllocation.toFixed(0)}\n🏆 Impact score: ${userImpact.totalImpact}/100\n\nAI technology can be a force for good when we work together. The Trinity Network enables passionate professionals to earn while creating positive social impact.\n\nInterested in combining your skills with meaningful work?`,
        hashtags: ['#SocialImpact', '#AIForGood', '#TechForGood', '#HumanitarianTech', '#MeaningfulWork'],
        callToAction: 'Connect with me to learn more about impactful AI work!'
      },
      discord: {
        content: `🔥 Trinity Network Impact Update! 🔥\n\n👥 People helped: **${userImpact.peopleHelped}**\n🏆 Impact level: **${userImpact.totalImpact}/100**\n💎 Badges earned: **${userBadges.length}**\n🌍 Humanitarian funds: **$${userImpact.humanitarianAllocation.toFixed(0)}**\n\nWho else is building for social good? Drop your impact below! 👇`,
        hashtags: ['TrinityNetwork', 'AIForGood', 'SocialImpact'],
        callToAction: 'React with 🌟 if you want to help people with AI!'
      }
    };

    const template = templates[platform] || templates.twitter;
    
    // Generate dynamic image URL based on impact
    const imageUrl = this.generateImpactVisualization(userImpact, userBadges);
    
    return {
      content: template.content,
      imageUrl,
      hashtags: template.hashtags,
      callToAction: template.callToAction
    };
  }

  private generateImpactVisualization(impact: ImpactMetrics, badges: SocialProofBadge[]): string {
    // Generate a data URL for impact visualization
    // In production, this would generate an actual chart/infographic
    const params = new URLSearchParams({
      impact: impact.totalImpact.toString(),
      people: impact.peopleHelped.toString(),
      projects: impact.projectsSupported.toString(),
      badges: badges.length.toString(),
      humanitarian: impact.humanitarianAllocation.toFixed(0)
    });
    
    return `https://api.trinitynetwork.io/impact-card?${params.toString()}`;
  }

  async trackViralEngagement(shareId: string, engagement: {
    views?: number;
    likes?: number;
    shares?: number;
    comments?: number;
    clickthroughs?: number;
  }): Promise<void> {
    // Find and update the viral share
    for (const [userId, shares] of this.viralShares) {
      const share = shares.find(s => s.id === shareId);
      if (share) {
        // Update metrics
        Object.assign(share.metrics, engagement);
        
        // Calculate impact generated (1 clickthrough = 0.1 impact)
        share.impactGenerated = (share.metrics.clickthroughs || 0) * 0.1;
        
        // Update user's viral coefficient
        await this.updateUserImpact(userId, { viralActions: [share] });
        
        console.log(`[Social Proof RepID] 📊 Updated engagement for share ${shareId}`);
        break;
      }
    }
  }

  getGlobalImpactMetrics(): {
    totalPeopleHelped: number;
    totalHumanitarianFunds: number;
    activeProjects: number;
    avgImpactScore: number;
    topContributors: Array<{userId: string, impact: number, peopleHelped: number}>;
  } {
    const allUsers = Array.from(this.impactMetrics.values());
    const avgImpact = allUsers.length > 0 
      ? allUsers.reduce((sum, u) => sum + u.totalImpact, 0) / allUsers.length 
      : 0;

    const topContributors = allUsers
      .sort((a, b) => b.totalImpact - a.totalImpact)
      .slice(0, 10)
      .map(u => ({
        userId: u.userId,
        impact: u.totalImpact,
        peopleHelped: u.peopleHelped
      }));

    return {
      totalPeopleHelped: this.globalMetrics.totalPeopleHelped,
      totalHumanitarianFunds: this.globalMetrics.totalHumanitarianFunds,
      activeProjects: this.humanitarianProjects.size,
      avgImpactScore: Math.round(avgImpact),
      topContributors
    };
  }

  private startMetricsUpdateCycle() {
    // Update global metrics every hour
    setInterval(() => {
      this.updateGlobalMetrics();
    }, 3600000);

    console.log('[Social Proof RepID] 📊 Metrics update cycle started (hourly)');
  }

  private updateGlobalMetrics() {
    const allUsers = Array.from(this.impactMetrics.values());
    
    this.globalMetrics.totalPeopleHelped = allUsers.reduce((sum, u) => sum + u.peopleHelped, 0);
    this.globalMetrics.totalHumanitarianFunds = allUsers.reduce((sum, u) => sum + u.humanitarianAllocation, 0);
    this.globalMetrics.avgImpactScore = allUsers.length > 0 
      ? allUsers.reduce((sum, u) => sum + u.totalImpact, 0) / allUsers.length 
      : 0;

    console.log('[Social Proof RepID] 🌍 Global metrics updated');
    console.log(`[Social Proof RepID] 👥 Total people helped: ${this.globalMetrics.totalPeopleHelped}`);
    console.log(`[Social Proof RepID] 💰 Humanitarian funds: $${this.globalMetrics.totalHumanitarianFunds.toFixed(0)}`);
  }

  // Integration with GrantFlow for automated contribution tracking
  async linkGrantFlowContribution(userId: string, grantId: string, amount: number): Promise<void> {
    const humanitarianAmount = amount * 0.15; // 15% humanitarian allocation
    
    await this.updateUserImpact(userId, {
      projectsContributed: [grantId],
      humanitarianDonation: humanitarianAmount,
      newPeopleHelped: Math.floor(amount / 10) // Estimate 1 person helped per $10
    });

    console.log(`[Social Proof RepID] 💝 GrantFlow contribution linked: $${amount} → $${humanitarianAmount} humanitarian`);
  }
}

export const socialProofRepID = new SocialProofRepIDService();