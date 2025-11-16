import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Shield, Eye, EyeOff, Fingerprint, Zap, Lock, Unlock, Star, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';
import CrossPromotionSection from '@/components/CrossPromotionSection';

export default function ZkpIdentityOnepager() {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = `${window.location.origin}/zkp-identity`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-cyan-500 text-black font-bold px-4 py-2">
            🔐 ZERO-KNOWLEDGE IDENTITY
          </Badge>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-cyan-400 to-pink-400 bg-clip-text text-transparent">
            DBT → SBT Identity Evolution<br />with Dynamic Reputation
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Prove who you are without revealing anything. Build reputation without losing privacy. 
            The future of digital identity is here.
          </p>
          <div className="flex gap-4 justify-center mb-8">
            <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700">
              <Link href="/register">Start Identity Journey <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" onClick={handleShare}>
              {copied ? '✓ Copied!' : 'Share This'}
            </Button>
          </div>
        </div>

        {/* Problem Section */}
        <Card className="bg-red-900/20 border-red-500/30 mb-12">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold mb-6 text-red-400">Current Identity Systems Are Broken</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Eye className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="font-bold mb-2">No Privacy</h3>
                <p className="text-gray-300">Your personal data is everywhere, vulnerable to breaches and misuse.</p>
              </div>
              <div className="text-center">
                <Unlock className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="font-bold mb-2">Fake Identities</h3>
                <p className="text-gray-300">Bots, fake accounts, and Sybil attacks ruin online communities.</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="font-bold mb-2">Static Reputation</h3>
                <p className="text-gray-300">Your reputation never grows or adapts to your real contributions.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DBT to SBT Evolution */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            The Identity Evolution Path
          </h2>
          
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-cyan-500 to-purple-500 rounded-full"></div>
            
            <div className="space-y-12">
              {/* DBT Stage */}
              <div className="flex items-center">
                <div className="w-1/2 pr-8 text-right">
                  <Card className="bg-gradient-to-br from-gray-900/40 to-blue-900/40 border-gray-500/30">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-end mb-4">
                        <h3 className="text-2xl font-bold mr-3">Digital Bound Token (DBT)</h3>
                        <Lock className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-300 mb-4">Basic account creation. Limited access, no verification required.</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-end items-center">
                          <span className="mr-2">10 tokens/day limit</span>
                          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        </div>
                        <div className="flex justify-end items-center">
                          <span className="mr-2">Basic features only</span>
                          <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="absolute left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gray-500 rounded-full border-4 border-gray-900 z-10"></div>
                <div className="w-1/2 pl-8"></div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <ArrowRight className="h-8 w-8 text-cyan-400" />
              </div>

              {/* SBT Stage */}
              <div className="flex items-center">
                <div className="w-1/2 pr-8"></div>
                <div className="absolute left-1/2 transform -translate-x-1/2 w-8 h-8 bg-purple-500 rounded-full border-4 border-gray-900 z-10"></div>
                <div className="w-1/2 pl-8">
                  <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-500/30">
                    <CardContent className="p-6">
                      <div className="flex items-center mb-4">
                        <Shield className="h-8 w-8 text-purple-400 mr-3" />
                        <h3 className="text-2xl font-bold">Soulbound Token (SBT)</h3>
                      </div>
                      <p className="text-gray-300 mb-4">Complete 4FA + Biometric + Proof of Life verification.</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                          <span>Unlimited token access</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                          <span>Full platform features</span>
                        </div>
                        <div className="flex items-center">
                          <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                          <span>Verified human with soul</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ZKP Features */}
        <Card className="bg-gradient-to-br from-cyan-900/40 to-indigo-900/40 border-cyan-500/30 mb-12">
          <CardContent className="p-8">
            <div className="flex items-center mb-6">
              <EyeOff className="h-12 w-12 text-cyan-400 mr-4" />
              <h3 className="text-3xl font-bold">Zero-Knowledge Proof Magic</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <Fingerprint className="h-8 w-8 text-cyan-400 mb-3" />
                <h4 className="font-bold mb-2">Prove Without Revealing</h4>
                <p className="text-gray-300">Show you're qualified without sharing personal data</p>
              </div>
              <div>
                <Lock className="h-8 w-8 text-cyan-400 mb-3" />
                <h4 className="font-bold mb-2">Private Credentials</h4>
                <p className="text-gray-300">Your achievements stay confidential but verifiable</p>
              </div>
              <div>
                <Shield className="h-8 w-8 text-cyan-400 mb-3" />
                <h4 className="font-bold mb-2">Anti-Sybil Protection</h4>
                <p className="text-gray-300">One person, one identity, mathematically guaranteed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dynamic Reputation */}
        <Card className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border-yellow-500/30 mb-12">
          <CardContent className="p-8">
            <div className="flex items-center mb-6">
              <TrendingUp className="h-12 w-12 text-yellow-400 mr-4" />
              <h3 className="text-3xl font-bold">Dynamic Reputation System</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="text-xl font-bold mb-4 text-yellow-400">Real-Time Updates</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-yellow-900/20 p-3 rounded">
                    <span>Code Contributions</span>
                    <div className="flex">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <Star className="h-4 w-4 text-yellow-400" />
                      <Star className="h-4 w-4 text-yellow-400" />
                      <Star className="h-4 w-4 text-yellow-400" />
                      <Star className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-yellow-900/20 p-3 rounded">
                    <span>Community Impact</span>
                    <div className="flex">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <Star className="h-4 w-4 text-yellow-400" />
                      <Star className="h-4 w-4 text-yellow-400" />
                      <Star className="h-4 w-4 text-gray-400" />
                      <Star className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-yellow-900/20 p-3 rounded">
                    <span>Grant Success</span>
                    <div className="flex">
                      <Star className="h-4 w-4 text-yellow-400" />
                      <Star className="h-4 w-4 text-yellow-400" />
                      <Star className="h-4 w-4 text-yellow-400" />
                      <Star className="h-4 w-4 text-yellow-400" />
                      <Star className="h-4 w-4 text-yellow-400" />
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-xl font-bold mb-4 text-yellow-400">Composable Benefits</h4>
                <div className="space-y-3 text-gray-300">
                  <div className="flex items-center">
                    <Zap className="h-5 w-5 text-yellow-400 mr-2" />
                    <span>Higher reputation = better grant matches</span>
                  </div>
                  <div className="flex items-center">
                    <Zap className="h-5 w-5 text-yellow-400 mr-2" />
                    <span>Verified skills unlock premium opportunities</span>
                  </div>
                  <div className="flex items-center">
                    <Zap className="h-5 w-5 text-yellow-400 mr-2" />
                    <span>Cross-platform reputation portability</span>
                  </div>
                  <div className="flex items-center">
                    <Zap className="h-5 w-5 text-yellow-400 mr-2" />
                    <span>AI-powered opportunity recommendations</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Use Cases */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Endless Possibilities</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-purple-900/20 border-purple-500/30">
              <CardContent className="p-6">
                <div className="text-4xl mb-4 text-center">💰</div>
                <h3 className="font-bold text-center mb-3 text-purple-400">GrantFlow</h3>
                <p className="text-gray-300 text-center">Prove eligibility for grants without revealing personal details</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-900/20 border-blue-500/30">
              <CardContent className="p-6">
                <div className="text-4xl mb-4 text-center">👥</div>
                <h3 className="font-bold text-center mb-3 text-blue-400">HyperCrowd</h3>
                <p className="text-gray-300 text-center">Build trusted teams with verified but private credentials</p>
              </CardContent>
            </Card>
            <Card className="bg-green-900/20 border-green-500/30">
              <CardContent className="p-6">
                <div className="text-4xl mb-4 text-center">🏛️</div>
                <h3 className="font-bold text-center mb-3 text-green-400">DAO Governance</h3>
                <p className="text-gray-300 text-center">Vote with verified identity while maintaining anonymity</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border-cyan-500/50">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Your Digital Identity Awaits</h2>
            <p className="text-xl text-gray-300 mb-6">
              Be among the first to experience true privacy-preserving identity with unlimited possibilities.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700">
                <Link href="/register">
                  <Shield className="mr-2 h-5 w-5" />
                  Create Your Identity
                </Link>
              </Button>
              <Button size="lg" variant="outline">
                <Link href="/zkp-demo">See ZKP Demo</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Cross-promotion section for virtuous loop marketing */}
      <CrossPromotionSection currentPage="zkp-identity" />
    </div>
  );
}