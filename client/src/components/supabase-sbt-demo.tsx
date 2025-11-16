import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Shield, Zap, Database, Users, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SBTCredential {
  id: number;
  type: string;
  title: string;
  description: string;
  status: 'pending' | 'verified' | 'rejected';
  issuedAt: string;
  evidenceUrl?: string;
}

interface ReputationUpdate {
  type: string;
  points: number;
  description: string;
  timestamp: string;
}

export function SupabaseSBTDemo() {
  const [credentials, setCredentials] = useState<SBTCredential[]>([]);
  const [reputationScore, setReputationScore] = useState(0);
  const [recentActivity, setRecentActivity] = useState<ReputationUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [authStatus, setAuthStatus] = useState<{
    hasProfile: boolean;
    has2FA: boolean;
    hasWallet: boolean;
    canCreateSBT: boolean;
  }>({
    hasProfile: false,
    has2FA: false,
    hasWallet: false,
    canCreateSBT: false
  });
  const { toast } = useToast();

  // Form states
  const [newCredential, setNewCredential] = useState({
    type: '',
    title: '',
    description: '',
    evidence: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    checkSupabaseConnection();
    loadUserData();
    checkAuthRequirements();
  }, []);

  const checkSupabaseConnection = async () => {
    setConnectionStatus('connecting');
    try {
      const response = await fetch('/api/supabase/health');
      const data = await response.json();
      
      if (data.success && data.data.status === 'healthy') {
        setConnectionStatus('connected');
        toast({
          title: "Supabase Connected",
          description: "Real-time SBT ecosystem is ready",
        });
      } else {
        setConnectionStatus('disconnected');
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      console.error('Supabase connection failed:', error);
    }
  };

  const loadUserData = async () => {
    try {
      // Load existing credentials
      const credResponse = await fetch('/api/sbt/credentials');
      if (credResponse.ok) {
        const credData = await credResponse.json();
        setCredentials(credData.credentials || []);
      }

      // Load reputation data
      const repResponse = await fetch('/api/reputation/score');
      if (repResponse.ok) {
        const repData = await repResponse.json();
        setReputationScore(repData.score?.totalScore || 0);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const checkAuthRequirements = async () => {
    try {
      const authResponse = await fetch('/api/sbt/auth-requirements');
      if (authResponse.ok) {
        const authData = await authResponse.json();
        setAuthStatus(authData.data);
      } else {
        // Fallback to basic user data check
        const userResponse = await fetch('/api/user');
        if (userResponse.ok) {
          const userData = await userResponse.json();
          setUserProfile(userData);
          
          const hasProfile = !!(userData.email && userData.username && userData.interests?.length > 0);
          const has2FA = !!(userData.phoneNumber || userData.telegramId);
          const hasWallet = !!(userData.connectedWallets && userData.connectedWallets.length > 0);
          const canCreateSBT = hasProfile && has2FA && hasWallet;
          
          setAuthStatus({
            hasProfile,
            has2FA,
            hasWallet,
            canCreateSBT
          });
        }
      }
    } catch (error) {
      console.error('Failed to check auth requirements:', error);
    }
  };

  const createRealtimeCredential = async () => {
    if (!authStatus.canCreateSBT) {
      toast({
        title: "Authentication Required",
        description: "Complete your profile, enable 2FA, and connect a wallet to create SBT credentials",
        variant: "destructive"
      });
      return;
    }
    if (!newCredential.type || !newCredential.title) {
      toast({
        title: "Missing Information",
        description: "Please fill in credential type and title",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/sbt/realtime/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCredential),
      });

      const data = await response.json();
      
      if (data.success) {
        setCredentials(prev => [...prev, data.data]);
        setNewCredential({ type: '', title: '', description: '', evidence: '' });
        
        toast({
          title: "Credential Created",
          description: "SBT credential registered with real-time sync",
        });

        // Simulate real-time reputation update
        setTimeout(() => {
          updateReputationRealtime('credential_created', 10, 'Created new SBT credential');
        }, 1000);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create credential",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const uploadCredentialEvidence = async () => {
    if (!selectedFile || !newCredential.type || !newCredential.title) {
      toast({
        title: "Missing Information",
        description: "Please select a file and fill in credential details",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', newCredential.type);
      formData.append('title', newCredential.title);
      formData.append('description', newCredential.description);

      const response = await fetch('/api/sbt/realtime/upload-evidence', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        setCredentials(prev => [...prev, data.data.credential]);
        setNewCredential({ type: '', title: '', description: '', evidence: '' });
        setSelectedFile(null);
        
        toast({
          title: "Evidence Uploaded",
          description: "Credential created with file evidence and real-time sync",
        });

        // Real-time reputation update
        setTimeout(() => {
          updateReputationRealtime('evidence_uploaded', 15, 'Uploaded credential evidence');
        }, 1000);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to upload evidence",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const updateReputationRealtime = async (activity: string, points: number, description: string) => {
    try {
      const response = await fetch('/api/reputation/realtime/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activity,
          points,
          description,
          metadata: { timestamp: new Date().toISOString() }
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setReputationScore(data.data.newTotalScore);
        setRecentActivity(prev => [{
          type: activity,
          points,
          description,
          timestamp: new Date().toISOString()
        }, ...prev.slice(0, 4)]);

        toast({
          title: "Reputation Updated",
          description: `+${points} points earned from ${description.toLowerCase()}`,
        });
      }
    } catch (error) {
      console.error('Failed to update reputation:', error);
    }
  };

  const verifyCredential = async (credentialId: number) => {
    try {
      const response = await fetch(`/api/sbt/realtime/${credentialId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'verified',
          verificationNotes: 'Automatically verified for demo'
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setCredentials(prev => 
          prev.map(cred => 
            cred.id === credentialId 
              ? { ...cred, status: 'verified' as const }
              : cred
          )
        );

        toast({
          title: "Credential Verified",
          description: "Real-time verification completed with reputation bonus",
        });
      }
    } catch (error) {
      console.error('Failed to verify credential:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected': return <Database className="h-4 w-4 text-green-500" />;
      case 'connecting': return <Clock className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'disconnected': return <Database className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Supabase-Enhanced SBT Ecosystem</h1>
          <p className="text-muted-foreground">Real-time Soulbound Token management with live updates</p>
        </div>
        <div className="flex items-center gap-2">
          {getConnectionIcon()}
          <span className="text-sm capitalize">{connectionStatus}</span>
        </div>
      </div>

      {/* Key Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-500" />
              <div>
                <p className="font-semibold">Real-time Sync</p>
                <p className="text-sm text-muted-foreground">Live updates</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-semibold">Secure Storage</p>
                <p className="text-sm text-muted-foreground">Encrypted evidence</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="font-semibold">Multi-user</p>
                <p className="text-sm text-muted-foreground">Collaborative</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-orange-500" />
              <div>
                <p className="font-semibold">Analytics</p>
                <p className="text-sm text-muted-foreground">Real-time metrics</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Authentication Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            SBT Authentication Requirements
          </CardTitle>
          <CardDescription>
            Complete these security requirements to create SBT credentials
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <div className={`w-3 h-3 rounded-full ${authStatus.hasProfile ? 'bg-green-500' : 'bg-red-500'}`} />
              <div>
                <p className="font-medium">Profile Complete</p>
                <p className="text-sm text-muted-foreground">Email, username, interests</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <div className={`w-3 h-3 rounded-full ${authStatus.has2FA ? 'bg-green-500' : 'bg-red-500'}`} />
              <div>
                <p className="font-medium">2FA Enabled</p>
                <p className="text-sm text-muted-foreground">Phone or Telegram</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <div className={`w-3 h-3 rounded-full ${authStatus.hasWallet ? 'bg-green-500' : 'bg-red-500'}`} />
              <div>
                <p className="font-medium">Wallet Connected</p>
                <p className="text-sm text-muted-foreground">Web3 wallet linked</p>
              </div>
            </div>
          </div>
          
          {!authStatus.canCreateSBT && (
            <div className="mt-4 p-4 border border-orange-200 bg-orange-50 rounded-lg">
              <p className="text-sm text-orange-700">
                <strong>Security Notice:</strong> Complete all authentication requirements above to create SBT credentials. 
                This ensures proper identity verification and credential integrity.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reputation Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Reputation Score
          </CardTitle>
          <CardDescription>Real-time reputation tracking with live updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{reputationScore} points</span>
              <Progress value={(reputationScore % 100)} className="w-32" />
            </div>
            
            {recentActivity.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Recent Activity</h4>
                <div className="space-y-2">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{activity.description}</span>
                      <Badge variant="secondary">+{activity.points}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="credentials" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="credentials">SBT Credentials</TabsTrigger>
          <TabsTrigger value="create">Create New</TabsTrigger>
        </TabsList>
        
        <TabsContent value="credentials">
          <Card>
            <CardHeader>
              <CardTitle>Your SBT Credentials</CardTitle>
              <CardDescription>Real-time synchronized soulbound tokens</CardDescription>
            </CardHeader>
            <CardContent>
              {credentials.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No credentials yet. Create your first SBT credential to get started.
                </p>
              ) : (
                <div className="space-y-4">
                  {credentials.map((credential) => (
                    <div key={credential.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{credential.title}</h3>
                            <Badge 
                              className={`${getStatusColor(credential.status)} text-white`}
                            >
                              {credential.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{credential.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Type: {credential.type} • Created: {new Date(credential.issuedAt).toLocaleDateString()}
                          </p>
                        </div>
                        
                        {credential.status === 'pending' && (
                          <Button 
                            size="sm" 
                            onClick={() => verifyCredential(credential.id)}
                          >
                            Verify
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="create">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create SBT Credential</CardTitle>
                <CardDescription>Register a new soulbound token with real-time sync</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Credential Type</Label>
                    <Input
                      id="type"
                      value={newCredential.type}
                      onChange={(e) => setNewCredential(prev => ({ ...prev, type: e.target.value }))}
                      placeholder="e.g., identity, professional, education"
                    />
                  </div>
                  <div>
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newCredential.title}
                      onChange={(e) => setNewCredential(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Software Engineer Certification"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newCredential.description}
                    onChange={(e) => setNewCredential(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description of the credential"
                  />
                </div>
                
                <div>
                  <Label htmlFor="evidence">Evidence (optional)</Label>
                  <Input
                    id="evidence"
                    value={newCredential.evidence}
                    onChange={(e) => setNewCredential(prev => ({ ...prev, evidence: e.target.value }))}
                    placeholder="URL or text evidence"
                  />
                </div>
                
                <Button 
                  onClick={createRealtimeCredential}
                  disabled={!authStatus.canCreateSBT || isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Creating...' : 
                   !authStatus.canCreateSBT ? 'Authentication Required' : 
                   'Create Credential'}
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Upload Evidence File
                </CardTitle>
                <CardDescription>Create credential with file evidence using Supabase Storage</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="file">Evidence File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                </div>
                
                <Button 
                  onClick={uploadCredentialEvidence} 
                  disabled={isLoading || !selectedFile}
                  className="w-full"
                >
                  {isLoading ? 'Uploading...' : 'Upload & Create Credential'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}