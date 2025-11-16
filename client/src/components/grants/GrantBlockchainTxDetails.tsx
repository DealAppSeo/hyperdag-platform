import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Define interface for blockchain transaction
export interface BlockchainTransaction {
  txHash: string;
  network: string;
  operation: string;
  status: string;
  timestamp: string;
  gasUsed?: number;
  amount?: string;
  tokenSymbol?: string;
  ipfsHash?: string;
  zkProof?: {
    verifierContract: string;
    publicInputs: string[];
    proof: string;
  };
}

interface GrantBlockchainTxDetailsProps {
  transaction: BlockchainTransaction;
  expanded?: boolean;
  onToggle?: (txHash: string) => void;
}

export function GrantBlockchainTxDetails({ 
  transaction, 
  expanded = false, 
  onToggle 
}: GrantBlockchainTxDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(expanded);

  // Format a blockchain address for display
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format a timestamp for display
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (onToggle) {
      onToggle(transaction.txHash);
    }
  };

  const getExplorerUrl = (network: string, txHash: string) => {
    // Return appropriate block explorer URL based on network
    switch (network.toLowerCase()) {
      case 'polygon':
      case 'polygon zkevm':
        return `https://cardona-zkevm.polygonscan.com/tx/${txHash}`;
      case 'solana':
        return `https://explorer.solana.com/tx/${txHash}?cluster=devnet`;
      case 'iota':
        return `https://explorer.iota.org/testnet/message/${txHash}`;
      default:
        return null;
    }
  };

  return (
    <Collapsible 
      open={isExpanded} 
      onOpenChange={handleToggle}
      className="border rounded-md mb-3 overflow-hidden"
    >
      <CollapsibleTrigger className="w-full">
        <div className="p-3 bg-muted flex items-center justify-between cursor-pointer hover:bg-muted/80 transition-colors">
          <div className="flex items-center">
            <Badge 
              variant="outline"
              className="mr-3 text-xs"
            >
              {transaction.network}
            </Badge>
            <span className="font-medium">{transaction.operation}</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CollapsibleTrigger>
              
      <CollapsibleContent>
        <div className="p-3 text-sm space-y-2 bg-background">
          <div className="flex items-center justify-between">
            <p className="font-medium">Transaction</p>
            {getExplorerUrl(transaction.network, transaction.txHash) && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a 
                      href={getExplorerUrl(transaction.network, transaction.txHash) || '#'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary/80"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>View on Block Explorer</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <p><code className="text-xs bg-muted rounded px-1 py-0.5">{transaction.txHash}</code></p>
          <p><span className="font-medium">Status:</span> {transaction.status}</p>
          <p><span className="font-medium">Timestamp:</span> {formatTimestamp(transaction.timestamp)}</p>
          
          {transaction.gasUsed && (
            <p><span className="font-medium">Gas Used:</span> {transaction.gasUsed.toLocaleString()}</p>
          )}

          {transaction.amount && (
            <p><span className="font-medium">Amount:</span> {transaction.amount} {transaction.tokenSymbol}</p>
          )}
          
          {transaction.ipfsHash && (
            <p><span className="font-medium">IPFS:</span> <code className="text-xs bg-muted rounded px-1 py-0.5">{transaction.ipfsHash}</code></p>
          )}
          
          {transaction.zkProof && (
            <div className="space-y-1 mt-3 pt-3 border-t">
              <p className="font-medium">Zero-Knowledge Proof</p>
              <div className="bg-muted p-2 rounded-md">
                <p><span className="font-medium text-xs">Public Inputs:</span> {transaction.zkProof.publicInputs.join(', ')}</p>
                <p><span className="font-medium text-xs">Verifier:</span> {formatAddress(transaction.zkProof.verifierContract)}</p>
                <p>
                  <span className="font-medium text-xs">Proof:</span> 
                  <code className="text-[10px] break-all block mt-1">
                    {`${transaction.zkProof.proof.substring(0, 20)}...${transaction.zkProof.proof.substring(transaction.zkProof.proof.length - 20)}`}
                  </code>
                </p>
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}