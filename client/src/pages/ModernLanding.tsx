import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Sparkles, BarChart3, Zap, Star, Shield, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

function ModernLanding() {
  const [email, setEmail] = useState('');

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    window.location.href = `/early-access?email=${encodeURIComponent(email)}`;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0a0a0a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold">HyperDAG</span>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-400 hover:text-white transition-colors">Features</a>
            <a href="#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a>
            <a href="#testimonials" className="text-gray-400 hover:text-white transition-colors">Reviews</a>
          </nav>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
              Sign in
            </Button>
            <Button size="sm" className="bg-white text-black hover:bg-gray-100">
              Get started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm mb-8">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-300">2,847 developers already saving</span>
            </div>

            {/* Main headline */}
            <h1 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
              Cut your AI costs by{' '}
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-600 bg-clip-text text-transparent">
                79%
              </span>
            </h1>

            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Automatically route your AI requests to the cheapest providers while maintaining quality. 
              Save thousands every month with intelligent cost optimization.
            </p>

            {/* Email capture */}
            <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 max-w-md mx-auto">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your work email"
                required
                className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-blue-500 h-12"
              />
              <Button type="submit" size="lg" className="bg-white text-black hover:bg-gray-100 h-12 px-8">
                Start saving
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>

            <p className="text-sm text-gray-500">
              $2,400 in free credits • No credit card required • 2-minute setup
            </p>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-6 border-y border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-gray-400 text-sm uppercase tracking-wider mb-8">Trusted by developers at</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-60">
              {['OpenAI', 'Anthropic', 'Meta', 'Google'].map((company) => (
                <div key={company} className="text-xl font-semibold text-gray-500">
                  {company}
                </div>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center bg-white/5 rounded-2xl p-8 border border-white/10">
              <div className="text-4xl font-bold text-green-400 mb-2">$11,247</div>
              <div className="text-gray-400 mb-2">Average monthly savings</div>
              <div className="text-sm text-gray-500">"Cut our AI costs by 84%" - TechCorp CTO</div>
            </div>
            
            <div className="text-center bg-white/5 rounded-2xl p-8 border border-white/10">
              <div className="text-4xl font-bold text-blue-400 mb-2">2.3x</div>
              <div className="text-gray-400 mb-2">Faster API responses</div>
              <div className="text-sm text-gray-500">"Better performance, lower cost" - DevTeam</div>
            </div>
            
            <div className="text-center bg-white/5 rounded-2xl p-8 border border-white/10">
              <div className="text-4xl font-bold text-purple-400 mb-2">79%</div>
              <div className="text-gray-400 mb-2">Average cost reduction</div>
              <div className="text-sm text-gray-500">"ROI within first week" - Startup AI</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              Everything you need to optimize AI costs
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Intelligent routing, real-time monitoring, and automatic optimization to maximize your savings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Smart Routing</h3>
              <p className="text-gray-400 leading-relaxed">
                Automatically routes requests to the cheapest available provider while maintaining response quality and speed.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Real-time Analytics</h3>
              <p className="text-gray-400 leading-relaxed">
                Monitor your AI spending, track savings, and get detailed insights into your usage patterns and cost optimization.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Enterprise Security</h3>
              <p className="text-gray-400 leading-relaxed">
                Bank-level encryption, SOC 2 compliance, and zero-trust architecture to keep your data and API keys secure.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-white/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-xl text-gray-400 mb-16">
            Pay only when you save. If we don't reduce your costs, you don't pay anything.
          </p>

          <div className="bg-white/10 rounded-3xl p-8 border border-white/20 max-w-lg mx-auto">
            <div className="text-center mb-8">
              <div className="text-5xl font-bold mb-2">10%</div>
              <div className="text-gray-400 mb-4">of your monthly savings</div>
              <div className="text-sm text-gray-500">No savings = $0 cost</div>
            </div>

            <div className="space-y-4 mb-8 text-left">
              {[
                'Unlimited AI requests',
                '$2,400 in free credits',
                'Real-time cost optimization',
                'Advanced analytics dashboard',
                '24/7 priority support',
                'Enterprise security'
              ].map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>

            <Button size="lg" className="w-full bg-white text-black hover:bg-gray-100">
              Start saving today
            </Button>

            <p className="text-xs text-gray-500 mt-4">
              Cancel anytime • No setup fees • 30-day money-back guarantee
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">
              What developers are saying
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                quote: "HyperDAG cut our AI costs from $8,000 to $1,200 per month. The ROI was immediate.",
                author: "Sarah Kim",
                role: "CTO at TechCorp",
                rating: 5
              },
              {
                quote: "Setup took 5 minutes. Now we save $3,000+ monthly without any quality loss.",
                author: "Mike Chen",
                role: "Lead Developer at StartupAI",
                rating: 5
              },
              {
                quote: "The analytics alone are worth it. We can see exactly where every dollar goes.",
                author: "Alex Rodriguez",
                role: "Engineering Manager at DevTeam",
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/5 rounded-2xl p-6 border border-white/10"
              >
                <div className="flex space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4 leading-relaxed">"{testimonial.quote}"</p>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-gray-400">{testimonial.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-6">
            Ready to cut your AI costs?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join 2,847+ developers saving thousands every month
          </p>
          
          <Button size="lg" className="bg-white text-black hover:bg-gray-100 text-lg px-8 py-4">
            Get started free
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          
          <p className="text-sm text-gray-500 mt-4">
            No credit card required • Setup in 2 minutes
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">HyperDAG</span>
            </div>
            
            <div className="flex items-center space-x-8 text-sm text-gray-400">
              <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-white transition-colors">Terms</a>
              <a href="/contact" className="hover:text-white transition-colors">Contact</a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-white/10 text-center text-sm text-gray-500">
            © 2025 HyperDAG. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ModernLanding;