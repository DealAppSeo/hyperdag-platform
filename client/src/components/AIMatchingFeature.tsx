import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, Users, Target, ArrowRight, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import AIMatchingPromo from './AIMatchingPromo';

interface SynergyMatch {
  id: string;
  title: string;
  type: 'grant-hackathon' | 'hackathon-team' | 'grant-team';
  matchScore: number;
  description: string;
  benefits: string[];
  tags: string[];
}

interface AIMatchingFeatureProps {
  context: 'grants' | 'hackathons' | 'teams';
}

export default function AIMatchingFeature({ context }: AIMatchingFeatureProps) {
  const { user } = useAuth();
  const [showPromo, setShowPromo] = useState(false);

  // Sample synergy matches based on context
  const getSynergyMatches = (): SynergyMatch[] => {
    if (context === 'grants') {
      return [
        {
          id: '1',
          title: 'Climate Tech Grant → Green Energy Hackathon → Environmental Engineers',
          type: 'grant-hackathon',
          matchScore: 95,
          description: 'DOE Clean Energy Grant connects perfectly with MIT Climate Hackathon, plus 3 environmental engineers seeking climate projects',
          benefits: ['$50K+ funding potential', 'Technical validation', 'Expert team formation'],
          tags: ['Climate', 'Energy', 'Innovation']
        },
        {
          id: '2',
          title: 'Healthcare AI Grant → Medical Data Challenge → Healthcare Professionals',
          type: 'grant-team',
          matchScore: 88,
          description: 'NIH AI/ML grant opportunity matches with Stanford Medicine hackathon and practicing physicians interested in AI applications',
          benefits: ['Research credibility', 'Clinical validation', 'Regulatory guidance'],
          tags: ['Healthcare', 'AI/ML', 'Data Science']
        }
      ];
    } else if (context === 'hackathons') {
      return [
        {
          id: '3',
          title: 'Fintech Prototype → Banking Innovation Grants → Compliance Experts',
          type: 'hackathon-team',
          matchScore: 92,
          description: 'Your fintech hackathon project qualifies for JPMorgan Innovation grants and connects with regulatory compliance specialists',
          benefits: ['Regulatory compliance', 'Industry connections', 'Scaling resources'],
          tags: ['Fintech', 'Banking', 'Compliance']
        },
        {
          id: '4',
          title: 'EdTech App → Education Foundation Grants → Curriculum Designers',
          type: 'grant-team',
          matchScore: 85,
          description: 'Education hackathon winner eligible for Gates Foundation funding with curriculum development team members',
          benefits: ['Educational impact', 'Professional validation', 'Distribution channels'],
          tags: ['Education', 'Impact', 'Technology']
        }
      ];
    } else {
      return [
        {
          id: '5',
          title: 'Cross-Platform Team: Grant Writers + Hackathon Winners + Domain Experts',
          type: 'grant-hackathon',
          matchScore: 97,
          description: 'AI-matched team combining successful grant recipients, hackathon champions, and subject matter experts for maximum impact',
          benefits: ['Proven track record', 'Diverse skill sets', 'Multiple funding sources'],
          tags: ['Team Building', 'Success Rate', 'Synergy']
        },
        {
          id: '6',
          title: 'Social Impact Collective: Nonprofits + Tech Teams + Researchers',
          type: 'hackathon-team',
          matchScore: 91,
          description: 'Cross-functional teams bridging academic research, nonprofit experience, and technical implementation for social good',
          benefits: ['Real-world impact', 'Academic credibility', 'Sustainability focus'],
          tags: ['Social Impact', 'Research', 'Sustainability']
        }
      ];
    }
  };

  const handleViewMatches = () => {
    if (!user) {
      setShowPromo(true);
    } else {
      // Check if user has verified email or phone for advanced features
      const hasVerification = (user as any)?.emailVerified || (user as any)?.phoneVerified || user.telegramVerified;
      if (!hasVerification) {
        setShowPromo(true); // Show promo to encourage verification
      } else {
        // Navigate to AI matching dashboard for verified users
        console.log('Navigate to AI matching dashboard');
      }
    }
  };

  const matches = getSynergyMatches();

  return (
    <>
      <Card className="bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-indigo-900/20 border-purple-500/30 mb-8">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg mr-3">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white flex items-center">
                  AI Cross-Platform Synergy Engine
                  <Sparkles className="h-4 w-4 ml-2 text-yellow-400" />
                </h3>
                <p className="text-gray-300 text-sm">
                  Discover opportunities that multiply your impact across grants, hackathons, and teams
                </p>
              </div>
            </div>
            {!user && (
              <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold">
                Early Adopter Special
              </Badge>
            )}
          </div>

          <div className="space-y-4 mb-6">
            {matches.map((match) => (
              <Card key={match.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <h4 className="font-semibold text-white text-sm">{match.title}</h4>
                        <div className="ml-auto flex items-center">
                          <Target className="h-4 w-4 text-green-400 mr-1" />
                          <span className="text-green-400 font-bold text-sm">{match.matchScore}% match</span>
                        </div>
                      </div>
                      <p className="text-gray-300 text-xs mb-3">{match.description}</p>
                      
                      <div className="grid md:grid-cols-3 gap-2 mb-3">
                        {match.benefits.map((benefit, index) => (
                          <div key={index} className="flex items-center text-xs text-gray-300">
                            <Zap className="h-3 w-3 text-blue-400 mr-1 flex-shrink-0" />
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {match.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs bg-purple-900/30 text-purple-300">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button 
              onClick={handleViewMatches}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
              size="lg"
            >
              {user ? (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  View All AI Matches
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Unlock AI Matching (Free for Early Adopters)
                </>
              )}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>

            {!user && (
              <p className="text-xs text-gray-400 mt-3">
                Register today with just an alias & password to claim lifetime access to AI matching
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {showPromo && (
        <AIMatchingPromo 
          onClose={() => setShowPromo(false)} 
          trigger={context}
        />
      )}
    </>
  );
}