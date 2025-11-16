import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MailIcon, Loader2, AlertCircleIcon, ArrowRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';

interface EmailStepProps {
  user: User;
  onSuccess: (updatedUser: User) => void;
  onSkip?: () => void;
}

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export function EmailStep({ user, onSuccess, onSkip }: EmailStepProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: user.email || '',
    },
  });

  const onSubmit = async (values: z.infer<typeof emailSchema>) => {
    setIsSubmitting(true);
    try {
      const res = await apiRequest('POST', '/api/user/add-email', { email: values.email });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to add email');
      }
      const updatedUser = await res.json();
      
      toast({
        title: 'Email added successfully',
        description: 'Please check your inbox for a verification code',
      });
      
      onSuccess(updatedUser);
    } catch (error) {
      console.error('Failed to add email:', error);
      toast({
        title: 'Failed to add email',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
          <MailIcon className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>Add your email address</CardTitle>
        <CardDescription>
          Adding an email unlocks additional features and helps secure your account.
          <br />
          Your email will remain private and will only be used for account-related communication.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="your.email@example.com" 
                      {...field} 
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-between mt-6">
              {onSkip && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={onSkip} 
                  disabled={isSubmitting}
                >
                  Skip for now
                </Button>
              )}
              
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Continue <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col">
        <div className="flex items-start mt-4 bg-yellow-50 text-yellow-800 p-3 rounded-md">
          <AlertCircleIcon className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <strong>Privacy Note:</strong> Adding an email gives you more access to HyperDAG features, but is not required for basic usage.
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
