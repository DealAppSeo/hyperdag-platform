import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, DollarSign, ExternalLink, FileText, CheckCircle2, Star, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import GrantToRfiConverter from './GrantToRfiConverter';
import { useQueryClient } from '@tanstack/react-query';
import { ThumbsUpWithPurposeHub } from '@/components/common/ThumbsUpWithPurposeHub';

type GrantCardProps = {
  grant: {
    id: number;
    name: string;
    description: string;
    availableFunds: number | null;
    applicationDeadline: string | null;
    website?: string;
    applicationUrl?: string;
    contactEmail?: string;
    categories: string[];
    eligibilityCriteria?: string[];
  };
  convertedRfis: Array<{ id: number; title: string }>;
  onRfiCreated: (rfiId: number) => void;
  isPrioritized?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (selected: boolean) => void;
};

export default function GrantCard({ 
  grant, 
  convertedRfis, 
  onRfiCreated,
  isPrioritized = false,
  isSelected = false,
  onSelectionChange
}: GrantCardProps) {
  const [showConverter, setShowConverter] = useState(false);
  const queryClient = useQueryClient();
  
  // Format currency for display
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Funding amount not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Check if an RFI has already been generated for this grant
  const isRfiGenerated = () => {
    return convertedRfis.some(rfi => rfi.title.includes(String(grant.id)) || 
                              rfi.title.includes(grant.name.substring(0, 10)));
  };
  
  // Extract the first generated RFI for this grant (if any)
  const getGeneratedRfiId = () => {
    const matchingRfi = convertedRfis.find(rfi => 
      rfi.title.includes(String(grant.id)) || rfi.title.includes(grant.name.substring(0, 10)));
    return matchingRfi?.id;
  };
  
  // Handle conversion completion
  const handleConversionComplete = (rfiId: number) => {
    queryClient.invalidateQueries({ queryKey: ["/api/grant-flow/rfis"] });
    onRfiCreated(rfiId);
  };
  
  // Format the deadline with visual urgency indicators
  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return 'No deadline specified';
    
    const deadlineDate = new Date(deadline);
    const formattedDate = format(deadlineDate, 'PPP');
    const daysLeft = Math.ceil((deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) {
      return `${formattedDate} (Expired)`;
    } else if (daysLeft <= 7) {
      return `${formattedDate} (${daysLeft} days left - Urgent!)`;
    } else if (daysLeft <= 30) {
      return `${formattedDate} (${daysLeft} days left)`;
    } else {
      return `${formattedDate} (${daysLeft} days left)`;
    }
  };
  
  return (
    <>
      <Card className={`h-full flex flex-col ${isPrioritized ? 'ring-1 ring-primary/30' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start mb-1">
            <div className="flex flex-wrap gap-1">
              {grant.categories.map((category) => (
                <Badge key={category} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {isPrioritized && (
                <Badge variant="default" className="flex items-center gap-1">
                  <Star className="h-3 w-3" /> Top Match
                </Badge>
              )}
              {onSelectionChange && (
                <div 
                  className="flex items-center justify-center h-5 w-5 rounded-full border border-primary/30 cursor-pointer"
                  onClick={() => onSelectionChange?.(!isSelected)}
                >
                  {isSelected ? <CheckCircle className="h-4 w-4 text-primary" /> : null}
                </div>
              )}
            </div>
          </div>
          <CardTitle className="text-lg">{grant.name}</CardTitle>
          <CardDescription className="line-clamp-2">
            {grant.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex-1 py-2">
          <div className="space-y-2 text-sm">
            {/* Funding amount */}
            {grant.availableFunds !== null && (
              <div className="flex items-start">
                <DollarSign className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                <span>{formatCurrency(grant.availableFunds)}</span>
              </div>
            )}
            
            {/* Application deadline */}
            {grant.applicationDeadline && (
              <div className="flex items-start">
                <Calendar className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                <span>{formatDeadline(grant.applicationDeadline)}</span>
              </div>
            )}
            
            {/* Contact email */}
            {grant.contactEmail && (
              <div className="flex items-start overflow-hidden text-ellipsis">
                <span className="font-medium mr-2">Contact:</span>
                <span className="truncate">{grant.contactEmail}</span>
              </div>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-wrap gap-2 pt-2">
          {/* Thumbs Up with Purpose Hub */}
          <ThumbsUpWithPurposeHub
            item={{
              id: grant.id,
              name: grant.name,
              description: grant.description,
              category: grant.categories?.[0]
            }}
            sourceType="grant"
            size="sm"
          />
          
          {/* Website link */}
          {grant.website && (
            <Button variant="outline" size="sm" onClick={() => window.open(grant.website, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              Website
            </Button>
          )}
          
          {/* Application link */}
          {grant.applicationUrl && (
            <Button variant="outline" size="sm" onClick={() => window.open(grant.applicationUrl, '_blank')}>
              <FileText className="h-4 w-4 mr-2" />
              Apply Directly
            </Button>
          )}
          
          {/* Convert to RFI button */}
          <Button 
            variant={isRfiGenerated() ? "outline" : "default"}
            size="sm"
            onClick={() => setShowConverter(true)}
            disabled={isRfiGenerated()}
            className="ml-auto"
          >
            {isRfiGenerated() ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                RFI Created
              </>
            ) : (
              'Convert to RFI'
            )}
          </Button>
        </CardFooter>
      </Card>
      
      {/* RFI Converter Modal */}
      {showConverter && (
        <GrantToRfiConverter
          grant={grant}
          isOpen={showConverter}
          onClose={() => setShowConverter(false)}
          onConversionComplete={handleConversionComplete}
        />
      )}
    </>
  );
}
