import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Terminal, 
  Server, 
  Shield, 
  Brain, 
  Network, 
  Database,
  ArrowRight,
  Github,
  BookOpen,
  Cpu,
  Activity,
  Code,
  Lock,
  Zap,
  Cloud,
  Key,
  Globe
} from 'lucide-react';
import { EmailCapturePopup, useEmailCapturePopup } from '@/components/conversion/EmailCapturePopup';
import { LiveActivityWidget } from '@/components/conversion/LiveActivityWidget';
import { FixedCTABar } from '@/components/conversion/FixedCTABar';
import { ReferralFloatingButton } from '@/components/referral/ReferralFloatingButton';

export default function DeveloperLanding() {
  const [apiStatus, setApiStatus] = useState('checking');
  const { showPopup, closePopup } = useEmailCapturePopup();

  useEffect(() => {
    // Check API health
    fetch('/api/health')
      .then(() => setApiStatus('online'))
      .catch(() => setApiStatus('offline'));
  }, []);

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono">
      {/* Navigation */}
      <nav className="border-b border-green-800/30 bg-black/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-500/20 border border-green-500 rounded flex items-center justify-center">
                <Terminal className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-xl font-bold text-green-400">HyperDAG</span>
              <span className="text-sm text-green-600 bg-green-900/20 border border-green-700/30 px-2 py-1 rounded">
                ~/infrastructure
              </span>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  apiStatus === 'online' ? 'bg-green-400 animate-pulse' : 
                  apiStatus === 'offline' ? 'bg-red-400' : 'bg-yellow-400'
                }`} />
                <span className="text-sm text-green-600">
                  [{apiStatus === 'checking' ? 'INIT' : apiStatus.toUpperCase()}]
                </span>
              </div>
              
              <a href="/docs" className="text-green-600 hover:text-green-400 transition-colors border-b border-green-800 hover:border-green-600">
                docs/
              </a>
              <a href="/status" className="text-green-600 hover:text-green-400 transition-colors border-b border-green-800 hover:border-green-600">
                status/
              </a>
              <motion.a
                href="/early-access"
                whileHover={{ scale: 1.02 }}
                className="bg-green-500/10 border border-green-500 text-green-400 px-4 py-2 rounded font-semibold hover:bg-green-500/20 transition-colors"
              >
                ./init --access
              </motion.a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Conversion Optimized */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Social Proof Banner */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center space-x-4 bg-green-500/10 border border-green-500/30 rounded-full px-6 py-2 text-sm">
              <div className="flex items-center space-x-2">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-green-400 rounded-full border-2 border-black"></div>
                  <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full border-2 border-black"></div>
                  <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-yellow-400 rounded-full border-2 border-black"></div>
                </div>
                <span className="text-green-400 font-semibold">2,847 developers</span>
              </div>
              <span className="text-green-600">already saving 79% on AI costs</span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Cut Your AI Costs by 79%
            </h1>
            <h2 className="text-2xl md:text-3xl text-green-300 mb-8 font-light">
              While Building the Future of Web3 + AI
            </h2>
            <p className="text-xl text-green-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Join thousands of developers using HyperDAG's AI-optimized infrastructure to build purpose-driven applications that actually matter—and save massive money doing it.
            </p>

            {/* Urgency Element */}
            <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-4 mb-8 max-w-2xl mx-auto">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-orange-400 rounded-full animate-pulse"></div>
                <span className="text-orange-300 font-semibold">LIMITED BETA ACCESS</span>
              </div>
              <p className="text-orange-200 text-sm">
                Only 500 spots remaining for free early access. Join before costs go up 400% at public launch.
              </p>
            </div>

            {/* Primary CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12">
              <motion.a
                href="/early-access"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-green-500 to-blue-600 text-white px-8 py-4 rounded-xl text-xl font-bold hover:from-green-600 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-green-500/25 flex items-center space-x-3"
              >
                <Zap className="w-6 h-6" />
                <span>Get Free Access + $2,400 Credits</span>
              </motion.a>
              
              <motion.a
                href="#demo"
                whileHover={{ scale: 1.02 }}
                className="border-2 border-green-500 text-green-400 px-8 py-4 rounded-xl text-xl font-semibold hover:bg-green-500/10 transition-colors flex items-center space-x-3"
              >
                <Globe className="w-6 h-6" />
                <span>See 2-Minute Demo</span>
              </motion.a>
            </div>

            {/* Social Proof Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400 mb-1">$2.4M+</div>
                <div className="text-sm text-green-600">Monthly AI Cost Savings</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-1">2,847</div>
                <div className="text-sm text-green-600">Active Developers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-1">99.9%</div>
                <div className="text-sm text-green-600">Uptime SLA</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-1">&lt;50ms</div>
                <div className="text-sm text-green-600">Response Time</div>
              </div>
            </div>
          </motion.div>

          {/* Technical Terminal for Credibility */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="bg-black border border-green-500/30 rounded-lg p-6 max-w-4xl mx-auto"
          >
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-green-600 text-sm ml-4">hyperdag@production:~$</span>
            </div>
            
            <div className="space-y-2 text-left font-mono text-sm">
              <div className="text-green-400">
                <span className="text-green-600">$</span> hyperdag optimize --ai-costs --show-savings
              </div>
              <div className="text-green-300 ml-4">
                <div className="mb-2">🚀 AI Cost Optimization Results:</div>
                <div className="space-y-1 text-xs">
                  <div>✅ OpenAI API: $8,400/mo → $1,680/mo (-80% via intelligent routing)</div>
                  <div>✅ Anthropic: $3,200/mo → $640/mo (-80% via load balancing)</div>
                  <div>✅ Infrastructure: $2,100/mo → $420/mo (-80% via ANFIS optimization)</div>
                  <div className="pt-2 text-green-400 font-bold">💰 Total Monthly Savings: $11,060 → $2,740 (75.2% reduction)</div>
                </div>
              </div>
              <div className="text-green-400 mt-4">
                <span className="text-green-600">$</span> echo "Start saving in under 5 minutes"
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Architecture Overview */}
      <section className="py-16 px-6 bg-black/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-green-400 mb-4">
              $ ls -la /hyperdag/modules/
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: <Brain className="w-6 h-6" />,
                module: "anfis-ai",
                description: "Adaptive Neuro-Fuzzy Inference Systems for intelligent resource routing",
                status: "RUNNING",
                port: "8001"
              },
              {
                icon: <Shield className="w-6 h-6" />,
                module: "auth-4fa",
                description: "Four-factor authentication with zero-knowledge proof circuits",
                status: "RUNNING",
                port: "8002"
              },
              {
                icon: <Database className="w-6 h-6" />,
                module: "purpose-engine",
                description: "AI-powered user intention analysis and behavioral pattern recognition",
                status: "BETA",
                port: "8003"
              },
              {
                icon: <Network className="w-6 h-6" />,
                module: "multichain-bridge",
                description: "Unified interface for Ethereum, Polygon, Solana, and Layer 2 solutions",
                status: "RUNNING",
                port: "8004"
              },
              {
                icon: <Code className="w-6 h-6" />,
                module: "voice-proc",
                description: "Real-time voice analysis for biometric authentication and sentiment extraction",
                status: "PREVIEW",
                port: "8005"
              },
              {
                icon: <Cpu className="w-6 h-6" />,
                module: "dao-governance",
                description: "Purpose-weighted governance with Sybil resistance and quadratic voting",
                status: "DEV",
                port: "8006"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-black border border-green-600/30 rounded p-4 hover:border-green-500 transition-colors font-mono"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="text-green-400">{feature.icon}</div>
                    <span className="text-green-400 font-semibold">{feature.module}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 border rounded ${
                    feature.status === 'RUNNING' ? 'border-green-500 text-green-400' :
                    feature.status === 'BETA' ? 'border-yellow-500 text-yellow-400' :
                    feature.status === 'PREVIEW' ? 'border-orange-500 text-orange-400' :
                    'border-gray-500 text-gray-400'
                  }`}>
                    {feature.status}
                  </span>
                </div>
                
                <div className="text-sm text-green-300 mb-2">
                  PORT: {feature.port}
                </div>
                
                <p className="text-green-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
                
                <div className="mt-3 text-xs text-green-700">
                  drwxr-xr-x 1 hyperdag hyperdag 4096 Jan 1 2025
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* API Documentation Terminal */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-green-400 mb-4">
              $ curl -X POST https://api.hyperdag.org/
            </h2>
            <p className="text-green-600">
              Enterprise APIs built for production infrastructure
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="bg-black border border-green-600/30 rounded p-6 font-mono">
              <div className="text-green-400 mb-4 text-lg font-bold">
                /api/web3-ai/purpose-discovery
              </div>
              <div className="space-y-3 text-green-300 text-sm">
                <div>→ AI-powered user intention analysis</div>
                <div>→ Voice-to-purpose neural conversion</div>
                <div>→ Behavioral pattern recognition</div>
                <div>→ Cross-platform identity synchronization</div>
                <div>→ Real-time confidence scoring</div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-green-800">
                <div className="text-green-600 text-sm">ENTERPRISE FEATURES:</div>
                <div className="text-green-700 text-xs space-y-1 mt-2">
                  <div>• 99.9% SLA uptime guarantee</div>
                  <div>• Sub-50ms response times</div>
                  <div>• Horizontal autoscaling</div>
                  <div>• SOC2 Type II compliance</div>
                </div>
              </div>
              
              <div className="mt-6">
                <a 
                  href="/early-access"
                  className="inline-flex items-center space-x-2 text-green-400 hover:text-green-300 font-semibold border-b border-green-600 hover:border-green-400"
                >
                  <Terminal className="w-4 h-4" />
                  <span>REQUEST_ACCESS_TOKEN</span>
                </a>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-black border border-green-600/30 rounded p-4 font-mono">
                <div className="text-green-600 text-sm mb-3">REQUEST EXAMPLE:</div>
                <pre className="text-green-400 text-xs overflow-x-auto">
{`curl -X POST https://api.hyperdag.org/web3-ai/purpose-discovery \\
  -H "Authorization: Bearer hdag_live_xxx" \\
  -H "Content-Type: application/json" \\
  -d '{
    "voice_data": "base64_encoded_audio",
    "context": {
      "interests": ["web3", "social_impact"],
      "experience_level": "senior_developer",
      "previous_purposes": []
    },
    "options": {
      "confidence_threshold": 0.85,
      "return_alternatives": true
    }
  }'`}
                </pre>
              </div>
              
              <div className="bg-black border border-green-600/30 rounded p-4 font-mono">
                <div className="text-green-600 text-sm mb-3">RESPONSE:</div>
                <pre className="text-green-300 text-xs overflow-x-auto">
{`{
  "status": "success",
  "execution_time_ms": 47,
  "data": {
    "purpose_score": 0.943,
    "primary_purpose": "DeFi_Education_Platform",
    "confidence": "very_high",
    "neural_pathways": [
      "voice_sentiment_analysis",
      "technical_expertise_mapping", 
      "social_impact_clustering"
    ],
    "recommendations": {
      "immediate": ["solidity_tutorial_platform"],
      "medium_term": ["defi_literacy_dapp"],
      "long_term": ["cross_chain_education_protocol"]
    },
    "team_matching": {
      "compatible_developers": 23,
      "recommended_collaborations": 7
    }
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Infrastructure Stats */}
      <section className="py-20 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Battle-Tested Infrastructure
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { label: "API Uptime", value: "99.9%", icon: <Activity className="w-6 h-6" /> },
              { label: "Response Time", value: "<50ms", icon: <Zap className="w-6 h-6" /> },
              { label: "Chains Supported", value: "12+", icon: <Network className="w-6 h-6" /> },
              { label: "Enterprise Security", value: "SOC2", icon: <Shield className="w-6 h-6" /> }
            ].map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="text-center bg-slate-800/30 rounded-xl p-6 border border-slate-700"
              >
                <div className="flex justify-center text-blue-400 mb-4">{stat.icon}</div>
                <div className="text-3xl font-bold mb-2">{stat.value}</div>
                <div className="text-gray-400">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Build the Future?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join the developers building purpose-driven Web3 applications with HyperDAG infrastructure.
          </p>
          
          <motion.a
            href="/early-access"
            whileHover={{ scale: 1.05 }}
            className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-500 to-purple-600 px-10 py-5 rounded-xl text-xl font-semibold"
          >
            <span>Request Early Access</span>
            <ArrowRight className="w-6 h-6" />
          </motion.a>
          
          <p className="text-sm text-gray-500 mt-4">
            Invite-only access. Review process typically takes 24-48 hours.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-green-800/30 py-12 px-6 bg-black font-mono">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-500/20 border border-green-500 rounded">
                <Terminal className="w-full h-full p-1 text-green-400" />
              </div>
              <span className="font-semibold text-green-400">HyperDAG</span>
              <span className="text-green-600">Infrastructure</span>
            </div>
            
            <div className="flex items-center space-x-6 text-green-600">
              <a href="/docs" className="hover:text-green-400 transition-colors border-b border-green-800 hover:border-green-600">docs/</a>
              <a href="/status" className="hover:text-green-400 transition-colors border-b border-green-800 hover:border-green-600">status/</a>
              <a href="/early-access" className="hover:text-green-400 transition-colors border-b border-green-800 hover:border-green-600">access/</a>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-green-800/30 text-left text-green-700">
            <div className="text-green-600">
              <span className="text-green-800">$</span> echo "Copyright 2025 HyperDAG. Enterprise AI-Web3 Infrastructure."
            </div>
            <div className="text-green-700 ml-4 text-sm mt-1">
              Licensed under Enterprise Commercial License. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Conversion Optimization Components */}
      <EmailCapturePopup show={showPopup} onClose={closePopup} />
      <LiveActivityWidget />
      <FixedCTABar />
      <ReferralFloatingButton />
    </div>
  );
}