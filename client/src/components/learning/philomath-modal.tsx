import React, { useState, useEffect } from 'react';
import { usePhilomath, PHILOMATH_TOPICS } from '@/hooks/use-philomath';
import { BookmarkIcon, XIcon, CheckIcon, BookOpenIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface PhilomathModalProps {
  topicId: string;
  onClose: () => void;
}

export default function PhilomathModal({ topicId, onClose }: PhilomathModalProps) {
  const { toast } = useToast();
  const { 
    markTopicViewed, 
    markTopicCompleted, 
    toggleBookmark,
    isTopicCompleted,
    isTopicBookmarked,
    isEnabled,
    toggleEnabled
  } = usePhilomath();
  
  const [topic, setTopic] = useState<typeof PHILOMATH_TOPICS[0] | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Find the topic by ID
  useEffect(() => {
    const foundTopic = PHILOMATH_TOPICS.find(t => t.id === topicId);
    if (foundTopic) {
      setTopic(foundTopic);
      setIsBookmarked(isTopicBookmarked(topicId));
      setIsCompleted(isTopicCompleted(topicId));
      
      // Mark topic as viewed when opened
      markTopicViewed(topicId);
    }
  }, [topicId, isTopicBookmarked, isTopicCompleted, markTopicViewed]);
  
  const handleComplete = async () => {
    try {
      await markTopicCompleted(topicId);
      setIsCompleted(true);
    } catch (error) {
      toast({
        title: "Failed to mark topic as completed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  const handleToggleBookmark = async () => {
    try {
      await toggleBookmark(topicId);
      setIsBookmarked(!isBookmarked);
    } catch (error) {
      toast({
        title: "Failed to update bookmark",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  if (!topic) return null;
  
  // Determine level badge color
  const levelColor = {
    beginner: 'bg-green-500',
    intermediate: 'bg-blue-500',
    advanced: 'bg-purple-500'
  }[topic.level] || 'bg-gray-500';
  
  // Determine category color
  const categoryColor = {
    blockchain: 'bg-blue-100 text-blue-800',
    reputation: 'bg-green-100 text-green-800',
    privacy: 'bg-purple-100 text-purple-800',
    security: 'bg-red-100 text-red-800',
    funding: 'bg-yellow-100 text-yellow-800',
    ai: 'bg-pink-100 text-pink-800',
    tokenomics: 'bg-orange-100 text-orange-800',
    governance: 'bg-indigo-100 text-indigo-800'
  }[topic.category] || 'bg-gray-100 text-gray-800';
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Badge className={categoryColor}>
              {topic.category.charAt(0).toUpperCase() + topic.category.slice(1)}
            </Badge>
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full ${levelColor} mr-1`}></div>
              <span className="text-xs text-gray-500 capitalize">{topic.level}</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <span className="text-sm mr-2">Learning Mode</span>
              <Switch 
                checked={isEnabled} 
                onCheckedChange={toggleEnabled} 
              />
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <h2 className="text-2xl font-bold mb-4">{topic.title}</h2>
          
          <div className="prose prose-sm md:prose max-w-none">
            {topic.content.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4">{paragraph}</p>
            ))}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t flex justify-between items-center">
          <div className="flex items-center space-x-2">
            {isCompleted ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <CheckIcon className="w-3 h-3 mr-1" /> Completed
              </Badge>
            ) : (
              <Badge variant="outline">
                <BookOpenIcon className="w-3 h-3 mr-1" /> Viewed
              </Badge>
            )}
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleToggleBookmark}
              className={isBookmarked ? 'text-yellow-500' : 'text-gray-400'}
            >
              <BookmarkIcon className="w-4 h-4" />
            </Button>
            
            {!isCompleted && (
              <Button onClick={handleComplete}>
                <CheckIcon className="w-4 h-4 mr-1" /> Mark Completed
              </Button>
            )}
            
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// First-Visit Popup Component to be used throughout the application
export function FirstVisitPopup() {
  const { isEnabled, viewedTopics, markTopicViewed } = usePhilomath();
  const [currentTopicId, setCurrentTopicId] = useState<string | null>(null);
  const [showingModal, setShowingModal] = useState(false);
  const [checkedPath, setCheckedPath] = useState(false);
  
  // Logic to show popups on first visit to different pages
  useEffect(() => {
    // Only run once per path and only if learning mode is enabled
    if (checkedPath || !isEnabled) return;
    
    // Determine which topic to show based on the current page
    const pathname = window.location.pathname;
    let topicToShow: string | null = null;
    
    if (pathname === "/" && !viewedTopics.has("dag-intro")) {
      topicToShow = "dag-intro";
    } else if (pathname === "/reputation" && !viewedTopics.has("repid-intro")) {
      topicToShow = "repid-intro";
    } else if (pathname === "/web3" && !viewedTopics.has("zkp-intro")) {
      topicToShow = "zkp-intro";
    } else if (pathname === "/profile" && !viewedTopics.has("4fa-intro")) {
      topicToShow = "4fa-intro";
    } else if (pathname === "/projects" && !viewedTopics.has("hypercrowd-intro")) {
      topicToShow = "hypercrowd-intro";
    }
    
    setCheckedPath(true);
    
    if (topicToShow) {
      // Add a slight delay to avoid immediate popup
      const timer = setTimeout(() => {
        setCurrentTopicId(topicToShow);
        setShowingModal(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isEnabled, viewedTopics, checkedPath, markTopicViewed]);
  
  // Reset the checkedPath when pathname changes
  useEffect(() => {
    const handleRouteChange = () => {
      setCheckedPath(false);
    };
    
    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);
  
  if (!showingModal || !currentTopicId) return null;
  
  return (
    <PhilomathModal 
      topicId={currentTopicId} 
      onClose={() => setShowingModal(false)} 
    />
  );
}