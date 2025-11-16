import { useEffect, useState } from 'react';
import { useRoute } from 'wouter';
import { Helmet } from 'react-helmet';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, Star, TrendingDown, Zap, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface ShareLink {
  id: string;
  userId: number;
  contentType: string;
  contentId: string;
  url: string;
  title: string;
  description: string;
  twitterTemplate: string;
  linkedinTemplate: string;
  views: number;
  shares: number;
  conversions: number;
}

export function ShareLanding() {
  const [, params] = useRoute('/share/:linkId');
  const linkId = params?.linkId;
  const [hasTrackedView, setHasTrackedView] = useState(false);

  const { data: shareLinkData, isLoading } = useQuery<{ shareLink: ShareLink }>({
    queryKey: ['/api/share', linkId],
    enabled: !!linkId,
  });

  const shareLink = shareLinkData?.shareLink;

  useEffect(() => {
    // The GET request automatically increments view count on the backend
    // This ensures each page load is tracked
    if (shareLink && !hasTrackedView) {
      setHasTrackedView(true);
      // View is already tracked by the GET request, no additional call needed
    }
  }, [shareLink, hasTrackedView]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center" data-testid="loading-share">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (!shareLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Share Link Not Found</h1>
          <p className="text-white/70 mb-6">This share link may have expired or been removed.</p>
          <Button onClick={() => window.location.href = '/'} data-testid="button-go-home">
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/share/${linkId}`;
  const appUrl = window.location.origin;

  return (
    <>
      <Helmet>
        <title>{shareLink.title} | AI Trinity</title>
        <meta name="description" content={shareLink.description} />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={shareUrl} />
        <meta property="og:title" content={shareLink.title} />
        <meta property="og:description" content={shareLink.description} />
        <meta property="og:image" content={`${appUrl}/og-image.png`} />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={shareUrl} />
        <meta property="twitter:title" content={shareLink.title} />
        <meta property="twitter:description" content={shareLink.description} />
        <meta property="twitter:image" content={`${appUrl}/og-image.png`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        {/* Header */}
        <header className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg"></div>
              <span className="font-bold text-lg">AI Trinity</span>
            </div>
            <Button onClick={() => window.location.href = '/'} variant="ghost" size="sm" data-testid="button-header-home">
              Home
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center mb-12">
            <div className="inline-block bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              🎉 You've been invited!
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-share-title">
              {shareLink.title}
            </h1>
            <p className="text-xl text-white/80 mb-8" data-testid="text-share-description">
              {shareLink.description}
            </p>
            <Button 
              size="lg"
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-6 text-lg"
              onClick={() => window.location.href = '/'}
              data-testid="button-join-now"
            >
              Join AI Trinity <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </div>

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-green-400" />
                </div>
                <h3 className="font-semibold text-lg">79% Cost Savings</h3>
              </div>
              <p className="text-white/70">
                Save money with intelligent AI routing that automatically selects the most cost-effective provider for each request.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-yellow-400" />
                </div>
                <h3 className="font-semibold text-lg">Smart AI Routing</h3>
              </div>
              <p className="text-white/70">
                Our ANFIS system routes requests to the best AI provider based on cost, speed, and quality for optimal results.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="font-semibold text-lg">Earn Rewards</h3>
              </div>
              <p className="text-white/70">
                Get +5 RepID welcome bonus when you sign up, plus earn more by referring friends and participating in the community.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-purple-400" />
                </div>
                <h3 className="font-semibold text-lg">Premium Features</h3>
              </div>
              <p className="text-white/70">
                Access Web3 training, advanced AI models, governance voting, and revenue sharing as you progress through SBT tiers.
              </p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-green-500/20 to-blue-600/20 border border-white/20 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-3">Ready to Save on AI Costs?</h2>
            <p className="text-white/80 mb-6">
              Join thousands of users who are already saving money and earning rewards with AI Trinity. Sign up now and get +5 RepID welcome bonus!
            </p>
            <Button 
              size="lg"
              className="bg-white text-black hover:bg-white/90 px-8 py-6 text-lg font-semibold"
              onClick={() => window.location.href = '/'}
              data-testid="button-cta-signup"
            >
              Get Started Free
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-12 text-center text-sm text-white/50">
            <p>This link has been viewed {shareLink.views} times and shared {shareLink.shares} times</p>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 mt-12">
          <div className="max-w-4xl mx-auto px-6 py-8 text-center text-white/60 text-sm">
            <p>© 2025 AI Trinity. Democratizing AI through bilateral learning.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
