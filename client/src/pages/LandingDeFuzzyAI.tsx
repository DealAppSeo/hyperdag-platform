import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, Zap, Shield, TrendingUp, Users, CheckCircle, Mail } from 'lucide-react';

export default function LandingDeFuzzyAI() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [variation, setVariation] = useState('A'); // A/B/C testing
  const { toast } = useToast();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await fetch('/api/newsletter/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          source: 'deFuzzyAI-landing',
          variation,
          incentive: '82% Cost Reduction Secrets'
        })
      });

      toast({
        title: "Success! Check your email",
        description: "Your free guide to 82% AI cost reduction is on the way!",
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

  const headlines = {
    A: "Making AI Crystal Clear - No More Fuzzy Logic",
    B: "82% Cost Reduction Through Mathematical AI Optimization", 
    C: "Real Intelligence Through Natural Mathematics"
  };

  const subheads = {
    A: "Transform your AI workflows with patent-pending clarity technology that eliminates confusion and maximizes results",
    B: "Join 500+ developers using our golden ratio algorithms to slash AI costs while improving performance",
    C: "Experience the future of AI optimization where natural mathematics meets machine intelligence"
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-black text-white">
      {/* Hero Section */}
      <div className="container mx-auto px-6 pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          <Badge className="mb-6 bg-purple-500/20 text-purple-300 border-purple-500/30">
            Patent-Pending Technology
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
            {headlines[variation]}
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            {subheads[variation]}
          </p>

          {/* Email Capture */}
          <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto mb-8">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {isSubmitting ? 'Sending...' : 'Get Free Guide'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <p className="text-sm text-gray-400">
            🎁 <strong>Free Guide:</strong> "82% Cost Reduction Secrets" - Instantly delivered to your inbox
          </p>
        </div>
      </div>

      {/* Social Proof */}
      <div className="bg-white/5 py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-purple-400">500+</div>
              <div className="text-gray-400">Developers</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-400">82%</div>
              <div className="text-gray-400">Cost Reduction</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-cyan-400">1.618x</div>
              <div className="text-gray-400">Performance Boost</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400">24/7</div>
              <div className="text-gray-400">Autonomous</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-16">
            Why Choose <span className="text-purple-400">deFuzzyAI</span>?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <Zap className="h-12 w-12 text-purple-400 mb-4" />
                <CardTitle>Instant Clarity</CardTitle>
                <CardDescription className="text-gray-400">
                  Transform complex AI outputs into crystal-clear insights using natural mathematics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-gray-300">Golden ratio optimization</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-gray-300">Fibonacci routing patterns</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-gray-300">ANFIS fuzzy logic</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-blue-400 mb-4" />
                <CardTitle>Massive Savings</CardTitle>
                <CardDescription className="text-gray-400">
                  Reduce AI costs by up to 82% while improving performance and reliability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-gray-300">Intelligent provider routing</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-gray-300">Free tier maximization</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-gray-300">Cost prediction analytics</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <Shield className="h-12 w-12 text-cyan-400 mb-4" />
                <CardTitle>Enterprise Ready</CardTitle>
                <CardDescription className="text-gray-400">
                  Battle-tested infrastructure with security, compliance, and scalability built-in
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-gray-300">Zero-knowledge proofs</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-gray-300">SOC 2 compliance</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-gray-300">24/7 monitoring</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Revolutionize Your AI?</h2>
          <p className="text-xl mb-8 text-purple-100">
            Join the mathematical AI revolution and start saving immediately
          </p>
          
          <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white border-0 text-gray-900"
            />
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-white text-purple-600 hover:bg-gray-100"
            >
              <Mail className="mr-2 h-4 w-4" />
              Get Started Free
            </Button>
          </form>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-black py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-gray-400">
            © 2025 deFuzzyAI - Patent-Pending Natural Mathematics AI Technology
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Part of the Trinity Symphony Network | HyperDAG Ecosystem
          </p>
        </div>
      </div>

      {/* A/B Testing Controls (Dev Only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 p-4 rounded border">
          <div className="text-sm text-white mb-2">A/B Test Variation:</div>
          <div className="flex gap-2">
            {['A', 'B', 'C'].map((v) => (
              <Button
                key={v}
                size="sm"
                variant={variation === v ? "default" : "outline"}
                onClick={() => setVariation(v)}
              >
                {v}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}