/**
 * Developer Sandbox - Interactive testing environment for RepID SDK
 * 
 * Provides easy-to-use interface for testing RepID functionality
 * without ZKP complexity. Perfect for developer onboarding.
 */

import { useState, useEffect } from 'react';
import { RepIDSDK, RepIDScore, RepIDProfile } from '@/lib/repid-sdk';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Code, TestTube, Zap, CheckCircle, AlertCircle } from 'lucide-react';

// Demo accounts for testing
const DEMO_ACCOUNTS = [
  {
    wallet: '0x1234567890123456789012345678901234567890',
    name: 'Demo Developer',
    scores: [
      { category: 'governance', score: 750, weight: 1.2 },
      { category: 'technical', score: 850, weight: 1.0 },
      { category: 'community', score: 650, weight: 0.8 }
    ]
  },
  {
    wallet: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
    name: 'Faith-Tech Pioneer',
    scores: [
      { category: 'faithtech', score: 900, weight: 1.5 },
      { category: 'governance', score: 600, weight: 1.0 },
      { category: 'defi', score: 400, weight: 0.6 }
    ]
  }
];

interface SandboxResult {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: number;
  duration: number;
}

export function DeveloperSandbox() {
  const [sdk] = useState(() => new RepIDSDK({ mockMode: true }));
  const [selectedWallet, setSelectedWallet] = useState(DEMO_ACCOUNTS[0].wallet);
  const [threshold, setThreshold] = useState(800);
  const [category, setCategory] = useState('governance');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SandboxResult[]>([]);
  const [profile, setProfile] = useState<RepIDProfile | null>(null);
  const { toast } = useToast();

  // Load demo profile on wallet change
  useEffect(() => {
    loadProfile(selectedWallet);
  }, [selectedWallet]);

  const addResult = (result: SandboxResult) => {
    setResults(prev => [result, ...prev.slice(0, 9)]); // Keep last 10 results
  };

  const loadProfile = async (wallet: string) => {
    try {
      const profile = await sdk.getRepIDProfile(wallet);
      setProfile(profile);
    } catch (error) {
      console.error('Failed to load profile:', error);
      setProfile(null);
    }
  };

  const handleCreateRepID = async () => {
    setLoading(true);
    const startTime = Date.now();
    
    try {
      const demoAccount = DEMO_ACCOUNTS.find(acc => acc.wallet === selectedWallet);
      if (!demoAccount) throw new Error('Demo account not found');

      const result = await sdk.createRepID({
        wallet: selectedWallet,
        scores: demoAccount.scores as RepIDScore[],
        mockMode: true
      });

      const duration = Date.now() - startTime;
      addResult({
        success: true,
        data: result,
        timestamp: Date.now(),
        duration
      });

      await loadProfile(selectedWallet);
      
      toast({
        title: "RepID Created! 🎉",
        description: `Mock RepID created instantly (${duration}ms)`
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      addResult({
        success: false,
        error: error.message,
        timestamp: Date.now(),
        duration
      });

      toast({
        title: "Creation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyThreshold = async () => {
    setLoading(true);
    const startTime = Date.now();

    try {
      const verified = await sdk.verifyRepID({
        wallet: selectedWallet,
        threshold,
        category: category === 'total' ? undefined : category,
        mockMode: true
      });

      const duration = Date.now() - startTime;
      addResult({
        success: true,
        data: { verified, threshold, category },
        timestamp: Date.now(),
        duration
      });

      toast({
        title: verified ? "Threshold Met! ✅" : "Threshold Not Met ❌",
        description: `Verification completed in ${duration}ms`
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      addResult({
        success: false,
        error: error.message,
        timestamp: Date.now(),
        duration
      });

      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBatchVerify = async () => {
    setLoading(true);
    const startTime = Date.now();

    try {
      const requests = DEMO_ACCOUNTS.map(account => ({
        wallet: account.wallet,
        threshold: 500,
        category: 'governance'
      }));

      const results = await sdk.batchVerifyRepIDs(requests);
      const duration = Date.now() - startTime;

      addResult({
        success: true,
        data: { batchResults: results, count: requests.length },
        timestamp: Date.now(),
        duration
      });

      toast({
        title: "Batch Verification Complete! 🚀",
        description: `${requests.length} verifications in ${duration}ms`
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      addResult({
        success: false,
        error: error.message,
        timestamp: Date.now(),
        duration
      });

      toast({
        title: "Batch Verification Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 800) return 'bg-green-500';
    if (score >= 600) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6" data-testid="developer-sandbox">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <TestTube className="h-8 w-8 text-blue-500" />
          RepID Developer Sandbox
        </h1>
        <p className="text-muted-foreground">
          Test ZKP RepID functionality instantly without blockchain complexity
        </p>
        <Badge variant="secondary" className="gap-1">
          <Zap className="h-3 w-3" />
          Mock Mode - Instant Responses
        </Badge>
      </div>

      <Tabs defaultValue="testing" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="testing">Interactive Testing</TabsTrigger>
          <TabsTrigger value="profile">Profile Viewer</TabsTrigger>
          <TabsTrigger value="code">Code Examples</TabsTrigger>
        </TabsList>

        <TabsContent value="testing" className="space-y-6">
          {/* Demo Account Selector */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TestTube className="h-5 w-5" />
                Demo Account Selection
              </CardTitle>
              <CardDescription>
                Choose a pre-configured demo account to test with
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DEMO_ACCOUNTS.map((account) => (
                  <Card 
                    key={account.wallet}
                    className={`cursor-pointer transition-colors ${
                      selectedWallet === account.wallet ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : ''
                    }`}
                    onClick={() => setSelectedWallet(account.wallet)}
                    data-testid={`demo-account-${account.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold">{account.name}</h3>
                        <p className="text-sm text-muted-foreground font-mono">
                          {account.wallet.slice(0, 10)}...{account.wallet.slice(-8)}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {account.scores.map((score) => (
                            <Badge 
                              key={score.category}
                              variant="outline" 
                              className="text-xs"
                            >
                              {score.category}: {score.score}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SDK Testing Interface */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create RepID */}
            <Card>
              <CardHeader>
                <CardTitle>Create RepID</CardTitle>
                <CardDescription>
                  Create a mock RepID instantly for testing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleCreateRepID}
                  disabled={loading}
                  className="w-full"
                  data-testid="button-create-repid"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Mock RepID
                </Button>
              </CardContent>
            </Card>

            {/* Verify Threshold */}
            <Card>
              <CardHeader>
                <CardTitle>Verify Threshold</CardTitle>
                <CardDescription>
                  Test threshold verification functionality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="threshold">Threshold</Label>
                    <Input
                      id="threshold"
                      type="number"
                      value={threshold}
                      onChange={(e) => setThreshold(Number(e.target.value))}
                      data-testid="input-threshold"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <select 
                      id="category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-2 border rounded-md"
                      data-testid="select-category"
                    >
                      <option value="governance">Governance</option>
                      <option value="technical">Technical</option>
                      <option value="community">Community</option>
                      <option value="faithtech">FaithTech</option>
                      <option value="defi">DeFi</option>
                      <option value="total">Total Score</option>
                    </select>
                  </div>
                </div>
                <Button 
                  onClick={handleVerifyThreshold}
                  disabled={loading}
                  className="w-full"
                  data-testid="button-verify-threshold"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Verify Threshold
                </Button>
              </CardContent>
            </Card>

            {/* Batch Verification */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Batch Verification</CardTitle>
                <CardDescription>
                  Test batch verification across multiple accounts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleBatchVerify}
                  disabled={loading}
                  className="w-full"
                  data-testid="button-batch-verify"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Batch Verify All Demo Accounts
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Panel */}
          {results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Test Results</CardTitle>
                <CardDescription>
                  Latest API call results (showing last 10)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {results.map((result, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg border ${
                        result.success ? 'bg-green-50 border-green-200 dark:bg-green-950' : 'bg-red-50 border-red-200 dark:bg-red-950'
                      }`}
                      data-testid={`result-${index}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="text-sm">
                            {formatTimestamp(result.timestamp)}
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {result.duration}ms
                        </Badge>
                      </div>
                      {result.success ? (
                        <pre className="text-xs mt-2 text-muted-foreground">
                          {JSON.stringify(result.data, null, 2)}
                        </pre>
                      ) : (
                        <p className="text-sm text-red-600 mt-1">{result.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          {profile ? (
            <Card>
              <CardHeader>
                <CardTitle>RepID Profile</CardTitle>
                <CardDescription>
                  Current profile for {selectedWallet.slice(0, 10)}...{selectedWallet.slice(-8)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Total Score</Label>
                    <div className="text-2xl font-bold">{profile.totalScore}</div>
                  </div>
                  <div>
                    <Label>Level</Label>
                    <div className="text-2xl font-bold">Level {profile.level}</div>
                  </div>
                </div>
                
                <div>
                  <Label>Category Scores</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                    {profile.scores.map((score) => (
                      <div key={score.category} className="flex items-center justify-between p-2 border rounded">
                        <span className="capitalize">{score.category}</span>
                        <Badge className={getScoreColor(score.score)}>
                          {score.score}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                  <div>
                    <Label>Created</Label>
                    <div>{profile.createdAt.toLocaleString()}</div>
                  </div>
                  <div>
                    <Label>Updated</Label>
                    <div>{profile.updatedAt.toLocaleString()}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  No RepID found for this wallet. Create one to get started!
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="code" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                SDK Usage Examples
              </CardTitle>
              <CardDescription>
                Copy and paste these examples to integrate RepID into your app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>1. Initialize SDK</Label>
                  <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto mt-2">
{`import { RepIDSDK } from '@hyperdag/repid-sdk';

// For testing - instant responses
const sdk = new RepIDSDK({ mockMode: true });

// For production - real ZKP proofs
const sdk = new RepIDSDK({ 
  apiUrl: '/api/web3-ai/repid',
  mockMode: false 
});`}
                  </pre>
                </div>

                <div>
                  <Label>2. Create RepID</Label>
                  <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto mt-2">
{`const repid = await sdk.createRepID({
  wallet: '0x...',
  scores: [
    { category: 'governance', score: 750 },
    { category: 'technical', score: 850 },
    { category: 'community', score: 650 }
  ],
  mockMode: true // Remove for production
});

console.log('RepID created:', repid.totalScore);`}
                  </pre>
                </div>

                <div>
                  <Label>3. Verify Threshold</Label>
                  <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto mt-2">
{`// Verify user meets threshold without revealing exact score
const verified = await sdk.verifyRepID({
  wallet: '0x...',
  threshold: 800,
  category: 'governance' // Optional
});

if (verified) {
  console.log('User qualified for governance role!');
}`}
                  </pre>
                </div>

                <div>
                  <Label>4. Batch Verification</Label>
                  <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto mt-2">
{`// Verify multiple users efficiently
const results = await sdk.batchVerifyRepIDs([
  { wallet: '0x...', threshold: 500 },
  { wallet: '0x...', threshold: 800, category: 'technical' }
]);

// Results: [true, false] - boolean array`}
                  </pre>
                </div>

                <div>
                  <Label>5. Get Gas Estimates</Label>
                  <pre className="bg-muted p-3 rounded-lg text-sm overflow-x-auto mt-2">
{`const gasEstimate = await sdk.estimateGasCosts('create');

console.log(\`Creating RepID will cost ~\${gasEstimate.costUSD}\`);`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}