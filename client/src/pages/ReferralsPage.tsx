import React from 'react';
import { motion } from 'framer-motion';
import { ReferralSystem } from '@/components/referral/ReferralSystem';
import { ReferralLeaderboard } from '@/components/referral/ReferralLeaderboard';
import { ArrowLeft, Gift, Users, TrendingUp } from 'lucide-react';

export default function ReferralsPage() {
  // Mock user ID - in real app this would come from auth context
  const userId = 'user123';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <a 
                href="/"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to HyperDAG</span>
              </a>
              
              <div className="h-6 w-px bg-gray-300"></div>
              
              <h1 className="text-2xl font-bold text-gray-900">Referral Program</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-2 rounded-full text-sm font-medium text-purple-700 mb-6">
              <Gift className="w-4 h-4" />
              Earn $50 per referral
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Share HyperDAG, Earn Rewards
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Help your friends save 79% on AI costs while earning $50 for each signup. 
              Plus they get $2,400 in free credits to get started.
            </p>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <Gift className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">$50</div>
                <div className="text-sm text-gray-600">Per successful referral</div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">$2,400</div>
                <div className="text-sm text-gray-600">Credits for your friends</div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">79%</div>
                <div className="text-sm text-gray-600">Average cost savings</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="pb-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Referral System */}
            <div className="lg:col-span-2">
              <ReferralSystem userId={userId} />
            </div>
            
            {/* Leaderboard */}
            <div className="lg:col-span-1">
              <ReferralLeaderboard />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Share Your Link</h3>
              <p className="text-gray-600">
                Copy your unique referral link and share it with friends who need AI development tools.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">They Sign Up</h3>
              <p className="text-gray-600">
                Your friends join HyperDAG using your link and immediately receive $2,400 in credits.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-white text-2xl font-bold">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">You Get Paid</h3>
              <p className="text-gray-600">
                Earn $50 for each successful signup, plus RepID points and unlock higher reward levels.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            {[
              {
                question: "When do I get paid?",
                answer: "You earn $50 credits immediately when someone signs up using your referral link and completes their first project setup."
              },
              {
                question: "Is there a limit to how much I can earn?",
                answer: "No limit! Top referrers earn thousands monthly. Our Legend tier members get revenue sharing on top of the $50 per referral."
              },
              {
                question: "What if my friend doesn't use HyperDAG actively?",
                answer: "You still earn the $50 referral bonus. However, for higher tier rewards, we track active usage to ensure quality referrals."
              },
              {
                question: "Can I refer businesses and teams?",
                answer: "Absolutely! Business referrals often result in higher usage and may qualify for additional bonus rewards through our partnership program."
              }
            ].map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-lg p-6 shadow-sm"
              >
                <h3 className="font-semibold text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}