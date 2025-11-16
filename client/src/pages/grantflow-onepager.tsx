import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Search, Brain, Zap, DollarSign, Users, Target, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'wouter';
import CrossPromotionSection from '@/components/CrossPromotionSection';
import AIMatchingFeature from '@/components/AIMatchingFeature';

export default function GrantflowOnepager() {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = `${window.location.origin}/grantflow`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-500 text-black font-bold px-4 py-2">
            💰 AI-POWERED GRANT DISCOVERY
          </Badge>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
            GrantFlow: Your AI Grant<br />Matching Assistant
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Stop wasting months searching for grants. Our AI finds perfect matches in seconds, 
            writes your applications, and tracks submissions automatically.
          </p>
          <div className="flex gap-4 justify-center mb-8">
            <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
              <Link href="/register">Find My Grants <ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" onClick={handleShare}>
              {copied ? '✓ Copied!' : 'Share This'}
            </Button>
          </div>
        </div>

        {/* Problem Section */}
        <Card className="bg-red-900/20 border-red-500/30 mb-12">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold mb-6 text-red-400">Grant Hunting Is Broken</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Clock className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="font-bold mb-2">Time Wasted</h3>
                <p className="text-gray-300">Months spent searching databases, reading requirements, writing applications.</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">😵</div>
                <h3 className="font-bold mb-2">Perfect Matches Missed</h3>
                <p className="text-gray-300">Great opportunities hidden in obscure databases you never found.</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-4">📝</div>
                <h3 className="font-bold mb-2">Application Anxiety</h3>
                <p className="text-gray-300">Blank page syndrome. What do funders actually want to hear?</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Solution Flow */}
        <div className="mb-12">
          <h2 className="text-4xl font-bold text-center mb-12 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            How GrantFlow Works Its Magic
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            {/* Step 1 */}
            <Card className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border-blue-500/30">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
                <Search className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Tell Us Your Vision</h3>
                <p className="text-gray-300 text-sm">Describe your project, goals, and needs. Our AI understands context.</p>
              </CardContent>
            </Card>

            {/* Step 2 */}
            <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-500/30">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
                <Brain className="h-8 w-8 text-purple-400 mx-auto mb-3" />
                <h3 className="font-bold mb-2">AI Finds Perfect Matches</h3>
                <p className="text-gray-300 text-sm">We scan 20+ databases and find grants you'd never discover alone.</p>
              </CardContent>
            </Card>

            {/* Step 3 */}
            <Card className="bg-gradient-to-br from-yellow-900/40 to-orange-900/40 border-yellow-500/30">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
                <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-3" />
                <h3 className="font-bold mb-2">Auto-Generated Applications</h3>
                <p className="text-gray-300 text-sm">AI writes compelling applications tailored to each funder's preferences.</p>
              </CardContent>
            </Card>

            {/* Step 4 */}
            <Card className="bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-green-500/30">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">4</div>
                <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-3" />
                <h3 className="font-bold mb-2">One-Click Submission</h3>
                <p className="text-gray-300 text-sm">Review, customize, and submit to multiple grants simultaneously.</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Features */}
        <Card className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-indigo-500/30 mb-12">
          <CardContent className="p-8">
            <div className="flex items-center mb-6">
              <Brain className="h-12 w-12 text-indigo-400 mr-4" />
              <h3 className="text-3xl font-bold">Advanced AI Grant Intelligence</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <Target className="h-8 w-8 text-indigo-400 mb-3" />
                <h4 className="font-bold mb-2">Semantic Matching</h4>
                <p className="text-gray-300">AI understands meaning, not just keywords. Finds grants that truly fit your mission.</p>
              </div>
              <div>
                <TrendingUp className="h-8 w-8 text-indigo-400 mb-3" />
                <h4 className="font-bold mb-2">Success Prediction</h4>
                <p className="text-gray-300">See your winning probability before applying. Focus on grants you can actually get.</p>
              </div>
              <div>
                <Users className="h-8 w-8 text-indigo-400 mb-3" />
                <h4 className="font-bold mb-2">Team Recommendations</h4>
                <p className="text-gray-300">AI suggests perfect collaborators from HyperCrowd to strengthen your proposal.</p>
              </div>
            </div>

            <div className="mt-8 p-6 bg-indigo-900/20 rounded-lg">
              <h4 className="font-bold text-indigo-400 mb-3">Real Example:</h4>
              <div className="text-sm space-y-2">
                <p className="text-gray-300">"We need funding for an AI ethics research project..."</p>
                <p className="text-indigo-300">→ AI Found: NSF Ethical AI Initiative ($2.5M available)</p>
                <p className="text-indigo-300">→ AI Found: Mozilla Foundation Tech Ethics Grant ($150K)</p>
                <p className="text-indigo-300">→ AI Found: Partnership on AI Research Grant ($75K)</p>
                <p className="text-green-300">→ Total Opportunities: $2.7M+ in 3 seconds</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Success Stories */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Real Success Stories</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="bg-green-900/20 border-green-500/30">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-black font-bold mr-4">AI</div>
                  <div>
                    <h4 className="font-bold">Climate Tech Startup</h4>
                    <p className="text-gray-400 text-sm">Clean Energy Innovation</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">"GrantFlow found 12 relevant grants we never knew existed. We secured $3.2M in funding within 60 days."</p>
                <div className="flex items-center text-green-400">
                  <DollarSign className="h-5 w-5 mr-2" />
                  <span className="font-bold">$3.2M Secured</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-900/20 border-blue-500/30">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4">ED</div>
                  <div>
                    <h4 className="font-bold">Educational Nonprofit</h4>
                    <p className="text-gray-400 text-sm">STEM Education Program</p>
                  </div>
                </div>
                <p className="text-gray-300 mb-4">"The AI-generated applications were better than what we could write ourselves. 85% success rate!"</p>
                <div className="flex items-center text-blue-400">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  <span className="font-bold">85% Success Rate</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Grant Database Stats */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-8">Massive Grant Universe</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="bg-purple-900/20 border-purple-500/30">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">50,000+</div>
                <p className="text-gray-300">Active Grants</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-900/20 border-blue-500/30">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">$2.5B+</div>
                <p className="text-gray-300">Available Funding</p>
              </CardContent>
            </Card>
            <Card className="bg-green-900/20 border-green-500/30">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">20+</div>
                <p className="text-gray-300">Database Sources</p>
              </CardContent>
            </Card>
            <Card className="bg-yellow-900/20 border-yellow-500/30">
              <CardContent className="p-6 text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">24/7</div>
                <p className="text-gray-300">Auto-Discovery</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-green-500/50">
          <CardContent className="p-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Stop Searching. Start Finding.</h2>
            <p className="text-xl text-gray-300 mb-6">
              Your perfect grant is waiting. Let AI find it, write it, and submit it for you.
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                <Link href="/register">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Start Grant Discovery
                </Link>
              </Button>
              <Button size="lg" variant="outline">
                <Link href="/grantflow-demo">See Live Demo</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* AI Matching Feature for cross-platform synergies */}
      <AIMatchingFeature context="grants" />
      
      {/* Cross-promotion section for virtuous loop marketing */}
      <CrossPromotionSection currentPage="grantflow" />
    </div>
  );
}