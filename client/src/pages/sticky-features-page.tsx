import React from 'react';
import LeadFunnelController from '@/components/onboarding/lead-funnel-controller';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function StickyFeaturesPage() {
  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      <div className="max-w-4xl mx-auto text-center mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Your Personalized HyperDAG Journey</h1>
        <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
          Discover features tailored to your skills and interests. The more you engage, the more capabilities you'll unlock.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-8">
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>
              HyperDAG adapts to your unique skills and interests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-muted p-4 rounded-lg">
                <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center mb-3">
                  <span className="text-primary font-bold">1</span>
                </div>
                <h3 className="font-medium mb-2">Select Your Path</h3>
                <p className="text-sm text-muted-foreground">
                  Choose your primary role as Developer, Designer, or Influencer to personalize your experience.
                </p>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center mb-3">
                  <span className="text-primary font-bold">2</span>
                </div>
                <h3 className="font-medium mb-2">Assess Your Knowledge</h3>
                <p className="text-sm text-muted-foreground">
                  Share your expertise level in key areas to unlock features that match your skills.
                </p>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <div className="bg-primary/10 rounded-full w-8 h-8 flex items-center justify-center mb-3">
                  <span className="text-primary font-bold">3</span>
                </div>
                <h3 className="font-medium mb-2">Complete Challenges</h3>
                <p className="text-sm text-muted-foreground">
                  Earn tokens and reputation by taking on challenges tailored to your abilities.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <LeadFunnelController />
      </div>
    </div>
  );
}