import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Copy, 
  ExternalLink, 
  FileCode, 
  Shield, 
  Zap,
  CheckCircle,
  Github,
  Package,
  Terminal,
  BookOpen,
  Key,
  Code,
  Smartphone,
  Globe,
  Server
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/layout/layout';

export default function DeveloperSDKDownloads() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(label);
    toast({
      title: "Copied to clipboard",
      description: `${label} copied successfully`,
    });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sdkPackages = [
    {
      name: "JavaScript/TypeScript SDK",
      version: "v2.1.0",
      description: "Complete SDK for web applications with SBT, CBT, DBT support and ZKP verification",
      icon: <FileCode className="h-6 w-6 text-yellow-500" />,
      install: "npm install @hyperdag/sdk",
      features: ["Soulbound Tokens (SBT)", "Digital Bound Tokens (DBT)", "Charity Bound Tokens (CBT)", "Zero-Knowledge Proofs", "4FA + Proof of Life", "Cross-chain Reputation"],
      platforms: ["Node.js", "Browser", "React", "Vue", "Angular"],
      downloadUrl: "/api/developer/sdk/download/javascript",
      githubUrl: "https://github.com/hyperdag/js-sdk",
      docsUrl: "/developer/sdk-integration"
    },
    {
      name: "Python SDK",
      version: "v1.8.0",
      description: "Python library for backend integration and AI-powered verification",
      icon: <Server className="h-6 w-6 text-blue-500" />,
      install: "pip install hyperdag-sdk",
      features: ["Server-side SBT Management", "ZKP Circuit Generation", "AI-powered Verification", "Batch Operations", "Data Analytics", "Machine Learning Integration"],
      platforms: ["Python 3.8+", "Django", "Flask", "FastAPI"],
      downloadUrl: "/api/developer/sdk/download/python",
      githubUrl: "https://github.com/hyperdag/python-sdk",
      docsUrl: "/developer/python-sdk"
    },
    {
      name: "Mobile SDK",
      version: "v1.2.0",
      description: "Native mobile SDK with biometric verification and offline capabilities",
      icon: <Smartphone className="h-6 w-6 text-green-500" />,
      install: "pod 'HyperDAGSDK' // iOS\nimplementation 'com.hyperdag:sdk:1.2.0' // Android",
      features: ["Biometric SBT Verification", "Offline Token Storage", "Mobile Wallet Integration", "Push Notifications", "QR Code Scanning", "Device-based Proof of Life"],
      platforms: ["iOS 13+", "Android 8+", "React Native", "Flutter"],
      downloadUrl: "/api/developer/sdk/download/mobile",
      githubUrl: "https://github.com/hyperdag/mobile-sdk",
      docsUrl: "/developer/mobile-sdk"
    },
    {
      name: "Rust SDK",
      version: "v0.9.0",
      description: "High-performance Rust library for blockchain and cryptographic operations",
      icon: <Zap className="h-6 w-6 text-orange-500" />,
      install: 'hyperdag-sdk = "0.9.0"',
      features: ["Low-level ZKP Operations", "Custom Circuit Development", "High-performance Verification", "Cryptographic Primitives", "Blockchain Integration", "WASM Compilation"],
      platforms: ["Native Rust", "WASM", "Substrate", "Solana"],
      downloadUrl: "/api/developer/sdk/download/rust",
      githubUrl: "https://github.com/hyperdag/rust-sdk",
      docsUrl: "/developer/rust-sdk"
    }
  ];

  const codeExamples = {
    sbt: `// Soulbound Token (SBT) - Non-transferable identity credentials
import { HyperDAGSDK } from '@hyperdag/sdk';

const sdk = new HyperDAGSDK({
  apiKey: process.env.HYPERDAG_API_KEY,
  baseURL: 'https://api.hyperdag.org'
});

// Create a professional SBT credential
const sbtCredential = await sdk.sbt.register({
  type: 'professional',
  title: 'Software Engineer Certification',
  description: 'Verified software engineering credentials',
  evidence: 'LinkedIn profile, GitHub contributions, work history',
  isMonetizable: false, // SBTs are non-transferable
  zkpRequired: true // Enable privacy-preserving verification
});

// Verify SBT with Zero-Knowledge Proof
const verification = await sdk.sbt.verifyWithZKP({
  credentialId: sbtCredential.id,
  minimumReputationScore: 100,
  preservePrivacy: true
});

console.log('SBT Verified:', verification.verified);
console.log('ZK Proof:', verification.zkProof);`,

    cbt: `// Charity Bound Token (CBT) - Nonprofit transparency and accountability
const cbtCredential = await sdk.cbt.create({
  type: 'nonprofit_verification',
  title: 'Clean Water Initiative 501(c)(3)',
  description: 'Verified nonprofit organization with transparent operations',
  organizationId: 'EIN-12-3456789',
  evidence: 'IRS determination letter, audited financials, program reports',
  transparencyLevel: 'fully_transparent',
  auditedFinancials: true,
  programImpactReports: true
});

// Update transparency metrics
const transparencyUpdate = await sdk.cbt.updateTransparency({
  credentialId: cbtCredential.id,
  metrics: {
    fundsRaised: 250000,
    fundsAllocated: 225000,
    programExpenses: 200000,
    administrativeExpenses: 25000,
    beneficiariesServed: 1500,
    impactMetrics: ['water_wells_built: 12', 'communities_served: 8']
  },
  auditReport: 'ipfs://QmXyZ...',
  includeZKProof: true
});

// Verify nonprofit accountability
const verification = await sdk.cbt.verifyAccountability({
  credentialId: cbtCredential.id,
  verificationCriteria: {
    minimumTransparencyScore: 85,
    requireAuditedFinancials: true,
    requireImpactReporting: true
  }
});`,

    dbt: `// Digital Bound Token (DBT) - AI agent, bot, and robot identity credentials
const dbtCredential = await sdk.dbt.create({
  type: 'ai_agent',
  title: 'HyperDAG Grant Discovery Bot v2.1',
  description: 'Autonomous AI agent for grant opportunity discovery and matching',
  agentType: 'autonomous_bot',
  capabilities: [
    'web_scraping',
    'natural_language_processing', 
    'grant_matching_algorithm',
    'real_time_analysis'
  ],
  operationalParameters: {
    autonomyLevel: 'supervised',
    learningEnabled: true,
    dataRetentionPeriod: '90_days',
    complianceLevel: 'gdpr_compliant'
  },
  evidence: 'Code audit, performance metrics, security assessment',
  creatorAddress: '0x742d35Cc6419C40e7',
  transferable: false // DBTs are bound to their digital entity
});

// Register robot/hardware device
const robotDBT = await sdk.dbt.createRobotIdentity({
  type: 'physical_robot',
  title: 'Manufacturing Robot Unit #4B',
  description: 'Industrial assembly robot with AI decision-making',
  hardwareSpecs: {
    serialNumber: 'ROB-4B-2025-001',
    manufacturer: 'HyperRobotics Inc',
    model: 'AssemblyBot Pro',
    sensors: ['lidar', 'camera_array', 'pressure_sensors']
  },
  aiCapabilities: {
    visionProcessing: true,
    pathPlanning: true,
    qualityControl: true,
    predictiveMaintenance: true
  },
  safetyCompliance: 'ISO_10218_certified',
  operationalZone: 'factory_floor_section_b'
});

// Verify AI agent authenticity and permissions
const agentVerification = await sdk.dbt.verifyAgent({
  agentId: dbtCredential.id,
  verificationCriteria: {
    codeIntegrity: true,
    permissionScope: 'grant_discovery_only',
    dataPrivacyCompliant: true,
    ethicalAICompliant: true
  },
  generateProof: true
});`,

    zkp: `// Zero-Knowledge Proof verification for all token types
const zkpCircuit = await sdk.zkp.createCircuit({
  name: 'reputation_threshold',
  description: 'Prove reputation above threshold without revealing exact score',
  inputs: ['reputation_score', 'threshold', 'salt'],
  outputs: ['above_threshold'],
  constraints: [
    'reputation_score >= threshold',
    'above_threshold = 1 if reputation_score >= threshold else 0'
  ]
});

// Generate proof for credential verification
const proof = await sdk.zkp.generateProof({
  circuit: 'reputation_threshold',
  privateInputs: {
    reputation_score: 850, // User's actual score (kept private)
    salt: 'random_salt_123'
  },
  publicInputs: {
    threshold: 500 // Minimum required score (public)
  }
});

// Verify proof without revealing sensitive data
const verification = await sdk.zkp.verifyProof({
  proof: proof.zkProof,
  publicInputs: proof.publicInputs,
  circuit: 'reputation_threshold'
});

console.log('Threshold met:', verification.verified);
console.log('Actual score remains private');`,

    integration: `// Complete integration example with all token types
class HyperDAGIntegration {
  constructor() {
    this.sdk = new HyperDAGSDK({
      apiKey: process.env.HYPERDAG_API_KEY,
      baseURL: 'https://api.hyperdag.org',
      features: ['sbt', 'cbt', 'dbt', 'zkp', '4fa-pol']
    });
  }

  // Comprehensive ecosystem verification
  async verifyEcosystemEntity(entityId, entityType) {
    if (entityType === 'human') {
      // Check SBT identity credentials for humans
      const identityCredentials = await this.sdk.sbt.getCredentials(entityId, {
        type: 'identity',
        status: 'verified'
      });

      return {
        entityType: 'human',
        verified: identityCredentials.length > 0,
        credentials: identityCredentials
      };
    } 
    
    else if (entityType === 'nonprofit') {
      // Check CBT transparency credentials for nonprofits
      const transparencyCredentials = await this.sdk.cbt.getCredentials(entityId, {
        type: 'nonprofit_verification',
        minimumTransparencyScore: 75
      });

      return {
        entityType: 'nonprofit',
        verified: transparencyCredentials.length > 0,
        transparencyScore: transparencyCredentials[0]?.transparencyScore || 0,
        credentials: transparencyCredentials
      };
    }
    
    else if (entityType === 'ai_agent' || entityType === 'robot') {
      // Check DBT digital identity credentials for AI/robots
      const digitalCredentials = await this.sdk.dbt.getCredentials(entityId, {
        type: entityType,
        status: 'active'
      });

      return {
        entityType: entityType,
        verified: digitalCredentials.length > 0,
        capabilities: digitalCredentials[0]?.capabilities || [],
        credentials: digitalCredentials
      };
    }

    // Generate comprehensive ZK proof for multi-entity verification
    const comprehensiveProof = await this.sdk.zkp.generateProof({
      circuit: 'ecosystem_verification',
      privateInputs: {
        entityType: entityType,
        verificationScore: this.calculateVerificationScore(entityType, credentials)
      },
      publicInputs: {
        minimumThreshold: 50,
        ecosystemStandards: 'hyperdag_v1'
      }
    });

    return {
      verified: comprehensiveProof.verified,
      zkProof: comprehensiveProof.zkProof,
      entityType: entityType
    };
  }

  calculateVerificationScore(entityType, credentials) {
    // Custom scoring logic based on entity type and credentials
    return credentials.length * 25; // Simplified example
  }
}`
  };

  return (
    <Layout>
      <div className="container py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">HyperDAG SDK Downloads</h1>
          <p className="text-muted-foreground text-lg">
            Download SDKs and get integration guides for SBTs, CBTs, DBTs with Zero-Knowledge Proof verification
          </p>
        </div>

        <Alert className="mb-8">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            All SDKs include built-in zero-knowledge proof verification, 4-factor authentication, 
            and proof-of-life validation for maximum security and privacy.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="downloads" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="downloads" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              SDK Downloads
            </TabsTrigger>
            <TabsTrigger value="examples" className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              Code Examples
            </TabsTrigger>
            <TabsTrigger value="integration" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Integration Guide
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="flex items-center gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
          </TabsList>

          {/* SDK Downloads Tab */}
          <TabsContent value="downloads" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {sdkPackages.map((pkg, index) => (
                <Card key={index} className="h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {pkg.icon}
                        <div>
                          <CardTitle className="text-lg">{pkg.name}</CardTitle>
                          <CardDescription>{pkg.description}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary">{pkg.version}</Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Installation</h4>
                      <div className="bg-muted p-3 rounded-md relative">
                        <code className="text-sm font-mono">{pkg.install}</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-1 right-1"
                          onClick={() => copyToClipboard(pkg.install, `${pkg.name} install command`)}
                        >
                          {copiedCode === `${pkg.name} install command` ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Key Features</h4>
                      <div className="space-y-1">
                        {pkg.features.map((feature, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">Platforms</h4>
                      <div className="flex flex-wrap gap-1">
                        {pkg.platforms.map((platform, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {platform}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-col gap-2">
                    <Button className="w-full" onClick={() => window.open(pkg.downloadUrl)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download SDK
                    </Button>
                    <div className="flex gap-2 w-full">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(pkg.githubUrl)}>
                        <Github className="mr-1 h-3 w-3" />
                        GitHub
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => window.open(pkg.docsUrl)}>
                        <BookOpen className="mr-1 h-3 w-3" />
                        Docs
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Code Examples Tab */}
          <TabsContent value="examples" className="space-y-6">
            <Tabs defaultValue="sbt" className="space-y-4">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="sbt">SBT (Human)</TabsTrigger>
                <TabsTrigger value="cbt">CBT (Charity)</TabsTrigger>
                <TabsTrigger value="dbt">DBT (Digital)</TabsTrigger>
                <TabsTrigger value="zkp">ZK Proofs</TabsTrigger>
                <TabsTrigger value="integration">Full Integration</TabsTrigger>
              </TabsList>

              {Object.entries(codeExamples).map(([key, code]) => (
                <TabsContent key={key} value={key}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {key === 'sbt' && 'Soulbound Tokens (SBT) - Human Identity Credentials'}
                        {key === 'cbt' && 'Charity Bound Tokens (CBT) - Nonprofit Transparency'}
                        {key === 'dbt' && 'Digital Bound Tokens (DBT) - AI Agent & Robot Identity'}
                        {key === 'zkp' && 'Zero-Knowledge Proofs - Privacy-Preserving Verification'}
                        {key === 'integration' && 'Complete Integration - All Token Types'}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(code, `${key.toUpperCase()} example`)}
                        >
                          {copiedCode === `${key.toUpperCase()} example` ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Copy className="mr-2 h-4 w-4" />
                          )}
                          Copy Code
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
                        <code>{code}</code>
                      </pre>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </TabsContent>

          {/* Integration Guide Tab */}
          <TabsContent value="integration" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-500" />
                    Quick Start Guide
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Generate API key from Developer Dashboard</li>
                    <li>Install SDK for your platform</li>
                    <li>Initialize SDK with your API key</li>
                    <li>Choose token types (SBT/CBT/DBT)</li>
                    <li>Implement ZKP verification</li>
                    <li>Test in sandbox environment</li>
                  </ol>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    <BookOpen className="mr-2 h-4 w-4" />
                    View Full Guide
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Token Type Guide
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm">SBT (Soulbound)</h4>
                    <p className="text-xs text-muted-foreground">Non-transferable human identity credentials</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">CBT (Charity Bound)</h4>
                    <p className="text-xs text-muted-foreground">Nonprofit transparency and accountability</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">DBT (Digital Bound)</h4>
                    <p className="text-xs text-muted-foreground">AI agent, bot, and robot identity</p>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    <Package className="mr-2 h-4 w-4" />
                    Token Documentation
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-green-500" />
                    Testing & Deployment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li>Use sandbox environment for testing</li>
                    <li>Validate ZK proofs locally</li>
                    <li>Test token transfers and verification</li>
                    <li>Deploy to production environment</li>
                    <li>Monitor API usage and performance</li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full">
                    <Globe className="mr-2 h-4 w-4" />
                    Deployment Guide
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  API Key Management
                </CardTitle>
                <CardDescription>
                  Generate and manage API keys for different environments and feature sets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Development</h4>
                    <p className="text-sm text-muted-foreground">
                      Sandbox environment with full feature access for testing
                    </p>
                    <Button variant="outline" className="w-full">
                      Generate Dev Key
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Staging</h4>
                    <p className="text-sm text-muted-foreground">
                      Pre-production environment with rate limits
                    </p>
                    <Button variant="outline" className="w-full">
                      Generate Staging Key
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold">Production</h4>
                    <p className="text-sm text-muted-foreground">
                      Live environment with full security features
                    </p>
                    <Button variant="outline" className="w-full">
                      Generate Prod Key
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-semibold">Feature Permissions</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {['SBT Management', 'CBT Transparency', 'DBT Digital Identity', 'ZKP Verification', '4FA + PoL', 'Cross-chain Rep', 'AI Integration', 'Analytics'].map((feature, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <input type="checkbox" id={feature} defaultChecked />
                        <label htmlFor={feature} className="text-sm">{feature}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">
                  <Key className="mr-2 h-4 w-4" />
                  Generate Custom API Key
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}