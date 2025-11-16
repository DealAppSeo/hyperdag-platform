import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Layout } from "@/components/layout/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Search, 
  Filter, 
  Zap, 
  Network, 
  Shield, 
  Coins, 
  Users, 
  Cpu,
  Database,
  Globe,
  Lock,
  TrendingUp,
  Blocks,
  GitBranch,
  Bot,
  Building2,
  Vote,
  Gem,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Target
} from "lucide-react";

interface Definition {
  id: string;
  term: string;
  category: string;
  subcategory?: string;
  definition: string;
  keyPoints: string[];
  pros: string[];
  cons: string[];
  opportunities: string[];
  threats: string[];
  examples: string[];
  relatedTerms: string[];
  icon: React.ReactNode;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

const definitions: Definition[] = [
  {
    id: "dag",
    term: "Directed Acyclic Graph (DAG)",
    category: "DLT",
    subcategory: "Alternative Architecture",
    definition: "A mathematical structure consisting of vertices and edges with no cycles, used as an alternative to traditional blockchain architecture for distributed ledgers.",
    keyPoints: [
      "Allows parallel processing of transactions",
      "No mining required - consensus through validation",
      "Scalability increases with network activity",
      "Each transaction validates previous transactions"
    ],
    pros: [
      "Higher throughput than traditional blockchains",
      "Lower energy consumption",
      "Faster confirmation times",
      "Fees decrease as network grows"
    ],
    cons: [
      "Less battle-tested than blockchain",
      "Complexity in implementation",
      "Potential security vulnerabilities",
      "Limited smart contract capabilities"
    ],
    opportunities: [
      "IoT device networks",
      "Micro-transaction systems",
      "Real-time data verification",
      "Green blockchain alternatives"
    ],
    threats: [
      "Quantum computing attacks",
      "Centralization risks",
      "Regulatory uncertainty",
      "Competition from improved blockchains"
    ],
    examples: ["IOTA", "Hedera Hashgraph", "Fantom", "HyperDAG"],
    relatedTerms: ["blockchain", "consensus", "distributed-ledger", "scalability"],
    icon: <GitBranch className="h-5 w-5" />,
    difficulty: 'Intermediate'
  },
  {
    id: "blockchain",
    term: "Blockchain",
    category: "DLT",
    subcategory: "Core Technology",
    definition: "A distributed ledger technology that maintains a continuously growing list of records (blocks) linked and secured using cryptography.",
    keyPoints: [
      "Immutable record keeping",
      "Decentralized consensus mechanism",
      "Cryptographic security",
      "Transparent and verifiable transactions"
    ],
    pros: [
      "High security and immutability",
      "Decentralized control",
      "Transparency and auditability",
      "Established ecosystem"
    ],
    cons: [
      "Energy consumption (PoW)",
      "Scalability limitations",
      "Transaction speed constraints",
      "Storage requirements grow continuously"
    ],
    opportunities: [
      "Financial services transformation",
      "Supply chain transparency",
      "Digital identity management",
      "Decentralized governance"
    ],
    threats: [
      "Quantum computing threats",
      "Regulatory restrictions",
      "Environmental concerns",
      "Centralization of mining"
    ],
    examples: ["Bitcoin", "Ethereum", "Polygon", "Solana"],
    relatedTerms: ["cryptocurrency", "mining", "consensus", "smart-contracts"],
    icon: <Blocks className="h-5 w-5" />,
    difficulty: 'Beginner'
  },
  {
    id: "zkp",
    term: "Zero-Knowledge Proofs (ZKP)",
    category: "Privacy",
    subcategory: "Cryptographic Protocol",
    definition: "A cryptographic method allowing one party to prove to another that they know a value without revealing the value itself.",
    keyPoints: [
      "Proves knowledge without revealing information",
      "Enables privacy-preserving verification",
      "Mathematically sound and secure",
      "Enables scalable blockchain solutions"
    ],
    pros: [
      "Complete privacy preservation",
      "Scalability improvements",
      "Reduced data exposure",
      "Enhanced security"
    ],
    cons: [
      "Computational complexity",
      "Setup ceremony requirements",
      "Limited developer knowledge",
      "Proof generation time"
    ],
    opportunities: [
      "Private financial transactions",
      "Identity verification systems",
      "Scalable blockchain solutions",
      "Compliance with privacy regulations"
    ],
    threats: [
      "Quantum computing advances",
      "Implementation vulnerabilities",
      "Regulatory misunderstanding",
      "Adoption barriers"
    ],
    examples: ["zk-SNARKs", "zk-STARKs", "Bulletproofs", "Polygon zkEVM"],
    relatedTerms: ["privacy", "cryptography", "scaling", "verification"],
    icon: <Shield className="h-5 w-5" />,
    difficulty: 'Advanced'
  },
  {
    id: "dao",
    term: "Decentralized Autonomous Organization (DAO)",
    category: "Governance",
    subcategory: "Organizational Structure",
    definition: "An organization represented by rules encoded as smart contracts, controlled by token holders rather than central authority.",
    keyPoints: [
      "Decentralized decision making",
      "Smart contract automation",
      "Token-based voting rights",
      "Transparent governance processes"
    ],
    pros: [
      "Democratic governance",
      "Transparency in operations",
      "Global participation",
      "Reduced bureaucracy"
    ],
    cons: [
      "Governance token concentration",
      "Decision-making complexity",
      "Smart contract vulnerabilities",
      "Legal uncertainty"
    ],
    opportunities: [
      "Decentralized project funding",
      "Community-driven development",
      "Global collaboration",
      "New governance models"
    ],
    threats: [
      "Regulatory crackdowns",
      "Governance attacks",
      "Token manipulation",
      "Coordination failures"
    ],
    examples: ["MakerDAO", "Compound", "Uniswap", "HyperDAG DAO"],
    relatedTerms: ["governance", "smart-contracts", "tokens", "voting"],
    icon: <Users className="h-5 w-5" />,
    difficulty: 'Intermediate'
  },
  {
    id: "quadratic-voting",
    term: "Quadratic Voting",
    category: "Governance",
    subcategory: "Voting Mechanism",
    definition: "A collective decision-making procedure where individuals allocate votes to express preferences, with the cost of votes increasing quadratically.",
    keyPoints: [
      "Cost increases quadratically with vote quantity",
      "Prevents wealthy domination",
      "Reveals preference intensity",
      "Encourages broader participation"
    ],
    pros: [
      "Fairer representation of preferences",
      "Reduces influence of extreme wealth",
      "Encourages thoughtful participation",
      "Better reflects community will"
    ],
    cons: [
      "Complexity for users",
      "Potential for strategic voting",
      "Requires careful implementation",
      "Limited real-world testing"
    ],
    opportunities: [
      "DAO governance improvement",
      "Public goods funding",
      "Community decision making",
      "Resource allocation"
    ],
    threats: [
      "Sybil attacks",
      "Collusion among voters",
      "Implementation bugs",
      "User confusion"
    ],
    examples: ["Gitcoin Grants", "Colony", "RadicalxChange", "HyperDAG Governance"],
    relatedTerms: ["dao", "governance", "voting", "democracy"],
    icon: <Vote className="h-5 w-5" />,
    difficulty: 'Intermediate'
  },
  {
    id: "star-voting",
    term: "Star Voting",
    category: "Governance",
    subcategory: "Voting Mechanism",
    definition: "A voting system where voters score candidates on a scale (0-5 stars), combining the best aspects of approval and ranked choice voting.",
    keyPoints: [
      "Rate candidates on scale of 0-5",
      "Combines approval and preference ranking",
      "Encourages honest preference expression",
      "Reduces strategic voting incentives"
    ],
    pros: [
      "Honest preference expression",
      "Consensus-building focus",
      "Reduces negative campaigning",
      "Easy to understand and use"
    ],
    cons: [
      "Requires voter education",
      "Potential for bullet voting",
      "Limited adoption examples",
      "Score interpretation challenges"
    ],
    opportunities: [
      "DAO proposal evaluation",
      "Multi-option decisions",
      "Candidate selection",
      "Resource prioritization"
    ],
    threats: [
      "Gaming through coordination",
      "Voter apathy",
      "Implementation complexity",
      "Cultural resistance"
    ],
    examples: ["Equal Vote Coalition", "Approval Voting", "HyperDAG Governance"],
    relatedTerms: ["quadratic-voting", "governance", "democracy", "consensus"],
    icon: <Gem className="h-5 w-5" />,
    difficulty: 'Beginner'
  },
  {
    id: "human-in-the-loop",
    term: "Human-in-the-Loop (HITL)",
    category: "AI Governance",
    subcategory: "Decision Making",
    definition: "A framework ensuring human oversight and control in AI-driven systems, maintaining human authority over critical decisions.",
    keyPoints: [
      "AI provides optimization and analysis",
      "Humans retain final decision authority",
      "Continuous validation through voting",
      "Balances automation with human judgment"
    ],
    pros: [
      "Maintains human accountability",
      "Prevents AI bias propagation",
      "Ensures democratic participation",
      "Combines AI efficiency with human wisdom"
    ],
    cons: [
      "Slower decision making",
      "Requires active participation",
      "Potential for human error",
      "Complexity in implementation"
    ],
    opportunities: [
      "AI-enhanced governance",
      "Automated proposal optimization",
      "Intelligent risk assessment",
      "Scalable decision making"
    ],
    threats: [
      "Human disengagement",
      "AI manipulation",
      "Coordination failures",
      "Technical complexity"
    ],
    examples: ["HyperDAG HITL Governance", "Augur", "AI Safety Protocols"],
    relatedTerms: ["ai", "governance", "automation", "democracy"],
    icon: <Bot className="h-5 w-5" />,
    difficulty: 'Intermediate'
  },
  {
    id: "proof-of-work",
    term: "Proof of Work (PoW)",
    category: "Consensus",
    subcategory: "Consensus Mechanism",
    definition: "A consensus mechanism requiring computational work to validate transactions and secure the network through energy expenditure.",
    keyPoints: [
      "Miners compete to solve cryptographic puzzles",
      "Energy expenditure provides security",
      "Longest chain rule determines validity",
      "Incentivizes honest behavior through rewards"
    ],
    pros: [
      "Proven security model",
      "Truly decentralized",
      "Battle-tested over time",
      "Resistant to certain attacks"
    ],
    cons: [
      "High energy consumption",
      "Centralization of mining pools",
      "Scalability limitations",
      "Environmental impact"
    ],
    opportunities: [
      "Renewable energy integration",
      "Heat utilization projects",
      "Decentralized mining",
      "Layer 2 scaling solutions"
    ],
    threats: [
      "Environmental regulations",
      "Quantum computing",
      "Mining centralization",
      "Energy cost increases"
    ],
    examples: ["Bitcoin", "Ethereum Classic", "Litecoin", "Dogecoin"],
    relatedTerms: ["mining", "consensus", "security", "energy"],
    icon: <Cpu className="h-5 w-5" />,
    difficulty: 'Intermediate'
  },
  {
    id: "proof-of-stake",
    term: "Proof of Stake (PoS)",
    category: "Consensus",
    subcategory: "Consensus Mechanism",
    definition: "A consensus mechanism where validators are chosen to create blocks based on their stake in the network rather than computational power.",
    keyPoints: [
      "Validators stake tokens to participate",
      "Energy efficient compared to PoW",
      "Penalties for malicious behavior",
      "Rewards proportional to stake"
    ],
    pros: [
      "Energy efficient",
      "Lower barrier to entry",
      "Faster transaction finality",
      "Scalable architecture"
    ],
    cons: [
      "Wealth concentration risks",
      "Nothing at stake problem",
      "Complexity in implementation",
      "Newer and less tested"
    ],
    opportunities: [
      "Green blockchain solutions",
      "Staking services",
      "Delegated staking",
      "Governance participation"
    ],
    threats: [
      "Validator centralization",
      "Long-range attacks",
      "Regulatory uncertainty",
      "Technical vulnerabilities"
    ],
    examples: ["Ethereum 2.0", "Cardano", "Solana", "Polkadot"],
    relatedTerms: ["staking", "validators", "consensus", "energy"],
    icon: <Database className="h-5 w-5" />,
    difficulty: 'Intermediate'
  },
  {
    id: "proof-of-life",
    term: "Proof of Life (PoL)",
    category: "Identity",
    subcategory: "Verification Mechanism",
    definition: "A verification system ensuring that a participant is a living human being, preventing bot networks and ensuring authentic participation.",
    keyPoints: [
      "Biometric verification methods",
      "Prevents Sybil attacks",
      "Ensures human participation",
      "Privacy-preserving verification"
    ],
    pros: [
      "Prevents bot manipulation",
      "Ensures authentic participation",
      "Enables fair governance",
      "Protects against fraud"
    ],
    cons: [
      "Privacy concerns",
      "Technical complexity",
      "Accessibility challenges",
      "False positive risks"
    ],
    opportunities: [
      "Democratic governance",
      "Fair resource distribution",
      "Anti-fraud systems",
      "Human-verified networks"
    ],
    threats: [
      "Privacy violations",
      "Exclusion of disabled users",
      "Technical failures",
      "Regulatory issues"
    ],
    examples: ["Worldcoin", "BrightID", "Civic", "HyperDAG PoL"],
    relatedTerms: ["identity", "verification", "sybil-resistance", "biometrics"],
    icon: <Target className="h-5 w-5" />,
    difficulty: 'Advanced'
  },
  {
    id: "smart-contracts",
    term: "Smart Contracts",
    category: "Programming",
    subcategory: "Automated Execution",
    definition: "Self-executing contracts with terms directly written into code, automatically enforcing agreements without intermediaries.",
    keyPoints: [
      "Code-based contract execution",
      "Automatic enforcement",
      "Immutable once deployed",
      "Eliminates need for intermediaries"
    ],
    pros: [
      "Eliminates intermediaries",
      "Automatic execution",
      "Transparent and verifiable",
      "Reduced costs"
    ],
    cons: [
      "Code vulnerabilities",
      "Immutability challenges",
      "Gas costs",
      "Limited complexity"
    ],
    opportunities: [
      "DeFi applications",
      "Supply chain automation",
      "Insurance automation",
      "Governance systems"
    ],
    threats: [
      "Smart contract bugs",
      "Regulatory challenges",
      "Scalability issues",
      "Security vulnerabilities"
    ],
    examples: ["Ethereum", "Solana", "Cardano", "Polygon"],
    relatedTerms: ["ethereum", "defi", "automation", "programming"],
    icon: <Zap className="h-5 w-5" />,
    difficulty: 'Intermediate'
  },
  {
    id: "defi",
    term: "Decentralized Finance (DeFi)",
    category: "Finance",
    subcategory: "Financial Services",
    definition: "Financial services built on blockchain technology, operating without traditional intermediaries like banks or brokers.",
    keyPoints: [
      "Peer-to-peer financial services",
      "Smart contract automation",
      "Global accessibility",
      "Permissionless participation"
    ],
    pros: [
      "Global accessibility",
      "Lower fees",
      "Transparent operations",
      "Programmable money"
    ],
    cons: [
      "Smart contract risks",
      "Regulatory uncertainty",
      "User experience complexity",
      "Volatility exposure"
    ],
    opportunities: [
      "Financial inclusion",
      "Innovation in lending",
      "Automated market making",
      "Yield farming strategies"
    ],
    threats: [
      "Regulatory crackdowns",
      "Smart contract exploits",
      "Market manipulation",
      "Liquidity crises"
    ],
    examples: ["Uniswap", "Compound", "Aave", "MakerDAO"],
    relatedTerms: ["smart-contracts", "liquidity", "yield", "dex"],
    icon: <TrendingUp className="h-5 w-5" />,
    difficulty: 'Intermediate'
  },
  {
    id: "bitcoin",
    term: "Bitcoin",
    category: "Cryptocurrency",
    subcategory: "Digital Currency",
    definition: "The first and most well-known cryptocurrency, created by Satoshi Nakamoto as a peer-to-peer electronic cash system.",
    keyPoints: [
      "First cryptocurrency",
      "Proof of Work consensus",
      "Limited supply of 21 million",
      "Decentralized peer-to-peer network"
    ],
    pros: [
      "Proven track record",
      "Strong network effects",
      "Deflationary design",
      "Censorship resistance"
    ],
    cons: [
      "Energy consumption",
      "Scalability limitations",
      "Price volatility",
      "User experience complexity"
    ],
    opportunities: [
      "Store of value",
      "Inflation hedge",
      "Financial sovereignty",
      "Layer 2 solutions"
    ],
    threats: [
      "Regulatory bans",
      "Quantum computing",
      "Environmental concerns",
      "Centralized mining"
    ],
    examples: ["Bitcoin Network", "Lightning Network", "Bitcoin Cash"],
    relatedTerms: ["cryptocurrency", "proof-of-work", "mining", "satoshi"],
    icon: <Coins className="h-5 w-5" />,
    difficulty: 'Beginner'
  },
  {
    id: "ethereum",
    term: "Ethereum",
    category: "Platform",
    subcategory: "Smart Contract Platform",
    definition: "A decentralized platform enabling smart contracts and decentralized applications (DApps) to be built and run without downtime, fraud, or third-party interference.",
    keyPoints: [
      "Smart contract platform",
      "Ethereum Virtual Machine (EVM)",
      "Native cryptocurrency (ETH)",
      "Largest DApp ecosystem"
    ],
    pros: [
      "Largest developer ecosystem",
      "Established network effects",
      "Continuous innovation",
      "Strong security model"
    ],
    cons: [
      "High gas fees",
      "Scalability challenges",
      "Complexity for users",
      "Energy consumption (pre-merge)"
    ],
    opportunities: [
      "DeFi expansion",
      "NFT marketplace",
      "Enterprise adoption",
      "Layer 2 scaling"
    ],
    threats: [
      "Competing platforms",
      "Regulatory challenges",
      "Technical vulnerabilities",
      "Centralization risks"
    ],
    examples: ["Ethereum Mainnet", "Polygon", "Arbitrum", "Optimism"],
    relatedTerms: ["smart-contracts", "evm", "gas", "dapps"],
    icon: <Globe className="h-5 w-5" />,
    difficulty: 'Intermediate'
  }
];

const categories = [
  { id: "all", name: "All Categories", icon: <Globe className="h-4 w-4" /> },
  { id: "DLT", name: "Distributed Ledger Tech", icon: <Network className="h-4 w-4" /> },
  { id: "Governance", name: "Governance", icon: <Vote className="h-4 w-4" /> },
  { id: "Privacy", name: "Privacy & Security", icon: <Shield className="h-4 w-4" /> },
  { id: "Consensus", name: "Consensus Mechanisms", icon: <Cpu className="h-4 w-4" /> },
  { id: "Finance", name: "DeFi & Finance", icon: <TrendingUp className="h-4 w-4" /> },
  { id: "Programming", name: "Smart Contracts", icon: <Zap className="h-4 w-4" /> },
  { id: "Identity", name: "Identity & Verification", icon: <Target className="h-4 w-4" /> },
  { id: "Cryptocurrency", name: "Cryptocurrencies", icon: <Coins className="h-4 w-4" /> },
  { id: "Platform", name: "Blockchain Platforms", icon: <Building2 className="h-4 w-4" /> },
  { id: "AI Governance", name: "AI Governance", icon: <Bot className="h-4 w-4" /> }
];

const SWOTAnalysis = ({ definition }: { definition: Definition }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
      <h4 className="font-medium text-green-700 mb-3 flex items-center">
        <CheckCircle className="h-4 w-4 mr-2" />
        Strengths
      </h4>
      <ul className="space-y-1">
        {definition.pros.map((pro, index) => (
          <li key={index} className="text-sm text-green-600 flex items-start">
            <ArrowRight className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
            {pro}
          </li>
        ))}
      </ul>
    </div>
    
    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
      <h4 className="font-medium text-red-700 mb-3 flex items-center">
        <XCircle className="h-4 w-4 mr-2" />
        Weaknesses
      </h4>
      <ul className="space-y-1">
        {definition.cons.map((con, index) => (
          <li key={index} className="text-sm text-red-600 flex items-start">
            <ArrowRight className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
            {con}
          </li>
        ))}
      </ul>
    </div>
    
    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
      <h4 className="font-medium text-blue-700 mb-3 flex items-center">
        <Target className="h-4 w-4 mr-2" />
        Opportunities
      </h4>
      <ul className="space-y-1">
        {definition.opportunities.map((opportunity, index) => (
          <li key={index} className="text-sm text-blue-600 flex items-start">
            <ArrowRight className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
            {opportunity}
          </li>
        ))}
      </ul>
    </div>
    
    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
      <h4 className="font-medium text-yellow-700 mb-3 flex items-center">
        <AlertTriangle className="h-4 w-4 mr-2" />
        Threats
      </h4>
      <ul className="space-y-1">
        {definition.threats.map((threat, index) => (
          <li key={index} className="text-sm text-yellow-600 flex items-start">
            <ArrowRight className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0" />
            {threat}
          </li>
        ))}
      </ul>
    </div>
  </div>
);

const DefinitionCard = ({ definition }: { definition: Definition }) => (
  <Card id={definition.id} className="mb-8 scroll-mt-20">
    <CardHeader>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-primary/10 p-2 rounded-full">
            {definition.icon}
          </div>
          <div>
            <CardTitle className="text-xl">{definition.term}</CardTitle>
            <div className="flex items-center space-x-2 mt-1">
              <Badge variant="outline">{definition.category}</Badge>
              {definition.subcategory && (
                <Badge variant="secondary" className="text-xs">
                  {definition.subcategory}
                </Badge>
              )}
              <Badge 
                variant={definition.difficulty === 'Beginner' ? 'default' : 
                        definition.difficulty === 'Intermediate' ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {definition.difficulty}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-muted-foreground mb-4">{definition.definition}</p>
      
      <div className="mb-4">
        <h4 className="font-medium mb-2">Key Points:</h4>
        <ul className="space-y-1">
          {definition.keyPoints.map((point, index) => (
            <li key={index} className="text-sm flex items-start">
              <ArrowRight className="h-3 w-3 mr-2 mt-0.5 flex-shrink-0 text-primary" />
              {point}
            </li>
          ))}
        </ul>
      </div>

      <SWOTAnalysis definition={definition} />
      
      {definition.examples.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Examples:</h4>
          <div className="flex flex-wrap gap-2">
            {definition.examples.map((example, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {example}
              </Badge>
            ))}
          </div>
        </div>
      )}
      
      {definition.relatedTerms.length > 0 && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Related Terms:</h4>
          <div className="flex flex-wrap gap-2">
            {definition.relatedTerms.map((term, index) => (
              <Button
                key={index}
                variant="ghost"
                size="sm"
                className="text-xs h-6 px-2 text-primary hover:text-primary/80"
                onClick={() => {
                  const element = document.getElementById(term);
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                #{term}
              </Button>
            ))}
          </div>
        </div>
      )}
    </CardContent>
  </Card>
);

export default function DefinitionsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filteredDefinitions, setFilteredDefinitions] = useState(definitions);

  useEffect(() => {
    let filtered = definitions;

    if (selectedCategory !== "all") {
      filtered = filtered.filter(def => def.category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.filter(def =>
        def.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
        def.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
        def.keyPoints.some(point => point.toLowerCase().includes(searchTerm.toLowerCase())) ||
        def.examples.some(example => example.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredDefinitions(filtered);
  }, [searchTerm, selectedCategory]);

  const handleAnchorClick = (anchor: string) => {
    const element = document.getElementById(anchor);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Web3 & AI Convergence Dictionary
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Your comprehensive guide to distributed ledger technologies, AI governance, 
          and the convergence of decentralized systems. From DAGs to smart contracts, 
          explore the building blocks of the decentralized future.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search terms, definitions, examples..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background text-foreground"
          >
            {categories.map(category => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="bg-muted/30 p-4 rounded-lg">
        <h3 className="font-medium mb-3">Quick Navigation</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {categories.slice(1).map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="justify-start h-8 text-xs"
            >
              {category.icon}
              <span className="ml-1 hidden sm:inline">{category.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredDefinitions.length} of {definitions.length} definitions
        {searchTerm && ` for "${searchTerm}"`}
      </div>

      {/* Definitions */}
      <div className="space-y-6">
        {filteredDefinitions.map((definition) => (
          <DefinitionCard key={definition.id} definition={definition} />
        ))}
      </div>

      {filteredDefinitions.length === 0 && (
        <div className="text-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No definitions found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search terms or filter criteria
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
        <div className="max-w-6xl mx-auto">
          {content}
        </div>
      </div>
    </div>
  );
}