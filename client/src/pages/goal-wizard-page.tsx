import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  Target, Award, Trophy, ArrowRight, Check, Star, 
  UserPlus, Users, BookOpen, Briefcase, Coins, Sparkles 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InsertNetworkingGoal } from "@shared/schema";

// Define wizard steps
const WIZARD_STEPS = [
  "persona",
  "category",
  "goalType",
  "details",
  "rewards",
  "review"
];

// Goal categories with icons and colors
const GOAL_CATEGORIES = [
  { 
    id: "Networking", 
    name: "Networking", 
    icon: <UserPlus className="h-8 w-8" />, 
    color: "bg-violet-100 text-violet-700 border-violet-300",
    description: "Build and strengthen your professional connections"
  },
  { 
    id: "Learning", 
    name: "Learning", 
    icon: <BookOpen className="h-8 w-8" />, 
    color: "bg-cyan-100 text-cyan-700 border-cyan-300",
    description: "Acquire new skills or knowledge to enhance your profile"
  },
  { 
    id: "Collaborating", 
    name: "Collaborating", 
    icon: <Users className="h-8 w-8" />, 
    color: "bg-emerald-100 text-emerald-700 border-emerald-300",
    description: "Work with others on shared projects and initiatives"
  },
  { 
    id: "Building", 
    name: "Building", 
    icon: <Briefcase className="h-8 w-8" />, 
    color: "bg-amber-100 text-amber-700 border-amber-300",
    description: "Create or contribute to projects that enhance your portfolio"
  },
  { 
    id: "Funding", 
    name: "Funding", 
    icon: <Coins className="h-8 w-8" />, 
    color: "bg-rose-100 text-rose-700 border-rose-300",
    description: "Secure financial support for your projects or ideas"
  }
];

// Goal types for each category
const GOAL_TYPES = {
  "Networking": [
    { 
      id: "connections", 
      name: "Build Connections", 
      unit: "Connections",
      defaultTarget: 5,
      description: "Connect with new professionals in your field",
      icon: <UserPlus className="h-6 w-6" />
    },
    { 
      id: "meetings", 
      name: "Schedule Meetings", 
      unit: "Meetings",
      defaultTarget: 3,
      description: "Arrange one-on-one meetings with potential collaborators",
      icon: <Users className="h-6 w-6" />
    },
    { 
      id: "referrals", 
      name: "Generate Referrals", 
      unit: "Referrals",
      defaultTarget: 2,
      description: "Obtain referrals from your network",
      icon: <ArrowRight className="h-6 w-6" />
    }
  ],
  "Learning": [
    { 
      id: "courses", 
      name: "Complete Courses", 
      unit: "Courses",
      defaultTarget: 1,
      description: "Finish educational courses related to your skills",
      icon: <BookOpen className="h-6 w-6" />
    },
    { 
      id: "certifications", 
      name: "Earn Certifications", 
      unit: "Certifications",
      defaultTarget: 1,
      description: "Obtain professional certifications",
      icon: <Award className="h-6 w-6" />
    },
    { 
      id: "workshops", 
      name: "Attend Workshops", 
      unit: "Workshops",
      defaultTarget: 2,
      description: "Participate in hands-on learning experiences",
      icon: <Users className="h-6 w-6" />
    }
  ],
  "Collaborating": [
    { 
      id: "teamProjects", 
      name: "Join Team Projects", 
      unit: "Projects",
      defaultTarget: 1,
      description: "Contribute to collaborative projects",
      icon: <Briefcase className="h-6 w-6" />
    },
    { 
      id: "mentoring", 
      name: "Mentor Others", 
      unit: "Mentees",
      defaultTarget: 1,
      description: "Guide others with your expertise",
      icon: <Users className="h-6 w-6" />
    },
    { 
      id: "peerReviews", 
      name: "Participate in Peer Reviews", 
      unit: "Reviews",
      defaultTarget: 3,
      description: "Provide feedback on others' work",
      icon: <Check className="h-6 w-6" />
    }
  ],
  "Building": [
    { 
      id: "contributions", 
      name: "Make Code Contributions", 
      unit: "Contributions",
      defaultTarget: 5,
      description: "Contribute to open source or community projects",
      icon: <Briefcase className="h-6 w-6" />
    },
    { 
      id: "projects", 
      name: "Launch Projects", 
      unit: "Projects",
      defaultTarget: 1,
      description: "Create and share your own projects",
      icon: <Sparkles className="h-6 w-6" />
    },
    { 
      id: "prototypes", 
      name: "Develop Prototypes", 
      unit: "Prototypes",
      defaultTarget: 2,
      description: "Build working prototypes of your ideas",
      icon: <Target className="h-6 w-6" />
    }
  ],
  "Funding": [
    { 
      id: "grants", 
      name: "Apply for Grants", 
      unit: "Applications",
      defaultTarget: 2,
      description: "Submit applications for grant funding",
      icon: <Coins className="h-6 w-6" />
    },
    { 
      id: "pitches", 
      name: "Deliver Funding Pitches", 
      unit: "Pitches",
      defaultTarget: 3,
      description: "Present your ideas to potential backers",
      icon: <Users className="h-6 w-6" />
    },
    { 
      id: "backers", 
      name: "Secure Backers", 
      unit: "Backers",
      defaultTarget: 2,
      description: "Obtain financial support from individuals",
      icon: <UserPlus className="h-6 w-6" />
    }
  ]
};

// Persona-based goal suggestions
const PERSONA_SUGGESTIONS = {
  "developer": {
    title: "Developer Path",
    color: "bg-blue-100 text-blue-700 border-blue-300",
    icon: <Target className="h-8 w-8" />,
    description: "Technical skill development and open source contribution",
    suggestedCategories: ["Building", "Learning", "Collaborating"],
    suggestedGoals: [
      {
        category: "Building",
        type: "contributions",
        title: "Contribute to Open Source Projects",
        description: "Make meaningful contributions to open source repositories",
        targetValue: 5,
        unit: "Contributions",
      },
      {
        category: "Learning",
        type: "certifications",
        title: "Earn a Technical Certification",
        description: "Complete a certification in your technical domain",
        targetValue: 1,
        unit: "Certifications",
      }
    ]
  },
  "designer": {
    title: "Designer Path",
    color: "bg-orange-100 text-orange-700 border-orange-300",
    icon: <Sparkles className="h-8 w-8" />,
    description: "Creative portfolio development and design collaboration",
    suggestedCategories: ["Building", "Collaborating", "Networking"],
    suggestedGoals: [
      {
        category: "Building",
        type: "projects",
        title: "Create Portfolio Projects",
        description: "Design and publish showcase projects for your portfolio",
        targetValue: 2,
        unit: "Projects",
      },
      {
        category: "Networking",
        type: "connections",
        title: "Connect with Design Leaders",
        description: "Build connections with established designers",
        targetValue: 3,
        unit: "Connections",
      }
    ]
  },
  "influencer": {
    title: "Influencer Path",
    color: "bg-green-100 text-green-700 border-green-300",
    icon: <Users className="h-8 w-8" />,
    description: "Community building and expanding your reach",
    suggestedCategories: ["Networking", "Collaborating", "Funding"],
    suggestedGoals: [
      {
        category: "Networking",
        type: "referrals",
        title: "Generate Network Referrals",
        description: "Expand your network through referrals from your connections",
        targetValue: 5,
        unit: "Referrals",
      },
      {
        category: "Funding",
        type: "backers",
        title: "Secure Project Backers",
        description: "Find supporters for your community initiatives",
        targetValue: 2,
        unit: "Backers",
      }
    ]
  }
};

// Default goal form data
const initialGoalForm = {
  title: "",
  description: "",
  category: "",
  targetValue: 5,
  unit: "Connections",
  priority: "medium",
  deadline: undefined as Date | undefined,
  recurring: false,
  recurringPeriod: undefined as string | undefined,
  visibility: "private",
  tags: [] as string[],
  aiGenerated: false
};

export default function GoalWizardPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [goalForm, setGoalForm] = useState(initialGoalForm);
  const [selectedPersona, setSelectedPersona] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedGoalType, setSelectedGoalType] = useState<string>("");
  const [isCustomizingGoal, setIsCustomizingGoal] = useState(false);
  const [personaTab, setPersonaTab] = useState("suggested");

  // Fetch suggested goals based on user profile and activity
  const { data: userSuggestions, isLoading: isLoadingSuggestions } = useQuery({
    queryKey: ["/api/networking/goals/suggestions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/networking/goals/suggestions");
      return res.json();
    }
  });

  // Create networking goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (goalData: Partial<InsertNetworkingGoal>) => {
      const res = await apiRequest("POST", "/api/networking/goals", goalData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/networking/goals"] });
      toast({
        title: "Goal created successfully! 🎉",
        description: "You've unlocked a new journey in your professional growth.",
      });
      // Navigate to the goals page after successful creation
      setLocation("/networking-goals");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create goal",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  });

  // Effect to update goal form when selecting a goal type
  useEffect(() => {
    if (selectedCategory && selectedGoalType) {
      const goalType = GOAL_TYPES[selectedCategory as keyof typeof GOAL_TYPES].find(
        type => type.id === selectedGoalType
      );
      
      if (goalType) {
        setGoalForm(prev => ({
          ...prev,
          category: selectedCategory,
          unit: goalType.unit,
          targetValue: goalType.defaultTarget,
          title: goalType.name,
          description: goalType.description
        }));
      }
    }
  }, [selectedCategory, selectedGoalType]);

  // Effect to update suggested categories when changing persona
  useEffect(() => {
    if (selectedPersona && PERSONA_SUGGESTIONS[selectedPersona as keyof typeof PERSONA_SUGGESTIONS]) {
      // If persona changed and there's a selected category that's not in the new persona's suggested categories,
      // reset the category selection
      const personaData = PERSONA_SUGGESTIONS[selectedPersona as keyof typeof PERSONA_SUGGESTIONS];
      if (selectedCategory && !personaData.suggestedCategories.includes(selectedCategory)) {
        setSelectedCategory("");
        setSelectedGoalType("");
      }
    }
  }, [selectedPersona]);

  // Effect to initialize persona based on user data
  useEffect(() => {
    if (user?.persona) {
      setSelectedPersona(user.persona || "");
    }
  }, [user]);

  // Helper to get current persona data
  const getCurrentPersonaData = () => {
    if (!selectedPersona) return null;
    return PERSONA_SUGGESTIONS[selectedPersona as keyof typeof PERSONA_SUGGESTIONS];
  };

  // Handle wizard navigation
  const handleNext = () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Handle form submission
  const handleSubmitGoal = () => {
    // Prepare goal data for submission
    const goalData = {
      ...goalForm,
      targetValue: Number(goalForm.targetValue),
      tags: goalForm.tags || [],
      deadline: goalForm.deadline,
      userId: user?.id
    };
    
    createGoalMutation.mutate(goalData);
  };

  // Handle selecting a predefined goal
  const handleSelectPredefinedGoal = (goal: any) => {
    setGoalForm(prev => ({
      ...prev,
      ...goal,
      aiGenerated: true
    }));
    
    // Move to review step
    setCurrentStep(WIZARD_STEPS.length - 1);
  };

  // Render navigation buttons
  const renderNavigation = () => (
    <div className="flex justify-between mt-8">
      <Button 
        variant="outline" 
        onClick={handleBack} 
        disabled={currentStep === 0}
      >
        Back
      </Button>
      {currentStep < WIZARD_STEPS.length - 1 ? (
        <Button 
          onClick={handleNext} 
          disabled={
            (currentStep === 0 && !selectedPersona) ||
            (currentStep === 1 && !selectedCategory) ||
            (currentStep === 2 && !selectedGoalType) ||
            (currentStep === 3 && (!goalForm.title || !goalForm.description || !goalForm.targetValue))
          }
        >
          Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      ) : (
        <Button 
          onClick={handleSubmitGoal} 
          disabled={createGoalMutation.isPending}
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        >
          {createGoalMutation.isPending ? "Creating..." : "Create Goal"} <Sparkles className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );

  // Progress indicator
  const renderProgressBar = () => (
    <div className="mb-8">
      <Progress value={(currentStep + 1) / WIZARD_STEPS.length * 100} className="h-2" />
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        <span>Choose path</span>
        <span>Set details</span>
        <span>Create</span>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Login Required</h1>
          <p>Please login to set networking goals.</p>
        </div>
      </div>
    );
  }

  // Helper functions for category colors and icons
  const getCategoryColorClass = (category: string): string => {
    switch (category) {
      case "Networking":
        return "bg-violet-600";
      case "Learning":
        return "bg-cyan-600";
      case "Collaborating":
        return "bg-emerald-600";
      case "Building":
        return "bg-amber-600";
      case "Funding":
        return "bg-rose-600";
      default:
        return "bg-primary";
    }
  };

  const getCategoryIconElement = (category: string): React.ReactNode => {
    switch (category) {
      case "Networking":
        return <UserPlus className="h-6 w-6 mr-2" />;
      case "Learning":
        return <BookOpen className="h-6 w-6 mr-2" />;
      case "Collaborating":
        return <Users className="h-6 w-6 mr-2" />;
      case "Building":
        return <Briefcase className="h-6 w-6 mr-2" />;
      case "Funding":
        return <Coins className="h-6 w-6 mr-2" />;
      default:
        return <Target className="h-6 w-6 mr-2" />;
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold">Networking Goal Wizard</h1>
        <p className="text-muted-foreground">
          Design your professional journey, one goal at a time
        </p>
      </div>

      {renderProgressBar()}

      <div className="bg-card border rounded-lg p-6 shadow-sm">
        {/* Step 1: Choose Persona */}
        {currentStep === 0 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold">Choose Your Path</h2>
              <p className="text-muted-foreground">
                Select the professional path that best matches your goals
              </p>
            </div>

            <Tabs value={personaTab} onValueChange={setPersonaTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="suggested">Suggested Path</TabsTrigger>
                <TabsTrigger value="all">All Paths</TabsTrigger>
              </TabsList>
              
              <TabsContent value="suggested" className="mt-4">
                {user?.persona ? (
                  <div className="space-y-4">
                    <Card className={`cursor-pointer border-2 ${
                      selectedPersona === user.persona ? 'border-primary' : 'border-transparent'
                    } ${PERSONA_SUGGESTIONS[user.persona as keyof typeof PERSONA_SUGGESTIONS]?.color || 'bg-gray-100'}`}
                      onClick={() => setSelectedPersona(user.persona)}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          {PERSONA_SUGGESTIONS[user.persona as keyof typeof PERSONA_SUGGESTIONS]?.icon || <Target className="h-8 w-8" />}
                          <div>
                            <CardTitle>
                              {PERSONA_SUGGESTIONS[user.persona as keyof typeof PERSONA_SUGGESTIONS]?.title || user.persona} Path
                            </CardTitle>
                            <CardDescription>
                              Recommended based on your profile
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p>
                          {PERSONA_SUGGESTIONS[user.persona as keyof typeof PERSONA_SUGGESTIONS]?.description || 
                            "Custom path based on your professional identity"}
                        </p>
                      </CardContent>
                    </Card>
                    
                    <p className="text-sm text-center text-muted-foreground">
                      Don't want to use your profile's path? Explore <Button variant="link" className="p-0 h-auto" onClick={() => setPersonaTab("all")}>all available paths</Button>
                    </p>
                  </div>
                ) : (
                  <div className="text-center p-6">
                    <p>No persona has been set in your profile yet.</p>
                    <p className="mt-2">Please choose from all available paths.</p>
                    <Button variant="outline" className="mt-4" onClick={() => setPersonaTab("all")}>
                      View All Paths
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="all" className="mt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.keys(PERSONA_SUGGESTIONS).map((persona) => (
                    <Card 
                      key={persona}
                      className={`cursor-pointer border-2 ${
                        selectedPersona === persona ? 'border-primary' : 'border-transparent'
                      } ${PERSONA_SUGGESTIONS[persona as keyof typeof PERSONA_SUGGESTIONS].color}`}
                      onClick={() => setSelectedPersona(persona)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-3">
                          {PERSONA_SUGGESTIONS[persona as keyof typeof PERSONA_SUGGESTIONS].icon}
                          <CardTitle>{PERSONA_SUGGESTIONS[persona as keyof typeof PERSONA_SUGGESTIONS].title}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p>{PERSONA_SUGGESTIONS[persona as keyof typeof PERSONA_SUGGESTIONS].description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Step 2: Choose Category */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold">Select Goal Category</h2>
              <p className="text-muted-foreground">
                Choose the type of professional growth you want to focus on
              </p>
            </div>
            
            {selectedPersona && getCurrentPersonaData() && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Recommended for {getCurrentPersonaData()?.title}:</h3>
                <div className="grid md:grid-cols-3 gap-3">
                  {getCurrentPersonaData()?.suggestedCategories.map((categoryId) => {
                    const category = GOAL_CATEGORIES.find(c => c.id === categoryId);
                    if (!category) return null;
                    
                    return (
                      <Card 
                        key={category.id}
                        className={`cursor-pointer border-2 ${
                          selectedCategory === category.id ? 'border-primary' : 'border-transparent'
                        } ${category.color}`}
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <CardContent className="p-4 flex flex-col items-center text-center">
                          {category.icon}
                          <h3 className="font-semibold mt-2">{category.name}</h3>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div>
              <h3 className="text-lg font-medium mb-2">All Categories:</h3>
              <div className="grid md:grid-cols-3 gap-3">
                {GOAL_CATEGORIES.map((category) => (
                  <Card 
                    key={category.id}
                    className={`cursor-pointer border-2 ${
                      selectedCategory === category.id ? 'border-primary' : 'border-transparent'
                    } ${category.color}`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      {category.icon}
                      <h3 className="font-semibold mt-2">{category.name}</h3>
                      <p className="text-xs mt-1">{category.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Choose Goal Type */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold">Select Goal Type</h2>
              <p className="text-muted-foreground">
                Choose a specific goal template or create your own
              </p>
            </div>
            
            {selectedPersona && selectedCategory && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Recommended Goals:</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {PERSONA_SUGGESTIONS[selectedPersona as keyof typeof PERSONA_SUGGESTIONS]?.suggestedGoals
                    .filter(goal => goal.category === selectedCategory)
                    .map((goal, index) => (
                      <Card 
                        key={index}
                        className="cursor-pointer border-2 hover:border-primary"
                        onClick={() => handleSelectPredefinedGoal(goal)}
                      >
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{goal.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                          <div className="flex items-center mt-2">
                            <span className="text-sm font-medium">Target: {goal.targetValue} {goal.unit}</span>
                          </div>
                        </CardContent>
                        <CardFooter className="pt-0">
                          <Button variant="ghost" size="sm">
                            Use this goal <ArrowRight className="ml-1 h-4 w-4" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                </div>
              </div>
            )}
            
            <div>
              <h3 className="text-lg font-medium mb-2">Choose a Goal Type:</h3>
              <div className="grid md:grid-cols-3 gap-3">
                {selectedCategory && GOAL_TYPES[selectedCategory as keyof typeof GOAL_TYPES]?.map((type) => (
                  <Card 
                    key={type.id}
                    className={`cursor-pointer border-2 ${
                      selectedGoalType === type.id ? 'border-primary' : 'border-transparent'
                    }`}
                    onClick={() => setSelectedGoalType(type.id)}
                  >
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      {type.icon}
                      <h3 className="font-semibold mt-2">{type.name}</h3>
                      <p className="text-xs mt-1">{type.description}</p>
                      <p className="text-xs mt-2 font-medium">Target: {type.defaultTarget} {type.unit}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Goal Details */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold">Customize Your Goal</h2>
              <p className="text-muted-foreground">
                Set specific details to make this goal your own
              </p>
            </div>
            
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label htmlFor="title" className="font-medium">Goal Title</label>
                <Input
                  id="title"
                  value={goalForm.title}
                  onChange={(e) => setGoalForm({...goalForm, title: e.target.value})}
                  placeholder="e.g., Connect with 5 AI researchers"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="description" className="font-medium">Description</label>
                <Textarea
                  id="description"
                  value={goalForm.description}
                  onChange={(e) => setGoalForm({...goalForm, description: e.target.value})}
                  placeholder="Describe your goal and why it matters to you"
                  required
                />
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="targetValue" className="font-medium">Target Value</label>
                  <Input
                    id="targetValue"
                    type="number"
                    min="1"
                    value={goalForm.targetValue}
                    onChange={(e) => setGoalForm({...goalForm, targetValue: parseInt(e.target.value) || 1})}
                    required
                  />
                  <p className="text-xs text-muted-foreground">How many {goalForm.unit.toLowerCase()} do you want to achieve?</p>
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="priority" className="font-medium">Priority Level</label>
                  <select
                    id="priority"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    value={goalForm.priority}
                    onChange={(e) => setGoalForm({...goalForm, priority: e.target.value})}
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="deadline" className="font-medium">Deadline (Optional)</label>
                  <Input
                    id="deadline"
                    type="date"
                    value={goalForm.deadline ? new Date(goalForm.deadline).toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : undefined;
                      setGoalForm({...goalForm, deadline: date});
                    }}
                  />
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="visibility" className="font-medium">Visibility</label>
                  <select
                    id="visibility"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    value={goalForm.visibility}
                    onChange={(e) => setGoalForm({...goalForm, visibility: e.target.value})}
                  >
                    <option value="private">Private (Only you)</option>
                    <option value="connections">Connections (Your network)</option>
                    <option value="public">Public (Everyone)</option>
                  </select>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={goalForm.recurring}
                  onChange={(e) => setGoalForm({...goalForm, recurring: e.target.checked})}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="recurring" className="font-medium">Make this a recurring goal</label>
              </div>
              
              {goalForm.recurring && (
                <div className="grid gap-2 pl-6">
                  <label htmlFor="recurringPeriod" className="font-medium">Recurring Period</label>
                  <select
                    id="recurringPeriod"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    value={goalForm.recurringPeriod}
                    onChange={(e) => setGoalForm({...goalForm, recurringPeriod: e.target.value})}
                  >
                    <option value="">Select a period</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 5: Rewards and Motivation */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold">Goal Rewards</h2>
              <p className="text-muted-foreground">
                Completing this goal will unlock these benefits
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-lg border border-amber-200">
              <h3 className="text-xl font-bold text-amber-700 flex items-center">
                <Trophy className="h-6 w-6 mr-2 text-amber-500" />
                Rewards for this Goal
              </h3>
              
              <div className="mt-4 space-y-4">
                <div className="flex items-center">
                  <Badge className="bg-amber-500 text-white mr-3">Points</Badge>
                  <span className="font-medium text-lg">+{25 * goalForm.targetValue} Reputation Points</span>
                </div>
                
                <div className="flex items-center">
                  <Badge className="bg-emerald-500 text-white mr-3">Tokens</Badge>
                  <span className="font-medium text-lg">+{5 * goalForm.targetValue} HyperDAG Tokens</span>
                </div>
                
                {goalForm.targetValue >= 5 && (
                  <div className="flex items-center">
                    <Badge className="bg-violet-500 text-white mr-3">Badge</Badge>
                    <span className="font-medium text-lg">{goalForm.category} Achiever Badge</span>
                  </div>
                )}
                
                {goalForm.recurring && (
                  <div className="flex items-center">
                    <Badge className="bg-cyan-500 text-white mr-3">Streak</Badge>
                    <span className="font-medium text-lg">Streak bonuses for consistent achievement</span>
                  </div>
                )}
              </div>
              
              <div className="mt-6 bg-white/60 p-4 rounded-md">
                <h4 className="font-semibold flex items-center text-amber-800">
                  <Star className="h-4 w-4 mr-2 text-amber-500" />
                  Milestone Bonus
                </h4>
                <p className="mt-1 text-sm">
                  Reach 50% of your goal and receive an additional 10% bonus on all rewards!
                </p>
                <p className="mt-1 text-sm">
                  Complete your goal early (before deadline) and receive an additional 15% bonus!
                </p>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
              <h3 className="text-xl font-bold text-blue-700 flex items-center">
                <Users className="h-6 w-6 mr-2 text-blue-500" />
                Community Benefits
              </h3>
              
              <div className="mt-4 space-y-3 text-sm">
                <p className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>Unlock access to exclusive community channels</span>
                </p>
                <p className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>Increase your visibility in team matching algorithms</span>
                </p>
                <p className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>Build reputation in the {goalForm.category} category</span>
                </p>
                <p className="flex items-center">
                  <Check className="h-4 w-4 mr-2 text-green-500" />
                  <span>Qualify for mentorship opportunities</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Review and Submit */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold">Review Your Goal</h2>
              <p className="text-muted-foreground">
                Make sure everything looks right before creating your goal
              </p>
            </div>
            
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className={`p-4 text-white ${getCategoryColorClass(goalForm.category)}`}>
                <h3 className="text-xl font-bold flex items-center">
                  {getCategoryIconElement(goalForm.category)}
                  <span className="ml-2">{goalForm.title}</span>
                </h3>
              </div>
              
              <div className="p-4">
                <p className="text-sm text-muted-foreground mb-4">{goalForm.description}</p>
                
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="font-medium">Category:</dt>
                  <dd>{goalForm.category}</dd>
                  
                  <dt className="font-medium">Target:</dt>
                  <dd>{goalForm.targetValue} {goalForm.unit}</dd>
                  
                  <dt className="font-medium">Priority:</dt>
                  <dd className="capitalize">{goalForm.priority}</dd>
                  
                  <dt className="font-medium">Visibility:</dt>
                  <dd className="capitalize">{goalForm.visibility}</dd>
                  
                  {goalForm.deadline && (
                    <>
                      <dt className="font-medium">Deadline:</dt>
                      <dd>{new Date(goalForm.deadline).toLocaleDateString()}</dd>
                    </>
                  )}
                  
                  <dt className="font-medium">Recurring:</dt>
                  <dd>{goalForm.recurring ? `Yes (${goalForm.recurringPeriod})` : 'No'}</dd>
                </dl>
                
                <div className="mt-6">
                  <h4 className="font-semibold mb-2">Expected Rewards:</h4>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                      +{25 * goalForm.targetValue} Points
                    </Badge>
                    <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300">
                      +{5 * goalForm.targetValue} Tokens
                    </Badge>
                    {goalForm.targetValue >= 5 && (
                      <Badge variant="outline" className="bg-violet-100 text-violet-800 border-violet-300">
                        New Badge
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="border border-yellow-200 bg-yellow-50 rounded-md p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> After creating this goal, you can track your progress and record achievements
                from your Networking Goals dashboard.
              </p>
            </div>
          </div>
        )}

        {renderNavigation()}
      </div>
    </div>
  );
}