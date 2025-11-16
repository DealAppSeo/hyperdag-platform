import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Brain, Zap, Users, Target, Clock, Gift } from 'lucide-react';
import { Link } from 'wouter';

interface AIMatchingPromoProps {
  onClose: () => void;
  trigger: 'grants' | 'hackathons' | 'teams';
}

export default function AIMatchingPromo({ onClose, trigger }: AIMatchingPromoProps) {
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 86400000); // Update daily

    return () => clearInterval(timer);
  }, []);

  const getFeatureDescription = () => {
    switch (trigger) {
      case 'grants':
        return {
          title: 'AI Grant-to-Hackathon Synergy Matching (Verification Required)',
          description: 'Our AI analyzes your grant interests and finds hackathons where you can prototype funded projects. Email or phone verification unlocks ranked grants and auto RFI matching.',
          examples: [
            'Climate grants → Clean energy hackathons → Environmental scientists',
            'AI research grants → ML competitions → Data science teams',
            'Social impact grants → Nonprofit hackathons → Community organizers'
          ]
        };
      case 'hackathons':
        return {
          title: 'AI Hackathon-to-Grant Opportunity Engine (Verify to Access)',
          description: 'Turn your hackathon ideas into funded projects. Email or phone verification unlocks AI matching with relevant grants and funding-experienced teammates.',
          examples: [
            'Fintech hackathon project → Banking innovation grants → Compliance experts',
            'Healthcare app → NIH SBIR grants → Medical advisory team',
            'EdTech prototype → Education foundation grants → Curriculum specialists'
          ]
        };
      case 'teams':
        return {
          title: 'AI Cross-Platform Team Optimization (Premium Access)',
          description: 'Our AI identifies team members who maximize your success across platforms. Email or phone verification unlocks full matching capabilities.',
          examples: [
            'Find co-founders with both grant writing AND hackathon winning experience',
            'Match with teams working on similar causes across multiple funding sources',
            'Connect with mentors who bridge academic research and startup acceleration'
          ]
        };
    }
  };

  const feature = getFeatureDescription();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 border-purple-500/30 text-white animate-in slide-in-from-bottom-4">
        <CardContent className="p-8 relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full">
                <Brain className="h-8 w-8" />
              </div>
            </div>
            
            <Badge className="mb-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold">
              <Gift className="h-3 w-3 mr-1" />
              Early Adopter Exclusive
            </Badge>
            
            <h2 className="text-2xl font-bold mb-2">{feature.title}</h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              {feature.description}
            </p>
          </div>

          <div className="space-y-4 mb-6">
            <h3 className="font-semibold text-purple-300 flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              AI-Powered Cross-Platform Synergies:
            </h3>
            <div className="space-y-2">
              {feature.examples.map((example, index) => (
                <div key={index} className="flex items-start text-sm text-gray-300 bg-white/5 p-3 rounded-lg">
                  <Target className="h-4 w-4 mr-2 mt-0.5 text-blue-400 flex-shrink-0" />
                  <span>{example}</span>
                </div>
              ))}
            </div>
          </div>

          <Card className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-500/30 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-yellow-400 mb-1">Limited Time Offer</h4>
                  <p className="text-sm text-gray-300">
                    This will soon be a premium feature, but early adopters get lifetime access!
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-yellow-400 flex items-center">
                    <Clock className="h-5 w-5 mr-1" />
                    {timeLeft}
                  </div>
                  <div className="text-xs text-gray-400">days left</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <h4 className="font-semibold text-center">Unlock AI Matching in 2 Simple Steps:</h4>
            
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-white/10 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-400 mb-2">1</div>
                <div className="text-sm">
                  <strong>Register Today</strong><br />
                  Just an alias username & password!
                </div>
              </div>
              
              <div className="bg-white/10 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-400 mb-2">2</div>
                <div className="text-sm">
                  <strong>Verify Email/Phone</strong><br />
                  Unlock ranked grants & auto RFI matching
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button 
                size="lg" 
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Link href="/register" className="flex items-center justify-center w-full">
                  <Users className="h-4 w-4 mr-2" />
                  Claim Early Access
                </Link>
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                onClick={onClose}
                className="border-gray-500 text-gray-300 hover:bg-white/10"
              >
                Maybe Later
              </Button>
            </div>

            <p className="text-xs text-gray-400 text-center mt-4">
              No credit card required • Cancel anytime • Your data stays private with ZKP technology
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}