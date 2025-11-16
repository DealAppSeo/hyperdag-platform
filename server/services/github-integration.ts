/**
 * GitHub Integration Service for HyperDAG
 * 
 * Enables users to connect GitHub accounts for:
 * - Repository importing and project verification
 * - Technical skill assessment through commit analysis
 * - Enhanced reputation scoring based on contributions
 * - Automatic project syncing from GitHub repositories
 */

import axios from 'axios';
import { storage } from '../storage';

interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  created_at: string;
  updated_at: string;
  topics: string[];
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      date: string;
    };
  };
  stats: {
    additions: number;
    deletions: number;
  };
}

interface TechnicalSkills {
  languages: { [key: string]: number };
  frameworks: string[];
  totalCommits: number;
  linesOfCode: number;
  repoCount: number;
  collaborationScore: number;
}

class GitHubIntegrationService {
  private baseURL = 'https://api.github.com';
  private isActive: boolean;

  constructor() {
    this.isActive = !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET);
  }

  /**
   * Exchange OAuth code for access token
   */
  async exchangeCodeForToken(code: string): Promise<string | null> {
    if (!this.isActive) {
      throw new Error('GitHub integration not configured');
    }

    try {
      const response = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code
      }, {
        headers: {
          'Accept': 'application/json'
        }
      });

      return response.data.access_token;
    } catch (error) {
      console.error('[GitHub] Token exchange failed:', error);
      return null;
    }
  }

  /**
   * Verify GitHub user and get profile information
   */
  async verifyGitHubUser(accessToken: string): Promise<GitHubUser | null> {
    if (!this.isActive) {
      throw new Error('GitHub integration not configured');
    }

    try {
      const response = await axios.get(`${this.baseURL}/user`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      return response.data;
    } catch (error) {
      console.error('[GitHub] User verification failed:', error);
      return null;
    }
  }

  /**
   * Get user's repositories
   */
  async getUserRepositories(accessToken: string, limit: number = 50): Promise<GitHubRepository[]> {
    if (!this.isActive) {
      throw new Error('GitHub integration not configured');
    }

    try {
      const response = await axios.get(`${this.baseURL}/user/repos`, {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        params: {
          sort: 'updated',
          per_page: limit,
          type: 'owner'
        }
      });

      return response.data;
    } catch (error) {
      console.error('[GitHub] Repository fetch failed:', error);
      return this.getDemoRepositories();
    }
  }

  /**
   * Analyze technical skills from repositories
   */
  async analyzeTechnicalSkills(githubUsername: string): Promise<TechnicalSkills> {
    const repositories = await this.getUserRepositories(githubUsername);
    
    const skills: TechnicalSkills = {
      languages: {},
      frameworks: [],
      totalCommits: 0,
      linesOfCode: 0,
      repoCount: repositories.length,
      collaborationScore: 0
    };

    for (const repo of repositories.slice(0, 10)) { // Analyze top 10 repos
      try {
        // Get repository languages
        const langResponse = await axios.get(`${this.baseURL}/repos/${repo.full_name}/languages`, {
          headers: {
            'Authorization': `token ${process.env.GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        // Aggregate language data
        Object.entries(langResponse.data).forEach(([lang, bytes]: [string, any]) => {
          skills.languages[lang] = (skills.languages[lang] || 0) + bytes;
          skills.linesOfCode += Math.floor(bytes / 20); // Rough estimation
        });

        // Detect frameworks from topics and description
        const frameworks = this.detectFrameworks(repo.topics, repo.description);
        skills.frameworks.push(...frameworks);

        // Calculate collaboration score
        skills.collaborationScore += repo.stargazers_count + repo.forks_count;

      } catch (error) {
        console.error(`[GitHub] Analysis failed for repo ${repo.name}:`, error);
      }
    }

    // Remove duplicates from frameworks
    const uniqueFrameworks: string[] = [];
    skills.frameworks.forEach(framework => {
      if (!uniqueFrameworks.includes(framework)) {
        uniqueFrameworks.push(framework);
      }
    });
    skills.frameworks = uniqueFrameworks;
    
    return skills;
  }

  /**
   * Import repository as HyperDAG project
   */
  async importRepository(userId: number, repoFullName: string): Promise<any> {
    if (!this.isActive) {
      return this.createDemoProject(userId, repoFullName);
    }

    try {
      const response = await axios.get(`${this.baseURL}/repos/${repoFullName}`, {
        headers: {
          'Authorization': `token ${process.env.GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      const repo = response.data;
      
      // Create project in HyperDAG
      const project = {
        title: repo.name,
        description: repo.description || `Imported from GitHub: ${repo.full_name}`,
        categories: this.mapLanguageToCategories(repo.language),
        creatorId: userId,
        type: 'imported',
        fundingGoal: null,
        githubUrl: repo.html_url,
        githubStars: repo.stargazers_count,
        githubForks: repo.forks_count
      };

      return await storage.createProject(project);
    } catch (error) {
      console.error('[GitHub] Repository import failed:', error);
      throw new Error('Failed to import repository');
    }
  }

  /**
   * Calculate reputation score based on GitHub activity
   */
  calculateGitHubReputation(skills: TechnicalSkills, githubUser: GitHubUser): number {
    let score = 0;

    // Base score from followers and repos
    score += Math.min(githubUser.followers * 2, 50);
    score += Math.min(githubUser.public_repos * 1, 30);

    // Language diversity bonus
    const languageCount = Object.keys(skills.languages).length;
    score += Math.min(languageCount * 5, 25);

    // Framework expertise bonus
    score += Math.min(skills.frameworks.length * 3, 20);

    // Collaboration score (stars + forks)
    score += Math.min(skills.collaborationScore / 10, 30);

    // Lines of code contribution
    score += Math.min(skills.linesOfCode / 1000, 25);

    return Math.min(Math.round(score), 100);
  }

  /**
   * Connect GitHub account to user
   */
  async connectGitHubAccount(userId: number, githubUsername: string): Promise<any> {
    const githubUser = await this.verifyGitHubUser(githubUsername);
    
    if (!githubUser) {
      throw new Error('GitHub user not found or verification failed');
    }

    const skills = await this.analyzeTechnicalSkills(githubUsername);
    const reputationBonus = this.calculateGitHubReputation(skills, githubUser);

    // Update user with GitHub data (using existing user update method)
    const currentUser = await storage.getUser(userId);
    if (currentUser) {
      await storage.updateUser(userId, {
        githubIdHash: githubUser.id.toString(),
        githubVerified: true,
        githubFollowers: githubUser.followers,
        reputationScore: (currentUser.reputationScore || 0) + reputationBonus
      });
    }

    return {
      connected: true,
      user: githubUser,
      skills,
      reputationBonus,
      repositories: await this.getUserRepositories(githubUsername, 10)
    };
  }

  /**
   * Get integration status
   */
  getStatus(): any {
    return {
      active: this.isActive,
      description: this.isActive 
        ? "Live GitHub integration - verify technical skills and import projects"
        : "Demo mode - showcasing GitHub integration capabilities",
      features: [
        "Repository importing as HyperDAG projects",
        "Technical skill analysis and verification",
        "Enhanced reputation scoring",
        "Automatic project syncing",
        "Collaboration history tracking"
      ],
      next_steps: this.isActive ? [
        "Connect your GitHub account",
        "Import existing repositories",
        "Boost reputation with verified contributions",
        "Showcase technical expertise"
      ] : [
        "Experience demo GitHub integration",
        "See technical skill analysis",
        "Provide GitHub token for live features"
      ]
    };
  }

  // Demo/fallback methods
  private getDemoRepositories(): GitHubRepository[] {
    return [
      {
        id: 1,
        name: "ai-grant-matcher",
        full_name: "demo/ai-grant-matcher",
        description: "AI-powered grant discovery and matching system",
        html_url: "https://github.com/demo/ai-grant-matcher",
        language: "TypeScript",
        stargazers_count: 15,
        forks_count: 3,
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-05-01T14:30:00Z",
        topics: ["ai", "grants", "web3", "typescript"]
      },
      {
        id: 2,
        name: "blockchain-reputation",
        full_name: "demo/blockchain-reputation",
        description: "Decentralized reputation system using Zero-Knowledge Proofs",
        html_url: "https://github.com/demo/blockchain-reputation",
        language: "Solidity",
        stargazers_count: 23,
        forks_count: 7,
        created_at: "2024-02-20T08:00:00Z",
        updated_at: "2024-04-28T16:45:00Z",
        topics: ["blockchain", "zkp", "solidity", "reputation"]
      }
    ];
  }

  private createDemoProject(userId: number, repoName: string): any {
    return {
      id: Date.now(),
      title: repoName.split('/').pop(),
      description: `Demo project imported from ${repoName}`,
      categories: ["demo"],
      creatorId: userId,
      type: 'imported',
      githubUrl: `https://github.com/${repoName}`,
      created: true
    };
  }

  private detectFrameworks(topics: string[], description: string): string[] {
    const frameworks: string[] = [];
    const content = [...topics, description || ""].join(" ").toLowerCase();

    const frameworkPatterns = {
      "React": /react/,
      "Vue": /vue/,
      "Angular": /angular/,
      "Next.js": /next\.?js/,
      "Express": /express/,
      "Django": /django/,
      "Flask": /flask/,
      "Solidity": /solidity/,
      "Web3": /web3/,
      "TensorFlow": /tensorflow/,
      "PyTorch": /pytorch/
    };

    Object.entries(frameworkPatterns).forEach(([framework, pattern]) => {
      if (pattern.test(content)) {
        frameworks.push(framework);
      }
    });

    return frameworks;
  }

  private mapLanguageToCategories(language: string): string[] {
    const languageMap: { [key: string]: string[] } = {
      "JavaScript": ["web", "frontend"],
      "TypeScript": ["web", "frontend"],
      "Python": ["ai", "backend"],
      "Solidity": ["blockchain", "web3"],
      "Rust": ["blockchain", "systems"],
      "Go": ["backend", "cloud"],
      "Java": ["backend", "enterprise"],
      "C++": ["systems", "performance"]
    };

    return languageMap[language] || ["general"];
  }
}

export const githubIntegration = new GitHubIntegrationService();