import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, FileText, DollarSign, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SBTCredential {
  id: number;
  type: string;
  title: string;
  description: string;
  encryptedDataHash: string;
  ipfsHash: string;
  issuedAt: string;
  expiresAt?: string;
  issuer: string;
  isRevoked: boolean;
  isMonetizable: boolean;
  pricePerAccess?: number;
  maxAccesses?: number;
  accessCount: number;
  contractAddress: string;
  chainId: number;
}

const credentialTypeConfig = {
  identity: { icon: Shield, label: 'Identity', color: 'bg-blue-500' },
  financial: { icon: DollarSign, label: 'Financial', color: 'bg-green-500' },
  health: { icon: FileText, label: 'Health', color: 'bg-red-500' },
  digital: { icon: FileText, label: 'Digital', color: 'bg-purple-500' },
  professional: { icon: FileText, label: 'Professional', color: 'bg-orange-500' },
  social: { icon: FileText, label: 'Social', color: 'bg-pink-500' }
};

export default function SBTCredentials() {
  const queryClient = useQueryClient();

  // Fetch user's SBT credentials
  const { data: credentialsResponse, isLoading } = useQuery({
    queryKey: ['/api/sbt/credentials'],
    retry: false
  });

  const credentials = credentialsResponse?.credentials || [];

  // Test mutation to create sample credentials
  const createSampleMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/sbt/test/create-sample', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sbt/credentials'] });
      toast({
        title: 'Success',
        description: 'Sample credentials created successfully'
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create sample credentials',
        variant: 'destructive'
      });
    }
  });

  const CredentialCard = ({ credential }: { credential: SBTCredential }) => {
    const config = credentialTypeConfig[credential.type as keyof typeof credentialTypeConfig] || credentialTypeConfig.digital;
    const Icon = config.icon;

    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${config.color} text-white`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <CardTitle className="text-sm">{credential.title}</CardTitle>
                <CardDescription className="text-xs">{config.label}</CardDescription>
              </div>
            </div>
            <div className="flex gap-1">
              {credential.isMonetizable && (
                <Badge variant="secondary" className="text-xs">
                  <DollarSign className="w-3 h-3 mr-1" />
                  Monetized
                </Badge>
              )}
              {credential.isRevoked && (
                <Badge variant="destructive" className="text-xs">Revoked</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground mb-2">{credential.description}</p>
          <div className="flex justify-between items-center text-xs text-muted-foreground">
            <span>Issued: {new Date(credential.issuedAt).toLocaleDateString()}</span>
            <span>Accesses: {credential.accessCount}</span>
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            <div>Issuer: {credential.issuer}</div>
            <div>Contract: {credential.contractAddress.slice(0, 10)}...</div>
            {credential.isMonetizable && (
              <div>Price: {credential.pricePerAccess} ETH</div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">SBT Credentials</h1>
          <p className="text-muted-foreground">Manage your Soulbound Token credentials and data monetization</p>
        </div>
        
        <Button 
          onClick={() => createSampleMutation.mutate()}
          disabled={createSampleMutation.isPending}
          variant="outline"
        >
          {createSampleMutation.isPending ? 'Creating...' : 'Test: Create Samples'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Credentials</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{credentials?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Monetized</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {credentials?.filter((c: any) => c.isMonetizable).length || 0}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Accesses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {credentials?.reduce((sum: number, c: any) => sum + c.accessCount, 0) || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {credentials?.length > 0 ? (
          credentials.map((credential: any) => (
            <CredentialCard key={credential.id} credential={credential} />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No credentials yet</h3>
            <p className="text-muted-foreground mb-4">
              Create sample credentials to test the SBT system
            </p>
            <Button 
              onClick={() => createSampleMutation.mutate()}
              disabled={createSampleMutation.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              {createSampleMutation.isPending ? 'Creating...' : 'Create Sample Credentials'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}