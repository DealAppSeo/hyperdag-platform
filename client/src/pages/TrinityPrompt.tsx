import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Send, CheckCircle2, Clock, XCircle, Zap, Network } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Link } from 'wouter';

interface TrinityPromptResponse {
  promptId: number;
  status: string;
  managersInvolved: {
    managerId: string;
    managerName: string;
    capabilities: string[];
    responseId: number;
  }[];
  message: string;
}

interface PromptDetail {
  prompt: {
    id: number;
    promptText: string;
    status: string;
    priority: string;
    createdAt: string;
  };
  responses: {
    id: number;
    managerId: string;
    status: string;
    response: string | null;
    aiProvider: string | null;
    cost: string;
    executionTimeMs: number | null;
  }[];
  summary: {
    totalManagers: number;
    respondedCount: number;
    processingCount: number;
    failedCount: number;
    totalCost: number;
    avgResponseTime: number;
  };
}

export default function TrinityPrompt() {
  const [promptText, setPromptText] = useState("");
  const [currentPromptId, setCurrentPromptId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Submit prompt mutation
  const submitPrompt = useMutation({
    mutationFn: async (text: string) => {
      const res = await apiRequest("/api/trinity/prompt", {
        method: "POST",
        body: JSON.stringify({ promptText: text, priority: "normal" }),
      });
      return res.data as TrinityPromptResponse;
    },
    onSuccess: (data) => {
      setCurrentPromptId(data.promptId);
      setPromptText("");
      toast({
        title: "Prompt Distributed! 🎯",
        description: `Sent to ${data.managersInvolved.length} managers. Processing with free AI providers...`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trinity/prompts'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Submit",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // ✅ REAL-TIME: Current prompt status (NO 2s polling!)
  const { data: promptDetailRes } = useQuery({
    queryKey: ['/api/trinity/prompt', currentPromptId],
    enabled: !!currentPromptId
    // ✅ NO refetchInterval - Supabase handles updates
  });
  const promptDetail = promptDetailRes?.data as PromptDetail | undefined;

  // ✅ REAL-TIME: Recent prompts (NO 5s polling!)
  const { data: recentPromptsRes } = useQuery({
    queryKey: ['/api/trinity/prompts']
    // ✅ NO refetchInterval - Supabase handles updates
  });
  const recentPrompts = (recentPromptsRes?.data as any[]) || [];

  // ✅ REAL-TIME: Subscribe to trinity_prompts changes
  useEffect(() => {
    const promptsChannel = supabase
      .channel('trinity-prompts-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trinity_prompts' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['/api/trinity/prompts'] });
          if (currentPromptId) {
            queryClient.invalidateQueries({ queryKey: ['/api/trinity/prompt', currentPromptId] });
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(promptsChannel);
  }, [currentPromptId, queryClient]);

  // ✅ REAL-TIME: Subscribe to trinity_prompt_responses changes
  useEffect(() => {
    if (!currentPromptId) return;

    const responsesChannel = supabase
      .channel('trinity-responses-realtime')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'trinity_prompt_responses',
          filter: `promptId=eq.${currentPromptId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['/api/trinity/prompt', currentPromptId] });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(responsesChannel);
  }, [currentPromptId, queryClient]);

  const handleSubmit = () => {
    if (promptText.trim()) {
      submitPrompt.mutate(promptText.trim());
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'processing':
      case 'acknowledged':
        return <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getManagerColor = (managerId: string) => {
    switch (managerId) {
      case 'APM':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'HDM':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
      case 'Mel':
        return 'bg-pink-500/20 text-pink-400 border-pink-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Trinity Prompt Distribution
            </h1>
            <div className="flex-1 flex justify-end">
              <Link href="/hyperdag">
                <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10" data-testid="button-hyperdag">
                  <Network className="w-4 h-4 mr-2" />
                  HyperDAG
                </Button>
              </Link>
            </div>
          </div>
          <p className="text-white/70">
            One prompt → All three managers → Autonomous AI coordination
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-white/60">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span>Using free AI providers (Groq, Gemini, HuggingFace)</span>
          </div>
        </div>

        {/* Input Card */}
        <Card className="bg-white/10 border-white/20" data-testid="prompt-input-card">
          <CardHeader>
            <CardTitle className="text-white">Submit Your Prompt</CardTitle>
            <CardDescription className="text-white/70">
              Describe what you want the Trinity to build or analyze
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Example: Build a user authentication system with email/password and RepID integration..."
              className="min-h-[120px] bg-white/5 border-white/20 text-white placeholder:text-white/50"
              data-testid="input-prompt"
            />
            <Button
              onClick={handleSubmit}
              disabled={!promptText.trim() || submitPrompt.isPending}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              data-testid="button-submit-prompt"
            >
              {submitPrompt.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Distributing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send to Trinity
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Current Prompt Status */}
        {currentPromptId && promptDetail && (
          <Card className="bg-white/10 border-white/20" data-testid="prompt-status-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Live Processing</CardTitle>
                <Badge className={`${
                  promptDetail.prompt.status === 'completed' ? 'bg-green-500/20 text-green-400'
                  : promptDetail.prompt.status === 'failed' ? 'bg-red-500/20 text-red-400'
                  : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {promptDetail.prompt.status}
                </Badge>
              </div>
              <CardDescription className="text-white/70 text-sm">
                {promptDetail.prompt.promptText}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-white/5 rounded-lg">
                <div>
                  <div className="text-xs text-white/60">Total Managers</div>
                  <div className="text-2xl font-bold">{promptDetail.summary.totalManagers}</div>
                </div>
                <div>
                  <div className="text-xs text-white/60">Completed</div>
                  <div className="text-2xl font-bold text-green-400">{promptDetail.summary.respondedCount}</div>
                </div>
                <div>
                  <div className="text-xs text-white/60">Processing</div>
                  <div className="text-2xl font-bold text-yellow-400">{promptDetail.summary.processingCount}</div>
                </div>
                <div>
                  <div className="text-xs text-white/60">Total Cost</div>
                  <div className="text-2xl font-bold text-blue-400">${promptDetail.summary.totalCost.toFixed(6)}</div>
                </div>
                <div>
                  <div className="text-xs text-white/60">Avg Time</div>
                  <div className="text-2xl font-bold">{promptDetail.summary.avgResponseTime.toFixed(0)}ms</div>
                </div>
              </div>

              {/* Manager Responses */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-white/80">Manager Responses:</h3>
                {promptDetail.responses.map((response) => (
                  <div
                    key={response.id}
                    className="p-4 bg-white/5 rounded-lg border border-white/10"
                    data-testid={`response-${response.managerId}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge className={`${getManagerColor(response.managerId)} border`}>
                          {response.managerId}
                        </Badge>
                        {getStatusIcon(response.status)}
                        <span className="text-xs text-white/60">{response.status}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-white/60">
                        {response.aiProvider && (
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            {response.aiProvider}
                          </span>
                        )}
                        {response.cost && (
                          <span>${parseFloat(response.cost).toFixed(6)}</span>
                        )}
                        {response.executionTimeMs && (
                          <span>{response.executionTimeMs}ms</span>
                        )}
                      </div>
                    </div>
                    {response.response && (
                      <div className="text-sm text-white/80 bg-white/5 p-3 rounded mt-2">
                        {response.response}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Prompts */}
        {recentPrompts && recentPrompts.length > 0 && (
          <Card className="bg-white/10 border-white/20">
            <CardHeader>
              <CardTitle className="text-white">Recent Prompts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentPrompts.slice(0, 5).map((prompt: any) => (
                  <div
                    key={prompt.id}
                    onClick={() => setCurrentPromptId(prompt.id)}
                    className="p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer border border-white/10 transition-colors"
                    data-testid={`prompt-${prompt.id}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Badge className="text-xs">#{prompt.id}</Badge>
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        {getStatusIcon(prompt.status)}
                        <span>{prompt.completed}/{prompt.responses} managers</span>
                      </div>
                    </div>
                    <div className="text-sm text-white/80 truncate">
                      {prompt.promptText}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
