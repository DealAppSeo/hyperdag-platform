import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Info } from "lucide-react";
import { AccountInfo } from "./AccountInfo";
import { CreateAccount } from "./CreateAccount";
import { SendPayment } from "./SendPayment";
import { NetworkStatus } from "./NetworkStatus";
import { useToast } from "@/hooks/use-toast";

/**
 * Stellar Dashboard Component
 * 
 * Provides access to Stellar blockchain functionality including:
 * - Account creation
 * - Network status
 * - Account information
 * - Sending payments
 */
export function StellarDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Stellar Integration</h2>
        <p className="text-muted-foreground">
          Interact with the Stellar blockchain network for payments, assets, and escrow accounts.
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Note</AlertTitle>
        <AlertDescription>
          Stellar operations are currently running on {import.meta.env.VITE_NODE_ENV === 'production' ? 'Mainnet' : 'Testnet'}.
          Be careful when using real assets.
        </AlertDescription>
      </Alert>

      <Tabs
        defaultValue="overview"
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="escrow" className="hidden lg:block">Escrow</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Network Status</CardTitle>
                <CardDescription>
                  Current Stellar network information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NetworkStatus />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common Stellar operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  onClick={() => setActiveTab("accounts")}
                  variant="outline" 
                  className="w-full justify-start"
                >
                  Create New Account
                </Button>
                <Button 
                  onClick={() => setActiveTab("payments")}
                  variant="outline" 
                  className="w-full justify-start"
                >
                  Send Payment
                </Button>
                <Button 
                  onClick={() => toast({
                    title: "Coming Soon",
                    description: "Asset creation functionality will be available soon."
                  })}
                  variant="outline" 
                  className="w-full justify-start"
                >
                  Create Asset
                </Button>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle>What is Stellar?</CardTitle>
                <CardDescription>A brief introduction</CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <p>
                  Stellar is an open-source network for currencies and payments. It makes it possible 
                  to create, send, and trade digital representations of all forms of money—dollars, 
                  pesos, bitcoin, or any other form of currency.
                </p>
                <p className="mt-2">
                  Stellar is designed to work with any type of financial infrastructure and enables 
                  cross-border payments, tokenization of assets, and decentralized trading.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Accounts Tab */}
        <TabsContent value="accounts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Create Account</CardTitle>
                <CardDescription>
                  Generate a new Stellar account keypair
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreateAccount />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Look up account details on the Stellar network
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AccountInfo />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Payment</CardTitle>
              <CardDescription>
                Send XLM or other assets to a Stellar account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SendPayment />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assets Tab */}
        <TabsContent value="assets" className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Coming Soon</AlertTitle>
            <AlertDescription>
              The assets management functionality is currently under development and will be available soon.
            </AlertDescription>
          </Alert>
        </TabsContent>

        {/* Escrow Tab */}
        <TabsContent value="escrow" className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Coming Soon</AlertTitle>
            <AlertDescription>
              Multi-signature escrow account functionality for crowdfunding will be available soon.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}