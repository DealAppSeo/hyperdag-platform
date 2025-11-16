import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { Loader2, Send, Share2, Sparkles } from 'lucide-react';

import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Layout } from '@/components/layout/layout';
import MobileStepHeader from '../../components/ui/mobile-step-header';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { isMobileDevice } from '@/lib/utils';

// Define the RFI submission schema
const rfiSubmissionSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters').max(2000, 'Description must be less than 2000 characters'),
  category: z.enum(['web3', 'ai', 'privacy', 'infrastructure', 'community', 'integration', 'other']),
  problem: z.string().min(20, 'Problem statement must be at least 20 characters').max(1000, 'Problem statement must be less than 1000 characters'),
  impact: z.string().min(20, 'Impact statement must be at least 20 characters').max(1000, 'Impact statement must be less than 1000 characters'),
  status: z.enum(['draft', 'published']).default('published'),
  tags: z.string().optional(),
  optionalContactInfo: z.string().optional(),
});

type RfiFormValues = z.infer<typeof rfiSubmissionSchema>;

export default function SubmitRfiPage() {
  const [activeTab, setActiveTab] = React.useState('form');
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const isMobile = isMobileDevice();
  
  const form = useForm<RfiFormValues>({
    resolver: zodResolver(rfiSubmissionSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'web3',
      tags: '',
      problem: '',
      impact: '',
      status: 'published',
      optionalContactInfo: '',
    }
  });

  // Generate RFI recommendation based on form values
  const generateRecommendation = async () => {
    const currentValues = form.getValues();
    toast({
      title: 'AI Recommendation',
      description: 'AI recommendation feature will be available soon!',
    });
  };

  // Submit RFI mutation
  const submitRfiMutation = useMutation({
    mutationFn: async (formData: RfiFormValues) => {
      const response = await apiRequest('POST', '/api/grant-flow/rfis', {
        ...formData,
        submitterId: user?.id,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/grant-flow/rfis'] });
      toast({
        title: 'RFI Submitted!',
        description: 'Your Request for Idea has been successfully submitted.',
      });
      navigate('/grant-flow');
    },
    onError: (error: Error) => {
      toast({
        title: 'Submission Failed',
        description: error.message || 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: RfiFormValues) => {
    submitRfiMutation.mutate(values);
  };

  return (
    <Layout>
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <MobileStepHeader 
          title="Submit an Idea"
          description="Share your idea for community feedback and potential development"
          currentStep={1}
          totalSteps={3}
        />

        <Tabs 
          defaultValue="form" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="mt-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="form">Submit Form</TabsTrigger>
            <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="py-4">
            <Card>
              <CardHeader>
                <CardTitle>💡 Submit Your Idea</CardTitle>
                <CardDescription>
                  Share an idea you'd like to explore with the community! Others can vote thumbs up/down to show interest. 
                  Popular ideas may become RFPs (Request for Proposals) where teams compete to build them with grant funding.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Idea Title</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="A brief, catchy title for your idea" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Keep it concise and descriptive.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="web3">Web3/Blockchain</SelectItem>
                                <SelectItem value="ai">AI/Machine Learning</SelectItem>
                                <SelectItem value="privacy">Privacy/Security</SelectItem>
                                <SelectItem value="infrastructure">Infrastructure</SelectItem>
                                <SelectItem value="community">Community</SelectItem>
                                <SelectItem value="integration">Integration</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>
                              Select the most relevant category for your idea.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tags (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., defi, mobile, social" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Comma-separated tags to help categorize your idea.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Detailed Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe your idea in detail. What problem does it solve? How would it work?" 
                              className="min-h-[120px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Be as specific as possible to help others understand your vision.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="problem"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Problem Statement</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="What problem does this idea solve? Why is this important?" 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Clearly describe the problem you're trying to address.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="impact"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Potential Impact</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="How would this idea impact users and the HyperDAG ecosystem?" 
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Describe the potential benefits and impact on the community.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="optionalContactInfo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Contact Info (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., Discord username, Telegram handle, etc." 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Optional information for follow-up discussions.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex flex-col md:flex-row justify-between gap-4 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateRecommendation}
                        disabled={submitRfiMutation.isPending}
                        className="md:w-auto w-full"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        AI Recommendations
                      </Button>

                      <div className="flex flex-col md:flex-row gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => navigate('/grant-flow')}
                          className="md:w-auto w-full"
                        >
                          Cancel
                        </Button>
                      
                        <Button 
                          type="submit" 
                          disabled={submitRfiMutation.isPending}
                          className="md:w-auto w-full"
                        >
                          {submitRfiMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Submit Idea
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="guidelines" className="py-4">
            <Card>
              <CardHeader>
                <CardTitle>Understanding Ideas vs RFPs</CardTitle>
                <CardDescription>
                  Learn how ideas become funded projects through community validation and grant matching.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border rounded-lg p-4 bg-blue-50">
                      <h3 className="text-lg font-semibold text-blue-800">💡 Ideas (What You're Submitting)</h3>
                      <ul className="mt-2 space-y-2 list-disc list-inside text-blue-700 text-sm">
                        <li>Share concepts you'd like to see built</li>
                        <li>Community votes thumbs up/down on worthiness</li>
                        <li>No technical proposals required yet</li>
                        <li>Focus on the problem and potential impact</li>
                        <li>Open for anyone to collaborate on</li>
                      </ul>
                    </div>
                    
                    <div className="border rounded-lg p-4 bg-green-50">
                      <h3 className="text-lg font-semibold text-green-800">🏗️ RFPs (What Ideas Become)</h3>
                      <ul className="mt-2 space-y-2 list-disc list-inside text-green-700 text-sm">
                        <li>Proven concepts seeking development teams</li>
                        <li>Teams submit proposals with costs & timelines</li>
                        <li>Include team experience and technical approach</li>
                        <li>Compete for selection and funding</li>
                        <li>Built using HyperDAG APIs and SDKs</li>
                      </ul>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold">💰 GrantFlow Matching Process</h3>
                    <ol className="mt-2 space-y-2 list-decimal list-inside text-gray-700">
                      <li><strong>Idea Submission</strong>: You share your concept</li>
                      <li><strong>Community Validation</strong>: Others vote on worthiness</li>
                      <li><strong>RFP Creation</strong>: Popular ideas become development requests</li>
                      <li><strong>Grant Matching</strong>: GrantFlow matches with Web3/AI funding sources</li>
                      <li><strong>Team Selection</strong>: Community chooses the best proposal</li>
                      <li><strong>Development</strong>: Teams build using optimized HyperDAG infrastructure</li>
                    </ol>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold">Reputation &amp; Rewards</h3>
                    <p className="mt-1 text-gray-700">
                      Submitting quality RFIs earns you reputation points in the HyperDAG ecosystem. 
                      If your idea progresses to an RFP and eventually gets built, you'll receive 
                      additional rewards and recognition as the original idea creator.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="examples" className="py-4">
            <Card>
              <CardHeader>
                <CardTitle>Example RFI Submissions</CardTitle>
                <CardDescription>
                  Reference these examples of successful idea submissions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div className="space-y-4 border-b pb-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">ZK-Verified Reputation System</h3>
                      <Badge variant="outline" className="bg-green-50">Converted to RFP</Badge>
                    </div>
                    <p className="text-gray-700">
                      A system that uses Zero-Knowledge Proofs to verify user accomplishments and contributions 
                      without revealing personal data. Users could prove their expertise and reputation while 
                      maintaining privacy, which could facilitate trusted collaboration in the HyperDAG ecosystem.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">privacy</Badge>
                      <Badge variant="secondary">web3</Badge>
                      <Badge variant="secondary">reputation</Badge>
                    </div>
                  </div>

                  <div className="space-y-4 border-b pb-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Cross-Chain Grant Aggregator</h3>
                      <Badge variant="outline" className="bg-blue-50">Gaining Traction</Badge>
                    </div>
                    <p className="text-gray-700">
                      An integration with multiple blockchain ecosystems that aggregates grants and funding 
                      opportunities across networks. This would give developers on HyperDAG visibility into all 
                      potential funding sources for their projects and simplify the application process.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">integration</Badge>
                      <Badge variant="secondary">web3</Badge>
                      <Badge variant="secondary">funding</Badge>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">AI Skill Matchmaking for Teams</h3>
                      <Badge variant="outline" className="bg-purple-50">New Submission</Badge>
                    </div>
                    <p className="text-gray-700">
                      An AI-powered system that analyzes users' skills, past contributions, and project 
                      preferences to suggest optimal team formations for new projects. This would help 
                      RFP sponsors find the right talent and help contributors find projects that match 
                      their interests and abilities.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">ai</Badge>
                      <Badge variant="secondary">community</Badge>
                      <Badge variant="secondary">collaboration</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Mobile Bottom Actions */}
        {isMobile && activeTab === 'form' && (
          <div className="fixed bottom-16 left-0 right-0 bg-background border-t p-4 flex justify-between z-10">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/grant-flow')}
              className="w-1/3"
            >
              Cancel
            </Button>
            
            <Button 
              type="submit"
              onClick={form.handleSubmit(onSubmit)}
              disabled={submitRfiMutation.isPending}
              className="w-2/3"
            >
              {submitRfiMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Idea
                </>
              )}
            </Button>
          </div>
        )}

        {/* Fixed Share Button */}
        <div className="fixed bottom-20 right-5 md:right-8 md:bottom-8 z-20">
          <Button 
            size="icon"
            className="rounded-full h-12 w-12 shadow-lg"
            variant="default"
            onClick={() => {
              // Share functionality
              if (navigator.share) {
                navigator.share({
                  title: 'Submit an idea on HyperDAG',
                  text: 'Share your ideas for the HyperDAG ecosystem and get community backing!',
                  url: window.location.href,
                });
              } else {
                toast({
                  title: "Share link copied!",
                  description: "Now you can paste it anywhere to share.",
                });
                navigator.clipboard.writeText(window.location.href);
              }
            }}
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Layout>
  );
}