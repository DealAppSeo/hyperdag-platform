import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Cloud, 
  Cpu, 
  Database, 
  Brain, 
  Fuel, 
  Shield, 
  Globe, 
  TrendingUp,
  DollarSign,
  Users,
  Star,
  Search,
  Filter,
  Code,
  Code2,
  Zap,
  Bot,
  Video,
  Scissors,
  Blocks,
  Hammer,
  GitBranch,
  Workflow,
  Globe2,
  Server,
  Package,
  HardDrive,
  Link,
  FolderTree,
  Network,
  BarChart3,
  MessageSquare,
  MessageCircle,
  FileText,
  Layers,
  ArrowLeftRight,
  Atom,
  LineChart,
  Hexagon,
  Terminal,
  ArrowUpDown,
  Grid,
  List
} from 'lucide-react';

interface ApprovedService {
  id: string;
  name: string;
  category: 'compute' | 'storage' | 'ai' | 'gas' | 'security' | 'network' | 'development' | 'analytics';
  description: string;
  demandLevel: number; // 0-100
  avgEarningRate: number; // HDAG per hour
  referralCommission: number; // percentage
  popularity: number; // 1-5 stars
  minimumShare: string;
  estimatedUsers: number;
  icon: React.ComponentType<any>;
  website: string;
  features: string[];
}

const categoryIcons = {
  compute: Cloud,
  storage: Database,
  ai: Brain,
  gas: Fuel,
  security: Shield,
  network: Network,
  development: Code,
  analytics: BarChart3
};

const categoryColors = {
  compute: 'bg-blue-100 text-blue-800',
  storage: 'bg-green-100 text-green-800',
  ai: 'bg-purple-100 text-purple-800',
  gas: 'bg-orange-100 text-orange-800',
  security: 'bg-red-100 text-red-800',
  network: 'bg-indigo-100 text-indigo-800',
  development: 'bg-cyan-100 text-cyan-800',
  analytics: 'bg-pink-100 text-pink-800'
};

const getEarningPotential = (demandLevel: number, commission: number) => {
  // Green: Can arbitrage paid accounts (95%+ demand, 25%+ commission)
  if (demandLevel >= 95 && commission >= 25) return 'high';
  // Yellow: Can earn from free tier signups (85%+ demand, 20%+ commission)
  if (demandLevel >= 85 && commission >= 20) return 'medium';
  // Red: No significant arbitrage potential
  return 'low';
};

const getDemandColor = (potential: string) => {
  if (potential === 'high') return 'text-green-600';
  if (potential === 'medium') return 'text-yellow-600';
  return 'text-red-600';
};

const getDemandLabel = (potential: string) => {
  if (potential === 'high') return 'Arbitrage Ready';
  if (potential === 'medium') return 'Free Tier Earnings';
  return 'Low Potential';
};

const approvedServices: ApprovedService[] = [
  // AI Services
  {
    id: 'openai-api',
    name: 'OpenAI API',
    category: 'ai',
    description: 'Access to GPT-4, DALL-E, and Whisper APIs for advanced AI capabilities',
    demandLevel: 97,
    avgEarningRate: 24.5,
    referralCommission: 35,
    popularity: 5,
    minimumShare: '$20/month usage',
    estimatedUsers: 2400000,
    icon: Brain,
    website: 'https://openai.com/?ref=hyperdag',
    features: ['GPT-4 Access', 'DALL-E 3', 'Whisper STT', 'Function Calling']
  },
  {
    id: 'grok-ai',
    name: 'Grok AI',
    category: 'ai',
    description: 'xAI\'s conversational AI with real-time knowledge and wit',
    demandLevel: 91,
    avgEarningRate: 21.4,
    referralCommission: 30,
    popularity: 5,
    minimumShare: '$20/month',
    estimatedUsers: 450000,
    icon: MessageSquare,
    website: 'https://x.ai/?ref=hyperdag',
    features: ['Real-time Data', 'Twitter Integration', 'Conversational AI', 'Research Tools']
  },
  {
    id: 'anthropic-claude',
    name: 'Anthropic Claude',
    category: 'ai',
    description: 'Advanced AI assistant with strong reasoning and safety features',
    demandLevel: 88,
    avgEarningRate: 22.3,
    referralCommission: 28,
    popularity: 4,
    minimumShare: '$15/month',
    estimatedUsers: 420000,
    icon: Zap,
    website: 'https://anthropic.com/?ref=hyperdag',
    features: ['Constitutional AI', 'Long Context', 'Code Analysis', 'Research Assistant']
  },
  {
    id: 'runway-api',
    name: 'Runway API',
    category: 'ai',
    description: 'AI-powered video generation and editing tools API',
    demandLevel: 89,
    avgEarningRate: 26.8,
    referralCommission: 32,
    popularity: 4,
    minimumShare: '$15/month',
    estimatedUsers: 120000,
    icon: Video,
    website: 'https://runwayml.com/?ref=hyperdag',
    features: ['Video Generation', 'Image Editing', 'Motion Graphics', 'AI Models']
  },
  {
    id: 'huggingface',
    name: 'HuggingFace Pro',
    category: 'ai',
    description: 'Machine learning platform with model hosting and inference APIs',
    demandLevel: 87,
    avgEarningRate: 19.2,
    referralCommission: 27,
    popularity: 4,
    minimumShare: '$9/month',
    estimatedUsers: 280000,
    icon: Bot,
    website: 'https://huggingface.co/?ref=hyperdag',
    features: ['Model Hosting', 'Inference API', 'Dataset Access', 'Community Models']
  },
  {
    id: 'vizard-ai',
    name: 'Vizard.ai',
    category: 'ai',
    description: 'AI video editing and content creation platform',
    demandLevel: 84,
    avgEarningRate: 17.5,
    referralCommission: 24,
    popularity: 3,
    minimumShare: '$19/month',
    estimatedUsers: 65000,
    icon: Scissors,
    website: 'https://vizard.ai/?ref=hyperdag',
    features: ['Auto Editing', 'Subtitle Generation', 'Content Repurposing', 'Social Media Clips']
  },
  {
    id: 'exa-ai',
    name: 'Exa.ai',
    category: 'ai',
    description: 'Neural search engine API for semantic knowledge retrieval',
    demandLevel: 82,
    avgEarningRate: 18.7,
    referralCommission: 25,
    popularity: 4,
    minimumShare: '$25/month',
    estimatedUsers: 75000,
    icon: Search,
    website: 'https://exa.ai/?ref=hyperdag',
    features: ['Semantic Search', 'Knowledge Graphs', 'Content Discovery', 'Real-time Data']
  },
  {
    id: 'ollama',
    name: 'Ollama',
    category: 'ai',
    description: 'Local LLM deployment and management platform',
    demandLevel: 81,
    avgEarningRate: 16.2,
    referralCommission: 23,
    popularity: 4,
    minimumShare: 'Self-hosted',
    estimatedUsers: 120000,
    icon: Terminal,
    website: 'https://ollama.ai/?ref=hyperdag',
    features: ['Local LLMs', 'Model Management', 'API Access', 'Custom Fine-tuning']
  },

  // Development & Infrastructure
  {
    id: 'github-copilot',
    name: 'GitHub Copilot',
    category: 'development',
    description: 'AI pair programmer that helps write code faster with intelligent suggestions',
    demandLevel: 92,
    avgEarningRate: 15.8,
    referralCommission: 30,
    popularity: 5,
    minimumShare: '$10/month',
    estimatedUsers: 1800000,
    icon: Code,
    website: 'https://github.com/copilot?ref=hyperdag',
    features: ['Code Completion', 'Documentation', 'Test Generation', 'Multi-language Support']
  },
  {
    id: 'vercel-pro',
    name: 'Vercel Pro',
    category: 'development',
    description: 'Professional deployment platform with advanced analytics and team features',
    demandLevel: 89,
    avgEarningRate: 18.2,
    referralCommission: 25,
    popularity: 4,
    minimumShare: '$20/month',
    estimatedUsers: 850000,
    icon: Globe,
    website: 'https://vercel.com/?ref=hyperdag',
    features: ['Analytics', 'Team Collaboration', 'Priority Support', 'Advanced Build Options']
  },
  {
    id: 'bolt-new',
    name: 'Bolt.new',
    category: 'development',
    description: 'AI-powered full-stack development environment in the browser',
    demandLevel: 86,
    avgEarningRate: 22.1,
    referralCommission: 28,
    popularity: 4,
    minimumShare: '$20/month',
    estimatedUsers: 95000,
    icon: Code2,
    website: 'https://bolt.new/?ref=hyperdag',
    features: ['AI Code Generation', 'Full-stack Development', 'Instant Deployment', 'Browser IDE']
  },
  {
    id: 'thirdweb',
    name: 'Thirdweb',
    category: 'development',
    description: 'Web3 development platform with smart contract tools and SDKs',
    demandLevel: 83,
    avgEarningRate: 19.7,
    referralCommission: 26,
    popularity: 4,
    minimumShare: '$49/month',
    estimatedUsers: 180000,
    icon: Blocks,
    website: 'https://thirdweb.com/?ref=hyperdag',
    features: ['Smart Contracts', 'Web3 SDKs', 'NFT Tools', 'Gasless Transactions']
  },
  {
    id: 'n8n-cloud',
    name: 'n8n Cloud',
    category: 'development',
    description: 'Workflow automation platform with 400+ integrations',
    demandLevel: 81,
    avgEarningRate: 14.3,
    referralCommission: 23,
    popularity: 3,
    minimumShare: '$20/month',
    estimatedUsers: 110000,
    icon: GitBranch,
    website: 'https://n8n.io/?ref=hyperdag',
    features: ['Workflow Automation', '400+ Integrations', 'Custom Nodes', 'Self-hosted Option']
  },
  {
    id: 'latenode',
    name: 'Latenode',
    category: 'development',
    description: 'Low-code automation platform with visual workflow builder',
    demandLevel: 79,
    avgEarningRate: 13.8,
    referralCommission: 21,
    popularity: 3,
    minimumShare: '$15/month',
    estimatedUsers: 45000,
    icon: Workflow,
    website: 'https://latenode.com/?ref=hyperdag',
    features: ['Visual Builder', 'API Integrations', 'Data Processing', 'Custom Logic']
  },
  {
    id: 'docker-pro',
    name: 'Docker Pro',
    category: 'development',
    description: 'Containerization platform with professional development tools',
    demandLevel: 87,
    avgEarningRate: 14.6,
    referralCommission: 22,
    popularity: 5,
    minimumShare: '$5/month',
    estimatedUsers: 750000,
    icon: Package,
    website: 'https://docker.com/?ref=hyperdag',
    features: ['Container Registry', 'Image Scanning', 'Team Management', 'Build Automation']
  },
  {
    id: 'hardhat',
    name: 'Hardhat Pro',
    category: 'development',
    description: 'Ethereum development environment with advanced debugging and testing',
    demandLevel: 78,
    avgEarningRate: 16.4,
    referralCommission: 22,
    popularity: 4,
    minimumShare: '$25/month',
    estimatedUsers: 160000,
    icon: Hammer,
    website: 'https://hardhat.org/?ref=hyperdag',
    features: ['Smart Contract Testing', 'Debugging Tools', 'Local Network', 'Plugin Ecosystem']
  },
  {
    id: 'netlify-pro',
    name: 'Netlify Pro',
    category: 'development',
    description: 'Modern web development platform with JAMstack deployment',
    demandLevel: 85,
    avgEarningRate: 17.2,
    referralCommission: 25,
    popularity: 4,
    minimumShare: '$19/month',
    estimatedUsers: 420000,
    icon: Globe2,
    website: 'https://netlify.com/?ref=hyperdag',
    features: ['Continuous Deployment', 'Serverless Functions', 'Forms', 'Analytics']
  },

  // Cloud & Compute
  {
    id: 'aws-credits',
    name: 'AWS Credits',
    category: 'compute',
    description: 'Amazon Web Services compute credits for scalable cloud infrastructure',
    demandLevel: 95,
    avgEarningRate: 32.1,
    referralCommission: 45,
    popularity: 5,
    minimumShare: '$50/month',
    estimatedUsers: 1200000,
    icon: Cloud,
    website: 'https://aws.amazon.com/?ref=hyperdag',
    features: ['EC2 Instances', 'S3 Storage', 'Lambda Functions', 'RDS Databases']
  },
  {
    id: 'cloudflare-pro',
    name: 'Cloudflare Pro',
    category: 'network',
    description: 'CDN and security services with advanced performance optimization',
    demandLevel: 93,
    avgEarningRate: 16.7,
    referralCommission: 24,
    popularity: 5,
    minimumShare: '$20/month',
    estimatedUsers: 980000,
    icon: Shield,
    website: 'https://cloudflare.com/?ref=hyperdag',
    features: ['CDN', 'DDoS Protection', 'SSL Certificates', 'Analytics']
  },
  {
    id: 'runpod',
    name: 'RunPod',
    category: 'compute',
    description: 'GPU cloud computing platform for AI/ML workloads',
    demandLevel: 88,
    avgEarningRate: 28.4,
    referralCommission: 35,
    popularity: 4,
    minimumShare: '$50/month',
    estimatedUsers: 85000,
    icon: Cpu,
    website: 'https://runpod.io/?ref=hyperdag',
    features: ['GPU Instances', 'ML Containers', 'Serverless GPUs', 'Model Deployment']
  },
  {
    id: 'render-cloud',
    name: 'Render',
    category: 'compute',
    description: 'Cloud platform for deploying and scaling applications',
    demandLevel: 82,
    avgEarningRate: 15.9,
    referralCommission: 23,
    popularity: 4,
    minimumShare: '$25/month',
    estimatedUsers: 150000,
    icon: Server,
    website: 'https://render.com/?ref=hyperdag',
    features: ['Auto Deploy', 'Managed Databases', 'Static Sites', 'Background Jobs']
  },

  // Blockchain & Web3
  {
    id: 'uniswap-v4',
    name: 'Uniswap v4',
    category: 'gas',
    description: 'Advanced AMM protocol with hooks and concentrated liquidity',
    demandLevel: 92,
    avgEarningRate: 25.7,
    referralCommission: 33,
    popularity: 5,
    minimumShare: '1 ETH liquidity',
    estimatedUsers: 580000,
    icon: ArrowUpDown,
    website: 'https://uniswap.org/?ref=hyperdag',
    features: ['AMM Protocol', 'Liquidity Provision', 'Hooks System', 'Concentrated Liquidity']
  },
  {
    id: 'infura',
    name: 'Infura',
    category: 'network',
    description: 'Ethereum and IPFS infrastructure API with global network',
    demandLevel: 91,
    avgEarningRate: 21.7,
    referralCommission: 28,
    popularity: 5,
    minimumShare: '$50/month',
    estimatedUsers: 450000,
    icon: Network,
    website: 'https://infura.io/?ref=hyperdag',
    features: ['Ethereum API', 'IPFS Gateway', 'Layer 2 Support', 'Analytics Dashboard']
  },
  {
    id: 'layerzero',
    name: 'LayerZero',
    category: 'network',
    description: 'Omnichain interoperability protocol for cross-chain applications',
    demandLevel: 88,
    avgEarningRate: 24.1,
    referralCommission: 31,
    popularity: 4,
    minimumShare: 'Integration fee',
    estimatedUsers: 95000,
    icon: Layers,
    website: 'https://layerzero.network/?ref=hyperdag',
    features: ['Omnichain Apps', 'Message Passing', 'Cross-chain Tokens', 'Unified Liquidity']
  },
  {
    id: 'moralis',
    name: 'Moralis',
    category: 'development',
    description: 'Web3 development platform with APIs and infrastructure',
    demandLevel: 85,
    avgEarningRate: 18.9,
    referralCommission: 26,
    popularity: 4,
    minimumShare: '$49/month',
    estimatedUsers: 280000,
    icon: Blocks,
    website: 'https://moralis.io/?ref=hyperdag',
    features: ['Web3 APIs', 'NFT API', 'DeFi Protocols', 'Cross-chain Support']
  },
  {
    id: 'wormhole',
    name: 'Wormhole',
    category: 'network',
    description: 'Cross-chain bridge connecting multiple blockchain ecosystems',
    demandLevel: 85,
    avgEarningRate: 20.6,
    referralCommission: 27,
    popularity: 4,
    minimumShare: 'Bridge usage',
    estimatedUsers: 180000,
    icon: ArrowLeftRight,
    website: 'https://wormhole.com/?ref=hyperdag',
    features: ['Cross-chain Bridge', 'Token Transfers', 'Message Passing', 'Multi-chain Apps']
  },
  {
    id: 'chainlink-vrf',
    name: 'Chainlink VRF',
    category: 'security',
    description: 'Verifiable random functions for secure on-chain randomness',
    demandLevel: 84,
    avgEarningRate: 19.6,
    referralCommission: 25,
    popularity: 4,
    minimumShare: '10 LINK',
    estimatedUsers: 95000,
    icon: Shield,
    website: 'https://chain.link/?ref=hyperdag',
    features: ['Verifiable Randomness', 'On-chain Proofs', 'Gaming Integration', 'NFT Generation']
  },
  {
    id: 'the-graph',
    name: 'The Graph',
    category: 'analytics',
    description: 'Decentralized protocol for indexing and querying blockchain data',
    demandLevel: 83,
    avgEarningRate: 17.8,
    referralCommission: 25,
    popularity: 4,
    minimumShare: '1000 GRT',
    estimatedUsers: 120000,
    icon: BarChart3,
    website: 'https://thegraph.com/?ref=hyperdag',
    features: ['Data Indexing', 'GraphQL APIs', 'Subgraph Development', 'Decentralized Queries']
  },
  {
    id: 'axelar',
    name: 'Axelar Network',
    category: 'network',
    description: 'Universal interoperability network connecting all blockchains',
    demandLevel: 82,
    avgEarningRate: 18.8,
    referralCommission: 26,
    popularity: 4,
    minimumShare: '100 AXL',
    estimatedUsers: 65000,
    icon: Globe,
    website: 'https://axelar.network/?ref=hyperdag',
    features: ['Cross-chain Communication', 'General Message Passing', 'Satellite', 'Microservice APIs']
  },

  // Storage & Data
  {
    id: 'web3-storage',
    name: 'Web3.Storage',
    category: 'storage',
    description: 'Decentralized storage powered by Filecoin with simple API access',
    demandLevel: 82,
    avgEarningRate: 12.7,
    referralCommission: 20,
    popularity: 3,
    minimumShare: '100GB/month',
    estimatedUsers: 180000,
    icon: Database,
    website: 'https://web3.storage/?ref=hyperdag',
    features: ['IPFS Gateway', 'Filecoin Storage', 'Content Addressing', 'Simple API']
  },
  {
    id: 'filecoin',
    name: 'Filecoin Storage',
    category: 'storage',
    description: 'Decentralized storage network with cryptographic proofs',
    demandLevel: 80,
    avgEarningRate: 14.2,
    referralCommission: 21,
    popularity: 4,
    minimumShare: '1TB storage',
    estimatedUsers: 140000,
    icon: HardDrive,
    website: 'https://filecoin.io/?ref=hyperdag',
    features: ['Decentralized Storage', 'Proof of Storage', 'Content Addressing', 'Data Retrieval']
  },
  {
    id: 'ipfs-pinning',
    name: 'IPFS Pinning',
    category: 'storage',
    description: 'Pinning services for InterPlanetary File System content',
    demandLevel: 76,
    avgEarningRate: 11.8,
    referralCommission: 19,
    popularity: 3,
    minimumShare: '50GB pinning',
    estimatedUsers: 95000,
    icon: Link,
    website: 'https://ipfs.io/?ref=hyperdag',
    features: ['Content Pinning', 'Gateway Access', 'Distributed Storage', 'Content Addressing']
  },

  // Analytics & Data
  {
    id: 'coingecko-api',
    name: 'CoinGecko API',
    category: 'analytics',
    description: 'Comprehensive cryptocurrency data and market analytics API',
    demandLevel: 89,
    avgEarningRate: 15.7,
    referralCommission: 24,
    popularity: 5,
    minimumShare: '$79/month',
    estimatedUsers: 320000,
    icon: TrendingUp,
    website: 'https://coingecko.com/?ref=hyperdag',
    features: ['Price Data', 'Market Analytics', 'Historical Data', 'DeFi Metrics']
  },
  {
    id: 'defillama-pro',
    name: 'DefiLlama Pro',
    category: 'analytics',
    description: 'DeFi analytics and data platform with advanced metrics',
    demandLevel: 86,
    avgEarningRate: 17.3,
    referralCommission: 25,
    popularity: 4,
    minimumShare: '$50/month',
    estimatedUsers: 180000,
    icon: LineChart,
    website: 'https://defillama.com/?ref=hyperdag',
    features: ['TVL Analytics', 'Yield Tracking', 'Protocol Data', 'Chain Analytics']
  },
  {
    id: 'dune-analytics',
    name: 'Dune Analytics',
    category: 'analytics',
    description: 'Blockchain analytics platform with SQL-based queries',
    demandLevel: 84,
    avgEarningRate: 19.4,
    referralCommission: 27,
    popularity: 4,
    minimumShare: '$390/month',
    estimatedUsers: 95000,
    icon: Database,
    website: 'https://dune.com/?ref=hyperdag',
    features: ['SQL Queries', 'Dashboard Creation', 'Data Visualization', 'API Access']
  },

  // Social & Publishing
  {
    id: 'farcaster',
    name: 'Farcaster',
    category: 'network',
    description: 'Decentralized social network built on Ethereum',
    demandLevel: 81,
    avgEarningRate: 14.7,
    referralCommission: 22,
    popularity: 4,
    minimumShare: 'Profile creation',
    estimatedUsers: 85000,
    icon: MessageCircle,
    website: 'https://farcaster.xyz/?ref=hyperdag',
    features: ['Decentralized Social', 'Content Ownership', 'Cross-app Identity', 'Crypto Integration']
  },
  {
    id: 'lens-protocol',
    name: 'Lens Protocol',
    category: 'network',
    description: 'Decentralized social graph protocol for Web3 applications',
    demandLevel: 79,
    avgEarningRate: 15.2,
    referralCommission: 23,
    popularity: 3,
    minimumShare: 'Profile NFT',
    estimatedUsers: 75000,
    icon: Globe,
    website: 'https://lens.xyz/?ref=hyperdag',
    features: ['Social Graph', 'Profile NFTs', 'Content Monetization', 'Decentralized Identity']
  },
  {
    id: 'cosmos-ibc',
    name: 'Cosmos IBC',
    category: 'network',
    description: 'Inter-Blockchain Communication protocol for the Cosmos ecosystem',
    demandLevel: 79,
    avgEarningRate: 16.9,
    referralCommission: 24,
    popularity: 4,
    minimumShare: 'Validator stake',
    estimatedUsers: 85000,
    icon: Atom,
    website: 'https://cosmos.network/?ref=hyperdag',
    features: ['IBC Protocol', 'Inter-chain Security', 'Cosmos SDK', 'Tendermint Consensus']
  },
  {
    id: 'mirror-xyz',
    name: 'Mirror.xyz',
    category: 'network',
    description: 'Decentralized publishing platform with NFT integration',
    demandLevel: 77,
    avgEarningRate: 13.4,
    referralCommission: 21,
    popularity: 3,
    minimumShare: 'Publication setup',
    estimatedUsers: 55000,
    icon: FileText,
    website: 'https://mirror.xyz/?ref=hyperdag',
    features: ['Decentralized Publishing', 'NFT Integration', 'Crowdfunding', 'Token Gating']
  },

  // Specialized Services
  {
    id: 'iota-shimmer',
    name: 'IOTA Shimmer',
    category: 'network',
    description: 'Feeless distributed ledger for IoT and machine-to-machine payments',
    demandLevel: 75,
    avgEarningRate: 12.8,
    referralCommission: 20,
    popularity: 3,
    minimumShare: '1Mi IOTA',
    estimatedUsers: 65000,
    icon: Hexagon,
    website: 'https://iota.org/?ref=hyperdag',
    features: ['Feeless Transactions', 'IoT Integration', 'Tangle Technology', 'Smart Contracts']
  }
];

export function ExpandedServicesList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState('earning');
  const [viewMode, setViewMode] = useState<'category' | 'list'>('category');

  const filteredServices = approvedServices
    .filter(service => {
      const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           service.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'demand':
          return b.demandLevel - a.demandLevel;
        case 'earning':
          return b.avgEarningRate - a.avgEarningRate;
        case 'commission':
          return b.referralCommission - a.referralCommission;
        case 'popularity':
          return b.popularity - a.popularity;
        default:
          return 0;
      }
    });

  // Group services by category for organized display
  const servicesByCategory = filteredServices.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, ApprovedService[]>);

  const ServiceCard = ({ service }: { service: ApprovedService }) => {
    const IconComponent = service.icon;
    const CategoryIcon = categoryIcons[service.category];
    const earningPotential = getEarningPotential(service.demandLevel, service.referralCommission);
    
    return (
      <Card className="h-full hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <IconComponent className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">{service.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={categoryColors[service.category]}>
                    <CategoryIcon className="h-3 w-3 mr-1" />
                    {service.category}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-sm font-medium ${getDemandColor(earningPotential)}`}>
                {getDemandLabel(earningPotential)}
              </div>
              <div className="text-xs text-muted-foreground">
                {service.estimatedUsers.toLocaleString()} users
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <CardDescription>{service.description}</CardDescription>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Demand:</span>
              <div className="flex items-center gap-2 mt-1">
                <Progress value={service.demandLevel} className="h-2 flex-1" />
                <span className={`font-medium ${getDemandColor(earningPotential)}`}>
                  {service.demandLevel}%
                </span>
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Earning Rate:</span>
              <div className="font-medium text-green-600 mt-1">
                {service.avgEarningRate} HDAG/hr
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Commission:</span>
              <div className="font-medium text-blue-600 mt-1">
                {service.referralCommission}%
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Min. Share:</span>
              <div className="font-medium mt-1">
                {service.minimumShare}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-1">
            {service.features.slice(0, 3).map((feature, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {feature}
              </Badge>
            ))}
            {service.features.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{service.features.length - 3} more
              </Badge>
            )}
          </div>

          <Button 
            className="w-full" 
            onClick={() => window.open(service.website, '_blank')}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Join & Earn
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search approved services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="compute">Compute</SelectItem>
              <SelectItem value="storage">Storage</SelectItem>
              <SelectItem value="ai">AI Processing</SelectItem>
              <SelectItem value="gas">Gas Optimization</SelectItem>
              <SelectItem value="security">Security</SelectItem>
              <SelectItem value="network">Network</SelectItem>
              <SelectItem value="development">Development</SelectItem>
              <SelectItem value="analytics">Analytics</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="earning">Highest Earning</SelectItem>
              <SelectItem value="demand">Highest Demand</SelectItem>
              <SelectItem value="commission">Best Commission</SelectItem>
              <SelectItem value="popularity">Most Popular</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'category' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('category')}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {viewMode === 'category' ? (
        <div className="space-y-8">
          {Object.entries(servicesByCategory).map(([category, services]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  {React.createElement(categoryIcons[category as keyof typeof categoryIcons], { 
                    className: "h-4 w-4 text-primary" 
                  })}
                </div>
                <h3 className="text-lg font-semibold capitalize">{category} Services</h3>
                <Badge variant="secondary">{services.length}</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
}