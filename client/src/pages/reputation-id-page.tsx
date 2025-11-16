import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import AppLayout from "@/components/layout/app-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Shield, 
  Fingerprint, 
  Lock, 
  Key, 
  UserCircle, 
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";

export default function ReputationIdPage() {
  const { user } = useAuth();
  const [reputationScore] = useState(user?.reputationScore || 0);
  const [identityLevel] = useState(user?.authLevel || 1);
  const [isGeneratingProof, setIsGeneratingProof] = useState(false);

  if (!user) {
    return null;
  }

  const handleGenerateProof = () => {
    setIsGeneratingProof(true);
    // Simulate proof generation
    setTimeout(() => {
      setIsGeneratingProof(false);
    }, 2000);
  };

  return (
    <AppLayout 
      title="ReputationID" 
      description="Privacy-preserving identity and reputation for Web3"
    >
      {/* Introduction Card */}
      <Card className="mb-6 border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-2xl">Your ReputationID</CardTitle>
            </div>
            <Badge variant="outline" className="px-3 py-1 text-sm">
              <div className="flex items-center gap-1.5">
                <Key className="h-3.5 w-3.5" />
                <span>Level {identityLevel}/4</span>
              </div>
            </Badge>
          </div>
          <CardDescription className="text-base">
            A privacy-preserving identity credential that keeps your real identity anonymous 
            while building your online reputation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-lg mb-2">How ReputationID Works</h3>
              <p className="text-muted-foreground mb-4">
                Your ReputationID combines three powerful Web3 technologies:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2">
                  <div className="bg-primary/10 p-1 rounded-full mt-0.5">
                    <Lock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <span className="font-medium">Zero-Knowledge Proofs (ZKPs)</span>
                    <p className="text-sm text-muted-foreground">Verify attributes without revealing data</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="bg-primary/10 p-1 rounded-full mt-0.5">
                    <UserCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <span className="font-medium">Soulbound Tokens (SBTs)</span>
                    <p className="text-sm text-muted-foreground">Non-transferable tokens tied to your identity</p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <div className="bg-primary/10 p-1 rounded-full mt-0.5">
                    <Fingerprint className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <span className="font-medium">Self-Sovereign ID (SSID)</span>
                    <p className="text-sm text-muted-foreground">You own and control your digital identity</p>
                  </div>
                </li>
              </ul>
              
              <div className="mt-6">
                <Link href="/definitions/zkp" className="text-primary flex items-center gap-1 hover:underline">
                  Learn more about these technologies <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <h3 className="font-medium">Reputation Score</h3>
                  <span className="font-semibold">{reputationScore}/100</span>
                </div>
                <Progress value={reputationScore} className="h-2.5" />
                <p className="text-sm text-muted-foreground mt-2">
                  Your reputation score is calculated based on your verified credentials,
                  your activity on HyperDAG, and your contributions to the ecosystem.
                </p>
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <h3 className="font-medium">Identity Verification</h3>
                  <span className="font-semibold">{identityLevel}/4</span>
                </div>
                <Progress value={identityLevel * 25} className="h-2.5" />
                <p className="text-sm text-muted-foreground mt-2">
                  Your identity level increases as you verify different aspects of your identity
                  while maintaining your privacy through zero-knowledge proofs.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-xl">
          <TabsTrigger value="dashboard">Credential Dashboard</TabsTrigger>
          <TabsTrigger value="manage">Manage Identity</TabsTrigger>
          <TabsTrigger value="proofs">Generate & Verify</TabsTrigger>
        </TabsList>

        {/* Credential Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Verified Credentials</CardTitle>
              <CardDescription>
                These are the credentials you have verified through the HyperDAG ecosystem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Email verification */}
                <Card className="border-green-500/20 bg-green-50/30 dark:bg-green-900/5">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Email Verification</h3>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Verified via confirmation link</p>
                  </CardContent>
                </Card>
                
                {/* Identity verification */}
                <Card className="border-yellow-500/20 bg-yellow-50/30 dark:bg-yellow-900/5">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Identity Verification</h3>
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Partial verification</p>
                  </CardContent>
                </Card>
                
                {/* Phone verification */}
                <Card className="border-green-500/20 bg-green-50/30 dark:bg-green-900/5">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Phone Verification</h3>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Verified via SMS code</p>
                  </CardContent>
                </Card>
                
                {/* Wallet connection */}
                <Card className="border-yellow-500/20 bg-yellow-50/30 dark:bg-yellow-900/5">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Wallet Connection</h3>
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Pending verification</p>
                    <Button variant="outline" size="sm" className="mt-2 w-full">
                      Connect Wallet
                    </Button>
                  </CardContent>
                </Card>
                
                {/* Community standing */}
                <Card className="border-green-500/20 bg-green-50/30 dark:bg-green-900/5">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">Community Standing</h3>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Good standing (Level 2)</p>
                  </CardContent>
                </Card>
                
                {/* 4FA verification */}
                <Card className="border-purple-500/20 bg-purple-50/30 dark:bg-purple-900/5">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <h3 className="font-medium">4FA Verification</h3>
                      <Badge className="bg-purple-500">PREMIUM</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">2/4 factors verified</p>
                    <Button variant="outline" size="sm" className="mt-2 w-full">
                      Complete Verification
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleGenerateProof} 
                disabled={isGeneratingProof}
                className="gap-2"
              >
                {isGeneratingProof ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4" />
                    Generate Reputation Proof
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
          
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertTitle>Complete Your Verification</AlertTitle>
            <AlertDescription>
              Connect your wallet to increase your verification level and unlock additional features.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Manage Identity Tab */}
        <TabsContent value="manage" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Manage Your Identity</CardTitle>
              <CardDescription>
                Control what aspects of your identity are shared and how your reputation is built
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-lg mb-4">Privacy Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <h4 className="font-medium">Public Profile</h4>
                        <p className="text-sm text-muted-foreground">Username and profile picture</p>
                      </div>
                      <Badge variant="outline">Visible</Badge>
                    </div>
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <h4 className="font-medium">Reputation Score</h4>
                        <p className="text-sm text-muted-foreground">Your overall reputation score</p>
                      </div>
                      <Badge variant="outline">Visible</Badge>
                    </div>
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <h4 className="font-medium">Contact Information</h4>
                        <p className="text-sm text-muted-foreground">Email and phone number</p>
                      </div>
                      <Badge variant="outline">Hidden</Badge>
                    </div>
                    <div className="flex items-center justify-between border-b pb-3">
                      <div>
                        <h4 className="font-medium">Wallet Address</h4>
                        <p className="text-sm text-muted-foreground">Your connected wallet address</p>
                      </div>
                      <Badge variant="outline">Hidden</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Activity History</h4>
                        <p className="text-sm text-muted-foreground">Your actions on the platform</p>
                      </div>
                      <Badge variant="outline">Visible</Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-lg mb-4">Connected Accounts</h3>
                  <p className="text-muted-foreground mb-4">
                    Connecting external accounts will increase your reputation score while maintaining privacy.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button variant="outline" className="justify-start">
                      <div className="bg-primary/10 p-1.5 rounded-full mr-2">
                        <svg className="h-4 w-4" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                        </svg>
                      </div>
                      Connect GitHub
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <div className="bg-primary/10 p-1.5 rounded-full mr-2">
                        <svg className="h-4 w-4" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                        </svg>
                      </div>
                      Connect Twitter
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <div className="bg-primary/10 p-1.5 rounded-full mr-2">
                        <svg className="h-4 w-4" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </div>
                      Connect LinkedIn
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <div className="bg-primary/10 p-1.5 rounded-full mr-2">
                        <svg className="h-4 w-4" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                        </svg>
                      </div>
                      Connect Instagram
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Proofs Tab */}
        <TabsContent value="proofs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ZK Proofs</CardTitle>
              <CardDescription>
                Generate and verify zero-knowledge proofs to protect your privacy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-lg mb-4">Generate New Proof</h3>
                  <p className="text-muted-foreground mb-4">
                    Select what you want to prove without revealing your personal information:
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    <div className="border rounded-md p-3 flex items-start cursor-pointer hover:bg-muted/50">
                      <input type="checkbox" className="mt-1 mr-3" />
                      <div>
                        <h4 className="font-medium">Age Verification</h4>
                        <p className="text-sm text-muted-foreground">Prove you're over 18 without revealing birth date</p>
                      </div>
                    </div>
                    <div className="border rounded-md p-3 flex items-start cursor-pointer hover:bg-muted/50">
                      <input type="checkbox" className="mt-1 mr-3" />
                      <div>
                        <h4 className="font-medium">Location Verification</h4>
                        <p className="text-sm text-muted-foreground">Prove location without revealing exact address</p>
                      </div>
                    </div>
                    <div className="border rounded-md p-3 flex items-start cursor-pointer hover:bg-muted/50">
                      <input type="checkbox" className="mt-1 mr-3" />
                      <div>
                        <h4 className="font-medium">Reputation Score</h4>
                        <p className="text-sm text-muted-foreground">Prove minimum reputation score</p>
                      </div>
                    </div>
                    <div className="border rounded-md p-3 flex items-start cursor-pointer hover:bg-muted/50">
                      <input type="checkbox" className="mt-1 mr-3" />
                      <div>
                        <h4 className="font-medium">Skill Verification</h4>
                        <p className="text-sm text-muted-foreground">Prove skill level without revealing details</p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    onClick={handleGenerateProof} 
                    disabled={isGeneratingProof}
                    className="gap-2"
                  >
                    {isGeneratingProof ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Key className="h-4 w-4" />
                        Generate Proof
                      </>
                    )}
                  </Button>
                </div>
                
                <div className="pt-6 border-t">
                  <h3 className="font-medium text-lg mb-4">Verify External Proof</h3>
                  <p className="text-muted-foreground mb-4">
                    Paste a ZK proof to verify it:
                  </p>
                  
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Paste ZK proof hash..." 
                      className="flex-1 px-3 py-2 border rounded-md"
                    />
                    <Button variant="outline">Verify</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>About ZK Proofs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Zero-knowledge proofs allow you to prove something without revealing the underlying information.
                  For example, you can prove you're over 18 without revealing your birth date.
                </p>
                <Link href="/definitions/zkp" className="text-primary flex items-center gap-1 hover:underline">
                  Learn more about ZK proofs <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>About SBTs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Soulbound Tokens (SBTs) are non-transferable tokens that represent credentials,
                  affiliations, or commitments tied to your digital identity.
                </p>
                <Link href="/definitions" className="text-primary flex items-center gap-1 hover:underline">
                  Learn more about SBTs <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
}