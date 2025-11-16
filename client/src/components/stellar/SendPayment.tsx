import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

// Form validation schema
const sendPaymentSchema = z.object({
  sourceSecretKey: z.string().min(1, "Secret key is required"),
  destinationPublicKey: z.string().min(1, "Destination public key is required"),
  amount: z.string().min(1, "Amount is required")
    .refine(val => !isNaN(parseFloat(val)), {
      message: "Amount must be a valid number",
    })
    .refine(val => parseFloat(val) > 0, {
      message: "Amount must be greater than 0",
    }),
  memo: z.string().optional(),
});

type SendPaymentFormValues = z.infer<typeof sendPaymentSchema>;

/**
 * Send Payment Component
 * 
 * Allows users to send XLM or custom assets to other Stellar accounts
 */
export function SendPayment() {
  const [transactionResult, setTransactionResult] = useState<any>(null);
  const { toast } = useToast();

  // Form definition
  const form = useForm<SendPaymentFormValues>({
    resolver: zodResolver(sendPaymentSchema),
    defaultValues: {
      sourceSecretKey: "",
      destinationPublicKey: "",
      amount: "",
      memo: "",
    },
  });

  // Mutation to send payment
  const sendPaymentMutation = useMutation({
    mutationFn: async (values: SendPaymentFormValues) => {
      const res = await apiRequest("POST", "/api/stellar/send", values);
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.success === false) {
        toast({
          title: "Transaction failed",
          description: data.message,
          variant: "destructive",
        });
        return;
      }
      
      setTransactionResult(data.data);
      
      toast({
        title: "Transaction submitted successfully",
        description: `Transaction ${data.data.hash} has been submitted.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send payment",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: SendPaymentFormValues) => {
    sendPaymentMutation.mutate(values);
  };

  // Reset form and results
  const handleReset = () => {
    form.reset();
    setTransactionResult(null);
  };

  return (
    <div className="space-y-4">
      {transactionResult ? (
        <div className="space-y-4">
          <Alert variant="default" className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle>Payment sent successfully</AlertTitle>
            <AlertDescription>
              Your payment has been submitted to the Stellar network.
            </AlertDescription>
          </Alert>

          <Card>
            <CardContent className="pt-6 space-y-2">
              <div className="grid grid-cols-3 gap-1 text-sm">
                <span className="text-muted-foreground">Transaction ID:</span>
                <span className="col-span-2 font-mono text-xs truncate">{transactionResult.hash}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-1 text-sm">
                <span className="text-muted-foreground">Amount:</span>
                <span className="col-span-2">{transactionResult.operations?.[0]?.amount || "Unknown"} XLM</span>
              </div>
              
              <div className="grid grid-cols-3 gap-1 text-sm">
                <span className="text-muted-foreground">Destination:</span>
                <span className="col-span-2 font-mono text-xs truncate">{transactionResult.operations?.[0]?.destination || "Unknown"}</span>
              </div>
              
              {transactionResult.memo && (
                <div className="grid grid-cols-3 gap-1 text-sm">
                  <span className="text-muted-foreground">Memo:</span>
                  <span className="col-span-2">{transactionResult.memo}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleReset}>Send another payment</Button>
          </div>
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="sourceSecretKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Source Account Secret Key</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="password" 
                      placeholder="S..." 
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    The secret key of the account sending the payment.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="destinationPublicKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination Account Public Key</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="G..." 
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    The public key of the account receiving the payment.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (XLM)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      step="0.0000001" 
                      min="0.0000001" 
                      placeholder="0.0"
                    />
                  </FormControl>
                  <FormDescription>
                    Amount of XLM to send. Minimum 0.0000001 XLM.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="memo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Memo (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Add an optional memo to this transaction"
                      className="resize-none"
                      maxLength={28}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional memo to include with the transaction. Max 28 characters.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={sendPaymentMutation.isPending}
              >
                {sendPaymentMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" /> Send Payment</>
                )}
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}