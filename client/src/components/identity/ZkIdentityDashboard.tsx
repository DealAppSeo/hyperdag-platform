import React, { useState } from 'react';
import { useIdentity } from '@/hooks/use-identity';
import { ZkIdentityManager } from './ZkIdentityManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Info, Lock, Shield, FileCheck, Key, Eye, EyeOff, Loader2, Network, Unlink, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Types for ZK proof and credentials
interface ZkProof {
  id: string;
  name: string;
  type: string;
  createdAt: Date;
  status: 'active' | 'expired' | 'revoked';
}

interface ZkCredential {
  id: string;
  name: string;
  type: string;
  issuer: string;
  createdAt: Date;
  isPublic: boolean;
}

export function ZkIdentityDashboard() {
  const {
    zkpIdentity,
    hasZkpIdentity,
    isLoadingIdentity,
    identityError,
    generateZkpIdentity,
    isGeneratingZkpIdentity,
    refreshIdentityStatus,
  } = useIdentity();

  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('identity');
  
  // Simulated credential data - this would come from an API in the real implementation
  const [credentials, setCredentials] = useState<ZkCredential[]>([
    {
      id: 'cred-1',
      name: 'Developer Role Verification',
      type: 'ROLE_VERIFICATION',
      issuer: 'HyperDAG',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      isPublic: true,
    },
    {
      id: 'cred-2',
      name: 'Reputation Score > 50',
      type: 'REPUTATION',
      issuer: 'RepID',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      isPublic: false,
    },
  ]);

  // Simulated proof data - this would come from an API in the real implementation
  const [proofs, setProofs] = useState<ZkProof[]>([
    {
      id: 'proof-1',
      name: 'Identity Proof',
      type: 'IDENTITY',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      status: 'active',
    },
    {
      id: 'proof-2',
      name: 'Reputation Range Proof',
      type: 'REPUTATION',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      status: 'active',
    },
  ]);

  // Toggle credential visibility
  const toggleCredentialVisibility = (credentialId: string) => {
    setCredentials(prevCredentials =>
      prevCredentials.map(credential =>
        credential.id === credentialId 
          ? { ...credential, isPublic: !credential.isPublic } 
          : credential
      )
    );

    toast({
      title: "Credential Visibility Updated",
      description: "Your credential visibility setting has been changed.",
    });
  };

  // Create a new proof
  const createProof = (type: string) => {
    // In a real implementation, this would call the API to create a proof
    const newProof: ZkProof = {
      id: `proof-${Date.now()}`,
      name: type === 'IDENTITY' ? 'Identity Proof' : 'Reputation Range Proof',
      type,
      createdAt: new Date(),
      status: 'active',
    };

    setProofs([newProof, ...proofs]);

    toast({
      title: "Proof Created",
      description: `Your ${type.toLowerCase()} proof has been created successfully.`,
    });
  };

  // Revoke a proof
  const revokeProof = (proofId: string) => {
    setProofs(prevProofs =>
      prevProofs.map(proof =>
        proof.id === proofId 
          ? { ...proof, status: 'revoked' as const } 
          : proof
      )
    );

    toast({
      title: "Proof Revoked",
      description: "The selected proof has been revoked successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Privacy-Preserving Identity</h1>
          <p className="text-muted-foreground">Manage your zero-knowledge identity, credentials, and proofs</p>
        </div>

        {hasZkpIdentity && (
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
              <Shield className="w-3.5 h-3.5 mr-1" />
              Active
            </Badge>
            <Button variant="outline" size="sm" onClick={refreshIdentityStatus}>
              Refresh
            </Button>
          </div>
        )}
      </div>

      {isLoadingIdentity ? (
        <div className="flex justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading identity information...</p>
          </div>
        </div>
      ) : identityError ? (
        <Alert variant="destructive">
          <AlertTitle>Error loading identity</AlertTitle>
          <AlertDescription>
            {identityError}
            <Button variant="outline" size="sm" className="mt-2" onClick={refreshIdentityStatus}>
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      ) : !hasZkpIdentity ? (
        <ZkIdentityManager />
      ) : (
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 md:w-[400px]">
            <TabsTrigger value="identity">Identity</TabsTrigger>
            <TabsTrigger value="credentials">Credentials</TabsTrigger>
            <TabsTrigger value="proofs">Proofs</TabsTrigger>
          </TabsList>
          
          {/* Identity Tab */}
          <TabsContent value="identity" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="mr-2 h-5 w-5" />
                  Zero-Knowledge Identity
                </CardTitle>
                <CardDescription>
                  Your privacy-preserving decentralized identity details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-muted-foreground">Identity ID</span>
                  <code className="p-2 bg-muted rounded text-sm">{zkpIdentity?.id || 'Unknown'}</code>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-muted-foreground">Commitment</span>
                  <code className="p-2 bg-muted rounded text-sm">{zkpIdentity?.commitment || 'Unknown'}</code>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-muted-foreground">Public Key</span>
                  <code className="p-2 bg-muted rounded text-sm">{zkpIdentity?.publicKey || 'Unknown'}</code>
                </div>
                
                <div className="flex flex-col space-y-1">
                  <span className="text-sm text-muted-foreground">Created</span>
                  <span>{zkpIdentity?.created ? new Date(zkpIdentity.created).toLocaleString() : 'Unknown'}</span>
                </div>

                <Alert className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertTitle>Privacy Protected</AlertTitle>
                  <AlertDescription>
                    Your identity uses zero-knowledge cryptography to protect your privacy. When you create proofs,
                    you can verify facts without revealing your actual data.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter className="border-t pt-4 flex flex-col space-y-4">
                <div className="w-full">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Identity Status</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400">
                      Active
                    </Badge>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-2 w-full">
                  <Button variant="outline" className="w-full">
                    <Wallet className="mr-2 h-4 w-4" />
                    Connect to Wallet
                  </Button>
                  
                  <Button variant="outline" className="w-full text-destructive hover:text-destructive">
                    <Unlink className="mr-2 h-4 w-4" />
                    Revoke Identity
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Credentials Tab */}
          <TabsContent value="credentials" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Your Privacy-Preserving Credentials</h2>
              <Button variant="outline" size="sm">
                <FileCheck className="mr-2 h-4 w-4" />
                Request Credential
              </Button>
            </div>
            
            {credentials.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">You don't have any credentials yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {credentials.map(credential => (
                  <Card key={credential.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{credential.name}</CardTitle>
                        <Badge variant={credential.isPublic ? "default" : "secondary"} className="text-xs">
                          {credential.isPublic ? 'Public' : 'Private'}
                        </Badge>
                      </div>
                      <CardDescription>{credential.type}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Issuer</span>
                          <span>{credential.issuer}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Issued</span>
                          <span>{credential.createdAt.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-3 flex justify-between">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleCredentialVisibility(credential.id)}
                      >
                        {credential.isPublic ? (
                          <>
                            <EyeOff className="mr-1 h-4 w-4" />
                            Make Private
                          </>
                        ) : (
                          <>
                            <Eye className="mr-1 h-4 w-4" />
                            Make Public
                          </>
                        )}
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => createProof(credential.type)}
                      >
                        <Key className="mr-1 h-4 w-4" />
                        Create Proof
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Proofs Tab */}
          <TabsContent value="proofs" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Zero-Knowledge Proofs</h2>
              <div className="space-x-2">
                <Button size="sm" variant="outline" onClick={() => createProof('IDENTITY')}>
                  <Shield className="mr-2 h-4 w-4" />
                  Identity Proof
                </Button>
                <Button size="sm" variant="outline" onClick={() => createProof('REPUTATION')}>
                  <Network className="mr-2 h-4 w-4" />
                  Reputation Proof
                </Button>
              </div>
            </div>
            
            {proofs.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <p className="text-muted-foreground">You haven't created any proofs yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {proofs.map(proof => (
                  <Card key={proof.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-base">{proof.name}</CardTitle>
                        <Badge 
                          variant={proof.status === 'active' ? "default" : 
                                 proof.status === 'expired' ? "outline" : "destructive"}
                          className="text-xs"
                        >
                          {proof.status.charAt(0).toUpperCase() + proof.status.slice(1)}
                        </Badge>
                      </div>
                      <CardDescription>{proof.type}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">ID</span>
                          <code className="bg-muted px-1 rounded">{proof.id}</code>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Created</span>
                          <span>{proof.createdAt.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Expires</span>
                          <span>
                            {new Date(proof.createdAt.getTime() + 24 * 60 * 60 * 1000).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-3 flex justify-between">
                      <Button 
                        variant="ghost" 
                        size="sm"
                      >
                        <Eye className="mr-1 h-4 w-4" />
                        View Details
                      </Button>
                      
                      {proof.status === 'active' && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => revokeProof(proof.id)}
                        >
                          <Unlink className="mr-1 h-4 w-4" />
                          Revoke
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
