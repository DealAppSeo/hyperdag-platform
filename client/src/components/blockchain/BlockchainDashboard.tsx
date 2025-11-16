import { useEffect } from 'react';
import { useBlockchain } from '@/web3/hooks/useBlockchain';
import { useMetaMask } from '@/web3/hooks/useMetaMask';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge-extended';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, Activity, Database, Zap, Users, Clock } from 'lucide-react';

export function BlockchainDashboard() {
  const { 
    isHealthy, 
    networkMetrics, 
    totalProjects, 
    tokenBalance,
    refetchAll 
  } = useBlockchain();
  
  const { 
    isConnected, 
    isConnecting, 
    address, 
    chainId,
    connect,
    disconnect
  } = useMetaMask();
  
  // Refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (isHealthy) {
        refetchAll();
      }
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [isHealthy, refetchAll]);
  
  // Get network name
  const getNetworkName = (chainId: number | null) => {
    if (!chainId) return 'Unknown';
    
    const networks: Record<number, string> = {
      1: 'Ethereum Mainnet',
      5: 'Goerli Testnet',
      137: 'Polygon Mainnet',
      80001: 'Polygon Mumbai',
      1101: 'Polygon zkEVM',
      2442: 'zkEVM Cardona',
    };
    
    return networks[chainId] || `Chain ID: ${chainId}`;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row justify-between items-start">
        {/* Wallet Connection Card */}
        <Card className="w-full md:w-1/3">
          <CardHeader className="pb-2">
            <CardTitle>Wallet Status</CardTitle>
            <CardDescription>
              {isConnected ? 'Your wallet is connected' : 'Connect your wallet to interact with the blockchain'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant={isConnected ? "success" : "destructive"}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
              
              {isConnected && (
                <>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Network:</span>
                    <Badge variant="outline">{getNetworkName(chainId)}</Badge>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Address:</span>
                    <span className="text-sm font-mono text-muted-foreground">
                      {address ? `${address.substring(0, 6)}...${address.substring(38)}` : ''}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">HDAG Balance:</span>
                    <span className="text-sm font-mono">{tokenBalance}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
          <CardFooter>
            {isConnected ? (
              <Button variant="destructive" onClick={disconnect} className="w-full">
                Disconnect
              </Button>
            ) : (
              <Button
                onClick={connect}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  'Connect Wallet'
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
        
        {/* Blockchain Status Card */}
        <Card className="w-full md:w-2/3">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle>Network Status</CardTitle>
              <Badge
                variant={isHealthy ? "success" : "destructive"}
                className="ml-2"
              >
                {isHealthy ? 'Healthy' : 'Unhealthy'}
              </Badge>
            </div>
            <CardDescription>
              Real-time performance metrics for the HyperDAG network
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isHealthy ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  title="Transactions"
                  value={networkMetrics?.tps.toString() || '0'}
                  subtext="TPS"
                  icon={<Activity className="h-4 w-4" />}
                />
                
                <MetricCard
                  title="Latency"
                  value={networkMetrics?.averageLatency.toString() || '0'}
                  subtext="ms"
                  icon={<Clock className="h-4 w-4" />}
                />
                
                <MetricCard
                  title="Active Nodes"
                  value={networkMetrics?.activeNodes.toString() || '0'}
                  subtext="nodes"
                  icon={<Database className="h-4 w-4" />}
                />
                
                <MetricCard
                  title="Projects"
                  value={totalProjects.toString()}
                  subtext="total"
                  icon={<Users className="h-4 w-4" />}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex flex-col space-y-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={refetchAll}
            >
              <Zap className="mr-2 h-4 w-4" />
              Refresh Metrics
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtext, icon }: { title: string, value: string, subtext: string, icon: React.ReactNode }) {
  return (
    <div className="flex flex-col space-y-1">
      <div className="flex items-center space-x-2">
        {icon}
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
      </div>
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-xs text-muted-foreground">{subtext}</span>
    </div>
  );
}
