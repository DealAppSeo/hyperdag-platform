import React from 'react';
import { useIdentity } from '@/hooks/use-identity';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lock, Shield, Key, FileCheck, Loader2, Check, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function ZkIdentityManager() {
  const {
    zkpIdentity,
    hasZkpIdentity,
    isLoadingIdentity,
    identityError,
    generateZkpIdentity,
    isGeneratingZkpIdentity,
  } = useIdentity();
  
  const { user, isLoading: isLoadingAuth } = useAuth();

  // Handle identity generation
  const handleGenerateIdentity = async () => {
    if (!user) {
      return; // Don't attempt to generate if not authenticated
    }
    
    try {
      await generateZkpIdentity();
    } catch (error) {
      console.error('Failed to generate ZKP identity:', error);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2 h-5 w-5" />
          Zero-Knowledge Identity
        </CardTitle>
        <CardDescription>
          Your privacy-preserving decentralized identity on HyperDAG
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isLoadingIdentity || isLoadingAuth ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : hasZkpIdentity ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-500" />
              <span className="font-medium">ZKP Identity Active</span>
              <Badge variant="outline" className="ml-auto">
                <span className="text-xs font-mono">
                  {zkpIdentity?.commitment || 'Unknown'}
                </span>
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="bg-muted/40 p-3 rounded-lg">
                <div className="flex items-center mb-2">
                  <Key className="h-4 w-4 mr-2 text-primary/70" />
                  <h3 className="text-sm font-medium">Created</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {zkpIdentity?.created
                    ? new Date(zkpIdentity.created).toLocaleString()
                    : 'Unknown'}
                </p>
              </div>

              <div className="bg-muted/40 p-3 rounded-lg">
                <div className="flex items-center mb-2">
                  <FileCheck className="h-4 w-4 mr-2 text-primary/70" />
                  <h3 className="text-sm font-medium">Credentials</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  0 credentials issued
                </p>
              </div>
            </div>

            <Alert>
              <AlertTitle className="flex items-center">
                <Lock className="h-4 w-4 mr-2" />
                Privacy Protected
              </AlertTitle>
              <AlertDescription>
                Your ZKP identity allows you to prove facts about yourself without revealing your
                actual data. No personal information is stored on-chain.
              </AlertDescription>
            </Alert>
          </div>
        ) : !user ? (
          <div className="space-y-4">
            <Alert>
              <AlertTitle className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                Authentication Required
              </AlertTitle>
              <AlertDescription>
                You need to be logged in to create a Zero-Knowledge identity. 
                Please sign in or create an account to access privacy-preserving features.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTitle>No ZKP Identity Found</AlertTitle>
              <AlertDescription>
                You don't have a Zero-Knowledge Proof identity yet. Generate one to access
                privacy-preserving features on HyperDAG.
              </AlertDescription>
            </Alert>

            <div className="flex justify-center">
              <Button
                onClick={handleGenerateIdentity}
                disabled={isGeneratingZkpIdentity || !user}
                className="mt-2"
              >
                {isGeneratingZkpIdentity ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Generate ZKP Identity
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {hasZkpIdentity && (
        <CardFooter className="border-t pt-4">
          <div className="flex flex-col w-full space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Identity Status</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400">
                Active
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Privacy Level</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400">
                Maximum
              </Badge>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
