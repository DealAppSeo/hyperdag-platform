import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Building2, 
  Bot, 
  Shield, 
  Wallet,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Info,
  ArrowLeft,
  Home,
  Heart,
  Database
} from 'lucide-react';
import { Link } from 'wouter';

export default function TokenSystemGuide() {
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const walletOptions = [
    {
      id: 'metamask',
      name: 'MetaMask',
      description: 'Most popular Ethereum wallet with browser extension',
      pros: ['Easy to use', 'Wide adoption', 'Browser integration'],
      cons: ['Limited to Ethereum ecosystem', 'Hot wallet security'],
      recommended: true,
      icon: '🦊'
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      description: 'Connect to 100+ mobile wallets via QR code',
      pros: ['Mobile-first', 'Multiple wallet support', 'Secure connection'],
      cons: ['Requires mobile app', 'Complex setup'],
      recommended: true,
      icon: '📱'
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      description: 'User-friendly wallet with fiat on-ramp',
      pros: ['Beginner friendly', 'Fiat integration', 'Customer support'],
      cons: ['Centralized elements', 'Limited DeFi features'],
      recommended: false,
      icon: '🔷'
    },
    {
      id: 'hyperdag',
      name: 'HyperDAG Wallet (Coming Soon)',
      description: 'Native wallet optimized for the HyperDAG ecosystem',
      pros: ['Zero fees', 'Privacy-first', 'Quantum-resistant'],
      cons: ['In development', 'Limited ecosystem'],
      recommended: true,
      icon: '⚡'
    }
  ];

  const tokenTypes = [
    {
      id: 'sbt',
      name: 'SBT - Soulbound Tokens',
      target: 'Humans',
      verification: '4FA Proof of Life',
      icon: User,
      color: 'blue',
      description: 'Non-transferable tokens for verified human identity and reputation',
      requirements: [
        'Valid government ID verification',
        'Biometric authentication (face/fingerprint)',
        'Live video verification call',
        'Social media account verification'
      ],
      useCases: [
        'Professional credentials',
        'Educational certificates',
        'Skill verifications',
        'Reputation building',
        'Access to human-only spaces'
      ],
      benefits: [
        'Cannot be sold or transferred',
        'Proves authentic human identity',
        'Builds verifiable reputation',
        'Enables privacy-preserving verification'
      ]
    },
    {
      id: 'cbt',
      name: 'CBT - Charity Bound Tokens',
      target: 'Charitable Organizations',
      verification: 'Financial Transparency Audit',
      icon: Building2,
      color: 'green',
      description: 'Accountability tokens for charitable organizations and nonprofits',
      requirements: [
        'IRS 501(c)(3) tax-exempt status',
        'Annual Form 990 filing',
        'Independent financial audit',
        'Board governance documentation',
        'Impact measurement reporting'
      ],
      useCases: [
        'Transparency ratings',
        'Donor confidence building',
        'Grant eligibility verification',
        'Impact measurement tracking',
        'Regulatory compliance proof'
      ],
      benefits: [
        'Builds donor trust through transparency',
        'Simplifies due diligence for funders',
        'Competitive advantage in fundraising',
        'Automated compliance tracking'
      ]
    },
    {
      id: 'dbt',
      name: 'DBT - Digital Bound Tokens',
      target: 'AI Agents & Digital Entities',
      verification: 'Performance & Security Audit',
      icon: Bot,
      color: 'purple',
      description: 'Reputation tokens for AI systems and digital entities that cannot pass human verification',
      requirements: [
        'Performance benchmarking',
        'Security audit completion',
        'API endpoint documentation',
        'Uptime monitoring data',
        'Energy efficiency metrics'
      ],
      useCases: [
        'AI model reputation',
        'API service reliability',
        'Automated system trust',
        'Digital service discovery',
        'Performance-based pricing'
      ],
      benefits: [
        'Objective performance metrics',
        'Trust in automated systems',
        'Quality assurance for AI services',
        'Competitive differentiation'
      ]
    }
  ];

  const getTokenByColor = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'green': return 'bg-green-100 text-green-800 border-green-200';
      case 'purple': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">HyperDAG Token System Guide</h1>
        <p className="text-gray-600">
          Comprehensive reputation framework for humans, organizations, and digital entities
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="wallet-setup">Wallet Setup</TabsTrigger>
          <TabsTrigger value="token-details">Token Details</TabsTrigger>
          <TabsTrigger value="getting-started">Get Started</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              HyperDAG uses three types of bound tokens to create a comprehensive reputation ecosystem 
              covering all entity types while maintaining privacy and preventing token manipulation.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6 md:grid-cols-3">
            {tokenTypes.map((token) => {
              const IconComponent = token.icon;
              return (
                <Card key={token.id} className="relative">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getTokenByColor(token.color)}`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{token.name}</CardTitle>
                        <CardDescription>{token.target}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4">{token.description}</p>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <strong>Verification:</strong> {token.verification}
                      </div>
                      <div className="text-sm">
                        <strong>Key Benefits:</strong>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          {token.benefits.slice(0, 2).map((benefit, idx) => (
                            <li key={idx} className="text-xs text-gray-600">{benefit}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Why Three Token Types?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-semibold mb-2">Privacy & Security</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• Separate verification methods prevent cross-contamination</li>
                    <li>• Zero-knowledge proofs protect sensitive data</li>
                    <li>• Non-transferable nature prevents identity trading</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Comprehensive Coverage</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>• SBT: Humans who can pass biometric verification</li>
                    <li>• CBT: Organizations requiring transparency</li>
                    <li>• DBT: Digital entities without physical presence</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallet-setup" className="space-y-6">
          <Alert>
            <Wallet className="h-4 w-4" />
            <AlertDescription>
              A Web3 wallet is required to store and manage your bound tokens. Choose the option that best fits your needs.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            {walletOptions.map((wallet) => (
              <Card key={wallet.id} className={`cursor-pointer transition-all ${
                selectedWallet === wallet.id ? 'ring-2 ring-blue-500' : 'hover:shadow-md'
              }`} onClick={() => setSelectedWallet(wallet.id)}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{wallet.icon}</span>
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {wallet.name}
                          {wallet.recommended && (
                            <Badge variant="secondary">Recommended</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{wallet.description}</CardDescription>
                      </div>
                    </div>
                    {selectedWallet === wallet.id && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                </CardHeader>
                {selectedWallet === wallet.id && (
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="font-semibold text-green-600 mb-2">Pros</h4>
                        <ul className="text-sm space-y-1">
                          {wallet.pros.map((pro, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500" />
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold text-orange-600 mb-2">Considerations</h4>
                        <ul className="text-sm space-y-1">
                          {wallet.cons.map((con, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <AlertCircle className="h-3 w-3 text-orange-500" />
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    {wallet.id !== 'hyperdag' && (
                      <Button className="mt-4" variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Get {wallet.name}
                      </Button>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Wallet Security Best Practices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <strong>Backup Your Seed Phrase:</strong> Write down your 12-24 word recovery phrase and store it securely offline.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <strong>Use Hardware Wallets for Large Amounts:</strong> Consider Ledger or Trezor for enhanced security.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <strong>Verify URLs:</strong> Always double-check wallet website URLs to avoid phishing attacks.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-green-500 mt-0.5" />
                  <div>
                    <strong>Never Share Private Keys:</strong> Legitimate services will never ask for your private keys or seed phrase.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="token-details" className="space-y-6">
          {tokenTypes.map((token) => {
            const IconComponent = token.icon;
            return (
              <Card key={token.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${getTokenByColor(token.color)}`}>
                      <IconComponent className="h-8 w-8" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{token.name}</CardTitle>
                      <CardDescription>{token.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h4 className="font-semibold mb-3">Requirements</h4>
                      <ul className="space-y-2">
                        {token.requirements.map((req, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-3">Use Cases</h4>
                      <ul className="space-y-2">
                        {token.useCases.map((useCase, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <ArrowRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            {useCase}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="getting-started" className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Follow these steps to start building your reputation on HyperDAG. Choose the token type that matches your entity.
            </AlertDescription>
          </Alert>

          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  For Individuals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    Set up a compatible wallet
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    Complete identity verification
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    Mint your first SBT credential
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                    Start building reputation
                  </li>
                </ol>
                <Button className="w-full" variant="outline">
                  Start SBT Journey
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  For Organizations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    Verify 501(c)(3) status
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    Submit financial documentation
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    Complete transparency audit
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                    Receive CBT certification
                  </li>
                </ol>
                <Button className="w-full" variant="outline">
                  Register Organization
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  For AI/Digital Services
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="space-y-3 text-sm">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                    Document API endpoints
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                    Set up performance monitoring
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
                    Complete security audit
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
                    Mint DBT reputation token
                  </li>
                </ol>
                <Button className="w-full" variant="outline">
                  Register AI Service
                </Button>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Do I need to pay for tokens?</h4>
                  <p className="text-sm text-gray-600">
                    Token minting requires only network gas fees. There are no platform fees for creating bound tokens.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Can I sell or transfer my tokens?</h4>
                  <p className="text-sm text-gray-600">
                    No, all bound tokens are non-transferable by design. This prevents identity trading and maintains authenticity.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">How long does verification take?</h4>
                  <p className="text-sm text-gray-600">
                    SBT verification: 24-48 hours | CBT verification: 5-10 business days | DBT verification: 3-5 business days
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">What networks are supported?</h4>
                  <p className="text-sm text-gray-600">
                    Currently supporting Ethereum, Polygon, and IOTA. HyperDAG native network coming soon.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}