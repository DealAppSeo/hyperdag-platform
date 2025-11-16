import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, Check, X } from "lucide-react";

export default function TestEmailPage() {
  const { toast } = useToast();
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("HyperDAG Email Test");
  const [message, setMessage] = useState("This is a test email from the HyperDAG system.");
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [response, setResponse] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!to) {
      toast({
        title: "Email Required",
        description: "Please enter a recipient email address.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setStatus('loading');
      
      const result = await apiRequest('POST', '/api/test/email', {
        to,
        subject,
        text: message,
        html: `<div style="font-family: Arial, sans-serif;">${message.replace(/\n/g, '<br>')}</div>`,
      });
      
      const data = await result.json();
      setResponse(data);
      
      if (data.success) {
        setStatus('success');
        toast({
          title: "Email Sent",
          description: "Test email was sent successfully.",
        });
      } else {
        setStatus('error');
        toast({
          title: "Failed to Send Email",
          description: data.message || "An error occurred while sending the email.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending test email:", error);
      setStatus('error');
      setResponse(error);
      toast({
        title: "Error",
        description: "Failed to send test email. Check the console for details.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container max-w-2xl py-10">
      <h1 className="text-3xl font-bold mb-8">Test Email Service</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Send Test Email</CardTitle>
          <CardDescription>
            Use this form to test the Mailgun email integration
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="to">Recipient Email</Label>
              <Input
                id="to"
                type="email"
                placeholder="recipient@example.com"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Email Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Enter your message here"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
              />
            </div>
            
            {status === 'success' && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <Check className="h-4 w-4 text-green-600" />
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>
                  Email was sent successfully.
                </AlertDescription>
              </Alert>
            )}
            
            {status === 'error' && (
              <Alert className="bg-red-50 text-red-800 border-red-200">
                <X className="h-4 w-4 text-red-600" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  Failed to send email. Please check the logs.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
          
          <CardFooter>
            <Button type="submit" disabled={status === 'loading'} className="w-full">
              {status === 'loading' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Test Email"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
      
      {response && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Response:</h2>
          <pre className="bg-gray-100 p-4 rounded-md overflow-auto text-sm">
            {JSON.stringify(response, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}