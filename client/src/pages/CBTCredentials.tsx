import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { 
  Building2, 
  Heart, 
  TrendingUp, 
  Shield, 
  FileText, 
  Users, 
  Search,
  Award,
  CheckCircle,
  AlertCircle,
  Star
} from 'lucide-react';

interface CBTCredential {
  id: number;
  charityId: number;
  tokenId: string;
  contractAddress: string;
  chainId: number;
  accountabilityRating: number;
  transparencyRating: number;
  financialEfficiencyRating: number;
  impactRating: number;
  overallRating: number;
  programExpenseRatio: string;
  adminExpenseRatio: string;
  fundraisingExpenseRatio: string;
  totalRevenue: number;
  totalExpenses: number;
  form990Filed: boolean;
  auditedFinancials: boolean;
  boardGovernance: boolean;
  conflictOfInterestPolicy: boolean;
  whistleblowerPolicy: boolean;
  beneficiariesServed: number;
  impactDescription: string;
  outcomeMeasurement: any;
  issuedAt: string;
  expiresAt: string;
  isRevoked: boolean;
  verificationLevel: number;
  lastAudited: string;
  nextAuditDue: string;
  charityName: string;
  charityType: string;
  charityWebsite: string;
  charityDescription: string;
}

const getRatingColor = (rating: number) => {
  if (rating >= 80) return 'bg-green-500';
  if (rating >= 60) return 'bg-yellow-500';
  if (rating >= 40) return 'bg-orange-500';
  return 'bg-red-500';
};

const getRatingLabel = (rating: number) => {
  if (rating >= 80) return 'Excellent';
  if (rating >= 60) return 'Good';
  if (rating >= 40) return 'Fair';
  return 'Poor';
};

export default function CBTCredentials() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCredential, setSelectedCredential] = useState<CBTCredential | null>(null);

  // Fetch CBT credentials
  const { data: credentialsResponse, isLoading } = useQuery({
    queryKey: ['/api/cbt/credentials'],
    retry: false
  });

  // Fetch charity leaderboard
  const { data: leaderboardResponse } = useQuery({
    queryKey: ['/api/cbt/leaderboard'],
    retry: false
  });

  const credentials = credentialsResponse?.data?.credentials || [];
  const leaderboard = leaderboardResponse?.data?.charities || [];

  const filteredCredentials = credentials.filter((cred: CBTCredential) =>
    cred.charityName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cred.charityDescription?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ComplianceIndicator = ({ label, value }: { label: string; value: boolean }) => (
    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
      <span className="text-sm font-medium">{label}</span>
      {value ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <AlertCircle className="h-4 w-4 text-red-500" />
      )}
    </div>
  );

  const RatingCard = ({ 
    title, 
    rating, 
    icon: Icon, 
    description 
  }: { 
    title: string; 
    rating: number; 
    icon: any; 
    description: string;
  }) => (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">{rating}/100</span>
            <Badge className={getRatingColor(rating)}>
              {getRatingLabel(rating)}
            </Badge>
          </div>
          <Progress value={rating} className="h-2" />
          <p className="text-xs text-gray-600">{description}</p>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading charity credentials...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">CBT Charity Navigator</h1>
        <p className="text-gray-600">
          Decentralized charity accountability and transparency tracking through Charity Bound Tokens
        </p>
      </div>

      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Browse Charities</TabsTrigger>
          <TabsTrigger value="leaderboard">Top Rated</TabsTrigger>
          <TabsTrigger value="details">Charity Details</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search charities by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid gap-6">
            {filteredCredentials.map((credential: CBTCredential) => (
              <Card key={credential.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedCredential(credential)}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        {credential.charityName}
                      </CardTitle>
                      <CardDescription>{credential.charityDescription}</CardDescription>
                    </div>
                    <Badge variant="outline">
                      Level {credential.verificationLevel}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {credential.overallRating}
                      </div>
                      <div className="text-sm text-gray-600">Overall Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {credential.accountabilityRating}
                      </div>
                      <div className="text-sm text-gray-600">Accountability</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {credential.transparencyRating}
                      </div>
                      <div className="text-sm text-gray-600">Transparency</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {credential.impactRating}
                      </div>
                      <div className="text-sm text-gray-600">Impact</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                      <Users className="inline h-4 w-4 mr-1" />
                      {credential.beneficiariesServed?.toLocaleString()} beneficiaries served
                    </span>
                    <span>
                      Revenue: ${credential.totalRevenue?.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCredentials.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No charities found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search terms.' : 'No charity credentials available yet.'}
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top Rated Charities
              </CardTitle>
              <CardDescription>
                Charities ranked by overall accountability and transparency scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard.map((charity: any, index: number) => (
                  <div key={charity.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium">{charity.charityName}</h3>
                        <p className="text-sm text-gray-600">{charity.charityType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold">{charity.overallRating}/100</div>
                      <div className="flex gap-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(charity.overallRating / 20)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          {selectedCredential ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    {selectedCredential.charityName}
                  </CardTitle>
                  <CardDescription>{selectedCredential.charityDescription}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <RatingCard
                      title="Accountability"
                      rating={selectedCredential.accountabilityRating}
                      icon={Shield}
                      description="Governance and oversight effectiveness"
                    />
                    <RatingCard
                      title="Transparency"
                      rating={selectedCredential.transparencyRating}
                      icon={FileText}
                      description="Financial reporting and disclosure"
                    />
                    <RatingCard
                      title="Efficiency"
                      rating={selectedCredential.financialEfficiencyRating}
                      icon={TrendingUp}
                      description="Optimal use of resources"
                    />
                    <RatingCard
                      title="Impact"
                      rating={selectedCredential.impactRating}
                      icon={Heart}
                      description="Measurable positive outcomes"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Financial Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span>Program Expenses</span>
                            <span>{parseFloat(selectedCredential.programExpenseRatio || '0').toFixed(1)}%</span>
                          </div>
                          <Progress value={parseFloat(selectedCredential.programExpenseRatio || '0') * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span>Administrative</span>
                            <span>{parseFloat(selectedCredential.adminExpenseRatio || '0').toFixed(1)}%</span>
                          </div>
                          <Progress value={parseFloat(selectedCredential.adminExpenseRatio || '0') * 100} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between mb-1">
                            <span>Fundraising</span>
                            <span>{parseFloat(selectedCredential.fundraisingExpenseRatio || '0').toFixed(1)}%</span>
                          </div>
                          <Progress value={parseFloat(selectedCredential.fundraisingExpenseRatio || '0') * 100} className="h-2" />
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex justify-between text-sm">
                            <span>Total Revenue:</span>
                            <span className="font-medium">${selectedCredential.totalRevenue?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Total Expenses:</span>
                            <span className="font-medium">${selectedCredential.totalExpenses?.toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Compliance & Governance</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <ComplianceIndicator 
                          label="Form 990 Filed" 
                          value={selectedCredential.form990Filed} 
                        />
                        <ComplianceIndicator 
                          label="Audited Financials" 
                          value={selectedCredential.auditedFinancials} 
                        />
                        <ComplianceIndicator 
                          label="Board Governance" 
                          value={selectedCredential.boardGovernance} 
                        />
                        <ComplianceIndicator 
                          label="Conflict of Interest Policy" 
                          value={selectedCredential.conflictOfInterestPolicy} 
                        />
                        <ComplianceIndicator 
                          label="Whistleblower Policy" 
                          value={selectedCredential.whistleblowerPolicy} 
                        />
                      </CardContent>
                    </Card>
                  </div>

                  {selectedCredential.impactDescription && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Impact & Outcomes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 mb-4">{selectedCredential.impactDescription}</p>
                        <div className="text-sm text-gray-600">
                          <strong>Beneficiaries Served:</strong> {selectedCredential.beneficiariesServed?.toLocaleString()}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a charity</h3>
              <p className="text-gray-600">Choose a charity from the browse tab to view detailed information.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}