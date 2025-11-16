import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { Lock, Shield, Info } from "lucide-react";

interface GenerateProofFormProps {
  userId: number;
  maxReputation: number;
  onProofGenerated: (proof: any) => void;
}

const formSchema = z.object({
  minScore: z.number().min(0),
  maxScore: z.number().min(0),
  includeTimestamp: z.boolean().default(true),
  includeActivities: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export function GenerateProofForm({ userId, maxReputation, onProofGenerated }: GenerateProofFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rangeValues, setRangeValues] = useState<[number, number]>([0, maxReputation]);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      minScore: 0,
      maxScore: maxReputation,
      includeTimestamp: true,
      includeActivities: false
    },
  });

  const handleSliderChange = (values: number[]) => {
    setRangeValues([values[0], values[1]]);
    form.setValue('minScore', values[0]);
    form.setValue('maxScore', values[1]);
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    
    try {
      // Log the request parameters for debugging
      console.log("Generating proof with parameters:", {
        userId,
        minScore: values.minScore,
        maxScore: values.maxScore,
        includeTimestamp: values.includeTimestamp,
        includeActivities: values.includeActivities
      });
      
      if (!userId) {
        throw new Error("User ID is required but not provided");
      }
      
      const response = await apiRequest('POST', '/api/reputation/zkp/reputation-proof', {
        userId: Number(userId), // Ensure userId is a number
        minScore: Number(values.minScore), // Ensure minScore is a number
        maxScore: Number(values.maxScore), // Ensure maxScore is a number
        includeTimestamp: values.includeTimestamp,
        includeActivities: values.includeActivities
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate proof");
      }
      
      const proofData = await response.json();
      toast({
        title: "Proof Generated",
        description: "Your reputation proof has been created successfully.",
      });
      
      onProofGenerated(proofData);
    } catch (error) {
      console.error("Error generating proof:", error);
      toast({
        title: "Failed to Generate Proof",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2 h-5 w-5" /> 
          Generate Reputation Proof
        </CardTitle>
        <CardDescription>
          Create a zero-knowledge proof of your reputation without revealing your exact score.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <FormLabel>Reputation Range</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    {rangeValues[0]} - {rangeValues[1]}
                  </div>
                </div>
                <div className="pt-4 px-1">
                  <Slider
                    defaultValue={[0, maxReputation]}
                    max={maxReputation}
                    step={1}
                    value={[rangeValues[0], rangeValues[1]]}
                    onValueChange={handleSliderChange}
                    className="my-4"
                  />
                </div>
                <FormDescription className="flex items-start text-xs">
                  <Info className="h-3 w-3 mr-1 mt-0.5" />
                  Select a range that includes your actual reputation score. Wider ranges provide more privacy.
                </FormDescription>
              </div>
              
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-medium">Additional Information to Include:</h3>
                
                <FormField
                  control={form.control}
                  name="includeTimestamp"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Include Timestamp</FormLabel>
                        <FormDescription className="text-xs">
                          Add a timestamp to prove when this credential was valid
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="includeActivities"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Include Activity Count</FormLabel>
                        <FormDescription className="text-xs">
                          Prove how many platform activities contributed to your score
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isSubmitting}
            >
              <Lock className="mr-2 h-4 w-4" />
              {isSubmitting ? "Generating..." : "Generate ZK Proof"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
