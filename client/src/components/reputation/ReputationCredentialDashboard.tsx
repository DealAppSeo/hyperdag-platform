import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, Award, Clock, Check, X, Shield, Lock, Eye, EyeOff, ArrowRight, FileCheck, FileX } from "lucide-react";
import { apiRequest, getQueryFn, queryClient } from "@/lib/queryClient"; 
import { toast } from "@/hooks/use-toast";

interface Credential {
  id: number;
  userId: number;
  type: string;
  name: string;
  issuer?: string;
  issuedDate: string;
  expiryDate?: string;
  credential: string;
  isVerified: boolean;
  isPublic: boolean;
  attributes?: { [key: string]: any };
  createdAt: string;
}

interface Proof {
  id: string;
  type: string;
  status: 'pending' | 'verified' | 'invalid' | 'expired';
  createdAt: string;
  expiresAt?: string;
  credentialId?: number;
  publicInputs: {
    minScore?: number;
    maxScore?: number;
    attributes?: string[];
    [key: string]: any;
  };
}

export function ReputationCredentialDashboard({ userId }: { userId: number }) {
  const [selectedCredential, setSelectedCredential] = useState<Credential | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('active');
  
  // Fetch credentials
  const { data: credentials, isLoading: loadingCredentials } = useQuery<Credential[]>({
    queryKey: ['/api/reputation/credentials'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Fetch proofs
  const { data: proofs, isLoading: loadingProofs } = useQuery<Proof[]>({
    queryKey: ['/api/reputation/zkp/proofs'],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Mutation to toggle credential public/private status
  const toggleVisibilityMutation = useMutation({
    mutationFn: async ({ id, isPublic }: { id: number, isPublic: boolean }) => {
      const response = await apiRequest('PATCH', `/api/reputation/credential/${id}/visibility`, {
        isPublic: !isPublic
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reputation/credentials'] });
      toast({
        title: "Visibility updated",
        description: "Credential visibility has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating visibility",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation to revoke a proof
  const revokeProofMutation = useMutation({
    mutationFn: async (proofId: string) => {
      const response = await apiRequest('POST', `/api/reputation/zkp/revoke-proof`, {
        proofId
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reputation/zkp/proofs'] });
      toast({
        title: "Proof revoked",
        description: "The zero-knowledge proof has been revoked successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error revoking proof",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation to verify a credential
  const verifyCredentialMutation = useMutation({
    mutationFn: async (credentialId: number) => {
      const response = await apiRequest('POST', `/api/reputation/credential/${credentialId}/verify`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/reputation/credentials'] });
      toast({
        title: "Credential verified",
        description: "The credential has been verified successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error verifying credential",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Display credential details
  const showCredentialDetails = (credential: Credential) => {
    setSelectedCredential(credential);
    setOpenDialog(true);
  };
  
  // Handle toggling credential visibility
  const handleToggleVisibility = (id: number, isPublic: boolean) => {
    toggleVisibilityMutation.mutate({ id, isPublic });
  };
  
  // Handle revoking a proof
  const handleRevokeProof = (proofId: string) => {
    if (confirm('Are you sure you want to revoke this proof? This action cannot be undone.')) {
      revokeProofMutation.mutate(proofId);
    }
  };
  
  // Handle verifying a credential
  const handleVerifyCredential = (credentialId: number) => {
    verifyCredentialMutation.mutate(credentialId);
  };
  
  // Filter proofs based on active tab
  const filteredProofs = proofs?.filter(proof => {
    if (activeTab === 'active') {
      return proof.status === 'verified' || proof.status === 'pending';
    } else if (activeTab === 'expired') {
      return proof.status === 'expired';
    } else {
      return proof.status === 'invalid';
    }
  });
  
  // Format date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };
  
  if (loadingCredentials || loadingProofs) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Credential Dashboard</CardTitle>
          <CardDescription>Your verified credentials and ZKP status</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Credential Dashboard
        </CardTitle>
        <CardDescription>Manage your verified credentials and zero-knowledge proofs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4 text-blue-600" />
                Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-3xl font-bold">{credentials?.length || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                Active Proofs
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-3xl font-bold">
                {proofs?.filter(p => p.status === 'verified').length || 0}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="h-4 w-4 text-purple-600" />
                Privacy Score
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="text-3xl font-bold">
                {credentials && credentials.length > 0
                  ? Math.round((credentials.filter(c => !c.isPublic).length / credentials.length) * 100)
                  : 0}%
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Credentials Table */}
        <div>
          <h3 className="text-lg font-medium mb-4">Your Credentials</h3>
          {credentials && credentials.length > 0 ? (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Credential</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Issued</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {credentials.map((credential) => (
                    <TableRow key={credential.id}>
                      <TableCell className="font-medium">{credential.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{credential.type}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(credential.issuedDate)}</TableCell>
                      <TableCell>
                        {credential.isVerified ? (
                          <Badge className="bg-green-100 text-green-800">Verified</Badge>
                        ) : (
                          <Badge variant="outline">Unverified</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {credential.isPublic ? (
                          <Badge className="bg-blue-100 text-blue-800">Public</Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800">Private</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleVisibility(credential.id, credential.isPublic)}
                          >
                            {credential.isPublic ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => showCredentialDetails(credential)}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                          {!credential.isVerified && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleVerifyCredential(credential.id)}
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <Alert variant="default">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No credentials found</AlertTitle>
              <AlertDescription>
                You haven't earned any credentials yet. Participate in platform activities to earn them.
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        {/* ZK Proofs */}
        <div>
          <h3 className="text-lg font-medium mb-4">Zero-Knowledge Proofs</h3>
          <Tabs defaultValue="active" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="expired">Expired</TabsTrigger>
              <TabsTrigger value="invalid">Invalid</TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-0">
              {filteredProofs && filteredProofs.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Expires</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProofs.map((proof) => (
                        <TableRow key={proof.id}>
                          <TableCell className="font-medium">{proof.type}</TableCell>
                          <TableCell>{formatDate(proof.createdAt)}</TableCell>
                          <TableCell>{formatDate(proof.expiresAt)}</TableCell>
                          <TableCell>
                            {proof.status === 'verified' && (
                              <Badge className="bg-green-100 text-green-800">Verified</Badge>
                            )}
                            {proof.status === 'pending' && (
                              <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                            )}
                            {proof.status === 'invalid' && (
                              <Badge className="bg-red-100 text-red-800">Invalid</Badge>
                            )}
                            {proof.status === 'expired' && (
                              <Badge className="bg-gray-100 text-gray-800">Expired</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRevokeProof(proof.id)}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Alert variant="default">
                  <Clock className="h-4 w-4" />
                  <AlertTitle>No {activeTab} proofs</AlertTitle>
                  <AlertDescription>
                    {activeTab === 'active'
                      ? "You don't have any active zero-knowledge proofs."
                      : activeTab === 'expired'
                      ? "You don't have any expired proofs."
                      : "You don't have any invalid proofs."}
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
            
            <TabsContent value="expired" className="mt-0">
              {filteredProofs && filteredProofs.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Expired</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProofs.map((proof) => (
                        <TableRow key={proof.id}>
                          <TableCell className="font-medium">{proof.type}</TableCell>
                          <TableCell>{formatDate(proof.createdAt)}</TableCell>
                          <TableCell>{formatDate(proof.expiresAt)}</TableCell>
                          <TableCell>
                            <Badge className="bg-gray-100 text-gray-800">Expired</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRevokeProof(proof.id)}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Alert variant="default">
                  <Clock className="h-4 w-4" />
                  <AlertTitle>No expired proofs</AlertTitle>
                  <AlertDescription>
                    You don't have any expired zero-knowledge proofs.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
            
            <TabsContent value="invalid" className="mt-0">
              {filteredProofs && filteredProofs.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProofs.map((proof) => (
                        <TableRow key={proof.id}>
                          <TableCell className="font-medium">{proof.type}</TableCell>
                          <TableCell>{formatDate(proof.createdAt)}</TableCell>
                          <TableCell>
                            <Badge className="bg-red-100 text-red-800">Invalid</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRevokeProof(proof.id)}
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <Alert variant="default">
                  <FileX className="h-4 w-4" />
                  <AlertTitle>No invalid proofs</AlertTitle>
                  <AlertDescription>
                    You don't have any invalid zero-knowledge proofs.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button 
          onClick={() => window.location.href = '/generate-proof'}
          className="flex items-center gap-1"
        >
          <Lock className="h-4 w-4 mr-1" />
          Generate New Proof
        </Button>
      </CardFooter>
      
      {/* Credential Details Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Credential Details</DialogTitle>
            <DialogDescription>
              View the details of this credential
            </DialogDescription>
          </DialogHeader>
          
          {selectedCredential && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-start border-b pb-3">
                <div>
                  <h4 className="font-semibold">{selectedCredential.name}</h4>
                  <Badge variant="outline" className="mt-1">{selectedCredential.type}</Badge>
                </div>
                {selectedCredential.isVerified ? (
                  <Badge className="bg-green-100 text-green-800">Verified</Badge>
                ) : (
                  <Badge variant="outline">Unverified</Badge>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Issuer</div>
                  <div>{selectedCredential.issuer || 'Self-issued'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Issued Date</div>
                  <div>{formatDate(selectedCredential.issuedDate)}</div>
                </div>
                {selectedCredential.expiryDate && (
                  <div>
                    <div className="text-sm text-muted-foreground">Expiry Date</div>
                    <div>{formatDate(selectedCredential.expiryDate)}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-muted-foreground">Visibility</div>
                  <div>{selectedCredential.isPublic ? 'Public' : 'Private'}</div>
                </div>
              </div>
              
              {selectedCredential.attributes && Object.keys(selectedCredential.attributes).length > 0 && (
                <div className="border-t pt-3">
                  <h4 className="font-semibold mb-2">Attributes</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(selectedCredential.attributes).map(([key, value]) => (
                      <div key={key} className="bg-gray-50 p-2 rounded-md">
                        <div className="text-xs text-muted-foreground uppercase">{key}</div>
                        <div className="font-medium">{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end pt-2">
                <Button 
                  variant="outline"
                  onClick={() => handleToggleVisibility(selectedCredential.id, selectedCredential.isPublic)}
                  className="flex items-center gap-1"
                >
                  {selectedCredential.isPublic ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" />
                      Make Private
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Make Public
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}