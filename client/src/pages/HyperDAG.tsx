import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/lib/supabase';
import { Network, Database, Brain, Zap, Activity, TrendingUp, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface HyperdagNode {
  id: number;
  nodeId: string;
  nodeType: 'manager' | 'task' | 'prompt' | 'resource' | 'chaos';
  label: string;
  description?: string;
  x?: string;
  y?: string;
  status: 'active' | 'processing' | 'idle' | 'error';
  health?: string;
  connectedTo: string[];
  metrics: {
    tasksCompleted?: number;
    avgResponseTime?: number;
    cost?: string;
    errorRate?: number;
    lastActive?: string;
  };
  keywords: string[];
  boostFactor?: string;
  createdAt: string;
  updatedAt: string;
}

export default function HyperDAG() {
  const [isAddingNode, setIsAddingNode] = useState(false);
  const [newNode, setNewNode] = useState({
    nodeId: '',
    nodeType: 'manager' as const,
    label: '',
    description: '',
    keywords: [] as string[]
  });
  const [keywordInput, setKeywordInput] = useState('');

  // ✅ REAL-TIME: Fetch all nodes (NO polling!)
  const { data: response, isLoading } = useQuery<{ success: boolean; data: HyperdagNode[]; count: number }>({
    queryKey: ['/api/hyperdag/nodes']
    // ✅ NO refetchInterval - Supabase real-time handles updates
  });

  const { data: statsResponse } = useQuery<{ success: boolean; data: any }>({
    queryKey: ['/api/hyperdag/stats']
  });

  const nodes = response?.data || [];
  const stats = statsResponse?.data || {};

  // ✅ REAL-TIME: Subscribe to hyperdag_nodes changes
  useEffect(() => {
    const channel = supabase
      .channel('hyperdag-nodes-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'hyperdag_nodes'
        },
        (payload) => {
          // Optimistic update: merge changes instantly
          queryClient.setQueryData<{ success: boolean; data: HyperdagNode[]; count: number }>(
            ['/api/hyperdag/nodes'],
            (old) => {
              if (!old) return old;

              const { eventType, new: newRecord, old: oldRecord } = payload;
              let updatedNodes = [...(old.data || [])];

              if (eventType === 'INSERT' && newRecord) {
                updatedNodes.push(newRecord as HyperdagNode);
              } else if (eventType === 'UPDATE' && newRecord) {
                const index = updatedNodes.findIndex(n => n.id === newRecord.id);
                if (index !== -1) {
                  updatedNodes[index] = newRecord as HyperdagNode;
                }
              } else if (eventType === 'DELETE' && oldRecord) {
                updatedNodes = updatedNodes.filter(n => n.id !== oldRecord.id);
              }

              return {
                ...old,
                data: updatedNodes,
                count: updatedNodes.length
              };
            }
          );
          queryClient.invalidateQueries({ queryKey: ['/api/hyperdag/stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Create node mutation
  const createNodeMutation = useMutation({
    mutationFn: async (node: any) => {
      return apiRequest('/api/hyperdag/nodes', {
        method: 'POST',
        body: JSON.stringify(node),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hyperdag/nodes'] });
      queryClient.invalidateQueries({ queryKey: ['/api/hyperdag/stats'] });
      setIsAddingNode(false);
      setNewNode({
        nodeId: '',
        nodeType: 'manager',
        label: '',
        description: '',
        keywords: []
      });
      setKeywordInput('');
    }
  });

  const handleAddNode = () => {
    if (!newNode.nodeId || !newNode.label) return;
    createNodeMutation.mutate(newNode);
  };

  const addKeyword = () => {
    if (!keywordInput.trim()) return;
    setNewNode({
      ...newNode,
      keywords: [...newNode.keywords, keywordInput.trim()]
    });
    setKeywordInput('');
  };

  const removeKeyword = (keyword: string) => {
    setNewNode({
      ...newNode,
      keywords: newNode.keywords.filter(k => k !== keyword)
    });
  };

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'manager': return <Brain className="w-5 h-5" />;
      case 'task': return <Activity className="w-5 h-5" />;
      case 'prompt': return <Zap className="w-5 h-5" />;
      case 'resource': return <Database className="w-5 h-5" />;
      case 'chaos': return <Network className="w-5 h-5" />;
      default: return <Network className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'processing': return 'bg-blue-500/20 text-blue-400 border-blue-500/50 animate-pulse';
      case 'idle': return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
      case 'error': return 'bg-red-500/20 text-red-400 border-red-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getBoostIndicator = (boostFactor?: string) => {
    const boost = parseFloat(boostFactor || '1.0');
    if (boost >= 2.0) return '🔥🔥'; // Double boost
    if (boost >= 1.5) return '🔥'; // 50% boost
    return '';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
        <Skeleton className="h-12 w-64 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
              <Network className="w-8 h-8 text-purple-400" />
              HyperDAG v0.2
            </h1>
            <p className="text-white/60 mt-2">Real-time distributed graph with ANFIS routing</p>
          </div>
          
          <Dialog open={isAddingNode} onOpenChange={setIsAddingNode}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-node" className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
                <Plus className="w-4 h-4 mr-2" />
                Add Node
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-800 text-white border-white/20">
              <DialogHeader>
                <DialogTitle>Create New HyperDAG Node</DialogTitle>
                <DialogDescription className="text-white/60">
                  Add a new node to the distributed graph. Keywords "chaos" and "graph" trigger ANFIS boost.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="nodeId">Node ID</Label>
                  <Input
                    id="nodeId"
                    data-testid="input-node-id"
                    placeholder="APM-1, HDM-2, etc."
                    value={newNode.nodeId}
                    onChange={(e) => setNewNode({ ...newNode, nodeId: e.target.value })}
                    className="bg-slate-700 border-white/20"
                  />
                </div>
                
                <div>
                  <Label htmlFor="label">Label</Label>
                  <Input
                    id="label"
                    data-testid="input-label"
                    placeholder="Display name"
                    value={newNode.label}
                    onChange={(e) => setNewNode({ ...newNode, label: e.target.value })}
                    className="bg-slate-700 border-white/20"
                  />
                </div>
                
                <div>
                  <Label htmlFor="nodeType">Node Type</Label>
                  <Select value={newNode.nodeType} onValueChange={(value: any) => setNewNode({ ...newNode, nodeType: value })}>
                    <SelectTrigger data-testid="select-node-type" className="bg-slate-700 border-white/20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20">
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="prompt">Prompt</SelectItem>
                      <SelectItem value="resource">Resource</SelectItem>
                      <SelectItem value="chaos">Chaos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    data-testid="input-description"
                    placeholder="Node description"
                    value={newNode.description}
                    onChange={(e) => setNewNode({ ...newNode, description: e.target.value })}
                    className="bg-slate-700 border-white/20"
                  />
                </div>
                
                <div>
                  <Label htmlFor="keywords">Keywords (ANFIS Boost)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="keywords"
                      data-testid="input-keywords"
                      placeholder="chaos, graph, etc."
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                      className="bg-slate-700 border-white/20"
                    />
                    <Button type="button" onClick={addKeyword} variant="outline" className="border-white/20">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newNode.keywords.map((keyword) => (
                      <Badge
                        key={keyword}
                        variant="outline"
                        className="cursor-pointer hover:bg-red-500/20"
                        onClick={() => removeKeyword(keyword)}
                      >
                        {keyword} {(keyword === 'chaos' || keyword === 'graph') && '🔥'}
                      </Badge>
                    ))}
                  </div>
                  {(newNode.keywords.includes('chaos') || newNode.keywords.includes('graph')) && (
                    <p className="text-xs text-purple-400 mt-2">
                      ⚡ ANFIS Boost: {newNode.keywords.includes('chaos') && newNode.keywords.includes('graph') ? '2.0x' : '1.5x'}
                    </p>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button
                  data-testid="button-create-node"
                  onClick={handleAddNode}
                  disabled={!newNode.nodeId || !newNode.label || createNodeMutation.isPending}
                  className="bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  {createNodeMutation.isPending ? 'Creating...' : 'Create Node'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Total Nodes</p>
                  <p className="text-3xl font-bold text-white" data-testid="text-total-nodes">{stats.totalNodes || 0}</p>
                </div>
                <Network className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Active Nodes</p>
                  <p className="text-3xl font-bold text-green-400" data-testid="text-active-nodes">{stats.activeNodes || 0}</p>
                </div>
                <Activity className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Avg Health</p>
                  <p className="text-3xl font-bold text-blue-400" data-testid="text-avg-health">
                    {stats.avgHealth ? Math.round(parseFloat(stats.avgHealth)) : 0}%
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Avg ANFIS Boost</p>
                  <p className="text-3xl font-bold text-purple-400" data-testid="text-avg-boost">
                    {stats.avgBoost ? parseFloat(stats.avgBoost).toFixed(1) : '1.0'}x
                  </p>
                </div>
                <Zap className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Nodes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {nodes.map((node) => (
            <Card key={node.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-all" data-testid={`card-node-${node.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getNodeIcon(node.nodeType)}
                    <div>
                      <CardTitle className="text-white text-lg">{node.label}</CardTitle>
                      <p className="text-white/60 text-sm">{node.nodeId}</p>
                    </div>
                  </div>
                  <Badge className={getStatusColor(node.status)}>{node.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {node.description && (
                  <p className="text-white/70 text-sm mb-4">{node.description}</p>
                )}
                
                <div className="space-y-2">
                  {node.health && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Health</span>
                      <span className="text-white">{Math.round(parseFloat(node.health))}%</span>
                    </div>
                  )}
                  
                  {node.boostFactor && parseFloat(node.boostFactor) > 1.0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">ANFIS Boost</span>
                      <span className="text-purple-400 font-bold">
                        {parseFloat(node.boostFactor).toFixed(1)}x {getBoostIndicator(node.boostFactor)}
                      </span>
                    </div>
                  )}
                  
                  {node.metrics?.tasksCompleted !== undefined && (
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Tasks Completed</span>
                      <span className="text-white">{node.metrics.tasksCompleted}</span>
                    </div>
                  )}
                  
                  {node.connectedTo && node.connectedTo.length > 0 && (
                    <div className="mt-3">
                      <span className="text-white/60 text-xs">Connected to:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {node.connectedTo.map((targetId) => (
                          <Badge key={targetId} variant="outline" className="text-xs border-white/20">
                            {targetId}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {node.keywords && node.keywords.length > 0 && (
                    <div className="mt-3">
                      <span className="text-white/60 text-xs">Keywords:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {node.keywords.map((keyword) => (
                          <Badge
                            key={keyword}
                            variant="outline"
                            className={`text-xs ${
                              keyword === 'chaos' || keyword === 'graph'
                                ? 'border-purple-400 text-purple-400'
                                : 'border-white/20'
                            }`}
                          >
                            {keyword} {(keyword === 'chaos' || keyword === 'graph') && '🔥'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {nodes.length === 0 && (
          <Card className="bg-white/5 border-white/10 p-12">
            <div className="text-center">
              <Network className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No nodes yet</h3>
              <p className="text-white/60 mb-6">Create your first HyperDAG node to get started</p>
              <Button
                onClick={() => setIsAddingNode(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-500"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Node
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
