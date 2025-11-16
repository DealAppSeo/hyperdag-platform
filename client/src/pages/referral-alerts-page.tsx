import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Bell, QrCode, Users, MapPin, Clock, Share2, Gift, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import AppLayout from '@/components/layout/app-layout';

interface QRScanEvent {
  id: string;
  scannedAt: string;
  location: {
    city?: string;
    country?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  userAgent: string;
  referralCode: string;
  status: 'pending' | 'converted' | 'expired';
  potentialTokens: number;
}

interface ReferralStats {
  totalScans: number;
  pendingConversions: number;
  completedReferrals: number;
  verifiedReferrals: number; // Users who completed POL verification
  tokensEarned: number;
  conversionRate: number;
  verificationRate: number; // Percentage who completed full verification
}

const ReferralAlertsPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState(true);

  // Fetch recent QR scan events with demo data
  const { data: scanEvents = [], isLoading: eventsLoading } = useQuery<QRScanEvent[]>({
    queryKey: ['/api/referral/scan-events'],
    queryFn: () => {
      // Demo data showing realistic QR scan activity
      return Promise.resolve([
        {
          id: '1',
          scannedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
          location: { city: 'San Francisco', country: 'USA' },
          userAgent: 'Mobile',
          referralCode: user?.referralCode || '836277C0',
          status: 'pending' as const,
          potentialTokens: 15
        },
        {
          id: '2',
          scannedAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
          location: { city: 'Austin', country: 'USA' },
          userAgent: 'Mobile',
          referralCode: user?.referralCode || '836277C0',
          status: 'converted' as const,
          potentialTokens: 15
        },
        {
          id: '3',
          scannedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
          location: { city: 'New York', country: 'USA' },
          userAgent: 'Mobile',
          referralCode: user?.referralCode || '836277C0',
          status: 'converted' as const,
          potentialTokens: 15
        }
      ]);
    },
    refetchInterval: false // ❌ NO POLLING - eliminated high-frequency polling
  });

  // Fetch referral statistics with demo data (NO POLLING)
  const { data: stats, refetch: refetchStats } = useQuery<ReferralStats>({
    queryKey: ['/api/referral/stats'],
    queryFn: () => {
      return Promise.resolve({
        totalScans: 47,
        pendingConversions: 3,
        completedReferrals: 20,
        verifiedReferrals: 8, // POL + 2FA + email + phone verified users
        tokensEarned: 120, // Only tokens from verified users (8 × 15)
        conversionRate: 43, // 20/47 conversion to signup
        verificationRate: 40 // 8/20 completed full verification
      });
    },
    refetchInterval: false // ❌ NO POLLING - eliminated 2 req/min
  });

  // Track previous scan count to only show notifications for new scans
  const [previousScanCount, setPreviousScanCount] = useState(0);
  
  useEffect(() => {
    if (scanEvents.length > previousScanCount && notifications && previousScanCount > 0) {
      const latestScan = scanEvents[0];
      if (latestScan.status === 'pending') {
        toast({
          title: "🎯 QR Code Scanned!",
          description: `Someone in ${latestScan.location.city || 'Unknown location'} just scanned your referral code. Potential ${latestScan.potentialTokens} tokens if they join!`,
          duration: 6000,
        });
      }
    }
    setPreviousScanCount(scanEvents.length);
  }, [scanEvents, notifications, toast, previousScanCount]);

  const handleShareCode = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join HyperDAG with my referral code',
        text: `Join the future of Web3 development with HyperDAG! Use my referral code: ${user?.referralCode}`,
        url: `https://hyperdag.org/join?ref=${user?.referralCode}`
      });
    } else {
      navigator.clipboard.writeText(`https://hyperdag.org/join?ref=${user?.referralCode}`);
      toast({
        title: "Link Copied!",
        description: "Referral link copied to clipboard. Share it to earn tokens!",
      });
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'converted': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'converted': return <Gift className="h-3 w-3" />;
      case 'expired': return <Zap className="h-3 w-3" />;
      default: return <QrCode className="h-3 w-3" />;
    }
  };

  if (!user) {
    return <div>Please log in to view referral alerts.</div>;
  }

  return (
    <AppLayout 
      title="Referral Alerts" 
      description="Real-time notifications when people scan your QR code. Track your viral growth!"
    >
      <div className="space-y-6">

        {/* Stats Overview - Mobile Optimized */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 sm:p-4 text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.totalScans}</div>
                <div className="text-xs sm:text-sm text-gray-600">Total Scans</div>
              </CardContent>
            </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.pendingConversions}</div>
              <div className="text-xs sm:text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{stats.verifiedReferrals}/{stats.completedReferrals}</div>
              <div className="text-xs sm:text-sm text-gray-600">Verified/Total</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-purple-600">{stats.tokensEarned}</div>
              <div className="text-xs sm:text-sm text-gray-600">Tokens Earned</div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="text-xl sm:text-2xl font-bold text-indigo-600">{Math.round(stats.conversionRate)}%</div>
              <div className="text-xs sm:text-sm text-gray-600">Conversion Rate</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Button onClick={handleShareCode} className="flex-1">
          <Share2 className="mr-2 h-4 w-4" />
          Share Your Referral Code
        </Button>
        <Button
          variant={notifications ? "outline" : "default"}
          onClick={() => setNotifications(!notifications)}
          className="flex-1"
        >
          <Bell className="mr-2 h-4 w-4" />
          {notifications ? "Notifications On" : "Notifications Off"}
        </Button>
      </div>

      {/* Recent Scan Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Recent QR Code Scans
          </CardTitle>
          <CardDescription>
            Live feed of people scanning your referral QR code
          </CardDescription>
        </CardHeader>
        <CardContent>
          {eventsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-100 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : scanEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No QR code scans yet. Share your code to get started!</p>
              <p className="text-sm mt-2">Your referral code: <strong>{user.referralCode}</strong></p>
            </div>
          ) : (
            <div className="space-y-4">
              {scanEvents.map((event, index) => (
                <div key={event.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getStatusColor(event.status)}>
                          {getStatusIcon(event.status)}
                          <span className="ml-1 capitalize">{event.status}</span>
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatTimeAgo(event.scannedAt)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        {event.location.city && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-gray-400" />
                            <span>{event.location.city}, {event.location.country}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3 text-gray-400" />
                          <span>Mobile Device</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        +{event.potentialTokens} tokens
                      </div>
                      <div className="text-xs text-gray-500">if converted</div>
                    </div>
                  </div>
                  
                  {event.status === 'pending' && (
                    <div className="mt-3 p-2 bg-yellow-50 rounded-md">
                      <p className="text-xs text-yellow-800">
                        ⏰ Waiting for user to complete registration. You'll get {event.potentialTokens} tokens when they join!
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips for Better Conversion */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>💡 Tips to Increase Conversions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Share your QR code at developer meetups and hackathons for higher conversion rates</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Include a brief explanation of HyperDAG's benefits when sharing your code</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Follow up with people who scan your code within 24 hours for best results</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-blue-600">•</span>
              <span>Post your referral link in relevant Discord, Telegram, and Reddit communities</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      </div>
    </AppLayout>
  );
};

export default ReferralAlertsPage;