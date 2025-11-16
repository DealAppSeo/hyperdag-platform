import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';

interface CallbackParams {
  provider?: string;
  error?: string;
  success?: string;
  code?: string;
  state?: string;
}

export default function OAuthCallback() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(true);
  const [result, setResult] = useState<{
    success: boolean;
    provider?: string;
    error?: string;
  }>({ success: false });

  useEffect(() => {
    async function processCallback() {
      try {
        // Parse URL parameters
        const searchParams = new URLSearchParams(window.location.search);
        const params: CallbackParams = {};
        
        searchParams.forEach((value, key) => {
          params[key as keyof CallbackParams] = value;
        });

        if (params.success === 'true' && params.provider) {
          // The redirect from API contains success=true, show success message
          setResult({
            success: true,
            provider: params.provider
          });
          
          toast({
            title: 'Success!',
            description: `Your ${params.provider} account was successfully connected.`,
          });
          
          setProcessing(false);
          
          // Refresh the connections list in the parent window after a delay
          setTimeout(() => {
            navigate('/social-connections');
          }, 2000);
          return;
        }
        
        if (params.error) {
          // Error from OAuth provider or our API
          setResult({
            success: false,
            error: params.error,
            provider: params.provider
          });
          
          toast({
            title: 'Connection Failed',
            description: params.error,
            variant: 'destructive'
          });
          
          setProcessing(false);
          return;
        }
        
        // If we get here, we're processing the initial OAuth callback with code and state
        if (!params.code || !params.state || !params.provider) {
          setResult({
            success: false,
            error: 'Invalid callback parameters',
            provider: params.provider
          });
          
          toast({
            title: 'Connection Failed',
            description: 'Missing required parameters from OAuth provider',
            variant: 'destructive'
          });
          
          setProcessing(false);
          return;
        }
        
        // Process the OAuth callback on our server
        await apiRequest('POST', '/api/social/callback', {
          provider: params.provider,
          code: params.code,
          state: params.state
        });
        
        // Our API will handle updating the user's record
        // Show success message
        setResult({
          success: true,
          provider: params.provider
        });
        
        toast({
          title: 'Success!',
          description: `Your ${params.provider} account was successfully connected.`,
        });
        
        // Refresh the connections list after a short delay
        setTimeout(() => {
          navigate('/social-connections');
        }, 2000);
      } catch (error) {
        console.error('Error processing OAuth callback', error);
        
        setResult({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error processing OAuth callback'
        });
        
        toast({
          title: 'Connection Failed',
          description: 'There was an error processing your social media connection. Please try again.',
          variant: 'destructive'
        });
      } finally {
        setProcessing(false);
      }
    }
    
    processCallback();
  }, [navigate, toast]);
  
  const getTitle = () => {
    if (processing) return 'Processing Connection...';
    if (result.success) return 'Connection Successful!';
    return 'Connection Failed';
  };
  
  const getDescription = () => {
    if (processing) return 'Please wait while we establish your social connection...';
    if (result.success) {
      return `Your ${result.provider} account has been successfully connected and verified. Your identity remains private, and only HyperDAG knows the connection exists.`;
    }
    return result.error || 'There was an error processing your social connection. Please try again.';
  };
  
  const getIcon = () => {
    if (processing) return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
    if (result.success) return <div className="h-12 w-12 rounded-full bg-green-500 flex items-center justify-center text-white text-2xl">✓</div>;
    return <div className="h-12 w-12 rounded-full bg-red-500 flex items-center justify-center text-white text-2xl">!</div>;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            {getIcon()}
          </div>
          <CardTitle className="text-center text-xl">{getTitle()}</CardTitle>
          <CardDescription className="text-center">{getDescription()}</CardDescription>
        </CardHeader>
        
        <CardContent>
          {result.success && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-md text-sm">
              <p className="font-medium mb-2">Privacy Protection Enabled</p>
              <p>HyperDAG uses zero-knowledge proofs to protect your identity while providing verification benefits.</p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button 
            onClick={() => navigate('/social-connections')} 
            variant={result.success ? "default" : "outline"}
            disabled={processing}
          >
            {result.success ? 'Continue to Social Connections' : 'Return to Social Connections'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}