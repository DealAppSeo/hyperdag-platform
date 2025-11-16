import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { apiRequest } from '@/lib/queryClient';
import { Loader2, CheckCircle, HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface FormData {
  name: string;
  type: string;
  website: string;
  email: string;
  description: string;
  mission: string;
  referralCode?: string;
}

export default function NonprofitSubmitPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    name: '',
    type: '501c3',
    website: '',
    email: '',
    description: '',
    mission: '',
    referralCode: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest('POST', '/api/organizations/submit', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Submission successful!",
        description: "The organization has been submitted for verification. An email has been sent to the provided address.",
        variant: "default"
      });
      setSubmitted(true);
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message || "There was an error submitting the organization. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, type: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  if (submitted) {
    return (
      <div className="container max-w-3xl mx-auto p-4 md:p-8">
        <Card className="border-none shadow-lg bg-gradient-to-br from-primary-50 to-white dark:from-primary-950/40 dark:to-background">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-bold text-primary">Submission Received</CardTitle>
            <CardDescription className="text-lg">Thank you for helping grow our nonprofit community!</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center space-y-6 pb-8">
            <div className="flex items-center justify-center h-24 w-24 rounded-full bg-primary/10">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
            <div className="text-center space-y-4 max-w-md">
              <h3 className="text-xl font-semibold">{formData.name} has been submitted</h3>
              <p className="text-muted-foreground">
                An email with verification instructions has been sent to the provided email address. 
                Once verified, our team will review the submission and issue a Soulbound Token (SBT) for the organization.
              </p>
              <Button variant="outline" onClick={() => window.location.href = '/nonprofit-directory'}>
                Return to Nonprofit Directory
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-3xl mx-auto p-4 md:p-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Submit a Nonprofit Organization</h1>
          <p className="text-muted-foreground">
            Help us grow our community of verified nonprofits. Submit an organization to be verified and listed in our directory.
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Organization Information</CardTitle>
            <CardDescription>
              Please provide accurate information about the nonprofit organization. 
              An email verification will be sent to the provided address.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name</Label>
                  <Input 
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Global Environmental Foundation"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">Organization Type</Label>
                  <Select 
                    value={formData.type} 
                    onValueChange={handleSelectChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="501c3">501(c)(3) - Charitable Organization</SelectItem>
                      <SelectItem value="501c4">501(c)(4) - Social Welfare Organization</SelectItem>
                      <SelectItem value="international">International NGO</SelectItem>
                      <SelectItem value="other">Other Nonprofit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input 
                    id="website"
                    name="website"
                    type="url"
                    required
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://example.org"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Official Email</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="contact@example.org"
                    />
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" type="button">
                            <HelpCircle className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Must be an official email from the organization's domain. 
                            A verification link will be sent to this address.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description"
                    name="description"
                    required
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Brief description of the organization"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="mission">Mission Statement</Label>
                  <Textarea 
                    id="mission"
                    name="mission"
                    required
                    value={formData.mission}
                    onChange={handleChange}
                    placeholder="The organization's mission and goals"
                    rows={3}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                  <Input 
                    id="referralCode"
                    name="referralCode"
                    value={formData.referralCode}
                    onChange={handleChange}
                    placeholder="Enter a referral code if you have one"
                  />
                </div>
              </div>
              
              <CardFooter className="px-0 pt-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Submitted organizations will go through a verification process before being listed in the directory.
                </div>
                <Button 
                  type="submit"
                  disabled={submitMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {submitMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Organization"
                  )}
                </Button>
              </CardFooter>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}