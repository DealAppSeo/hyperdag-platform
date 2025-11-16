import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

/**
 * Account Info Component
 * 
 * Allows users to look up information about a Stellar account
 * by entering the account's public key
 */
export function AccountInfo() {
  const [publicKey, setPublicKey] = useState("");
  const [searchedKey, setSearchedKey] = useState("");
  
  const { 
    data, 
    isLoading, 
    isError, 
    error, 
    isFetching 
  } = useQuery({
    queryKey: ['/api/stellar/account', searchedKey],
    enabled: !!searchedKey,
    refetchOnWindowFocus: false,
  });

  const handleSearch = () => {
    if (!publicKey) return;
    setSearchedKey(publicKey);
  };

  const handleRefresh = () => {
    if (!searchedKey) return;
    queryClient.invalidateQueries({ queryKey: ['/api/stellar/account', searchedKey] });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="accountPublicKey">Account Public Key</Label>
        <div className="flex gap-2">
          <Input 
            id="accountPublicKey" 
            placeholder="G..." 
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
            className="font-mono text-xs"
          />
          <Button 
            onClick={handleSearch} 
            disabled={!publicKey || isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : "Failed to fetch account information"}
          </AlertDescription>
        </Alert>
      )}

      {data && !data.success && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Account Not Found</AlertTitle>
          <AlertDescription>
            {data.message || "The account does not exist on the Stellar network"}
          </AlertDescription>
        </Alert>
      )}

      {data && data.success && data.data && (
        <div className="rounded border p-3 space-y-2 relative">
          {isFetching && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Account Details</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRefresh}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          <Separator />
          
          <div className="space-y-1 text-sm">
            <div className="grid grid-cols-3 gap-1">
              <span className="text-muted-foreground">Account ID:</span>
              <span className="col-span-2 font-mono text-xs truncate">{data.data.id}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-1">
              <span className="text-muted-foreground">Sequence:</span>
              <span className="col-span-2">{data.data.sequence}</span>
            </div>
            
            <div className="grid grid-cols-3 gap-1">
              <span className="text-muted-foreground">Number of Signers:</span>
              <span className="col-span-2">{data.data.signers?.length || 0}</span>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h4 className="font-medium mb-2">Balances</h4>
            <div className="space-y-2">
              {data.data.balances?.map((balance: any, index: number) => (
                <div key={index} className="bg-muted p-2 rounded text-sm">
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-muted-foreground">Asset:</span>
                    <span className="col-span-2">
                      {balance.asset_type === 'native' ? 'XLM (native)' : `${balance.asset_code} (${balance.asset_issuer})`}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    <span className="text-muted-foreground">Balance:</span>
                    <span className="col-span-2 font-medium">{balance.balance}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-center text-muted-foreground pt-2">
            <a 
              href={`https://${import.meta.env.VITE_NODE_ENV !== 'production' ? 'testnet.' : ''}steexp.com/account/${searchedKey}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center hover:underline"
            >
              View on Explorer <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}