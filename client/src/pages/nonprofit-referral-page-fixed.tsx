import { useEffect, useState } from 'react';
import { useLocation, Link as WouterLink } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HelpCircle, Share2, ArrowRight, Gift, Award, Heart, Handshake, Twitter, Facebook, Linkedin, Send } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { Separator } from '@/components/ui/separator';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { useToast } from '@/hooks/use-toast';

const NonprofitReferralPage = () => {
  const [location] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [nonprofits, setNonprofits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const { copyToClipboard, isCopied } = useCopyToClipboard();
  
  // Construct the referral link
  const baseUrl = window.location.origin;
  const referralLink = user ? `${baseUrl}/join?ref=${user.referralCode}` : `${baseUrl}/join`;
  const referralLinkForNonprofits = user ? `${baseUrl}/nonprofits/submit?ref=${user.referralCode}` : `${baseUrl}/nonprofits/submit`;

  useEffect(() => {
    const fetchNonprofits = async () => {
      try {
        const response = await apiRequest('GET', '/api/organizations');
        if (response.ok) {
          const data = await response.json();
          setNonprofits(data);
        } else {
          console.error('Failed to fetch nonprofits');
        }
      } catch (err) {
        console.error('Error fetching nonprofits:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchQrCode = async () => {
      try {
        if (user) {
          const response = await apiRequest('GET', '/api/referral/qr');
          if (response.ok) {
            const data = await response.json();
            setQrCodeUrl(data.data.qrCodeUrl);
          }
        }
      } catch (err) {
        console.error('Error fetching QR code:', err);
      }
    };

    fetchNonprofits();
    fetchQrCode();
  }, [user]);

  const handleCopyReferralLink = () => {
    copyToClipboard(referralLink);
    toast({
      title: "Link copied!",
      description: "Share this link with friends to earn rewards."
    });
  };

  const handleCopyNonprofitLink = () => {
    copyToClipboard(referralLinkForNonprofits);
    toast({
      title: "Nonprofit referral link copied!",
      description: "Share this link with organizations to help them join HyperDAG."
    });
  };

  const shareToTwitter = () => {
    const text = encodeURIComponent("Join me on HyperDAG, a revolutionary Web3 platform for developers and organizations! Use my referral link:");
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(referralLink)}`, "_blank");
  };

  const shareToFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, "_blank");
  };

  const shareToLinkedIn = () => {
    const title = encodeURIComponent("Join HyperDAG - Web3 for Everyone");
    const summary = encodeURIComponent("HyperDAG is a revolutionary Web3 platform for developers and organizations. Join using my referral link!");
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralLink)}&title=${title}&summary=${summary}`, "_blank");
  };

  const shareToTelegram = () => {
    const text = encodeURIComponent("Join me on HyperDAG, a revolutionary Web3 platform for developers and organizations! Use my referral link: " + referralLink);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`, "_blank");
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Share & Support Nonprofits</h1>
        <p className="mt-2 text-gray-600">
          Help nonprofit organizations discover HyperDAG and earn rewards when they join.
        </p>
      </div>
      
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="invite">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="invite">Invite Nonprofits</TabsTrigger>
              <TabsTrigger value="share">Share on Social Media</TabsTrigger>
            </TabsList>
            
            <TabsContent value="invite" className="mt-6">
              <Card>
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Gift className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Double Rewards for Nonprofit Referrals</CardTitle>
                      <CardDescription>
                        When you refer a nonprofit that joins HyperDAG, both you and the organization receive tokens.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6">
                  <div className="mb-6">
                    <h3 className="font-semibold text-lg mb-3">Your Nonprofit Referral Link</h3>
                    <div className="relative flex items-center">
                      <input 
                        type="text" 
                        value={referralLinkForNonprofits} 
                        readOnly
                        className="w-full rounded-md border border-gray-300 bg-gray-50 py-2 pl-3 pr-12 text-sm text-gray-800"
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="absolute right-1 h-7" 
                        onClick={handleCopyNonprofitLink}
                      >
                        {isCopied ? 'Copied!' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Award className="h-5 w-5 text-primary" />
                        Benefits for Nonprofits
                      </h3>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <ArrowRight className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                          <span>Receive an SBT (Soulbound Token) to verify authenticity</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                          <span>Build reputation scores based on Web3 activity</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                          <span>Accept donations in tokens from community members</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                          <span>Maintain complete ownership of your data</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                          <span>Access a global community of supporters</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                          <span>Be featured in our nonprofit directory</span>
                        </li>
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-primary" />
                        How It Works
                      </h3>
                      <ol className="space-y-2 list-decimal list-inside">
                        <li className="pl-2">Submit your nonprofit information</li>
                        <li className="pl-2">Verify your email address</li>
                        <li className="pl-2">Receive your organization's Soulbound Token (SBT)</li>
                        <li className="pl-2">Start accepting donations</li>
                        <li className="pl-2">Build reputation through community engagement</li>
                      </ol>

                      <p className="text-sm text-muted-foreground mt-4">
                        <strong>Important:</strong> Nonprofits have one year to claim their tokens by verifying their account. After that, unclaimed tokens may be redistributed to active organizations.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button 
                      asChild
                      className="w-full sm:w-auto"
                    >
                      <WouterLink to="/nonprofits/submit">
                        Register Your Nonprofit
                      </WouterLink>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="mt-6">
                <h3 className="font-semibold text-xl mb-4">Our Verified Nonprofits</h3>
                
                {loading ? (
                  <div className="grid md:grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="animate-pulse">
                        <CardHeader>
                          <div className="h-6 bg-muted rounded-md w-3/4"></div>
                          <div className="h-4 bg-muted rounded-md w-1/2 mt-2"></div>
                        </CardHeader>
                        <CardContent>
                          <div className="h-4 bg-muted rounded-md w-full"></div>
                          <div className="h-4 bg-muted rounded-md w-full mt-2"></div>
                          <div className="h-4 bg-muted rounded-md w-2/3 mt-2"></div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : nonprofits.length > 0 ? (
                  <div className="grid md:grid-cols-3 gap-4">
                    {nonprofits.slice(0, 3).map((nonprofit) => (
                      <Card key={nonprofit.id}>
                        <CardHeader>
                          <CardTitle>{nonprofit.name}</CardTitle>
                          <CardDescription>{nonprofit.type}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm line-clamp-3">{nonprofit.description}</p>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            variant="outline" 
                            size="sm"
                            asChild
                          >
                            <WouterLink to={`/nonprofits/${nonprofit.id}`}>
                              View Details
                            </WouterLink>
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 border rounded-lg bg-muted/20">
                    <p>No verified nonprofits found. Be the first to register!</p>
                    <Button 
                      className="mt-4"
                      asChild
                    >
                      <WouterLink to="/nonprofits/submit">
                        Register Your Nonprofit
                      </WouterLink>
                    </Button>
                  </div>
                )}

                {nonprofits.length > 3 && (
                  <div className="mt-4 text-center">
                    <Button 
                      variant="outline"
                      asChild
                    >
                      <WouterLink to="/nonprofits">
                        View All Nonprofits
                      </WouterLink>
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="share" className="mt-6">
              <Card>
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2">
                      <Share2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle>Spread the Word</CardTitle>
                      <CardDescription>
                        Share HyperDAG with your network and help us grow our ecosystem of verified nonprofits.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6">
                  {/* Share on social media section */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-lg mb-3">Share on Social Media</h3>
                    <div className="flex flex-wrap gap-3">
                      <Button 
                        variant="outline" 
                        className="flex items-center gap-2"
                        onClick={shareToTwitter}
                      >
                        <Twitter className="h-4 w-4 text-[#1DA1F2]" />
                        Twitter
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex items-center gap-2"
                        onClick={shareToFacebook}
                      >
                        <Facebook className="h-4 w-4 text-[#4267B2]" />
                        Facebook
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex items-center gap-2"
                        onClick={shareToLinkedIn}
                      >
                        <Linkedin className="h-4 w-4 text-[#0077b5]" />
                        LinkedIn
                      </Button>
                      <Button 
                        variant="outline" 
                        className="flex items-center gap-2"
                        onClick={shareToTelegram}
                      >
                        <Send className="h-4 w-4 text-[#0088cc]" />
                        Telegram
                      </Button>
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  {/* QR code section */}
                  <div className="mb-6">
                    <h3 className="font-semibold text-lg mb-3">Your Referral QR Code</h3>
                    {qrCodeUrl ? (
                      <div className="flex flex-col items-center p-4 border rounded-lg bg-gray-50">
                        <div className="mb-3 p-2 bg-white rounded-lg shadow-sm">
                          <img 
                            src={qrCodeUrl} 
                            alt="Referral QR Code" 
                            className="w-48 h-48" 
                          />
                        </div>
                        <p className="text-sm text-center text-gray-600 mt-2">
                          Scan this code to join HyperDAG using your referral.
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-3"
                          onClick={() => {
                            // Download the QR code
                            const link = document.createElement('a');
                            link.href = qrCodeUrl;
                            link.download = 'hyperdag-referral-qr.png';
                            link.click();
                          }}
                        >
                          Download QR Code
                        </Button>
                      </div>
                    ) : (
                      <div className="h-48 flex items-center justify-center border rounded-lg bg-gray-50">
                        <div className="h-12 w-12 rounded-full border-4 border-t-primary border-gray-200 animate-spin"></div>
                      </div>
                    )}
                  </div>
                  
                  <Separator className="my-6" />
                  
                  {/* Explainer section */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3">Why Share?</h3>
                    <div className="space-y-3 text-sm">
                      <p>
                        By inviting nonprofits to join HyperDAG, you're helping create a more transparent 
                        and effective charitable ecosystem built on Web3 technology.
                      </p>
                      <p>
                        Our platform enables nonprofits to:
                      </p>
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2">
                          <Handshake className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                          <span>Connect directly with supporters through verified identities</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Heart className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                          <span>Receive donations with minimal fees through Web3 technology</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Award className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                          <span>Build verifiable reputation and impact metrics</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="mt-4 p-3 rounded-lg bg-muted/20">
                      <h4 className="font-semibold">Video Explainer</h4>
                      <p className="text-sm text-muted-foreground">Coming soon - a brief video explaining how HyperDAG helps nonprofits leverage Web3 technologies.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="text-xl">Referral Stats</CardTitle>
            </CardHeader>
            <CardContent>
              {user ? (
                <>
                  <div className="flex items-center justify-between py-1 border-b">
                    <span className="text-sm font-medium">Your Referral Code</span>
                    <span className="font-mono font-bold">{user.referralCode}</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b">
                    <span className="text-sm font-medium">Nonprofits Referred</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-b">
                    <span className="text-sm font-medium">Verified Nonprofits</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="text-sm font-medium">Total Rewards Earned</span>
                    <span className="font-medium">0 HDAG</span>
                  </div>
                </>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-sm text-gray-600">Please log in to see your referral stats.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">1</div>
                <div>
                  <p className="font-medium">Share your unique referral link</p>
                  <p className="text-muted-foreground">Send it to nonprofits you know</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">2</div>
                <div>
                  <p className="font-medium">Organizations register</p>
                  <p className="text-muted-foreground">They create an account using your link</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">3</div>
                <div>
                  <p className="font-medium">Verification process</p>
                  <p className="text-muted-foreground">They verify their nonprofit status</p>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">4</div>
                <div>
                  <p className="font-medium">Earn rewards</p>
                  <p className="text-muted-foreground">Both you and the nonprofit receive tokens</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Have questions about referring nonprofits or how the system works?
              </p>
              <Button variant="outline" asChild className="w-full">
                <WouterLink to="/nonprofits/methodology">
                  Learn About Our Methodology
                </WouterLink>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NonprofitReferralPage;