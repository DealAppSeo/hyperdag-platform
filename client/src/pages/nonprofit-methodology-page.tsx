import React from 'react';
import { ArrowLeft, Award, CheckCircle, ExternalLink, Heart, Info, Shield, Star, Users } from 'lucide-react';
import { Link } from 'wouter';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const NonprofitMethodologyPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 pb-16">
      <div className="mb-6 flex items-center">
        <Button variant="ghost" size="sm" asChild className="mr-2">
          <Link href="/nonprofits">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Directory
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold">Non-Profit Verification & Rating Methodology</h1>
        <p className="mt-2 text-gray-600 max-w-3xl">
          HyperDAG's Non-Profit Directory aims to combine the rigorous evaluation methodology 
          of traditional charity rating systems with the benefits of Web3 technology and AI-powered matching.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
              <CardTitle>Our Four-Beacon Rating System</CardTitle>
              <CardDescription>
                Inspired by Charity Navigator's methodology but enhanced with Web3 verification
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="financial">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="financial">Financial</TabsTrigger>
                  <TabsTrigger value="impact">Impact</TabsTrigger>
                  <TabsTrigger value="governance">Governance</TabsTrigger>
                  <TabsTrigger value="transparency">Transparency</TabsTrigger>
                </TabsList>
                
                <TabsContent value="financial" className="pt-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 rounded-full bg-amber-100 p-2">
                      <Star className="h-5 w-5 text-amber-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-amber-800">Financial Health</h3>
                      <p className="mt-1 text-gray-600">
                        We evaluate the organization's financial stability, efficiency, and sustainability.
                      </p>
                      <div className="mt-4 space-y-3">
                        <div className="rounded-md bg-amber-50 p-3">
                          <h4 className="font-medium text-amber-800">Program Expense Ratio</h4>
                          <p className="mt-1 text-sm text-gray-600">
                            The percentage of funds spent directly on programs and services relative to overhead.
                            Higher program expense ratios (typically above 75%) indicate greater financial efficiency.
                          </p>
                        </div>
                        <div className="rounded-md bg-amber-50 p-3">
                          <h4 className="font-medium text-amber-800">Cost to Raise $100</h4>
                          <p className="mt-1 text-sm text-gray-600">
                            How much it costs the organization to raise $100 in donations.
                            Lower fundraising costs (under $20 per $100) suggest more efficient operations.
                          </p>
                        </div>
                        <div className="rounded-md bg-amber-50 p-3">
                          <h4 className="font-medium text-amber-800">Financial Transparency</h4>
                          <p className="mt-1 text-sm text-gray-600">
                            Accessibility of financial records, including audited financial statements and Form 990s.
                            Organizations receive higher scores for publishing detailed financial information.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="impact" className="pt-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 rounded-full bg-blue-100 p-2">
                      <Users className="h-5 w-5 text-blue-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-blue-800">Impact & Results</h3>
                      <p className="mt-1 text-gray-600">
                        We assess how effectively the organization delivers on its mission and creates real-world impact.
                      </p>
                      <div className="mt-4 space-y-3">
                        <div className="rounded-md bg-blue-50 p-3">
                          <h4 className="font-medium text-blue-800">Outcome Measurement</h4>
                          <p className="mt-1 text-sm text-gray-600">
                            How thoroughly the organization measures, evaluates, and reports the outcomes of its programs.
                            Organizations using rigorous impact measurement frameworks receive higher scores.
                          </p>
                        </div>
                        <div className="rounded-md bg-blue-50 p-3">
                          <h4 className="font-medium text-blue-800">Mission Fulfillment</h4>
                          <p className="mt-1 text-sm text-gray-600">
                            How effectively the organization's programs align with and advance its stated mission.
                            Organizations with clear alignment between activities and mission score higher.
                          </p>
                        </div>
                        <div className="rounded-md bg-blue-50 p-3">
                          <h4 className="font-medium text-blue-800">Scope & Scale</h4>
                          <p className="mt-1 text-sm text-gray-600">
                            The reach and magnitude of the organization's impact relative to its size and resources.
                            Organizations demonstrating broader reach with similar resources score higher.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="governance" className="pt-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 rounded-full bg-emerald-100 p-2">
                      <Shield className="h-5 w-5 text-emerald-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-emerald-800">Leadership & Governance</h3>
                      <p className="mt-1 text-gray-600">
                        We evaluate the organization's leadership, board composition, and management practices.
                      </p>
                      <div className="mt-4 space-y-3">
                        <div className="rounded-md bg-emerald-50 p-3">
                          <h4 className="font-medium text-emerald-800">Board Composition</h4>
                          <p className="mt-1 text-sm text-gray-600">
                            The independence, diversity, and expertise of the board of directors.
                            Organizations with independent, diverse boards that meet regularly score higher.
                          </p>
                        </div>
                        <div className="rounded-md bg-emerald-50 p-3">
                          <h4 className="font-medium text-emerald-800">Conflict of Interest Policies</h4>
                          <p className="mt-1 text-sm text-gray-600">
                            The strength and enforcement of conflict of interest policies for board members and executives.
                            Organizations with robust, well-enforced policies receive higher scores.
                          </p>
                        </div>
                        <div className="rounded-md bg-emerald-50 p-3">
                          <h4 className="font-medium text-emerald-800">Executive Compensation</h4>
                          <p className="mt-1 text-sm text-gray-600">
                            The reasonableness of executive compensation relative to the organization's size and sector.
                            Organizations with appropriate, well-justified compensation structures score higher.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="transparency" className="pt-4">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 rounded-full bg-purple-100 p-2">
                      <Info className="h-5 w-5 text-purple-700" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-purple-800">Transparency & Data Integrity</h3>
                      <p className="mt-1 text-gray-600">
                        We assess how openly the organization shares information and secures its data.
                      </p>
                      <div className="mt-4 space-y-3">
                        <div className="rounded-md bg-purple-50 p-3">
                          <h4 className="font-medium text-purple-800">Information Accessibility</h4>
                          <p className="mt-1 text-sm text-gray-600">
                            The ease with which stakeholders can access key information about the organization.
                            Organizations with comprehensive, easily accessible information receive higher scores.
                          </p>
                        </div>
                        <div className="rounded-md bg-purple-50 p-3">
                          <h4 className="font-medium text-purple-800">Data Security Practices</h4>
                          <p className="mt-1 text-sm text-gray-600">
                            How effectively the organization protects sensitive data and donor information.
                            Organizations with strong security protocols score higher.
                          </p>
                        </div>
                        <div className="rounded-md bg-purple-50 p-3">
                          <h4 className="font-medium text-purple-800">SBT Data Verification</h4>
                          <p className="mt-1 text-sm text-gray-600">
                            Unique to HyperDAG: Organizations that maintain their core data and credentials on-chain
                            using Soulbound Tokens receive higher transparency scores due to the immutable, verifiable
                            nature of blockchain records.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <div className="mt-8 rounded-lg bg-gradient-to-r from-indigo-50 to-blue-50 p-6">
            <h2 className="text-xl font-semibold text-blue-800">Web3 & AI Enhancements</h2>
            <p className="mt-2 text-gray-700">
              HyperDAG enhances traditional charity rating systems with cutting-edge technologies:
            </p>
            
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-md bg-white/80 p-4 shadow-sm">
                <h3 className="flex items-center text-lg font-medium text-indigo-700">
                  <CheckCircle className="mr-2 h-5 w-5" /> Soulbound Token (SBT) Verification
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Organizations receive tamper-proof digital credentials through non-transferable SBTs, 
                  allowing instant verification of claims while maintaining full ownership of their data. 
                  This creates an immutable record of achievements, credentials, and impact metrics.
                </p>
              </div>
              
              <div className="rounded-md bg-white/80 p-4 shadow-sm">
                <h3 className="flex items-center text-lg font-medium text-indigo-700">
                  <CheckCircle className="mr-2 h-5 w-5" /> Zero-Knowledge Proof Privacy
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Our system allows organizations to selectively reveal information while maintaining privacy. 
                  For example, an organization can prove they meet donor criteria without revealing sensitive 
                  details about their operations or beneficiaries.
                </p>
              </div>
              
              <div className="rounded-md bg-white/80 p-4 shadow-sm">
                <h3 className="flex items-center text-lg font-medium text-indigo-700">
                  <CheckCircle className="mr-2 h-5 w-5" /> AI-Powered Needs Matching
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Our AI algorithms analyze donor preferences and non-profit capabilities to suggest optimal matches. 
                  The system learns from donation patterns to improve recommendation accuracy over time, helping 
                  donors find organizations that align with their values and impact goals.
                </p>
              </div>
              
              <div className="rounded-md bg-white/80 p-4 shadow-sm">
                <h3 className="flex items-center text-lg font-medium text-indigo-700">
                  <CheckCircle className="mr-2 h-5 w-5" /> Transparent Donation Tracking
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Donors can track how their contributions impact the organization's reputation score and effectiveness 
                  metrics in real-time. The system provides transparent feedback on how donations translate to 
                  real-world impact.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Verification Process</CardTitle>
              <CardDescription>
                How organizations are vetted before joining the directory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                    1
                  </div>
                  <div>
                    <h3 className="font-medium">Document Submission</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Organizations submit legal documentation proving their non-profit status, financial records, 
                      and program details.
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                    2
                  </div>
                  <div>
                    <h3 className="font-medium">Manual Review</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Our team verifies the submitted documents and crosschecks against public records 
                      and regulatory databases.
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                    3
                  </div>
                  <div>
                    <h3 className="font-medium">SBT Issuance</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Verified organizations receive a Soulbound Token that cryptographically proves their 
                      legitimacy and contains their verified credentials.
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                    4
                  </div>
                  <div>
                    <h3 className="font-medium">Initial Rating</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Organizations receive initial scores in each of the four beacon areas based on 
                      submitted information and independent research.
                    </p>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                    5
                  </div>
                  <div>
                    <h3 className="font-medium">Continuous Monitoring</h3>
                    <p className="mt-1 text-sm text-gray-600">
                      Ratings are updated based on ongoing performance, donor feedback, and regular 
                      re-verification of credentials.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Donors & Nonprofit Matching</CardTitle>
              <CardDescription>
                How we connect donors with the right organizations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  HyperDAG users can earn tokens through:
                </p>
                <ul className="ml-5 list-disc text-sm text-gray-600">
                  <li>Contributing to open-source projects</li>
                  <li>Creating applications on the platform</li>
                  <li>Sharing their data and monetizing online behavior</li>
                  <li>Completing platform tasks and challenges</li>
                </ul>
                
                <p className="mt-2 text-sm text-gray-600">
                  These earned tokens can be donated to verified non-profits, with our AI matching system suggesting 
                  organizations that align with:
                </p>
                
                <div className="mt-3 grid gap-2">
                  <div className="rounded-md border border-blue-100 bg-blue-50 p-2">
                    <p className="text-sm font-medium text-blue-800">Your stated interests and values</p>
                  </div>
                  <div className="rounded-md border border-blue-100 bg-blue-50 p-2">
                    <p className="text-sm font-medium text-blue-800">Your previous donation patterns</p>
                  </div>
                  <div className="rounded-md border border-blue-100 bg-blue-50 p-2">
                    <p className="text-sm font-medium text-blue-800">Organizations' impact in areas you care about</p>
                  </div>
                  <div className="rounded-md border border-blue-100 bg-blue-50 p-2">
                    <p className="text-sm font-medium text-blue-800">Current needs and priority initiatives</p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <Button className="w-full">
                    <Heart className="mr-2 h-4 w-4" />
                    Browse Nonprofits
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-start">
              <Award className="mr-3 h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">Become a Verified Nonprofit</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Is your organization interested in joining our directory? Apply for verification and receive 
                  an SBT to showcase your credibility.
                </p>
                <div className="mt-3">
                  <Button variant="outline" size="sm" className="flex items-center" asChild>
                    <a href="/apply-nonprofit" className="inline-flex items-center">
                      Learn More <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NonprofitMethodologyPage;