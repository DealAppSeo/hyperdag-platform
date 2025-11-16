import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Trophy, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface GoalWizardCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  color?: string;
  isSelected?: boolean;
  onClick?: () => void;
  badge?: string;
  progress?: number;
  children?: React.ReactNode;
  className?: string;
}

export function GoalWizardCard({
  title,
  description,
  icon,
  color = "bg-primary/10 text-primary border-primary/20",
  isSelected = false,
  onClick,
  badge,
  progress,
  children,
  className,
}: GoalWizardCardProps) {
  return (
    <Card 
      className={cn(
        "cursor-pointer border-2 transition-all duration-200 overflow-hidden",
        isSelected ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-primary/30",
        color,
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="relative pb-2">
        {isSelected && (
          <Badge className="absolute top-2 right-2 bg-primary">
            <Check className="h-3 w-3 mr-1" /> Selected
          </Badge>
        )}
        <div className="flex items-center gap-3">
          {icon && <div className="text-primary/80">{icon}</div>}
          <div>
            <CardTitle className={cn(
              "text-lg",
              isSelected ? "text-primary" : ""
            )}>
              {title}
            </CardTitle>
            {description && (
              <CardDescription>{description}</CardDescription>
            )}
          </div>
          {badge && (
            <Badge variant="outline" className="ml-auto">
              {badge}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {progress !== undefined && (
          <div className="mb-3">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-right mt-1">{progress}% complete</p>
          </div>
        )}
        {children}
      </CardContent>
    </Card>
  );
}

interface GoalRewardCardProps {
  title: string;
  description: string;
  points: number;
  tokens: number;
  badges?: string[];
  streakBonus?: boolean;
  milestoneBonus?: boolean;
}

export function GoalRewardCard({ 
  title, 
  description, 
  points, 
  tokens, 
  badges = [], 
  streakBonus = false,
  milestoneBonus = true
}: GoalRewardCardProps) {
  return (
    <div className="bg-gradient-to-r from-amber-50 to-yellow-50 p-6 rounded-lg border border-amber-200">
      <h3 className="text-xl font-bold text-amber-700 flex items-center">
        <Trophy className="h-6 w-6 mr-2 text-amber-500" />
        {title}
      </h3>
      
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      
      <div className="mt-4 space-y-4">
        <div className="flex items-center">
          <Badge className="bg-amber-500 text-white mr-3">Points</Badge>
          <span className="font-medium text-lg">+{points} Reputation Points</span>
        </div>
        
        <div className="flex items-center">
          <Badge className="bg-emerald-500 text-white mr-3">Tokens</Badge>
          <span className="font-medium text-lg">+{tokens} HyperDAG Tokens</span>
        </div>
        
        {badges.length > 0 && badges.map((badge, index) => (
          <div key={index} className="flex items-center">
            <Badge className="bg-violet-500 text-white mr-3">Badge</Badge>
            <span className="font-medium text-lg">{badge}</span>
          </div>
        ))}
        
        {streakBonus && (
          <div className="flex items-center">
            <Badge className="bg-cyan-500 text-white mr-3">Streak</Badge>
            <span className="font-medium text-lg">Streak bonuses for consistent achievement</span>
          </div>
        )}
      </div>
      
      {milestoneBonus && (
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
      )}
    </div>
  );
}

interface GoalCommunityBenefitsProps {
  benefits: string[];
  category?: string;
}

export function GoalCommunityBenefits({ benefits, category = "selected" }: GoalCommunityBenefitsProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
      <h3 className="text-xl font-bold text-blue-700">
        Community Benefits
      </h3>
      
      <div className="mt-4 space-y-3 text-sm">
        {benefits.map((benefit, index) => (
          <p key={index} className="flex items-center">
            <Check className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
            <span>{benefit.replace('{category}', category)}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

interface GoalProgressStepperProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export function GoalProgressStepper({ 
  currentStep, 
  totalSteps, 
  labels = ["Start", "Middle", "End"] 
}: GoalProgressStepperProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;
  
  return (
    <div className="mb-8">
      <Progress value={progress} className="h-2" />
      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
        {labels.map((label, index) => (
          <span 
            key={index}
            className={cn(
              index <= currentStep ? "text-primary font-medium" : ""
            )}
          >
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}