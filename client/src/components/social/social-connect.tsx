import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SiTelegram, SiInstagram } from 'react-icons/si';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import BadgeDisplay from '../badges/badge-display';

interface SocialConnectProps {
  onConnectionSuccess?: () => void;
}

const SocialConnect: React.FC<SocialConnectProps> = ({ onConnectionSuccess }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Telegram state
  const [telegramUsername, setTelegramUsername] = useState('');
  const [telegramCode, setTelegramCode] = useState('');
  const [telegramLoading, setTelegramLoading] = useState(false);
  
  // Instagram state
  const [instagramUsername, setInstagramUsername] = useState('');
  const [instagramFollowers, setInstagramFollowers] = useState<number | ''>('');
  const [instagramCode, setInstagramCode] = useState('');
  const [instagramLoading, setInstagramLoading] = useState(false);
  
  // Prepare badge list
  const userBadges: string[] = [];
  if (user?.telegramVerified) userBadges.push('telegram_verified');
  if (user?.telegramFollowers && user.telegramFollowers >= 5000) userBadges.push('telegram_influencer');
  if (user?.instagramVerified) userBadges.push('instagram_verified');
  if (user?.instagramFollowers && user.instagramFollowers >= 10000) userBadges.push('instagram_boss');

  const handleTelegramConnect = async () => {
    if (!telegramUsername || !telegramCode) {
      toast({
        title: 'Missing information',
        description: 'Please enter both your Telegram username and verification code',
        variant: 'destructive'
      });
      return;
    }

    try {
      setTelegramLoading(true);
      const response = await apiRequest('POST', '/api/user/connect-telegram', {
        telegramId: parseInt(telegramCode), // In a real app this would be the actual Telegram ID
        telegramUsername,
        code: telegramCode
      });

      if (response.ok) {
        toast({
          title: 'Success!',
          description: 'Your Telegram account has been connected',
        });
        if (onConnectionSuccess) onConnectionSuccess();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to connect Telegram account');
      }
    } catch (error) {
      console.error('Telegram connect error:', error);
      toast({
        title: 'Connection failed',
        description: error instanceof Error ? error.message : 'Failed to connect your Telegram account',
        variant: 'destructive'
      });
    } finally {
      setTelegramLoading(false);
    }
  };

  const handleInstagramConnect = async () => {
    if (!instagramUsername || !instagramCode) {
      toast({
        title: 'Missing information',
        description: 'Please enter both your Instagram username and verification code',
        variant: 'destructive'
      });
      return;
    }

    try {
      setInstagramLoading(true);
      const response = await apiRequest('POST', '/api/user/connect-instagram', {
        instagramUsername,
        instagramFollowers: instagramFollowers === '' ? 0 : parseInt(instagramFollowers.toString()),
        verificationCode: instagramCode
      });

      if (response.ok) {
        toast({
          title: 'Success!',
          description: 'Your Instagram account has been connected',
        });
        if (onConnectionSuccess) onConnectionSuccess();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to connect Instagram account');
      }
    } catch (error) {
      console.error('Instagram connect error:', error);
      toast({
        title: 'Connection failed',
        description: error instanceof Error ? error.message : 'Failed to connect your Instagram account',
        variant: 'destructive'
      });
    } finally {
      setInstagramLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>Connect Social Accounts</CardTitle>
        <CardDescription>
          Connect your social media accounts to earn badges and boost your reputation score.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {userBadges.length > 0 && (
          <div className="mb-4">
            <Label>Your Social Badges</Label>
            <div className="mt-2">
              <BadgeDisplay badges={userBadges} />
            </div>
          </div>
        )}
        
        <Tabs defaultValue="telegram" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="telegram" className="flex items-center gap-2">
              <SiTelegram />
              Telegram
            </TabsTrigger>
            <TabsTrigger value="instagram" className="flex items-center gap-2">
              <SiInstagram />
              Instagram
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="telegram">
            <div className="space-y-4 mt-4">
              {user?.telegramVerified ? (
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-md">
                  <p className="flex items-center text-blue-700 dark:text-blue-300">
                    <SiTelegram className="mr-2" />
                    Connected to @{user.telegramUsername}
                  </p>
                  {user.telegramFollowers !== undefined && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {user.telegramFollowers.toLocaleString()} followers
                    </p>
                  )}
                </div>
              ) : (
                <>
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
                  
                  <Button 
                    onClick={handleTelegramConnect} 
                    disabled={telegramLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {telegramLoading ? 'Connecting...' : 'Connect Telegram'}
                  </Button>
                </>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="instagram">
            <div className="space-y-4 mt-4">
              {user?.instagramVerified ? (
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-md">
                  <p className="flex items-center text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                    <SiInstagram className="mr-2 text-pink-600" />
                    Connected to @{user.instagramUsername}
                  </p>
                  {user.instagramFollowers !== undefined && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {user.instagramFollowers.toLocaleString()} followers
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="instagramUsername">Instagram Username</Label>
                    <Input 
                      id="instagramUsername"
                      placeholder="@your_username"
                      value={instagramUsername}
                      onChange={(e) => setInstagramUsername(e.target.value.replace('@', ''))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="instagramFollowers">Follower Count (optional)</Label>
                    <Input 
                      id="instagramFollowers"
                      type="number"
                      placeholder="Enter follower count"
                      value={instagramFollowers}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setInstagramFollowers('');
                        } else {
                          const numValue = parseInt(value);
                          if (!isNaN(numValue) && numValue >= 0) {
                            setInstagramFollowers(numValue);
                          }
                        }
                      }}
                    />
                    <p className="text-xs text-gray-500">
                      Enter your current follower count to qualify for badges
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="instagramCode">Verification Code</Label>
                    <Input 
                      id="instagramCode"
                      placeholder="INSTAGRAM_VERIFY_123"
                      value={instagramCode}
                      onChange={(e) => setInstagramCode(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      For development, any code will work
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleInstagramConnect} 
                    disabled={instagramLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {instagramLoading ? 'Connecting...' : 'Connect Instagram'}
                  </Button>
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex flex-col text-sm text-gray-500">
        <p>Connecting social accounts helps with identity verification and can increase your RepID score.</p>
      </CardFooter>
    </Card>
  );
};

export default SocialConnect;