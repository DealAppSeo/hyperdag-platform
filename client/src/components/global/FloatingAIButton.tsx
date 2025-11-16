import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, MessageCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import AIAssistant from './AIAssistant';

export default function FloatingAIButton() {
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const { user } = useAuth();

  // Show highlight for first-time visitors
  useEffect(() => {
    if (user) {
      const hasSeenAI = localStorage.getItem(`ai_intro_seen_${user.id}`);
      if (!hasSeenAI && user.onboardingStage <= 2) {
        // Show highlight after a delay for new users
        const timer = setTimeout(() => {
          setShowHighlight(true);
          setShowTooltip(true);
          
          // Auto-hide tooltip after 8 seconds
          setTimeout(() => {
            setShowTooltip(false);
          }, 8000);
        }, 3000);

        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const handleClick = () => {
    // Mark AI intro as seen when clicked
    if (user && showHighlight) {
      localStorage.setItem(`ai_intro_seen_${user.id}`, 'true');
      setShowHighlight(false);
      setShowTooltip(false);
    }
    setIsAIOpen(!isAIOpen);
  };

  return (
    <>
      {/* Tooltip for first-time users */}
      {showTooltip && (
        <div className="fixed bottom-20 right-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg z-50 max-w-xs">
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <div className="font-medium text-gray-900 dark:text-gray-100">
                AI Assistant Available!
              </div>
              <div className="text-gray-600 dark:text-gray-300 mt-1">
                Get your referral code, find grants, connect with collaborators, and maximize your HyperDAG experience!
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 right-6 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white dark:border-t-gray-800 translate-y-full"></div>
        </div>
      )}

      {/* Floating AI Button - positioned for optimal mobile/desktop UX */}
      <Button
        onClick={handleClick}
        className={`fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-40 ${
          isAIOpen ? 'bg-purple-700 hover:bg-purple-800' : 'bg-purple-600 hover:bg-purple-700'
        } ${showHighlight ? 'ring-4 ring-purple-300 ring-opacity-75 animate-pulse' : ''}`}
        size="sm"
      >
        {isAIOpen ? (
          <MessageCircle className="h-5 w-5 text-white" />
        ) : (
          <div className="relative">
            <Bot className="h-5 w-5 text-white" />
            {/* Online indicator */}
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
            {/* New feature indicator for first-time users */}
            {showHighlight && (
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center">
                <Sparkles className="h-2 w-2 text-white" />
              </div>
            )}
          </div>
        )}
      </Button>

      {/* AI Assistant Component */}
      <AIAssistant
        isOpen={isAIOpen}
        onToggle={() => setIsAIOpen(!isAIOpen)}
      />
    </>
  );
}