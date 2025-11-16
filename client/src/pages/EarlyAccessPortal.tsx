import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeft, 
  Send, 
  CheckCircle, 
  AlertCircle,
  Layers,
  Code2,
  Users,
  Briefcase
} from 'lucide-react';

const quickSignupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['developer', 'founder', 'student', 'other'], {
    required_error: 'Please select your role'
  }),
  aiSpending: z.enum(['0-100', '100-1000', '1000-5000', '5000+', 'not-sure'], {
    required_error: 'Please select your AI spending range'
  })
});

type QuickSignupData = z.infer<typeof quickSignupSchema>;

export default function EarlyAccessPortal() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<QuickSignupData>({
    resolver: zodResolver(quickSignupSchema)
  });

  const onSubmit = async (data: QuickSignupData) => {
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      // First, immediately subscribe to newsletter for instant value
      const newsletterResponse = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: data.email,
          source: 'early-access',
          interests: ['ai-optimization', 'cost-savings', 'web3-ai'],
          metadata: { role: data.role, aiSpending: data.aiSpending }
        })
      });

      // Then register for early access
      const accessResponse = await fetch('/api/early-access/quick-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          timestamp: Date.now(),
          priority: data.aiSpending === '5000+' ? 'high' : data.aiSpending === '1000-5000' ? 'medium' : 'normal'
        })
      });

      if (!accessResponse.ok) {
        const errorData = await accessResponse.json();
        throw new Error(errorData.message || 'Signup failed');
      }

      setIsSubmitted(true);
      reset();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-3xl p-8 max-w-md w-full text-center"
        >
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-4">You're In! 🎉</h2>
          <p className="text-gray-400 mb-6 leading-relaxed">
            Welcome to HyperDAG early access! Check your email for:
          </p>
          <div className="text-left bg-slate-700/30 rounded-lg p-4 mb-6">
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Instant AI cost analysis tool (save $2,400+ monthly)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                <span>$2,400 in free API credits (limited time)</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span>VIP Discord access & direct support</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span>Weekly AI optimization insider tips</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <a 
              href="/"
              className="block w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all"
            >
              Return to Platform
            </a>
            <a 
              href="/docs"
              className="block w-full border border-slate-600 text-gray-300 py-3 rounded-lg font-semibold hover:bg-slate-700 transition-colors"
            >
              Explore Documentation
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold">HyperDAG</span>
              <span className="text-sm text-gray-400">Early Access</span>
            </div>
            
            <a 
              href="/"
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Platform</span>
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/20 to-blue-500/20 border border-green-500/30 rounded-full px-4 py-2 text-sm mb-6">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-300 font-semibold">473 spots remaining</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Get Instant Access + $2,400 Credits
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Join 2,847 developers already saving 79% on AI costs. Takes 30 seconds to get started.
          </p>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          {/* Quick signup form */}
          <div>
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit(onSubmit)}
              className="bg-slate-800/30 border border-slate-700 rounded-2xl p-8"
            >
              {submitError && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-300">{submitError}</p>
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3">
                    Email Address *
                  </label>
                  <input
                    {...register('email')}
                    type="email"
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-4 text-lg focus:outline-none focus:border-blue-500"
                    placeholder="your@email.com"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">
                    What's your role? *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'developer', label: '👩‍💻 Developer' },
                      { value: 'founder', label: '🚀 Founder/CEO' },
                      { value: 'student', label: '🎓 Student' },
                      { value: 'other', label: '🔧 Other' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          {...register('role')}
                          type="radio"
                          value={option.value}
                          className="sr-only peer"
                        />
                        <div className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-center peer-checked:border-blue-500 peer-checked:bg-blue-500/10 hover:border-slate-500 transition-colors">
                          {option.label}
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.role && (
                    <p className="text-red-400 text-sm mt-1">{errors.role.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">
                    How much do you spend on AI APIs monthly? *
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: '0-100', label: '$0 - $100', desc: 'Just getting started' },
                      { value: '100-1000', label: '$100 - $1,000', desc: 'Growing usage' },
                      { value: '1000-5000', label: '$1,000 - $5,000', desc: 'Serious volume' },
                      { value: '5000+', label: '$5,000+', desc: 'Enterprise scale' },
                      { value: 'not-sure', label: 'Not sure yet', desc: 'Planning to start' }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                        <input
                          {...register('aiSpending')}
                          type="radio"
                          value={option.value}
                          className="sr-only peer"
                        />
                        <div className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 peer-checked:border-blue-500 peer-checked:bg-blue-500/10 hover:border-slate-500 transition-colors">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-sm text-gray-400">{option.desc}</span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  {errors.aiSpending && (
                    <p className="text-red-400 text-sm mt-1">{errors.aiSpending.message}</p>
                  )}
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-4 rounded-lg text-xl font-semibold hover:from-green-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-3"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        <span>Getting Your Access...</span>
                      </>
                    ) : (
                      <>
                        <span>Get Instant Access + $2,400 Credits</span>
                        <ArrowLeft className="w-6 h-6 rotate-180" />
                      </>
                    )}
                  </button>
                  
                  <p className="text-center text-gray-400 text-sm mt-4">
                    ✅ Instant access ✅ No waiting ✅ Cancel anytime
                  </p>
                </div>
              </div>
            </motion.form>
          </div>
        </div>
      </div>
    </div>
  );
}