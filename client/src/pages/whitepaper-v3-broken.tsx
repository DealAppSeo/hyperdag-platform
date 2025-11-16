/**
 * HyperDAG Technical White Paper v3.1
 * 
 * Interactive presentation of the comprehensive technical white paper
 * with enhanced features and implementation roadmap
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Layout } from '@/components/layout/layout';
import { 
  Zap, 
  Shield, 
  Network, 
  Brain, 
  Coins, 
  Users,
  Heart,
  Code,
  Target,
  Sparkles,
  Lock,
  Globe,
  ArrowRight,
  CheckCircle,
  Star
} from 'lucide-react';

export default function WhitepaperV3() {
  const [selectedPhase, setSelectedPhase] = useState('phase1');

  const performanceMetrics = [
    { metric: 'Transactions Per Second', value: '2.4M TPS', improvement: '36x vs Solana', icon: Zap },
    { metric: 'Transaction Finality', value: '470ms', improvement: '4.5x faster', icon: Target },
    { metric: 'Energy Efficiency', value: '0.08 kJ/Tx', improvement: '15x cleaner', icon: Heart },
    { metric: 'Byzantine Fault Tolerance', value: '33%', improvement: 'Quantum-resistant', icon: Shield }
  ];

  const roadmapPhases = {
    phase1: {
      title: 'Foundation (Q1-Q3 2025)',
      status: 'in-progress',
      completion: 75,
      features: [
        'Polygon mainnet with Plonky3 zk-rollups',
        'Miden agglayer integration',
        'QR referral system',
        'PoL/OTP/FIDO2 authentication',
        'SBT minting and voting',
        'Gig matching platform',
        '$100k social impact pilot'
      ]
    },
    phase2: {
      title: 'Expansion (Q4 2025 - Q3 2026)',
      status: 'planned',
      completion: 0,
      features: [
        'Solana DPoS integration',
        '50,000+ TPS capacity',
        '100k+ user milestone',
        '$1M impact funding',
        'Cross-chain bridges',
        'AI marketplace launch'
      ]
    },
    phase3: {
      title: 'Global Scale (Q4 2026 - 2027)',
      status: 'planned',
      completion: 0,
      features: [
        'Custom DAG implementation',
        'Full PoL consensus',
        '1M+ TPS throughput',
        'Universal Health Care pilots',
        '$100M annual impact funding',
        'Global accessibility features'
      ]
    }
  };

  const socialImpactGoals = [
    { goal: 'Financial Inclusion', target: '1 billion people', current: '0', icon: Coins },
    { goal: 'Educational Enhancement', target: '10 million people', current: '0', icon: Brain },
    { goal: 'Healthcare Access', target: '100 million people', current: '0', icon: Heart },
    { goal: 'Impact Funding', target: '$100M annual', current: '$100k pilot', icon: Target }
  ];

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
            <Network className="h-8 w-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              HyperDAG v3.1
            </h1>
            <p className="text-xl text-gray-600">Technical White Paper</p>
          </div>
        </div>
        <div className="max-w-3xl mx-auto">
          <p className="text-lg text-gray-700 leading-relaxed">
            Empowering Communities through a Privacy-First, AI-Optimized, 
            Hybrid DAG-Blockchain Ecosystem with Quantum-Resistant Security
          </p>
        </div>
        <div className="flex justify-center space-x-2">
          <Badge className="bg-green-600">Version 3.1</Badge>
          <Badge variant="outline">May 2025</Badge>
          <Badge className="bg-purple-600">2.4M TPS</Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          <TabsTrigger value="impact">Social Impact</TabsTrigger>
          <TabsTrigger value="tokenomics">Tokenomics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-purple-600" />
                  AI-Optimized Architecture
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Fuzzy logic and neural networks optimize consensus, routing, and rewards with human-in-the-loop governance validation.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Transaction Routing</span>
                    <Badge className="bg-blue-600">AI-Optimized</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Consensus Engine</span>
                    <Badge className="bg-green-600">Neural Network</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Reward Distribution</span>
                    <Badge className="bg-purple-600">Fuzzy Logic</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-blue-600" />
                  Quantum-Resistant Security
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  CRYSTALS-Kyber/Dilithium encryption with zk-SNARKs/STARKs and Proof of Life consensus.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Key Exchange</span>
                    <Badge variant="outline">CRYSTALS-Kyber</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Digital Signatures</span>
                    <Badge variant="outline">CRYSTALS-Dilithium</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Zero Knowledge</span>
                    <Badge variant="outline">zk-SNARKs/STARKs</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Network className="h-5 w-5 mr-2 text-green-600" />
                  Hybrid DAG-Blockchain
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Combines DAG scalability with blockchain security, enhanced by modular Polygon AggLayer integration.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Parallel Processing</span>
                    <Badge className="bg-green-600">DAG Layer</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Security Checkpoints</span>
                    <Badge className="bg-orange-600">Blockchain</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cross-Chain</span>
                    <Badge className="bg-purple-600">AggLayer</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-orange-600" />
                  Self-Sovereign Identity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Interoperable Soul Bound Tokens enable reputation-based governance and complete data ownership.
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Reputation Scoring</span>
                    <Badge className="bg-blue-600">Multi-Factor</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Cross-Chain Identity</span>
                    <Badge className="bg-green-600">Portable SBTs</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Privacy</span>
                    <Badge className="bg-purple-600">zk-Proofs</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Core Innovation Pillars</CardTitle>
              <CardDescription>
                Six foundational innovations that set HyperDAG apart in the Web3 ecosystem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { title: 'Scalable Hybrid Architecture', description: 'DAG-blockchain with modular AggLayer and fuzzy logic optimization' },
                  { title: 'Interoperable Identity', description: 'SBT-based reputation system across multiple blockchain networks' },
                  { title: 'AI Marketplace', description: 'Tokenized model exchange with differential privacy and federated learning' },
                  { title: 'Quantum-Resistant Privacy', description: 'Advanced cryptography with AI-optimized data compression' },
                  { title: 'Meritocratic Governance', description: 'AI-adjusted incentives with quadratic voting and human oversight' },
                  { title: 'Mobile-First Design', description: 'Global accessibility with offline mode and biometric authentication' }
                ].map((pillar, index) => (
                  <div key={index} className="p-4 border rounded-lg bg-gradient-to-br from-gray-50 to-gray-100">
                    <h4 className="font-semibold text-sm mb-2">{pillar.title}</h4>
                    <p className="text-xs text-gray-600">{pillar.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {performanceMetrics.map((metric, index) => {
              const IconComponent = metric.icon;
              return (
                <Card key={index} className="text-center">
                  <CardHeader className="pb-2">
                    <div className="flex justify-center mb-2">
                      <IconComponent className="h-8 w-8 text-blue-600" />
                    </div>
                    <CardTitle className="text-sm">{metric.metric}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600 mb-1">{metric.value}</div>
                    <Badge variant="outline" className="text-xs">{metric.improvement}</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Competitive Benchmark Analysis</CardTitle>
              <CardDescription>
                Performance comparison with leading blockchain platforms (testnet-based projections)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Platform</th>
                      <th className="text-left p-3">TPS</th>
                      <th className="text-left p-3">Finality</th>
                      <th className="text-left p-3">Energy/Tx (kJ)</th>
                      <th className="text-left p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b bg-blue-50">
                      <td className="p-3 font-semibold">HyperDAG v3.1</td>
                      <td className="p-3">2.4M</td>
                      <td className="p-3">470ms</td>
                      <td className="p-3">0.08</td>
                      <td className="p-3"><Badge className="bg-green-600">Next-Gen</Badge></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">Solana v1.14</td>
                      <td className="p-3">65k</td>
                      <td className="p-3">2.1s</td>
                      <td className="p-3">1.2</td>
                      <td className="p-3"><Badge variant="outline">Production</Badge></td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">Polygon zkEVM</td>
                      <td className="p-3">7k</td>
                      <td className="p-3">12min</td>
                      <td className="p-3">0.3</td>
                      <td className="p-3"><Badge variant="outline">Production</Badge></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold mb-2">Performance Formula</h4>
                <code className="text-sm">
                  TPS = (Parallel DAG Threads × Node Capacity) / (Latency + AggLayer Overhead)
                </code>
                <p className="text-sm text-gray-600 mt-2">
                  Example: (10,000 threads × 500 tx/s) / (0.002s + 0.0005s) = 2.4M TPS
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="h-5 w-5 mr-2" />
                  Advanced Security Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm">Proof of Life (PoL) Consensus</span>
                  <Badge className="bg-green-600">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span className="text-sm">Quantum-Resistant Cryptography</span>
                  <Badge className="bg-blue-600">CRYSTALS</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                  <span className="text-sm">Anti-Sybil 2.0 Framework</span>
                  <Badge className="bg-purple-600">37-Parameter</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                  <span className="text-sm">Context-Aware Multi-Factor Auth</span>
                  <Badge className="bg-orange-600">PoL+FIDO2</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  AI-Driven Optimization
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm">Neural Consensus Engine</span>
                  <Badge className="bg-green-600">DVNN</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <span className="text-sm">Fuzzy Logic Transaction Routing</span>
                  <Badge className="bg-blue-600">Real-Time</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                  <span className="text-sm">Federated Learning Marketplace</span>
                  <Badge className="bg-purple-600">240k+ Devices</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                  <span className="text-sm">AI Reward Optimization</span>
                  <Badge className="bg-orange-600">Dynamic</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Technical Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Cryptography</h4>
                  <div className="space-y-2 text-sm">
                    <div>Key Exchange: CRYSTALS-Kyber-1024</div>
                    <div>Signatures: CRYSTALS-Dilithium-5</div>
                    <div>Symmetric: AES-512-Q</div>
                    <div>ZK Proofs: SNARKs, STARKs, Plonky3</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Consensus</h4>
                  <div className="space-y-2 text-sm">
                    <div>Byzantine Tolerance: 33%</div>
                    <div>Finality: 470ms adaptive</div>
                    <div>Energy Recovery: 92%</div>
                    <div>Shard Allocation: Fuzzy Logic</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Integration</h4>
                  <div className="space-y-2 text-sm">
                    <div>Bridges: LayerZero, Wormhole, IBC</div>
                    <div>AggLayer: Polygon Miden</div>
                    <div>Mobile: PWA + Native</div>
                    <div>API: 80% faster integration</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roadmap" className="space-y-6">
          <div className="space-y-6">
            {Object.entries(roadmapPhases).map(([phaseKey, phase]) => (
              <Card 
                key={phaseKey} 
                className={`cursor-pointer transition-all ${selectedPhase === phaseKey ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => setSelectedPhase(phaseKey)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      {phase.status === 'in-progress' && <Sparkles className="h-5 w-5 mr-2 text-blue-600" />}
                      {phase.status === 'planned' && <Target className="h-5 w-5 mr-2 text-gray-500" />}
                      {phase.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge className={phase.status === 'in-progress' ? 'bg-blue-600' : 'bg-gray-500'}>
                        {phase.status === 'in-progress' ? 'In Progress' : 'Planned'}
                      </Badge>
                      <span className="text-sm font-medium">{phase.completion}%</span>
                    </div>
                  </div>
                  <Progress value={phase.completion} className="h-2" />
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {phase.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className={`h-4 w-4 ${phase.status === 'in-progress' ? 'text-blue-600' : 'text-gray-400'}`} />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-purple-600" />
                Future Phases (2026-2027)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Phase 4: Cognitive Networks</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Self-healing AI infrastructure</li>
                    <li>• Emotional user interfaces</li>
                    <li>• Decentralized energy markets</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Phase 5: Singularity Readiness</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Neuromorphic hardware integration</li>
                    <li>• Decentralized AI constitution</li>
                    <li>• DNA-based storage for SBTs</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="impact" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {socialImpactGoals.map((goal, index) => {
              const IconComponent = goal.icon;
              return (
                <Card key={index} className="text-center border-l-4 border-l-green-500">
                  <CardHeader className="pb-2">
                    <div className="flex justify-center mb-2">
                      <IconComponent className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle className="text-sm">{goal.goal}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-bold text-green-600 mb-1">{goal.target}</div>
                    <Badge variant="outline" className="text-xs">Current: {goal.current}</Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Social Impact Framework</CardTitle>
              <CardDescription>
                Transparent funding allocation and impact measurement across key focus areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Impact Areas</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="font-medium text-sm">Financial Inclusion</div>
                        <div className="text-xs text-gray-600">Transparent supply chains, microfinance, DeFi access</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="font-medium text-sm">Education Enhancement</div>
                        <div className="text-xs text-gray-600">Digital literacy, blockchain credentials, skill verification</div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="font-medium text-sm">Healthcare Access</div>
                        <div className="text-xs text-gray-600">Telemedicine, AI diagnostics, Universal Health Care pilots</div>
                      </div>
                      <div className="p-3 bg-orange-50 rounded-lg">
                        <div className="font-medium text-sm">Sustainability</div>
                        <div className="text-xs text-gray-600">Clean water initiatives, sustainable food sources</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Funding Allocation</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">Social Impact Fund</span>
                        <Badge className="bg-green-600">10-15% of tokens</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">Milestone-Based Release</span>
                        <Badge className="bg-blue-600">Transparent</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">Community Voting</span>
                        <Badge className="bg-purple-600">Quadratic</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm">Impact Measurement</span>
                        <Badge className="bg-orange-600">Blockchain-Verified</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokenomics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>HDG Token Distribution</CardTitle>
              <CardDescription>
                Fixed supply of 8.88B HDG tokens with community-focused allocation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">Community Contributions</span>
                    <div className="text-right">
                      <div className="font-bold">40%</div>
                      <div className="text-xs text-gray-600">3.552B HDG</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Ecosystem Development</span>
                    <div className="text-right">
                      <div className="font-bold">20%</div>
                      <div className="text-xs text-gray-600">1.776B HDG</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="font-medium">Social Impact Fund</span>
                    <div className="text-right">
                      <div className="font-bold">10-15%</div>
                      <div className="text-xs text-gray-600">0.888-1.332B HDG</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium">Treasury Reserve</span>
                    <div className="text-right">
                      <div className="font-bold">10%</div>
                      <div className="text-xs text-gray-600">0.888B HDG</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Team & Advisors</span>
                    <div className="text-right">
                      <div className="font-bold">10%</div>
                      <div className="text-xs text-gray-600">0.888B HDG (4-year vest)</div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Token Utility</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm mb-1">Transaction Fees</div>
                      <div className="text-xs text-gray-600">0.0035 HDG/base unit, reduced by SBT score</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm mb-1">Staking Rewards</div>
                      <div className="text-xs text-gray-600">8.9% base APR + 2.1% SBT bonus</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm mb-1">Governance Power</div>
                      <div className="text-xs text-gray-600">Quadratic voting: √(HDG) × SBT Score</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-sm mb-1">Deflationary Mechanism</div>
                      <div className="text-xs text-gray-600">0.7% of cross-chain swaps vaulted</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-center space-y-4 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
        <h2 className="text-2xl font-bold">Join the HyperDAG Revolution</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Be part of building a decentralized future where opportunities dismantle gatekeepers, 
          delivering value through transparent governance and meaningful social impact.
        </p>
        <div className="flex justify-center space-x-4">
          <Button className="bg-purple-600 hover:bg-purple-700">
            Explore Features
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
          <Button variant="outline">
            Developer Documentation
          </Button>
        </div>
        <div className="text-sm text-gray-500">
          MVP Demo Launch: Mid-May 2025
        </div>
      </div>
    </div>
    </Layout>
  );
}