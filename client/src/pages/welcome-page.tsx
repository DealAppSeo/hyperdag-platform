import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  Shield, 
  Zap, 
  Users, 
  Globe, 
  Brain, 
  Lock, 
  Sparkles, 
  Network,
  CheckCircle,
  Star,
  TrendingUp
} from 'lucide-react';

export default function WelcomePage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      icon: Shield,
      title: "Privacy-First Architecture",
      description: "Zero-knowledge proofs and quantum-resistant encryption protect your identity and data",
      benefit: "Complete privacy without sacrificing functionality"
    },
    {
      icon: Brain,
      title: "AI-Powered Intelligence",
      description: "Smart contract optimization, automatic grant matching, and personalized recommendations",
      benefit: "Work smarter, not harder with AI assistance"
    },
    {
      icon: Network,
      title: "Cross-Chain Interoperability",
      description: "Seamlessly interact with multiple blockchains through our hybrid DAG architecture",
      benefit: "One platform, unlimited blockchain access"
    },
    {
      icon: Users,
      title: "Decentralized Collaboration",
      description: "Connect with like-minded builders, find team members, and collaborate on projects",
      benefit: "Build the future together"
    }
  ];

  const useCases = [
    {
      title: "Grant Seekers",
      description: "AI automatically matches you with relevant funding opportunities",
      icon: TrendingUp,
      color: "bg-blue-50 text-blue-700 border-blue-200"
    },
    {
      title: "Project Builders",
      description: "Find team members, funding, and resources for your Web3 project",
      icon: Users,
      color: "bg-green-50 text-green-700 border-green-200"
    },
    {
      title: "Privacy Advocates",
      description: "Maintain complete anonymity while building reputation and connections",
      icon: Lock,
      color: "bg-purple-50 text-purple-700 border-purple-200"
    },
    {
      title: "Web3 Enthusiasts",
      description: "Access cutting-edge blockchain technology and decentralized applications",
      icon: Globe,
      color: "bg-orange-50 text-orange-700 border-orange-200"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
          <div className="text-center">
            <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-200">
              <Sparkles className="h-3 w-3 mr-1" />
              The Future of Decentralized Collaboration
            </Badge>
            
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
              Build the Future with
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                Privacy & Intelligence
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              HyperDAG combines quantum-resistant privacy, AI-powered intelligence, and cross-chain 
              interoperability to create the ultimate platform for decentralized collaboration.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/about">Learn More</Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                Open Source
              </div>
              <div className="flex items-center">
                <Shield className="h-4 w-4 mr-1 text-blue-500" />
                Quantum-Resistant
              </div>
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-1 text-yellow-500" />
                Community Driven
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Feature Showcase */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose HyperDAG?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Experience the next generation of decentralized platforms with features designed for privacy, intelligence, and collaboration.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              const isActive = index === currentFeature;
              
              return (
                <Card 
                  key={index}
                  className={`transition-all duration-300 cursor-pointer ${
                    isActive 
                      ? 'border-blue-500 shadow-lg bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setCurrentFeature(index)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center text-lg">
                      <Icon className={`h-5 w-5 mr-2 ${isActive ? 'text-blue-600' : 'text-gray-600'}`} />
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-2">{feature.description}</p>
                    <p className={`text-sm font-medium ${isActive ? 'text-blue-700' : 'text-gray-500'}`}>
                      {feature.benefit}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="lg:pl-8">
            <div className="relative bg-gradient-to-br from-gray-900 to-blue-900 rounded-xl p-8 text-white">
              <div className="absolute top-4 right-4">
                <div className="flex space-x-1">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="text-sm text-blue-300">HyperDAG Terminal</div>
                <div className="font-mono text-sm">
                  <div className="text-green-400">$ hyperdag --status</div>
                  <div className="text-gray-300 mt-2">
                    ✓ Quantum-resistant encryption: ACTIVE<br/>
                    ✓ Cross-chain bridges: 8 networks<br/>
                    ✓ AI optimization: RUNNING<br/>
                    ✓ Privacy mode: ENABLED<br/>
                  </div>
                  <div className="text-green-400 mt-4">
                    $ Current feature: {features[currentFeature].title}
                  </div>
                  <div className="text-gray-300">
                    {features[currentFeature].description}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Perfect For</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Whether you're seeking funding, building projects, or exploring Web3, HyperDAG provides the tools you need.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2 ${useCase.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-lg">{useCase.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 text-sm">{useCase.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Build the Future?</h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of builders, creators, and innovators who are already using HyperDAG 
            to create the next generation of decentralized applications.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Start Building Today
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/documentation">View Documentation</Link>
            </Button>
          </div>

          <p className="text-sm text-gray-500 mt-6">
            Free to start • No credit card required • Open source
          </p>
        </div>
      </div>
    </div>
  );
}