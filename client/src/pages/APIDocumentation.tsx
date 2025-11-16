import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Copy, 
  CheckCircle, 
  Code2,
  Layers,
  Database,
  Shield,
  Brain,
  Zap,
  Users,
  Search
} from 'lucide-react';
import { Navigation } from '@/components/Navigation';

export default function APIDocumentation() {
  const [copiedCode, setCopiedCode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('overview');

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const sections = [
    { id: 'overview', title: 'Overview', icon: <Layers className="w-4 h-4" /> },
    { id: 'authentication', title: 'Authentication', icon: <Shield className="w-4 h-4" /> },
    { id: 'purpose-api', title: 'Purpose Discovery', icon: <Brain className="w-4 h-4" /> },
    { id: 'web3-api', title: 'Web3 Services', icon: <Database className="w-4 h-4" /> },
    { id: 'ai-routing', title: 'AI Routing', icon: <Zap className="w-4 h-4" /> },
    { id: 'dao-governance', title: 'DAO Governance', icon: <Users className="w-4 h-4" /> }
  ];

  const CodeBlock = ({ code, language, id }: { code: string, language: string, id: string }) => (
    <div className="relative bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-sm text-gray-400">{language}</span>
        <button
          onClick={() => copyToClipboard(code, id)}
          className="flex items-center space-x-1 text-gray-400 hover:text-white transition-colors"
        >
          {copiedCode === id ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
          <span className="text-xs">{copiedCode === id ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="text-sm text-gray-300">{code}</code>
      </pre>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 text-white">
      <Navigation />
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Code2 className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold">HyperDAG API</span>
              <span className="text-sm text-gray-400">Documentation</span>
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search docs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Navigation */}
              <nav className="space-y-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      selectedSection === section.id
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : 'hover:bg-slate-800/50 text-gray-300'
                    }`}
                  >
                    {section.icon}
                    <span>{section.title}</span>
                  </button>
                ))}
              </nav>

              {/* Quick Links */}
              <div className="mt-8 p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
                <h3 className="font-semibold mb-3">Quick Start</h3>
                <div className="space-y-2 text-sm">
                  <a href="/early-access" className="block text-blue-400 hover:text-blue-300">
                    → Request API Access
                  </a>
                  <a href="/status" className="block text-gray-400 hover:text-white">
                    → System Status
                  </a>
                  <a href="#" className="block text-gray-400 hover:text-white">
                    → Rate Limits
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={selectedSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {selectedSection === 'overview' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-4xl font-bold mb-4">HyperDAG API Documentation</h1>
                    <p className="text-xl text-gray-400 mb-8">
                      Build purpose-driven Web3 applications with AI-optimized infrastructure.
                    </p>
                  </div>

                  <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
                    <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
                    <p className="text-gray-400 mb-6">
                      HyperDAG provides enterprise-grade APIs for AI routing, Web3 services, purpose discovery, and DAO governance. 
                      All endpoints are secured with 4FA and support zero-knowledge proofs.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-700/30 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Base URL</h3>
                        <code className="text-blue-400">https://api.hyperdag.org/v1</code>
                      </div>
                      <div className="bg-slate-700/30 p-4 rounded-lg">
                        <h3 className="font-semibold mb-2">Rate Limit</h3>
                        <code className="text-green-400">1000 requests/hour</code>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      {
                        title: "Purpose Discovery",
                        description: "AI-powered user intention analysis and purpose mapping",
                        endpoint: "/purpose/discover"
                      },
                      {
                        title: "Web3 Services",
                        description: "Multi-chain deployment and smart contract management",
                        endpoint: "/web3/deploy"
                      },
                      {
                        title: "AI Routing",
                        description: "ANFIS-powered intelligent compute resource optimization",
                        endpoint: "/ai/route"
                      }
                    ].map((api, index) => (
                      <div key={index} className="bg-slate-800/30 border border-slate-700 rounded-xl p-6">
                        <h3 className="font-semibold mb-2">{api.title}</h3>
                        <p className="text-gray-400 text-sm mb-4">{api.description}</p>
                        <code className="text-xs text-blue-400 bg-slate-900 px-2 py-1 rounded">
                          {api.endpoint}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedSection === 'authentication' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-3xl font-bold mb-4">Authentication</h1>
                    <p className="text-gray-400 mb-8">
                      HyperDAG uses API keys with optional 4FA verification for enhanced security.
                    </p>
                  </div>

                  <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
                    <h2 className="text-xl font-semibold mb-4">API Key Authentication</h2>
                    <p className="text-gray-400 mb-6">
                      Include your API key in the Authorization header for all requests.
                    </p>

                    <CodeBlock
                      id="auth-header"
                      language="HTTP"
                      code={`GET /api/v1/purpose/discover
Authorization: Bearer your_api_key_here
Content-Type: application/json`}
                    />
                  </div>

                  <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
                    <h2 className="text-xl font-semibold mb-4">4FA Enhanced Security</h2>
                    <p className="text-gray-400 mb-6">
                      For sensitive operations, HyperDAG supports four-factor authentication.
                    </p>

                    <CodeBlock
                      id="4fa-request"
                      language="JSON"
                      code={`{
  "operation": "deploy_smart_contract",
  "auth_factors": {
    "api_key": "your_api_key",
    "totp_code": "123456",
    "biometric_hash": "sha256_hash",
    "proof_of_life": "zkp_verification"
  },
  "payload": {
    "contract_code": "0x...",
    "network": "polygon"
  }
}`}
                    />
                  </div>
                </div>
              )}

              {selectedSection === 'purpose-api' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-3xl font-bold mb-4">Purpose Discovery API</h1>
                    <p className="text-gray-400 mb-8">
                      AI-powered analysis to discover user intentions and map them to actionable purposes.
                    </p>
                  </div>

                  <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
                    <h2 className="text-xl font-semibold mb-4">Discover Purpose</h2>
                    <p className="text-gray-400 mb-6">
                      Analyze user input (text, voice, or behavioral data) to determine primary purpose.
                    </p>

                    <div className="mb-6">
                      <h3 className="font-semibold mb-2">Endpoint</h3>
                      <code className="bg-slate-900 px-3 py-1 rounded">POST /api/v1/purpose/discover</code>
                    </div>

                    <h3 className="font-semibold mb-3">Request Example</h3>
                    <CodeBlock
                      id="purpose-request"
                      language="JSON"
                      code={`{
  "input_data": {
    "text": "I want to help solve climate change through technology",
    "voice_data": "base64_encoded_audio", // optional
    "context": {
      "age_range": "25-35",
      "skills": ["programming", "data analysis"],
      "interests": ["environment", "technology"]
    }
  },
  "analysis_type": "comprehensive", // or "quick"
  "include_recommendations": true
}`}
                    />

                    <h3 className="font-semibold mb-3 mt-6">Response Example</h3>
                    <CodeBlock
                      id="purpose-response"
                      language="JSON"
                      code={`{
  "purpose_analysis": {
    "primary_purpose": "Environmental Technology Innovation",
    "confidence_score": 0.94,
    "purpose_categories": [
      "environmental_impact",
      "technology_development", 
      "social_change"
    ],
    "sentiment_analysis": {
      "passion_level": 0.89,
      "commitment_indicators": ["long_term_thinking", "solution_oriented"]
    }
  },
  "recommendations": {
    "project_ideas": [
      "Carbon tracking DApp",
      "Renewable energy marketplace",
      "Environmental data analytics platform"
    ],
    "skill_development": ["blockchain", "IoT", "machine_learning"],
    "potential_collaborators": [
      {
        "purpose_match": 0.87,
        "complementary_skills": ["climate_science", "policy"]
      }
    ]
  },
  "next_actions": [
    "Join climate tech community",
    "Explore carbon credit protocols",
    "Build MVP prototype"
  ]
}`}
                    />
                  </div>
                </div>
              )}

              {selectedSection === 'web3-api' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-3xl font-bold mb-4">Web3 Services API</h1>
                    <p className="text-gray-400 mb-8">
                      Multi-chain deployment, smart contract management, and blockchain analytics.
                    </p>
                  </div>

                  <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
                    <h2 className="text-xl font-semibold mb-4">Smart Contract Deployment</h2>
                    
                    <CodeBlock
                      id="deploy-contract"
                      language="JSON"
                      code={`{
  "contract": {
    "source_code": "pragma solidity ^0.8.0;...",
    "constructor_args": ["arg1", "arg2"],
    "optimization": true
  },
  "deployment": {
    "networks": ["polygon", "ethereum", "arbitrum"],
    "gas_strategy": "optimal", // "fast", "standard", "optimal"
    "verify_source": true
  },
  "purpose_integration": {
    "purpose_tag": "climate_action",
    "impact_tracking": true,
    "governance_model": "quadratic_voting"
  }
}`}
                    />
                  </div>

                  <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
                    <h2 className="text-xl font-semibold mb-4">Multi-Chain Analytics</h2>
                    
                    <CodeBlock
                      id="analytics-query"
                      language="JSON"
                      code={`{
  "query": {
    "contract_address": "0x...",
    "networks": ["polygon", "ethereum"],
    "metrics": [
      "transaction_volume",
      "user_adoption",
      "purpose_impact_score"
    ],
    "time_range": {
      "start": "2024-01-01",
      "end": "2024-12-31"
    }
  }
}`}
                    />
                  </div>
                </div>
              )}

              {selectedSection === 'ai-routing' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-3xl font-bold mb-4">ANFIS AI Routing</h1>
                    <p className="text-gray-400 mb-8">
                      Adaptive Neuro-Fuzzy Inference System for intelligent compute resource optimization.
                    </p>
                  </div>

                  <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
                    <h2 className="text-xl font-semibold mb-4">Intelligent Query Routing</h2>
                    <p className="text-gray-400 mb-6">
                      Automatically routes AI queries to optimal providers based on query type and performance metrics.
                    </p>
                    
                    <CodeBlock
                      id="ai-routing"
                      language="JSON"
                      code={`{
  "query": {
    "type": "text_generation",
    "content": "Explain quantum computing",
    "requirements": {
      "accuracy": "high",
      "speed": "medium",
      "cost": "optimized"
    }
  },
  "routing_preferences": {
    "providers": ["openai", "anthropic", "cohere"],
    "fallback_strategy": "cascade",
    "purpose_context": "educational_content"
  }
}`}
                    />

                    <h3 className="font-semibold mb-3 mt-6">ANFIS Routing Response</h3>
                    <CodeBlock
                      id="anfis-response"
                      language="JSON"
                      code={`{
  "routing_decision": {
    "selected_provider": "anthropic",
    "confidence": 0.92,
    "reasoning": "Best match for educational content with high accuracy requirement",
    "expected_latency": "850ms",
    "cost_estimate": "$0.002"
  },
  "ai_response": {
    "content": "Quantum computing is a revolutionary approach...",
    "quality_score": 0.96,
    "purpose_alignment": 0.88
  },
  "performance_metrics": {
    "actual_latency": "820ms",
    "accuracy_score": 0.94,
    "user_satisfaction": 0.91
  }
}`}
                    />
                  </div>
                </div>
              )}

              {selectedSection === 'dao-governance' && (
                <div className="space-y-8">
                  <div>
                    <h1 className="text-3xl font-bold mb-4">DAO Governance API</h1>
                    <p className="text-gray-400 mb-8">
                      Purpose-weighted governance with Sybil resistance and quadratic voting mechanisms.
                    </p>
                  </div>

                  <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
                    <h2 className="text-xl font-semibold mb-4">Create Governance Proposal</h2>
                    
                    <CodeBlock
                      id="create-proposal"
                      language="JSON"
                      code={`{
  "proposal": {
    "title": "Fund Climate Action Research Grant",
    "description": "Proposal to allocate 100 ETH for climate research...",
    "purpose_category": "environmental_impact",
    "funding_amount": "100 ETH",
    "execution_timeline": "3 months"
  },
  "voting_mechanism": {
    "type": "quadratic_voting",
    "purpose_weight": 0.4,
    "stake_weight": 0.3,
    "reputation_weight": 0.3
  },
  "sybil_protection": {
    "required_verification": ["proof_of_life", "stake_minimum"],
    "purpose_alignment_threshold": 0.7
  }
}`}
                    />
                  </div>

                  <div className="bg-slate-800/30 border border-slate-700 rounded-2xl p-6">
                    <h2 className="text-xl font-semibold mb-4">Cast Purpose-Weighted Vote</h2>
                    
                    <CodeBlock
                      id="cast-vote"
                      language="JSON"
                      code={`{
  "vote": {
    "proposal_id": "prop_123",
    "position": "yes",
    "conviction": 0.85,
    "reasoning": "Aligns with my climate action purpose"
  },
  "voter_credentials": {
    "purpose_verification": "zkp_proof_hash",
    "stake_amount": "50 tokens",
    "reputation_score": 0.78
  },
  "quadratic_voting": {
    "vote_credits": 25,
    "credits_used": 16, // sqrt(16) = 4 effective votes
    "remaining_credits": 9
  }
}`}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}