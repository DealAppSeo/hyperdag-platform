import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SiTelegram } from 'react-icons/si';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { Loader2 } from 'lucide-react';

interface TelegramLoginProps {
  onSuccess?: () => void;
  referralCode?: string;
}

const TelegramLogin: React.FC<TelegramLoginProps> = ({ onSuccess, referralCode }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [telegramUsername, setTelegramUsername] = useState('');
  const [telegramCode, setTelegramCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [telegramId, setTelegramId] = useState('');
  const [persona, setPersona] = useState<string>('influencer'); // Default to influencer for Telegram users

  const handleTelegramRegister = async () => {
    if (!telegramUsername || !telegramCode || !telegramId) {
      toast({
        title: 'Missing information',
        description: 'Please enter all Telegram details',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await apiRequest('POST', '/api/register/telegram', {
        telegramId: parseInt(telegramId),
        telegramUsername,
        code: telegramCode,
        referralCode,
        persona
      });

      if (response.ok) {
        toast({
          title: 'Registration successful!',
          description: 'Your account has been created with Telegram',
        });
        if (onSuccess) onSuccess();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register with Telegram');
      }
    } catch (error) {
      console.error('Telegram registration error:', error);
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'Failed to register with Telegram',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SiTelegram className="text-blue-500" />
          Connect with Telegram
        </CardTitle>
        <CardDescription>
          Link your Telegram account to HyperDAG
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="telegramUsername">Telegram Username</Label>
          <Input
            id="telegramUsername"
            placeholder="@your_username"
            value={telegramUsername}
            onChange={(e) => setTelegramUsername(e.target.value.replace('@', ''))}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="telegramId">Telegram ID</Label>
          <Input
            id="telegramId"
            placeholder="Your Telegram ID number"
            value={telegramId}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || /^\d+$/.test(value)) {
                setTelegramId(value);
              }
            }}
          />
          <p className="text-xs text-gray-500">
            Use /getid command with our Telegram bot to get your ID
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="telegramCode">Verification Code</Label>
          <Input 
            id="telegramCode"
            placeholder="Enter verification code"
            value={telegramCode}
            onChange={(e) => setTelegramCode(e.target.value)}
          />
          <p className="text-xs text-gray-500">
            Message our Telegram bot @HyperDAG_Bot to get your verification code
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="persona">I am a...</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button 
              type="button" 
              variant={persona === 'developer' ? 'default' : 'outline'}
              className={persona === 'developer' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              onClick={() => setPersona('developer')}
            >
              Developer
            </Button>
            <Button 
              type="button" 
              variant={persona === 'designer' ? 'default' : 'outline'}
              className={persona === 'designer' ? 'bg-orange-600 hover:bg-orange-700' : ''}
              onClick={() => setPersona('designer')}
            >
              Designer
            </Button>
            <Button 
              type="button" 
              variant={persona === 'influencer' ? 'default' : 'outline'}
              className={persona === 'influencer' ? 'bg-green-600 hover:bg-green-700' : ''}
              onClick={() => setPersona('influencer')}
            >
              Influencer
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleTelegramRegister}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            'Connect with Telegram'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TelegramLogin;