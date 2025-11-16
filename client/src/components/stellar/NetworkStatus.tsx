import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";

/**
 * Network Status Component
 * 
 * Displays the current status of the Stellar network including:
 * - Current ledger information
 * - Fee statistics
 * - Network type (testnet/mainnet)
 */
export function NetworkStatus() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['/api/stellar/status'],
    refetchInterval: false // ❌ NO POLLING - eliminated 2 req/min
  });

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-destructive">
        <p className="font-semibold">Network Error</p>
        <p className="text-sm">{(error as Error)?.message || "Failed to fetch network status"}</p>
      </div>
    );
  }

  const { feeStats, latestLedger, isTestnet } = data?.data || {};

  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium">Network Type:</span>
        <Badge variant={isTestnet ? "outline" : "default"}>
          {isTestnet ? "Testnet" : "Mainnet"}
        </Badge>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="font-medium">Current Ledger:</span>
        <span>{latestLedger?.sequence || "Unknown"}</span>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="font-medium">Base Fee:</span>
        <span>{latestLedger?.base_fee || "Unknown"} stroops</span>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="font-medium">Last Closed:</span>
        <span>{latestLedger?.closed_at ? new Date(latestLedger.closed_at).toLocaleTimeString() : "Unknown"}</span>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="font-medium">Transaction Count:</span>
        <span>{latestLedger?.successful_transaction_count || 0}</span>
      </div>

      <div className="mt-2 pt-2 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Updated: {new Date().toLocaleTimeString()}</span>
          <Badge variant="outline" className="text-xs">Auto-refreshing</Badge>
        </div>
      </div>
    </div>
  );
}