import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, GitBranch, Cpu, Network, Github, Code, Database, Zap } from 'lucide-react';

export default function LandingHyperDag() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nodeCount, setNodeCount] = useState(42);
  const { toast } = useToast();

  // Simulate DAG network growth (slowed to reduce flashing)
  useEffect(() => {
    const interval = setInterval(() => {
      setNodeCount(prev => prev + Math.floor(Math.random() * 3));
    }, 10000); // Reduced from 2s to 10s
    return () => clearInterval(interval);
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch('/api/newsletter/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          source: 'hyperdag-landing',
          incentive: 'DAG Revolution Early Access'
        })
      });

      toast({
        title: "Welcome to the DAG Revolution!",
        description: "You're now on the waitlist for HyperDAG beta access",
      });
      
      setEmail('');
    } catch (error) {
      toast({
        title: "Signup failed",
        description: "Please try again or contact support",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900 to-black text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-6 pt-20 pb-16">
        <div className="text-center max-w-5xl mx-auto">
          <Badge className="mb-6 bg-blue-500/20 text-blue-300 border-blue-500/30">
            Next-Generation Architecture
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-400 to-green-400 bg-clip-text text-transparent">
            The Future of Distributed AI Computation
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            HyperDAG revolutionizes AI orchestration through directed acyclic graphs, enabling unprecedented scalability, 
            performance, and decentralization for the next generation of intelligent applications.
          </p>

          {/* Live DAG Visualization Preview */}
          <div className="bg-slate-800/50 rounded-lg p-6 mb-8 border border-blue-500/20">
            <div className="flex items-center justify-center gap-8 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span>Live Network: {nodeCount} Nodes</span>
              </div>
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-blue-400" />
                <span>DAG Depth: ∞</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                <span>TPS: 10,000+</span>
              </div>
            </div>
          </div>

          {/* Email Capture */}
          <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-8">
            <Input
              type="email"
              placeholder="developer@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
            >
              {isSubmitting ? 'Joining...' : 'Join the DAG Revolution'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="text-sm text-gray-400">
            🚀 <strong>Early Access:</strong> Be among the first to build on HyperDAG infrastructure
          </p>
        </div>
      </div>

      {/* Technical Credibility */}
      <div className="bg-white/5 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-400">100,000+</div>
              <div className="text-gray-400">Transactions/sec</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cyan-400">∞</div>
              <div className="text-gray-400">Scalability</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400">0.001ms</div>
              <div className="text-gray-400">Confirmation</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400">99.99%</div>
              <div className="text-gray-400">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Features */}
      <div className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">
            Built for <span className="text-blue-400">Developers</span>, <span className="text-cyan-400">By Developers</span>
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <GitBranch className="h-12 w-12 text-blue-400 mb-4" />
                <CardTitle>DAG Architecture</CardTitle>
                <CardDescription className="text-gray-400">
                  True parallel processing with directed acyclic graphs eliminating blockchain bottlenecks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-blue-500/10 p-3 rounded border-l-2 border-blue-500">
                    <code className="text-blue-300 text-sm">
                      dag.addNode("ai-task").connect("validator")
                    </code>
                  </div>
                  <div className="text-sm text-gray-400">
                    ✓ No mining required<br/>
                    ✓ Infinite scalability<br/>
                    ✓ Sub-millisecond finality
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <Cpu className="h-12 w-12 text-cyan-400 mb-4" />
                <CardTitle>AI Orchestration</CardTitle>
                <CardDescription className="text-gray-400">
                  Advanced ANFIS routing with natural mathematics for optimal AI provider selection
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-cyan-500/10 p-3 rounded border-l-2 border-cyan-500">
                    <code className="text-cyan-300 text-sm">
                      anfis.route(task, providers, φ_optimization)
                    </code>
                  </div>
                  <div className="text-sm text-gray-400">
                    ✓ Golden ratio timing<br/>
                    ✓ Cost optimization<br/>
                    ✓ Quality assurance
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <Github className="h-12 w-12 text-green-400 mb-4" />
                <CardTitle>Open Source</CardTitle>
                <CardDescription className="text-gray-400">
                  Community-driven development with enterprise-grade support and documentation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="bg-green-500/10 p-3 rounded border-l-2 border-green-500">
                    <code className="text-green-300 text-sm">
                      npm install @hyperdag/core
                    </code>
                  </div>
                  <div className="text-sm text-gray-400">
                    ✓ MIT License<br/>
                    ✓ 24/7 Community<br/>
                    ✓ Enterprise Support
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Interactive DAG Demo */}
      <div className="bg-slate-800/30 py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-8">See HyperDAG in Action</h2>
          <p className="text-xl text-gray-300 mb-12">
            Interactive visualization of our distributed AI computation network
          </p>
          
          <div className="bg-black/50 rounded-lg p-8 border border-blue-500/20">
            <div className="grid grid-cols-3 md:grid-cols-5 gap-4 mb-6">
              {Array.from({ length: 15 }, (_, i) => (
                <div 
                  key={i}
                  className={`
                    w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs
                    ${i % 3 === 0 ? 'bg-blue-500 border-blue-400' : 
                      i % 3 === 1 ? 'bg-cyan-500 border-cyan-400' : 
                      'bg-green-500 border-green-400'}
                    ${Math.random() > 0.7 ? 'animate-pulse' : ''}
                  `}
                >
                  {i + 1}
                </div>
              ))}
            </div>
            <div className="text-sm text-gray-400">
              Live DAG nodes processing AI tasks • Real-time consensus • Zero congestion
            </div>
          </div>
        </div>
      </div>

      {/* Developer CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Build the Future?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Join thousands of developers building on HyperDAG infrastructure
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <form onSubmit={handleEmailSubmit} className="flex gap-4">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white border-0 text-gray-900 w-80"
              />
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-white text-blue-600 hover:bg-gray-100"
              >
                <Code className="mr-2 h-4 w-4" />
                Get API Access
              </Button>
            </form>
            
            <Button variant="outline" className="border-white text-white hover:bg-white/10">
              <Github className="mr-2 h-4 w-4" />
              View on GitHub
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-black py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-400">
            © 2025 HyperDAG.org - Distributed AI Computation Network
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Open Source • Community Driven • Enterprise Ready
          </p>
        </div>
      </div>
    </div>
  );
}