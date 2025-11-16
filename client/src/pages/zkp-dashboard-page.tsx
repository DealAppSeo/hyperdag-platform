import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertTriangle,
  Check,
  Info,
  Shield,
  ShieldCheck,
  Loader2,
  RefreshCw,
  Fingerprint,
  Award,
  FileCheck,
  Hexagon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { queryClient } from '@/lib/queryClient';

// Define interface for ZKP status
interface ZKPStatus {
  mode: 'available' | 'degraded' | 'limited' | 'unavailable';
  providers: {
    mina: boolean;
    polygon: boolean;
    circom: boolean;
  };
  primaryProvider: string | null;
  providerAllocation: {
    identity: string | null;
    reputation: string | null;
    credentials: string | null;
    generic: string | null;
  };
  lastUpdated: string;
}

// Define form schemas
const proofGenerationSchema = z.object({
  circuitType: z.enum(['identity', 'reputation', 'credentials', 'generic']),
  privateInput: z.string().min(1, { message: 'Private input is required' }),
  publicInput: z.string().min(1, { message: 'Public input is required' }),
});

const proofVerificationSchema = z.object({
  circuitType: z.enum(['identity', 'reputation', 'credentials', 'generic']),
  proof: z.string().min(1, { message: 'Proof is required' }),
  publicInput: z.string().min(1, { message: 'Public input is required' }),
});

const ZKPDashboardPage = () => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [generatedProof, setGeneratedProof] = useState<string | null>(null);
  const [proofProvider, setProofProvider] = useState<string | null>(null);

  // Fetch ZKP status (NO POLLING - use manual refresh button)
  const {
    data: zkpStatus,
    isLoading: isStatusLoading,
    isError: isStatusError,
    error: statusError,
    refetch: refetchStatus
  } = useQuery({
    queryKey: ['/api/zkp/status'],
    refetchInterval: false // ❌ NO POLLING - eliminated 1 req/min
  });

  // Refresh ZKP status mutation
  const refreshStatusMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/zkp/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to refresh ZKP status');
      }
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/zkp/status'] });
      toast({
        title: 'ZKP Status Refreshed',
        description: 'Provider status has been updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Refresh Failed',
        description: `${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Generate proof mutation
  const generateProofMutation = useMutation({
    mutationFn: async (data: z.infer<typeof proofGenerationSchema>) => {
      const response = await fetch('/api/zkp/generate-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate proof');
      }
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Proof Generated',
        description: 'Zero-knowledge proof has been generated successfully.',
      });
      setGeneratedProof(data.data.proof);
      setProofProvider(data.data.provider);
    },
    onError: (error) => {
      toast({
        title: 'Generation Failed',
        description: `${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Verify proof mutation
  const verifyProofMutation = useMutation({
    mutationFn: async (data: z.infer<typeof proofVerificationSchema>) => {
      const response = await fetch('/api/zkp/verify-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify proof');
      }
      return await response.json();
    },
    onSuccess: (data) => {
      if (data.data.isValid) {
        toast({
          title: 'Proof Verified',
          description: 'The zero-knowledge proof is valid.',
        });
      } else {
        toast({
          title: 'Invalid Proof',
          description: 'The zero-knowledge proof is invalid.',
          variant: 'destructive',
        });
      }
    },
    onError: (error) => {
      toast({
        title: 'Verification Failed',
        description: `${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Setup forms
  const generateProofForm = useForm<z.infer<typeof proofGenerationSchema>>({
    resolver: zodResolver(proofGenerationSchema),
    defaultValues: {
      circuitType: 'identity',
      privateInput: '',
      publicInput: '',
    },
  });

  const verifyProofForm = useForm<z.infer<typeof proofVerificationSchema>>({
    resolver: zodResolver(proofVerificationSchema),
    defaultValues: {
      circuitType: 'identity',
      proof: '',
      publicInput: '',
    },
  });

  // Form submit handlers
  const onGenerateProofSubmit = (values: z.infer<typeof proofGenerationSchema>) => {
    generateProofMutation.mutate(values);
  };

  const onVerifyProofSubmit = (values: z.infer<typeof proofVerificationSchema>) => {
    verifyProofMutation.mutate(values);
  };

  // Status helpers and UI elements
  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'degraded':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'limited':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'unavailable':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'available':
        return <Check className="h-4 w-4" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4" />;
      case 'limited':
        return <AlertTriangle className="h-4 w-4" />;
      case 'unavailable':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getProviderIcon = (providerType: string) => {
    switch (providerType) {
      case 'mina':
        return <Hexagon className="h-5 w-5 text-blue-600" />;
      case 'polygon':
        return <Shield className="h-5 w-5 text-purple-600" />;
      case 'circom':
        return <ShieldCheck className="h-5 w-5 text-green-600" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getCircuitIcon = (circuitType: string) => {
    switch (circuitType) {
      case 'identity':
        return <Fingerprint className="h-5 w-5 text-blue-600" />;
      case 'reputation':
        return <Award className="h-5 w-5 text-purple-600" />;
      case 'credentials':
        return <FileCheck className="h-5 w-5 text-green-600" />;
      case 'generic':
        return <Shield className="h-5 w-5 text-gray-600" />;
      default:
        return null;
    }
  };

  if (isStatusLoading) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isStatusError) {
    return (
      <div className="w-full p-6 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error Loading ZKP Status</h2>
        <p className="text-gray-600 mb-4">
          {statusError instanceof Error ? statusError.message : 'An unknown error occurred'}
        </p>
        <Button
          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/zkp/status'] })}
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    );
  }

  // Extract status from data
  const status: ZKPStatus = zkpStatus?.data;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Zero-Knowledge Proof Dashboard</h1>
          <p className="text-gray-600">
            Manage and monitor zero-knowledge proof operations with multiple providers
          </p>
        </div>
        <Button
          onClick={() => refreshStatusMutation.mutate()}
          variant="outline"
          className="mt-4 md:mt-0"
          disabled={refreshStatusMutation.isPending}
        >
          {refreshStatusMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh Status
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="generate">Generate Proof</TabsTrigger>
          <TabsTrigger value="verify">Verify Proof</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* System Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-6 w-6 mr-2 text-primary" />
                System Status
              </CardTitle>
              <CardDescription>
                Current status of the ZKP system and provider availability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between border p-4 rounded-lg">
                  <div className="flex items-center">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        status.mode === 'available'
                          ? 'bg-green-100'
                          : status.mode === 'degraded'
                          ? 'bg-yellow-100'
                          : status.mode === 'limited'
                          ? 'bg-orange-100'
                          : 'bg-red-100'
                      }`}
                    >
                      {getModeIcon(status.mode)}
                    </div>
                    <div className="ml-4">
                      <h3 className="text-lg font-medium">Service Mode</h3>
                      <p className="text-sm text-gray-500">
                        Last updated: {new Date(status.lastUpdated).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Badge className={`ml-auto ${getModeColor(status.mode)}`}>
                    {status.mode.charAt(0).toUpperCase() + status.mode.slice(1)}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Provider Cards */}
                  <Card className="border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <Hexagon className="h-5 w-5 mr-2 text-blue-600" />
                        Mina Protocol
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center mt-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            status.providers.mina ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        ></div>
                        <span className="text-sm ml-2">
                          {status.providers.mina ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {status.primaryProvider === 'mina' ? 'Primary Provider' : ''}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <Shield className="h-5 w-5 mr-2 text-purple-600" />
                        Polygon zkEVM
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center mt-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            status.providers.polygon ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        ></div>
                        <span className="text-sm ml-2">
                          {status.providers.polygon ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {status.primaryProvider === 'polygon' ? 'Primary Provider' : ''}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <ShieldCheck className="h-5 w-5 mr-2 text-green-600" />
                        Circom
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center mt-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            status.providers.circom ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        ></div>
                        <span className="text-sm ml-2">
                          {status.providers.circom ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {status.primaryProvider === 'circom' ? 'Primary Provider' : ''}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Circuit Allocation */}
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-4">Circuit Type Allocation</h3>
                  <div className="space-y-4">
                    {Object.entries(status.providerAllocation).map(([circuit, provider]) => (
                      <div key={circuit} className="flex items-center border p-3 rounded-lg">
                        <div className="flex items-center">
                          {getCircuitIcon(circuit)}
                          <h4 className="ml-2 font-medium capitalize">{circuit}</h4>
                        </div>
                        <div className="ml-auto flex items-center">
                          {provider ? (
                            <>
                              {getProviderIcon(provider)}
                              <span className="ml-2 capitalize">{provider}</span>
                            </>
                          ) : (
                            <span className="text-gray-400">No provider available</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Zero-Knowledge Proof</CardTitle>
              <CardDescription>
                Create a cryptographic proof without revealing sensitive information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...generateProofForm}>
                <form
                  onSubmit={generateProofForm.handleSubmit(onGenerateProofSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={generateProofForm.control}
                    name="circuitType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Circuit Type</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <Button
                            type="button"
                            variant={field.value === 'identity' ? 'default' : 'outline'}
                            className="justify-start"
                            onClick={() => field.onChange('identity')}
                          >
                            <Fingerprint className="h-4 w-4 mr-2" />
                            Identity
                          </Button>
                          <Button
                            type="button"
                            variant={field.value === 'reputation' ? 'default' : 'outline'}
                            className="justify-start"
                            onClick={() => field.onChange('reputation')}
                          >
                            <Award className="h-4 w-4 mr-2" />
                            Reputation
                          </Button>
                          <Button
                            type="button"
                            variant={field.value === 'credentials' ? 'default' : 'outline'}
                            className="justify-start"
                            onClick={() => field.onChange('credentials')}
                          >
                            <FileCheck className="h-4 w-4 mr-2" />
                            Credentials
                          </Button>
                          <Button
                            type="button"
                            variant={field.value === 'generic' ? 'default' : 'outline'}
                            className="justify-start"
                            onClick={() => field.onChange('generic')}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Generic
                          </Button>
                        </div>
                        <FormDescription>
                          Select the type of proof you want to generate
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={generateProofForm.control}
                    name="privateInput"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Private Input</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter private data (this data will never leave your device)"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          This information is never revealed to anyone
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={generateProofForm.control}
                    name="publicInput"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Public Input</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter public data that will be part of the proof verification"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Public parameters that will be visible to verifiers
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={generateProofMutation.isPending}>
                      {generateProofMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        'Generate Proof'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>

              {/* Generated Proof Display */}
              {generatedProof && (
                <div className="mt-8 border-t pt-6">
                  <div className="flex items-center mb-4">
                    <Check className="h-5 w-5 text-green-500 mr-2" />
                    <h3 className="text-lg font-medium">Proof Generated</h3>
                    <Badge className="ml-2">{proofProvider}</Badge>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <h4 className="text-sm font-medium mb-2">Generated Proof:</h4>
                    <div className="bg-black text-green-400 p-4 rounded font-mono text-sm overflow-x-auto">
                      {generatedProof}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Copy this proof for verification or storage
                    </p>
                  </div>
                  <div className="mt-4 flex justify-end space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedProof);
                        toast({
                          title: 'Copied',
                          description: 'Proof copied to clipboard',
                        });
                      }}
                    >
                      Copy to Clipboard
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => {
                        // Automatically fill the verification form with this proof
                        verifyProofForm.setValue('proof', generatedProof);
                        verifyProofForm.setValue(
                          'circuitType',
                          generateProofForm.getValues().circuitType,
                        );
                        verifyProofForm.setValue(
                          'publicInput',
                          generateProofForm.getValues().publicInput,
                        );
                        setActiveTab('verify');
                      }}
                    >
                      Verify This Proof
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="verify" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Verify Zero-Knowledge Proof</CardTitle>
              <CardDescription>
                Verify the validity of a proof without accessing private data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...verifyProofForm}>
                <form
                  onSubmit={verifyProofForm.handleSubmit(onVerifyProofSubmit)}
                  className="space-y-6"
                >
                  <FormField
                    control={verifyProofForm.control}
                    name="circuitType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Circuit Type</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <Button
                            type="button"
                            variant={field.value === 'identity' ? 'default' : 'outline'}
                            className="justify-start"
                            onClick={() => field.onChange('identity')}
                          >
                            <Fingerprint className="h-4 w-4 mr-2" />
                            Identity
                          </Button>
                          <Button
                            type="button"
                            variant={field.value === 'reputation' ? 'default' : 'outline'}
                            className="justify-start"
                            onClick={() => field.onChange('reputation')}
                          >
                            <Award className="h-4 w-4 mr-2" />
                            Reputation
                          </Button>
                          <Button
                            type="button"
                            variant={field.value === 'credentials' ? 'default' : 'outline'}
                            className="justify-start"
                            onClick={() => field.onChange('credentials')}
                          >
                            <FileCheck className="h-4 w-4 mr-2" />
                            Credentials
                          </Button>
                          <Button
                            type="button"
                            variant={field.value === 'generic' ? 'default' : 'outline'}
                            className="justify-start"
                            onClick={() => field.onChange('generic')}
                          >
                            <Shield className="h-4 w-4 mr-2" />
                            Generic
                          </Button>
                        </div>
                        <FormDescription>
                          Select the type of proof you want to verify
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={verifyProofForm.control}
                    name="proof"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZK Proof</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Paste the proof here"
                            className="min-h-[100px] font-mono"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          The zero-knowledge proof string to verify
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={verifyProofForm.control}
                    name="publicInput"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Public Input</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter the public inputs used during proof generation"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Public parameters used when generating the proof
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={verifyProofMutation.isPending}>
                      {verifyProofMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        'Verify Proof'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default function ZKPDashboardPageWrapper() {
  // Render without Layout to prevent double sidebar
  return <ZKPDashboardPage />;
}