import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Github, Star, GitFork, Code, Users, TrendingUp, ExternalLink } from "lucide-react";

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  language: string;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
}

interface TechnicalSkills {
  languages: { [key: string]: number };
  frameworks: string[];
  totalCommits: number;
  linesOfCode: number;
  repoCount: number;
  collaborationScore: number;
}

export default function GitHubIntegration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [githubUsername, setGithubUsername] = useState("");
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);

  // Get GitHub integration status
  const { data: status } = useQuery({
    queryKey: ["/api/github/status"],
  });

  // Connect GitHub account mutation
  const connectMutation = useMutation({
    mutationFn: async (username: string) => {
      const res = await apiRequest("POST", "/api/github/connect", { githubUsername: username });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "GitHub Connected",
        description: `Successfully connected ${data.data.user.login} with reputation bonus: +${data.data.reputationBonus} points`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setRepositories(data.data.repositories);
      setSkills(data.data.skills);
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Failed", 
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Import repository mutation
  const importMutation = useMutation({
    mutationFn: async (repoFullName: string) => {
      const res = await apiRequest("POST", "/api/github/import-repository", { repoFullName });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Repository Imported",
        description: "Successfully added to your HyperDAG projects",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Import Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [skills, setSkills] = useState<TechnicalSkills | null>(null);

  const handleConnect = () => {
    if (!githubUsername.trim()) {
      toast({
        title: "Username Required",
        description: "Please enter your GitHub username",
        variant: "destructive",
      });
      return;
    }
    connectMutation.mutate(githubUsername);
  };

  const handleImportRepo = (repoFullName: string) => {
    importMutation.mutate(repoFullName);
  };

  const formatLanguageSize = (bytes: number) => {
    if (bytes > 1000000) return `${(bytes / 1000000).toFixed(1)}MB`;
    if (bytes > 1000) return `${(bytes / 1000).toFixed(1)}KB`;
    return `${bytes}B`;
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
            <Github className="h-8 w-8" />
            GitHub Integration
          </h1>
          <p className="text-muted-foreground">
            Connect your GitHub account to boost reputation and import projects
          </p>
        </div>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Integration Status</CardTitle>
            <CardDescription>
              {status?.data?.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Features Available:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {status?.data?.features?.map((feature: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Next Steps:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {status?.data?.next_steps?.map((step: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-secondary rounded-full" />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection Form */}
        <Card>
          <CardHeader>
            <CardTitle>Connect GitHub Account</CardTitle>
            <CardDescription>
              Enter your GitHub username to verify technical skills and import repositories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Enter GitHub username"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleConnect}
                disabled={connectMutation.isPending}
              >
                {connectMutation.isPending ? "Connecting..." : "Connect"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Technical Skills Analysis */}
        {skills && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Technical Skills Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{skills.repoCount}</div>
                  <div className="text-sm text-muted-foreground">Repositories</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{(skills.linesOfCode / 1000).toFixed(1)}K</div>
                  <div className="text-sm text-muted-foreground">Lines of Code</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{skills.collaborationScore}</div>
                  <div className="text-sm text-muted-foreground">Collaboration Score</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Programming Languages:</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(skills.languages).map(([lang, bytes]) => (
                    <Badge key={lang} variant="secondary">
                      {lang} ({formatLanguageSize(bytes)})
                    </Badge>
                  ))}
                </div>
              </div>

              {skills.frameworks.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Frameworks & Technologies:</h4>
                  <div className="flex flex-wrap gap-2">
                    {skills.frameworks.map((framework) => (
                      <Badge key={framework} variant="outline">
                        {framework}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Repository Import */}
        {repositories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Import Repositories
              </CardTitle>
              <CardDescription>
                Select repositories to import as HyperDAG projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {repositories.map((repo) => (
                  <Card key={repo.id} className="border">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-medium">{repo.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {repo.description || "No description available"}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleImportRepo(repo.full_name)}
                            disabled={importMutation.isPending}
                          >
                            Import
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {repo.language && (
                            <Badge variant="outline" className="text-xs">
                              {repo.language}
                            </Badge>
                          )}
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3" />
                            {repo.stargazers_count}
                          </div>
                          <div className="flex items-center gap-1">
                            <GitFork className="h-3 w-3" />
                            {repo.forks_count}
                          </div>
                          <a
                            href={repo.html_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 hover:text-primary"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </a>
                        </div>

                        {repo.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {repo.topics.slice(0, 3).map((topic) => (
                              <Badge key={topic} variant="secondary" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                            {repo.topics.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{repo.topics.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}