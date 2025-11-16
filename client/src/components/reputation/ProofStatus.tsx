import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, Copy, ExternalLink } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type ProofStatus = 'pending' | 'verified' | 'invalid' | 'expired';

interface ProofStatusCardProps {
  proof: {
    id: string;
    type: string;
    status: ProofStatus;
    createdAt: string;
    expiresAt?: string;
    publicInputs: {
      minScore?: number;
      maxScore?: number;
      attributes?: string[];
      [key: string]: any;
    };
  };
  onVerify?: (proofId: string) => Promise<void>;
}

export function ProofStatusCard({ proof, onVerify }: ProofStatusCardProps) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard",
        description: "Proof ID has been copied to your clipboard.",
      });
    });
  };

  const statusConfig = {
    pending: {
      icon: <Clock className="h-4 w-4" />,
      color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
      text: "Pending Verification"
    },
    verified: {
      icon: <CheckCircle className="h-4 w-4" />,
      color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      text: "Verified"
    },
    invalid: {
      icon: <XCircle className="h-4 w-4" />,
      color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      text: "Invalid"
    },
    expired: {
      icon: <XCircle className="h-4 w-4" />,
      color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
      text: "Expired"
    }
  };

  const config = statusConfig[proof.status];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  const handleVerify = async () => {
    if (onVerify) {
      try {
        await onVerify(proof.id);
        toast({
          title: "Verification initiated",
          description: "The proof verification process has started.",
        });
      } catch (error) {
        toast({
          title: "Verification failed",
          description: error instanceof Error ? error.message : "An error occurred during verification",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{proof.type} Proof</CardTitle>
            <CardDescription className="flex items-center mt-1">
              <span className="text-xs font-mono truncate max-w-[120px] sm:max-w-[200px]">
                {proof.id.substring(0, 8)}...{proof.id.substring(proof.id.length - 4)}
              </span>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 ml-1"
                onClick={() => copyToClipboard(proof.id)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </CardDescription>
          </div>
          <Badge 
            className={config.color}
            variant="outline"
          >
            <span className="flex items-center">
              {config.icon}
              <span className="ml-1">{config.text}</span>
            </span>
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Created:</span>
            <span>{formatDate(proof.createdAt)}</span>
          </div>
          {proof.expiresAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expires:</span>
              <span>{formatDate(proof.expiresAt)}</span>
            </div>
          )}
          {proof.publicInputs.minScore !== undefined && proof.publicInputs.maxScore !== undefined && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reputation Range:</span>
              <span>{proof.publicInputs.minScore} - {proof.publicInputs.maxScore}</span>
            </div>
          )}
          {proof.publicInputs.attributes && proof.publicInputs.attributes.length > 0 && (
            <div className="pt-2">
              <span className="text-muted-foreground block mb-1">Disclosed Attributes:</span>
              <div className="flex flex-wrap gap-1">
                {proof.publicInputs.attributes.map((attr, idx) => (
                  <Badge variant="secondary" key={idx}>{attr}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <div className="flex w-full justify-between">
          {proof.status === 'pending' && onVerify ? (
            <Button 
              size="sm" 
              variant="default"
              onClick={handleVerify}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Verify Proof
            </Button>
          ) : (
            <div></div>
          )}
          <Button 
            size="sm"
            variant="outline"
            className="ml-auto"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Share Link
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
