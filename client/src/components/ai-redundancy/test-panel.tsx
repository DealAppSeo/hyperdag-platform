/**
 * AI Redundancy Test Panel
 * 
 * A component for testing the AI redundancy system,
 * allowing users to try different AI functions and providers.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, Send, Brain, MessageSquare, AlertCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// Schema for the text completion form
const textCompletionSchema = z.object({
  prompt: z.string().min(1, 'Prompt is required'),
  temperature: z.string().optional(),
});

// Schema for the chat completion form
const chatCompletionSchema = z.object({
  systemPrompt: z.string().optional(),
  userMessage: z.string().min(1, 'Message is required'),
  temperature: z.string().optional(),
});

type TextCompletionForm = z.infer<typeof textCompletionSchema>;
type ChatCompletionForm = z.infer<typeof chatCompletionSchema>;

export function AIRedundancyTestPanel() {
  const [textCompletion, setTextCompletion] = useState<{
    text: string;
    provider?: string;
    isLoading: boolean;
    error?: string;
  }>({
    text: '',
    isLoading: false,
  });

  const [chatCompletion, setChatCompletion] = useState<{
    text: string;
    provider?: string;
    isLoading: boolean;
    error?: string;
  }>({
    text: '',
    isLoading: false,
  });

  const { toast } = useToast();

  // Fetch providers data
  const { data: providersData } = useQuery({
    queryKey: ['/api/ai/providers'],
  });

  const providers: string[] = providersData?.data?.providers || [];
  const primaryProvider: string = providersData?.data?.primary || '';

  // Text completion form
  const textCompletionForm = useForm<TextCompletionForm>({
    resolver: zodResolver(textCompletionSchema),
    defaultValues: {
      prompt: '',
      temperature: '0.7',
    },
  });

  // Chat completion form
  const chatCompletionForm = useForm<ChatCompletionForm>({
    resolver: zodResolver(chatCompletionSchema),
    defaultValues: {
      systemPrompt: 'You are a helpful AI assistant that answers questions directly and concisely.',
      userMessage: '',
      temperature: '0.7',
    },
  });

  // Handle text completion submission
  const handleTextCompletionSubmit = async (values: TextCompletionForm) => {
    setTextCompletion({
      text: '',
      isLoading: true,
    });

    try {
      const options = {
        temperature: values.temperature ? parseFloat(values.temperature) : 0.7,
      };

      const response = await apiRequest('POST', '/api/ai/complete', {
        prompt: values.prompt,
        options,
      });

      const result = await response.json();

      if (result.success) {
        setTextCompletion({
          text: result.data.text,
          provider: result.data.provider,
          isLoading: false,
        });
      } else {
        setTextCompletion({
          text: '',
          error: result.message || 'Failed to get completion',
          isLoading: false,
        });
        toast({
          title: 'Error',
          description: result.message || 'Failed to get completion',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setTextCompletion({
        text: '',
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false,
      });
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  // Handle chat completion submission
  const handleChatCompletionSubmit = async (values: ChatCompletionForm) => {
    setChatCompletion({
      text: '',
      isLoading: true,
    });

    try {
      const messages = [];
      
      if (values.systemPrompt) {
        messages.push({
          role: 'system',
          content: values.systemPrompt,
        });
      }
      
      messages.push({
        role: 'user',
        content: values.userMessage,
      });

      const options = {
        temperature: values.temperature ? parseFloat(values.temperature) : 0.7,
      };

      const response = await apiRequest('POST', '/api/ai/chat', {
        messages,
        options,
      });

      const result = await response.json();

      if (result.success) {
        setChatCompletion({
          text: result.data.text,
          provider: result.data.provider,
          isLoading: false,
        });
      } else {
        setChatCompletion({
          text: '',
          error: result.message || 'Failed to get chat response',
          isLoading: false,
        });
        toast({
          title: 'Error',
          description: result.message || 'Failed to get chat response',
          variant: 'destructive',
        });
      }
    } catch (error) {
      setChatCompletion({
        text: '',
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        isLoading: false,
      });
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Redundancy Test Panel</CardTitle>
          <CardDescription>
            Test the AI redundancy system by trying different functions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {primaryProvider ? (
            <div className="mb-4">
              <span className="text-sm font-medium">Primary Provider: </span>
              <Badge variant="secondary" className="text-sm">
                {primaryProvider}
              </Badge>
              <span className="text-sm text-muted-foreground ml-2">
                ({providers.length} provider{providers.length !== 1 ? 's' : ''} available)
              </span>
            </div>
          ) : (
            <Alert variant="warning" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                No primary provider set. The redundancy system may not function correctly.
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="text" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="text">
                <Brain className="h-4 w-4 mr-2" />
                Text Completion
              </TabsTrigger>
              <TabsTrigger value="chat">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat Completion
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text">
              <Form {...textCompletionForm}>
                <form onSubmit={textCompletionForm.handleSubmit(handleTextCompletionSubmit)}>
                  <div className="space-y-4">
                    <FormField
                      control={textCompletionForm.control}
                      name="prompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prompt</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter your prompt here..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            The prompt to send to the AI for text completion
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={textCompletionForm.control}
                      name="temperature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Temperature</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a temperature" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0.1">0.1 (Most deterministic)</SelectItem>
                              <SelectItem value="0.3">0.3 (Less creative)</SelectItem>
                              <SelectItem value="0.5">0.5 (Balanced)</SelectItem>
                              <SelectItem value="0.7">0.7 (More varied)</SelectItem>
                              <SelectItem value="0.9">0.9 (Most creative)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Controls the randomness of the AI response
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={textCompletion.isLoading}
                    >
                      {textCompletion.isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Generate
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>

              {textCompletion.text && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Response</h3>
                  {textCompletion.provider && (
                    <div className="mb-2">
                      <Badge variant="outline" className="mb-2">
                        Provider: {textCompletion.provider}
                      </Badge>
                    </div>
                  )}
                  <div className="bg-muted p-4 rounded-md whitespace-pre-wrap text-sm">
                    {textCompletion.text}
                  </div>
                </div>
              )}

              {textCompletion.error && (
                <Alert variant="destructive" className="mt-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{textCompletion.error}</AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="chat">
              <Form {...chatCompletionForm}>
                <form onSubmit={chatCompletionForm.handleSubmit(handleChatCompletionSubmit)}>
                  <div className="space-y-4">
                    <FormField
                      control={chatCompletionForm.control}
                      name="systemPrompt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>System Prompt (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Instructions for the AI assistant..."
                              className="min-h-[80px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Instructions to set the behavior of the AI assistant
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={chatCompletionForm.control}
                      name="userMessage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Your Message</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter your message here..."
                              className="min-h-[120px]"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            The message to send to the AI assistant
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={chatCompletionForm.control}
                      name="temperature"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Temperature</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a temperature" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0.1">0.1 (Most deterministic)</SelectItem>
                              <SelectItem value="0.3">0.3 (Less creative)</SelectItem>
                              <SelectItem value="0.5">0.5 (Balanced)</SelectItem>
                              <SelectItem value="0.7">0.7 (More varied)</SelectItem>
                              <SelectItem value="0.9">0.9 (Most creative)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Controls the randomness of the AI response
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={chatCompletion.isLoading}
                    >
                      {chatCompletion.isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>

              {chatCompletion.text && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium mb-2">Response</h3>
                  {chatCompletion.provider && (
                    <div className="mb-2">
                      <Badge variant="outline" className="mb-2">
                        Provider: {chatCompletion.provider}
                      </Badge>
                    </div>
                  )}
                  <div className="bg-muted p-4 rounded-md whitespace-pre-wrap text-sm">
                    {chatCompletion.text}
                  </div>
                </div>
              )}

              {chatCompletion.error && (
                <Alert variant="destructive" className="mt-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{chatCompletion.error}</AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          <p>
            This panel tests the AI redundancy system. If a provider fails, the system will
            automatically fallback to an alternative provider.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}