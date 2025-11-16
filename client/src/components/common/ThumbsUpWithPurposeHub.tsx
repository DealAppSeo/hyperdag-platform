import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ThumbsUp, Heart, Plus, Check } from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

interface ThumbsUpWithPurposeHubProps {
  item: {
    id: number;
    title?: string;
    name?: string;
    description?: string;
    category?: string;
  };
  sourceType: 'grant' | 'rfp' | 'rfi' | 'nonprofit' | 'hackathon' | 'hypercrowd';
  onThumbsUp?: (item: any) => void;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export function ThumbsUpWithPurposeHub({
  item,
  sourceType,
  onThumbsUp,
  className = '',
  size = 'sm',
  variant = 'outline'
}: ThumbsUpWithPurposeHubProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [showPurposeDialog, setShowPurposeDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Check if this item is already saved to Purpose Hub
  const { data: isAlreadySaved } = useQuery({
    queryKey: ['/api/purposes/check', sourceType.toUpperCase(), item.id],
    queryFn: async () => {
      const response = await fetch(`/api/purposes/check?sourceType=${sourceType.toUpperCase()}&sourceId=${item.id}`);
      if (!response.ok) throw new Error('Failed to check');
      const result = await response.json();
      return result.data?.isSaved || false;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 2, // 2 minute cache
  });

  // Mutation for saving to Purpose Hub
  const saveToPurposeHubMutation = useMutation({
    mutationFn: async (data: { sourceType: string; sourceId: number; sourceName: string; sourceDescription?: string; sourceCategory?: string }) => {
      const response = await fetch('/api/purposes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to save');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Added to Purpose Hub!",
        description: "You can find this in your Purpose Hub to track and collaborate on.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/purposes/saved'] });
      queryClient.invalidateQueries({ queryKey: ['/api/purposes/check', sourceType.toUpperCase(), item.id] });
      setShowPurposeDialog(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add to Purpose Hub. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleThumbsUp = () => {
    if (isAlreadySaved) {
      toast({
        title: "Already in Purpose Hub",
        description: "This item is already saved to your Purpose Hub where you can track progress and find collaborators.",
      });
      return;
    }

    if (!isLiked) {
      setIsLiked(true);
      
      // Show initial thumbs up feedback
      toast({
        title: "Thank you for believing in this cause!",
        description: "Your support helps build community momentum.",
      });

      // Call optional callback
      onThumbsUp?.(item);
      
      // Show Purpose Hub confirmation dialog after a brief delay
      setTimeout(() => {
        setShowPurposeDialog(true);
      }, 500);
    } else {
      // Already liked, directly show Purpose Hub dialog
      setShowPurposeDialog(true);
    }
  };

  const handleSaveToPurposeHub = () => {
    const sourceName = item.title || item.name || 'Untitled';
    
    saveToPurposeHubMutation.mutate({
      sourceType: sourceType.toUpperCase(),
      sourceId: item.id,
      sourceName,
      sourceDescription: item.description,
      sourceCategory: item.category,
    });
  };

  const handleSkipSave = () => {
    setShowPurposeDialog(false);
    toast({
      title: "Thanks for your support!",
      description: "Your thumbs up has been recorded.",
    });
  };

  return (
    <>
      <Button
        variant={isAlreadySaved ? 'default' : isLiked ? 'default' : variant}
        size={size}
        onClick={handleThumbsUp}
        className={`flex items-center gap-2 ${
          isAlreadySaved 
            ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200' 
            : isLiked 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : ''
        } ${className}`}
      >
        {isAlreadySaved ? (
          <Check className="h-4 w-4" />
        ) : (
          <ThumbsUp className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
        )}
        {isAlreadySaved ? 'In Purpose Hub' : isLiked ? 'Believed!' : 'I Believe In This'}
      </Button>

      {/* Purpose Hub Confirmation Dialog */}
      <Dialog open={showPurposeDialog} onOpenChange={setShowPurposeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Add to Purpose Hub?
            </DialogTitle>
            <DialogDescription className="text-left">
              <strong>{item.title || item.name}</strong>
              <br />
              <br />
              Save this to your Purpose Hub to track your interests, share with others, and find collaboration opportunities.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSkipSave}
              disabled={saveToPurposeHubMutation.isPending}
            >
              Skip for Now
            </Button>
            <Button
              onClick={handleSaveToPurposeHub}
              disabled={saveToPurposeHubMutation.isPending}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {saveToPurposeHubMutation.isPending ? 'Saving...' : 'Add to Purpose Hub'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}