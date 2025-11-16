/**
 * Newsletter Signup System - AI Symphony P1.3 Implementation
 * Conversion-optimized design with RepID integration
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Mail, Sparkles, TrendingUp, Users, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NewsletterSignupProps {
  variant?: 'landing' | 'sidebar' | 'popup' | 'footer';
  showBenefits?: boolean;
  showRepIDIntegration?: boolean;
}

export function NewsletterSignup({ 
  variant = 'landing', 
  showBenefits = true,
  showRepIDIntegration = true 
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Submit to newsletter service
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          source: variant,
          interests: ['ai-optimization', 'cost-savings', 'web3-ai'],
          repidEligible: showRepIDIntegration
        })
      });

      const result = await response.json();

      if (result.success) {
        setIsSubscribed(true);
        toast({
          title: "Welcome to AI Symphony! 🎼",
          description: "Check your email for your first optimization guide + RepID starter bonus!"
        });

        // Award RepID points for newsletter signup
        if (showRepIDIntegration) {
          await fetch('/api/repid/update-score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: result.data.userId || email,
              actions: { newsletter_signup: 1, community_engagement: 1 },
              context: { source: variant, contentQuality: 0.7 }
            })
          });
        }
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Subscription Failed",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Different layouts based on variant
  if (variant === 'sidebar') {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            AI Symphony Updates
          </CardTitle>
          <CardDescription className="text-sm">
            Get cost optimization tips & insider insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isSubscribed ? (
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-sm"
              />
              <Button 
                type="submit" 
                className="w-full" 
                size="sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Subscribing..." : "Join 500+ Optimizers"}
              </Button>
            </form>
          ) : (
            <div className="text-center py-4">
              <Check className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium">Welcome to the Symphony!</p>
              <p className="text-xs text-muted-foreground">Check your email for first guide</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (variant === 'footer') {
    return (
      <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 p-6 rounded-lg">
        <div className="max-w-md mx-auto text-center">
          <h3 className="text-lg font-semibold mb-2">Stay Ahead of AI Costs</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Weekly insights on AI optimization & cost reduction strategies
          </p>
          
          {!isSubscribed ? (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="flex-1"
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "..." : "Subscribe"}
              </Button>
            </form>
          ) : (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              <span className="font-medium">Subscribed successfully!</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Landing page variant (full-featured)
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-blue-100 px-4 py-2 rounded-full text-sm font-medium text-purple-700 mb-4">
          <Sparkles className="h-4 w-4" />
          Join the AI Optimization Revolution
        </div>
        
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Cut Your AI Costs by 79%
        </h1>
        
        <p className="text-xl text-muted-foreground mb-6 max-w-2xl mx-auto">
          Get exclusive insights, optimization strategies, and early access to AI Symphony features that save thousands monthly.
        </p>

        <div className="flex justify-center gap-6 mb-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            500+ Subscribers
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            79% Avg. Savings
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Weekly Insights
          </div>
        </div>
      </div>

      {!isSubscribed ? (
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Get Your Free AI Cost Analysis</CardTitle>
            <CardDescription>
              Plus exclusive optimization strategies delivered weekly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-center"
              />
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700" 
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Subscribing..." : "Get Free Analysis + Weekly Insights"}
              </Button>
              
              <p className="text-xs text-muted-foreground text-center">
                No spam. Unsubscribe anytime. Usually saves $2,400+ monthly.
              </p>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-6">
            <div className="mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-green-600 mb-2">Welcome to AI Symphony!</h3>
              <p className="text-muted-foreground">
                Check your email for your personalized AI cost analysis and first optimization guide.
              </p>
            </div>

            {showRepIDIntegration && (
              <div className="mt-6 p-4 bg-purple-50 rounded-lg">
                <Badge className="mb-2 bg-gradient-to-r from-purple-600 to-blue-600">
                  RepID Bonus Unlocked!
                </Badge>
                <p className="text-sm text-muted-foreground">
                  You've earned your first RepID points for joining. Complete your profile to unlock more optimization features.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showBenefits && !isSubscribed && (
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">Weekly Cost Analysis</h3>
            <p className="text-sm text-muted-foreground">
              Get detailed breakdowns of AI spending trends and optimization opportunities
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Exclusive Strategies</h3>
            <p className="text-sm text-muted-foreground">
              Advanced ANFIS optimization techniques and multi-provider arbitrage tips
            </p>
          </div>
          
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Early Access</h3>
            <p className="text-sm text-muted-foreground">
              First access to new AI Symphony features and beta optimization tools
            </p>
          </div>
        </div>
      )}
    </div>
  );
}