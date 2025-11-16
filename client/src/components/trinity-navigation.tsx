/**
 * Trinity Navigation Component
 * Quick access to Trinity Symphony Network Dashboard
 */

import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Activity, Zap } from 'lucide-react';

interface TrinityNavigationProps {
  className?: string;
}

export default function TrinityNavigation({ className = '' }: TrinityNavigationProps) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Trinity Symphony Dashboard Link */}
      <Link href="/trinity-dashboard">
        <Button variant="outline" className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          <span>Trinity Dashboard</span>
          <Badge variant="secondary" className="ml-1">
            Live
          </Badge>
        </Button>
      </Link>
      
      {/* Status Indicators */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Activity className="h-4 w-4 text-green-500" />
          <span className="text-sm text-muted-foreground">ANFIS Active</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="text-sm text-muted-foreground">OpenRouter Ready</span>
        </div>
      </div>
    </div>
  );
}