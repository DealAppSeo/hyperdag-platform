import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface SlackLoginProps {
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function SlackLogin({ 
  variant = 'default', 
  size = 'default', 
  className = '' 
}: SlackLoginProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const slackAuthMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('GET', '/api/auth/slack/auth');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.authUrl) {
        // Redirect to Slack OAuth
        window.location.href = data.authUrl;
      } else {
        toast({
          title: "Authentication Error",
          description: "Failed to get Slack authentication URL",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Slack Connection Failed",
        description: error.message || "Unable to connect to Slack",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  });

  const handleSlackLogin = () => {
    setIsLoading(true);
    // Use direct server redirect instead of client-side redirect
    window.location.href = '/api/auth/slack/login';
  };

  return (
    <a
      href="/api/auth/slack/login"
      className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-[#4A154B] hover:bg-[#3e1241] text-white border-0 text-xs px-3 py-2 h-10 min-h-[2.5rem] w-full ${className}`}
    >
      <svg
        className="h-3 w-3 mr-1.5"
        fill="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52-2.523A2.528 2.528 0 0 1 5.042 10.1a2.528 2.528 0 0 1 2.52 2.542 2.528 2.528 0 0 1-2.52 2.523Zm6.906-4.405a2.528 2.528 0 0 1-2.52-2.523 2.528 2.528 0 0 1 2.52-2.523 2.528 2.528 0 0 1 2.52 2.523 2.528 2.528 0 0 1-2.52 2.523Zm6.906 0a2.528 2.528 0 0 1-2.52-2.523 2.528 2.528 0 0 1 2.52-2.523 2.528 2.528 0 0 1 2.52 2.523 2.528 2.528 0 0 1-2.52 2.523ZM5.042 8.235a2.528 2.528 0 0 1-2.52-2.523A2.528 2.528 0 0 1 5.042 3.17a2.528 2.528 0 0 1 2.52 2.542 2.528 2.528 0 0 1-2.52 2.523Z"/>
      </svg>
      Slack
    </a>
  );
}

// Component for disconnecting Slack
export function SlackDisconnect({ className = '' }: { className?: string }) {
  const { toast } = useToast();

  const disconnectMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/auth/slack/disconnect');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Slack Disconnected",
        description: "Your Slack account has been disconnected",
      });
      // Refresh the page to update the UI
      window.location.reload();
    },
    onError: (error: any) => {
      toast({
        title: "Disconnect Failed",
        description: error.message || "Failed to disconnect Slack",
        variant: "destructive",
      });
    }
  });

  return (
    <Button
      variant="outline"
      onClick={() => disconnectMutation.mutate()}
      disabled={disconnectMutation.isPending}
      className={className}
    >
      {disconnectMutation.isPending ? 'Disconnecting...' : 'Disconnect Slack'}
    </Button>
  );
}