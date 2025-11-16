import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Shield, 
  Link2, 
  User, 
  CheckCircle, 
  ArrowRight, 
  AlertCircle,
  Info,
  Smartphone,
  Key
} from "lucide-react";

interface TelegramOnboardingGuideProps {
  onClose?: () => void;
  variant?: "full" | "compact";
}

export function TelegramOnboardingGuide({ onClose, variant = "full" }: TelegramOnboardingGuideProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const steps = [
    {
      id: "setup",
      title: "Initial Setup",
      description: "Connect your Telegram account",
      icon: <MessageCircle className="w-5 h-5" />,
      status: "pending"
    },
    {
      id: "verification",
      title: "Account Verification",
      description: "Complete the verification process",
      icon: <Shield className="w-5 h-5" />,
      status: "pending"
    },
    {
      id: "linking",
      title: "Account Linking",
      description: "Link to existing HyperDAG profile",
      icon: <Link2 className="w-5 h-5" />,
      status: "pending"
    },
    {
      id: "complete",
      title: "Ready to Use",
      description: "Access your full HyperDAG profile",
      icon: <CheckCircle className="w-5 h-5" />,
      status: "pending"
    }
  ];

  if (variant === "compact") {
    return (
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
            Telegram Authentication Guide
          </CardTitle>
          <CardDescription>
            Quick reference for linking your Telegram account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Have an existing account?</strong> You'll be prompted to link your Telegram 
              authentication to your existing HyperDAG profile during the process.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <h4 className="font-medium">Quick Steps:</h4>
            <ol className="text-sm text-gray-600 space-y-1">
              <li>1. Click "Login with Telegram"</li>
              <li>2. Open @HyperDagBot in Telegram</li>
              <li>3. Send /start to get verification code</li>
              <li>4. Enter the code in HyperDAG</li>
              <li>5. Choose to link existing account if prompted</li>
            </ol>
          </div>

          {onClose && (
            <Button onClick={onClose} className="w-full">
              Got it, Continue
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full">
            <MessageCircle className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Telegram Authentication for HyperDAG</CardTitle>
          <CardDescription>
            Complete guide to connecting your Telegram account and linking to existing profiles
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="setup">Setup</TabsTrigger>
              <TabsTrigger value="linking">Linking</TabsTrigger>
              <TabsTrigger value="troubleshooting">Help</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Shield className="w-5 h-5 mr-2 text-green-600" />
                      Security Benefits
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      <span className="text-sm">Two-factor authentication</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      <span className="text-sm">Privacy-preserving verification</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      <span className="text-sm">Secure account recovery</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <User className="w-5 h-5 mr-2 text-blue-600" />
                      Platform Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-blue-500" />
                      <span className="text-sm">Real-time notifications</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-blue-500" />
                      <span className="text-sm">Community integration</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-blue-500" />
                      <span className="text-sm">Web3 project access</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert>
                <Link2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>Account Linking:</strong> If you already have a HyperDAG account, 
                  the system will automatically detect this and guide you through linking 
                  your Telegram authentication to your existing profile.
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Ready to get started?</h3>
                  <p className="text-sm text-gray-600">Follow the setup process to connect your account</p>
                </div>
                <Button onClick={() => setActiveTab("setup")}>
                  Start Setup <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="setup" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Step-by-Step Setup Process</h3>
                
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-base">
                        <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium mr-3">1</span>
                        Click "Login with Telegram"
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">
                        On the HyperDAG authentication page, click the Telegram login button to begin the process.
                      </p>
                      <Badge variant="secondary">Location: Authentication Page</Badge>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-base">
                        <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium mr-3">2</span>
                        Open Telegram Bot
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">
                        You'll be directed to open @HyperDagBot in Telegram. This is our official verification bot.
                      </p>
                      <div className="flex items-center space-x-2">
                        <Smartphone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Bot Username: @HyperDagBot</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-base">
                        <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium mr-3">3</span>
                        Get Verification Code
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">
                        Send <code className="bg-gray-100 px-2 py-1 rounded text-xs">/start</code> to the bot 
                        to receive your unique verification code.
                      </p>
                      <Alert>
                        <Key className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          The verification code is a unique 6-digit number that expires after 10 minutes.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-base">
                        <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-medium mr-3">4</span>
                        Complete Verification
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-3">
                        Return to HyperDAG and enter the verification code to complete the authentication process.
                      </p>
                      <Badge variant="outline">Auto-login after verification</Badge>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="linking" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Account Linking Process</h3>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    If you already have a HyperDAG account, you'll be prompted to link your Telegram 
                    authentication instead of creating a new account.
                  </AlertDescription>
                </Alert>

                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">New User Flow</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Automatic Account Creation</p>
                          <p className="text-xs text-gray-600">New account created with Telegram authentication</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Immediate Access</p>
                          <p className="text-xs text-gray-600">Direct access to HyperDAG platform</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Existing User Flow</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-start">
                        <Link2 className="w-4 h-4 mr-2 text-blue-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Linking Prompt</p>
                          <p className="text-xs text-gray-600">Option to link to existing account</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <User className="w-4 h-4 mr-2 text-blue-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Credential Verification</p>
                          <p className="text-xs text-gray-600">Login with existing username/password</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Manual Account Linking</CardTitle>
                    <CardDescription>
                      If you miss the automatic prompt, you can manually link accounts later
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="font-medium">From Dashboard:</h4>
                      <ol className="text-sm text-gray-600 space-y-1 pl-4">
                        <li>1. Look for the "Link Account" banner</li>
                        <li>2. Click "Link Account" button</li>
                        <li>3. Follow the guided linking process</li>
                      </ol>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium">Direct Access:</h4>
                      <p className="text-sm text-gray-600">
                        Visit <code className="bg-gray-100 px-2 py-1 rounded text-xs">/link-account</code> 
                        directly to start the linking process
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="troubleshooting" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Common Issues & Solutions</h3>
                
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-base">
                        <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
                        Verification Code Issues
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Code not received:</p>
                        <ul className="text-xs text-gray-600 ml-4 mt-1 space-y-1">
                          <li>• Ensure you're messaging @HyperDagBot</li>
                          <li>• Try sending /start again</li>
                          <li>• Check if bot is blocked or restricted</li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Code expired:</p>
                        <ul className="text-xs text-gray-600 ml-4 mt-1 space-y-1">
                          <li>• Codes expire after 10 minutes</li>
                          <li>• Request a new code by sending /start</li>
                        </ul>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-base">
                        <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
                        Account Linking Problems
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">Telegram already linked:</p>
                        <p className="text-xs text-gray-600 ml-4 mt-1">
                          This Telegram account is already connected to another HyperDAG profile. 
                          Contact support if this is incorrect.
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Login credentials incorrect:</p>
                        <p className="text-xs text-gray-600 ml-4 mt-1">
                          Double-check your existing HyperDAG username and password. 
                          Use the password reset option if needed.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-base">
                        <Info className="w-5 h-5 mr-2 text-blue-500" />
                        Need Additional Help?
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-blue-900">Community Support</p>
                          <p className="text-xs text-blue-700">Ask questions in our community channels</p>
                        </div>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <p className="text-sm font-medium text-green-900">Documentation</p>
                          <p className="text-xs text-green-700">Check our comprehensive guides</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {onClose && (
            <div className="flex justify-end mt-6 pt-6 border-t">
              <Button onClick={onClose}>
                Close Guide
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}