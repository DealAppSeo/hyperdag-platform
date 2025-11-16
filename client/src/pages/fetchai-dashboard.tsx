import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Coins, TrendingUp, Users, Zap, FileText, Database, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GrantMatch {
  grantId: string;
  grantTitle: string;
  matchScore: number;
  reasoning: string;
  actionPlan: string[];
  estimatedSuccessRate: number;
  fetTokenReward: number;
}

interface Project {
  id: number;
  title: string;
  description: string;
  categories: string[];
  fundingGoal: number;
}

export default function FetchAIDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  // Fetch Fetch.AI status
  const { data: status } = useQuery({
    queryKey: ["/api/fetchai-bridge/status"],
  });

  // Fetch user projects
  const { data: projects } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Fetch earning potential
  const { data: earningPotential } = useQuery({
    queryKey: ["/api/fetchai-bridge/earning-potential"],
  });

  // Fetch onboarding guide
  const { data: onboarding } = useQuery({
    queryKey: ["/api/fetchai-bridge/onboarding"],
  });

  // Fetch grant matches for selected project
  const { data: grantMatches, isLoading: matchesLoading } = useQuery({
    queryKey: ["/api/fetchai-bridge/project", selectedProject, "matches"],
    enabled: !!selectedProject,
  });

  useEffect(() => {
    if (projects?.data && projects.data.length > 0 && !selectedProject) {
      setSelectedProject(projects.data[0].id);
    }
  }, [projects, selectedProject]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatFET = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fetch.AI Integration</h1>
          <p className="text-muted-foreground">
            AI-powered grant matching with FET token rewards - no separate credentials needed
          </p>
        </div>
        <Badge variant={status?.data?.active ? "default" : "secondary"} className="px-3 py-1">
          {status?.data?.mode || "Loading..."}
        </Badge>
      </div>

      {/* Value Proposition Alert */}
      <Alert>
        <Zap className="h-4 w-4" />
        <AlertDescription>
          <strong>Zero Friction Access:</strong> Your HyperDAG account automatically includes Fetch.AI agent capabilities. 
          No separate signup required - start earning FET tokens immediately!
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="matches">Grant Matches</TabsTrigger>
          <TabsTrigger value="storage">Storage Options</TabsTrigger>
          <TabsTrigger value="onboarding">Getting Started</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Earning Potential */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">FET Earning Potential</CardTitle>
                <Coins className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {earningPotential?.data?.totalPotentialFET ? 
                    `${formatFET(earningPotential.data.totalPotentialFET)} FET` : 
                    "Loading..."
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {earningPotential?.data?.estimatedUSDValue ? 
                    `≈ ${formatCurrency(earningPotential.data.estimatedUSDValue)}` : 
                    "Based on current projects"
                  }
                </p>
              </CardContent>
            </Card>

            {/* Active Projects */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {projects?.data?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Eligible for grant matching
                </p>
              </CardContent>
            </Card>

            {/* Service Status */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Service Status</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Active</div>
                <p className="text-xs text-muted-foreground">
                  {status?.data?.mode || "Demo"} mode
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Capabilities */}
          <Card>
            <CardHeader>
              <CardTitle>Available Capabilities</CardTitle>
              <CardDescription>
                Fetch.AI features accessible through your HyperDAG account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {status?.data?.capabilities?.map((capability: string, index: number) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Award className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{capability}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grant Matches Tab */}
        <TabsContent value="matches" className="space-y-6">
          {/* Project Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Project for Grant Matching</CardTitle>
              <CardDescription>
                Choose a project to see AI-powered grant recommendations with FET reward estimates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects?.data?.map((project: Project) => (
                  <Card 
                    key={project.id} 
                    className={`cursor-pointer transition-all ${
                      selectedProject === project.id ? 'ring-2 ring-primary' : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedProject(project.id)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">{project.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground mb-2">
                        {project.description.substring(0, 100)}...
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {project.categories.slice(0, 2).map((cat: string) => (
                          <Badge key={cat} variant="outline" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Grant Matches Results */}
          {selectedProject && (
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Grant Matches</CardTitle>
                <CardDescription>
                  Personalized grant recommendations with FET earning potential
                </CardDescription>
              </CardHeader>
              <CardContent>
                {matchesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : grantMatches?.data?.matches ? (
                  <div className="space-y-4">
                    {grantMatches.data.matches.map((match: GrantMatch, index: number) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-semibold">{match.grantTitle}</h4>
                            <p className="text-sm text-muted-foreground">{match.reasoning}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="mb-1">
                              {match.matchScore}% match
                            </Badge>
                            <div className="text-sm font-medium text-green-600">
                              +{formatFET(match.fetTokenReward)} FET
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Success Rate</span>
                            <span>{match.estimatedSuccessRate}%</span>
                          </div>
                          <Progress value={match.estimatedSuccessRate} className="h-2" />
                        </div>

                        <div>
                          <h5 className="text-sm font-medium mb-2">Action Plan:</h5>
                          <ul className="text-sm space-y-1">
                            {match.actionPlan.map((step: string, stepIndex: number) => (
                              <li key={stepIndex} className="flex items-start">
                                <span className="mr-2 text-muted-foreground">{stepIndex + 1}.</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No grant matches found for this project
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Storage Options Tab */}
        <TabsContent value="storage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Expanded Storage Options</CardTitle>
              <CardDescription>
                Multiple storage solutions beyond Fetch.AI limitations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Limewire Integration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Free storage up to 10GB per project</li>
                      <li>• AI-powered content optimization</li>
                      <li>• Automatic backup and versioning</li>
                      <li>• Integrated with HyperDAG projects</li>
                    </ul>
                    <Button className="w-full mt-4" variant="outline">
                      Connect Limewire Storage
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      IPFS + Web3.Storage
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>• Decentralized file storage</li>
                      <li>• Content addressing and deduplication</li>
                      <li>• Free storage with Filecoin backing</li>
                      <li>• Permanent data availability</li>
                    </ul>
                    <Button className="w-full mt-4" variant="outline">
                      Configure IPFS Storage
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Alert className="mt-6">
                <Database className="h-4 w-4" />
                <AlertDescription>
                  <strong>Smart Storage Routing:</strong> HyperDAG automatically selects the best storage option based on your project needs, 
                  file types, and access patterns. No manual configuration required.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Onboarding Tab */}
        <TabsContent value="onboarding" className="space-y-6">
          {onboarding?.data && (
            <Card>
              <CardHeader>
                <CardTitle>{onboarding.data.title}</CardTitle>
                <CardDescription>{onboarding.data.subtitle}</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6">
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Value Proposition:</strong> {onboarding.data.valueProposition}
                  </AlertDescription>
                </Alert>

                <div className="space-y-6">
                  {onboarding.data.steps?.map((step: any, index: number) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{step.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                        <p className="text-sm font-medium">{step.action}</p>
                        {step.timeRequired && (
                          <Badge variant="outline" className="mt-2">
                            {step.timeRequired}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {onboarding.data.immediateValue && (
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg">Immediate Benefits</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {onboarding.data.immediateValue.map((benefit: string, index: number) => (
                          <li key={index} className="flex items-center gap-2">
                            <Award className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}