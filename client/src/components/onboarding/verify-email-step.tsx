import React, { useState, useEffect, useRef } from 'react';
import { MailCheckIcon, Loader2, ArrowRightIcon, AlertCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';

interface VerifyEmailStepProps {
  user: User;
  onSuccess: (updatedUser: User) => void;
  onSkip?: () => void;
}

export function VerifyEmailStep({ user, onSuccess, onSkip }: VerifyEmailStepProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [code, setCode] = useState<string[]>(['', '', '', '']);
  const [timer, setTimer] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);

  // Start timer for resend functionality
  useEffect(() => {
    // Set initial timer to 60 seconds
    setTimer(60);
    
    // Decrement timer every second
    intervalRef.current = setInterval(() => {
      setTimer(prevTimer => {
        if (prevTimer <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);
    
    // Focus first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
    
    // Clean up timer on unmount
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Handle input changes
  const handleInputChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value.length === 1 && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace key
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Submit verification code
  const handleVerify = async () => {
    const fullCode = code.join('');
    if (fullCode.length !== 4) return;
    
    // Check if it's the special development code
    const isDevelopmentCode = fullCode === '1234';
    
    setIsSubmitting(true);
    try {
      // Use the development code flag to help the server recognize it
      const res = await apiRequest('POST', '/api/user/verify-email', { 
        code: fullCode,
        isDevelopmentCode: isDevelopmentCode 
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to verify email');
      }
      const updatedUser = await res.json();
      
      toast({
        title: 'Email verified successfully',
        description: 'Your account security has been enhanced',
      });
      
      onSuccess(updatedUser);
    } catch (error) {
      console.error('Failed to verify email:', error);
      toast({
        title: 'Failed to verify email',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Development note: This would typically send a real email
  const handleResendCode = () => {
    if (timer > 0) return;
    
    toast({
      title: 'Verification code resent',
      description: 'Please check your email for the verification code',
    });
    
    // Reset timer
    setTimer(60);
    
    // Start interval again
    intervalRef.current = setInterval(() => {
      setTimer(prevTimer => {
        if (prevTimer <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prevTimer - 1;
      });
    }, 1000);
    
    // Clear existing code
    setCode(['', '', '', '']);
    
    // Focus first input
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
          <MailCheckIcon className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>Verify your email address</CardTitle>
        <CardDescription>
          We've sent a verification code to {user.email}.
          <br />
          Enter the 4-digit code below to verify your email address.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center space-y-6">
          <div className="flex justify-center space-x-2 my-6">
            {[0, 1, 2, 3].map((index) => (
              <input
                key={index}
                type="text"
                maxLength={1}
                value={code[index]}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                ref={(el) => { inputRefs.current[index] = el; }}
                className="w-12 h-14 text-center text-xl font-bold border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                disabled={isSubmitting}
              />
            ))}
          </div>
          
          <p className="text-gray-500 text-sm text-center">
            <strong>DEVELOPMENT MODE:</strong> Try using "1234" as the verification code.
          </p>
          
          <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4">
            <Button 
              variant="ghost" 
              disabled={timer > 0 || isSubmitting} 
              onClick={handleResendCode}
              type="button"
              className="text-sm"
            >
              {timer > 0 ? `Resend code in ${timer}s` : 'Resend code'}
            </Button>
            
            <Button
              onClick={handleVerify}
              disabled={code.join('').length !== 4 || isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify <ArrowRightIcon className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col">
        {onSkip && (
          <Button 
            variant="outline" 
            onClick={onSkip} 
            disabled={isSubmitting}
            className="mt-4"
          >
            Skip for now
          </Button>
        )}
        
        <div className="flex items-start mt-4 bg-blue-50 text-blue-800 p-3 rounded-md">
          <AlertCircleIcon className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <strong>Why verify?</strong> Email verification enhances your account security and unlocks additional features in the HyperDAG ecosystem.
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
