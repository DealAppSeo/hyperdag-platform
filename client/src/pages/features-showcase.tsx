import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Share2, ExternalLink } from 'lucide-react';
import { Link } from 'wouter';

export default function FeaturesShowcase() {
  const [copiedFeature, setCopiedFeature] = useState<string | null>(null);

  const features = [
    {
      id: 'ai-dao',
      title: 'AI-Optimized DAO with Quadratic & Star Voting',
      description: 'The first governance system that actually works. AI prevents manipulation, users make real decisions.',
      bgColor: 'bg-white border-blue-200',
      icon: '🏛️',
      highlights: ['99.7% Bot Detection', '3x Faster Decisions', '85% Higher Participation'],
      path: '/ai-dao'
    },
    {
      id: 'zkp-identity',
      title: 'DBT → SBT Identity Evolution with Dynamic Reputation',
      description: 'Prove who you are without revealing anything. Build reputation without losing privacy.',
      bgColor: 'bg-white border-purple-200',
      icon: '🔐',
      highlights: ['Zero-Knowledge Proofs', 'Dynamic Reputation', 'Verified Credentials'],
      path: '/zkp-identity'
    },
    {
      id: 'grantflow',
      title: 'GrantFlow: AI Grant Matching Assistant',
      description: 'Stop wasting months searching for grants. AI finds perfect matches in seconds and writes applications.',
      bgColor: 'bg-white border-green-200',
      icon: '💰',
      highlights: ['50,000+ Active Grants', '$2.5B+ Available', '24/7 Auto-Discovery'],
      path: '/grantflow'
    },
    {
      id: 'hypercrowd',
      title: 'HyperCrowd: AI-Powered Team Building',
      description: 'Where perfect teams form automatically. AI matches based on skills, passion, and proven track record.',
      bgColor: 'bg-white border-orange-200',
      icon: '🚀',
      highlights: ['10,000+ Verified Builders', '95% Match Success', '72hr Average Match Time'],
      path: '/hypercrowd'
    }
  ];

  const handleShare = (feature: any) => {
    const url = `${window.location.origin}${feature.path}`;
    navigator.clipboard.writeText(url);
    setCopiedFeature(feature.id);
    setTimeout(() => setCopiedFeature(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 text-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary text-white font-bold px-6 py-3 text-lg">
            HYPERDAG ECOSYSTEM
          </Badge>
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Revolutionary Features<br />That Change Everything
          </h1>
          <p className="text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
            Four breakthrough innovations that transform Web3, AI, and social impact. 
            Each feature is a complete game-changer on its own.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card key={feature.id} className={`${feature.bgColor} border-2 overflow-hidden group hover:shadow-xl transition-all duration-300`}>
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="text-6xl">{feature.icon}</div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleShare(feature)}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      {copiedFeature === feature.id ? '✓ Copied!' : <Share2 className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                      <Link href={feature.path}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold mb-4 text-primary">{feature.title}</h3>
                <p className="text-gray-600 mb-6 text-lg">{feature.description}</p>
                
                <div className="space-y-2 mb-8">
                  {feature.highlights.map((highlight, idx) => (
                    <div key={idx} className="flex items-center text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <span className="font-medium">{highlight}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  size="lg" 
                  className="w-full bg-primary text-white hover:opacity-90 font-bold"
                >
                  <Link href={feature.path}>
                    Explore {feature.title.split(':')[0]} <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Integration Benefits */}
        <Card className="bg-white border-2 border-blue-200 mb-16">
          <CardContent className="p-8 text-center">
            <h2 className="text-4xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              The Power of Integration
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-4xl mx-auto">
              These aren't separate products - they're one unified ecosystem where each feature amplifies the others. 
              Your verified identity unlocks better grants, perfect teams win more funding, and everything is governed fairly.
            </p>
            
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl mb-2">🔄</div>
                <h4 className="font-bold text-lg mb-2 text-gray-900">Seamless Flow</h4>
                <p className="text-gray-600 text-sm">Identity → Teams → Grants → Governance</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🚀</div>
                <h4 className="font-bold text-lg mb-2 text-gray-900">Compound Benefits</h4>
                <p className="text-gray-600 text-sm">Each feature makes the others more powerful</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🎯</div>
                <h4 className="font-bold text-lg mb-2 text-gray-900">Single Platform</h4>
                <p className="text-gray-600 text-sm">Everything you need in one place</p>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🌍</div>
                <h4 className="font-bold text-lg mb-2 text-gray-900">Global Impact</h4>
                <p className="text-gray-600 text-sm">Scale solutions that matter</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inspirational CTA Section */}
        <Card className="bg-white border-2 border-primary/30">
          <CardContent className="p-8 text-center">
            <h2 className="text-4xl font-bold mb-4 text-primary">Join the HyperDAG Revolution</h2>
            <p className="text-xl text-gray-600 mb-6">
              Be part of tomorrow's solution today. Early adopters get exclusive access to all features 
              and help shape the future where AI and humanity collaborate to solve the world's greatest challenges.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8 max-w-3xl mx-auto">
              <p className="text-gray-700 italic">
                "The future belongs to those who see it coming and act on it today. 
                Join the revolution that transforms good intentions into global impact."
              </p>
            </div>
            <div className="flex gap-6 justify-center">
              <Button size="lg" className="bg-primary hover:opacity-90 text-lg px-8 py-4 text-white">
                <Link href="/auth">
                  Become a Revolutionary <ArrowRight className="ml-2 h-6 w-6" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-gray-300 text-gray-700 hover:bg-gray-50">
                <Link href="/about">Learn More</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}