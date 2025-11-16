import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Zap, 
  Shield, 
  Target,
  CheckCircle,
  AlertCircle,
  Info,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface MarketplaceExplainerProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MarketplaceExplainer({ isOpen: controlledOpen, onOpenChange }: MarketplaceExplainerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [hasSeenExplainer, setHasSeenExplainer] = useState(false);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    // Check if user has seen the explainer before
    const seen = localStorage.getItem('hyperdag-marketplace-explainer-seen');
    if (!seen) {
      setOpen(true);
    } else {
      setHasSeenExplainer(true);
    }
  }, [setOpen]);

  const handleClose = () => {
    localStorage.setItem('hyperdag-marketplace-explainer-seen', 'true');
    setHasSeenExplainer(true);
    setOpen(false);
  };

  const earningTiers = [
    {
      level: 'high',
      color: 'text-green-600 bg-green-50 border-green-200',
      label: 'Arbitrage Ready',
      criteria: '95%+ demand, 25%+ commission',
      earning: '20-35 HDAG/hour',
      description: 'Premium services with immediate arbitrage opportunities',
      examples: ['OpenAI API', 'AWS Credits', 'Uniswap v4']
    },
    {
      level: 'medium',
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      label: 'Free Tier Earnings',
      criteria: '85%+ demand, 20%+ commission',
      earning: '12-25 HDAG/hour',
      description: 'Services where free tier signups generate commissions',
      examples: ['GitHub Copilot', 'Vercel Pro', 'Cloudflare Pro']
    },
    {
      level: 'low',
      color: 'text-red-600 bg-red-50 border-red-200',
      label: 'Low Potential',
      criteria: 'Below 85% demand or 20% commission',
      earning: '5-15 HDAG/hour',
      description: 'Limited earning opportunities, better for learning',
      examples: ['IOTA Shimmer', 'Mirror.xyz', 'Lens Protocol']
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {!hasSeenExplainer && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Info className="h-4 w-4 mr-2" />
            How It Works
          </Button>
        </DialogTrigger>
      )}
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="h-6 w-6 text-primary" />
            HyperDAG Service Market Maker
          </DialogTitle>
          <DialogDescription>
            Earn HDAG tokens by sharing unused service subscriptions with the community
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-full mb-3">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-medium mb-2">1. Share Services</h4>
                  <p className="text-sm text-muted-foreground">
                    List your unused subscriptions or service allocations on the marketplace
                  </p>
                </div>
                <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                  <div className="p-2 bg-green-100 rounded-full mb-3">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-medium mb-2">2. Earn Commissions</h4>
                  <p className="text-sm text-muted-foreground">
                    Receive referral commissions when others sign up using your HyperDAG links
                  </p>
                </div>
                <div className="flex flex-col items-center text-center p-4 border rounded-lg">
                  <div className="p-2 bg-purple-100 rounded-full mb-3">
                    <Zap className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="font-medium mb-2">3. Optimize Markets</h4>
                  <p className="text-sm text-muted-foreground">
                    AI automatically matches supply and demand for maximum earning potential
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Color-Coded Earning System */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Color-Coded Earning Potential
              </CardTitle>
              <CardDescription>
                Services are color-coded based on demand level and commission rates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {earningTiers.map((tier) => (
                <div key={tier.level} className={`p-4 rounded-lg border ${tier.color}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={tier.color}>
                          {tier.label}
                        </Badge>
                        <span className="text-sm font-medium">{tier.earning}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{tier.criteria}</p>
                    </div>
                    {tier.level === 'high' && <CheckCircle className="h-5 w-5 text-green-600" />}
                    {tier.level === 'medium' && <AlertCircle className="h-5 w-5 text-yellow-600" />}
                    {tier.level === 'low' && <Info className="h-5 w-5 text-red-600" />}
                  </div>
                  
                  <p className="text-sm mb-3">{tier.description}</p>
                  
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground">Examples:</span>
                    {tier.examples.map((example, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {example}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Key Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Platform Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">40+ Integrated Services</h4>
                    <p className="text-sm text-muted-foreground">
                      AI, blockchain, cloud computing, and development platforms
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Automated Referral Links</h4>
                    <p className="text-sm text-muted-foreground">
                      All links pre-populated with HyperDAG referral codes
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Real-time Demand Tracking</h4>
                    <p className="text-sm text-muted-foreground">
                      Live metrics showing market demand and earning potential
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Category Organization</h4>
                    <p className="text-sm text-muted-foreground">
                      Services organized by AI, development, compute, storage, etc.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between items-center pt-4">
            <Button variant="outline" onClick={handleClose}>
              I Understand
            </Button>
            <Button onClick={handleClose} className="flex items-center gap-2">
              Start Earning
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}