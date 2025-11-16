import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Layout } from '@/components/layout/layout';
import { X, Plus } from 'lucide-react';

// Form schema for RFI (Request for Information)
const rfiFormSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters."
  }).max(100, {
    message: "Title must not exceed 100 characters."
  }),
  description: z.string().min(20, {
    message: "Description must be at least 20 characters."
  }).max(500, {
    message: "Description must not exceed 500 characters."
  }),
  category: z.string().min(1, {
    message: "Please select a category."
  }),
  problem: z.string().min(20, {
    message: "Problem statement must be at least 20 characters."
  }).max(500, {
    message: "Problem statement must not exceed 500 characters."
  }),
  impact: z.string().min(20, {
    message: "Impact statement must be at least 20 characters."
  }).max(500, {
    message: "Impact statement must not exceed 500 characters."
  }),
});

// Form schema for RFP (Request for Proposal)
const rfpFormSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters."
  }).max(100, {
    message: "Title must not exceed 100 characters."
  }),
  description: z.string().min(20, {
    message: "Description must be at least 20 characters."
  }).max(500, {
    message: "Description must not exceed 500 characters."
  }),
  category: z.string().min(1, {
    message: "Please select a category."
  }),
  tags: z.string().optional(),
  requirements: z.string().min(20, {
    message: "Requirements must be at least 20 characters."
  }).max(1000, {
    message: "Requirements must not exceed 1000 characters."
  }),
  deliverables: z.string().min(20, {
    message: "Deliverables must be at least 20 characters."
  }).max(1000, {
    message: "Deliverables must not exceed 1000 characters."
  }),
  fundingGoal: z.coerce.number().min(1, {
    message: "Funding goal must be greater than 0."
  }),
  timeline: z.coerce.number().min(1, {
    message: "Timeline must be greater than 0."
  }),
  skillsRequired: z.array(z.string()).min(1, {
    message: "At least one skill is required."
  }),
});

// Categories for projects
const categories = [
  "Infrastructure",
  "DeFi",
  "Privacy",
  "Scaling",
  "Identity",
  "Social",
  "Governance",
  "Gaming",
  "Developer Tools",
  "Security",
  "NFT",
  "DAO",
  "Education",
  "Healthcare",
  "Energy",
  "Climate",
  "Open Source",
  "Research",
  "Other",
];

// Skills list
const skills = [
  "Solidity",
  "Rust",
  "TypeScript",
  "JavaScript",
  "Go",
  "Python",
  "Java",
  "C++",
  "React",
  "Node.js",
  "ZK",
  "Cryptography",
  "Smart Contracts",
  "Frontend",
  "Backend",
  "Full Stack",
  "DevOps",
  "UI/UX Design",
  "Security",
  "Auditing",
  "Economics",
  "Community Management",
  "Technical Writing",
  "Marketing",
  "Project Management"
];

export default function CreateProjectPage() {
  const [activeTab, setActiveTab] = useState<"rfi" | "rfp">("rfi");
  const { toast } = useToast();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Form for RFI
  const rfiForm = useForm<z.infer<typeof rfiFormSchema>>({
    resolver: zodResolver(rfiFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      problem: "",
      impact: "",
    },
  });

  // Form for RFP
  const rfpForm = useForm<z.infer<typeof rfpFormSchema>>({
    resolver: zodResolver(rfpFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      tags: "",
      requirements: "",
      deliverables: "",
      fundingGoal: 1000,
      timeline: 30,
      skillsRequired: [],
    },
  });

  // Mutation for submitting RFI
  const submitRfiMutation = useMutation({
    mutationFn: async (data: z.infer<typeof rfiFormSchema>) => {
      const response = await apiRequest('POST', '/api/rfis', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "RFI Submitted",
        description: "Your request for information has been submitted successfully.",
      });
      rfiForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "An error occurred while submitting your RFI.",
        variant: "destructive",
      });
    },
  });

  // Mutation for submitting RFP
  const submitRfpMutation = useMutation({
    mutationFn: async (data: z.infer<typeof rfpFormSchema>) => {
      const response = await apiRequest('POST', '/api/rfps', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "RFP Submitted",
        description: "Your request for proposal has been submitted successfully.",
      });
      rfpForm.reset();
      setSelectedSkills([]);
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "An error occurred while submitting your RFP.",
        variant: "destructive",
      });
    },
  });

  // Submit RFI handler
  function onSubmitRfi(data: z.infer<typeof rfiFormSchema>) {
    submitRfiMutation.mutate(data);
  }

  // Submit RFP handler
  function onSubmitRfp(data: z.infer<typeof rfpFormSchema>) {
    // Add selected skills to the form data
    data.skillsRequired = selectedSkills;
    submitRfpMutation.mutate(data);
  }

  // Handle skill selection
  function toggleSkill(skill: string) {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  }

  return (
    <Layout>
      <div className="container mx-auto max-w-3xl py-6">
            <h1 className="text-3xl font-bold mb-2">Create New Project</h1>
            <p className="text-muted-foreground mb-6">Start a new initiative or request for the HyperDAG community</p>
            
            <Tabs defaultValue="rfi" onValueChange={(value) => setActiveTab(value as "rfi" | "rfp")}>
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="rfi">Request for Information (RFI)</TabsTrigger>
                <TabsTrigger value="rfp">Request for Proposal (RFP)</TabsTrigger>
              </TabsList>
              
              {/* RFI Form */}
              <TabsContent value="rfi">
                <Card>
                  <CardContent className="pt-6">
                    <Form {...rfiForm}>
                      <form onSubmit={rfiForm.handleSubmit(onSubmitRfi)} className="space-y-6">
                        <FormField
                          control={rfiForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter a concise title for your RFI" {...field} />
                              </FormControl>
                              <FormDescription>
                                A clear title that summarizes your idea or problem statement.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={rfiForm.control}
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
                                  {categories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                      {category}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                The primary category your idea falls under.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={rfiForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Provide a brief overview of your idea"
                                  className="min-h-[100px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                A short description of your idea or concept.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={rfiForm.control}
                          name="problem"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Problem Statement</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="What problem are you trying to solve?"
                                  className="min-h-[100px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Clearly define the problem your idea seeks to address.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={rfiForm.control}
                          name="impact"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Potential Impact</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="How will this idea make a difference?"
                                  className="min-h-[100px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
                                Explain the potential impact and benefits if your idea was implemented.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => rfiForm.reset()}>
                            Reset
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={submitRfiMutation.isPending}
                          >
                            {submitRfiMutation.isPending ? "Submitting..." : "Submit RFI"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* RFP Form */}
              <TabsContent value="rfp">
                <Card>
                  <CardContent className="pt-6">
                    <Form {...rfpForm}>
                      <form onSubmit={rfpForm.handleSubmit(onSubmitRfp)} className="space-y-6">
                        <FormField
                          control={rfpForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter a concise title for your RFP" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={rfpForm.control}
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
                                    {categories.map((category) => (
                                      <SelectItem key={category} value={category}>
                                        {category}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={rfpForm.control}
                            name="tags"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tags</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="blockchain, defi, gaming (comma separated)"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription className="text-xs">
                                  Optional: Add comma-separated tags for better discovery
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={rfpForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Provide a detailed description of your project"
                                  className="min-h-[100px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <FormField
                            control={rfpForm.control}
                            name="fundingGoal"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Funding Goal (HDAG)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    min="1"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={rfpForm.control}
                            name="timeline"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Timeline (Days)</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="number"
                                    min="1"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <FormField
                          control={rfpForm.control}
                          name="requirements"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Technical Requirements</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Detail the technical requirements for this project"
                                  className="min-h-[100px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={rfpForm.control}
                          name="deliverables"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Expected Deliverables</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="List the expected deliverables for this project"
                                  className="min-h-[100px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={rfpForm.control}
                          name="skillsRequired"
                          render={() => (
                            <FormItem>
                              <FormLabel>Required Skills</FormLabel>
                              <div className="border rounded-md p-4">
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                  {skills.map((skill) => (
                                    <div key={skill} className="flex items-center space-x-2">
                                      <Checkbox 
                                        id={`skill-${skill}`}
                                        checked={selectedSkills.includes(skill)}
                                        onCheckedChange={() => toggleSkill(skill)}
                                      />
                                      <label
                                        htmlFor={`skill-${skill}`}
                                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                      >
                                        {skill}
                                      </label>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="mt-2">
                                <p className="text-sm font-medium mb-2">Selected Skills:</p>
                                <div className="flex flex-wrap gap-1">
                                  {selectedSkills.length === 0 ? (
                                    <span className="text-muted-foreground text-sm">No skills selected</span>
                                  ) : (
                                    selectedSkills.map((skill) => (
                                      <div key={skill} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-xs flex items-center gap-1">
                                        {skill}
                                        <button 
                                          type="button"
                                          onClick={() => toggleSkill(skill)}
                                          className="text-muted-foreground hover:text-foreground"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                              {rfpForm.formState.errors.skillsRequired && (
                                <p className="text-sm font-medium text-destructive mt-2">
                                  {rfpForm.formState.errors.skillsRequired.message}
                                </p>
                              )}
                            </FormItem>
                          )}
                        />
                        
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => {
                            rfpForm.reset();
                            setSelectedSkills([]);
                          }}>
                            Reset
                          </Button>
                          <Button 
                            type="submit" 
                            disabled={submitRfpMutation.isPending}
                          >
                            {submitRfpMutation.isPending ? "Submitting..." : "Submit RFP"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
      </div>
    </Layout>
  );
}
