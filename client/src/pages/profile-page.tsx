import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import UserAvatar from "@/components/ui/user-avatar";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useNetworkingPreference } from "@/hooks/use-networking-preference";

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("account");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Use shared networking preference hook
  const { openToNetworking, handleNetworkingToggle, isUpdating } = useNetworkingPreference();
  
  const { data: userStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/user/stats"],
    enabled: !!user,
  });
  


  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (passwordData: { currentPassword: string; newPassword: string; confirmPassword: string }) => {
      try {
        const res = await apiRequest("POST", "/api/user/change-password", passwordData);
        
        // Check if response is OK before trying to parse JSON
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(errorText || 'Failed to update password');
        }
        
        return await res.json();
      } catch (error) {
        console.error('Password change error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your password has been changed successfully.",
      });
      // Clear password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error: any) => {
      toast({
        title: "Password Update Failed",
        description: error.message || "Please check your current password and try again.",
        variant: "destructive",
      });
    },
  });
  
  const handlePasswordChange = () => {
    // Validate passwords
    if (!currentPassword) {
      toast({
        title: "Current Password Required",
        description: "Please enter your current password.",
        variant: "destructive",
      });
      return;
    }
    
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
    
    // Submit password change
    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
      confirmPassword,
    });
  };
  
  const handleSaveChanges = () => {
    toast({
      title: "Changes saved",
      description: "Your profile has been updated successfully.",
    });
  };
  
  if (!user) return null;
  
  return (
    <Layout>
      <div className="p-4 md:p-6 max-w-4xl mx-auto pb-20 md:pb-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="w-full flex flex-wrap">
            <TabsTrigger value="account" className="flex-1 text-sm sm:text-base py-2 px-2 sm:px-4">Account</TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1 text-sm sm:text-base py-2 px-2 sm:px-4">Notifications</TabsTrigger>
            <TabsTrigger value="security" className="flex-1 text-sm sm:text-base py-2 px-2 sm:px-4">Security</TabsTrigger>
          </TabsList>
          
          <TabsContent value="account" className="space-y-4">
            {/* Profile Information */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex flex-col items-center">
                    <UserAvatar username={user.username} size="lg" />
                    <Button variant="outline" className="mt-3 text-sm">
                      Change Avatar
                    </Button>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" defaultValue={user.username} disabled />
                    </div>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input id="displayName" defaultValue={user.username} />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" defaultValue="" placeholder="Add email address" />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <textarea 
                        id="bio" 
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
                        placeholder="Tell others about yourself..."
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Account Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Account Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStats ? (
                  <div className="h-32 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Tokens Balance</p>
                      <p className="text-2xl font-bold text-primary">{user.tokens} HDAG</p>
                      <p className="text-xs text-green-600 mt-1">Earned from activities and referrals</p>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Points</p>
                      <p className="text-2xl font-bold text-secondary">{user.points}</p>
                      <p className="text-xs text-gray-600 mt-1">Can be converted to tokens</p>
                    </div>
                    
                    <div className="bg-slate-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Referral Network</p>
                      <p className="text-2xl font-bold text-accent">
                        {(userStats?.referralStats?.level1 || 0) + 
                         (userStats?.referralStats?.level2 || 0) + 
                         (userStats?.referralStats?.level3 || 0)}
                      </p>
                      <div className="flex gap-2 text-xs text-gray-600 mt-1">
                        <span>L1: {userStats?.referralStats?.level1 || 0}</span>
                        <span>L2: {userStats?.referralStats?.level2 || 0}</span>
                        <span>L3: {userStats?.referralStats?.level3 || 0}</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-gray-500">Receive email updates about your account</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Project Updates</p>
                      <p className="text-sm text-gray-500">Get notified about projects you're involved in</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Referral Notifications</p>
                      <p className="text-sm text-gray-500">Receive alerts when someone uses your referral code</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Token Rewards</p>
                      <p className="text-sm text-gray-500">Get notified when you earn tokens</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Open to Networking</p>
                      <p className="text-sm text-gray-500">Allow AI to send you connection invitations based on similar interests and goals</p>
                    </div>
                    <Switch 
                      checked={openToNetworking} 
                      onCheckedChange={handleNetworkingToggle}
                      disabled={updateNetworkingMutation || {}.isPending}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Marketing Updates</p>
                      <p className="text-sm text-gray-500">Receive news and promotional materials</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input 
                    id="currentPassword" 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input 
                    id="newPassword" 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                
                <Button 
                  onClick={handlePasswordChange}
                  disabled={changePasswordMutation.isPending}
                >
                  {changePasswordMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Enable 2FA</p>
                    <p className="text-sm text-gray-500">Enhance your account security</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <Button variant="outline">Setup Authenticator App</Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Connected Wallets</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-dashed border-gray-300 p-8 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-gray-500 mb-2">No wallets connected</p>
                  <Button>Connect Wallet</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 flex justify-end">
          <Button variant="outline" className="mr-2">
            Cancel
          </Button>
          <Button onClick={handleSaveChanges}>
            Save Changes
          </Button>
        </div>
      </div>
    </Layout>
  );
}
