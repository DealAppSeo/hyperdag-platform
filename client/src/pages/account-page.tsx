import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Loader2, Check, ChevronDown, ChevronRight } from 'lucide-react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Layout } from '@/components/layout/layout';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

export default function AccountPage() {
  const { toast } = useToast();
  const { user, logoutMutation } = useAuth();
  const [location, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState('profile');
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [passwordChangeStep, setPasswordChangeStep] = useState<'initial' | 'verification'>('initial');
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');

  // User settings state
  const { data: settings, isLoading: isLoadingSettings, error: settingsError } = useQuery({
    queryKey: ['/api/user/settings'],
    staleTime: 60000, // 1 minute
  });
  
  // Initialize email and bio from user data when available
  useEffect(() => {
    if (user) {
      if (user.email) {
        setEmail(user.email);
      }
      if (user.bio) {
        setBio(user.bio);
      }
    }
  }, [user]);
  
  // Stats
  const { data: userStats } = useQuery({
    queryKey: ['/api/user/stats'],
    staleTime: 60000,
  });

  // Request password change verification code
  const requestPasswordChangeMutation = useMutation({
    mutationFn: async (data: { currentPassword: string }) => {
      const response = await apiRequest('POST', '/api/user/request-password-change', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to request password change');
      }
      return await response.json();
    },
    onSuccess: (data) => {
      setPasswordChangeStep('verification');
      setEmailSent(data.emailSent);
      
      toast({
        title: "Verification Code Sent",
        description: data.emailSent 
          ? "A verification code has been sent to your email."
          : "A verification code has been generated. Please enter it to continue.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Request Failed",
        description: error.message || "Please check your current password and try again.",
        variant: "destructive",
      });
    },
  });
  
  // Change password mutation with verification
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { newPassword: string; confirmPassword: string; verificationCode: string }) => {
      const response = await apiRequest('POST', '/api/user/change-password', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to change password');
      }
      return await response.json();
    },
    onSuccess: () => {
      // Reset all fields and go back to initial state
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setVerificationCode('');
      setPasswordChangeStep('initial');
      setEmailSent(false);
      
      toast({
        title: "Password Changed",
        description: "Your password has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password Change Failed",
        description: error.message || "Please check your verification code and try again.",
        variant: "destructive",
      });
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/user/settings', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update settings');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/settings'] });
      toast({
        title: "Settings Updated",
        description: "Your settings have been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Settings Update Failed",
        description: error.message || "Failed to update settings",
        variant: "destructive",
      });
    },
  });
  
  // Add email mutation
  const addEmailMutation = useMutation({
    mutationFn: async (data: { email: string }) => {
      const response = await apiRequest('POST', '/api/user/add-email', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update email');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Email Updated",
        description: "Your email has been updated successfully. Please check your inbox for a verification link.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Email Update Failed",
        description: error.message || "Failed to update email. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Update bio mutation
  const updateBioMutation = useMutation({
    mutationFn: async (data: { bio: string }) => {
      const response = await apiRequest('POST', '/api/user/update-bio', data);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update bio');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
      toast({
        title: "Bio Updated",
        description: "Your bio has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Bio Update Failed",
        description: error.message || "Failed to update bio. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  const handleRequestPasswordChange = () => {
    // Validate current password
    if (!currentPassword) {
      toast({
        title: "Current Password Required",
        description: "Please enter your current password.",
        variant: "destructive",
      });
      return;
    }
    
    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      toast({
        title: "Invalid New Password",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "New password and confirmation must match.",
        variant: "destructive",
      });
      return;
    }
    
    // Request verification code
    requestPasswordChangeMutation.mutate({
      currentPassword,
    });
  };
  
  const handleSubmitPasswordChange = () => {
    // Validate verification code
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid Verification Code",
        description: "Please enter the 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }
    
    // Submit password change with verification code
    changePasswordMutation.mutate({
      newPassword,
      confirmPassword,
      verificationCode,
    });
  };
  
  const handleCancelPasswordChange = () => {
    // Reset state and go back to initial step
    setPasswordChangeStep('initial');
    setVerificationCode('');
    setEmailSent(false);
  };

  if (!user) return null;
  
  return (
    <Layout>
      <div className="container max-w-4xl py-6">
        <h1 className="text-3xl font-bold mb-2">Account</h1>
        <p className="text-muted-foreground mb-6">Manage your account settings and preferences</p>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>
          
          {/* Profile Tab */}
          <TabsContent value="profile">
            <div className="space-y-6">
              {/* Profile Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" defaultValue={user.username} disabled />
                      <p className="text-xs text-muted-foreground">Your username cannot be changed</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <textarea
                      id="bio"
                      className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Tell us about yourself"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => {
                      // Check if either email or bio has changed
                      const emailChanged = email && email !== user.email;
                      const bioChanged = bio !== (user.bio || '');
                      
                      if (emailChanged && bioChanged) {
                        // Both email and bio changed
                        addEmailMutation.mutate({ email });
                        updateBioMutation.mutate({ bio });
                      } else if (emailChanged) {
                        // Only email changed
                        addEmailMutation.mutate({ email });
                      } else if (bioChanged) {
                        // Only bio changed
                        updateBioMutation.mutate({ bio });
                      } else {
                        // Nothing changed
                        toast({ 
                          title: "No Changes Detected", 
                          description: "Please make changes before saving."
                        });
                      }
                    }}
                    disabled={addEmailMutation.isPending || updateBioMutation.isPending}
                  >
                    {(addEmailMutation.isPending || updateBioMutation.isPending) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </CardFooter>
              </Card>
              
              {/* Reputation & Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Reputation & Stats</CardTitle>
                  <CardDescription>Your activity and reputation on HyperDAG</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 border rounded-md text-center">
                      <div className="text-2xl font-bold">{user.tokens || 0}</div>
                      <div className="text-sm text-muted-foreground">HDAG Tokens</div>
                    </div>
                    <div className="p-4 border rounded-md text-center">
                      <div className="text-2xl font-bold">{userStats?.reputation || 0}</div>
                      <div className="text-sm text-muted-foreground">Reputation</div>
                    </div>
                    <div className="p-4 border rounded-md text-center">
                      <div className="text-2xl font-bold">{userStats?.referralStats?.level1 || 0}</div>
                      <div className="text-sm text-muted-foreground">Referrals</div>
                    </div>
                    <div className="p-4 border rounded-md text-center">
                      <div className="text-2xl font-bold">{userStats?.projectsCount || 0}</div>
                      <div className="text-sm text-muted-foreground">Projects</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Security Tab */}
          <TabsContent value="security">
            <div className="space-y-6">
              {/* Password Change */}
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your password to keep your account secure</CardDescription>
                </CardHeader>
                
                {/* Initial state - Enter passwords */}
                {passwordChangeStep === 'initial' && (
                  <>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="current-password">Current Password</Label>
                        <Input 
                          id="current-password" 
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="new-password">New Password</Label>
                        <Input 
                          id="new-password" 
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm New Password</Label>
                        <Input 
                          id="confirm-password" 
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        onClick={handleRequestPasswordChange}
                        disabled={requestPasswordChangeMutation.isPending}
                      >
                        {requestPasswordChangeMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending Verification...
                          </>
                        ) : (
                          'Continue'
                        )}
                      </Button>
                    </CardFooter>
                  </>
                )}
                
                {/* Verification state - Enter OTP code */}
                {passwordChangeStep === 'verification' && (
                  <>
                    <CardContent className="space-y-4">
                      {emailSent && (
                        <Alert className="mb-4">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Verification Code Sent</AlertTitle>
                          <AlertDescription>
                            We've sent a verification code to your email. Please enter it below to confirm your password change.
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="space-y-2">
                        <Label htmlFor="verification-code">Verification Code</Label>
                        <div className="flex justify-center py-4">
                          <InputOTP 
                            value={verificationCode} 
                            onChange={setVerificationCode}
                            maxLength={6}
                          >
                            <InputOTPGroup>
                              <InputOTPSlot index={0} />
                              <InputOTPSlot index={1} />
                              <InputOTPSlot index={2} />
                              <InputOTPSlot index={3} />
                              <InputOTPSlot index={4} />
                              <InputOTPSlot index={5} />
                            </InputOTPGroup>
                          </InputOTP>
                        </div>
                        <p className="text-sm text-muted-foreground text-center mt-2">
                          Enter the 6-digit code sent to your email address
                        </p>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                      <Button 
                        variant="outline"
                        onClick={handleCancelPasswordChange}
                      >
                        Cancel
                      </Button>
                      
                      <Button 
                        onClick={handleSubmitPasswordChange}
                        disabled={changePasswordMutation.isPending}
                      >
                        {changePasswordMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Changing Password...
                          </>
                        ) : (
                          'Change Password'
                        )}
                      </Button>
                    </CardFooter>
                  </>
                )}
              </Card>
              
              {/* Two-Factor Authentication */}
              <Card>
                <CardHeader>
                  <CardTitle>Two-Factor Authentication</CardTitle>
                  <CardDescription>Secure your account with 2FA</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Email Authentication</h4>
                        <p className="text-sm text-muted-foreground">Receive verification codes via email</p>
                      </div>
                      <Button variant="outline">
                        {user.emailVerified ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Authenticator App</h4>
                        <p className="text-sm text-muted-foreground">Use an authenticator app to generate codes</p>
                      </div>
                      <Button variant="outline">
                        {user.totpEnabled ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Wallet Authentication</h4>
                        <p className="text-sm text-muted-foreground">Use your wallet to authenticate</p>
                      </div>
                      <Button variant="outline">
                        {user.walletAddress ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Connected Accounts */}
              <Card>
                <CardHeader>
                  <CardTitle>Connected Accounts</CardTitle>
                  <CardDescription>Manage external accounts connected to your profile</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Web3 Wallet</h4>
                        <p className="text-sm text-muted-foreground">
                          {user.walletAddress 
                            ? `Connected: ${user.walletAddress.substring(0, 6)}...${user.walletAddress.substring(user.walletAddress.length - 4)}` 
                            : 'Not connected'}
                        </p>
                      </div>
                      <Button variant="outline">
                        {user.walletAddress ? 'Disconnect' : 'Connect'}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">Telegram</h4>
                        <p className="text-sm text-muted-foreground">
                          {user.telegramUsername ? `Connected: @${user.telegramUsername}` : 'Not connected'}
                        </p>
                      </div>
                      <Button variant="outline">
                        {user.telegramUsername ? 'Disconnect' : 'Connect'}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">GitHub</h4>
                        <p className="text-sm text-muted-foreground">Connect your GitHub account</p>
                      </div>
                      <Button variant="outline">Connect</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Accordion type="single" collapsible className="w-full space-y-4">
              {/* Privacy Settings */}
              <AccordionItem value="privacy" className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center">
                    <span className="font-medium">Privacy Settings</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="p-4 pt-2 space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Profile Visibility</h4>
                          <p className="text-sm text-muted-foreground">Control who can see your profile</p>
                        </div>
                        <select className="border rounded px-2 py-1 text-sm">
                          <option>Public</option>
                          <option>Limited</option>
                          <option>Private</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Activity Visibility</h4>
                          <p className="text-sm text-muted-foreground">Control who can see your activity</p>
                        </div>
                        <select className="border rounded px-2 py-1 text-sm">
                          <option>Public</option>
                          <option>Connections Only</option>
                          <option>Private</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Search Indexing</h4>
                          <p className="text-sm text-muted-foreground">Allow your profile to appear in search results</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="search-indexing" className="rounded" defaultChecked />
                          <label htmlFor="search-indexing">Enable</label>
                        </div>
                      </div>
                      
                      <Button className="mt-2">Save Privacy Settings</Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              {/* Notification Settings */}
              <AccordionItem value="notifications" className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center">
                    <span className="font-medium">Notification Preferences</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="p-4 pt-2 space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Email Notifications</h4>
                          <p className="text-sm text-muted-foreground">Receive updates via email</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="email-notifs" className="rounded" defaultChecked />
                          <label htmlFor="email-notifs">Enable</label>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">In-App Notifications</h4>
                          <p className="text-sm text-muted-foreground">Receive notifications within the app</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="inapp-notifs" className="rounded" defaultChecked />
                          <label htmlFor="inapp-notifs">Enable</label>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">SMS Notifications</h4>
                          <p className="text-sm text-muted-foreground">Receive important alerts via SMS</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="sms-notifs" className="rounded" />
                          <label htmlFor="sms-notifs">Enable</label>
                        </div>
                      </div>
                      
                      <Button className="mt-2">Save Notification Settings</Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              {/* Wallet Settings */}
              <AccordionItem value="wallet" className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center">
                    <span className="font-medium">Wallet Settings</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="p-4 pt-2 space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Default Network</h4>
                          <p className="text-sm text-muted-foreground">Select your preferred blockchain network</p>
                        </div>
                        <select className="border rounded px-2 py-1 text-sm">
                          <option>Polygon CDK</option>
                          <option>Polygon Mainnet</option>
                          <option>Polygon Mumbai</option>
                          <option>Ethereum</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Gas Fee Preference</h4>
                          <p className="text-sm text-muted-foreground">Set your default gas fee strategy</p>
                        </div>
                        <select className="border rounded px-2 py-1 text-sm">
                          <option>Standard</option>
                          <option>Fast</option>
                          <option>Aggressive</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Auto-Connect Wallet</h4>
                          <p className="text-sm text-muted-foreground">Automatically connect your wallet on login</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="auto-connect" className="rounded" defaultChecked />
                          <label htmlFor="auto-connect">Enable</label>
                        </div>
                      </div>
                      
                      <Button className="mt-2">Save Wallet Settings</Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              {/* Interface Settings */}
              <AccordionItem value="interface" className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center">
                    <span className="font-medium">Interface Settings</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="p-4 pt-2 space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Theme</h4>
                          <p className="text-sm text-muted-foreground">Choose your preferred appearance</p>
                        </div>
                        <select className="border rounded px-2 py-1 text-sm">
                          <option>Light</option>
                          <option>Dark</option>
                          <option>System</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Persona Path</h4>
                          <p className="text-sm text-muted-foreground">Choose your persona color scheme</p>
                        </div>
                        <select className="border rounded px-2 py-1 text-sm">
                          <option>Blue (Developer)</option>
                          <option>Orange (Designer)</option>
                          <option>Green (Influencer)</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Font Size</h4>
                          <p className="text-sm text-muted-foreground">Adjust the text size</p>
                        </div>
                        <select className="border rounded px-2 py-1 text-sm">
                          <option>Small</option>
                          <option>Medium</option>
                          <option>Large</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Animations</h4>
                          <p className="text-sm text-muted-foreground">Enable or disable UI animations</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="animations" className="rounded" defaultChecked />
                          <label htmlFor="animations">Enable</label>
                        </div>
                      </div>
                      
                      <Button className="mt-2">Save Interface Settings</Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              {/* Data Management */}
              <AccordionItem value="data" className="border rounded-lg overflow-hidden">
                <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center">
                    <span className="font-medium">Data Management</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="p-4 pt-2 space-y-4">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Data Retention</h4>
                          <p className="text-sm text-muted-foreground">How long to keep your data</p>
                        </div>
                        <select className="border rounded px-2 py-1 text-sm">
                          <option>Forever</option>
                          <option>5 Years</option>
                          <option>1 Year</option>
                          <option>90 Days</option>
                        </select>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">Analytics Consent</h4>
                          <p className="text-sm text-muted-foreground">Allow us to collect anonymous usage data</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="analytics" className="rounded" defaultChecked />
                          <label htmlFor="analytics">Enable</label>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full">Download My Data</Button>
                        <Button variant="destructive" className="w-full">Delete Account</Button>
                      </div>
                      
                      {/* Mobile-Accessible Logout */}
                      <div className="pt-4 border-t md:hidden">
                        <div className="space-y-2">
                          <h4 className="font-medium">Session Management</h4>
                          <p className="text-sm text-muted-foreground">Sign out of your account</p>
                          <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => {
                              logoutMutation.mutate();
                              setTimeout(() => {
                                window.location.href = '/auth';
                              }, 200);
                            }}
                          >
                            Sign Out
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}