import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle, DollarSign, Users, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function SimpleLanding() {
  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    
    // Redirect to early access with the email
    window.location.href = `/early-access?email=${encodeURIComponent(email)}`;
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-xl font-bold text-gray-900">HyperDAG</div>
          <div className="flex items-center space-x-4">
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900">How it works</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900">Pricing</a>
            <Button size="sm" asChild>
              <a href="/early-access">Get Started</a>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6 text-center bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Social Proof Badge */}
            <div className="inline-flex items-center space-x-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Users className="w-4 h-4" />
              <span>Join 2,847+ developers saving thousands monthly</span>
            </div>

            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Cut Your AI Costs by 79%
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Stop overpaying for AI APIs. Our smart routing automatically finds the cheapest providers 
              while maintaining quality. Save $2,400+ per month.
            </p>

            {/* Email Capture */}
            <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8 max-w-md mx-auto">
              <Input
                type="email"
                name="email"
                placeholder="Enter your email"
                required
                className="flex-1 text-lg py-3"
              />
              <Button type="submit" size="lg" className="flex items-center space-x-2">
                <span>Get Free Credits</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <p className="text-sm text-gray-500">
              Free setup • $2,400 in credits • Cancel anytime
            </p>
          </motion.div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Trusted by developers at top companies
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">$11,247</div>
              <div className="text-gray-600">Saved last month</div>
              <div className="text-sm text-gray-500 mt-2">"Cut our AI bills by 84%" - TechCorp</div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">2.3x</div>
              <div className="text-gray-600">Faster responses</div>
              <div className="text-sm text-gray-500 mt-2">"Better performance at lower cost" - StartupAI</div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">79%</div>
              <div className="text-gray-600">Average savings</div>
              <div className="text-sm text-gray-500 mt-2">"ROI in first week" - DevTeam</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600">
              Three simple steps to start saving thousands
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Connect Your Apps</h3>
              <p className="text-gray-600">
                Simply replace your AI API endpoints. Takes 2 minutes with our one-line integration.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">We Find Best Prices</h3>
              <p className="text-gray-600">
                Our AI automatically routes requests to the cheapest providers while maintaining quality.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-4">Watch Savings Grow</h3>
              <p className="text-gray-600">
                Get detailed analytics showing exactly how much you're saving each month.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            We only make money when you save money
          </p>

          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-gray-900 mb-2">Free</div>
              <div className="text-gray-600">To get started</div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>$2,400 in free credits</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Automatic cost optimization</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Real-time savings dashboard</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>24/7 support</span>
              </div>
            </div>

            <Button size="lg" className="w-full" asChild>
              <a href="/early-access">Get Started Free</a>
            </Button>

            <p className="text-sm text-gray-500 mt-4">
              Then pay only 10% of savings. If you don't save money, you don't pay.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-200">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="text-gray-600">
            © 2025 HyperDAG. All rights reserved.
          </div>
          <div className="flex items-center space-x-6">
            <a href="/privacy" className="text-gray-600 hover:text-gray-900">Privacy</a>
            <a href="/terms" className="text-gray-600 hover:text-gray-900">Terms</a>
            <a href="/contact" className="text-gray-600 hover:text-gray-900">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}