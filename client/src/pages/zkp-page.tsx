import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Shield, Key, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

// ZKP circuit type
interface ZKCircuit {
  id: string;
  name: string;
  description: string;
  verificationKey: string;
  constraints: number;
}

// ZKP commitment type
interface IdentityCommitment {
  commitment: string;
  nullifier: string;
}

// ZKP credential type
interface AnonymousCredential {
  credential: string;
  revocationId: string;
}

export default function ZKPPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Query to fetch all ZK circuits
  const { data: circuits, isLoading: isLoadingCircuits } = useQuery<ZKCircuit[]>({
    queryKey: ["/api/zkp/circuits"],
    queryFn: async () => {
      const res = await fetch("/api/zkp/circuits");
      const data = await res.json();
      return data.success ? data.data : [];
    },
  });
  
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Zero-Knowledge Proofs</h1>
      
      <Tabs defaultValue="identity" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="identity">
            <Shield className="w-4 h-4 mr-2" />
            Identity
          </TabsTrigger>
          <TabsTrigger value="credentials">
            <Key className="w-4 h-4 mr-2" />
            Credentials
          </TabsTrigger>
          <TabsTrigger value="verification">
            <CheckCircle className="w-4 h-4 mr-2" />
            Verification
          </TabsTrigger>
          <TabsTrigger value="circuits">
            <Lock className="w-4 h-4 mr-2" />
            Circuits
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="identity">
          <IdentityTab />
        </TabsContent>
        
        <TabsContent value="credentials">
          <CredentialsTab />
        </TabsContent>
        
        <TabsContent value="verification">
          <VerificationTab />
        </TabsContent>
        
        <TabsContent value="circuits">
          <CircuitsTab circuits={circuits} isLoading={isLoadingCircuits} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Identity tab component for creating ZK identities
function IdentityTab() {
  const { toast } = useToast();
  const [secret, setSecret] = useState("");
  const [commitment, setCommitment] = useState<IdentityCommitment | null>(null);
  
  // Mutation to create an identity commitment
  const { mutate: createCommitment, isPending } = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/zkp/identity/commitment", { secret });
      const data = await res.json();
      return data.success ? data.data : null;
    },
    onSuccess: (data) => {
      if (data) {
        setCommitment(data);
        toast({
          title: "Identity Commitment Created",
          description: "Your zero-knowledge identity has been created.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Create Identity",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Zero-Knowledge Identity</CardTitle>
        <CardDescription>
          Create a zero-knowledge identity commitment that allows you to prove 
          your identity without revealing it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {commitment ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Commitment</h3>
              <p className="text-xs text-muted-foreground break-all p-2 bg-muted rounded-md">
                {commitment.commitment}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1">Nullifier</h3>
              <p className="text-xs text-muted-foreground break-all p-2 bg-muted rounded-md">
                {commitment.nullifier}
              </p>
            </div>
            <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
              <h3 className="text-sm font-medium text-amber-800">Important</h3>
              <p className="text-xs text-amber-700 mt-1">
                Save these values securely. You'll need them for anonymous verification.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter a secret that only you know. This will be used to generate your 
              zero-knowledge identity commitment.
            </p>
            <Input
              type="password"
              placeholder="Enter your secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              disabled={isPending}
            />
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!commitment && (
          <Button 
            onClick={() => createCommitment()} 
            disabled={!secret || isPending}
          >
            {isPending ? "Creating..." : "Create Identity Commitment"}
          </Button>
        )}
        {commitment && (
          <Button variant="outline" onClick={() => setCommitment(null)}>
            Create Another
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Credentials tab component for anonymous credentials
function CredentialsTab() {
  const { toast } = useToast();
  const [attributes, setAttributes] = useState<{[key: string]: string}>({});
  const [credential, setCredential] = useState<AnonymousCredential | null>(null);
  const [attributeKey, setAttributeKey] = useState("");
  const [attributeValue, setAttributeValue] = useState("");
  
  // Mutation to generate anonymous credentials
  const { mutate: generateCredential, isPending } = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/zkp/credentials/anonymous", { attributes });
      const data = await res.json();
      return data.success ? data.data : null;
    },
    onSuccess: (data) => {
      if (data) {
        setCredential(data);
        toast({
          title: "Anonymous Credential Generated",
          description: "Your anonymous credential has been created.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Generate Credential",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Add attribute to the list
  const addAttribute = () => {
    if (attributeKey && attributeValue) {
      setAttributes(prev => ({
        ...prev,
        [attributeKey]: attributeValue
      }));
      setAttributeKey("");
      setAttributeValue("");
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Anonymous Credentials</CardTitle>
        <CardDescription>
          Create anonymous credentials that prove properties about you without 
          revealing your identity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {credential ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium mb-1">Credential</h3>
              <p className="text-xs text-muted-foreground break-all p-2 bg-muted rounded-md">
                {credential.credential}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-1">Revocation ID</h3>
              <p className="text-xs text-muted-foreground break-all p-2 bg-muted rounded-md">
                {credential.revocationId}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add attributes for your anonymous credential. These will be 
              hashed and cannot be revealed individually.
            </p>
            
            {/* Display current attributes */}
            {Object.keys(attributes).length > 0 && (
              <div className="p-3 bg-muted rounded-md">
                <h3 className="text-sm font-medium mb-2">Current Attributes</h3>
                {Object.entries(attributes).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm py-1">
                    <span className="font-medium">{key}:</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add new attribute */}
            <div className="grid grid-cols-12 gap-2">
              <Input
                className="col-span-5"
                placeholder="Attribute name"
                value={attributeKey}
                onChange={(e) => setAttributeKey(e.target.value)}
                disabled={isPending}
              />
              <Input
                className="col-span-5"
                placeholder="Attribute value"
                value={attributeValue}
                onChange={(e) => setAttributeValue(e.target.value)}
                disabled={isPending}
              />
              <Button 
                className="col-span-2" 
                variant="outline" 
                onClick={addAttribute}
                disabled={!attributeKey || !attributeValue || isPending}
              >
                Add
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        {!credential && (
          <Button 
            onClick={() => generateCredential()} 
            disabled={Object.keys(attributes).length === 0 || isPending}
          >
            {isPending ? "Generating..." : "Generate Credential"}
          </Button>
        )}
        {credential && (
          <Button variant="outline" onClick={() => setCredential(null)}>
            Create Another
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

// Verification tab component for verifying ZK proofs
function VerificationTab() {
  const { toast } = useToast();
  const [commitment, setCommitment] = useState("");
  const [nullifier, setNullifier] = useState("");
  const [proof, setProof] = useState("");
  const [verificationResult, setVerificationResult] = useState<{valid: boolean, reason?: string} | null>(null);
  
  // Mutation to verify identity
  const { mutate: verifyIdentity, isPending } = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/zkp/identity/verify", { 
        commitment, 
        nullifier, 
        proof 
      });
      const data = await res.json();
      return data.success ? data.data : null;
    },
    onSuccess: (data) => {
      if (data) {
        setVerificationResult(data);
        if (data.valid) {
          toast({
            title: "Verification Successful",
            description: "Identity verified successfully.",
          });
        } else {
          toast({
            title: "Verification Failed",
            description: data.reason || "Identity verification failed.",
            variant: "destructive",
          });
        }
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Verification Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify Zero-Knowledge Proofs</CardTitle>
        <CardDescription>
          Verify identity and other zero-knowledge proofs without revealing 
          sensitive information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {verificationResult && (
            <div className={`p-4 rounded-md ${verificationResult.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center">
                {verificationResult.valid ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                )}
                <h3 className={`text-sm font-medium ${verificationResult.valid ? 'text-green-800' : 'text-red-800'}`}>
                  {verificationResult.valid ? "Verification Successful" : "Verification Failed"}
                </h3>
              </div>
              {!verificationResult.valid && verificationResult.reason && (
                <p className="text-xs text-red-600 mt-1">{verificationResult.reason}</p>
              )}
            </div>
          )}
          
          <div>
            <h3 className="text-sm font-medium mb-1">Commitment</h3>
            <Input
              placeholder="Enter commitment"
              value={commitment}
              onChange={(e) => setCommitment(e.target.value)}
              disabled={isPending}
            />
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-1">Nullifier</h3>
            <Input
              placeholder="Enter nullifier"
              value={nullifier}
              onChange={(e) => setNullifier(e.target.value)}
              disabled={isPending}
            />
          </div>
          
          <div>
            <h3 className="text-sm font-medium mb-1">Proof</h3>
            <Input
              placeholder="Enter proof"
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => verifyIdentity()} 
          disabled={!commitment || !nullifier || !proof || isPending}
        >
          {isPending ? "Verifying..." : "Verify Identity"}
        </Button>
      </CardFooter>
    </Card>
  );
}

// Circuits tab component for displaying available ZK circuits
function CircuitsTab({ circuits, isLoading }: { circuits?: ZKCircuit[], isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  if (!circuits || circuits.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Circuits Available</CardTitle>
          <CardDescription>
            No zero-knowledge circuits are currently available.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {circuits.map((circuit) => (
        <Card key={circuit.id}>
          <CardHeader>
            <CardTitle>{circuit.name}</CardTitle>
            <CardDescription>{circuit.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Circuit ID:</span>
                <span className="font-mono text-xs">{circuit.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Constraints:</span>
                <span>{circuit.constraints.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
