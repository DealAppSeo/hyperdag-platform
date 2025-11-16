import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Define form schema for RFP creation
const rfpFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(30, "Description must be at least 30 characters").max(2000, "Description must be less than 2000 characters"),
  category: z.string().min(1, "Please select a category"),
  tags: z.string().optional(),
  fundingGoal: z.string().regex(/^\d+$/, "Funding goal must be a number").min(1, "Funding goal is required for RFPs"),
  deadline: z.date({
    required_error: "Please select a deadline",
  }),
});

type RfpFormValues = z.infer<typeof rfpFormSchema>;

interface CreateRfpFormProps {
  rfiId?: number;
  onSuccess?: () => void;
}

export default function CreateRfpForm({ rfiId, onSuccess }: CreateRfpFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<RfpFormValues>({
    resolver: zodResolver(rfpFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      tags: "",
      fundingGoal: ""
    }
  });

  // Get RFI data if creating from an existing RFI
  const { data: rfiData } = useQuery({
    queryKey: ["api/grant-flow/rfis", rfiId],
    queryFn: async () => {
      if (!rfiId) return null;
      const res = await fetch(`/api/grant-flow/rfis/${rfiId}`);
      if (!res.ok) throw new Error("Failed to fetch RFI");
      return res.json();
    },
    enabled: !!rfiId
  });
  
  // Update form when RFI data is loaded
  React.useEffect(() => {
    if (rfiData) {
      // Pre-fill form with RFI data
      form.setValue("title", rfiData.title);
      form.setValue("description", rfiData.description);
      form.setValue("category", rfiData.category);
      form.setValue("tags", rfiData.tags);
      if (rfiData.fundingGoal) {
        form.setValue("fundingGoal", rfiData.fundingGoal.toString());
      }
    }
  }, [rfiData, form]);
  
  const createRfpMutation = useMutation({
    mutationFn: async (data: RfpFormValues) => {
      const transformedData = {
        ...data,
        status: "published",
        fundingGoal: parseInt(data.fundingGoal),
        rfiId,
        deadline: data.deadline.toISOString(),
        upvotes: 0,
        downvotes: 0,
        totalStaked: 0,
        totalFunded: 0
      };
      
      const res = await apiRequest("POST", "/api/grant-flow/rfps", transformedData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "RFP Created",
        description: "Your Request for Proposals has been created successfully.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/grant-flow/rfps"] });
      if (rfiId) {
        queryClient.invalidateQueries({ queryKey: ["/api/grant-flow/rfis", rfiId] });
      }
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to create RFP. Please try again later.",
        variant: "destructive",
      });
    }
  });
  
  const onSubmit = (data: RfpFormValues) => {
    createRfpMutation.mutate(data);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a Request for Proposals (RFP)</CardTitle>
        <CardDescription>
          Convert your RFI into a formal request for proposals to receive solutions from the community.
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
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a clear, descriptive title" {...field} />
                  </FormControl>
                  <FormDescription>
                    A concise title describing the project you need proposals for.
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
                    <Textarea 
                      placeholder="Describe in detail what you're looking for, including requirements, constraints, and evaluation criteria"
                      className="h-32"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a detailed description that will help proposers understand the scope and requirements.
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
                        <SelectItem value="web3">Web3 Infrastructure</SelectItem>
                        <SelectItem value="defi">DeFi</SelectItem>
                        <SelectItem value="nft">NFT & Digital Assets</SelectItem>
                        <SelectItem value="dao">DAO Governance</SelectItem>
                        <SelectItem value="identity">Identity & Privacy</SelectItem>
                        <SelectItem value="social">Social Impact</SelectItem>
                        <SelectItem value="ai">AI Integration</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the category that best fits your request.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="fundingGoal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funding Goal (HDAG tokens)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="E.g., 1000" {...field} />
                    </FormControl>
                    <FormDescription>
                      The amount of HDAG tokens needed for this project.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Submission Deadline</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className="w-full pl-3 text-left font-normal"
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span className="text-muted-foreground">Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    The deadline for submitting proposals.
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
                  <FormLabel>Tags (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., blockchain, privacy, scaling" {...field} />
                  </FormControl>
                  <FormDescription>
                    Comma-separated tags to help categorize your request.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              disabled={createRfpMutation.isPending} 
              className="w-full md:w-auto"
            >
              {createRfpMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating RFP...
                </>
              ) : "Create RFP"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
