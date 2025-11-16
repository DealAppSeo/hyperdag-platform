import React, { useRef } from 'react';
import { Share2, Download, Copy, Award, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getUserReferralCount } from "@/lib/utils";
import html2canvas from 'html2canvas';

interface AchievementCardProps {
  title: string;
  description: string;
  image?: string;
  achievementType: 'referral' | 'contribution' | 'verification' | 'reputation';
  points: number;
  onShare?: () => void;
}

export function AchievementCard({ 
  title, 
  description, 
  image, 
  achievementType, 
  points,
  onShare 
}: AchievementCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  if (!user) return null;
  
  // Get achievement icon based on type
  const getIcon = () => {
    switch (achievementType) {
      case 'referral':
        return <Users className="h-8 w-8 text-blue-500" />;
      case 'contribution':
        return <Award className="h-8 w-8 text-green-500" />;
      case 'verification':
        return <Award className="h-8 w-8 text-purple-500" />;
      case 'reputation':
        return <TrendingUp className="h-8 w-8 text-orange-500" />;
      default:
        return <Award className="h-8 w-8 text-blue-500" />;
    }
  };

  // Get achievement color based on type
  const getGradient = () => {
    switch (achievementType) {
      case 'referral':
        return 'from-blue-500 to-indigo-600';
      case 'contribution':
        return 'from-green-500 to-emerald-600';
      case 'verification':
        return 'from-purple-500 to-violet-600';
      case 'reputation':
        return 'from-orange-500 to-amber-600';
      default:
        return 'from-blue-500 to-indigo-600';
    }
  };

  // Download card as image
  const downloadCard = async () => {
    if (!cardRef.current) return;
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 2, // Higher quality
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `hyperdag-${achievementType}-achievement.png`;
      link.href = dataUrl;
      link.click();
      
      toast({
        title: "Achievement downloaded!",
        description: "Your achievement card has been saved as an image",
      });
    } catch (error) {
      console.error('Error downloading card:', error);
      toast({
        title: "Download failed",
        description: "Please try again later",
        variant: "destructive",
      });
    }
  };

  // Share achievement via Web Share API
  const shareAchievement = async () => {
    // Call onShare if provided
    if (onShare) onShare();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My HyperDAG Achievement',
          text: `I just earned the "${title}" achievement on HyperDAG with ${points} points! Check it out:`,
          url: window.location.origin,
        });
        
        toast({
          title: "Thanks for sharing!",
          description: "Your achievement has been shared",
        });
      } catch (error) {
        // User cancelled or share failed
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to copying achievement text
      navigator.clipboard.writeText(
        `I just earned the "${title}" achievement on HyperDAG with ${points} points! Check it out: ${window.location.origin}`
      )
        .then(() => {
          toast({
            title: "Link copied!",
            description: "Share it with your friends",
          });
        })
        .catch(() => {
          toast({
            title: "Failed to copy",
            description: "Please try again",
            variant: "destructive",
          });
        });
    }
  };

  return (
    <Card className="overflow-hidden border-2 bg-white max-w-md mx-auto">
      <div 
        ref={cardRef}
        className="relative"
      >
        {/* Header with gradient */}
        <div className={`bg-gradient-to-r ${getGradient()} text-white p-4 relative`}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl font-bold">{title}</CardTitle>
              <p className="text-sm text-white/90 mt-1">{description}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
              {getIcon()}
            </div>
          </div>
        </div>

        {/* Achievement details */}
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-700">Achievement Points</h3>
              <p className="text-2xl font-bold text-primary">{points}</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-700">Current Rank</h3>
              <p className="text-sm font-medium">
                {getUserReferralCount(user) < 5 ? 'Beginner' : 
                 getUserReferralCount(user) < 10 ? 'Explorer' : 
                 getUserReferralCount(user) < 20 ? 'Advocate' : 'Champion'}
              </p>
            </div>
          </div>
          
          {/* Earned by info */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Earned by</p>
            <div className="flex items-center mt-1">
              <div className="bg-gray-100 rounded-full h-8 w-8 flex items-center justify-center mr-2 overflow-hidden">
                <span className="font-medium text-sm">
                  {user.username.substring(0, 2).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{user.username}</p>
                <p className="text-xs text-gray-500">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </div>
      
      {/* Actions footer */}
      <CardFooter className="flex justify-between border-t border-gray-100 p-4 bg-gray-50">
        <Button 
          variant="outline" 
          size="sm"
          onClick={downloadCard}
          className="flex items-center"
        >
          <Download className="h-4 w-4 mr-1" />
          Save
        </Button>
        <Button 
          size="sm"
          onClick={shareAchievement}
          className="flex items-center"
        >
          <Share2 className="h-4 w-4 mr-1" />
          Share
        </Button>
      </CardFooter>
    </Card>
  );
}
