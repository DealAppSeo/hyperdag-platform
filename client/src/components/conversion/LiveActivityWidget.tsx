import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, TrendingUp, DollarSign, Zap } from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'signup' | 'savings' | 'milestone' | 'testimonial';
  message: string;
  timestamp: Date;
  location?: string;
  amount?: string;
}

export function LiveActivityWidget() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [currentActivity, setCurrentActivity] = useState<ActivityItem | null>(null);

  // Mock activity data - in real app this would come from API
  const mockActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'signup',
      message: 'Alex from San Francisco just joined',
      timestamp: new Date(),
      location: 'San Francisco, CA'
    },
    {
      id: '2', 
      type: 'savings',
      message: 'Sarah saved $3,247 this month with HyperDAG',
      timestamp: new Date(),
      amount: '$3,247'
    },
    {
      id: '3',
      type: 'milestone',
      message: '2,847 developers now saving 79% on AI costs',
      timestamp: new Date()
    },
    {
      id: '4',
      type: 'testimonial',
      message: '"Cut our AI bills from $8K to $1.2K/month" - TechCorp CEO',
      timestamp: new Date()
    },
    {
      id: '5',
      type: 'signup',
      message: 'Maria from London just joined',
      timestamp: new Date(),
      location: 'London, UK'
    },
    {
      id: '6',
      type: 'savings',
      message: 'DevTeam reduced costs by 84% using ANFIS routing',
      timestamp: new Date(),
      amount: '84%'
    }
  ];

  useEffect(() => {
    let activityIndex = 0;
    
    const showNextActivity = () => {
      setCurrentActivity(mockActivities[activityIndex]);
      activityIndex = (activityIndex + 1) % mockActivities.length;
      
      // Hide after 4 seconds
      setTimeout(() => {
        setCurrentActivity(null);
      }, 4000);
    };

    // Show first activity after 10 seconds
    const initialDelay = setTimeout(showNextActivity, 10000);
    
    // Then show every 15 seconds
    const interval = setInterval(showNextActivity, 15000);

    return () => {
      clearTimeout(initialDelay);
      clearInterval(interval);
    };
  }, []);

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'signup':
        return <Users className="w-5 h-5 text-blue-400" />;
      case 'savings':
        return <DollarSign className="w-5 h-5 text-green-400" />;
      case 'milestone':
        return <TrendingUp className="w-5 h-5 text-purple-400" />;
      case 'testimonial':
        return <Zap className="w-5 h-5 text-yellow-400" />;
      default:
        return <Users className="w-5 h-5 text-blue-400" />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'signup':
        return 'from-blue-500/20 to-blue-600/20 border-blue-500/30';
      case 'savings':
        return 'from-green-500/20 to-green-600/20 border-green-500/30';
      case 'milestone':
        return 'from-purple-500/20 to-purple-600/20 border-purple-500/30';
      case 'testimonial':
        return 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30';
      default:
        return 'from-blue-500/20 to-blue-600/20 border-blue-500/30';
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-40">
      <AnimatePresence>
        {currentActivity && (
          <motion.div
            initial={{ opacity: 0, x: -100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.8 }}
            className={`bg-gradient-to-r ${getActivityColor(currentActivity.type)} border rounded-lg p-4 max-w-sm backdrop-blur-sm shadow-lg`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(currentActivity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">
                  {currentActivity.message}
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  {currentActivity.type === 'signup' && currentActivity.location}
                  {currentActivity.type === 'savings' && 'Just now'}
                  {currentActivity.type === 'milestone' && 'Live count'}
                  {currentActivity.type === 'testimonial' && 'Verified review'}
                </p>
              </div>
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}