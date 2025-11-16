import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, AlertCircle, Clock, ExternalLink, Code, Database, Shield, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ComponentStatus {
  name: string;
  status: 'complete' | 'partial' | 'pending';
  progress: number;
  description: string;
  features: string[];
  apiEndpoints?: string[];
}

export default function DeploymentReadiness() {
  const [selectedComponent, setSelectedComponent] = useState<string>('grantflow');

  const { data: systemStatus, isLoading, refetch: refetchSystemStatus } = useQuery({
    queryKey: ['/api/system/deployment-status'],
    refetchInterval: false // ❌ NO POLLING - eliminated 2 req/min
  });

  const mvpComponents: ComponentStatus[] = [
    {
      name: 'GrantFlow API',
      status: 'complete',
      progress: 90,
      description: 'Grant discovery, matching, and team recommendations for third-party integration',
      features: [
        'Grant discovery from multiple sources',
        'AI-powered grant matching algorithm',
        'Team recommendation system',
        'RESTful API with authentication',
        'Rate limiting and error handling'
      ],
      apiEndpoints: [
        'GET /api/grantflow/grants',
        'POST /api/grantflow/grants/match',
        'POST /api/grantflow/team/recommend',
        'GET /api/grantflow/discovery/sources'
      ]
    },
    {
      name: 'ZKP Credentials',
      status: 'partial',
      progress: 70,
      description: 'Zero-knowledge proof identity verification with SBT integration',
      features: [
        'ZK proof generation for identity',
        'Soulbound token (SBT) credentials',
        'Privacy-preserving verification',
        'Reputation scoring system',
        'Credential marketplace'
      ],
      apiEndpoints: [
        'POST /api/zkp/generate-proof',
        'POST /api/zkp/verify-proof',
        'GET /api/sbt/credentials',
        'POST /api/sbt/create'
      ]
    },
    {
      name: 'HyperCrowd',
      status: 'partial',
      progress: 60,
      description: 'Decentralized team formation and collaboration platform',
      features: [
        'Project-based team matching',
        'Skill verification system',
        'Reputation-based recommendations',
        'Collaborative workspace integration',
        'Performance tracking'
      ],
      apiEndpoints: [
        'POST /api/hypercrowd/recommend-team',
        'GET /api/projects',
        'POST /api/projects/create',
        'GET /api/user/stats'
      ]
    },
    {
      name: 'Smart Wallet',
      status: 'complete',
      progress: 85,
      description: 'Alchemy-powered smart wallet with gasless transactions',
      features: [
        'Account abstraction with Alchemy',
        'Gasless transaction support',
        'Multi-chain compatibility',
        'Social recovery mechanisms',
        'DeFi integration ready'
      ],
      apiEndpoints: [
        'POST /api/smart-wallet/create',
        'GET /api/smart-wallet/status',
        'POST /api/smart-wallet/transfer',
        'GET /api/smart-wallet/balance'
      ]
    }
  ];

  const getStatusIcon = (status: ComponentStatus['status']) => {
    switch (status) {
      case 'complete':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'partial':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: ComponentStatus['status']) => {
    switch (status) {
      case 'complete':
        return 'bg-green-500';
      case 'partial':
        return 'bg-yellow-500';
      case 'pending':
        return 'bg-red-500';
    }
  };

  const overallProgress = Math.round(
    mvpComponents.reduce((sum, comp) => sum + comp.progress, 0) / mvpComponents.length
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">HyperDAG MVP Deployment Status</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Comprehensive Web3/AI ecosystem ready for third-party integration and deployment
        </p>
        
        <div className="flex items-center justify-center space-x-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{overallProgress}%</div>
            <div className="text-sm text-muted-foreground">Overall Progress</div>
          </div>
          <Progress value={overallProgress} className="w-48" />
          <Badge variant={overallProgress >= 80 ? "default" : "secondary"} className="text-lg px-4 py-2">
            {overallProgress >= 80 ? "Deployment Ready" : "In Development"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mvpComponents.map((component) => (
          <Card 
            key={component.name}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedComponent === component.name.toLowerCase().replace(' ', '') 
                ? 'ring-2 ring-primary' 
                : ''
            }`}
            onClick={() => setSelectedComponent(component.name.toLowerCase().replace(' ', ''))}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{component.name}</CardTitle>
                {getStatusIcon(component.status)}
              </div>
              <Progress value={component.progress} className="w-full" />
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className="mb-2">
                {component.progress}% Complete
              </Badge>
              <p className="text-sm text-muted-foreground">
                {component.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={selectedComponent} onValueChange={setSelectedComponent} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {mvpComponents.map((component) => (
            <TabsTrigger 
              key={component.name}
              value={component.name.toLowerCase().replace(' ', '')}
              className="text-xs"
            >
              {component.name}
            </TabsTrigger>
          ))}
        </TabsList>

        {mvpComponents.map((component) => (
          <TabsContent 
            key={component.name}
            value={component.name.toLowerCase().replace(' ', '')}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      {getStatusIcon(component.status)}
                      <span>{component.name}</span>
                    </CardTitle>
                    <CardDescription>{component.description}</CardDescription>
                  </div>
                  <Badge variant={component.status === 'complete' ? 'default' : 'secondary'}>
                    {component.status === 'complete' ? 'Ready' : 'Development'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center">
                    <Zap className="w-4 h-4 mr-2" />
                    Key Features
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {component.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {component.apiEndpoints && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center">
                      <Code className="w-4 h-4 mr-2" />
                      API Endpoints
                    </h4>
                    <div className="space-y-2">
                      {component.apiEndpoints.map((endpoint, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <code className="text-sm font-mono">{endpoint}</code>
                          <Button size="sm" variant="outline">
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>Security & Integration Features</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">✓ Authentication</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• API key validation</li>
                <li>• Rate limiting (100 req/hour)</li>
                <li>• User session management</li>
                <li>• Multi-factor authentication</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">✓ Data Protection</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Zero-knowledge proofs</li>
                <li>• Encrypted data storage</li>
                <li>• Privacy-first architecture</li>
                <li>• GDPR compliance ready</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-green-600">✓ Integration Ready</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• RESTful API design</li>
                <li>• Comprehensive error handling</li>
                <li>• Webhook support</li>
                <li>• SDK documentation</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center space-y-4">
        <h3 className="text-2xl font-semibold">Ready for Third-Party Integration</h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          HyperDAG's MVP provides a robust foundation for developers to build upon, 
          with secure APIs, comprehensive documentation, and scalable architecture.
        </p>
        <div className="flex justify-center space-x-4">
          <Button size="lg" className="flex items-center space-x-2">
            <Code className="w-5 h-5" />
            <span>View API Documentation</span>
          </Button>
          <Button size="lg" variant="outline" className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Download SDK</span>
          </Button>
        </div>
      </div>
    </div>
  );
}