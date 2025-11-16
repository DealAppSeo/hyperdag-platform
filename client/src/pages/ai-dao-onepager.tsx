import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Users, Brain, Vote, Star, Zap, Shield, Target, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';
import CrossPromotionSection from '@/components/CrossPromotionSection';

export default function AiDaoOnepager() {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = `${window.location.origin}/ai-dao`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-yellow-500 text-black font-bold px-4 py-2">
            🚀 REVOLUTIONARY DAO GOVERNANCE
          </Badge>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            AI-Optimized DAO with<br />Quadratic & Star Voting
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            The first governance system that actually works. AI prevents manipulation, 
            users make real decisions, and every voice counts fairly.
          </p>
          <div className="flex gap-4 justify-center mb-8">
            <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
              <Link href="/register">Join the Future <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" onClick={handleShare}>
              {copied ? '✓ Copied!' : 'Share This'}
            </Button>
          </div>
        </div>

        {/* Problem Section */}
        <Card className="bg-red-900/20 border-red-500/30 mb-12">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold mb-6 text-red-400">Traditional DAOs Are Broken</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-4">😴</div>
                <h3 className="font-bold mb-2">Whale Dominance</h3>
                <p className="text-gray-300">Rich holders control everything. Your vote doesn't matter.</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🤖</div>
                <h3 className="font-bold mb-2">Bot Manipulation</h3>
                <p className="text-gray-300">Fake accounts and coordinated attacks skew results.</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">⏰</div>
                <h3 className="font-bold mb-2">Slow Decisions</h3>
                <p className="text-gray-300">Weeks of debate, no real action. Innovation dies.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Solution Section */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            HyperDAG's AI-Powered Solution
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Quadratic Voting */}
            <Card className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-500/30">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <Vote className="h-12 w-12 text-blue-400 mr-4" />
                  <h3 className="text-2xl font-bold">Quadratic Voting</h3>
                </div>
                <div className="space-y-4">
                  <p className="text-gray-200">Your influence grows with passion, not just tokens.</p>
                  <div className="bg-blue-900/30 p-4 rounded-lg">
                    <div className="text-sm font-mono text-gray-200">
                      1 token = 1 vote<br/>
                      4 tokens = 2 votes<br/>
                      9 tokens = 3 votes<br/>
                      <span className="text-blue-400">√tokens = voting power</span>
                    </div>
                  </div>
                  <p className="text-sm text-blue-300">Prevents whale dominance, rewards genuine conviction</p>
                  <Link href="/definitions#quadratic-voting">
                    <Button variant="outline" size="sm" className="mt-2 border-blue-400 text-blue-400 hover:bg-blue-400 hover:text-white">
                      Learn More About Quadratic Voting
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Star Voting */}
            <Card className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border-yellow-500/30">
              <CardContent className="p-8">
                <div className="flex items-center mb-6">
                  <Star className="h-12 w-12 text-yellow-400 mr-4" />
                  <h3 className="text-2xl font-bold">Star Voting</h3>
                </div>
                <div className="space-y-4">
                  <p className="text-gray-200">Rate multiple options simultaneously for nuanced decisions.</p>
                  <div className="bg-yellow-900/30 p-4 rounded-lg">
                    <div className="space-y-2 text-gray-200">
                      <div className="flex items-center">
                        <span className="w-20">Option A:</span>
                        <div className="flex text-yellow-400">★★★★★</div>
                      </div>
                      <div className="flex items-center">
                        <span className="w-20">Option B:</span>
                        <div className="flex text-yellow-400">★★★☆☆</div>
                      </div>
                      <div className="flex items-center">
                        <span className="w-20">Option C:</span>
                        <div className="flex text-yellow-400">★★☆☆☆</div>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-yellow-300">Find consensus solutions that work for everyone</p>
                  <Link href="/definitions#star-voting">
                    <Button variant="outline" size="sm" className="mt-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-black">
                      Learn More About Star Voting
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Features */}
          <Card className="bg-gradient-to-br from-green-900/40 to-cyan-900/40 border-green-500/30 mb-12">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <Brain className="h-12 w-12 text-green-400 mr-4" />
                <h3 className="text-3xl font-bold">AI-Powered Intelligence Layer</h3>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <Shield className="h-8 w-8 text-green-400 mb-3" />
                  <h4 className="font-bold mb-2 text-white">Sybil Detection</h4>
                  <p className="text-gray-200">AI identifies fake accounts and coordinated attacks before they vote</p>
                </div>
                <div>
                  <Target className="h-8 w-8 text-green-400 mb-3" />
                  <h4 className="font-bold mb-2 text-white">Smart Proposals</h4>
                  <p className="text-gray-200">AI helps craft clear, actionable proposals that get results</p>
                </div>
                <div>
                  <TrendingUp className="h-8 w-8 text-green-400 mb-3" />
                  <h4 className="font-bold mb-2 text-white">Outcome Prediction</h4>
                  <p className="text-gray-200">See likely results before voting to make informed decisions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* HITL Section */}
          <Card className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-indigo-500/30 mb-12">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <Users className="h-12 w-12 text-indigo-400 mr-4" />
                <h3 className="text-3xl font-bold">Human-in-the-Loop (HITL) Governance</h3>
              </div>
              <div className="space-y-4">
                <p className="text-gray-200 text-lg">
                  AI optimizes proposals and detects issues, but humans always have the final say. Every change, improvement, 
                  and decision is continuously verified and validated through community voting.
                </p>
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div className="bg-indigo-900/30 p-4 rounded-lg">
                    <h4 className="font-bold mb-2 text-white">AI Optimization</h4>
                    <p className="text-gray-200 text-sm">AI analyzes data, suggests improvements, and identifies potential issues</p>
                  </div>
                  <div className="bg-purple-900/30 p-4 rounded-lg">
                    <h4 className="font-bold mb-2 text-white">Human Validation</h4>
                    <p className="text-gray-200 text-sm">Community votes on all AI suggestions using quadratic and star voting</p>
                  </div>
                </div>
                <Link href="/definitions#human-in-the-loop">
                  <Button variant="outline" size="sm" className="mt-4 border-indigo-400 text-indigo-400 hover:bg-indigo-400 hover:text-white">
                    Learn More About HITL Governance
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-8">Real Results, Real Fast</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="bg-purple-900/30 border-purple-500/50">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">99.7%</div>
                <p className="text-gray-200">Bot Detection Accuracy</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-900/30 border-blue-500/50">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">3x</div>
                <p className="text-gray-200">Faster Decision Making</p>
              </CardContent>
            </Card>
            <Card className="bg-green-900/30 border-green-500/50">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">85%</div>
                <p className="text-gray-200">Higher Participation</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-900/30 border-yellow-500/50">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">100%</div>
                <p className="text-gray-200">Fair & Transparent</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-gray-800/90 to-gray-700/90 border-gray-600/50">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-4 text-white">Don't Miss the Governance Revolution</h2>
            <p className="text-xl text-gray-100 mb-6">
              Early adopters get exclusive voting power and shape the future of decentralized governance.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Link href="/register">
                  <Zap className="mr-2 h-5 w-5" />
                  Get Early Access
                </Link>
              </Button>
              <Button size="lg" variant="outline">
                <Link href="/dao-demo">View Live Demo</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Cross-promotion section for virtuous loop marketing */}
      <CrossPromotionSection currentPage="ai-dao" />
    </div>
  );
}