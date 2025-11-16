import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowRightCircle, CheckCircle2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { Checkbox } from '@/components/ui/checkbox';

type GrantSource = {
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

const rfiSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().min(20, { message: "Description must be at least 20 characters" }),
  category: z.string().min(1, { message: "Category is required" }),
  problem: z.string().min(20, { message: "Problem statement must be at least 20 characters" }),
  impact: z.string().min(20, { message: "Impact statement must be at least 20 characters" }),
  usePersonalInfo: z.boolean().default(false),
});

type RfiFormData = z.infer<typeof rfiSchema>;

type GrantToRfiConverterProps = {
  grant: GrantSource;
  isOpen: boolean;
  onClose: () => void;
  onConversionComplete: (rfiId: number) => void;
};

export default function GrantToRfiConverter({
  grant,
  isOpen,
  onClose,
  onConversionComplete
}: GrantToRfiConverterProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState('info');
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Initialize the form with prefilled data from the grant
  const form = useForm<RfiFormData>({
    resolver: zodResolver(rfiSchema),
    defaultValues: {
      title: `RFI for ${grant.name}`,
      description: grant.description || '',
      category: grant.categories[0] || '',
      problem: 'This grant opportunity addresses the following problem:',
      impact: 'The potential impact of this project includes:',
      usePersonalInfo: false,
    },
  });

  const onSubmit = async (data: RfiFormData) => {
    setIsSubmitting(true);
    
    try {
      // First, get CSRF token
      const csrfResponse = await fetch('/api/csrf-token');
      const csrfData = await csrfResponse.json();
      const csrfToken = csrfData.csrfToken;
      
      // Create RFI submission object
      const rfiData = {
        ...data,
        grantSourceId: grant.id,
        grantSourceName: grant.name,
        status: 'draft',
        // If usePersonalInfo is true, add user's personal info to the description
        description: data.usePersonalInfo && user ? 
          `${data.description}\n\nSubmitter: ${user.username}${user.email ? ` (${user.email})` : ''}` : 
          data.description
      };
      
      // First check for similar RFIs
      const checkResponse = await apiRequest('POST', '/api/grant-flow/rfis/check-similar', {
        title: data.title,
        description: data.description,
        problem: data.problem,
        impact: data.impact,
        grantSourceId: grant.id
      }, {
        headers: {
          'CSRF-Token': csrfToken
        }
      });
      
      const checkResult = await checkResponse.json();
      
      // If similar RFIs are found, show the SimilarRfiModal
      if (checkResponse.ok && checkResult.hasSimilar && checkResult.similarRfis.length > 0) {
        // In a production app, we would show the SimilarRfiModal here
        // But for now, we'll just warn the user and continue
        toast({
          title: 'Similar RFIs Found',
          description: 'We found similar RFIs. In a real app, we would show you options to join them.',
        });
      }
      
      // Submit the RFI anyway
      const response = await apiRequest('POST', '/api/grant-flow/rfis', rfiData, {
        headers: {
          'CSRF-Token': csrfToken
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create RFI');
      }
      
      const result = await response.json();
      
      toast({
        title: 'Success!',
        description: 'Your RFI has been created successfully.',
      });
      
      onConversionComplete(result.id);
      onClose();
    } catch (error) {
      console.error('Error creating RFI:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create RFI',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToNextTab = () => {
    if (currentTab === 'info') {
      // Validate the current tab fields before moving to the next tab
      form.trigger(['title', 'description', 'category']);
      const titleError = form.formState.errors.title;
      const descriptionError = form.formState.errors.description;
      const categoryError = form.formState.errors.category;
      
      if (!titleError && !descriptionError && !categoryError) {
        setCurrentTab('details');
      }
    }
  };

  const navigateToPreviousTab = () => {
    if (currentTab === 'details') {
      setCurrentTab('info');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create RFI from Grant</DialogTitle>
          <DialogDescription>
            Convert this grant opportunity into a Request for Information (RFI) to start gathering interest and explore collaboration options.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Tabs value={currentTab} onValueChange={setCurrentTab as any}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="info">Basic Information</TabsTrigger>
                <TabsTrigger value="details">Problem & Impact</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RFI Title</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        A clear title helps others understand what your RFI is about.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={4} />
                      </FormControl>
                      <FormDescription>
                        Provide a brief overview of the grant opportunity and your interest in it.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Main category or field this RFI belongs to (e.g., "AI", "Healthcare", "Education").
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end">
                  <Button type="button" onClick={navigateToNextTab}>
                    Next <ArrowRightCircle className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="details" className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="problem"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Problem Statement</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormDescription>
                        What problem does this grant opportunity address?
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
                      <FormLabel>Impact Statement</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormDescription>
                        What impact could this project have if successful?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="usePersonalInfo"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Add my contact information
                        </FormLabel>
                        <FormDescription>
                          Include your username {user?.email ? 'and email' : ''} in the RFI description to make it easier for others to contact you.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-between">
                  <Button type="button" variant="outline" onClick={navigateToPreviousTab}>
                    Back
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Create RFI
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </Form>
        
        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <div>
            <span className="text-xs text-muted-foreground">
              Grant Source: {grant.name}
              {grant.applicationDeadline && (
                <> • Deadline: {new Date(grant.applicationDeadline).toLocaleDateString()}</>
              )}
            </span>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
