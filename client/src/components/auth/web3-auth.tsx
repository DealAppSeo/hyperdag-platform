import { useState } from "react";
import { useWeb3 } from "@/web3/hooks/useWeb3";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Web3Auth() {
  const { 
    address, 
    connectWallet, 
    isConnected, 
    isConnecting, 
    formatAddress,
    signInWithEthereum 
  } = useWeb3();
  
  const { toast } = useToast();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSignIn = async () => {
    if (!isConnected) {
      await connectWallet();
      return;
    }

    setIsAuthenticating(true);
    try {
      const result = await signInWithEthereum();
      
      if (result.success) {
        // Redirect to dashboard on successful auth
        window.location.href = "/";
      } else {
        toast({
          title: "Authentication failed",
          description: result.message || "Could not authenticate with your wallet",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error during Web3 authentication:", error);
      toast({
        title: "Authentication error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Web3 Authentication</CardTitle>
        <CardDescription>Connect with your crypto wallet to access HyperDAG</CardDescription>
        <div className="mt-4 p-3 bg-primary/5 rounded-md border border-primary/20">
          <p className="text-sm text-gray-700 leading-relaxed">
            <strong>Our Mission:</strong> HyperDAG transforms professional networking through a decentralized, reward-driven ecosystem that creates meaningful connections, incentivizes participation, and facilitates collaboration—all within a secure, privacy-first Web3 environment.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-6 border rounded-lg flex flex-col items-center justify-center text-center">
          <Wallet className="h-16 w-16 text-primary mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {isConnected 
              ? `Connected: ${formatAddress(address || "")}` 
              : "Connect Your Wallet"
            }
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            {isConnected
              ? "Sign a message to authenticate securely with your wallet"
              : "Securely access HyperDAG with MetaMask or other Web3 wallets"
            }
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleSignIn}
          disabled={isConnecting || isAuthenticating}
        >
          {isConnecting || isAuthenticating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isConnecting ? "Connecting..." : "Authenticating..."}
            </>
          ) : (
            isConnected ? "Sign In With Ethereum" : "Connect Wallet"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}