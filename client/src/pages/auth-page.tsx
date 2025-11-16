import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, User, Lock, ArrowLeft, Home } from "lucide-react";
import { TelegramLoginButton } from "@/components/telegram-login";
import { DiscordLogin } from "@/components/discord-login";
import { GitHubLogin } from "@/components/github-login";
import { SlackLogin } from "@/components/slack-login";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, loginMutation, registerMutation } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (user && !authLoading) {
      setLocation("/");
    }
  }, [user, authLoading, setLocation]);

  // Show loading while checking authentication status
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show loading while redirecting
  if (user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  // Login form state
  const [loginData, setLoginData] = useState({
    username: "",
    password: ""
  });

  // Registration form state
  const [registerData, setRegisterData] = useState({
    username: "",
    password: "",
    confirmPassword: ""
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await loginMutation.mutateAsync(loginData);
    } catch (error: any) {
      setError(error.message || "Login failed. Please try again.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (registerData.password !== registerData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      await registerMutation.mutateAsync({
        username: registerData.username,
        password: registerData.password,
        confirmPassword: registerData.confirmPassword
      });
    } catch (error: any) {
      setError(error.message || "Registration failed. Please try again.");
    }
  };

  const handleTelegramSuccess = (user: any) => {
    toast({
      title: user.isNewUser ? "Account created successfully" : "Login successful",
      description: user.isNewUser 
        ? "Welcome to HyperDAG! Your account has been created via Telegram."
        : "Welcome back to HyperDAG!"
    });
    setLocation("/");
  };

  const handleTelegramError = (error: string) => {
    setError(error);
    toast({
      title: "Authentication failed",
      description: error,
      variant: "destructive"
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">


          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 items-center">
            {/* Left side - Authentication Forms */}
            <div className="space-y-4 lg:space-y-6 px-2 lg:px-0">
              <div className="text-center lg:text-left">
                <h1 className="text-2xl lg:text-3xl font-bold mb-2">Welcome to HyperDAG</h1>
                <p className="text-base lg:text-lg text-muted-foreground mb-2">
                  Begin exploring the possibilities of AI & Web3 with just an alias username & password
                </p>
                <p className="text-sm text-muted-foreground">
                  Sign in to access your Web3 development platform or create a new account
                </p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}



              {/* Traditional Login/Register */}
              <Card>
                <CardContent className="p-6">
                  <Tabs defaultValue="login" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="login">Login</TabsTrigger>
                      <TabsTrigger value="register">Register</TabsTrigger>
                    </TabsList>

                    <TabsContent value="login" className="space-y-4 mt-6">
                      <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="login-username">Username</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="login-username"
                              type="text"
                              placeholder="Enter your username"
                              value={loginData.username}
                              onChange={(e) => setLoginData(prev => ({ ...prev, username: e.target.value }))}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="login-password">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="login-password"
                              type="password"
                              placeholder="Enter your password"
                              value={loginData.password}
                              onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Signing in...
                            </>
                          ) : (
                            "Sign in"
                          )}
                        </Button>
                        <div className="text-center">
                          <Button 
                            type="button" 
                            variant="link" 
                            className="text-sm text-muted-foreground hover:text-primary"
                            onClick={() => setLocation('/password-reset')}
                          >
                            Forgot your password?
                          </Button>
                        </div>
                      </form>
                    </TabsContent>

                    <TabsContent value="register" className="space-y-4 mt-6">
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="register-username">Username</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="register-username"
                              type="text"
                              placeholder="Choose a username"
                              value={registerData.username}
                              onChange={(e) => setRegisterData(prev => ({ ...prev, username: e.target.value }))}
                              className="pl-10"
                              required
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Username must be at least 3 characters long
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="register-password">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="register-password"
                              type="password"
                              placeholder="Create a password"
                              value={registerData.password}
                              onChange={(e) => setRegisterData(prev => ({ ...prev, password: e.target.value }))}
                              className="pl-10"
                              required
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Password must be at least 8 characters and include: lowercase letter, uppercase letter, number, and special character (@$!%*?&)
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="confirm-password">Confirm Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="confirm-password"
                              type="password"
                              placeholder="Confirm your password"
                              value={registerData.confirmPassword}
                              onChange={(e) => setRegisterData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              className="pl-10"
                              required
                            />
                          </div>
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating account...
                            </>
                          ) : (
                            "Create account"
                          )}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              {/* Alternative Login Methods */}
              <Card>
                <CardHeader>
                  <CardTitle>Alternative Login</CardTitle>
                  <CardDescription>
                    Additional authentication methods available
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <TelegramLoginButton
                    onSuccess={handleTelegramSuccess}
                    onError={handleTelegramError}
                    size="sm"
                    variant="default"
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Social media logins (Discord, GitHub, Slack) are being configured and will be available soon
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Right side - Hero/Feature Section */}
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-4">Build the Future of Web3</h2>
                <p className="text-muted-foreground mb-6">
                  HyperDAG empowers developers with AI-enhanced tools, seamless blockchain integration, 
                  and privacy-first collaboration features.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">🚀 Rapid Prototyping</h3>
                    <p className="text-sm text-muted-foreground">
                      Launch Web3 projects in minutes with pre-built templates and AI assistance
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">🔒 Privacy First</h3>
                    <p className="text-sm text-muted-foreground">
                      Zero-knowledge proofs protect your identity while enabling collaboration
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">🤝 Smart Collaboration</h3>
                    <p className="text-sm text-muted-foreground">
                      AI-powered team matching and automated grant discovery
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">💰 Built-in Funding</h3>
                    <p className="text-sm text-muted-foreground">
                      Direct access to Web3 grants and decentralized crowdfunding
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}