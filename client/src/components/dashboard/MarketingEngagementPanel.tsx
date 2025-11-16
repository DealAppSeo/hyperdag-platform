import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { 
  ArrowRight, 
  Award, 
  Share, 
  Users, 
  Shield, 
  Sparkles, 
  Twitter, 
  Linkedin, 
  Mail, 
  Copy, 
  Check 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Simplified marketing panel that uses psychology principles
const MarketingEngagementPanel: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('transform');
  const [copied, setCopied] = useState(false);
  
  // Calculate a basic profile completion score
  const profileCompletion = calculateCompletion();
  
  // Generate a sample referral code or use the user's real one
  const referralCode = user?.referralCode || `${user?.username?.substring(0, 4).toUpperCase() || 'USER'}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
  
  // Early adopter rewards multiplier (creates scarcity/urgency)
  const rewardsMultiplier = 5;
  
  // Handle copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      description: "You can now paste and share it anywhere",
    });
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Simplified profile completion calculator
  function calculateCompletion(): number {
    if (!user) return 0;
    
    // Basic profile completion factors
    let completed = 0;
    const total = 5;
    
    if (user.username) completed++;
    if (user.email) completed++;
    if (user.walletAddress) completed++;
    if (user.persona) completed++;
    if (user.bio) completed++;
    
    return Math.round((completed / total) * 100);
  }
  
  // Get persona-specific content
  function getPersonaContent() {
    const persona = user?.persona || 'general';
    
    const content = {
      developer: {
        before: "Spending hours proving your skills on every project application",
        after: "Getting opportunities based on verified credentials, not who you know",
        benefit: "Build your reputation with privacy-protected credentials",
        nextStep: "Connect your GitHub to verify your skills"
      },
      designer: {
        before: "Sharing your entire portfolio with no privacy control",
        after: "Selectively sharing only the work relevant to each opportunity",
        benefit: "Create a privacy-first professional profile",
        nextStep: "Upload design samples to attract perfect-fit projects"
      },
      influencer: {
        before: "Building audiences that don't translate to opportunities",
        after: "Connecting your community to perfect-fit projects with rewards",
        benefit: "Connect your audience to opportunities that matter",
        nextStep: "Link your social accounts to unlock community rewards"
      },
      general: {
        before: "Choosing between opportunity and privacy",
        after: "Having both - verified credentials without revealing sensitive details",
        benefit: "Where privacy meets opportunity",
        nextStep: "Complete your profile to unlock personalized opportunities"
      }
    };
    
    return content[persona as keyof typeof content] || content.general;
  }
  
  const personaContent = getPersonaContent();
  
  return (
    <Card className="border-primary/20">
      <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Your HyperDAG Journey</CardTitle>
          {profileCompletion >= 50 && (
            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none">
              <Sparkles className="h-3 w-3 mr-1" />
              <span>{rewardsMultiplier}x Rewards Active</span>
            </Badge>
          )}
        </div>
        <CardDescription>
          {profileCompletion < 75 
            ? "Complete your transformation and unlock exclusive features" 
            : "Share your success and earn maximum rewards"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-2 rounded-none border-b">
            <TabsTrigger value="transform" className="rounded-none data-[state=active]:bg-primary/5">
              Transformation
            </TabsTrigger>
            <TabsTrigger value="share" className="rounded-none data-[state=active]:bg-primary/5">
              Share & Earn
            </TabsTrigger>
          </TabsList>
          
          <div className="p-6">
            <TabsContent value="transform" className="m-0 space-y-4">
              {/* Progress section */}
              <div className="space-y-2">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Profile Completion</span>
                  <span className="text-sm font-medium">{profileCompletion}%</span>
                </div>
                <Progress value={profileCompletion} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">
                  {profileCompletion < 50 ? 
                    "Complete 50% to unlock Grant Matching" : 
                    profileCompletion < 75 ? 
                    "Complete 75% to unlock Team Formation" : 
                    "Complete 100% for maximum reputation rewards"}
                </p>
              </div>
              
              {/* Transformation journey - Before & After */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium">Your Transformation Journey</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border bg-muted/50">
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Before</h4>
                    <p className="text-sm">{personaContent.before}</p>
                  </div>
                  <div className="p-3 rounded-lg border bg-primary/5">
                    <h4 className="text-sm font-medium text-primary mb-1">After</h4>
                    <p className="text-sm font-medium">{personaContent.after}</p>
                  </div>
                </div>
              </div>
              
              {/* Next steps with urgency */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center">
                  <ArrowRight className="mr-1 h-4 w-4 text-primary" />
                  Next Step to Transform
                </h3>
                <div className="p-3 rounded-lg border">
                  <p className="text-sm font-medium">{personaContent.nextStep}</p>
                  <p className="text-xs text-primary mt-1 font-medium">
                    Early adopters receive 5x reputation multiplier - limited time only!
                  </p>
                </div>
              </div>
              
              {/* Social proof */}
              <div className="p-3 border rounded-md bg-muted/20 italic text-sm">
                <p>&quot;After completing my HyperDAG profile, I received three collaboration offers within a week. The privacy controls let me share credentials without exposing personal details.&quot;</p>
                <p className="text-right mt-1 not-italic text-xs font-medium">– Alex K., {user?.persona === 'developer' ? 'Developer' : user?.persona === 'designer' ? 'Designer' : user?.persona === 'influencer' ? 'Content Creator' : 'Web3 Professional'}</p>
              </div>
            </TabsContent>
            
            <TabsContent value="share" className="m-0 space-y-4">
              {/* Referral code section */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Your Referral Code</h3>
                <div className="flex">
                  <input 
                    value={referralCode}
                    readOnly
                    className="flex h-10 w-full rounded-md rounded-r-none border border-input bg-background px-3 py-2 text-sm font-medium"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="rounded-l-none border-l-0" 
                    onClick={() => copyToClipboard(referralCode)}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Share this code to earn rewards when friends join</p>
              </div>
              
              {/* Sharing buttons */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Share with your network</h3>
                <div className="flex flex-col gap-2">
                  <Button 
                    variant="outline"
                    className="w-full justify-start text-white bg-[#1DA1F2] hover:bg-[#1a94df] border-none"
                    onClick={() => {
                      const text = `I'm building my Web3 future on HyperDAG - where privacy meets opportunity! Join me with my referral code: ${referralCode} #Web3 #Privacy`;
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                  >
                    <Twitter className="h-4 w-4 mr-2" />
                    <span>Share on Twitter</span>
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full justify-start text-white bg-[#0077B5] hover:bg-[#006699] border-none"
                    onClick={() => {
                      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://hyperdag.org/join?ref=${referralCode}`)}`, '_blank');
                    }}
                  >
                    <Linkedin className="h-4 w-4 mr-2" />
                    <span>Share on LinkedIn</span>
                  </Button>
                  <Button 
                    variant="outline"
                    className="w-full justify-start text-white bg-[#D14836] hover:bg-[#C1402F] border-none"
                    onClick={() => {
                      const subject = "Join me on HyperDAG for privacy-protected Web3 collaboration";
                      const body = `Hey,\n\nI'm using HyperDAG to build my Web3 reputation while maintaining complete privacy control.\n\nJoin with my referral code for bonus rewards: ${referralCode}\n\nhttps://hyperdag.org/join?ref=${referralCode}`;
                      window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    <span>Share via Email</span>
                  </Button>
                </div>
              </div>
              
              {/* Reward tiers */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium flex items-center">
                  <Award className="h-4 w-4 mr-1 text-primary" />
                  Reward Tiers
                </h3>
                <div className="p-3 border rounded-md bg-primary/5">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium">1-5 referrals</p>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-none">5x Bonus</Badge>
                  </div>
                  <p className="text-xs mt-1">
                    <span className="font-medium">{500 * rewardsMultiplier} points</span> per referral during early adopter period
                  </p>
                </div>
              </div>
              
              {/* Social proof */}
              <div className="p-3 border rounded-md bg-muted/20 italic text-sm">
                <p>&quot;After sharing HyperDAG with my network, three colleagues joined and we ended up collaborating on a funded project within weeks.&quot;</p>
                <p className="text-right mt-1 not-italic text-xs font-medium">– Jordan M., Community Builder</p>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
      
      <CardFooter className="border-t p-4 flex flex-wrap gap-3 justify-between">
        <div className="text-sm text-muted-foreground flex items-center">
          <Award className="h-4 w-4 mr-1" />
          <span>Early adopter <span className="font-medium">5x bonus</span> active</span>
        </div>
        
        <Button
          variant={profileCompletion < 75 ? "default" : "outline"}
          size="sm"
          onClick={() => {
            if (profileCompletion < 75) {
              window.location.href = '/profile/edit';
            } else {
              setActiveTab(activeTab === 'transform' ? 'share' : 'transform');
            }
          }}
        >
          {profileCompletion < 75 ? (
            <>
              Complete Your Profile
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          ) : (
            activeTab === 'transform' ? (
              <>
                Share Your Journey
                <Share className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                View Your Progress
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default MarketingEngagementPanel;