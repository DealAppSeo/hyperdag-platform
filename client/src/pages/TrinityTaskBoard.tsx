import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Plus, Users, Brain, Database, User, Zap, Clock, Target, Network
} from 'lucide-react';
import { Link } from 'wouter';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';
type TaskEffort = 'easy' | 'moderate' | 'hard';
type TaskImpact = 'low' | 'medium' | 'high';
type Manager = 'User' | 'APM' | 'HDM' | 'Mel' | 'All';

interface TrinityTask {
  id: number;
  taskNumber: number;
  title: string;
  summary: string;
  rationale: string;
  priorityRank: number;
  status: TaskStatus;
  assignedManager: Manager;
  dependencies: number[];
  estimatedEffort: TaskEffort;
  impact: TaskImpact;
  saves: string[];
  improvesPerformance: boolean;
  getsOthersOnBoard: boolean;
  isAutonomous: boolean;
  verificationSteps: string[];
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskColumn {
  status: TaskStatus;
  title: string;
  color: string;
  icon: React.ReactNode;
}

const COLUMNS: TaskColumn[] = [
  { status: 'not_started', title: 'To Do', color: 'bg-gray-100 dark:bg-gray-800', icon: <Target className="w-4 h-4" /> },
  { status: 'in_progress', title: 'In Progress', color: 'bg-blue-100 dark:bg-blue-900', icon: <Zap className="w-4 h-4" /> },
  { status: 'completed', title: 'Completed', color: 'bg-green-100 dark:bg-green-900', icon: <Clock className="w-4 h-4" /> },
  { status: 'blocked', title: 'Blocked', color: 'bg-red-100 dark:bg-red-900', icon: <Users className="w-4 h-4" /> }
];

const MANAGERS: { id: Manager; name: string; icon: React.ReactNode; color: string }[] = [
  { id: 'User', name: 'You', icon: <User className="w-4 h-4" />, color: 'bg-purple-500' },
  { id: 'APM', name: 'AI-Prompt-Manager', icon: <Brain className="w-4 h-4" />, color: 'bg-blue-500' },
  { id: 'HDM', name: 'HyperDAGManager', icon: <Database className="w-4 h-4" />, color: 'bg-green-500' },
  { id: 'Mel', name: 'Mel (ImageBearerAI)', icon: <Zap className="w-4 h-4" />, color: 'bg-amber-500' },
  { id: 'All', name: 'All Managers', icon: <Users className="w-4 h-4" />, color: 'bg-gray-500' }
];

export default function TrinityTaskBoard() {
  const [selectedManager, setSelectedManager] = useState<Manager | 'all'>('all');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    summary: '',
    assignedManager: 'All' as Manager,
    estimatedEffort: 'moderate' as TaskEffort,
    impact: 'medium' as TaskImpact
  });

  // Fetch all tasks - NO POLLING, real-time only
  const { data: response, isLoading } = useQuery<{ success: boolean; data: TrinityTask[]; count: number }>({
    queryKey: ['/api/trinity/tasks']
    // ✅ NO refetchInterval - Supabase real-time handles updates
  });

  const tasks = response?.data || [];

  // ✅ REAL-TIME: Subscribe to trinity_tasks changes
  useEffect(() => {
    const channel = supabase
      .channel('trinity-tasks-realtime')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public',
          table: 'trinity_tasks' 
        },
        (payload) => {
          // Optimistic update: merge changes instantly
          queryClient.setQueryData<{ success: boolean; data: TrinityTask[]; count: number }>(
            ['/api/trinity/tasks'],
            (old) => {
              if (!old) return old;
              
              const { eventType, new: newRecord, old: oldRecord } = payload;
              let updatedTasks = [...(old.data || [])];
              
              if (eventType === 'INSERT' && newRecord) {
                updatedTasks.push(newRecord as TrinityTask);
              } else if (eventType === 'UPDATE' && newRecord) {
                const index = updatedTasks.findIndex(t => t.id === newRecord.id);
                if (index !== -1) {
                  updatedTasks[index] = newRecord as TrinityTask;
                }
              } else if (eventType === 'DELETE' && oldRecord) {
                updatedTasks = updatedTasks.filter(t => t.id !== oldRecord.id);
              }
              
              return {
                ...old,
                data: updatedTasks,
                count: updatedTasks.length
              };
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter by manager
  const filteredTasks = selectedManager === 'all' 
    ? tasks 
    : tasks.filter(t => t.assignedManager === selectedManager || t.assignedManager === 'All');

  // Status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ taskId, status }: { taskId: number; status: TaskStatus }) => {
      return apiRequest(`/api/trinity/tasks/${taskId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, actor: 'User' }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trinity/tasks'] });
    }
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (task: any) => {
      return apiRequest('/api/trinity/tasks', {
        method: 'POST',
        body: JSON.stringify({
          ...task,
          taskNumber: tasks.length + 1,
          priorityRank: tasks.length + 1,
          status: 'not_started',
          actor: 'User'
        }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trinity/tasks'] });
      setIsAddingTask(false);
      setNewTask({
        title: '',
        summary: '',
        assignedManager: 'All',
        estimatedEffort: 'moderate',
        impact: 'medium'
      });
    }
  });

  const getManagerBadge = (manager: Manager) => {
    const mgr = MANAGERS.find(m => m.id === manager);
    return mgr ? (
      <Badge className={`${mgr.color} text-white`}>
        <span className="flex items-center gap-1">
          {mgr.icon}
          {mgr.name}
        </span>
      </Badge>
    ) : null;
  };

  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData('taskId', taskId.toString());
  };

  const handleDrop = (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData('taskId'));
    updateStatusMutation.mutate({ taskId, status: newStatus });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-96 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 p-4 md:p-8">
      <div className="max-w-[1920px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" data-testid="heading-title">Trinity Task Board</h1>
            <p className="text-muted-foreground">
              Real-time collaboration across all Trinity Managers
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Manager Filter */}
            <Select value={selectedManager} onValueChange={(value) => setSelectedManager(value as Manager | 'all')}>
              <SelectTrigger className="w-[200px]" data-testid="select-manager-filter">
                <SelectValue placeholder="Filter by manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Managers</SelectItem>
                {MANAGERS.map(mgr => (
                  <SelectItem key={mgr.id} value={mgr.id}>
                    <span className="flex items-center gap-2">
                      {mgr.icon}
                      {mgr.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* HyperDAG v0.2 Button */}
            <Link href="/hyperdag">
              <Button variant="outline" className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10" data-testid="button-hyperdag">
                <Network className="w-4 h-4 mr-2" />
                HyperDAG
              </Button>
            </Link>

            {/* Add Task Button */}
            <Dialog open={isAddingTask} onOpenChange={setIsAddingTask}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-task">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Trinity Task</DialogTitle>
                  <DialogDescription>
                    Add a new task to the Trinity coordination system
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="Task title..."
                      data-testid="input-task-title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="summary">Summary</Label>
                    <Textarea
                      id="summary"
                      value={newTask.summary}
                      onChange={(e) => setNewTask({ ...newTask, summary: e.target.value })}
                      placeholder="Task description..."
                      data-testid="input-task-summary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="manager">Assign To</Label>
                    <Select 
                      value={newTask.assignedManager} 
                      onValueChange={(value) => setNewTask({ ...newTask, assignedManager: value as Manager })}
                    >
                      <SelectTrigger data-testid="select-task-manager">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MANAGERS.map(mgr => (
                          <SelectItem key={mgr.id} value={mgr.id}>
                            {mgr.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="effort">Effort</Label>
                      <Select 
                        value={newTask.estimatedEffort} 
                        onValueChange={(value) => setNewTask({ ...newTask, estimatedEffort: value as TaskEffort })}
                      >
                        <SelectTrigger data-testid="select-task-effort">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="impact">Impact</Label>
                      <Select 
                        value={newTask.impact} 
                        onValueChange={(value) => setNewTask({ ...newTask, impact: value as TaskImpact })}
                      >
                        <SelectTrigger data-testid="select-task-impact">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button 
                    onClick={() => createTaskMutation.mutate(newTask)}
                    disabled={!newTask.title || !newTask.summary}
                    data-testid="button-create-task"
                  >
                    Create Task
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {COLUMNS.map(col => {
            const count = filteredTasks.filter(t => t.status === col.status).length;
            return (
              <Card key={col.status}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-sm text-muted-foreground">{col.title}</p>
                    </div>
                    <div className={`p-3 rounded-full ${col.color}`}>
                      {col.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {COLUMNS.map(column => (
            <div
              key={column.status}
              className={`rounded-lg p-4 min-h-[600px] ${column.color}`}
              onDrop={(e) => handleDrop(e, column.status)}
              onDragOver={handleDragOver}
              data-testid={`column-${column.status}`}
            >
              <div className="flex items-center gap-2 mb-4">
                {column.icon}
                <h3 className="font-semibold">{column.title}</h3>
                <Badge variant="secondary">
                  {filteredTasks.filter(t => t.status === column.status).length}
                </Badge>
              </div>

              <div className="space-y-3">
                {filteredTasks
                  .filter(task => task.status === column.status)
                  .sort((a, b) => a.priorityRank - b.priorityRank)
                  .map(task => (
                    <Card
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="cursor-move hover:shadow-lg transition-shadow bg-white dark:bg-gray-900"
                      data-testid={`task-card-${task.id}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm">{task.title}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            #{task.taskNumber}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs line-clamp-2">
                          {task.summary}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        {getManagerBadge(task.assignedManager)}
                        <div className="flex items-center gap-2 text-xs">
                          <Badge variant="outline">{task.estimatedEffort}</Badge>
                          <Badge variant="outline">{task.impact} impact</Badge>
                        </div>
                        {task.isAutonomous && (
                          <Badge variant="secondary" className="text-xs">
                            <Zap className="w-3 h-3 mr-1" />
                            Autonomous
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {/* Activity Log */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Live updates from all Trinity Managers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">
              Real-time activity log coming soon...
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
