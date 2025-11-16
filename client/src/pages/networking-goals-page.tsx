import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, Plus, Target, Award, Trash2, Edit, Settings, Zap, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { NetworkingGoal, InsertNetworkingGoal } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

type GoalFormData = {
  title: string;
  description: string;
  category: string;
  targetValue: number; 
  unit: string;
  priority: string;
  deadline?: Date;
  recurring: boolean;
  recurringPeriod?: string;
  visibility: string;
  tags: string[];
};

type GoalProgressFormData = {
  value: number;
  notes?: string;
};

const initialFormData: GoalFormData = {
  title: "",
  description: "",
  category: "Networking",
  targetValue: 5,
  unit: "Connections",
  priority: "medium",
  recurring: false,
  visibility: "private",
  tags: []
};

export default function NetworkingGoalsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [formData, setFormData] = useState<GoalFormData>(initialFormData);
  const [progressForm, setProgressForm] = useState<{ [key: number]: GoalProgressFormData }>({});
  const [isAddingSuggested, setIsAddingSuggested] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("active");
  const [tagInput, setTagInput] = useState("");

  // Fetch user's goals
  const { data: goalsData, isLoading: isLoadingGoals } = useQuery({
    queryKey: ["/api/networking/goals"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/networking/goals");
      return res.json();
    }
  });

  // Fetch goal suggestions
  const { data: suggestionsData, isLoading: isLoadingSuggestions } = useQuery({
    queryKey: ["/api/networking/goals/suggestions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/networking/goals/suggestions");
      return res.json();
    }
  });

  // Create a new goal
  const createGoalMutation = useMutation({
    mutationFn: async (goalData: Partial<InsertNetworkingGoal>) => {
      const res = await apiRequest("POST", "/api/networking/goals", goalData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/networking/goals"] });
      setIsAddingGoal(false);
      setIsAddingSuggested(false);
      setFormData(initialFormData);
      toast({
        title: "Goal created",
        description: "Your networking goal has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create goal",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  });

  // Delete a goal
  const deleteGoalMutation = useMutation({
    mutationFn: async (goalId: number) => {
      const res = await apiRequest("DELETE", `/api/networking/goals/${goalId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/networking/goals"] });
      toast({
        title: "Goal deleted",
        description: "Your networking goal has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete goal",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  });

  // Add progress to a goal
  const addProgressMutation = useMutation({
    mutationFn: async ({ goalId, progressData }: { goalId: number, progressData: GoalProgressFormData }) => {
      const res = await apiRequest("POST", `/api/networking/goals/${goalId}/progress`, progressData);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/networking/goals"] });
      // Clear the form
      setProgressForm({});
      
      // Show toast with reward info if applicable
      if (data.data.reward) {
        toast({
          title: "Progress recorded with rewards! 🎉",
          description: `You earned ${data.data.progress.rewardPoints} points and ${data.data.progress.rewardTokens} tokens!`,
          variant: "success",
        });
      } else {
        toast({
          title: "Progress recorded",
          description: "Your progress has been recorded successfully.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Failed to record progress",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  });

  // Handle form submission for creating a new goal
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createGoalMutation.mutate({
      ...formData,
      tags: formData.tags,
      targetValue: Number(formData.targetValue),
      deadline: formData.deadline ? new Date(formData.deadline) : undefined,
    });
  };

  // Handle using a suggested goal
  const handleUseSuggestion = () => {
    if (!selectedSuggestion) return;
    
    createGoalMutation.mutate({
      ...selectedSuggestion,
      aiGenerated: true,
    });
  };

  // Handle adding progress to a goal
  const handleAddProgress = (goalId: number) => {
    const data = progressForm[goalId];
    if (!data || !data.value) {
      toast({
        title: "Invalid progress",
        description: "Please enter a valid progress value",
        variant: "destructive",
      });
      return;
    }
    
    addProgressMutation.mutate({
      goalId,
      progressData: {
        value: Number(data.value),
        notes: data.notes
      }
    });
  };

  // Handle adding a tag
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Filter goals based on active tab
  const filterGoals = (goals: NetworkingGoal[] = []) => {
    if (activeTab === "active") {
      return goals.filter(goal => goal.status !== "completed" && goal.status !== "archived");
    } else if (activeTab === "completed") {
      return goals.filter(goal => goal.status === "completed");
    } else {
      return goals.filter(goal => goal.status === "archived");
    }
  };

  // Calculate progress percentage
  const calculateProgress = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };
  
  // Get color based on priority
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-blue-500';
    }
  };

  // Get color based on category
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Networking': return 'bg-violet-500';
      case 'Learning': return 'bg-cyan-500';
      case 'Collaborating': return 'bg-emerald-500';
      case 'Building': return 'bg-amber-500';
      case 'Funding': return 'bg-rose-500';
      default: return 'bg-gray-500';
    }
  };

  // Get appropriate icon for a category
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Networking': return <Target className="h-5 w-5 mr-1" />;
      case 'Learning': return <Settings className="h-5 w-5 mr-1" />;
      case 'Collaborating': return <Zap className="h-5 w-5 mr-1" />;
      case 'Building': return <Award className="h-5 w-5 mr-1" />;
      case 'Funding': return <Sparkles className="h-5 w-5 mr-1" />;
      default: return <Target className="h-5 w-5 mr-1" />;
    }
  };

  // Reset form when switching between adding modes
  useEffect(() => {
    if (!isAddingGoal && !isAddingSuggested) {
      setFormData(initialFormData);
      setSelectedSuggestion(null);
    }
  }, [isAddingGoal, isAddingSuggested]);

  if (!user) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Login Required</h1>
          <p>Please login to view and manage your networking goals.</p>
        </div>
      </div>
    );
  }

  const filteredGoals = filterGoals(goalsData?.data || []);
  const suggestions = suggestionsData?.data || [];

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Networking Goals</h1>
          <p className="text-muted-foreground">
            Set and achieve your professional networking goals
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAddingSuggested} onOpenChange={setIsAddingSuggested}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Sparkles className="h-4 w-4 mr-2" />
                Suggested Goals
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Suggested Goals</DialogTitle>
                <DialogDescription>
                  Choose from AI-generated goal suggestions based on your profile and interests.
                </DialogDescription>
              </DialogHeader>
              
              {isLoadingSuggestions ? (
                <div className="flex justify-center my-4">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="grid gap-4 max-h-[400px] overflow-y-auto py-4">
                  {suggestions.map((suggestion, index) => (
                    <Card key={index} className={`cursor-pointer border-2 ${selectedSuggestion === suggestion ? 'border-primary' : 'border-border'}`}
                         onClick={() => setSelectedSuggestion(suggestion)}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{suggestion.title}</CardTitle>
                          <Badge variant="outline" className={`${getCategoryColor(suggestion.category)} text-white`}>
                            {suggestion.category}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                        <div className="flex items-center mt-2">
                          <span className="text-sm font-medium">Target: {suggestion.targetValue} {suggestion.unit}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingSuggested(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUseSuggestion} disabled={!selectedSuggestion || createGoalMutation.isPending}>
                  {createGoalMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Use Suggestion
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isAddingGoal} onOpenChange={setIsAddingGoal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Create New Networking Goal</DialogTitle>
                <DialogDescription>
                  Set a specific, measurable goal to enhance your professional connections.
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Goal Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      placeholder="e.g., Connect with 5 AI researchers"
                      required
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="Describe your goal and why it matters to you"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => setFormData({...formData, category: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Networking">Networking</SelectItem>
                          <SelectItem value="Learning">Learning</SelectItem>
                          <SelectItem value="Collaborating">Collaborating</SelectItem>
                          <SelectItem value="Building">Building</SelectItem>
                          <SelectItem value="Funding">Funding</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select 
                        value={formData.priority} 
                        onValueChange={(value) => setFormData({...formData, priority: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="targetValue">Target Value</Label>
                      <Input
                        id="targetValue"
                        type="number"
                        min="1"
                        value={formData.targetValue}
                        onChange={(e) => setFormData({...formData, targetValue: parseInt(e.target.value)})}
                        required
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="unit">Unit</Label>
                      <Input
                        id="unit"
                        value={formData.unit}
                        onChange={(e) => setFormData({...formData, unit: e.target.value})}
                        placeholder="e.g., Connections, Meetings, Projects"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="deadline">Deadline (Optional)</Label>
                    <Input
                      id="deadline"
                      type="date"
                      value={formData.deadline ? new Date(formData.deadline).toISOString().split('T')[0] : ''}
                      onChange={(e) => setFormData({...formData, deadline: e.target.value ? new Date(e.target.value) : undefined})}
                    />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Label htmlFor="recurring" className="flex-grow">Recurring Goal</Label>
                    <Switch
                      id="recurring"
                      checked={formData.recurring}
                      onCheckedChange={(checked) => setFormData({...formData, recurring: checked})}
                    />
                  </div>
                  
                  {formData.recurring && (
                    <div className="grid gap-2">
                      <Label htmlFor="recurringPeriod">Recurring Period</Label>
                      <Select 
                        value={formData.recurringPeriod || ''} 
                        onValueChange={(value) => setFormData({...formData, recurringPeriod: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="grid gap-2">
                    <Label htmlFor="visibility">Visibility</Label>
                    <Select 
                      value={formData.visibility} 
                      onValueChange={(value) => setFormData({...formData, visibility: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="connections">Connections Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Tags</Label>
                    <div className="flex gap-2">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        placeholder="Add a tag"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddTag();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={handleAddTag}>Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="px-2 py-1">
                          {tag}
                          <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-2 text-xs">×</button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddingGoal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createGoalMutation.isPending}>
                    {createGoalMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Create Goal
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="active">Active Goals</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-0">
          {isLoadingGoals ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredGoals.length === 0 ? (
            <div className="text-center py-8 border rounded-lg">
              <h3 className="font-semibold text-lg mb-2">No active goals</h3>
              <p className="text-muted-foreground mb-4">Start creating networking goals to track your professional growth</p>
              <Button onClick={() => setIsAddingGoal(true)}>Create Your First Goal</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGoals.map((goal) => (
                <Card key={goal.id} className="flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      <div className="flex gap-1">
                        <Badge variant="outline" className={`${getPriorityColor(goal.priority)} text-white`}>
                          {goal.priority}
                        </Badge>
                        <Badge variant="outline" className={`${getCategoryColor(goal.category)} text-white flex items-center`}>
                          {getCategoryIcon(goal.category)}
                          {goal.category}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription>{goal.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="flex-grow">
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress: {goal.currentValue} / {goal.targetValue} {goal.unit}</span>
                        <span>{calculateProgress(goal.currentValue, goal.targetValue)}%</span>
                      </div>
                      <Progress value={calculateProgress(goal.currentValue, goal.targetValue)} className="h-2" />
                    </div>
                    
                    {goal.deadline && (
                      <div className="text-sm mb-2">
                        <span className="font-medium">Deadline:</span> {new Date(goal.deadline).toLocaleDateString()}
                      </div>
                    )}
                    
                    {goal.recurring && (
                      <div className="text-sm mb-2">
                        <span className="font-medium">Recurring:</span> {goal.recurringPeriod}
                        {goal.streakCount > 0 && (
                          <span className="ml-2">
                            <Badge variant="outline">Streak: {goal.streakCount}</Badge>
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-1 mt-2">
                      {goal.tags && goal.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                      {goal.aiGenerated && (
                        <Badge variant="outline" className="bg-blue-100">AI Suggested</Badge>
                      )}
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex flex-col pt-2 border-t">
                    <div className="grid grid-cols-3 gap-2 w-full mb-3">
                      <Input 
                        type="number" 
                        min="1"
                        placeholder="Value" 
                        className="col-span-2"
                        value={progressForm[goal.id]?.value || ''}
                        onChange={(e) => setProgressForm({
                          ...progressForm,
                          [goal.id]: { ...progressForm[goal.id], value: e.target.value }
                        })}
                      />
                      <Button 
                        onClick={() => handleAddProgress(goal.id)}
                        disabled={addProgressMutation.isPending}
                      >
                        {addProgressMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
                      </Button>
                    </div>
                    <Input 
                      placeholder="Optional notes" 
                      className="mb-3"
                      value={progressForm[goal.id]?.notes || ''}
                      onChange={(e) => setProgressForm({
                        ...progressForm,
                        [goal.id]: { ...progressForm[goal.id], notes: e.target.value }
                      })}
                    />
                    <div className="flex justify-between w-full">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => deleteGoalMutation.mutate(goal.id)}
                        disabled={deleteGoalMutation.isPending}
                      >
                        {deleteGoalMutation.isPending ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-0">
          {isLoadingGoals ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredGoals.length === 0 ? (
            <div className="text-center py-8 border rounded-lg">
              <h3 className="font-semibold text-lg">No completed goals yet</h3>
              <p className="text-muted-foreground">Keep working on your active goals to see them here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGoals.map((goal) => (
                <Card key={goal.id} className="bg-muted/40">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{goal.title}</CardTitle>
                      <Badge className="bg-green-500">Completed</Badge>
                    </div>
                    <CardDescription>{goal.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm mb-2">
                      <span className="font-medium">Achievement:</span> {goal.targetValue} {goal.unit}
                    </div>
                    <div className="text-sm mb-2">
                      <span className="font-medium">Completed on:</span> {goal.completedAt ? new Date(goal.completedAt).toLocaleDateString() : 'Unknown'}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {goal.tags && goal.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="archived" className="mt-0">
          {isLoadingGoals ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredGoals.length === 0 ? (
            <div className="text-center py-8 border rounded-lg">
              <h3 className="font-semibold text-lg">No archived goals</h3>
              <p className="text-muted-foreground">You can archive goals you no longer want to actively track</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredGoals.map((goal) => (
                <Card key={goal.id} className="opacity-70">
                  <CardHeader>
                    <CardTitle className="text-lg">{goal.title}</CardTitle>
                    <CardDescription>{goal.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm mb-2">
                      <span className="font-medium">Progress:</span> {goal.currentValue} / {goal.targetValue} {goal.unit}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}