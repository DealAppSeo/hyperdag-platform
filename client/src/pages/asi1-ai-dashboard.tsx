import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Brain, 
  Users, 
  Lightbulb, 
  FileText, 
  TrendingUp, 
  Target,
  Zap,
  CheckCircle,
  AlertCircle,
  Sparkles
} from "lucide-react";

export default function ASi1AIDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [grantProfile, setGrantProfile] = useState({
    skills: [''],
    interests: [''],
    experience: '',
    projectGoals: ''
  });
  
  const [projectData, setProjectData] = useState({
    title: '',
    description: '',
    requiredSkills: [''],
    budget: '',
    timeline: ''
  });

  const [optimizationData, setOptimizationData] = useState({
    currentStatus: '',
    goals: [''],
    resources: {},
    challenges: ['']
  });

  // Health check query
  const { data: healthStatus, isLoading: healthLoading } = useQuery({
    queryKey: ['/api/asi1/health'],
    queryFn: () => apiRequest('GET', '/api/asi1/health').then(res => res.json())
  });

  // Service status query
  const { data: serviceStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/asi1/status'],
    queryFn: () => apiRequest('GET', '/api/asi1/status').then(res => res.json())
  });

  // Grant matching mutation
  const grantMatchingMutation = useMutation({
    mutationFn: async (profile: any) => {
      const response = await apiRequest('POST', '/api/asi1/grant-matching', profile);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Grant Matching Complete",
        description: `Found ${data.data?.matches?.length || 0} relevant grant opportunities`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Grant matching failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Team formation mutation
  const teamFormationMutation = useMutation({
    mutationFn: async (project: any) => {
      const response = await apiRequest('POST', '/api/asi1/team-formation', project);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Team Analysis Complete",
        description: `Recommended team size: ${data.data?.recommendedTeamSize || 'N/A'} members`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Team formation analysis failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Project optimization mutation
  const optimizationMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/asi1/project-optimization', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Project Optimization Complete",
        description: `Generated ${data.data?.optimizations?.length || 0} optimization recommendations`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Project optimization failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Content generation mutation
  const contentGenerationMutation = useMutation({
    mutationFn: async (params: any) => {
      const response = await apiRequest('POST', '/api/asi1/generate-content', params);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Content Generated",
        description: "Grant application content has been generated successfully"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Content generation failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleGrantMatching = () => {
    const profile = {
      skills: grantProfile.skills.filter(s => s.trim() !== ''),
      interests: grantProfile.interests.filter(i => i.trim() !== ''),
      experience: grantProfile.experience,
      projectGoals: grantProfile.projectGoals
    };
    grantMatchingMutation.mutate(profile);
  };

  const handleTeamFormation = () => {
    const project = {
      title: projectData.title,
      description: projectData.description,
      requiredSkills: projectData.requiredSkills.filter(s => s.trim() !== ''),
      budget: projectData.budget ? parseInt(projectData.budget) : undefined,
      timeline: projectData.timeline
    };
    teamFormationMutation.mutate(project);
  };

  const handleProjectOptimization = () => {
    const data = {
      currentStatus: optimizationData.currentStatus,
      goals: optimizationData.goals.filter(g => g.trim() !== ''),
      resources: optimizationData.resources,
      challenges: optimizationData.challenges.filter(c => c.trim() !== '')
    };
    optimizationMutation.mutate(data);
  };

  const addField = (type: 'skills' | 'interests' | 'requiredSkills' | 'goals' | 'challenges') => {
    if (type === 'skills' || type === 'interests') {
      setGrantProfile(prev => ({
        ...prev,
        [type]: [...prev[type], '']
      }));
    } else if (type === 'requiredSkills') {
      setProjectData(prev => ({
        ...prev,
        requiredSkills: [...prev.requiredSkills, '']
      }));
    } else {
      setOptimizationData(prev => ({
        ...prev,
        [type]: [...prev[type], '']
      }));
    }
  };

  const updateField = (type: string, index: number, value: string) => {
    if (type === 'skills' || type === 'interests') {
      setGrantProfile(prev => ({
        ...prev,
        [type]: prev[type].map((item, i) => i === index ? value : item)
      }));
    } else if (type === 'requiredSkills') {
      setProjectData(prev => ({
        ...prev,
        requiredSkills: prev.requiredSkills.map((item, i) => i === index ? value : item)
      }));
    } else {
      setOptimizationData(prev => ({
        ...prev,
        [type]: prev[type].map((item, i) => i === index ? value : item)
      }));
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access ASi1.ai AI capabilities.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Brain className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-bold">ASi1.ai Integration</h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Advanced AI capabilities for grant matching, team formation, and project optimization
        </p>
      </div>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Health Status</Label>
              {healthLoading ? (
                <div className="h-4 bg-muted animate-pulse rounded mt-1" />
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={healthStatus?.data?.status === 'healthy' ? 'default' : 'secondary'}>
                    {healthStatus?.data?.status || 'Unknown'}
                  </Badge>
                  {healthStatus?.data?.status === 'healthy' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
              )}
            </div>
            <div>
              <Label className="text-sm font-medium">Available Capabilities</Label>
              <div className="flex flex-wrap gap-1 mt-1">
                {statusLoading ? (
                  <div className="h-6 bg-muted animate-pulse rounded w-20" />
                ) : (
                  serviceStatus?.data?.capabilities?.map((cap: string) => (
                    <Badge key={cap} variant="outline" className="text-xs">
                      {cap.replace(/_/g, ' ')}
                    </Badge>
                  ))
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Features */}
      <Tabs defaultValue="grant-matching" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="grant-matching">Grant Matching</TabsTrigger>
          <TabsTrigger value="team-formation">Team Formation</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="content">Content Generation</TabsTrigger>
        </TabsList>

        {/* Grant Matching Tab */}
        <TabsContent value="grant-matching" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                AI-Powered Grant Matching
              </CardTitle>
              <CardDescription>
                Find the most relevant grant opportunities based on your profile and project goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label>Skills</Label>
                  {grantProfile.skills.map((skill, index) => (
                    <Input
                      key={index}
                      value={skill}
                      onChange={(e) => updateField('skills', index, e.target.value)}
                      placeholder="Enter a skill"
                    />
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addField('skills')}>
                    Add Skill
                  </Button>
                </div>
                
                <div className="space-y-3">
                  <Label>Interests</Label>
                  {grantProfile.interests.map((interest, index) => (
                    <Input
                      key={index}
                      value={interest}
                      onChange={(e) => updateField('interests', index, e.target.value)}
                      placeholder="Enter an interest"
                    />
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addField('interests')}>
                    Add Interest
                  </Button>
                </div>
              </div>
              
              <div className="space-y-3">
                <Label>Experience</Label>
                <Textarea
                  value={grantProfile.experience}
                  onChange={(e) => setGrantProfile(prev => ({ ...prev, experience: e.target.value }))}
                  placeholder="Describe your relevant experience"
                />
              </div>
              
              <div className="space-y-3">
                <Label>Project Goals</Label>
                <Textarea
                  value={grantProfile.projectGoals}
                  onChange={(e) => setGrantProfile(prev => ({ ...prev, projectGoals: e.target.value }))}
                  placeholder="Describe your project goals and objectives"
                />
              </div>
              
              <Button 
                onClick={handleGrantMatching}
                disabled={grantMatchingMutation.isPending}
                className="w-full"
              >
                {grantMatchingMutation.isPending ? 'Analyzing...' : 'Find Grant Matches'}
              </Button>
              
              {grantMatchingMutation.data && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Grant Matches Found:</h4>
                  <p className="text-sm text-muted-foreground">
                    Total matches: {grantMatchingMutation.data.data?.totalMatches || 0}
                  </p>
                  {grantMatchingMutation.data.data?.matches?.map((match: any, index: number) => (
                    <div key={index} className="mt-2 p-2 bg-background rounded border">
                      <div className="flex justify-between items-start">
                        <span className="font-medium">Grant #{match.grantId}</span>
                        <Badge>{Math.round(match.relevanceScore * 100)}% match</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{match.reasoning}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Formation Tab */}
        <TabsContent value="team-formation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Intelligent Team Formation
              </CardTitle>
              <CardDescription>
                Get AI recommendations for optimal team structure and roles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Label>Project Title</Label>
                  <Input
                    value={projectData.title}
                    onChange={(e) => setProjectData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter project title"
                  />
                </div>
                
                <div className="space-y-3">
                  <Label>Timeline</Label>
                  <Input
                    value={projectData.timeline}
                    onChange={(e) => setProjectData(prev => ({ ...prev, timeline: e.target.value }))}
                    placeholder="e.g., 6 months"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <Label>Project Description</Label>
                <Textarea
                  value={projectData.description}
                  onChange={(e) => setProjectData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your project"
                />
              </div>
              
              <div className="space-y-3">
                <Label>Required Skills</Label>
                {projectData.requiredSkills.map((skill, index) => (
                  <Input
                    key={index}
                    value={skill}
                    onChange={(e) => updateField('requiredSkills', index, e.target.value)}
                    placeholder="Enter required skill"
                  />
                ))}
                <Button variant="outline" size="sm" onClick={() => addField('requiredSkills')}>
                  Add Skill
                </Button>
              </div>
              
              <div className="space-y-3">
                <Label>Budget (optional)</Label>
                <Input
                  value={projectData.budget}
                  onChange={(e) => setProjectData(prev => ({ ...prev, budget: e.target.value }))}
                  placeholder="Enter budget amount"
                  type="number"
                />
              </div>
              
              <Button 
                onClick={handleTeamFormation}
                disabled={teamFormationMutation.isPending}
                className="w-full"
              >
                {teamFormationMutation.isPending ? 'Analyzing...' : 'Analyze Team Formation'}
              </Button>
              
              {teamFormationMutation.data && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Team Formation Analysis:</h4>
                  <div className="space-y-2">
                    <p><strong>Recommended Team Size:</strong> {teamFormationMutation.data.data?.recommendedTeamSize} members</p>
                    <div>
                      <strong>Role Recommendations:</strong>
                      {teamFormationMutation.data.data?.roleRecommendations?.map((role: any, index: number) => (
                        <div key={index} className="mt-2 p-2 bg-background rounded border">
                          <div className="flex justify-between items-start">
                            <span className="font-medium">{role.role}</span>
                            <Badge variant={role.priority === 'high' ? 'default' : 'secondary'}>
                              {role.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{role.reasoning}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {role.skills?.map((skill: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">{skill}</Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Project Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Project Optimization
              </CardTitle>
              <CardDescription>
                Get AI-powered recommendations to optimize your project performance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label>Current Project Status</Label>
                <Textarea
                  value={optimizationData.currentStatus}
                  onChange={(e) => setOptimizationData(prev => ({ ...prev, currentStatus: e.target.value }))}
                  placeholder="Describe the current state of your project"
                />
              </div>
              
              <div className="space-y-3">
                <Label>Project Goals</Label>
                {optimizationData.goals.map((goal, index) => (
                  <Input
                    key={index}
                    value={goal}
                    onChange={(e) => updateField('goals', index, e.target.value)}
                    placeholder="Enter a project goal"
                  />
                ))}
                <Button variant="outline" size="sm" onClick={() => addField('goals')}>
                  Add Goal
                </Button>
              </div>
              
              <div className="space-y-3">
                <Label>Current Challenges</Label>
                {optimizationData.challenges.map((challenge, index) => (
                  <Input
                    key={index}
                    value={challenge}
                    onChange={(e) => updateField('challenges', index, e.target.value)}
                    placeholder="Enter a challenge"
                  />
                ))}
                <Button variant="outline" size="sm" onClick={() => addField('challenges')}>
                  Add Challenge
                </Button>
              </div>
              
              <Button 
                onClick={handleProjectOptimization}
                disabled={optimizationMutation.isPending}
                className="w-full"
              >
                {optimizationMutation.isPending ? 'Optimizing...' : 'Optimize Project'}
              </Button>
              
              {optimizationMutation.data && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Optimization Recommendations:</h4>
                  {optimizationMutation.data.data?.optimizations?.map((opt: any, index: number) => (
                    <div key={index} className="mt-2 p-2 bg-background rounded border">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-medium">{opt.category}</span>
                        <div className="flex gap-1">
                          <Badge variant="outline">Impact: {opt.impact}</Badge>
                          <Badge variant="outline">Effort: {opt.effort}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{opt.recommendation}</p>
                    </div>
                  ))}
                  
                  {optimizationMutation.data.data?.priorityActions && (
                    <div className="mt-4">
                      <strong>Priority Actions:</strong>
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        {optimizationMutation.data.data.priorityActions.map((action: string, index: number) => (
                          <li key={index} className="text-sm">{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Generation Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                AI Content Generation
              </CardTitle>
              <CardDescription>
                Generate professional grant application content with AI assistance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  AI content generation creates comprehensive grant applications including executive summaries, 
                  technical approaches, and budget justifications.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={() => contentGenerationMutation.mutate({
                  grantType: "Research Grant",
                  projectSummary: "Sample project for demonstration",
                  teamCapabilities: ["AI", "Web3", "Research"],
                  fundingGoals: "Advance technological innovation"
                })}
                disabled={contentGenerationMutation.isPending}
                className="w-full"
              >
                {contentGenerationMutation.isPending ? 'Generating...' : 'Generate Sample Content'}
              </Button>
              
              {contentGenerationMutation.data && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Generated Content:</h4>
                  <div className="space-y-3">
                    {Object.entries(contentGenerationMutation.data.data || {}).map(([key, value]) => (
                      <div key={key}>
                        <Label className="text-sm font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </Label>
                        <div className="mt-1 p-2 bg-background rounded border text-sm">
                          {String(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}