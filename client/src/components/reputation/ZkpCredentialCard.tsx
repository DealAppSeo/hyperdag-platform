import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ZkpCredentialCardProps {
  credential: {
    id: number;
    type: string;
    name: string;
    issuer?: string;
    issuedDate?: string;
    credential: string;
    isPublic: boolean;
  };
  onCreateProof: (credentialId: string, attributes: string[]) => void;
}

export function ZkpCredentialCard({ credential, onCreateProof }: ZkpCredentialCardProps) {
  const [isPublic, setIsPublic] = useState(credential.isPublic);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);
  const [availableAttributes, setAvailableAttributes] = useState<string[]>([
    'level', 'score', 'issueDate', 'skills', 'experience'
  ]);  // This would normally come from the credential metadata

  const togglePublic = async () => {
    setIsUpdating(true);
    
    try {
      // This would normally update the credential's public status
      await apiRequest('PATCH', `/api/reputation/credential/${credential.id}`, {
        isPublic: !isPublic
      });
      
      setIsPublic(!isPublic);
      toast({
        title: "Credential updated",
        description: `Credential is now ${!isPublic ? 'public' : 'private'}.`,
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleAttribute = (attribute: string) => {
    if (selectedAttributes.includes(attribute)) {
      setSelectedAttributes(selectedAttributes.filter(a => a !== attribute));
    } else {
      setSelectedAttributes([...selectedAttributes, attribute]);
    }
  };

  const handleCreateProof = () => {
    if (selectedAttributes.length === 0) {
      toast({
        title: "No attributes selected",
        description: "Please select at least one attribute to include in your proof.",
        variant: "destructive",
      });
      return;
    }
    
    onCreateProof(credential.credential, selectedAttributes);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{credential.name}</CardTitle>
            <CardDescription>
              {credential.type} {credential.issuer && `· ${credential.issuer}`}
            </CardDescription>
          </div>
          <Badge variant={isPublic ? "default" : "outline"}>
            {isPublic ? (
              <>
                <Eye className="w-3 h-3 mr-1" /> Public
              </>
            ) : (
              <>
                <EyeOff className="w-3 h-3 mr-1" /> Private
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="text-sm space-y-2">
          {credential.issuedDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Issued:</span>
              <span>{formatDate(credential.issuedDate)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Credential ID:</span>
            <span className="text-xs font-mono truncate max-w-[180px]">
              {credential.credential.substring(0, 10)}...
            </span>
          </div>
        </div>

        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2">Select attributes to disclose:</h4>
          <div className="space-y-2">
            {availableAttributes.map((attribute) => (
              <div key={attribute} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={`attr-${credential.id}-${attribute}`}
                  checked={selectedAttributes.includes(attribute)}
                  onChange={() => toggleAttribute(attribute)}
                  className="rounded-sm"
                />
                <label 
                  htmlFor={`attr-${credential.id}-${attribute}`}
                  className="text-sm cursor-pointer"
                >
                  {attribute}
                </label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between pt-2">
        <div className="flex items-center space-x-2">
          <Switch 
            id={`public-switch-${credential.id}`}
            checked={isPublic}
            onCheckedChange={togglePublic}
            disabled={isUpdating}
          />
          <Label htmlFor={`public-switch-${credential.id}`} className="text-sm">
            {isPublic ? 'Public' : 'Private'}
          </Label>
        </div>
        <Button 
          size="sm" 
          variant="secondary" 
          onClick={handleCreateProof}
          disabled={selectedAttributes.length === 0}
        >
          <ShieldCheck className="w-4 h-4 mr-2" />
          Create ZK Proof
        </Button>
      </CardFooter>
    </Card>
  );
}
