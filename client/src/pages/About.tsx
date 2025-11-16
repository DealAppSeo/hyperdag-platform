import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, Shield, Users, TrendingUp, Bot, Heart, Code, Globe, Lock, Sparkles } from 'lucide-react';
import { Link } from 'wouter';

export default function About() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-8">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          HyperDAG
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
          The first blockchain ecosystem where social impact is architecturally embedded, not an afterthought.
          Combining hybrid DAG-blockchain performance with AI optimization for humanity's collective good.
        </p>
        <div className="flex flex-wrap justify-center gap-3 mt-6">
          <Badge variant="secondary" className="text-sm px-3 py-1">2.4M TPS</Badge>
          <Badge variant="secondary" className="text-sm px-3 py-1">470ms Finality</Badge>
          <Badge variant="secondary" className="text-sm px-3 py-1">1,575x Energy Efficient</Badge>
          <Badge variant="secondary" className="text-sm px-3 py-1">Quantum-Resistant</Badge>
        </div>
      </div>

      {/* Technical Architecture */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            Hybrid DAG-Blockchain Architecture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Our revolutionary dual-layer architecture combines the parallel processing capabilities of Directed Acyclic Graphs (DAGs) 
            with the security guarantees of traditional blockchain checkpoints, achieving unprecedented performance while maintaining 
            complete decentralization.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">DAG Processing Layer</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>• Asynchronous transaction confirmation</li>
                <li>• Natural parallelization and sharding</li>
                <li>• No block size limitations</li>
                <li>• Mesh topology adaptation</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">Blockchain Security Layer</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>• Periodic immutable checkpoints</li>
                <li>• Cross-chain security anchoring</li>
                <li>• Validator rotation protocols</li>
                <li>• Quantum-resistant cryptography</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trinity Identity System */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-green-500" />
            Trinity Identity System
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Our groundbreaking identity framework distinguishes between three types of participants, each with appropriate 
            capabilities and governance rights, preventing Sybil attacks while enabling democratic participation.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5 text-blue-500" />
                <h4 className="font-semibold">Soul Bound Tokens (SBTs)</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Verifiable human identity with ANFIS-powered 4-6 Factor Authentication and reputation scoring.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="h-5 w-5 text-purple-500" />
                <h4 className="font-semibold">Digital Bound Tokens (DBTs)</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                AI agent credentials with defined capabilities and governance limitations.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="h-5 w-5 text-red-500" />
                <h4 className="font-semibold">Charity Bound Tokens (CBTs)</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Transparent nonprofit verification with real-time impact measurement and funding allocation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ANFIS AI Optimization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-purple-500" />
            ANFIS AI-Driven Optimization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Our Adaptive Neuro-Fuzzy Inference System (ANFIS) combines neural networks with fuzzy logic to create 
            human-like decision making at AI processing speeds, optimizing everything from transaction routing to governance.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">Intelligent Transaction Routing</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Dynamic path optimization based on network congestion, user reputation, and social impact scoring 
                with fuzzy logic rules that adapt to changing conditions.
              </p>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">Democratic Governance Enhancement</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Quadratic and ranked choice voting with AI-optimized consensus mechanisms that prevent plutocracy 
                while ensuring efficient decision-making.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Impact Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-6 w-6 text-red-500" />
            Embedded Social Impact Architecture
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Unlike other blockchains where charity is an afterthought, HyperDAG architecturally embeds social good 
            with guaranteed funding allocation and transparent impact measurement.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">Guaranteed Social Funding</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>• Minimum 10% platform profits to verified charities</li>
                <li>• Community governance determines distribution</li>
                <li>• Transparent allocation with impact measurement</li>
                <li>• Multiple value allocation pathways for users</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">GrantFlow Matching Engine</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>• AI-powered RFI to RFP matching</li>
                <li>• Automated global team building</li>
                <li>• Zero-trust collaboration through SBTs</li>
                <li>• Real-time impact tracking and verification</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Creator Economics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-green-500" />
            Revolutionary Creator Economics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Our 90-98% revenue share model revolutionizes creator monetization while contributing to social good 
            through our earn-while-you-learn ecosystem.
          </p>
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-6 rounded-lg">
            <h4 className="font-semibold text-lg mb-3">Revenue Distribution Formula</h4>
            <div className="space-y-2 text-sm">
              <p><strong>Creator Share:</strong> 90% + min(Reputation_Bonus, 8%)</p>
              <p><strong>Platform Fee:</strong> max(2%, 10% - Reputation_Bonus)</p>
              <p><strong>Charity Allocation:</strong> 40% of Platform_Fee</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            Technical Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4 text-center">
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">2.4M</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">TPS Throughput</div>
              <div className="text-xs text-gray-500">160x faster than Ethereum</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">470ms</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Finality Time</div>
              <div className="text-xs text-gray-500">Near-instant confirmation</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">1,575x</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Energy Efficiency</div>
              <div className="text-xs text-gray-500">vs Ethereum PoS</div>
            </div>
            <div className="p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">$0.0035</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Average Fee</div>
              <div className="text-xs text-gray-500">99.97% lower than peak Ethereum</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Market Vision */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-6 w-6 text-blue-500" />
            Market Impact Vision
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            By 2027, HyperDAG aims to serve 1 billion people with financial inclusion tools, provide 10 million 
            blockchain-verified educational credentials, and channel $100 million annually to verified charitable causes.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">Target Markets</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>• 5% of $500B DeFi market through inclusive financial services</li>
                <li>• 10% of $50B digital education sector via verified credentials</li>
                <li>• 2% of $100B healthcare technology market</li>
                <li>• Leadership in $25B DAO governance market</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-lg">Social Impact Goals</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li>• 1 billion people with financial inclusion</li>
                <li>• 10 million blockchain-verified credentials</li>
                <li>• 100 million healthcare interactions facilitated</li>
                <li>• $100 million annual charity impact</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <CardContent className="text-center py-8">
          <h3 className="text-2xl font-bold mb-4">Join the AI-Web3 Convergence Revolution</h3>
          <p className="mb-6 text-purple-100">
            Be part of the first blockchain ecosystem where technology truly serves humanity.
            Experience democratic governance, earn while contributing to social good, and help build 
            a more equitable digital future.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/register">
              <Button variant="secondary" size="lg">
                Start Your Journey
              </Button>
            </Link>
            <Link href="/developers">
              <Button variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white hover:text-purple-600">
                Developer Platform
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}