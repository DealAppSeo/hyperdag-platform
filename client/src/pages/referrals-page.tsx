import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ReferralStatsCard } from '@/components/referrals/ReferralStatsCard';
import { ReferralTable } from '@/components/referrals/ReferralTable';
import { Copy, Share2, QrCode } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

// Define types for our API responses
interface QRCodeData {
  qrCodeUrl: string;
  referralCode: string;
}

interface QRCodeResponse {
  success: boolean;
  data: QRCodeData;
}

interface User {
  id: number;
  username: string;
  referralCode: string;
  [key: string]: any;
}

export default function ReferralsPage() {
  const { toast } = useToast();
  const [qrDialogOpen, setQrDialogOpen] = React.useState(false);
  
  // Fetch referral code and QR code
  const { data: userData } = useQuery<User>({
    queryKey: ['/api/user'],
  });
  
  const { data: qrResponse } = useQuery<QRCodeResponse>({
    queryKey: ['/api/referral/qr'],
  });
  
  // Extract the actual data from the API response
  const qrData = qrResponse?.success ? qrResponse.data : null;
  
  const referralCode = userData?.referralCode || '';
  const referralLink = `${window.location.origin}/register?ref=${referralCode}`;
  
  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: message,
      });
    });
  };
  
  const shareReferralLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join HyperDAG',
          text: 'Join me on HyperDAG, the Web3 collaborative ecosystem for innovation. Use my referral code to sign up!',
          url: referralLink,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyToClipboard(referralLink, 'Referral link copied to clipboard!');
    }
  };
  
  return (
    <div className="container max-w-5xl py-6">
      <h1 className="text-3xl font-bold mb-2">Refer Friends</h1>
      <p className="text-muted-foreground mb-8">
        Invite friends to join HyperDAG and earn rewards when they validate their accounts.
      </p>
      
      <Tabs defaultValue="stats" className="mb-8">
        <TabsList className="mb-4">
          <TabsTrigger value="stats">Stats</TabsTrigger>
          <TabsTrigger value="share">Share</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stats">
          <div className="grid grid-cols-1 gap-6">
            <ReferralStatsCard />
            
            <Card>
              <CardHeader>
                <CardTitle>Referral Details</CardTitle>
                <CardDescription>
                  Track the status of your referred users
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReferralTable />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="share">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Your Referral Code</CardTitle>
                <CardDescription>
                  Share this code with friends to earn rewards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <Input
                    value={referralCode}
                    readOnly
                    className="font-mono text-center text-lg"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(referralCode, 'Referral code copied to clipboard!')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Referral Link</CardTitle>
                <CardDescription>
                  Share this link directly with friends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <Input
                    value={referralLink}
                    readOnly
                    className="text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard(referralLink, 'Referral link copied to clipboard!')}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="flex space-x-2 mt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={shareReferralLink}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  
                  <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex-1">
                        <QrCode className="h-4 w-4 mr-2" />
                        QR Code
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Your Referral QR Code</DialogTitle>
                        <DialogDescription>
                          Let friends scan this code to join HyperDAG with your referral.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-center py-4">
                        {qrData?.qrCodeUrl ? (
                          <img 
                            src={qrData.qrCodeUrl} 
                            alt="Referral QR Code" 
                            className="w-48 h-48 border p-2 rounded-lg"
                          />
                        ) : (
                          <div className="w-48 h-48 flex items-center justify-center bg-muted rounded-lg">
                            Loading QR code...
                          </div>
                        )}
                      </div>
                      <div className="text-center text-sm text-muted-foreground">
                        <p>Referral Code: {referralCode}</p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>How Referrals Work</CardTitle>
                <CardDescription>
                  Learn how to earn rewards through the referral program
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2">1. Share Your Code</h3>
                      <p className="text-sm text-muted-foreground">
                        Share your unique referral code or link with friends who might be interested in joining HyperDAG.
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2">2. Friends Register</h3>
                      <p className="text-sm text-muted-foreground">
                        When your friends sign up using your referral code, they become part of your network.
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h3 className="font-semibold mb-2">3. Earn Rewards</h3>
                      <p className="text-sm text-muted-foreground">
                        When your referrals complete their profile with wallet connection and 2FA, you both earn HDAG tokens.
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <h3 className="font-semibold mb-2">Reward Structure</h3>
                    <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                      <li>Receive 5 HDAG tokens for each validated referral.</li>
                      <li>Earn 2 HDAG tokens for level 2 referrals (friends of friends).</li>
                      <li>Earn 1 HDAG token for level 3 referrals.</li>
                      <li>Rewards are vested over 6 months and released gradually.</li>
                      <li>Unclaimed rewards after 1 year will be returned to the community pool.</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}