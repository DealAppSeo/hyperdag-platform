import { BasicWalletConnect } from '@/components/web3/BasicWalletConnect';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wallet, ArrowUpDown, Info } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Layout } from '@/components/layout/layout';

export default function WalletConnectPage() {
  const { toast } = useToast();
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [networkInfo, setNetworkInfo] = useState<any>(null);

  const handleConnect = (address: string, chainId: string, walletType?: string) => {
    setConnectedAddress(address);
    
    toast({
      title: "Wallet Connected",
      description: `Connected to ${address.substring(0, 6)}...${address.substring(address.length - 4)} via ${walletType || 'wallet'}`,
    });

    // Fetch network info
    fetch('/api/blockchain-status')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setNetworkInfo(data.data.polygon);
        }
      })
      .catch(err => {
        console.error('Error fetching blockchain status:', err);
      });
  };

  return (
    <Layout>
      <div className="container max-w-4xl py-8">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <Wallet className="mr-2 h-6 w-6" /> Wallet Connection
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <BasicWalletConnect onConnect={handleConnect} />
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Network Status</CardTitle>
                <CardDescription>Current HyperDAG blockchain network status</CardDescription>
              </CardHeader>
              <CardContent>
                {networkInfo ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Network:</span>
                      <span className="font-medium">{networkInfo.network?.name || 'Polygon Amoy'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={`font-medium ${networkInfo.status === 'connected' ? 'text-green-500' : 'text-red-500'}`}>
                        {networkInfo.status === 'connected' ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    {networkInfo.blockNumber && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Block Number:</span>
                        <span className="font-medium">{networkInfo.blockNumber.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>Loading network information...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {connectedAddress && (
              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                  <CardDescription>Interact with the blockchain</CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert className="mb-4 bg-amber-50 text-amber-800">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      You're connected to the Polygon Amoy testnet. Any transactions will use test ETH.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="space-y-2">
                    <Button className="w-full" variant="outline" disabled>
                      <ArrowUpDown className="mr-2 h-4 w-4" /> Send Transaction
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Additional transaction features coming soon
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}