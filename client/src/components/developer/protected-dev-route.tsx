import React, { useState, useEffect } from 'react';
import { Route, Redirect, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Github, Code } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProtectedDevRouteProps {
  path: string;
  component: React.ComponentType;
}

export function ProtectedDevRoute({ path, component: Component }: ProtectedDevRouteProps) {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showGithubForm, setShowGithubForm] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');

  // Query to check if user has dev hub access (skip for admins)
  const { data: devHubAccess, isLoading: checkingAccess } = useQuery({
    queryKey: ['/api/developer/user/dev-hub-access'],
    queryFn: () => apiRequest('/api/developer/user/dev-hub-access').then(res => res.json()),
    enabled: !!user && !user?.isAdmin, // Skip query for admin users
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Check if user has identified as a developer in their persona
  const isDeveloper = user?.persona?.toLowerCase() === 'developer' || 
                     user?.persona?.toLowerCase() === 'blue' ||
                     user?.interests?.includes('development') ||
                     user?.interests?.includes('coding');

  // Request dev hub access mutation
  const requestAccessMutation = useMutation({
    mutationFn: async (githubHandle: string) => {
      // Ensure githubHandle is passed as a property in the request body
      return await apiRequest('/api/developer/user/request-dev-access', {
        method: 'POST',
        body: JSON.stringify({ githubHandle })
      });
    },
    onSuccess: async (response) => {
      // Check if response is OK (for both regular and backdoor)
      const jsonResponse = await response.json();
      
      if (jsonResponse.backdoorApproved) {
        toast({
          title: "Access Granted",
          description: "Your request has been automatically approved. You now have access to the Developer Hub.",
        });
      } else {
        toast({
          title: "Access Request Submitted",
          description: "Your request for Developer Hub access has been submitted for review.",
        });
      }
      
      // Refresh the access status
      queryClient.invalidateQueries({ queryKey: ['/api/developer/user/dev-hub-access'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Request Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Handle access request submission
  const handleRequestAccess = () => {
    if (!githubUsername) {
      toast({
        title: "GitHub Username Required",
        description: "Please provide your GitHub username to request Developer Hub access.",
        variant: "destructive",
      });
      return;
    }
    requestAccessMutation.mutate(githubUsername);
  };

  // Show loading state while checking authorization (skip for admins)
  if (isLoading || (checkingAccess && !user?.isAdmin)) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-gray-600">Checking Developer Hub access...</p>
        </div>
      </Route>
    );
  }

  // If not authenticated, redirect to login
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Admin users always have access - bypass all checks
  if (user?.isAdmin) {
    return <Route path={path} component={Component} />;
  }

  // User has access - render the component
  if (devHubAccess?.hasAccess) {
    return <Route path={path} component={Component} />;
  }

  // User is a developer but needs to complete profile with GitHub
  if (isDeveloper && !devHubAccess?.hasAccess && !devHubAccess?.pendingRequest) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl flex items-center">
                <Code className="mr-2 h-6 w-6" /> Developer Hub Access
              </CardTitle>
              <CardDescription>
                Complete your developer profile to access these developer resources
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {showGithubForm ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="github">GitHub Username</Label>
                    <div className="flex items-center space-x-2">
                      <Github className="h-5 w-5 text-gray-500" />
                      <Input 
                        id="github" 
                        value={githubUsername} 
                        onChange={(e) => setGithubUsername(e.target.value)}
                        placeholder="yourusername" 
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    Your GitHub profile will be used to verify your developer status and provide
                    appropriate access to developer resources.
                  </p>
                  <p className="text-xs text-blue-500 mt-2 italic">
                    Hint: For immediate access, you may use "John 3:16" as your GitHub handle.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center py-4">
                  <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
                  <h3 className="text-lg font-medium">Developer Verification Required</h3>
                  <p className="text-gray-500 mt-2">
                    To access the Developer Hub resources, you need to complete your 
                    developer profile.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-between">
              {showGithubForm ? (
                <>
                  <Button variant="outline" onClick={() => navigate("/")}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleRequestAccess} 
                    disabled={requestAccessMutation.isPending}
                  >
                    {requestAccessMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Request Access
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => navigate("/")}>
                    Return to Dashboard
                  </Button>
                  <Button onClick={() => setShowGithubForm(true)}>
                    <Github className="mr-2 h-4 w-4" />
                    Connect GitHub Profile
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        </div>
      </Route>
    );
  }

  // User has a pending request
  if (devHubAccess?.pendingRequest) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Access Pending</CardTitle>
              <CardDescription>
                Your request for Developer Hub access is being reviewed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col items-center text-center py-4">
                <Loader2 className="h-12 w-12 text-primary mb-4 animate-spin" />
                <h3 className="text-lg font-medium">Review In Progress</h3>
                <p className="text-gray-500 mt-2">
                  Your request for Developer Hub access is currently under review. 
                  You'll be notified once access is granted.
                </p>
                <p className="text-xs text-blue-500 mt-2 italic">
                  Hint: For immediate access, try making a new request with "John 3:16" as your GitHub handle.
                </p>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="outline" onClick={() => navigate("/")}>
                Return to Dashboard
              </Button>
              <Button onClick={() => {
                // Reapply with John 3:16 for immediate approval
                setGithubUsername("John 3:16");
                // Call the API with the correct string parameter
                requestAccessMutation.mutate("John 3:16");
              }}>
                Bypass Review
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Route>
    );
  }

  // User doesn't have access and isn't a developer
  return (
    <Route path={path}>
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Access Restricted</CardTitle>
            <CardDescription>
              Developer Hub resources are restricted to verified developers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center text-center py-4">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
              <h3 className="text-lg font-medium">Developer Access Required</h3>
              <p className="text-gray-500 mt-2">
                To access the Developer Hub you need to set your persona as "Developer" 
                in your profile settings, complete your profile set up with email and 2FA.
              </p>
              <p className="text-blue-500 mt-2 cursor-pointer hover:underline" onClick={() => navigate("/onboarding")}>
                Complete your onboarding process
              </p>
              <p className="text-xs text-blue-500 mt-2 italic">
                Hint: Once you set your persona to Developer, use "John 3:16" as your GitHub handle for instant access.
              </p>
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button variant="outline" onClick={() => navigate("/")}>
              Return to Dashboard
            </Button>
            <Button onClick={() => navigate("/settings")}>
              Update Profile
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Route>
  );
}