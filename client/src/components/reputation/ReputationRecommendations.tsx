import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { SquareUser, Lightbulb, Users, Sparkles, Info, ArrowRight } from "lucide-react";
import { useLocation } from 'wouter';

interface TeamSuggestion {
  id: number;
  username: string;
  persona: string;
  reputationScore: number;
  skills: string[];
  interests: string[];
}

interface Project {
  id: number;
  title: string;
  description: string;
  categories: string[];
  status: string;
}

interface Grant {
  id: number;
  name: string;
  description: string;
  amount: number;
  categories: string[];
}

interface RecommendationData {
  projects: Project[];
  grants: Grant[];
  teamSuggestions: TeamSuggestion[];
}

export function ReputationRecommendations() {
  const [, setLocation] = useLocation();
  
  const { data, isLoading, error } = useQuery<RecommendationData>({
    queryKey: ["/api/reputation/recommendations"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="mr-2 h-5 w-5" />
            Reputation-Based Recommendations
          </CardTitle>
          <CardDescription>
            Personalized opportunities based on your reputation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Lightbulb className="mr-2 h-5 w-5" />
            Reputation-Based Recommendations
          </CardTitle>
          <CardDescription>
            Personalized opportunities based on your reputation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center py-6 text-center">
            <Info className="h-12 w-12 text-muted-foreground opacity-50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Unable to load recommendations. Please try again later.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Safely destructure with default empty arrays to prevent null/undefined errors
  const { projects = [], grants = [], teamSuggestions = [] } = data || {};
  const hasRecommendations = (projects?.length || 0) > 0 || (grants?.length || 0) > 0 || (teamSuggestions?.length || 0) > 0;

  const getPersonaColor = (persona: string) => {
    switch (persona.toLowerCase()) {
      case 'developer': return 'text-blue-500';
      case 'designer': return 'text-orange-500';
      case 'influencer': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  const getPersonaIcon = (persona: string) => {
    return SquareUser;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Lightbulb className="mr-2 h-5 w-5" />
          Reputation-Based Recommendations
        </CardTitle>
        <CardDescription>
          Personalized opportunities based on your reputation
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasRecommendations ? (
          <div className="text-center py-4">
            <Sparkles className="mx-auto h-10 w-10 text-muted-foreground opacity-50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No personalized recommendations available yet. Continue building your reputation to unlock opportunities.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {teamSuggestions.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-2" /> Recommended Collaborators
                </h3>
                <ScrollArea className="h-48">
                  <div className="space-y-3">
                    {teamSuggestions.map(user => {
                      const PersonaIcon = getPersonaIcon(user.persona);
                      const personaColor = getPersonaColor(user.persona);
                      
                      return (
                        <div key={user.id} className="flex items-center space-x-3 p-2 rounded-md border">
                          <Avatar>
                            <AvatarFallback className={personaColor}>
                              <PersonaIcon className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center">
                              <p className="text-sm font-medium truncate">{user.username}</p>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {user.persona}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(user.skills || []).slice(0, 3).map((skill, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {(user.skills?.length || 0) > 3 && (
                                <Badge variant="secondary" className="text-xs">+{user.skills.length - 3}</Badge>
                              )}
                            </div>
                          </div>
                          <Button size="sm" variant="ghost">
                            Connect
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}

            {projects.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Recommended Projects</h3>
                <ScrollArea className="h-48">
                  <div className="space-y-3">
                    {projects.map(project => (
                      <div key={project.id} className="p-3 border rounded-md">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-medium">{project.title}</h4>
                          <Badge variant="outline">{project.status}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(project.categories || []).slice(0, 3).map((category, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                        </div>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="px-0 mt-2"
                          onClick={() => setLocation(`/projects/${project.id}`)}
                        >
                          View Project <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {grants.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-3">Matching Grants</h3>
                <ScrollArea className="h-48">
                  <div className="space-y-3">
                    {grants.map(grant => (
                      <div key={grant.id} className="p-3 border rounded-md">
                        <div className="flex justify-between items-start">
                          <h4 className="text-sm font-medium">{grant.name}</h4>
                          <Badge variant="outline">${grant.amount.toLocaleString()}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{grant.description}</p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(grant.categories || []).slice(0, 3).map((category, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {category}
                            </Badge>
                          ))}
                        </div>
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="px-0 mt-2"
                          onClick={() => setLocation(`/grants/${grant.id}`)}
                        >
                          Apply for Grant <ArrowRight className="ml-1 h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}