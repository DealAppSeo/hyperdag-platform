import React, { useState, useEffect, useRef } from 'react';
import { KeyIcon, Loader2, ArrowRightIcon, LockIcon, ShieldIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { User } from '@shared/schema';

interface TwoFactorStepProps {
  user: User;
  onSuccess: (updatedUser: User) => void;
  onSkip?: () => void;
}

export function TwoFactorStep({ user, onSuccess, onSkip }: TwoFactorStepProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus verification code input when QR code is shown
  useEffect(() => {
    if (qrCodeUrl && inputRef.current) {
      inputRef.current.focus();
    }
  }, [qrCodeUrl]);

  // Initialize 2FA setup
  const handleStartSetup = async () => {
    setIsSubmitting(true);
    try {
      const res = await apiRequest('POST', '/api/user/setup-2fa');
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to setup 2FA');
      }
      const data = await res.json();
      
      // Set QR code and secret
      setQrCodeUrl(data.qrCode);
      setSecret(data.secret);
      setSetupComplete(false);
      
      toast({
        title: '2FA setup initialized',
        description: 'Scan the QR code with your authenticator app',
      });
    } catch (error) {
      console.error('Failed to setup 2FA:', error);
      toast({
        title: 'Failed to setup 2FA',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify 2FA code (in a real app, this would verify the TOTP code)
  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: 'Invalid code',
        description: 'Please enter a valid 6-digit code',
        variant: 'destructive',
      });
      return;
    }
    
    // For development purposes, we'll simulate success
    setSetupComplete(true);
    
    // In a real app, we'd verify the code server-side
    // For now, we'll just use the updated user that already has 2FA enabled
    if (user) {
      onSuccess({ ...user, twoFactorEnabled: true, onboardingStage: 4 });
    }
    
    toast({
      title: '2FA setup complete',
      description: 'Your account is now protected with two-factor authentication',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
          <KeyIcon className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>Set up Two-Factor Authentication</CardTitle>
        <CardDescription>
          Two-factor authentication adds an extra layer of security to your account.
          <br />
          You'll need an authenticator app like Google Authenticator or Authy.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!qrCodeUrl ? (
          <div className="flex flex-col items-center space-y-6">
            <div className="bg-primary/5 p-6 rounded-lg w-full max-w-xs mx-auto text-center">
              <ShieldIcon className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h3 className="text-lg font-medium mb-2">Enhanced Security</h3>
              <p className="text-sm text-gray-600">
                2FA requires a code from your authenticator app in addition to your password,
                protecting your account even if your password is compromised.
              </p>
            </div>
            
            <Button 
              onClick={handleStartSetup} 
              disabled={isSubmitting}
              className="w-full max-w-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  Begin Setup <ArrowRightIcon className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        ) : setupComplete ? (
          <div className="flex flex-col items-center space-y-6 p-6 text-center">
            <div className="bg-green-50 p-6 rounded-full">
              <LockIcon className="w-12 h-12 text-green-500" />
            </div>
            <h3 className="text-xl font-semibold">Setup Complete!</h3>
            <p className="text-gray-600">
              Your account is now protected with two-factor authentication.
              You'll need to enter a verification code each time you log in.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              {qrCodeUrl && (
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code for Authenticator App" 
                  className="w-48 h-48 mx-auto"
                />
              )}
            </div>
            
            <div className="bg-yellow-50 p-3 rounded-md text-yellow-800 text-sm w-full">
              <p className="font-semibold mb-1">Backup Code (Save this somewhere safe)</p>
              <code className="p-2 bg-white rounded border border-yellow-200 block overflow-x-auto">
                {secret}
              </code>
            </div>
            
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Enter 6-digit code from your authenticator app
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  maxLength={6}
                  ref={inputRef}
                  placeholder="123456"
                  className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary flex-grow text-center text-xl tracking-wider"
                />
                <Button
                  onClick={handleVerifyCode}
                  disabled={verificationCode.length !== 6}
                >
                  Verify
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                <strong>DEVELOPMENT MODE:</strong> Any 6-digit code will work for testing.
              </p>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col">
        {!setupComplete && onSkip && !qrCodeUrl && (
          <Button 
            variant="outline" 
            onClick={onSkip} 
            disabled={isSubmitting}
            className="mt-4"
          >
            Skip for now
          </Button>
        )}
        
        {qrCodeUrl && !setupComplete && (
          <Button 
            variant="outline" 
            onClick={() => setQrCodeUrl('')}
            className="mt-4"
          >
            Back
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
