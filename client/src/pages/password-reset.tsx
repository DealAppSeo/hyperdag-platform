import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Shield, Key, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

type ResetStep = 'email' | 'verify' | 'password' | 'success';

interface ResetState {
  email: string;
  resetToken: string;
  otpCode: string;
  newPassword: string;
  confirmPassword: string;
}

export default function PasswordReset() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<ResetStep>('email');
  const [state, setState] = useState<ResetState>({
    email: '',
    resetToken: '',
    otpCode: '',
    newPassword: '',
    confirmPassword: ''
  });

  const initiateResetMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest('/api/auth/password-reset/initiate', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.success) {
        setState(prev => ({ ...prev, resetToken: data.resetToken }));
        setStep('verify');
        toast({
          title: "Code Sent",
          description: "Check your email for the verification code"
        });
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive"
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send reset code. Please try again.",
        variant: "destructive"
      });
    }
  });

  const verifyCodeMutation = useMutation({
    mutationFn: async ({ resetToken, otpCode }: { resetToken: string; otpCode: string }) => {
      const response = await apiRequest('/api/auth/password-reset/verify', {
        method: 'POST',
        body: JSON.stringify({ resetToken, otpCode })
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.success) {
        setStep('password');
        toast({
          title: "Code Verified",
          description: "You can now set your new password"
        });
      } else {
        toast({
          title: "Invalid Code",
          description: data.message,
          variant: "destructive"
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to verify code. Please try again.",
        variant: "destructive"
      });
    }
  });

  const completeResetMutation = useMutation({
    mutationFn: async ({ resetToken, otpCode, newPassword }: { resetToken: string; otpCode: string; newPassword: string }) => {
      const response = await apiRequest('/api/auth/password-reset/complete', {
        method: 'POST',
        body: JSON.stringify({ resetToken, otpCode, newPassword })
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.success) {
        setStep('success');
        toast({
          title: "Password Updated",
          description: "Your password has been successfully changed"
        });
      } else {
        toast({
          title: "Error",
          description: data.message,
          variant: "destructive"
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update password. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.email) {
      toast({
        title: "Email Required",
        description: "Please enter your email address",
        variant: "destructive"
      });
      return;
    }
    initiateResetMutation.mutate(state.email);
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.otpCode || state.otpCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit verification code",
        variant: "destructive"
      });
      return;
    }
    verifyCodeMutation.mutate({
      resetToken: state.resetToken,
      otpCode: state.otpCode
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (state.newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long",
        variant: "destructive"
      });
      return;
    }

    if (state.newPassword !== state.confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "Please make sure both passwords match",
        variant: "destructive"
      });
      return;
    }

    completeResetMutation.mutate({
      resetToken: state.resetToken,
      otpCode: state.otpCode,
      newPassword: state.newPassword
    });
  };

  const renderStepContent = () => {
    switch (step) {
      case 'email':
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Reset Your Password</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a verification code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={state.email}
                    onChange={(e) => setState(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={initiateResetMutation.isPending}
                >
                  {initiateResetMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    'Send Verification Code'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        );

      case 'verify':
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Enter Verification Code</CardTitle>
              <CardDescription>
                We sent a 6-digit code to {state.email}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVerifySubmit} className="space-y-4">
                <div>
                  <Input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={state.otpCode}
                    onChange={(e) => setState(prev => ({ ...prev, otpCode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    className="w-full text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={verifyCodeMutation.isPending}
                >
                  {verifyCodeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setStep('email')}
                >
                  Back to Email
                </Button>
              </form>
            </CardContent>
          </Card>
        );

      case 'password':
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                <Key className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Set New Password</CardTitle>
              <CardDescription>
                Enter your new password below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <Input
                    type="password"
                    placeholder="New password (min. 8 characters)"
                    value={state.newPassword}
                    onChange={(e) => setState(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full"
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={state.confirmPassword}
                    onChange={(e) => setState(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={completeResetMutation.isPending}
                >
                  {completeResetMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        );

      case 'success':
        return (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Password Updated Successfully</CardTitle>
              <CardDescription>
                Your password has been changed. You can now log in with your new password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => setLocation('/login')} 
                className="w-full"
              >
                Go to Login
              </Button>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {step !== 'success' && (
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">HyperDAG</h1>
            <p className="text-gray-600">Secure Password Recovery</p>
          </div>
        )}
        
        {renderStepContent()}
        
        <div className="mt-6 text-center">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/login')}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  );
}