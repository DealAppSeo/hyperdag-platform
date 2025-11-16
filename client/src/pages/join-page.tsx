import { useState, useEffect } from 'react';
import { useLocation, useRoute, Link } from 'wouter';
import { Share2, CheckCircle2, Users, TrendingUp, Shield, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';

export default function JoinPage() {
  const [_, params] = useRoute('/join');
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const [referrerCode, setReferrerCode] = useState<string | null>(null);
  
  // Extract referrer code from query parameters
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const referrer = searchParams.get('referrer');
    if (referrer) {
      setReferrerCode(referrer);
    }
  }, []);
  
  // If user is already logged in, redirect to home
  useEffect(() => {
    if (user) {
      setLocation('/');
    }
  }, [user, setLocation]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      {/* Hero section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="relative max-w-7xl mx-auto">
          {/* Referral badge */}
          {referrerCode && (
            <div className="absolute top-0 left-0 -mt-4 md:mt-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-full text-sm shadow-md">
              You were invited by a friend!
            </div>
          )}
          
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              Unlock <span className="text-primary">AI-Powered Web3</span> Opportunities
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-6">
              Create a simple username to discover endless possibilities while maintaining complete control of your data
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 px-6 py-4 rounded-lg max-w-2xl mx-auto">
              <p className="text-blue-800 dark:text-blue-200 font-medium">
                Quick onboarding, immediate value: Just enter a username and password to get started
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Button 
              size="lg" 
              className="text-base sm:text-lg py-5 sm:py-6 bg-primary hover:bg-primary/90 text-white w-full sm:w-auto"
              onClick={() => setLocation('/auth')}
            >
              Start Your Journey in 10 Seconds
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-base sm:text-lg py-5 sm:py-6 w-full sm:w-auto" 
              onClick={() => setLocation('/about')}
            >
              See How It Works
            </Button>
          </div>
          
          {/* Value proposition cards */}
          {/* Why join now - urgency section */}
          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-6 mb-10 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-4">Why Join HyperDAG Today?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-medium mb-1">Early Adopter Advantage</h3>
                <p className="text-sm text-gray-600">Early members receive higher reputation scores and premium features</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="font-medium mb-1">Immediate Connection</h3>
                <p className="text-sm text-gray-600">Start matching with projects and opportunities right away</p>
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="font-medium mb-1">Privacy Guaranteed</h3>
                <p className="text-sm text-gray-600">Your data is always protected and under your control</p>
              </div>
            </div>
          </div>
          
          {/* But wait, what is a DAG? Section */}
          <div className="text-center mb-10">
            <Link href="/definitions" className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800 gap-1.5 transition-colors">
              <span className="text-lg font-medium underline">But wait, what is a DAG anyway?</span>
              <HelpCircle className="h-5 w-5" />
            </Link>
            <p className="mt-2 text-gray-600 max-w-xl mx-auto">
              A DAG is like a non-linear blockchain that enables faster transactions with lower fees.
              <Link href="/definitions" className="ml-1 text-blue-600 hover:text-blue-800 underline">
                Learn more
              </Link>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
            <Card className="bg-white/90 hover:bg-white transition-all hover:shadow-md">
              <CardHeader className="pb-2 sm:pb-2 px-4 sm:px-6">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Zero-Knowledge Auth</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <CardDescription className="text-gray-600 text-sm">
                  Prove your identity without revealing personal details using cutting-edge ZKP technology
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="bg-white/90 hover:bg-white transition-all hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-xl">HyperCrowd Funding</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-gray-600">
                  Access grant matching and crowd-driven funding for your projects with transparent allocation
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition-all hover:shadow-md border-2 border-indigo-100">
              <CardHeader className="pb-2 sm:pb-2 px-4 sm:px-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-indigo-100 rounded-full flex items-center justify-center mb-3 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 sm:h-7 sm:w-7 text-indigo-600">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4"/>
                    <path d="M12 8h.01"/>
                  </svg>
                </div>
                <CardTitle className="text-lg sm:text-xl">AI-Optimized Opportunities</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <CardDescription className="text-gray-700 text-sm">
                  <span className="font-medium text-indigo-700 block mb-1">Discover your perfect match</span>
                  Our AI analyzes thousands of projects and grants to connect you with opportunities that perfectly align with your skills and interests
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="bg-white/90 hover:bg-white transition-all hover:shadow-md">
              <CardHeader className="pb-2 sm:pb-2 px-4 sm:px-6">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-lg sm:text-xl">RepID</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <CardDescription className="text-gray-600 text-sm">
                  Build a portable reputation that follows you across platforms while preserving your privacy
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="bg-white/90 hover:bg-white transition-all hover:shadow-md">
              <CardHeader className="pb-2 sm:pb-2 px-4 sm:px-6">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg sm:text-xl">Privacy-First</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <CardDescription className="text-gray-600 text-sm">
                  Your data belongs to you with encrypted storage and self-sovereign identity principles
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Referral benefits section */}
      {referrerCode && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">You Both Win!</h2>
              <p className="text-xl text-gray-700 mb-8">
                When you join through your friend's invitation, both of you receive HDAG token rewards!
              </p>
              
              <div className="bg-white rounded-xl p-6 shadow-sm mb-8">
                <div className="flex justify-between items-center">
                  <div className="text-left">
                    <p className="text-sm text-gray-500">Your friend gets</p>
                    <p className="text-2xl font-bold text-primary">+5 HDAG</p>
                  </div>
                  <div className="h-10 w-px bg-gray-200"></div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">You get</p>
                    <p className="text-2xl font-bold text-primary">+2 HDAG</p>
                  </div>
                </div>
              </div>
              
              <Button 
                size="lg" 
                className="text-lg" 
                onClick={() => setLocation('/auth')}
              >
                <Share2 className="mr-2 h-5 w-5" /> Join & Earn Rewards
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Trust signals */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">Trusted by Developers Building Tomorrow's Privacy-Focused Web3 AI Projects Today</h2>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">HyperDAG</h3>
              <p className="text-gray-400">
                A quantum-resistant, AI-optimized, privacy-first hybrid DAG/blockchain ecosystem
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link href="/about" className="text-gray-400 hover:text-white">About</Link></li>
                <li><Link href="/features" className="text-gray-400 hover:text-white">Features</Link></li>
                <li><Link href="/definitions" className="text-gray-400 hover:text-white">What is a DAG?</Link></li>
                <li><Link href="/docs" className="text-gray-400 hover:text-white">Documentation</Link></li>
                <li><Link href="/auth" className="text-gray-400 hover:text-white">Join Now</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-4">Connect</h3>
              <ul className="space-y-2">
                <li><a href="https://t.me/HyperDagBot" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">Telegram</a></li>
                <li><span className="text-gray-400 cursor-not-allowed">Discord (Coming Soon)</span></li>
                <li><span className="text-gray-400 cursor-not-allowed">GitHub (Coming Soon)</span></li>
                <li><span className="text-gray-400 cursor-not-allowed">Twitter (Coming Soon)</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>© {new Date().getFullYear()} HyperDAG. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
