import React from 'react';
import { useGrantRanking } from './GrantRankingAlgorithm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Calendar, DollarSign, ArrowUp, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import SimilarRfiModal from './SimilarRfiModal';

export function RankedGrantsList() {
  const { 
    rankedGrants, 
    isLoading, 
    isGeneratingRfi,
    generatedRfis,
    generateRfi,
    generateTopRfis,
    // Add the similar RFI modal properties
    isSimilarRfiModalOpen,
    setIsSimilarRfiModalOpen,
    similarRfis,
    handleJoinExisting,
    handleSubmitAnyway,
    currentRfiData,
    currentGrant
  } = useGrantRanking();

  // Format currency for display
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return 'Funding amount not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format deadline with visual indicator based on urgency
  const renderDeadline = (daysLeft: number | null, deadline: string | null) => {
    if (!deadline) return <span className="text-muted-foreground">No deadline specified</span>;
    
    const deadlineDate = new Date(deadline);
    const formattedDate = format(deadlineDate, 'PPP');
    
    if (daysLeft === null) return <span>{formattedDate}</span>;
    
    if (daysLeft < 0) {
      return (
        <span className="flex items-center text-destructive">
          <AlertTriangle className="h-4 w-4 mr-1" />
          {formattedDate} (Expired)
        </span>
      );
    } else if (daysLeft <= 7) {
      return (
        <span className="flex items-center text-destructive">
          <Clock className="h-4 w-4 mr-1" />
          {formattedDate} ({daysLeft} days left - Urgent!)
        </span>
      );
    } else if (daysLeft <= 30) {
      return (
        <span className="flex items-center text-warning">
          <Clock className="h-4 w-4 mr-1" />
          {formattedDate} ({daysLeft} days left)
        </span>
      );
    } else {
      return (
        <span className="flex items-center">
          <Calendar className="h-4 w-4 mr-1" />
          {formattedDate} ({daysLeft} days left)
        </span>
      );
    }
  };

  // Check if an RFI has already been generated for a grant
  const isRfiGenerated = (grantId: number) => {
    return generatedRfis.some(rfi => rfi.title.includes(String(grantId)));
  };

  return (
    <div className="space-y-6">
      {/* Modal for similar RFIs */}
      {currentRfiData && currentGrant && (
        <SimilarRfiModal
          isOpen={isSimilarRfiModalOpen}
          onClose={() => setIsSimilarRfiModalOpen(false)}
          similarRfis={similarRfis}
          originalTitle={currentRfiData.title}
          originalData={currentRfiData}
          onJoinExisting={handleJoinExisting}
          onSubmitAnyway={handleSubmitAnyway}
        />
      )}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Ranked Grant Opportunities</h2>
          <p className="text-muted-foreground">
            Grant opportunities ranked by deadline proximity, funding amount, and mission alignment
          </p>
        </div>
        <Button 
          onClick={generateTopRfis} 
          className="mt-4 md:mt-0"
          disabled={isLoading || isGeneratingRfi}
        >
          {isGeneratingRfi ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating RFIs...
            </>
          ) : (
            <>Generate RFIs for Top 3 Opportunities</>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Analyzing grant opportunities...</span>
        </div>
      ) : rankedGrants.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {rankedGrants.map((grant, index) => (
            <Card key={grant.id} className={`h-full flex flex-col ${index < 3 ? 'border-primary/50 shadow-md' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-xl">{grant.name}</CardTitle>
                  <Badge variant={index < 3 ? "default" : "outline"} className="ml-2">
                    {index < 3 ? `Top ${index + 1}` : `Rank ${index + 1}`}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {grant.categories.map((category) => (
                    <Badge key={category} variant="secondary" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                </div>
                <CardDescription className="mt-2 flex items-center">
                  <ArrowUp className="h-4 w-4 mr-1 text-primary" />
                  Score: {grant.score} points
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground mb-4">{grant.description}</p>
                
                <div className="space-y-2 text-sm">
                  {/* Deadline information with visual urgency indicators */}
                  <div className="flex items-start">
                    <span className="font-medium w-24">Deadline:</span>
                    <span>
                      {renderDeadline(grant.deadlineDaysLeft, grant.applicationDeadline)}
                    </span>
                  </div>
                  
                  {/* Funding amount */}
                  {grant.availableFunds && (
                    <div className="flex items-start">
                      <span className="font-medium w-24">Funding:</span>
                      <span className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {formatCurrency(grant.availableFunds)}
                      </span>
                    </div>
                  )}
                  
                  {/* Contact information */}
                  {grant.contactEmail && (
                    <div className="flex items-start">
                      <span className="font-medium w-24">Contact:</span>
                      <span>{grant.contactEmail}</span>
                    </div>
                  )}
                </div>

                {/* Ranking reasons */}
                {grant.reasons && grant.reasons.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold mb-2">Ranking Factors:</h4>
                    <ul className="text-sm space-y-1">
                      {grant.reasons.map((reason, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="text-primary mr-2">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="pt-0 flex flex-wrap gap-2">
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
                    Apply Directly
                  </Button>
                )}
                
                {/* Generate RFI button */}
                <Button 
                  variant={isRfiGenerated(grant.id) ? "outline" : "default"}
                  size="sm"
                  disabled={isGeneratingRfi || isRfiGenerated(grant.id)}
                  onClick={() => generateRfi(grant)}
                >
                  {isRfiGenerated(grant.id) ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      RFI Generated
                    </>
                  ) : isGeneratingRfi ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    'Create RFI'
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <p className="text-muted-foreground">No grant opportunities found. Check back later or adjust search criteria.</p>
        </div>
      )}
    </div>
  );
}
