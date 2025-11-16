import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Share, Twitter, Linkedin, Mail, Copy, Check, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";

// Types for the viral sharing feature
interface SocialShareOption {
  platform: string;
  icon: React.ReactNode;
  text: string;
  url: string;
  primaryColor: string;
}

interface SharingIncentiveProps {
  referralCode?: string;
  milestone?: string;
  className?: string;
}

const SharingIncentive: React.FC<SharingIncentiveProps> = ({ referralCode, milestone, className }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('share');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Create a referral URL with the user's code
  const baseUrl = window.location.origin;
  const referralUrl = `${baseUrl}/join?ref=${referralCode || (user?.referralCode || 'join')}`;
  
  // Default sharing text focused on benefits, not features
  const sharingText = milestone === 'profile_completed' 
    ? "I just built my privacy-protected identity on HyperDAG! Now I can prove my credentials without revealing personal data."
    : "I'm building my Web3 future on HyperDAG - where privacy meets opportunity!";
  
  // Define social sharing options with platform-specific formatting
  const shareOptions: SocialShareOption[] = [
    {
      platform: 'Twitter',
      icon: <Twitter className="h-4 w-4" />,
      text: `${sharingText} Join me with my referral code: ${referralCode || (user?.referralCode || 'join')} #Web3 #Privacy`,
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${sharingText} Join me with my referral code: ${referralCode || (user?.referralCode || 'join')} #Web3 #Privacy`)}&url=${encodeURIComponent(referralUrl)}`,
      primaryColor: 'bg-[#1DA1F2] hover:bg-[#1a94df]'
    },
    {
      platform: 'LinkedIn',
      icon: <Linkedin className="h-4 w-4" />,
      text: `${sharingText}\n\nI'm using HyperDAG to build my Web3 reputation while maintaining complete privacy control.\n\nJoin with my referral code for bonus rewards: ${referralCode || (user?.referralCode || 'join')}`,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`,
      primaryColor: 'bg-[#0077B5] hover:bg-[#006699]'
    },
    {
      platform: 'Email',
      icon: <Mail className="h-4 w-4" />,
      text: `Subject: Join me on HyperDAG for privacy-protected Web3 collaboration\n\nHey,\n\n${sharingText}\n\nHyperDAG is changing how we collaborate in Web3 while protecting our privacy.\n\nJoin with my referral code for bonus rewards: ${referralCode || (user?.referralCode || 'join')}\n\n${referralUrl}`,
      url: `mailto:?subject=${encodeURIComponent("Join me on HyperDAG for privacy-protected Web3 collaboration")}&body=${encodeURIComponent(`Hey,\n\n${sharingText}\n\nHyperDAG is changing how we collaborate in Web3 while protecting our privacy.\n\nJoin with my referral code for bonus rewards: ${referralCode || (user?.referralCode || 'join')}\n\n${referralUrl}`)}`,
      primaryColor: 'bg-[#D14836] hover:bg-[#C1402F]'
    }
  ];

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

  // Handle social media share click
  const handleShare = (option: SocialShareOption) => {
    window.open(option.url, '_blank');
  };

  return (
    <Card className={`border border-primary/20 ${className}`}>
      <CardHeader className="bg-primary/5 pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <Share className="h-5 w-5 text-primary" />
          Grow Your Network & Earn Rewards
        </CardTitle>
        <CardDescription>
          Share HyperDAG and you both benefit - your friends get a head start and you earn reputation points
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-4">
        <Tabs defaultValue="share" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="share">Share & Earn</TabsTrigger>
            <TabsTrigger value="rewards">Rewards Program</TabsTrigger>
          </TabsList>
          
          <TabsContent value="share" className="space-y-4">
            {/* Referral code display with copy option */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Referral Code</label>
              <div className="flex">
                <Input 
                  value={referralCode || (user?.referralCode || 'loading...')} 
                  readOnly 
                  className="rounded-r-none font-medium"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-l-none border-l-0" 
                  onClick={() => copyToClipboard(referralCode || (user?.referralCode || ''))}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {/* Referral URL with copy option */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Referral Link</label>
              <div className="flex">
                <Input 
                  value={referralUrl} 
                  readOnly 
                  className="rounded-r-none font-medium text-xs sm:text-sm"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-l-none border-l-0" 
                  onClick={() => copyToClipboard(referralUrl)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {/* Social sharing options */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Share with your network</label>
              <div className="flex flex-col space-y-2">
                {shareOptions.map((option) => (
                  <Button 
                    key={option.platform}
                    variant="outline"
                    className={`w-full justify-start text-white ${option.primaryColor}`}
                    onClick={() => handleShare(option)}
                  >
                    {option.icon}
                    <span className="ml-2">Share on {option.platform}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Social proof section */}
            <div className="mt-6 p-3 border rounded-md bg-gray-50 dark:bg-gray-900 italic text-sm">
              <p>&quot;After sharing HyperDAG with my network, three colleagues joined and we ended up collaborating on a funded project within weeks.&quot;</p>
              <p className="text-right mt-1 not-italic font-medium">– Alex K., Web3 Developer</p>
            </div>
          </TabsContent>
          
          <TabsContent value="rewards" className="space-y-4">
            <div className="space-y-1 mb-4">
              <h3 className="font-medium">Early Adopter Rewards</h3>
              <Progress value={45} className="h-2" />
              <p className="text-sm text-muted-foreground">
                <Badge variant="outline" className="mr-2 bg-primary/10 text-primary border-primary/20">
                  5x Multiplier Active
                </Badge>
                <span>Early adopter bonus expires in 14 days</span>
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium flex items-center gap-2">
                <Award className="h-4 w-4 text-primary" />
                Reward Tiers
              </h3>
              
              <div className="space-y-3">
                <div className="p-3 border rounded-md bg-primary/5">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Tier 1: 1-5 referrals</h4>
                    <Badge>Standard</Badge>
                  </div>
                  <p className="text-sm">500 reputation points per referral</p>
                  <p className="text-sm text-primary font-semibold mt-1">Currently 5x bonus: 2,500 points per referral!</p>
                </div>
                
                <div className="p-3 border rounded-md">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Tier 2: 6-15 referrals</h4>
                    <Badge variant="outline">Advanced</Badge>
                  </div>
                  <p className="text-sm">750 reputation points per referral</p>
                  <p className="text-sm text-muted-foreground mt-1">With 5x bonus: 3,750 points per referral</p>
                </div>
                
                <div className="p-3 border rounded-md">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Tier 3: 16+ referrals</h4>
                    <Badge variant="outline">Expert</Badge>
                  </div>
                  <p className="text-sm">1,000 reputation points per referral + Community Leader badge</p>
                  <p className="text-sm text-muted-foreground mt-1">With 5x bonus: 5,000 points per referral</p>
                </div>
              </div>
            </div>
            
            {/* Friend rewards */}
            <div className="mt-4 p-3 border rounded-md bg-gray-50 dark:bg-gray-900">
              <h4 className="font-medium">Your friends get:</h4>
              <ul className="text-sm mt-1 space-y-1">
                <li>• 250 bonus reputation points for joining with your code</li>
                <li>• Early access to all platform features</li>
                <li>• Priority matching for opportunities</li>
              </ul>
            </div>
            
            {/* Risk removal section */}
            <div className="mt-2 text-sm text-muted-foreground">
              <p>Your data stays yours - Zero-knowledge proofs ensure your privacy is mathematically guaranteed.</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="border-t pt-4 flex justify-between">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium">5,000+ professionals</span> already on HyperDAG
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setActiveTab(activeTab === 'share' ? 'rewards' : 'share')}
        >
          {activeTab === 'share' ? 'View Rewards' : 'Back to Sharing'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SharingIncentive;