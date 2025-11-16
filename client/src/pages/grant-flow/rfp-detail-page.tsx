import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { UltraSimpleGrantSearch } from '@/components/grants/UltraSimpleGrantSearch';
import { Loader2, ArrowLeft, Calendar, Users, DollarSign } from 'lucide-react';
import { Link } from 'wouter';

export default function RfpDetailPage() {
  const { id } = useParams();
  const rfpId = parseInt(id || '0');

  // Type definition for RFP data
  type RfpData = {
    id: number;
    title: string;
    description: string;
    category: string;
    status: string;
    fundingGoal: number;
    timeline: string;
    teamSize: number;
    skillsRequired: string[];
    deliverables: string[];
    currentFunding: number;
    externalFunding: boolean;
    externalFundingSource: string;
    externalFundingAmount: number;
    funders: Array<{id: number; username: string; amount: number}>;
    submitter: {
      id: number;
      username: string;
      walletAddress: string;
      reputationScore: number;
    };
    createdAt: string;
    votes: number;
  };

  // Fetch RFP data
  const { data: rfpData, isLoading: isLoadingRfp } = useQuery<RfpData>({ 
    queryKey: [`/api/grant-flow/rfps/${rfpId}`],
    enabled: !isNaN(rfpId)
  });

  if (isNaN(rfpId)) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">Invalid RFP ID</h1>
        <p className="mt-2">Please go back and select a valid RFP.</p>
        <Button asChild className="mt-4">
          <Link to="/grant-flow/rfps">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to RFPs
          </Link>
        </Button>
      </div>
    );
  }

  if (isLoadingRfp) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <h2 className="text-xl font-semibold">Loading RFP Details...</h2>
        </div>
      </div>
    );
  }

  if (!rfpData) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold tracking-tight">RFP Not Found</h1>
        <p className="mt-2">The requested RFP could not be found.</p>
        <Button asChild className="mt-4">
          <Link to="/grant-flow/rfps">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to RFPs
          </Link>
        </Button>
      </div>
    );
  }

  const rfp = rfpData;
  
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button variant="outline" size="sm" asChild className="mr-4">
          <Link to="/grant-flow/rfps">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">{rfp.title}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Request for Proposal</CardTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge>{rfp.category}</Badge>
                <Badge variant="outline">{rfp.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium">Description</h3>
                  <p className="mt-1 text-sm">{rfp.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Funding Goal</div>
                      <div className="font-medium">${rfp.fundingGoal.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Timeline</div>
                      <div className="font-medium">{rfp.timeline} days</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-muted-foreground" />
                    <div>
                      <div className="text-sm text-muted-foreground">Team Size</div>
                      <div className="font-medium">{rfp.teamSize} people</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium">Skills Required</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {rfp.skillsRequired.map((skill) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium">Deliverables</h3>
                  <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                    {rfp.deliverables.map((deliverable, index) => (
                      <li key={index}>{deliverable}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="grant-matches">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="grant-matches">Grant Matches</TabsTrigger>
              <TabsTrigger value="proposals">Proposals</TabsTrigger>
              <TabsTrigger value="funders">Funding</TabsTrigger>
            </TabsList>
            <TabsContent value="grant-matches" className="mt-4">
              <UltraSimpleGrantSearch 
                rfpId={rfpId}
              />
            </TabsContent>
            <TabsContent value="proposals" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Proposals</CardTitle>
                  <CardDescription>
                    View and manage proposals submitted for this RFP
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    No proposals have been submitted yet
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="funders" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Funding Status</CardTitle>
                  <CardDescription>
                    Current funding status and contributors
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium">Funding Progress</h3>
                      <div className="mt-2 w-full bg-muted rounded-full h-2.5">
                        <div 
                          className="bg-primary h-2.5 rounded-full" 
                          style={{ width: `${Math.min(100, (rfp.currentFunding / rfp.fundingGoal) * 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between mt-1 text-sm">
                        <span>${rfp.currentFunding.toLocaleString()} raised</span>
                        <span>${rfp.fundingGoal.toLocaleString()} goal</span>
                      </div>
                    </div>

                    {rfp.externalFunding && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <h3 className="font-medium">External Funding Secured!</h3>
                        <p className="text-sm mt-1">
                          This project has secured external funding from {rfp.externalFundingSource}.
                          {rfp.externalFundingAmount && (
                            <span> Amount: ${rfp.externalFundingAmount.toLocaleString()}</span>
                          )}
                        </p>
                      </div>
                    )}

                    {rfp.funders && rfp.funders.length > 0 ? (
                      <div>
                        <h3 className="text-sm font-medium mb-2">Contributors</h3>
                        <div className="space-y-2">
                          {rfp.funders.map((funder) => (
                            <div key={funder.id} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                              <div className="font-medium">{funder.username}</div>
                              <div>${funder.amount.toLocaleString()}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No contributors yet
                      </div>
                    )}
                    
                    <Button className="w-full mt-4">Fund This Project</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About the Submitter</CardTitle>
            </CardHeader>
            <CardContent>
              {rfp.submitter ? (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {rfp.submitter.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3">
                      <div className="font-medium">{rfp.submitter.username}</div>
                      <div className="text-sm text-muted-foreground">
                        Reputation: {rfp.submitter.reputationScore || 0}
                      </div>
                    </div>
                  </div>
                  
                  {rfp.submitter.persona && (
                    <div>
                      <span className="text-sm text-muted-foreground">Persona: </span>
                      <Badge 
                        className={`
                          ${rfp.submitter.persona === 'developer' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' : ''}
                          ${rfp.submitter.persona === 'designer' ? 'bg-orange-100 text-orange-800 hover:bg-orange-100' : ''}
                          ${rfp.submitter.persona === 'influencer' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}
                        `}
                        variant="outline"
                      >
                        {rfp.submitter.persona.charAt(0).toUpperCase() + rfp.submitter.persona.slice(1)}
                      </Badge>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-muted-foreground">Submitter information not available</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>RFP Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Created</div>
                  <div>{new Date(rfp.createdAt).toLocaleDateString()} - {new Date(rfp.createdAt).toLocaleTimeString()}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">ID</div>
                  <div>{rfp.id}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Status</div>
                  <div className="capitalize">{rfp.status}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Votes</div>
                  <div>{rfp.votes || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
