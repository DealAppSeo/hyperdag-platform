import { Web3Dashboard } from "@/components/web3/Web3Dashboard";
import { MoralisExplorer } from "@/components/web3/MoralisExplorer";
import { Layout } from "@/components/layout/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Database, HardDrive, Shield } from "lucide-react";

export default function Web3Page() {
  return (
    <Layout>
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Web3 Technologies</h1>
          <p className="mt-2 text-muted-foreground">
            Explore the decentralized technologies that power HyperDAG's hybrid Web3 ecosystem.
            Connect your wallet to test features including IPFS/Filecoin storage, Zero-Knowledge Proofs,
            and Polygon zkEVM integration.
          </p>
        </div>
        
        <Tabs defaultValue="dashboard" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard" className="flex items-center">
              <HardDrive className="h-4 w-4 mr-2" />
              Web3 Dashboard
            </TabsTrigger>
            <TabsTrigger value="explorer" className="flex items-center">
              <Database className="h-4 w-4 mr-2" />
              Blockchain Explorer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <Web3Dashboard />
          </TabsContent>

          <TabsContent value="explorer">
            <MoralisExplorer />
          </TabsContent>
        </Tabs>
        
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="p-6 border rounded-lg bg-card">
            <h3 className="text-xl font-semibold mb-2">IPFS & Filecoin</h3>
            <p className="text-sm text-muted-foreground">
              Decentralized storage layer that ensures data availability, persistence, and
              censorship resistance through content-addressable file storage.
            </p>
          </div>
          
          <div className="p-6 border rounded-lg bg-card">
            <h3 className="text-xl font-semibold mb-2">Zero-Knowledge Proofs</h3>
            <p className="text-sm text-muted-foreground">
              Privacy-preserving technology that enables verification without revealing underlying data,
              enhancing security and confidentiality of user information.
            </p>
          </div>
          
          <div className="p-6 border rounded-lg bg-card">
            <h3 className="text-xl font-semibold mb-2">Polygon zkEVM</h3>
            <p className="text-sm text-muted-foreground">
              Scalable Ethereum-compatible layer that provides fast, low-cost transactions with
              the security benefits of zero-knowledge cryptography.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
