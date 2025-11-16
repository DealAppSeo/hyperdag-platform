import React, { useState } from 'react';
import { usePhilomath, PHILOMATH_TOPICS } from '@/hooks/use-philomath';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import PhilomathModal from '@/components/learning/philomath-modal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BookmarkIcon, CheckIcon, BookOpenIcon, StarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Layout } from "@/components/layout/layout";

interface TopicCardProps {
  topic: {
    id: string;
    title: string;
    category: string;
    level: string;
  };
  isViewed: boolean;
  isCompleted: boolean;
  isBookmarked: boolean;
  onView: () => void;
  onMarkCompleted: () => void;
  onToggleBookmark: () => void;
}

function TopicCard({ 
  topic, 
  isViewed, 
  isCompleted, 
  isBookmarked, 
  onView, 
  onMarkCompleted,
  onToggleBookmark 
}: TopicCardProps) {
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
    <Card className={`overflow-hidden ${isCompleted ? 'border-green-500' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start mb-2">
          <Badge className={categoryColor}>
            {topic.category.charAt(0).toUpperCase() + topic.category.slice(1)}
          </Badge>
          <div className="flex">
            {isViewed && !isCompleted && (
              <Badge variant="outline" className="mr-1">
                <BookOpenIcon className="w-3 h-3 mr-1" /> Viewed
              </Badge>
            )}
            {isCompleted && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 mr-1">
                <CheckIcon className="w-3 h-3 mr-1" /> Completed
              </Badge>
            )}
          </div>
        </div>
        <CardTitle className="text-lg">{topic.title}</CardTitle>
        <div className="flex items-center mt-1">
          <div className={`w-2 h-2 rounded-full ${levelColor} mr-2`}></div>
          <span className="text-xs text-gray-500 capitalize">{topic.level}</span>
        </div>
      </CardHeader>
      <CardFooter className="flex justify-between pt-2">
        <Button variant="outline" size="sm" onClick={onView}>
          <BookOpenIcon className="w-4 h-4 mr-1" /> View
        </Button>
        <div className="flex space-x-1">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onToggleBookmark}
            className={isBookmarked ? 'text-yellow-500' : 'text-gray-400'}
          >
            <BookmarkIcon className="w-4 h-4" />
          </Button>
          {isViewed && !isCompleted && (
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onMarkCompleted}
              className="text-gray-400 hover:text-green-500"
            >
              <CheckIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

export default function LearningPage() {
  const { toast } = useToast();
  const { 
    isEnabled, 
    toggleEnabled, 
    viewedTopics, 
    completedTopics, 
    bookmarkedTopics,
    markTopicCompleted,
    toggleBookmark 
  } = usePhilomath();
  
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  
  const handleMarkCompleted = async (topicId: string) => {
    try {
      await markTopicCompleted(topicId);
    } catch (error) {
      toast({
        title: "Failed to mark topic as completed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  const handleToggleBookmark = async (topicId: string) => {
    try {
      await toggleBookmark(topicId);
    } catch (error) {
      toast({
        title: "Failed to update bookmark",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  // Group topics by category for the tabs
  const categories = Array.from(new Set(PHILOMATH_TOPICS.map(topic => topic.category)));
  
  // Statistics
  const totalTopics = PHILOMATH_TOPICS.length;
  const viewedCount = viewedTopics.size;
  const completedCount = completedTopics.size;
  const bookmarkedCount = bookmarkedTopics.size;
  const progressPercentage = Math.round((completedCount / totalTopics) * 100);
  
  return (
    <Layout>
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">HyperDAG Learning</h1>
            <p className="text-gray-600 mb-4">Learn about Web3 concepts and HyperDAG technologies</p>
          </div>
          
          <div className="flex items-center">
            <span className="mr-2 text-sm">Learning Mode</span>
            <Switch checked={isEnabled} onCheckedChange={toggleEnabled} />
          </div>
        </div>
      
        {/* Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{progressPercentage}%</div>
              <p className="text-sm text-gray-500">{completedCount} of {totalTopics} topics completed</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-primary rounded-full h-2" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Viewed</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <BookOpenIcon className="w-10 h-10 text-blue-500 mr-3" />
              <div>
                <div className="text-3xl font-bold">{viewedCount}</div>
                <p className="text-sm text-gray-500">topics viewed</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Completed</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <CheckIcon className="w-10 h-10 text-green-500 mr-3" />
              <div>
                <div className="text-3xl font-bold">{completedCount}</div>
                <p className="text-sm text-gray-500">topics completed</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Bookmarked</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center">
              <BookmarkIcon className="w-10 h-10 text-yellow-500 mr-3" />
              <div>
                <div className="text-3xl font-bold">{bookmarkedCount}</div>
                <p className="text-sm text-gray-500">topics saved</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Topic Tabs */}
        <Tabs defaultValue="all">
          <TabsList className="mb-6">
            <TabsTrigger value="all">All Topics</TabsTrigger>
            {categories.map(category => (
              <TabsTrigger key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </TabsTrigger>
            ))}
            <TabsTrigger value="bookmarked">Bookmarked</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PHILOMATH_TOPICS.map(topic => (
              <TopicCard 
                key={topic.id}
                topic={topic}
                isViewed={viewedTopics.has(topic.id)}
                isCompleted={completedTopics.has(topic.id)}
                isBookmarked={bookmarkedTopics.has(topic.id)}
                onView={() => setSelectedTopicId(topic.id)}
                onMarkCompleted={() => handleMarkCompleted(topic.id)}
                onToggleBookmark={() => handleToggleBookmark(topic.id)}
              />
            ))}
          </TabsContent>
          
          {categories.map(category => (
            <TabsContent key={category} value={category} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PHILOMATH_TOPICS.filter(topic => topic.category === category).map(topic => (
                <TopicCard 
                  key={topic.id}
                  topic={topic}
                  isViewed={viewedTopics.has(topic.id)}
                  isCompleted={completedTopics.has(topic.id)}
                  isBookmarked={bookmarkedTopics.has(topic.id)}
                  onView={() => setSelectedTopicId(topic.id)}
                  onMarkCompleted={() => handleMarkCompleted(topic.id)}
                  onToggleBookmark={() => handleToggleBookmark(topic.id)}
                />
              ))}
            </TabsContent>
          ))}
          
          <TabsContent value="bookmarked" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PHILOMATH_TOPICS.filter(topic => bookmarkedTopics.has(topic.id)).map(topic => (
              <TopicCard 
                key={topic.id}
                topic={topic}
                isViewed={viewedTopics.has(topic.id)}
                isCompleted={completedTopics.has(topic.id)}
                isBookmarked={true}
                onView={() => setSelectedTopicId(topic.id)}
                onMarkCompleted={() => handleMarkCompleted(topic.id)}
                onToggleBookmark={() => handleToggleBookmark(topic.id)}
              />
            ))}
            {bookmarkedTopics.size === 0 && (
              <div className="col-span-full text-center p-12 text-gray-500">
                <BookmarkIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>You haven't bookmarked any topics yet.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="completed" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PHILOMATH_TOPICS.filter(topic => completedTopics.has(topic.id)).map(topic => (
              <TopicCard 
                key={topic.id}
                topic={topic}
                isViewed={viewedTopics.has(topic.id)}
                isCompleted={true}
                isBookmarked={bookmarkedTopics.has(topic.id)}
                onView={() => setSelectedTopicId(topic.id)}
                onMarkCompleted={() => handleMarkCompleted(topic.id)}
                onToggleBookmark={() => handleToggleBookmark(topic.id)}
              />
            ))}
            {completedTopics.size === 0 && (
              <div className="col-span-full text-center p-12 text-gray-500">
                <CheckIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>You haven't completed any topics yet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
        {/* Topic Modal */}
        {selectedTopicId && (
          <PhilomathModal 
            topicId={selectedTopicId} 
            onClose={() => setSelectedTopicId(null)} 
          />
        )}
      </div>
    </Layout>
  );
}
