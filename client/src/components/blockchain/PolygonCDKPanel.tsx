import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle, Server, Clock, Upload } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface CDKConfig {
  rollupType: string;
  dataAvailabilityLayer: string;
  validationMechanism: string;
  isEVMCompatible: boolean;
  blockTime: number;
  finalizationTime: number;
}

interface CDKStatus {
  isConfigured: boolean;
  addresses: {
    integration: string | null;
    validator: string | null;
    connector: string | null;
    deployment: string | null;
  };
}

interface Deployment {
  id: string;
  projectId: number;
  status: 'pending' | 'deployed' | 'failed';
  deploymentAddress: string | null;
  txHash: string | null;
  deploymentOptions: any;
  createdAt: string;
  updatedAt: string;
}

export default function PolygonCDKPanel() {
  const [deployDialogOpen, setDeployDialogOpen] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [deploymentOptions, setDeploymentOptions] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query for getting CDK status
  const { data: cdkStatus, isLoading: isLoadingStatus } = useQuery<{success: boolean, data: CDKStatus}>({
    queryKey: ["/api/polygon-cdk/status"],
  });

  // Query for getting CDK configuration
  const { data: cdkConfig, isLoading: isLoadingConfig } = useQuery<{success: boolean, data: CDKConfig}>({
    queryKey: ["/api/polygon-cdk/config"],
    enabled: cdkStatus?.data.isConfigured === true,
  });

  // Query for getting deployments
  const { data: deployments, isLoading: isLoadingDeployments } = useQuery<{success: boolean, data: Deployment[]}>({ 
    queryKey: ["/api/polygon-cdk/deployments"],
  });

  // Mutation for deploying to Polygon CDK
  const deployMutation = useMutation({
    mutationFn: async (data: { projectId: number, deploymentOptions?: Record<string, any> }) => {
      const response = await apiRequest("POST", "/api/polygon-cdk/deploy", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Deployment initiated",
        description: "Your project is being deployed to Polygon CDK",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/polygon-cdk/deployments"] });
      setDeployDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Deployment failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeploy = () => {
    const parsedProjectId = parseInt(projectId);
    if (isNaN(parsedProjectId)) {
      toast({
        title: "Invalid project ID",
        description: "Please enter a valid project ID",
        variant: "destructive",
      });
      return;
    }

    let options = {};
    try {
      if (deploymentOptions) {
        options = JSON.parse(deploymentOptions);
      }
    } catch (error) {
      toast({
        title: "Invalid options format",
        description: "Options must be valid JSON",
        variant: "destructive",
      });
      return;
    }

    deployMutation.mutate({ projectId: parsedProjectId, deploymentOptions: options });
  };

  // Helper function to truncate addresses
  const truncateAddress = (address: string | null) => {
    if (!address) return "Not deployed";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Polygon CDK Integration</CardTitle>
              <CardDescription>Chain Development Kit Status</CardDescription>
            </div>
            <Badge variant={cdkStatus?.data.isConfigured ? "success" : "outline"}>
              {cdkStatus?.data.isConfigured ? "Connected" : "Not Configured"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingStatus ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">CDK Contract Addresses</h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-xs text-muted-foreground mb-1">Integration Contract</p>
                      <p className="font-mono text-xs truncate">{cdkStatus?.data.addresses.integration || "Not deployed"}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-xs text-muted-foreground mb-1">Validator Contract</p>
                      <p className="font-mono text-xs truncate">{cdkStatus?.data.addresses.validator || "Not deployed"}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-xs text-muted-foreground mb-1">Avail Connector</p>
                      <p className="font-mono text-xs truncate">{cdkStatus?.data.addresses.connector || "Not deployed"}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-md">
                      <p className="text-xs text-muted-foreground mb-1">Deployment Contract</p>
                      <p className="font-mono text-xs truncate">{cdkStatus?.data.addresses.deployment || "Not deployed"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {cdkStatus?.data.isConfigured && (
                <div>
                  <h3 className="text-sm font-medium mb-2">CDK Configuration</h3>
                  {isLoadingConfig ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-xs text-muted-foreground mb-1">Rollup Type</p>
                          <p className="font-medium">{cdkConfig?.data.rollupType}</p>
                        </div>
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-xs text-muted-foreground mb-1">Data Availability</p>
                          <p className="font-medium">{cdkConfig?.data.dataAvailabilityLayer}</p>
                        </div>
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-xs text-muted-foreground mb-1">Validation Mechanism</p>
                          <p className="font-medium">{cdkConfig?.data.validationMechanism}</p>
                        </div>
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-xs text-muted-foreground mb-1">EVM Compatible</p>
                          <p className="font-medium">{cdkConfig?.data.isEVMCompatible ? "Yes" : "No"}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" size="sm">
            <Server className="mr-2 h-4 w-4" /> Check Network Status
          </Button>
          <Dialog open={deployDialogOpen} onOpenChange={setDeployDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Upload className="mr-2 h-4 w-4" /> Deploy Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Deploy to Polygon CDK</DialogTitle>
                <DialogDescription>
                  Deploy your project to the Polygon CDK network for improved scalability and performance.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="projectId">Project ID</Label>
                  <Input
                    id="projectId"
                    placeholder="Enter project ID"
                    value={projectId}
                    onChange={(e) => setProjectId(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="options">Deployment Options (JSON)</Label>
                  <Input
                    id="options"
                    placeholder='{"optimize": true}'
                    value={deploymentOptions}
                    onChange={(e) => setDeploymentOptions(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeployDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleDeploy} disabled={deployMutation.isPending}>
                  {deployMutation.isPending ? "Deploying..." : "Deploy"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deployments</CardTitle>
          <CardDescription>Recent deployments to Polygon CDK</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingDeployments ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : !deployments?.data || deployments.data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Server className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No deployments yet</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-2">
                Deploy your first project to Polygon CDK to see it listed here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {deployments.data.map((deployment) => (
                <div key={deployment.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      {deployment.status === 'deployed' && (
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                      )}
                      {deployment.status === 'pending' && (
                        <Clock className="h-5 w-5 text-amber-500 mr-2" />
                      )}
                      {deployment.status === 'failed' && (
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <span className="font-medium">Project ID: {deployment.projectId}</span>
                    </div>
                    <Badge variant={deployment.status === 'deployed' ? 'success' : deployment.status === 'pending' ? 'outline' : 'destructive'}>
                      {deployment.status.charAt(0).toUpperCase() + deployment.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground mb-1">Deployment ID</p>
                      <p className="font-mono text-xs">{deployment.id}</p>
                    </div>
                    {deployment.deploymentAddress && (
                      <div>
                        <p className="text-muted-foreground mb-1">Contract Address</p>
                        <p className="font-mono text-xs">{truncateAddress(deployment.deploymentAddress)}</p>
                      </div>
                    )}
                    {deployment.txHash && (
                      <div>
                        <p className="text-muted-foreground mb-1">Transaction Hash</p>
                        <p className="font-mono text-xs">{truncateAddress(deployment.txHash)}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground mb-1">Created At</p>
                      <p>{new Date(deployment.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}