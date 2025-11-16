import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, TrendingUp, Users, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface EmailCapturePopupProps {
  show: boolean;
  onClose: () => void;
  variant?: 'exit-intent' | 'timed' | 'scroll-based';
}

export function EmailCapturePopup({ show, onClose, variant = 'timed' }: EmailCapturePopupProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          source: `popup-${variant}`,
          interests: ['ai-cost-calculator', 'optimization-tips'],
          leadMagnet: 'ai-cost-calculator'
        })
      });

      const result = await response.json();

      if (result.success) {
        setIsSubscribed(true);
        toast({
          title: "🎉 Success! Check your email",
          description: "Your AI Cost Calculator is on the way + weekly optimization tips!"
        });
        
        // Close popup after 3 seconds
        setTimeout(() => {
          onClose();
        }, 3000);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Oops! Something went wrong",
        description: "Please try again or contact support.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPopupContent = () => {
    switch (variant) {
      case 'exit-intent':
        return {
          title: "Wait! Don't miss out on 79% AI savings",
          subtitle: "Get your FREE AI Cost Calculator before you go",
          urgency: "🔥 This offer expires in 24 hours"
        };
      case 'scroll-based':
        return {
          title: "Want to cut your AI costs by 79%?",
          subtitle: "Get our proven AI Cost Calculator (normally $97)",
          urgency: "⚡ Limited time: Free for the next 500 developers"
        };
      default:
        return {
          title: "Cut Your AI Costs by 79% Today",
          subtitle: "Get instant access to our AI Cost Calculator + optimization guide",
          urgency: "⏰ Only 247 spots left at this price"
        };
    }
  };

  const content = getPopupContent();

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-gradient-to-br from-slate-900 to-blue-900 border border-blue-500/30 rounded-2xl p-8 max-w-md w-full shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {!isSubscribed ? (
              <>
                {/* Urgency banner */}
                <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-lg p-3 mb-6 text-center">
                  <div className="text-orange-300 text-sm font-semibold">
                    {content.urgency}
                  </div>
                </div>

                {/* Main content */}
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {content.title}
                  </h3>
                  <p className="text-gray-300 mb-4">
                    {content.subtitle}
                  </p>

                  {/* Benefits */}
                  <div className="bg-slate-800/50 rounded-lg p-4 mb-6 text-left">
                    <div className="text-sm text-gray-300 space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Calculate exact monthly AI savings potential</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                        <span>Compare 15+ AI providers automatically</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                        <span>Weekly optimization tips (avg. $2,400/mo saved)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span>Early access to new cost-saving features</span>
                      </div>
                    </div>
                  </div>

                  {/* Social proof */}
                  <div className="flex items-center justify-center space-x-4 mb-6 text-sm text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>2,847 users</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>79% avg. savings</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Zap className="w-4 h-4" />
                      <span>Instant access</span>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="text-center text-lg py-3"
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white py-3 text-lg font-semibold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Getting Calculator...
                      </>
                    ) : (
                      <>
                        <Gift className="w-5 h-5 mr-2" />
                        Get FREE Calculator + Tips
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-gray-400 text-center">
                    No spam. Unsubscribe anytime. Used by 2,847+ developers.
                  </p>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-green-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Check Your Email! 📧</h3>
                <p className="text-gray-300">
                  Your AI Cost Calculator is on the way, plus you'll get weekly tips that typically save $2,400+ monthly.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing popup display logic
export function useEmailCapturePopup() {
  const [showPopup, setShowPopup] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    // Don't show if already shown this session
    if (hasShown) return;

    // Timed popup - show after 45 seconds
    const timedTimer = setTimeout(() => {
      setShowPopup(true);
      setHasShown(true);
    }, 45000);

    // Exit intent detection
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasShown) {
        setShowPopup(true);
        setHasShown(true);
      }
    };

    // Scroll-based popup - show after scrolling 70%
    const handleScroll = () => {
      const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent > 70 && !hasShown) {
        setShowPopup(true);
        setHasShown(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('scroll', handleScroll);

    return () => {
      clearTimeout(timedTimer);
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [hasShown]);

  const closePopup = () => {
    setShowPopup(false);
  };

  return { showPopup, closePopup };
}