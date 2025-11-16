import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Award, Shield, Zap, Users, Sparkles } from "lucide-react";
import { useLocation } from 'wouter';

interface TransformationCardProps {
  profileCompletion: number;
  user: any;
  className?: string;
}

const TransformationCard: React.FC<TransformationCardProps> = ({ 
  profileCompletion, 
  user,
  className
}) => {
  const [, navigate] = useLocation();
  
  // Define the transformation narrative based on user's persona
  const persona = user?.persona || 'general';
  
  // Outcome-focused before/after transformation statements
  const transformations: Record<string, { before: string, after: string, nextStep: string, reward: string }> = {
    developer: {
      before: "Spending hours proving your skills on every application",
      after: "Getting opportunities based on verified credentials, not who you know",
      nextStep: profileCompletion < 50 ? "Connect your GitHub to verify your skills" : 
               profileCompletion < 75 ? "Add blockchain experience to your profile" :
               "Complete your full stack experience details",
      reward: "Developer Credential Badge + Access to Technical Grant Matching"
    },
    designer: {
      before: "Sharing your entire portfolio with no privacy control",
      after: "Selectively sharing only the work relevant to each opportunity",
      nextStep: profileCompletion < 50 ? "Upload sample designs to your portfolio" : 
               profileCompletion < 75 ? "Add your design tools and expertise" :
               "Complete your design specialization details",
      reward: "Design Innovator Badge + Featured Showcase Placement"
    },
    influencer: {
      before: "Building audiences that don't translate to opportunities",
      after: "Connecting your community to perfect-fit projects with rewards",
      nextStep: profileCompletion < 50 ? "Link your social accounts" : 
               profileCompletion < 75 ? "Add your content specialties" :
               "Complete your audience demographics",
      reward: "Community Connector Badge + Priority for Partner Programs"
    },
    general: {
      before: "Choosing between opportunity and privacy",
      after: "Having both - verified credentials without revealing sensitive details",
      nextStep: profileCompletion < 50 ? "Complete your basic profile" : 
               profileCompletion < 75 ? "Add your skills and interests" :
               "Set your privacy preferences",
      reward: "Early Adopter Badge + Full Feature Access"
    }
  };
  
  // Get the appropriate transformation messaging based on user persona
  const transformation = transformations[persona] || transformations.general;
  
  // Define the next milestone based on profile completion
  const nextMilestone = profileCompletion < 50 ? 50 : 
                      profileCompletion < 75 ? 75 : 100;
  
  // Scarcity and urgency messaging based on completion stage
  const urgencyMessage = profileCompletion < 50 ? 
    "Early adopters receive 5x reputation multiplier - limited time only!" : 
    profileCompletion < 75 ? 
    `Only ${500 - Math.floor(Math.random() * 200)} spots remaining at this reputation tier` :
    "Complete your profile to unlock maximum reputation rewards";
  
  // Social proof element - realistic testimonial
  const testimonials = [
    {
      quote: "After completing my profile, I received collaboration offers from projects I'd never have found otherwise.",
      author: "Alex K., Blockchain Developer"
    },
    {
      quote: "The privacy controls let me share my credentials without exposing personal details. Game-changer!",
      author: "Taylor S., UX Designer"
    },
    {
      quote: "My audience loves the projects I connect them to, and I earn reputation points with each successful match.",
      author: "Jordan M., Content Creator"
    }
  ];
  
  // Select a testimonial appropriate for the persona
  const testimonialIndex = persona === 'developer' ? 0 : 
                          persona === 'designer' ? 1 : 
                          persona === 'influencer' ? 2 : 
                          Math.floor(Math.random() * testimonials.length);
  
  const testimonial = testimonials[testimonialIndex];
  
  // Feature unlocks at different completion levels
  const featureUnlocks = [
    { level: 50, name: "Grant Matching", icon: <Award className="h-4 w-4" /> },
    { level: 75, name: "Team Formation", icon: <Users className="h-4 w-4" /> },
    { level: 100, name: "Full ZKP Privacy", icon: <Shield className="h-4 w-4" /> }
  ];

  // Get next feature to unlock
  const nextFeature = featureUnlocks.find(feature => feature.level > profileCompletion) || featureUnlocks[featureUnlocks.length - 1];
  
  // Handle continue button click
  const handleContinue = () => {
    if (profileCompletion < 50) {
      navigate('/profile/edit');
    } else if (profileCompletion < 75) {
      navigate('/profile/skills');
    } else {
      navigate('/profile/privacy');
    }
  };

  return (
    <Card className={`border-primary/20 ${className}`}>
      <CardHeader className="bg-primary/5 pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Your HyperDAG Transformation</CardTitle>
          {profileCompletion >= 75 && (
            <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-primary/20">
              <Sparkles className="h-3 w-3 mr-1" />
              <span>Almost There!</span>
            </Badge>
          )}
        </div>
        <CardDescription>
          Complete your journey to unlock opportunities while maintaining privacy
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        {/* Profile Completion Progress */}
        <div className="mb-6">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium">Profile Completion</span>
            <span className="text-sm font-medium">{profileCompletion}%</span>
          </div>
          <Progress value={profileCompletion} className="h-2" />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-muted-foreground">Start</span>
            <span className="text-xs text-muted-foreground">
              <Zap className="inline h-3 w-3 mr-1 text-primary" />
              Next: {nextMilestone}%
            </span>
          </div>
        </div>
        
        {/* Transformation Journey - Before & After */}
        <div className="space-y-4 mb-6">
          <h3 className="text-sm font-medium">Your Transformation Journey</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border bg-muted/50">
              <h4 className="text-sm font-medium text-muted-foreground mb-1">Before</h4>
              <p className="text-sm">{transformation.before}</p>
            </div>
            <div className="p-3 rounded-lg border bg-primary/5">
              <h4 className="text-sm font-medium text-primary mb-1">After</h4>
              <p className="text-sm font-medium">{transformation.after}</p>
            </div>
          </div>
        </div>
        
        {/* Next Step with Urgency */}
        <div className="space-y-2 mb-4">
          <h3 className="text-sm font-medium flex items-center">
            <ArrowRight className="mr-1 h-4 w-4 text-primary" />
            Next Step to Transform
          </h3>
          <div className="p-3 rounded-lg border">
            <p className="text-sm font-medium">{transformation.nextStep}</p>
            <p className="text-xs text-primary mt-1 font-medium">{urgencyMessage}</p>
          </div>
        </div>
        
        {/* Unlock Feature */}
        <div className="p-3 rounded-lg border bg-muted/30 mt-4">
          <div className="flex items-center">
            {nextFeature.icon}
            <span className="ml-2 text-sm font-medium">Unlock at {nextFeature.level}%: {nextFeature.name}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">Complete your profile to unlock {nextFeature.name}</p>
        </div>
        
        {/* Social Proof Testimonial */}
        <div className="mt-5 p-3 border rounded-md bg-muted/20 italic text-sm">
          <p>&quot;{testimonial.quote}&quot;</p>
          <p className="text-right mt-1 not-italic text-xs font-medium">– {testimonial.author}</p>
        </div>
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex flex-col sm:flex-row gap-3">
        <Button 
          className="w-full sm:w-auto" 
          onClick={handleContinue}
        >
          Continue Your Transformation
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        
        <Button 
          variant="outline" 
          className="w-full sm:w-auto" 
          onClick={() => navigate('/rewards')}
        >
          <Award className="mr-2 h-4 w-4" />
          View Your Rewards
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TransformationCard;