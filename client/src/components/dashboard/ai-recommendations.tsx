import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Loader2, Sparkles, Zap, Lightbulb } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Project } from "@shared/schema";

type Recommendation = {
  projectId: number;
  matchScore: number;
  reason: string;
};

interface AIRecommendationsProps {
  userId: number;
  showTitle?: boolean;
}

export default function AIRecommendations({ userId, showTitle = true }: AIRecommendationsProps) {
  const [activeTab, setActiveTab] = useState<"recommendations" | "ideas">("recommendations");
  
  const { data: recommendations, isLoading: isLoadingRecommendations } = useQuery({
    queryKey: ["/api/ai/recommendations"],
    enabled: activeTab === "recommendations",
  });

  const [interests, setInterests] = useState<string[]>(["blockchain", "web3", "decentralization"]);
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<any[] | null>(null);

  // Function to generate project ideas
  async function generateIdeas() {
    try {
      setIsGeneratingIdeas(true);
      const response = await fetch("/api/ai/project-ideas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ interests }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate ideas");
      }
      
      const data = await response.json();
      setGeneratedIdeas(data.ideas);
    } catch (error) {
      console.error("Error generating ideas:", error);
    } finally {
      setIsGeneratingIdeas(false);
    }
  }

  if (isLoadingRecommendations && activeTab === "recommendations") {
    return (
      <Card className="bg-white border border-gray-200 shadow">
        {showTitle && (
          <CardHeader className="border-b border-gray-200">
            <CardTitle className="flex items-center text-gray-800">
              <Sparkles className="h-5 w-5 mr-2 text-primary" />
              AI-Powered Insights
            </CardTitle>
            <CardDescription className="text-gray-600">Finding the best projects for you...</CardDescription>
          </CardHeader>
        )}
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 shadow">
      {showTitle && (
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="flex items-center text-gray-800">
            <Sparkles className="h-5 w-5 mr-2 text-primary" />
            AI-Powered Insights
          </CardTitle>
          <CardDescription className="text-gray-600">
            Personalized recommendations and ideas tailored to your profile
          </CardDescription>
          <div className="flex space-x-1 mt-2">
            <Button 
              variant={activeTab === "recommendations" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("recommendations")}
            >
              For You
            </Button>
            <Button 
              variant={activeTab === "ideas" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("ideas")}
            >
              Project Ideas
            </Button>
          </div>
        </CardHeader>
      )}

      <CardContent>
        {activeTab === "recommendations" && (
          <div className="space-y-4">
            {recommendations?.recommendations && recommendations.recommendations.length > 0 ? (
              recommendations.recommendations.map((rec: Recommendation) => (
                <div key={rec.projectId} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link href={`/projects/${rec.projectId}`}>
                        <h3 className="font-semibold text-primary hover:underline cursor-pointer">
                          {rec.projectId}
                        </h3>
                      </Link>
                      <div className="mt-1 mb-2">
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          {rec.matchScore}% Match
                        </span>
                      </div>
                    </div>
                    <Progress value={rec.matchScore} className="w-24" />
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{rec.reason}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-6">
                <Zap className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No recommendations found</p>
                <p className="text-sm text-gray-400 mt-1">Complete your profile to get personalized recommendations</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "ideas" && (
          <div>
            {!generatedIdeas && !isGeneratingIdeas ? (
              <div className="text-center py-6">
                <div className="mb-4">
                  <Lightbulb className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="font-medium">Generate AI Project Ideas</p>
                  <p className="text-sm text-gray-500 mt-1 mb-4">Based on your interests</p>
                  
                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    {interests.map((interest, index) => (
                      <Badge key={index} variant="outline">{interest}</Badge>
                    ))}
                  </div>
                </div>
                <Button onClick={generateIdeas}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Ideas
                </Button>
              </div>
            ) : isGeneratingIdeas ? (
              <div className="text-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-gray-500">Generating creative project ideas...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {generatedIdeas && generatedIdeas.map((idea, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-primary mb-1">{idea.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{idea.description}</p>
                    
                    <div className="flex flex-wrap gap-1 mb-2">
                      {idea.categories && idea.categories.map((category: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">{category}</Badge>
                      ))}
                    </div>
                    
                    <div className="text-xs text-gray-500 flex items-center justify-between">
                      <span>Funding: {idea.fundingGoal}</span>
                      <Button size="sm" variant="ghost" className="text-xs" asChild>
                        <Link href="/create-project">
                          Create Project
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="text-center mt-6">
                  <Button variant="outline" size="sm" onClick={generateIdeas}>
                    <Sparkles className="mr-2 h-3 w-3" />
                    Generate New Ideas
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
