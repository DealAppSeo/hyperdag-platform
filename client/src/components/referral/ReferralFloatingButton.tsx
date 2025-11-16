import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, X, Gift, Users, Copy, Twitter, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

export function ReferralFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [referralUrl] = useState('https://hyperdag.org/ref/abc123'); // This would come from user data
  const { toast } = useToast();

  const copyReferralLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      toast({
        title: "Link copied! 🎉",
        description: "Share it to earn $50 per referral"
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive"
      });
    }
  };

  const shareOnTwitter = () => {
    const text = `I'm saving 79% on AI costs with HyperDAG! Join me and get $2,400 in free credits: ${referralUrl}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    const text = `I've been using HyperDAG to cut my AI development costs by 79%. They're offering $2,400 in free credits for new users. Check it out: ${referralUrl}`;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="mb-4 bg-white border border-gray-200 rounded-2xl shadow-lg p-6 max-w-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Earn $50 per referral!</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Share HyperDAG with friends and earn $50 for each signup. They get $2,400 in free credits too!
            </p>
            
            <div className="space-y-2">
              <Button onClick={copyReferralLink} className="w-full" variant="outline">
                <Copy className="w-4 h-4 mr-2" />
                Copy Referral Link
              </Button>
              
              <div className="grid grid-cols-2 gap-2">
                <Button onClick={shareOnTwitter} size="sm" className="bg-blue-500 hover:bg-blue-600">
                  <Twitter className="w-4 h-4 mr-1" />
                  Twitter
                </Button>
                <Button onClick={shareOnLinkedIn} size="sm" className="bg-blue-700 hover:bg-blue-800">
                  <Linkedin className="w-4 h-4 mr-1" />
                  LinkedIn
                </Button>
              </div>
            </div>
            
            <div className="mt-4 text-center">
              <div className="text-xs text-gray-500">
                Already earned: <span className="font-semibold text-green-600">$247</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="bg-gradient-to-r from-purple-500 to-blue-600 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center relative"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Gift className="w-6 h-6" />}
        
        {/* Notification badge */}
        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
          $
        </div>
        
        {/* Animated rings */}
        <div className="absolute inset-0 rounded-full border-2 border-purple-300 animate-ping opacity-20"></div>
        <div className="absolute inset-0 rounded-full border-2 border-purple-300 animate-ping opacity-30" style={{ animationDelay: '0.5s' }}></div>
      </motion.button>
    </div>
  );
}