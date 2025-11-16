import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowRight, LockIcon } from 'lucide-react';
import { useLocation } from 'wouter';
import * as LucideIcons from 'lucide-react';

// Feature type from the backend
interface Feature {
  id: string;
  name: string;
  description: string;
  category: string;
  persona: string;
  requiredKnowledgeLevel: number;
  requiredStep: string;
  image: string;
  path: string;
  discovered: boolean;
  locked: boolean;
}

// User progress type from the backend
interface UserProgress {
  persona: string;
  knowledgeScore: number;
  currentStep: string;
  discoveredFeatures: string[];
}

// Response from the backend
interface FeaturesResponse {
  success: boolean;
  features: Feature[];
  userProgress: UserProgress;
}

interface ProgressiveDiscoveryProps {
  onSelectFeature?: (featureId: string) => void;
}

export default function ProgressiveDiscovery({ onSelectFeature }: ProgressiveDiscoveryProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Fetch available features based on user's progress
  const { data, isLoading, error } = useQuery<FeaturesResponse>({
    queryKey: ['/api/features/all'],
    refetchOnWindowFocus: false, // Don't refetch when window is focused
    retry: 1, // Only retry once if there's an error
  });
  
  // Mutation for marking a feature as discovered
  const discoverFeatureMutation = useMutation({
    mutationFn: async (featureId: string) => {
      const res = await apiRequest('POST', '/api/onboarding/progress', {
        step: 'feature_discovered',
        data: { featureId }
      });
      return res.json();
    },
    onSuccess: () => {
      // Invalidate the features query to get updated data
      queryClient.invalidateQueries({ queryKey: ['/api/features/all'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to track feature discovery',
        variant: 'destructive'
      });
    }
  });
  
  useEffect(() => {
    // Set the initial selected category to the first one with available features
    if (data?.features && !selectedCategory) {
      // Get unique categories without using Set
      const categoryMap: Record<string, boolean> = {};
      data.features.forEach(f => categoryMap[f.category] = true);
      const categories = Object.keys(categoryMap);
      
      if (categories.length > 0) {
        setSelectedCategory(categories[0]);
      }
    }
  }, [data, selectedCategory]);
  
  const handleFeatureClick = (feature: Feature) => {
    if (feature.locked) {
      toast({
        title: 'Feature Locked',
        description: `This feature requires more knowledge or progress. Continue your journey to unlock it!`,
        variant: 'default'
      });
      return;
    }
    
    // Mark the feature as discovered if it's not already
    if (!feature.discovered) {
      discoverFeatureMutation.mutate(feature.id);
    }
    
    // If onSelectFeature prop is provided, call it
    if (onSelectFeature) {
      onSelectFeature(feature.id);
    } else {
      // Otherwise navigate to the feature's path
      navigate(feature.path);
    }
  };
  
  // Extract unique categories from features
  const categories = data?.features 
    ? Object.keys(data.features.reduce<Record<string, boolean>>((acc, f) => {
        acc[f.category] = true;
        return acc;
      }, {}))
    : [];
  
  // Filter features by selected category
  const filteredFeatures = selectedCategory && data?.features
    ? data.features.filter(f => f.category === selectedCategory)
    : [];
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center p-6">
        <p className="text-destructive">Error loading features. Please try again later.</p>
        <Button 
          variant="outline" 
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/features/all'] })}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }
  
  if (!data?.features || data.features.length === 0) {
    return (
      <div className="text-center p-6">
        <p>No features available yet. Complete more onboarding steps to unlock features.</p>
      </div>
    );
  }
  
  // Get a Lucide icon component by name
  const getIconByName = (name: string) => {
    const IconComponent = (LucideIcons as any)[name] || LucideIcons.CircleDot;
    return <IconComponent className="h-6 w-6" />;
  };
  
  // Get color class based on persona
  const getPersonaColorClass = (persona: string) => {
    switch (persona) {
      case 'developer':
        return 'bg-blue-100 border-blue-300 text-blue-700';
      case 'designer':
        return 'bg-orange-100 border-orange-300 text-orange-700';
      case 'influencer':
        return 'bg-green-100 border-green-300 text-green-700';
      default:
        return 'bg-gray-100 border-gray-300 text-gray-700';
    }
  };
  
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {categories.map(category => (
          <Button
            key={category}
            variant={selectedCategory === category ? "default" : "outline"}
            onClick={() => setSelectedCategory(category)}
            className="capitalize"
          >
            {category.replace('_', ' ')}
          </Button>
        ))}
      </div>
      
      {/* Features grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFeatures.map(feature => {
          // Determine feature card styles based on status
          const isLocked = feature.locked;
          const isDiscovered = feature.discovered;
          
          // Get persona color class for feature category badge
          const personaClass = feature.persona === 'all' 
            ? 'bg-purple-100 border-purple-300 text-purple-700'
            : getPersonaColorClass(feature.persona);
          
          return (
            <Card 
              key={feature.id}
              className={`overflow-hidden transition-all duration-300 ${
                isLocked 
                  ? 'opacity-70 cursor-not-allowed'
                  : 'hover:shadow-md cursor-pointer'
              }`}
              onClick={() => handleFeatureClick(feature)}
            >
              <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle className="text-lg font-medium">
                    {feature.name}
                  </CardTitle>
                  <CardDescription className="text-sm mt-1">
                    {feature.description}
                  </CardDescription>
                </div>
                <div className={`p-2 rounded-full ${isLocked ? 'bg-gray-200' : 'bg-primary/10'}`}>
                  {isLocked ? (
                    <LockIcon className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    getIconByName(feature.image)
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="p-4 pt-0">
                <div className="flex items-center gap-2 mt-4">
                  <span 
                    className={`px-2 py-1 text-xs rounded-full border ${personaClass}`}
                  >
                    {feature.persona === 'all' ? 'Everyone' : feature.persona}
                  </span>
                  
                  {isLocked && (
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 border border-gray-300 text-gray-700">
                      Level {feature.requiredKnowledgeLevel}+
                    </span>
                  )}
                  
                  {!isLocked && isDiscovered && (
                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 border border-green-300 text-green-700">
                      Unlocked
                    </span>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="p-4 pt-0 flex justify-end">
                <Button 
                  variant="ghost" 
                  size="sm"
                  disabled={isLocked}
                  className={isLocked ? 'opacity-50' : ''}
                >
                  {isLocked ? 'Locked' : 'Explore'} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
              
              {/* Overlay for locked features */}
              {isLocked && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                  <div className="bg-white/90 p-3 rounded-lg text-sm text-center max-w-[80%]">
                    <LockIcon className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                    <p>
                      {feature.requiredKnowledgeLevel > (data?.userProgress?.knowledgeScore || 0)
                        ? `Requires knowledge level ${feature.requiredKnowledgeLevel}`
                        : 'Complete earlier steps to unlock'
                      }
                    </p>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}