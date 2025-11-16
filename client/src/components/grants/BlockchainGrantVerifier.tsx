import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ShieldCheck, ShieldAlert, ChevronDown, ChevronUp, Globe, CheckCircle } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type BlockchainGrantVerifierProps = {
  rfpId: number;
  rfpData: {
    title: string;
    description: string;
    categories: string[];
  };
};

export function BlockchainGrantVerifier({ rfpId, rfpData }: BlockchainGrantVerifierProps) {
  const { toast } = useToast();
  const [results, setResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const [isOpened, setIsOpened] = useState(false);

  // State to control sections visibility
  const [sectionsOpen, setSectionsOpen] = useState({
    contract: false,
    transactions: false,
    matches: false,
  });

  const toggleSection = (section: keyof typeof sectionsOpen) => {
    setSectionsOpen(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Toggle transaction details visibility
  const toggleTransaction = (txHash: string) => {
    setExpandedTx(expandedTx === txHash ? null : txHash);
  };

  // Blockchain verification mutation
  const verifyOnBlockchain = useMutation({
    mutationFn: async () => {
      try {
        setIsOpened(true);
        
        // Try the actual blockchain verification first with a real transaction
        try {
          // For this component, we'll directly use the test integration for demonstration
          // In production, this would call verify-grant-match with specific matches
          const response = await apiRequest('POST', `/api/grants/blockchain/test-blockchain-integration`, {
            rfpId
          });
          
          const result = await response.json();
          console.log('Blockchain verification result:', result);
          
          if (!result.success) {
            throw new Error(result.message || 'Failed to verify on blockchain');
          }
          
          return result.data;
        } catch (error) {
          console.error('Error with blockchain verification:', error);
          throw error;
        }
      } catch (error) {
        console.error('Error verifying on blockchain:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      setResults(data);
      toast({
        title: 'Blockchain Verification Complete',
        description: 'Grant opportunities have been verified on the blockchain.',
      });
      // Open all sections automatically when results are received
      setSectionsOpen({
        contract: true,
        transactions: true,
        matches: true,
      });
    },
    onError: (error: any) => {
      console.error('Verification failed:', error);
      toast({
        title: 'Verification Failed',
        description: error.message || 'Could not complete blockchain verification',
        variant: 'destructive'
      });
    }
  });

  // Format a blockchain address for display
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format a timestamp for display
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <Card className={isOpened ? '' : 'border-dashed border-2'}>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShieldCheck className="h-5 w-5 mr-2 text-primary" />
            Blockchain Grant Verification
          </CardTitle>
          <CardDescription>
            Verify grant opportunities on-chain with zero-knowledge proofs
          </CardDescription>
        </CardHeader>
        
        {!isOpened ? (
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Blockchain verification provides cryptographic proof of grant matching criteria and potential funding allocations
              for your RFP. This provides enhanced trust and transparency in the grant matching process.
            </p>
            <Button 
              onClick={() => verifyOnBlockchain.mutate()}
              disabled={verifyOnBlockchain.isPending}
            >
              {verifyOnBlockchain.isPending && 
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              }
              Verify on Blockchain
            </Button>
          </CardContent>
        ) : (
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="technical">Technical Details</TabsTrigger>
                <TabsTrigger value="matches">Verified Matches</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="p-4 pt-6">
                {!results ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-center text-muted-foreground">
                      Verifying grant opportunities on the blockchain...
                    </p>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      This process may take up to 10 seconds to complete
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Verification Status</h3>
                        <div className="flex items-center mt-1">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                          <span className="text-green-500 font-medium">Verified On-Chain</span>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                        {results.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="bg-muted rounded-lg p-3">
                        <p className="text-sm font-medium mb-1">RFP</p>
                        <p className="text-sm">{results.rfpTitle}</p>
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <p className="text-sm font-medium mb-1">Verification Time</p>
                        <p className="text-sm">{formatTimestamp(results.testTimestamp)}</p>
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <p className="text-sm font-medium mb-1">Networks</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {Array.from(new Set(results.transactions.map((tx: any) => tx.network))).map((network) => (
                            <Badge key={String(network)} variant="outline">
                              {String(network)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <p className="text-sm font-medium mb-1">Matches Found</p>
                        <p className="text-sm">{results.matchedSources.length} verified grant matches</p>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="technical" className="space-y-4 p-4 pt-6">
                {!results ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* Contract Deployment Section */}
                    <Collapsible 
                      open={sectionsOpen.contract}
                      onOpenChange={() => toggleSection('contract')}
                      className="border rounded-md"
                    >
                      <CollapsibleTrigger className="flex w-full items-center justify-between p-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                            <Globe className="h-4 w-4 text-primary" />
                          </div>
                          <h3 className="font-medium">Grant Registry Contract</h3>
                        </div>
                        {sectionsOpen.contract ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-4 pb-4">
                        <div className="bg-muted rounded-lg p-3 space-y-2 text-sm">
                          {results.transactions.filter((tx: any) => tx.operation.includes('Deploy')).map((tx: any) => (
                            <div key={tx.txHash} className="space-y-1">
                              <p><span className="font-medium">Contract:</span> {tx.operation}</p>
                              <p><span className="font-medium">Network:</span> {tx.network}</p>
                              <p><span className="font-medium">Transaction:</span> <code className="text-xs bg-background rounded px-1 py-0.5">{formatAddress(tx.txHash)}</code></p>
                              <p><span className="font-medium">Gas Used:</span> {tx.gasUsed?.toLocaleString() || 'N/A'}</p>
                              <p><span className="font-medium">Timestamp:</span> {formatTimestamp(tx.timestamp)}</p>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                    
                    {/* Transactions Section */}
                    <Collapsible 
                      open={sectionsOpen.transactions}
                      onOpenChange={() => toggleSection('transactions')}
                      className="border rounded-md"
                    >
                      <CollapsibleTrigger className="flex w-full items-center justify-between p-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                            <ShieldCheck className="h-4 w-4 text-primary" />
                          </div>
                          <h3 className="font-medium">Verification Transactions</h3>
                        </div>
                        {sectionsOpen.transactions ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-4 pb-4">
                        <div className="space-y-3">
                          {results.transactions.filter((tx: any) => !tx.operation.includes('Deploy')).map((tx: any) => (
                            <div 
                              key={tx.txHash} 
                              className="border rounded-md overflow-hidden"
                            >
                              <div 
                                className="p-3 bg-muted flex items-center justify-between cursor-pointer"
                                onClick={() => toggleTransaction(tx.txHash)}
                              >
                                <div className="flex items-center">
                                  <Badge 
                                    variant="outline"
                                    className="mr-3 text-xs"
                                  >
                                    {tx.network}
                                  </Badge>
                                  <span className="font-medium">{tx.operation}</span>
                                </div>
                                {expandedTx === tx.txHash ? (
                                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                              
                              {expandedTx === tx.txHash && (
                                <div className="p-3 text-sm space-y-2 bg-background">
                                  <p><span className="font-medium">Transaction:</span> <code className="text-xs bg-muted rounded px-1 py-0.5">{tx.txHash}</code></p>
                                  <p><span className="font-medium">Status:</span> {tx.status}</p>
                                  <p><span className="font-medium">Timestamp:</span> {formatTimestamp(tx.timestamp)}</p>
                                  
                                  {tx.amount && (
                                    <p><span className="font-medium">Amount:</span> {tx.amount} {tx.tokenSymbol}</p>
                                  )}
                                  
                                  {tx.ipfsHash && (
                                    <p><span className="font-medium">IPFS:</span> <code className="text-xs bg-muted rounded px-1 py-0.5">{tx.ipfsHash}</code></p>
                                  )}
                                  
                                  {tx.zkProof && (
                                    <div className="space-y-1">
                                      <p className="font-medium">Zero-Knowledge Proof:</p>
                                      <div className="bg-muted p-2 rounded-md">
                                        <p><span className="font-medium text-xs">Public Inputs:</span> {tx.zkProof.publicInputs.join(', ')}</p>
                                        <p><span className="font-medium text-xs">Verifier:</span> {formatAddress(tx.zkProof.verifierContract)}</p>
                                        <p><span className="font-medium text-xs">Proof:</span> <code className="text-[10px] break-all">{`${tx.zkProof.proof.substring(0, 20)}...${tx.zkProof.proof.substring(tx.zkProof.proof.length - 20)}`}</code></p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="matches" className="space-y-4 p-4 pt-6">
                {!results ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <>
                    <Collapsible 
                      open={sectionsOpen.matches}
                      onOpenChange={() => toggleSection('matches')}
                      className="border rounded-md"
                    >
                      <CollapsibleTrigger className="flex w-full items-center justify-between p-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-3">
                            <CheckCircle className="h-4 w-4 text-primary" />
                          </div>
                          <h3 className="font-medium">Verified Grant Matches</h3>
                        </div>
                        {sectionsOpen.matches ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="px-4 pb-4">
                        <div className="space-y-4">
                          {results.matchedSources.map((match: any, index: number) => (
                            <Card key={match.grantSourceId || index} className="overflow-hidden">
                              <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                  <CardTitle className="text-base">
                                    Grant Source #{match.grantSourceId}
                                  </CardTitle>
                                  <Badge className="bg-green-100 text-green-800">
                                    {Math.round(parseFloat(match.matchScore) * 100)}% Match
                                  </Badge>
                                </div>
                                <CardDescription>{match.matchReason}</CardDescription>
                              </CardHeader>
                              <CardContent className="pb-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <p className="font-medium">Network</p>
                                    <p>{match.network}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium">Potential Funding</p>
                                    <p>${match.potentialFunding?.toLocaleString() || 'Unknown'}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium">Contract Address</p>
                                    <code className="text-xs bg-muted rounded px-1 py-0.5">{formatAddress(match.contractAddress)}</code>
                                  </div>
                                  <div>
                                    <p className="font-medium">Lock Period</p>
                                    <p>{match.lockPeriodDays} days</p>
                                  </div>
                                </div>
                                {match.zkVerified && (
                                  <div className="mt-3 bg-primary/5 p-2 rounded-md flex items-center text-xs">
                                    <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                                    <span>Verified with zero-knowledge proof</span>
                                  </div>
                                )}
                              </CardContent>
                              <CardFooter className="bg-muted py-2">
                                <span className="text-xs text-muted-foreground">
                                  Vesting: {match.vestingSchedule}
                                </span>
                              </CardFooter>
                            </Card>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>
    </div>
  );
}