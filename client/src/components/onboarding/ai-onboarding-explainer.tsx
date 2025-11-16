import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Brain, Hourglass, Users, Lock, Award } from 'lucide-react';

type FeatureAccessLevel = 'basic' | 'email' | 'knowledge' | '2fa' | 'wallet' | 'full';

interface Feature {
  id: string;
  name: string;
  description: string;
  accessLevel: FeatureAccessLevel;
  icon: React.ReactNode;
  path?: string;
}

// Feature access model
const FEATURES: Feature[] = [
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Your personal overview of activities and progress',
    accessLevel: 'basic',
    icon: <Sparkles className="h-5 w-5 text-blue-500" />,
    path: '/dashboard'
  },
  {
    id: 'referrals',
    name: 'Referral Program',
    description: 'Share HyperDAG and earn tokens & reputation points',
    accessLevel: 'basic',
    icon: <Users className="h-5 w-5 text-green-500" />,
    path: '/referrals'
  },
  {
    id: 'documentation',
    name: 'Documentation',
    description: 'Learn about HyperDAG\'s features and capabilities',
    accessLevel: 'basic',
    icon: <Brain className="h-5 w-5 text-purple-500" />,
    path: '/docs'
  },
  {
    id: 'reputation',
    name: 'Reputation Center',
    description: 'View and manage your RepID and reputation points',
    accessLevel: 'email',
    icon: <Award className="h-5 w-5 text-yellow-500" />,
    path: '/reputation'
  },
  {
    id: 'grants',
    name: 'Grant Matching',
    description: 'Get matched with grants for your projects',
    accessLevel: 'knowledge',
    icon: <Hourglass className="h-5 w-5 text-red-500" />,
    path: '/grants'
  },
  {
    id: 'developer',
    name: 'Developer Hub',
    description: 'Access developer tools, SDKs, and API documentation',
    accessLevel: '2fa',
    icon: <Lock className="h-5 w-5 text-indigo-500" />,
    path: '/developer'
  }
];

export function AIOnboardingExplainer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<string>('features');
  
  const getAccessLevelDescription = (level: FeatureAccessLevel): string => {
    switch (level) {
      case 'basic':
        return 'Available immediately after registration';
      case 'email':
        return 'Unlocked after email verification';
      case 'knowledge':
        return 'Unlocked after completing knowledge assessment';
      case '2fa':
        return 'Requires 2FA setup and additional verification';
      case 'wallet':
        return 'Requires wallet connection';
      case 'full':
        return 'Requires complete profile setup';
      default:
        return '';
    }
  };
  
  const handleCompleteProfile = () => {
    onOpenChange(false);
    navigate('/personalized-journey');
  };
  
  const handleReferralAccess = () => {
    onOpenChange(false);
    navigate('/referrals');
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" /> 
            AI-Optimized Dynamic Onboarding
          </DialogTitle>
          <DialogDescription>
            HyperDAG adapts to your interests and experience, progressively revealing features to avoid overwhelming you.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="features">Feature Access</TabsTrigger>
            <TabsTrigger value="referrals">Referral Program</TabsTrigger>
            <TabsTrigger value="timeline">Unlock Timeline</TabsTrigger>
          </TabsList>
          
          {/* Feature Access Tab */}
          <TabsContent value="features" className="mt-0">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-3">
                Features are unlocked progressively as you complete profile steps. Here's what you can access at each level:
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FEATURES.map((feature) => (
                  <Card key={feature.id} className="overflow-hidden">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-md font-medium flex items-center gap-2">
                        {feature.icon}
                        {feature.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                      <div className="mt-2 text-xs px-2 py-1 rounded-full inline-flex items-center gap-1 bg-primary/10 text-primary">
                        {feature.accessLevel === 'basic' ? 'Available Now' : getAccessLevelDescription(feature.accessLevel)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
          
          {/* Referral Program Tab */}
          <TabsContent value="referrals" className="mt-0">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground mb-3">
                The referral program is available to all users immediately after registration. Share HyperDAG with others to earn rewards!
              </p>
              
              <div className="bg-primary/5 p-4 rounded-lg">
                <h3 className="text-md font-medium mb-2">Referral Rewards System</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-semibold">•</span>
                    <span><strong>Reputation Points:</strong> Earn 10 points for each verified referral</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 font-semibold">•</span>
                    <span><strong>Tokens:</strong> Earn 5 tokens when your referral completes profile setup</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-500 font-semibold">•</span>
                    <span><strong>Time-Sensitive:</strong> Rewards decay over time, so share early!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-semibold">•</span>
                    <span><strong>Multi-Level:</strong> Earn rewards from their referrals too (up to 3 levels)</span>
                  </li>
                </ul>
              </div>
              
              <div className="bg-yellow-500/10 p-4 rounded-lg">
                <h3 className="text-md font-medium mb-2 flex items-center gap-2">
                  <Hourglass className="h-4 w-4" />
                  Time-Decay Mechanism
                </h3>
                <p className="text-sm">
                  Our AI-powered time-decay system incentivizes quick action. The value of pending rewards decreases by 5% each day until your referral completes their profile. Share now for maximum rewards!
                </p>
              </div>
            </div>
          </TabsContent>
          
          {/* Timeline Tab */}
          <TabsContent value="timeline" className="mt-0">
            <div className="relative space-y-6 pl-6 before:absolute before:left-2 before:top-2 before:h-[calc(100%-16px)] before:w-[2px] before:bg-border">
              <div className="relative">
                <div className="absolute left-[-24px] top-2 h-4 w-4 rounded-full bg-primary"></div>
                <h3 className="text-md font-medium">1. Basic Access</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Available immediately after registration. Access to dashboard, referrals, and documentation.
                </p>
              </div>
              
              <div className="relative">
                <div className="absolute left-[-24px] top-2 h-4 w-4 rounded-full bg-muted"></div>
                <h3 className="text-md font-medium">2. Email Verification</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Verify your email to unlock Reputation Center and personalized features.
                </p>
              </div>
              
              <div className="relative">
                <div className="absolute left-[-24px] top-2 h-4 w-4 rounded-full bg-muted"></div>
                <h3 className="text-md font-medium">3. Knowledge Assessment</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Complete persona-specific questions to unlock Grant Matching and additional features.
                </p>
              </div>
              
              <div className="relative">
                <div className="absolute left-[-24px] top-2 h-4 w-4 rounded-full bg-muted"></div>
                <h3 className="text-md font-medium">4. Enhanced Security (2FA)</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Set up two-factor authentication to unlock Developer Hub and advanced tools.
                </p>
              </div>
              
              <div className="relative">
                <div className="absolute left-[-24px] top-2 h-4 w-4 rounded-full bg-muted"></div>
                <h3 className="text-md font-medium">5. Wallet Connection</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Connect your Web3 wallet to unlock full platform access, including token rewards and blockchain features.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:justify-between mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Explore at My Own Pace
          </Button>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="secondary" onClick={handleReferralAccess}>
              Access Referrals
            </Button>
            <Button onClick={handleCompleteProfile}>
              Complete Profile
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}