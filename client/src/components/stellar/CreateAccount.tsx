import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, Check, Wallet, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AccountKeys {
  publicKey: string;
  secretKey: string;
}

/**
 * Create Account Component
 * 
 * Allows users to generate a new Stellar account (keypair)
 * and fund it with test XLM on the testnet
 */
export function CreateAccount() {
  const [keys, setKeys] = useState<AccountKeys | null>(null);
  const [isCopied, setIsCopied] = useState<{ public: boolean; secret: boolean }>({
    public: false,
    secret: false,
  });
  const { toast } = useToast();

  // Mutation to create a new account
  const createAccountMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stellar/account");
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success === false) {
        toast({
          title: "Error creating account",
          description: data.message,
          variant: "destructive",
        });
        return;
      }
      
      setKeys({
        publicKey: data.publicKey,
        secretKey: data.secretKey,
      });
      
      toast({
        title: "Account created successfully",
        description: "Keep your secret key safe and secure.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to fund an account on testnet
  const fundAccountMutation = useMutation({
    mutationFn: async (publicKey: string) => {
      const res = await apiRequest("POST", "/api/stellar/fund-testnet", { 
        publicKey 
      });
      return await res.json();
    },
    onSuccess: (data) => {
      if (!data.success) {
        toast({
          title: "Funding failed",
          description: data.message,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Account funded successfully",
        description: "Your test account has been funded with XLM.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to fund account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateAccount = () => {
    createAccountMutation.mutate();
  };

  const handleFundAccount = () => {
    if (!keys) return;
    fundAccountMutation.mutate(keys.publicKey);
  };

  const copyToClipboard = (text: string, type: 'public' | 'secret') => {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied({ ...isCopied, [type]: true });
      setTimeout(() => {
        setIsCopied({ ...isCopied, [type]: false });
      }, 2000);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Button 
          onClick={handleCreateAccount} 
          disabled={createAccountMutation.isPending}
          className="w-full sm:w-auto"
        >
          {createAccountMutation.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
          ) : (
            <><RefreshCw className="mr-2 h-4 w-4" /> Generate Keypair</>
          )}
        </Button>
        
        {keys && (
          <Button 
            onClick={handleFundAccount} 
            disabled={fundAccountMutation.isPending}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            {fundAccountMutation.isPending ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Funding...</>
            ) : (
              <><Wallet className="mr-2 h-4 w-4" /> Fund on Testnet</>
            )}
          </Button>
        )}
      </div>

      {keys && (
        <div className="space-y-3 border rounded-md p-3">
          <Alert variant="default" className="bg-primary/5 border-primary/10">
            <AlertDescription className="text-xs">
              Save these keys securely. The secret key will not be shown again and gives full control over this account.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="publicKey">Public Key (Address)</Label>
              <div className="flex gap-2">
                <Input 
                  id="publicKey" 
                  value={keys.publicKey} 
                  readOnly 
                  className="font-mono text-xs"
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => copyToClipboard(keys.publicKey, 'public')}
                >
                  {isCopied.public ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="secretKey">Secret Key (Private Key)</Label>
              <div className="flex gap-2">
                <Input 
                  id="secretKey" 
                  type="password" 
                  value={keys.secretKey} 
                  readOnly 
                  className="font-mono text-xs"
                  onClick={() => copyToClipboard(keys.secretKey, 'secret')}
                />
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => copyToClipboard(keys.secretKey, 'secret')}
                >
                  {isCopied.secret ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}