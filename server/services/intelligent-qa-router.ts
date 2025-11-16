import OpenAI from 'openai';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Perplexity client (uses OpenAI-compatible API)
const perplexity = new OpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY,
  baseURL: 'https://api.perplexity.ai',
});

// Note: Groq API access currently limited - using four active providers

// Together AI - Open models with generous free tier
const together = new OpenAI({
  apiKey: process.env.TOGETHER_API_KEY,
  baseURL: 'https://api.together.xyz/v1',
});

// Cohere - Excellent for text generation and analysis (1000 calls/month free)
const cohere = new OpenAI({
  apiKey: process.env.COHERE_API_KEY,
  baseURL: 'https://api.cohere.ai/v1',
});

// SambaNova - High-performance models with unlimited free API access
const sambanova = new OpenAI({
  apiKey: process.env.SAMBANOVA_API_KEY,
  baseURL: 'https://api.sambanova.ai/v1',
});

interface UserContext {
  userId?: number;
  onboardingStage?: number;
  interests?: string[];
  currentPage?: string;
  conversationHistory?: AIMessage[];
  userGoals?: string[];
  currentProject?: string;
}

interface AIMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
  agentUsed?: string;
  category?: string;
}

interface QuestionCategory {
  name: string;
  keywords: string[];
  preferredAgent: 'openai' | 'perplexity' | 'together' | 'cohere' | 'sambanova';
  priority: number;
}

// Question categorization with fuzzy logic for HyperDAG features
const questionCategories: QuestionCategory[] = [
  {
    name: 'hyperdag_platform',
    keywords: ['hyperdag', 'platform', 'features', 'how does', 'what is', 'zkp', 'zero knowledge', 'proof'],
    preferredAgent: 'openai',
    priority: 1
  },
  {
    name: 'zkp_credentials',
    keywords: ['soulbound', 'sbt', 'charity bound', 'cbt', 'digital bound', 'dbt', 'credentials', 'identity', 'verification', '4fa', 'proof of life'],
    preferredAgent: 'openai',
    priority: 1
  },
  {
    name: 'grants_funding',
    keywords: ['grant', 'funding', 'rfi', 'rfp', 'proposal', 'crowdfunding', 'donation', 'matching', 'charity', 'nonprofit'],
    preferredAgent: 'openai',
    priority: 1
  },
  {
    name: 'reputation_system',
    keywords: ['reputation', 'points', 'score', 'leaderboard', 'achievements', 'trust', 'social proof', 'ranking'],
    preferredAgent: 'openai',
    priority: 1
  },
  {
    name: 'project_collaboration',
    keywords: ['project', 'collaboration', 'team', 'github', 'repository', 'contributor', 'marketplace', 'open source'],
    preferredAgent: 'openai',
    priority: 2
  },
  {
    name: 'career_guidance',
    keywords: ['career', 'job', 'skill', 'learn', 'development', 'growth', 'opportunity', 'networking', 'mbti', 'personality'],
    preferredAgent: 'openai',
    priority: 1
  },
  {
    name: 'privacy_security',
    keywords: ['privacy', 'security', 'gdpr', 'data protection', 'anonymization', 'encryption', 'consent', 'selective disclosure'],
    preferredAgent: 'openai',
    priority: 2
  },
  {
    name: 'web3_blockchain',
    keywords: ['web3', 'blockchain', 'crypto', 'ethereum', 'solana', 'polygon', 'smart contract', 'defi', 'nft', 'interoperability'],
    preferredAgent: 'perplexity',
    priority: 3
  },
  {
    name: 'technical_help',
    keywords: ['error', 'problem', 'bug', 'issue', 'troubleshoot', 'not working', 'help', 'support', 'integration'],
    preferredAgent: 'openai',
    priority: 2
  },
  {
    name: 'ai_development',
    keywords: ['ai', 'artificial intelligence', 'machine learning', 'ml', 'training', 'model', 'algorithm', 'llm'],
    preferredAgent: 'perplexity',
    priority: 3
  },
  {
    name: 'creative_writing',
    keywords: ['creative', 'story', 'content', 'writing', 'blog', 'article', 'copy', 'marketing', 'social media'],
    preferredAgent: 'sambanova',
    priority: 2
  },
  {
    name: 'code_analysis',
    keywords: ['code', 'programming', 'debug', 'refactor', 'optimize', 'review', 'syntax', 'function', 'algorithm'],
    preferredAgent: 'sambanova',
    priority: 2
  },
  {
    name: 'general_questions',
    keywords: ['what', 'how', 'why', 'explain', 'tell me', 'describe', 'compare', 'analyze'],
    preferredAgent: 'sambanova',
    priority: 4
  }
];

// Agent usage tracking for load balancing
interface AgentStatus {
  openai: {
    requestCount: number;
    lastReset: Date;
    available: boolean;
  };
  perplexity: {
    requestCount: number;
    lastReset: Date;
    available: boolean;
  };
  together: {
    requestCount: number;
    lastReset: Date;
    available: boolean;
  };
  cohere: {
    requestCount: number;
    lastReset: Date;
    available: boolean;
  };
  sambanova: {
    requestCount: number;
    lastReset: Date;
    available: boolean;
  };
}

let agentStatus: AgentStatus = {
  openai: {
    requestCount: 0,
    lastReset: new Date(),
    available: true
  },
  perplexity: {
    requestCount: 0,
    lastReset: new Date(),
    available: true
  },
  together: {
    requestCount: 0,
    lastReset: new Date(),
    available: true
  },
  cohere: {
    requestCount: 0,
    lastReset: new Date(),
    available: true
  },
  sambanova: {
    requestCount: 0,
    lastReset: new Date(),
    available: true
  }
};

// Reset counters every hour
setInterval(() => {
  agentStatus.openai.requestCount = 0;
  agentStatus.openai.lastReset = new Date();
  agentStatus.perplexity.requestCount = 0;
  agentStatus.perplexity.lastReset = new Date();
  agentStatus.together.requestCount = 0;
  agentStatus.together.lastReset = new Date();
  agentStatus.cohere.requestCount = 0;
  agentStatus.cohere.lastReset = new Date();
  agentStatus.sambanova.requestCount = 0;
  agentStatus.sambanova.lastReset = new Date();
}, 60 * 60 * 1000);

function categorizeQuestion(question: string): QuestionCategory {
  const questionLower = question.toLowerCase();
  let bestMatch = questionCategories[0];
  let bestScore = 0;

  for (const category of questionCategories) {
    let score = 0;
    for (const keyword of category.keywords) {
      if (questionLower.includes(keyword)) {
        score += keyword.length; // Longer keywords get higher weight
      }
    }
    
    // Apply priority multiplier
    score *= category.priority;
    
    if (score > bestScore) {
      bestScore = score;
      bestMatch = category;
    }
  }

  return bestMatch;
}

function selectAgent(preferredAgent: 'openai' | 'perplexity' | 'together' | 'cohere' | 'sambanova'): 'openai' | 'perplexity' | 'together' | 'cohere' | 'sambanova' {
  // Check if preferred agent is available and under limits
  const hourlyLimit = 50; // Conservative limit per agent per hour (except SambaNova which is unlimited)
  
  // SambaNova has unlimited usage, so always prefer it if it's the selected agent
  if (preferredAgent === 'sambanova' && agentStatus.sambanova.available) {
    return 'sambanova';
  }
  
  if (preferredAgent === 'openai' && 
      agentStatus.openai.available && 
      agentStatus.openai.requestCount < hourlyLimit) {
    return 'openai';
  }
  
  if (preferredAgent === 'perplexity' && 
      agentStatus.perplexity.available && 
      agentStatus.perplexity.requestCount < hourlyLimit) {
    return 'perplexity';
  }
  
  if (preferredAgent === 'together' && 
      agentStatus.together.available && 
      agentStatus.together.requestCount < hourlyLimit) {
    return 'together';
  }
  
  if (preferredAgent === 'cohere' && 
      agentStatus.cohere.available && 
      agentStatus.cohere.requestCount < hourlyLimit) {
    return 'cohere';
  }
  
  // Prioritize SambaNova first due to unlimited usage, then load balance others
  if (agentStatus.sambanova.available) {
    return 'sambanova';
  }
  
  // Load balancing fallback: find agent with lowest usage
  const agents: ('openai' | 'perplexity' | 'together' | 'cohere')[] = 
    ['openai', 'perplexity', 'together', 'cohere'];
  let bestAgent = 'openai'; // Default fallback
  let lowestCount = Infinity;
  
  for (const agent of agents) {
    if (agentStatus[agent].available && 
        agentStatus[agent].requestCount < hourlyLimit && 
        agentStatus[agent].requestCount < lowestCount) {
      bestAgent = agent;
      lowestCount = agentStatus[agent].requestCount;
    }
  }
  
  return bestAgent;
}

async function askOpenAI(question: string, userContext: UserContext, category: string): Promise<string> {
  // Build personalized system prompt
  let systemPrompt = `You are HyperDAG's AI assistant, a helpful and knowledgeable guide for users exploring our Web3 reputation platform. HyperDAG offers three types of ZKP NFT identity credentials:

1. SBT (Soulbound Tokens) - For human identity verification with 4FA and granular data sovereignty controls
2. CBT (Charity Bound Tokens) - For nonprofit transparency ratings as a decentralized Charity Navigator  
3. DBT (Digital Bound Tokens) - For AI agents and digital entities

The platform is mobile-first, interoperable, provides 100% user data control with selective disclosure and anonymization capabilities, and includes external developer API access.

You should provide helpful, accurate responses about:
- Platform features and capabilities
- Web3 and blockchain concepts
- Career development and skill building
- Technical troubleshooting
- General guidance and support

Keep responses conversational, encouraging, and focused on helping users succeed.`;

  // Add user-specific context
  if (userContext.onboardingStage) {
    systemPrompt += `\n\nUser Profile:
- Onboarding stage: ${userContext.onboardingStage}/5`;
  }
  if (userContext.interests?.length) {
    systemPrompt += `\n- Interests: ${userContext.interests.join(', ')}`;
  }
  if (userContext.userGoals?.length) {
    systemPrompt += `\n- Goals: ${userContext.userGoals.join(', ')}`;
  }
  if (userContext.currentProject) {
    systemPrompt += `\n- Current project: ${userContext.currentProject}`;
  }
  
  systemPrompt += `\n\nCurrent context: ${userContext.currentPage || 'Unknown page'}
Question category: ${category}

Tailor your response to their profile and provide relevant HyperDAG feature suggestions when appropriate.`;

  // Build conversation messages with history
  const messages: any[] = [
    { role: 'system', content: systemPrompt }
  ];

  // Add recent conversation history for context
  if (userContext.conversationHistory?.length) {
    const recentHistory = userContext.conversationHistory.slice(-6); // Last 6 messages
    recentHistory.forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });
  }

  // Add current question
  messages.push({
    role: 'user',
    content: question
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: messages,
    max_tokens: 600,
    temperature: 0.7
  });

  return response.choices[0].message.content || 'I apologize, but I encountered an issue processing your question. Please try again.';
}

async function askPerplexity(question: string, userContext: UserContext, category: string): Promise<string> {
  const systemPrompt = `You are HyperDAG's AI assistant helping users with Web3, blockchain, and technical questions. HyperDAG is a Web3 reputation platform with ZKP NFT identity credentials. Provide accurate, up-to-date information and practical guidance.

Question category: ${category}
Current context: ${userContext.currentPage || 'Unknown page'}`;

  const response = await perplexity.chat.completions.create({
    model: 'llama-3.1-sonar-small-128k-online',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: question }
    ],
    max_tokens: 500,
    temperature: 0.7
  });

  return response.choices[0].message.content || 'I apologize, but I encountered an issue processing your question. Please try again.';
}

// Groq - Ultra-fast inference with Llama models
async function askGroq(question: string, userContext: UserContext, category: string): Promise<string> {
  const systemPrompt = `You are HyperDAG's AI assistant specializing in fast, accurate responses about Web3, blockchain, and our ZKP credential platform. Provide concise, helpful answers optimized for speed and clarity.`;
  
  const response = await groq.chat.completions.create({
    model: "llama-3.1-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: question }
    ],
    max_tokens: 500,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || "I'm having trouble processing your request right now.";
}

// Together AI - Open source models with generous free tier
async function askTogether(question: string, userContext: UserContext, category: string): Promise<string> {
  const systemPrompt = `You are HyperDAG's AI assistant using cutting-edge open-source models. Help users with Web3, blockchain concepts, and platform features with detailed, educational responses.`;
  
  const response = await together.chat.completions.create({
    model: "meta-llama/Llama-3-70b-chat-hf",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: question }
    ],
    max_tokens: 600,
    temperature: 0.8,
  });

  return response.choices[0]?.message?.content || "I'm having trouble processing your request right now.";
}

// Cohere - Excellent for text generation and analysis
async function askCohere(question: string, userContext: UserContext, category: string): Promise<string> {
  const systemPrompt = `You are HyperDAG's AI assistant powered by Cohere's advanced language models. Provide thoughtful, well-structured responses about our Web3 reputation platform and help users achieve their goals.`;
  
  const response = await cohere.chat.completions.create({
    model: "command-r-plus",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: question }
    ],
    max_tokens: 500,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content || "I'm having trouble processing your request right now.";
}

// SambaNova - High-performance models with unlimited free API access
async function askSambaNova(question: string, userContext: UserContext, category: string): Promise<string> {
  try {
    const systemPrompt = `You are HyperDAG's AI assistant powered by SambaNova's advanced Llama models. You excel at creative writing, code analysis, and general knowledge questions. Provide comprehensive, helpful responses about our Web3 reputation platform and assist users with their goals.`;
    
    const response = await sambanova.chat.completions.create({
      model: "Meta-Llama-3.1-8B-Instruct",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question }
      ],
      max_tokens: 800,
      temperature: 0.8,
      stream: false,
    });

    return response.choices[0]?.message?.content || "I'm having trouble processing your request right now.";
  } catch (error) {
    console.error('SambaNova API Error:', error);
    throw error;
  }
}

export async function getIntelligentAnswer(question: string, userContext: UserContext = {}) {
  try {
    // Categorize the question
    const category = categorizeQuestion(question);
    
    // Always prioritize SambaNova first due to unlimited usage
    let selectedAgent: 'openai' | 'perplexity' | 'together' | 'cohere' | 'sambanova' = 'sambanova';
    let answer: string;
    
    // Try SambaNova first
    try {
      agentStatus.sambanova.requestCount++;
      answer = await askSambaNova(question, userContext, category.name);
    } catch (error) {
      console.error(`Error with SambaNova:`, error);
      
      // Fallback to other agents
      const fallbackAgents = ['openai', 'perplexity'];
      let fallbackSuccess = false;
      
      for (const fallbackAgent of fallbackAgents) {
        try {
          const agent = fallbackAgent as keyof AgentStatus;
          if (!agentStatus[agent].available || agentStatus[agent].requestCount >= 50) {
            continue;
          }
          
          agentStatus[agent].requestCount++;
          
          if (fallbackAgent === 'openai') {
            answer = await askOpenAI(question, userContext, category.name);
          } else if (fallbackAgent === 'perplexity') {
            answer = await askPerplexity(question, userContext, category.name);
          }
          
          selectedAgent = fallbackAgent as any;
          fallbackSuccess = true;
          break;
        } catch (fallbackError) {
          console.error(`Fallback agent ${fallbackAgent} also failed:`, fallbackError);
          continue;
        }
      }
      
      if (!fallbackSuccess) {
        answer = "I'm experiencing some technical difficulties right now. Please try asking your question again in a moment, or feel free to explore HyperDAG's features while I get back online!";
        selectedAgent = 'sambanova'; // Keep original for consistency
      }
    }
    
    return {
      answer,
      agentUsed: selectedAgent,
      category: category.name,
      confidence: 0.8
    };
    
  } catch (error) {
    console.error('Error in intelligent QA router:', error);
    return {
      answer: "I'm experiencing some technical difficulties right now. Please try asking your question again in a moment!",
      agentUsed: 'fallback',
      category: 'error',
      confidence: 0.1
    };
  }
}

export function getAgentStatus() {
  const totalAgents = 5; // OpenAI, Perplexity, Together, Cohere, SambaNova
  const availableAgents = 
    (agentStatus.openai.available ? 1 : 0) + 
    (agentStatus.perplexity.available ? 1 : 0) + 
    (agentStatus.together.available ? 1 : 0) + 
    (agentStatus.cohere.available ? 1 : 0) + 
    (agentStatus.sambanova.available ? 1 : 0);
  
  return {
    totalAgents,
    availableAgents,
    openai: {
      available: agentStatus.openai.available,
      requestCount: agentStatus.openai.requestCount,
      lastReset: agentStatus.openai.lastReset
    },
    perplexity: {
      available: agentStatus.perplexity.available,
      requestCount: agentStatus.perplexity.requestCount,
      lastReset: agentStatus.perplexity.lastReset
    },
    together: {
      available: agentStatus.together.available,
      requestCount: agentStatus.together.requestCount,
      lastReset: agentStatus.together.lastReset
    },
    cohere: {
      available: agentStatus.cohere.available,
      requestCount: agentStatus.cohere.requestCount,
      lastReset: agentStatus.cohere.lastReset
    },
    sambanova: {
      available: agentStatus.sambanova.available,
      requestCount: agentStatus.sambanova.requestCount,
      lastReset: agentStatus.sambanova.lastReset,
      unlimited: true
    },
    systemStatus: availableAgents > 0 ? 'operational' : 'degraded'
  };
}