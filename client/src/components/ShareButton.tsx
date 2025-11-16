import { useState } from 'react';
import { Share2, Twitter, Linkedin, Facebook, Link as LinkIcon, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useMutation } from '@tanstack/react-query';

interface ShareButtonProps {
  contentType: string;
  contentId?: string;
  title: string;
  description: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  showLabel?: boolean;
}

export function ShareButton({
  contentType,
  contentId = 'default',
  title,
  description,
  size = 'default',
  variant = 'default',
  showLabel = true
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const { toast } = useToast();

  const createShareLinkMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/share/create', {
        method: 'POST',
        body: JSON.stringify({ contentType, contentId, title, description }),
      });
      const data = await response.json();
      return data.data.shareLink;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/referrals/stats'] });
    },
  });

  const trackShareMutation = useMutation({
    mutationFn: async (linkId: string) => {
      await apiRequest(`/api/share/${linkId}/shared`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: "🎉 +10 RepID Earned!",
        description: "Thanks for sharing! You've earned 10 RepID points.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/referrals/stats'] });
    },
  });

  const handleShare = async (platform: 'twitter' | 'linkedin' | 'facebook') => {
    try {
      const shareLink = await createShareLinkMutation.mutateAsync();
      const shareUrl = `${window.location.origin}/share/${shareLink.id}`;
      
      let socialUrl = '';
      
      if (platform === 'twitter') {
        const tweetText = shareLink.twitterTemplate || `Check out ${title} on AI Trinity! ${description}`;
        socialUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`;
      } else if (platform === 'linkedin') {
        socialUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
      } else if (platform === 'facebook') {
        socialUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
      }
      
      window.open(socialUrl, '_blank', 'width=600,height=600');
      
      await trackShareMutation.mutateAsync(shareLink.id);
    } catch (error) {
      console.error('Share failed:', error);
      toast({
        title: "Share Failed",
        description: "Please try again or copy the link manually.",
        variant: "destructive",
      });
    }
  };

  const handleCopyLink = async () => {
    try {
      const shareLink = await createShareLinkMutation.mutateAsync();
      const shareUrl = `${window.location.origin}/share/${shareLink.id}`;
      
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
      
      toast({
        title: "Link Copied!",
        description: "Share link copied to clipboard.",
      });
      
      await trackShareMutation.mutateAsync(shareLink.id);
    } catch (error) {
      console.error('Copy failed:', error);
      toast({
        title: "Copy Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          data-testid="button-open-share"
        >
          <Share2 className="w-4 h-4" />
          {showLabel && <span className="ml-2">Share & Earn</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" data-testid="dialog-share">
        <DialogHeader>
          <DialogTitle>Share & Earn 10 RepID</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="rounded-lg border p-4 bg-muted/50">
            <h3 className="font-semibold text-sm mb-1" data-testid="text-share-title">{title}</h3>
            <p className="text-sm text-muted-foreground" data-testid="text-share-description">{description}</p>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Share on social media to earn 10 RepID points instantly!
            </p>
            
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                onClick={() => handleShare('twitter')}
                disabled={createShareLinkMutation.isPending || trackShareMutation.isPending}
                data-testid="button-share-twitter"
              >
                {createShareLinkMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Twitter className="w-4 h-4" />
                    <span className="ml-2">Twitter</span>
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleShare('linkedin')}
                disabled={createShareLinkMutation.isPending || trackShareMutation.isPending}
                data-testid="button-share-linkedin"
              >
                {createShareLinkMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Linkedin className="w-4 h-4" />
                    <span className="ml-2">LinkedIn</span>
                  </>
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleShare('facebook')}
                disabled={createShareLinkMutation.isPending || trackShareMutation.isPending}
                data-testid="button-share-facebook"
              >
                {createShareLinkMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Facebook className="w-4 h-4" />
                    <span className="ml-2">Facebook</span>
                  </>
                )}
              </Button>
            </div>

            <Button
              variant="secondary"
              className="w-full"
              onClick={handleCopyLink}
              disabled={createShareLinkMutation.isPending}
              data-testid="button-copy-link"
            >
              {copiedLink ? (
                <>
                  <Check className="w-4 h-4" />
                  <span className="ml-2">Copied!</span>
                </>
              ) : createShareLinkMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="ml-2">Generating...</span>
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4" />
                  <span className="ml-2">Copy Link</span>
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg" data-testid="text-share-reward">
            💰 <strong>Rewards:</strong> +10 RepID for sharing · +15 RepID when someone signs up via your link
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
