import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  Circle, 
  Loader2, 
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Users,
  Target,
  Zap,
  Clock
} from 'lucide-react';
import { useState } from 'react';

type TaskStatus = 'not_started' | 'in_progress' | 'completed' | 'blocked';
type TaskEffort = 'easy' | 'moderate' | 'hard';
type TaskImpact = 'low' | 'medium' | 'high';

interface TrinityTask {
  id: number;
  taskNumber: number;
  title: string;
  summary: string;
  rationale: string;
  priorityRank: number;
  status: TaskStatus;
  assignedManager: string;
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

export default function TrinityRoadmap() {
  const [selectedTask, setSelectedTask] = useState<TrinityTask | null>(null);

  // Fetch all tasks
  const { data: response, isLoading } = useQuery<{ success: boolean; data: TrinityTask[]; count: number }>({
    queryKey: ['/api/trinity/tasks'],
  });

  const tasks = response?.data || [];

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

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async ({ taskId, newPriority }: { taskId: number; newPriority: number }) => {
      return apiRequest(`/api/trinity/tasks/${taskId}/reorder`, {
        method: 'PATCH',
        body: JSON.stringify({ newPriority, actor: 'User' }),
        headers: { 'Content-Type': 'application/json' }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trinity/tasks'] });
    }
  });

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'in_progress':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'blocked':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: TaskStatus) => {
    const variants = {
      completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      blocked: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      not_started: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    };

    return (
      <Badge className={variants[status]} data-testid={`badge-status-${status}`}>
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  const getEffortBadge = (effort: TaskEffort) => {
    const variants = {
      easy: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
      moderate: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
      hard: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
    };

    return <Badge className={variants[effort]}>{effort}</Badge>;
  };

  const getImpactBadge = (impact: TaskImpact) => {
    const variants = {
      high: 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
      medium: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
      low: 'bg-gray-50 text-gray-700 dark:bg-gray-900 dark:text-gray-300'
    };

    return <Badge className={variants[impact]}>{impact} impact</Badge>;
  };

  const calculateProgress = () => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'completed').length;
    return Math.round((completed / tasks.length) * 100);
  };

  const handleStatusChange = (taskId: number, newStatus: TaskStatus) => {
    updateStatusMutation.mutate({ taskId, status: newStatus });
  };

  const handleReorder = (taskId: number, direction: 'up' | 'down') => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const newPriority = direction === 'up' ? task.priorityRank - 1 : task.priorityRank + 1;
    if (newPriority < 1 || newPriority > tasks.length) return;

    reorderMutation.mutate({ taskId, newPriority });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <div className="grid gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const progress = calculateProgress();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-blue-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-2" data-testid="text-title">
            Trinity Symphony Roadmap
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
            Distributed AI optimization platform - 12 prioritized tasks for autonomous zero-cost operation
          </p>

          {/* Progress Bar */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Overall Progress
                </span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                  {progress}%
                </span>
              </div>
              <Progress value={progress} className="h-2" data-testid="progress-overall" />
              <div className="flex gap-4 mt-4 text-sm text-slate-600 dark:text-slate-400">
                <span>Completed: {tasks.filter(t => t.status === 'completed').length}</span>
                <span>In Progress: {tasks.filter(t => t.status === 'in_progress').length}</span>
                <span>Not Started: {tasks.filter(t => t.status === 'not_started').length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Task List */}
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card 
              key={task.id} 
              className="hover:shadow-lg transition-shadow duration-200 border-2"
              data-testid={`card-task-${task.id}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(task.status)}
                      <CardTitle className="text-xl">
                        #{task.taskNumber}: {task.title}
                      </CardTitle>
                    </div>
                    <CardDescription className="text-base">
                      {task.summary}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleReorder(task.id, 'up')}
                      disabled={task.priorityRank === 1 || reorderMutation.isPending}
                      data-testid={`button-move-up-${task.id}`}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleReorder(task.id, 'down')}
                      disabled={task.priorityRank === tasks.length || reorderMutation.isPending}
                      data-testid={`button-move-down-${task.id}`}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {getStatusBadge(task.status)}
                  {getEffortBadge(task.estimatedEffort)}
                  {getImpactBadge(task.impact)}
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {task.assignedManager}
                  </Badge>
                  {task.isAutonomous && (
                    <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                      <Zap className="w-3 h-3 mr-1" />
                      Autonomous
                    </Badge>
                  )}
                </div>

                {/* Rationale */}
                <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
                  <strong>Rationale:</strong> {task.rationale}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {task.improvesPerformance && (
                    <Badge variant="secondary" className="text-xs">
                      <Target className="w-3 h-3 mr-1" />
                      Improves Performance
                    </Badge>
                  )}
                  {task.getsOthersOnBoard && (
                    <Badge variant="secondary" className="text-xs">
                      <Users className="w-3 h-3 mr-1" />
                      Gets Others On Board
                    </Badge>
                  )}
                  {task.saves.map((save, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      Saves {save}
                    </Badge>
                  ))}
                </div>

                {/* Verification Steps */}
                {task.verificationSteps.length > 0 && (
                  <details className="text-sm">
                    <summary className="cursor-pointer text-slate-600 dark:text-slate-400 font-medium mb-2">
                      Verification Steps ({task.verificationSteps.length})
                    </summary>
                    <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 ml-4">
                      {task.verificationSteps.map((step, idx) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ul>
                  </details>
                )}

                {/* Dependencies */}
                {task.dependencies.length > 0 && (
                  <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                    <Clock className="w-4 h-4 inline mr-1" />
                    <strong>Depends on:</strong> Task{task.dependencies.length > 1 ? 's' : ''} #{task.dependencies.join(', #')}
                  </div>
                )}
              </CardContent>

              <CardFooter className="flex gap-2">
                <Button
                  variant={task.status === 'not_started' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange(task.id, 'not_started')}
                  disabled={updateStatusMutation.isPending}
                  data-testid={`button-status-not-started-${task.id}`}
                >
                  Not Started
                </Button>
                <Button
                  variant={task.status === 'in_progress' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange(task.id, 'in_progress')}
                  disabled={updateStatusMutation.isPending}
                  data-testid={`button-status-in-progress-${task.id}`}
                >
                  In Progress
                </Button>
                <Button
                  variant={task.status === 'completed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange(task.id, 'completed')}
                  disabled={updateStatusMutation.isPending}
                  data-testid={`button-status-completed-${task.id}`}
                >
                  Completed
                </Button>
                <Button
                  variant={task.status === 'blocked' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => handleStatusChange(task.id, 'blocked')}
                  disabled={updateStatusMutation.isPending}
                  data-testid={`button-status-blocked-${task.id}`}
                >
                  Blocked
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>Trinity Symphony - Build-Measure-Learn with No-Downside Principle</p>
          <p className="mt-1">Autonomous AI optimization for zero-cost distributed systems</p>
        </div>
      </div>
    </div>
  );
}
