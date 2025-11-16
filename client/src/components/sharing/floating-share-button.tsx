import React, { useState } from 'react';
import { Share2, X, Link, Twitter, Facebook, Award } from 'lucide-react';
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function FloatingShareButton() {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // Always show button, but change functionality for non-logged users
  const isLoggedIn = !!user;
  
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };
  
  const shareLink = async () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    
    const referralCode = user.referralCode || '';
    const url = `${window.location.origin}/join?referrer=${referralCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on HyperDAG',
          text: 'Join me on HyperDAG, a decentralized platform for collaborative projects and rewards.',
          url
        });
        
        toast({
          title: "Thanks for sharing!",
          description: "You'll earn HDAG tokens for successful referrals",
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(url)
        .then(() => {
          toast({
            title: "Link copied!",
            description: "Share it with your friends to earn rewards",
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
    
    // Close menu after sharing
    setIsExpanded(false);
  };
  
  const shareOnTwitter = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    const referralCode = user?.referralCode || '';
    const url = `${window.location.origin}/join?referrer=${referralCode}`;
    const text = encodeURIComponent('Join me on HyperDAG, a decentralized platform for collaborative projects and rewards.');
    const shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${text}`;
    window.open(shareUrl, '_blank');
    setIsExpanded(false);
  };
  
  const shareOnFacebook = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    const referralCode = user?.referralCode || '';
    const url = `${window.location.origin}/join?referrer=${referralCode}`;
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank');
    setIsExpanded(false);
  };
  
  const handleLogin = () => {
    navigate('/login');
    setIsExpanded(false);
  };
  
  const handleRegister = () => {
    navigate('/register');
    setIsExpanded(false);
  };
  
  const viewAchievements = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    navigate('/achievements');
    setIsExpanded(false);
  };
  
  return (
    <div className="fixed bottom-20 md:bottom-8 right-20 md:right-20 z-50">
      {/* Expanded Share Menu */}
      {isExpanded && (
        <div className="bg-white rounded-lg shadow-lg p-2 mb-2 grid grid-cols-2 gap-2 animate-in fade-in zoom-in">
          {isLoggedIn ? (
            <>
              <button 
                onClick={shareLink}
                className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-100 text-gray-700"
                aria-label="Copy link"
              >
                <Link className="h-6 w-6 mb-1 text-blue-500" />
                <span className="text-xs">Copy Link</span>
              </button>
              
              <button 
                onClick={shareOnTwitter}
                className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-100 text-gray-700"
                aria-label="Share on Twitter"
              >
                <Twitter className="h-6 w-6 mb-1 text-blue-400" />
                <span className="text-xs">Twitter</span>
              </button>
              
              <button 
                onClick={shareOnFacebook}
                className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-100 text-gray-700"
                aria-label="Share on Facebook"
              >
                <Facebook className="h-6 w-6 mb-1 text-blue-600" />
                <span className="text-xs">Facebook</span>
              </button>
              
              <button 
                onClick={viewAchievements}
                className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-100 text-gray-700"
                aria-label="View achievements"
              >
                <Award className="h-6 w-6 mb-1 text-amber-500" />
                <span className="text-xs">Achievements</span>
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleLogin}
                className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-100 text-gray-700"
                aria-label="Login"
              >
                <Link className="h-6 w-6 mb-1 text-green-500" />
                <span className="text-xs">Login</span>
              </button>
              
              <button 
                onClick={handleRegister}
                className="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-gray-100 text-gray-700"
                aria-label="Register"
              >
                <Award className="h-6 w-6 mb-1 text-purple-500" />
                <span className="text-xs">Register</span>
              </button>
            </>
          )}
        </div>
      )}
      
      {/* Main Button */}
      <button
        onClick={toggleExpand}
        className="bg-primary hover:bg-primary/90 text-white p-3 rounded-full shadow-lg flex items-center justify-center transition-all"
        aria-label={isExpanded ? "Close share menu" : "Open share menu"}
      >
        {isExpanded ? (
          <X className="h-6 w-6" />
        ) : (
          <Share2 className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}