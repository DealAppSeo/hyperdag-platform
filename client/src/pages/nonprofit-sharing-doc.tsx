import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Share2, ArrowRight, ExternalLink } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { useToast } from '@/hooks/use-toast';
import html2canvas from 'html2canvas';
import { apiRequest } from '@/lib/queryClient';

const NonprofitSharingDoc = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { copyToClipboard } = useCopyToClipboard();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const baseUrl = window.location.origin;
  const referralLink = user ? `${baseUrl}/join?ref=${user.referralCode}` : `${baseUrl}/join`;
  const nonprofitReferralLink = user ? `${baseUrl}/nonprofits/submit?ref=${user.referralCode}` : `${baseUrl}/nonprofits/submit`;

  useEffect(() => {
    const fetchQrCode = async () => {
      try {
        if (user) {
          const response = await apiRequest('GET', '/api/referral/qr');
          if (response.ok) {
            const data = await response.json();
            setQrCodeUrl(data.data.qrCodeUrl);
          }
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching QR code:', err);
        setLoading(false);
      }
    };

    fetchQrCode();
  }, [user]);

  const downloadAsImage = async () => {
    const element = document.getElementById('sharing-doc');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.href = image;
      link.download = 'HyperDAG-Nonprofit-Referral.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Document downloaded!",
        description: "You can now share this image with others.",
        duration: 3000,
      });
    } catch (err) {
      console.error('Error generating image:', err);
      toast({
        title: "Download failed",
        description: "Could not generate the image. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const copyShareLink = () => {
    copyToClipboard(referralLink);
    toast({
      title: "Link copied!",
      description: "Share link has been copied to clipboard.",
      duration: 3000,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold">Shareable Nonprofit Referral</h1>
        <div className="flex gap-2">
          <Button onClick={downloadAsImage} className="flex items-center gap-2">
            <Download className="h-4 w-4" /> Download as Image
          </Button>
          <Button variant="outline" onClick={copyShareLink} className="flex items-center gap-2">
            <Share2 className="h-4 w-4" /> Copy Link
          </Button>
        </div>
      </div>

      <div id="sharing-doc" className="bg-white dark:bg-gray-950 p-8 rounded-lg border shadow-lg max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <img 
              src="/hyperdag-logo.svg" 
              alt="HyperDAG Logo" 
              className="h-10 w-10"
              onError={(e) => {
                // Fallback if logo doesn't exist
                e.currentTarget.style.display = 'none';
              }}
            />
            <div>
              <h2 className="text-2xl font-bold">HyperDAG</h2>
              <p className="text-sm text-muted-foreground">Blockchain-Powered Nonprofit Support</p>
            </div>
          </div>
          
          {qrCodeUrl && !loading && (
            <div className="text-center">
              <img 
                src={qrCodeUrl} 
                alt="Referral QR Code" 
                className="h-24 w-24"
              />
              <p className="text-xs mt-1 font-medium">Scan to join</p>
            </div>
          )}
        </div>

        <h3 className="text-xl font-bold mb-4">Join the HyperDAG Nonprofit Ecosystem</h3>
        
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="font-semibold text-lg mb-2">For Individuals</h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                <span>Support verified nonprofits with your earned tokens</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                <span>Perform acts of kindness to earn rewards</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                <span>Donate without direct financial contribution</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                <span>Refer friends and earn more tokens to donate</span>
              </li>
            </ul>
            
            <div className="mt-4 p-3 bg-primary/10 rounded-md">
              <p className="text-sm font-medium">Join with my referral link:</p>
              <p className="text-xs font-mono mt-1 break-all">{referralLink}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-lg mb-2">For Nonprofit Organizations</h4>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                <span>Receive a Soulbound Token to establish your reputation</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                <span>Accept donations from community members</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                <span>Maintain ownership of your organization's data</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 mt-1 text-primary flex-shrink-0" />
                <span>One year to claim tokens by verifying your account</span>
              </li>
            </ul>
            
            <div className="mt-4 p-3 bg-primary/10 rounded-md">
              <p className="text-sm font-medium">Register your nonprofit:</p>
              <p className="text-xs font-mono mt-1 break-all">{nonprofitReferralLink}</p>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">How It Works</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Sign up on HyperDAG using the referral link or QR code</li>
            <li>Complete profile and earn tokens through various activities</li>
            <li>Nonprofits register and go through verification process</li>
            <li>Users donate earned tokens to verified nonprofits</li>
            <li>Nonprofits build reputation through community engagement</li>
          </ol>
        </div>
        
        {user && (
          <div className="mt-4 text-center text-sm text-muted-foreground border-t pt-4">
            <p>Referred by: {user.username} | Referral Code: {user.referralCode}</p>
          </div>
        )}
        
        <div className="mt-6 text-center">
          <p className="text-sm">Learn more at <span className="font-medium">{baseUrl}</span></p>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <p className="text-muted-foreground mb-4">Want to learn more about how our nonprofit system works?</p>
        <Button 
          variant="outline" 
          onClick={() => window.location.href = '/nonprofits/methodology'}
          className="flex items-center gap-2"
        >
          View Our Nonprofit Methodology <ExternalLink className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default NonprofitSharingDoc;