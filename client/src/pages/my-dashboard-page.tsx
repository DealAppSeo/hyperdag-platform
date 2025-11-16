import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  User, 
  Share, 
  Trophy, 
  Award, 
  Rocket, 
  Target, 
  Calendar, 
  ArrowRight, 
  CheckCircle2,
  Sparkles, 
  Settings, 
  Edit,
  Star,
  MessageCircle,
  Bell,
  Wallet,
  Shield
} from "lucide-react";
import UserAvatar from "@/components/ui/user-avatar";
import { Link } from "wouter";
import { SimpleMetaMaskConnect } from "@/components/web3/SimpleMetaMaskConnect";

export default function MyDashboardPage() {
  const { user } = useAuth();
  const [editingBio, setEditingBio] = useState(false);
  const [bio, setBio] = useState(user?.bio || "");
  
  const { data: achievements } = useQuery({
    queryKey: ["/api/achievements"],
    enabled: !!user
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/user/stats"],
    enabled: !!user
  });
  
  const { data: journeyData } = useQuery({
    queryKey: ["/api/personalized-journey"],
    enabled: !!user
  });

  if (!user) {
    return null;
  }

  // Achievements data with proper array fallback
  const userAchievements = Array.isArray(achievements) ? achievements : [
    { id: 1, title: "First Login", description: "Logged in for the first time", icon: "rocket", date: "2025-01-15", completed: true },
    { id: 2, title: "Profile Complete", description: "Filled out all profile fields", icon: "user", date: "2025-01-16", completed: true },
    { id: 3, title: "Connected Wallet", description: "Connected your first crypto wallet", icon: "wallet", date: null, completed: false },
    { id: 4, title: "First Grant", description: "Applied for your first grant", icon: "award", date: null, completed: false },
    { id: 5, title: "Network Builder", description: "Connected with 5 other users", icon: "users", date: null, completed: false },
  ];
  
  // Journey data from API
  const journey = journeyData || {
    currentStep: 2,
    totalSteps: 5,
    nextMilestone: "Connect your wallet",
    recentActivity: [
      { type: "login", date: "2025-05-18", description: "Logged in" },
      { type: "profile_update", date: "2025-05-17", description: "Updated profile information" },
      { type: "reputation", date: "2025-05-15", description: "ReputationID score increased" }
    ]
  };

  // Handle bio update
  const handleUpdateBio = () => {
    setEditingBio(false);
  };

  const handleShareProgress = () => {
    const shareUrl = `https://hyperdag.org/u/${user.username}`;
    navigator.clipboard.writeText(shareUrl);
  };

  return (
    <div className="py-4 sm:py-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My HyperDAG</h1>
          <p className="mt-1 text-sm sm:text-base text-gray-500">Track your progress, update your profile, and share your achievements</p>
        </div>
          
          {/* Hero section */}
          <div className="mb-6 sm:mb-8 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div className="relative mx-auto sm:mx-0">
                <UserAvatar username={user.username} className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-background" />
                <div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1">
                  <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              </div>
              
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-2xl sm:text-3xl font-bold mb-1">{user.username}</h1>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-3">
                  <Badge variant="outline" className="bg-primary/10 text-xs sm:text-sm">Level {user.authLevel || 1}</Badge>
                  {user.openToCollaboration && (
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 text-xs sm:text-sm">Open to Collaboration</Badge>
                  )}
                  <Badge variant="outline" className="bg-secondary/10 text-xs sm:text-sm">
                    <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                    Reputation {user.reputationScore || 0}
                  </Badge>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={handleShareProgress}
                    variant="outline" 
                    className="text-xs sm:text-sm"
                  >
                    <Share className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" />
                    Share Progress
                  </Button>
                  <SimpleMetaMaskConnect />
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Points</CardTitle>
                    <Trophy className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{user.points || 0}</div>
                    <p className="text-xs text-muted-foreground">+0 from last month</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Reputation Score</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{user.reputationScore || 0}</div>
                    <p className="text-xs text-muted-foreground">Building trust</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Auth Level</CardTitle>
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{user.authLevel || 1}</div>
                    <p className="text-xs text-muted-foreground">Multi-factor enabled</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Achievements</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{userAchievements.filter(a => a.completed).length}</div>
                    <p className="text-xs text-muted-foreground">of {userAchievements.length} unlocked</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {userAchievements.map((achievement) => (
                  <Card key={achievement.id} className={achievement.completed ? "border-green-200 bg-green-50" : "border-gray-200"}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{achievement.title}</CardTitle>
                        {achievement.completed ? (
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        ) : (
                          <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
                        )}
                      </div>
                      <CardDescription>{achievement.description}</CardDescription>
                    </CardHeader>
                    {achievement.completed && achievement.date && (
                      <CardFooter>
                        <p className="text-sm text-muted-foreground">
                          Completed on {achievement.date}
                        </p>
                      </CardFooter>
                    )}
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>Update your personal information and bio.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Username</Label>
                      <Input value={user.username} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={user.email || "Not provided"} disabled />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Bio</Label>
                    {editingBio ? (
                      <div className="space-y-2">
                        <Textarea 
                          value={bio}
                          onChange={(e) => setBio(e.target.value)}
                          placeholder="Tell us about yourself..."
                        />
                        <div className="flex gap-2">
                          <Button onClick={handleUpdateBio} size="sm">Save</Button>
                          <Button onClick={() => setEditingBio(false)} variant="outline" size="sm">Cancel</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 border rounded-md">
                        <span className="text-sm text-muted-foreground">
                          {bio || "No bio added yet"}
                        </span>
                        <Button onClick={() => setEditingBio(true)} variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>Manage your account preferences and security.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">Two-Factor Authentication</h4>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                      </div>
                      <Badge variant={user.twoFactorEnabled ? "default" : "secondary"}>
                        {user.twoFactorEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">Privacy Settings</h4>
                        <p className="text-sm text-muted-foreground">Control who can see your profile</p>
                      </div>
                      <Button variant="outline">Manage Privacy</Button>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-medium">Data Export</h4>
                        <p className="text-sm text-muted-foreground">Download all your data</p>
                      </div>
                      <Button variant="outline">Export Data</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-destructive">Danger Zone</CardTitle>
                  <CardDescription>
                    Irreversible actions for your account
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:items-center">
                      <div>
                        <h4 className="font-medium">Delete Account</h4>
                        <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                      </div>
                      <Button variant="destructive">Delete Account</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
      </div>
    </div>
  );
}