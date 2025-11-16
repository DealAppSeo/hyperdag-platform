import { BlockchainDashboard } from "@/components/blockchain/BlockchainDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Web3Provider } from "@/web3/providers/Web3Provider";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon, Wallet } from "lucide-react";
import { Layout } from "@/components/layout/layout";
import PolygonCDKPanel from "@/components/blockchain/PolygonCDKPanel";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function BlockchainPage() {
  return (
    <Layout>
      <Web3Provider>
        <div className="container py-8 max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">HyperDAG Blockchain</h1>
            <Link href="/wallet-connect">
              <Button className="gap-2" variant="outline">
                <Wallet className="h-4 w-4" />
                Connect Wallet
              </Button>
            </Link>
          </div>
          
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="projects">Projects</TabsTrigger>
              <TabsTrigger value="activity">Network Activity</TabsTrigger>
              <TabsTrigger value="polygon-cdk">Polygon CDK</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard">
              <BlockchainDashboard />
            </TabsContent>
            
            <TabsContent value="projects">
              <div className="p-8 rounded-lg border bg-card text-left">
                <h3 className="text-xl font-medium mb-2">Blockchain Projects Coming Soon</h3>
                <p className="text-muted-foreground">
                  This section will show all projects stored on the blockchain, allowing
                  you to browse, fund, and join teams directly through Web3 interactions.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="activity">
              <div className="p-8 rounded-lg border bg-card text-left">
                <h3 className="text-xl font-medium mb-2">Network Activity Coming Soon</h3>
                <p className="text-muted-foreground">
                  This section will display real-time transaction data, block information,
                  and network health metrics from the HyperDAG blockchain.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="polygon-cdk">
              <PolygonCDKPanel />
            </TabsContent>
          </Tabs>
        </div>
      </Web3Provider>
    </Layout>
  );
}
