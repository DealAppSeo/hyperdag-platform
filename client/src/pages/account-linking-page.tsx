import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { TelegramLogin } from "@/components/telegram-login";
import { useToast } from "@/hooks/use-toast";
import { Link2, User, Shield, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";

interface LinkingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export default function AccountLinkingPage() {
  const [, setLocation] = useLocation();
  const [match] = useRoute("/link-account");
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isLinking, setIsLinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const [credentials, setCredentials] = useState({
    username: "",
    password: ""
  });

  const linkingSteps: LinkingStep[] = [
    {
      id: "login",
      title: "Login to Existing Account",
      description: "Sign in to your existing HyperDAG profile using your username and password",
      completed: false
    },
    {
      id: "telegram",
      title: "Verify Telegram Connection",
      description: "Confirm your Telegram account to complete the linking process",
      completed: false
    },
    {
      id: "complete",
      title: "Link Complete",
      description: "Your Telegram account is now connected to your HyperDAG profile",
      completed: false
    }
  ];

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuthStatus = async () => {
      try {
        const response = await fetch("/api/user");
        if (response.ok) {
          const userData = await response.json();
          setUserProfile(userData);
          
          // If user already has Telegram linked, show success
          if (userData.telegramVerified) {
            setSuccess(true);
            setCurrentStep(2);
          } else {
            setCurrentStep(1); // Skip to Telegram verification
          }
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      }
    };

    checkAuthStatus();
  }, []);

  const handleCredentialLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLinking(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(credentials)
      });

      const result = await response.json();

      if (result.success) {
        setUserProfile(result.user);
        setCurrentStep(1);
        toast({
          title: "Login Successful",
          description: "Now please link your Telegram account to complete the process."
        });
      } else {
        setError(result.error || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      setError("Network error during login. Please try again.");
    } finally {
      setIsLinking(false);
    }
  };

  const handleTelegramLinkSuccess = (result: any) => {
    setSuccess(true);
    setCurrentStep(2);
    toast({
      title: "Account Linked Successfully",
      description: "Your Telegram account is now connected to your HyperDAG profile."
    });
    
    // Redirect to dashboard after a short delay
    setTimeout(() => {
      setLocation("/");
    }, 2000);
  };

  const handleTelegramLinkError = (error: string) => {
    setError(error);
    toast({
      title: "Linking Failed",
      description: error,
      variant: "destructive"
    });
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {linkingSteps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className={`
            flex items-center justify-center w-8 h-8 rounded-full border-2 
            ${index <= currentStep 
              ? 'bg-blue-600 border-blue-600 text-white' 
              : 'border-gray-300 text-gray-400'
            }
          `}>
            {index < currentStep ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <span className="text-sm font-medium">{index + 1}</span>
            )}
          </div>
          {index < linkingSteps.length - 1 && (
            <div className={`
              w-16 h-0.5 mx-2 
              ${index < currentStep ? 'bg-blue-600' : 'bg-gray-300'}
            `} />
          )}
        </div>
      ))}
    </div>
  );

  const renderLoginStep = () => (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full">
          <User className="w-8 h-8 text-blue-600" />
        </div>
        <CardTitle>Sign In to Your Account</CardTitle>
        <CardDescription>
          Enter your existing HyperDAG credentials to link your Telegram account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCredentialLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
              placeholder="Enter your username"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Enter your password"
              required
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <Button type="submit" className="w-full" disabled={isLinking}>
            {isLinking ? "Signing In..." : "Sign In"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderTelegramStep = () => (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
          <Link2 className="w-8 h-8 text-green-600" />
        </div>
        <CardTitle>Link Telegram Account</CardTitle>
        <CardDescription>
          Complete the linking process by verifying your Telegram account
        </CardDescription>
        {userProfile && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Linking to: <Badge variant="secondary">{userProfile.username}</Badge>
            </p>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <TelegramLogin
          isLinking={true}
          onSuccess={handleTelegramLinkSuccess}
          onError={handleTelegramLinkError}
        />
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderSuccessStep = () => (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <CardTitle>Account Successfully Linked!</CardTitle>
        <CardDescription>
          Your Telegram account is now connected to your HyperDAG profile
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        {userProfile && (
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800 mb-2">
              <strong>Profile:</strong> {userProfile.username}
            </p>
            <p className="text-sm text-green-800">
              <strong>Telegram:</strong> Connected ✓
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">What's Next?</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Access your full HyperDAG profile</li>
            <li>• Receive notifications via Telegram</li>
            <li>• Participate in Web3 projects</li>
            <li>• Join the community ecosystem</li>
          </ul>
        </div>

        <Button onClick={() => setLocation("/")} className="w-full">
          Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderLoginStep();
      case 1:
        return renderTelegramStep();
      case 2:
        return renderSuccessStep();
      default:
        return renderLoginStep();
    }
  };

  if (!match) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Link Your Accounts
            </h1>
            <p className="text-gray-600">
              Connect your Telegram authentication to your existing HyperDAG profile
            </p>
          </div>

          {/* Step Indicator */}
          {renderStepIndicator()}

          {/* Current Step Content */}
          {renderCurrentStep()}

          {/* Help Section */}
          <div className="mt-8 max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Why Link Your Account?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Security Benefits</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Enhanced two-factor authentication</li>
                      <li>• Secure profile verification</li>
                      <li>• Privacy-preserving connections</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Platform Features</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Real-time notifications</li>
                      <li>• Community integration</li>
                      <li>• Web3 project access</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}