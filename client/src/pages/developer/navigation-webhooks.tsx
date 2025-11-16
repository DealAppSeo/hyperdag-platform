import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Layout } from "@/components/layout/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Trash2, RefreshCw, AlertCircle, Check, PlusCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

// Define the form schema for webhook registration
const webhookSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL" }),
  applicationName: z.string().min(3, { message: "Application name must be at least 3 characters" })
});

type WebhookFormValues = z.infer<typeof webhookSchema>;

// Interface for webhook data
interface Webhook {
  id: number;
  url: string;
  apiKey: string;
  applicationName: string;
  type: string;
  active: boolean;
  createdAt: string;
  lastTriggered: string | null;
}

// Main component
export default function NavigationWebhooks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [apiKeyVisible, setApiKeyVisible] = useState<Record<number, boolean>>({});
  const [isRegistering, setIsRegistering] = useState(false);
  const [notifyingAll, setNotifyingAll] = useState(false);
  const [copiedKeys, setCopiedKeys] = useState<Record<number, boolean>>({});

  // Form setup
  const form = useForm<WebhookFormValues>({
    resolver: zodResolver(webhookSchema),
    defaultValues: {
      url: "",
      applicationName: ""
    }
  });

  // Query to fetch webhooks
  const { data: webhooks, isLoading, isError, error } = useQuery({
    queryKey: ["/api/navigation-sync/webhooks"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/navigation-sync/webhooks");
      const data = await res.json();
      return data.data;
    }
  });

  // Mutation to register a new webhook
  const registerWebhookMutation = useMutation({
    mutationFn: async (values: WebhookFormValues) => {
      const res = await apiRequest("POST", "/api/navigation-sync/register", values);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Webhook registered",
        description: "Your webhook has been registered successfully.",
      });
      setIsRegistering(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/navigation-sync/webhooks"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to register webhook",
        description: error.message || "An error occurred while registering the webhook.",
        variant: "destructive"
      });
    }
  });

  // Mutation to delete a webhook
  const deleteWebhookMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/navigation-sync/webhooks/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Webhook deleted",
        description: "The webhook has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/navigation-sync/webhooks"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to delete webhook",
        description: error.message || "An error occurred while deleting the webhook.",
        variant: "destructive"
      });
    }
  });

  // Mutation to test a webhook
  const testWebhookMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("GET", `/api/navigation-sync/test/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Webhook tested",
        description: "The test notification was sent successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to test webhook",
        description: error.message || "An error occurred while testing the webhook.",
        variant: "destructive"
      });
    }
  });

  // Mutation to notify all webhooks
  const notifyAllMutation = useMutation({
    mutationFn: async () => {
      setNotifyingAll(true);
      const res = await apiRequest("POST", "/api/navigation-sync/notify");
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Webhooks notified",
        description: `Successfully notified ${data.data.successful} of ${data.data.total} webhooks.`,
      });
      setNotifyingAll(false);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to notify webhooks",
        description: error.message || "An error occurred while notifying webhooks.",
        variant: "destructive"
      });
      setNotifyingAll(false);
    }
  });

  // Handle webhook registration form submission
  const onSubmit = (values: WebhookFormValues) => {
    registerWebhookMutation.mutate(values);
  };

  // Handle copying API key to clipboard
  const copyApiKey = (id: number, apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKeys({ ...copiedKeys, [id]: true });
    
    setTimeout(() => {
      setCopiedKeys({ ...copiedKeys, [id]: false });
    }, 2000);

    toast({
      title: "API key copied",
      description: "The API key has been copied to your clipboard.",
    });
  };

  // Toggle API key visibility
  const toggleApiKeyVisibility = (id: number) => {
    setApiKeyVisible({
      ...apiKeyVisible,
      [id]: !apiKeyVisible[id]
    });
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Navigation Webhooks</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Manage webhooks for navigation synchronization between HyperDAG and integrated applications.
          </p>
        </div>
        <div className="flex space-x-4">
          <Button 
            variant="outline" 
            onClick={() => notifyAllMutation.mutate()}
            disabled={notifyingAll}
          >
            {notifyingAll ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Notifying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Notify All
              </>
            )}
          </Button>
          
          <Dialog open={isRegistering} onOpenChange={setIsRegistering}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Register Webhook
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Register a New Webhook</DialogTitle>
                <DialogDescription>
                  Register a webhook to receive real-time updates when the navigation structure changes.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Webhook URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/api/webhooks/hyperdag" {...field} />
                        </FormControl>
                        <FormDescription>
                          The URL that will receive webhook notifications.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="applicationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Application Name</FormLabel>
                        <FormControl>
                          <Input placeholder="My Integration" {...field} />
                        </FormControl>
                        <FormDescription>
                          A descriptive name for your webhook integration.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      disabled={registerWebhookMutation.isPending}
                    >
                      {registerWebhookMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Registering...
                        </>
                      ) : "Register Webhook"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {isError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load webhooks: {error instanceof Error ? error.message : "Unknown error"}
          </AlertDescription>
        </Alert>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : webhooks?.length === 0 ? (
        <Card className="mb-6">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">No webhooks registered</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                You haven't registered any webhooks yet. Register a webhook to receive navigation updates.
              </p>
              <Button onClick={() => setIsRegistering(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Register Webhook
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {webhooks?.map((webhook: Webhook) => (
            <Card key={webhook.id}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{webhook.applicationName}</CardTitle>
                    <CardDescription className="mt-1 break-all">
                      {webhook.url}
                    </CardDescription>
                  </div>
                  <Badge variant={webhook.active ? "default" : "outline"}>
                    {webhook.active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">API Key</Label>
                    <div className="flex mt-1">
                      <div className="relative flex-grow">
                        <Input
                          type={apiKeyVisible[webhook.id] ? "text" : "password"}
                          value={webhook.apiKey}
                          readOnly
                          className="pr-20"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={() => toggleApiKeyVisibility(webhook.id)}
                        >
                          {apiKeyVisible[webhook.id] ? "Hide" : "Show"}
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        className="ml-2"
                        onClick={() => copyApiKey(webhook.id, webhook.apiKey)}
                      >
                        {copiedKeys[webhook.id] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <p>
                      <span className="font-medium">Created:</span>{" "}
                      {new Date(webhook.createdAt).toLocaleString()}
                    </p>
                    {webhook.lastTriggered && (
                      <p>
                        <span className="font-medium">Last triggered:</span>{" "}
                        {new Date(webhook.lastTriggered).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => testWebhookMutation.mutate(webhook.id)}
                  disabled={testWebhookMutation.isPending}
                >
                  {testWebhookMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Test Webhook"
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteWebhookMutation.mutate(webhook.id)}
                  disabled={deleteWebhookMutation.isPending}
                >
                  {deleteWebhookMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Webhook Integration Guide</CardTitle>
          <CardDescription>
            Learn how to set up your application to receive navigation updates from HyperDAG.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Step 1: Create a webhook endpoint</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Create an endpoint in your application that can receive POST requests with the navigation structure.
              </p>
              <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mt-2 text-xs overflow-auto">
                {`// Example webhook endpoint in Express.js
app.post('/api/webhooks/hyperdag-navigation', (req, res) => {
  // Verify the request using the API key
  const apiKey = req.headers['x-hyperdag-webhook-key'];
  if (!apiKey || apiKey !== import.meta.env.VITE_HYPERDAG_WEBHOOK_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Process the navigation data
  const { event, data, timestamp } = req.body;
  
  if (event === 'navigation.updated') {
    // Update your application's navigation structure
    updateNavigationStructure(data.navigation);
  }
  
  // Acknowledge receipt
  res.status(200).json({ success: true });
});`}
              </pre>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Step 2: Register your webhook</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Use the "Register Webhook" button above to register your webhook URL and obtain an API key.
                Store this API key securely in your application's configuration.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Step 3: Handle webhook notifications</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                When you receive a webhook notification, verify the API key and update your application's
                navigation structure based on the received data.
              </p>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md mt-2 text-xs">
                <p className="font-medium mb-2">Example payload:</p>
                <pre className="overflow-auto">
                  {`{
  "event": "navigation.updated",
  "data": {
    "version": "2025-05-22T20:00:00.000Z",
    "navigation": [
      {
        "title": "Dashboard",
        "icon": "layout-dashboard",
        "path": "/"
      },
      {
        "title": "Community",
        "icon": "users",
        "styling": {
          "activeState": "group-active"
        },
        "children": [
          {
            "title": "Forum",
            "path": "https://forum.hyperdag.org",
            "external": true,
            "styling": {
              "activeBackgroundColor": "#7c3aed",
              "activeTextColor": "#ffffff",
              "fontWeight": "500"
            }
          },
          // More navigation items...
        ]
      }
    ]
  },
  "timestamp": "2025-05-22T20:00:00.000Z"
}`}
                </pre>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </Layout>
  );
}