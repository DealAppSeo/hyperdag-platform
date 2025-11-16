import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Users, Brain, Zap, Star, Target, Shield, Heart, TrendingUp, CheckCircle } from 'lucide-react';
import { Link } from 'wouter';
import CrossPromotionSection from '@/components/CrossPromotionSection';
import AIMatchingFeature from '@/components/AIMatchingFeature';

export default function HypercrowdOnepager() {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = `${window.location.origin}/hypercrowd`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-orange-500 text-black font-bold px-4 py-2">
            🚀 AI-POWERED TEAM BUILDING
          </Badge>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
            HyperCrowd: Where Perfect<br />Teams Form Automatically
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Stop networking. Start building. Our AI matches you with the perfect collaborators 
            based on skills, passion, and proven track record.
          </p>
          <div className="flex gap-4 justify-center mb-8">
            <Button size="lg" className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700">
              <Link href="/register">Find My Team <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" onClick={handleShare}>
              {copied ? '✓ Copied!' : 'Share This'}
            </Button>
          </div>
        </div>

        {/* Problem Section */}
        <Card className="bg-red-900/20 border-red-500/30 mb-12">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold mb-6 text-red-400">Team Building Is a Nightmare</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="font-bold mb-2">Endless Searching</h3>
                <p className="text-gray-300">Months on LinkedIn, Discord, forums trying to find the right people.</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">❓</div>
                <h3 className="font-bold mb-2">Unknown Quality</h3>
                <p className="text-gray-300">Can't verify skills, work ethic, or commitment until it's too late.</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">💔</div>
                <h3 className="font-bold mb-2">Team Breakups</h3>
                <p className="text-gray-300">Mismatched expectations, poor communication, projects fail.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Solution Flow */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
            How HyperCrowd Creates Magic Teams
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <Card className="bg-gradient-to-br from-blue-900/40 to-indigo-900/40 border-blue-500/30">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
                <Target className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Define Your Mission</h3>
                <p className="text-gray-300 text-sm">Tell us your project goals, timeline, and the skills you need.</p>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-500/30">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
                <Brain className="h-8 w-8 text-purple-400 mx-auto mb-3" />
                <h3 className="font-bold mb-2">AI Finds Perfect Matches</h3>
                <p className="text-gray-300 text-sm">Our AI analyzes skills, availability, and collaboration history.</p>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-500/30">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
                <Users className="h-8 w-8 text-green-400 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Smart Introductions</h3>
                <p className="text-gray-300 text-sm">Meet pre-vetted collaborators with verified skills and reputation.</p>
              </CardContent>
            </Card>

            {/* Step 4 */}
            <Card className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border-yellow-500/30">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">4</div>
                <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Launch Together</h3>
                <p className="text-gray-300 text-sm">Start building with confidence, backed by AI-optimized team dynamics.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Matching Features */}
        <Card className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-indigo-500/30 mb-12">
          <CardContent className="p-8">
            <div className="flex items-center mb-6">
              <Brain className="h-12 w-12 text-indigo-400 mr-4" />
              <h3 className="text-3xl font-bold">Advanced AI Team Matching</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <Shield className="h-8 w-8 text-indigo-400 mb-3" />
                <h4 className="font-bold mb-2">Verified Credentials</h4>
                <p className="text-gray-300">ZKP-verified skills and portfolio. No fake resumes, no surprises.</p>
              </div>
              <div>
                <Star className="h-8 w-8 text-indigo-400 mb-3" />
                <h4 className="font-bold mb-2">Dynamic Reputation</h4>
                <p className="text-gray-300">Real-time collaboration scores based on past project success.</p>
              </div>
              <div>
                <Heart className="h-8 w-8 text-indigo-400 mb-3" />
                <h4 className="font-bold mb-2">Passion Alignment</h4>
                <p className="text-gray-300">Match based on shared values and long-term vision, not just skills.</p>
              </div>
            </div>

            <div className="mt-8 p-6 bg-indigo-900/20 rounded-lg">
              <h4 className="font-bold text-indigo-400 mb-3">Smart Matching Algorithm:</h4>
              <div className="grid md:grid-cols-2 gap-6 text-sm">
                <div>
                  <h5 className="font-bold text-indigo-300 mb-2">Technical Compatibility</h5>
                  <ul className="text-gray-300 space-y-1">
                    <li>• Complementary skill sets</li>
                    <li>• Experience level balance</li>
                    <li>• Technology stack alignment</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-bold text-indigo-300 mb-2">Cultural Fit</h5>
                  <ul className="text-gray-300 space-y-1">
                    <li>• Working style preferences</li>
                    <li>• Communication patterns</li>
                    <li>• Shared mission alignment</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Stories */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Dream Teams in Action</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-green-900/20 border-green-500/30">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center text-black font-bold mr-4">AI</div>
                  <div>
                    <h4 className="font-bold">DeepTech Startup</h4>
                    <p className="text-gray-400 text-sm">Quantum Computing + AI</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">"HyperCrowd matched us with a quantum physicist, ML engineer, and business strategist. We raised $5M Series A in 6 months."</p>
                <div className="flex items-center text-green-400">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  <span className="font-bold">$5M Raised</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-900/20 border-purple-500/30">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold mr-4">DAO</div>
                  <div>
                    <h4 className="font-bold">Climate DAO</h4>
                    <p className="text-gray-400 text-sm">Carbon Capture Network</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">"Found our entire governance team through HyperCrowd. 15 verified climate scientists, economists, and policy experts working together seamlessly."</p>
                <div className="flex items-center text-purple-400">
                  <Users className="h-5 w-5 mr-2" />
                  <span className="font-bold">15-Person Team</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Integration Benefits */}
        <Card className="bg-gradient-to-br from-orange-900/40 to-red-900/40 border-orange-500/30 mb-12">
          <CardContent className="p-8">
            <h3 className="text-3xl font-bold text-center mb-8 text-orange-400">Integrated Ecosystem Benefits</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-4xl mb-4">💰</div>
                <h4 className="font-bold mb-3 text-orange-400">GrantFlow Connection</h4>
                <p className="text-gray-300">Teams formed here get priority access to matching grants through GrantFlow AI.</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🏛️</div>
                <h4 className="font-bold mb-3 text-orange-400">DAO Governance</h4>
                <p className="text-gray-300">Teams can instantly form sub-DAOs with AI-optimized governance structures.</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">🔐</div>
                <h4 className="font-bold mb-3 text-orange-400">ZKP Identity</h4>
                <p className="text-gray-300">All team members have verified credentials while maintaining privacy.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Stats */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-8">Global HyperCrowd Network</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="bg-purple-900/20 border-purple-500/30">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">10,000+</div>
                <p className="text-gray-300">Verified Builders</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-900/20 border-blue-500/30">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">500+</div>
                <p className="text-gray-300">Active Teams</p>
              </CardContent>
            </Card>
            <Card className="bg-green-900/20 border-green-500/30">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">95%</div>
                <p className="text-gray-300">Match Success Rate</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-900/20 border-yellow-500/30">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">72hr</div>
                <p className="text-gray-300">Average Match Time</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-orange-600/20 to-pink-600/20 border-orange-500/50">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Your Dream Team Is Waiting</h2>
            <p className="text-xl text-gray-300 mb-6">
              Stop settling for whoever's available. Get matched with people who share your vision and have the skills to make it happen.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700">
                <Link href="/register">
                  <Users className="mr-2 h-5 w-5" />
                  Join HyperCrowd
                </Link>
              </Button>
              <Button size="lg" variant="outline">
                <Link href="/hypercrowd-demo">See Team Matching</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* AI Matching Feature for cross-platform synergies */}
      <AIMatchingFeature context="teams" />
      
      {/* Cross-promotion section for virtuous loop marketing */}
      <CrossPromotionSection currentPage="hypercrowd" />
    </div>
  );
}