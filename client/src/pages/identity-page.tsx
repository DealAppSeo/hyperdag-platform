import { ZkIdentityDashboard } from "@/components/identity/ZkIdentityDashboard";
import { Layout } from "@/components/layout/layout";

export default function IdentityPage() {
  return (
    <Layout>
      <div className="container mx-auto py-6 max-w-7xl">
        <div className="mb-10">
          <ZkIdentityDashboard />
        </div>
        
        <div className="mt-12 space-y-8">
          <h2 className="text-2xl font-semibold">How It Works</h2>
          
          <div className="grid gap-6 md:grid-cols-3">
            <div className="p-6 border rounded-lg bg-card">
              <h3 className="text-xl font-semibold mb-2">Soulbound Tokens</h3>
              <p className="text-sm text-muted-foreground">
                Non-transferable NFTs that represent your digital identity. Unlike regular NFTs, these tokens
                cannot be transferred or sold, ensuring your identity remains uniquely yours.
              </p>
            </div>
            
            <div className="p-6 border rounded-lg bg-card">
              <h3 className="text-xl font-semibold mb-2">Zero-Knowledge Proofs</h3>
              <p className="text-sm text-muted-foreground">
                Privacy-preserving cryptographic technique that allows you to prove statements about your data
                without revealing the actual data itself, giving you complete control over your information.
              </p>
            </div>
            
            <div className="p-6 border rounded-lg bg-card">
              <h3 className="text-xl font-semibold mb-2">Selective Disclosure</h3>
              <p className="text-sm text-muted-foreground">
                Choose exactly what parts of your identity to share in different contexts. Prove your age without
                revealing your birth date, or verify your credentials without exposing sensitive information.
              </p>
            </div>
          </div>
          
          <div className="mt-10 p-6 border rounded-lg bg-muted/30">
            <h3 className="text-xl font-semibold mb-2">Moralis Integration</h3>
            <p className="text-muted-foreground mb-4">
              HyperDAG's identity system uses Moralis APIs to enhance and streamline the blockchain interaction:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Real-time contract event monitoring for identity creation and credential updates</li>
              <li>Cross-chain identity verification across multiple blockchain networks</li>
              <li>Secure data indexing for credential verification history</li>
              <li>ENS domain resolution for human-readable identity addressing</li>
              <li>Authentication through wallet signatures with non-custodial security</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}